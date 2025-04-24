import pool from "../../config/database";
import Subject from "../models/subject";
import Availability from "../models/availability";
import GeneralSchedule, { GeneralScheduleItem } from "../models/general-schedule";
import Cycle from "../models/cycle"; 
import { getGroups } from "./group-generator"; 
// Helper function to get the latest cycle ID
async function getLatestCycleId(): Promise<number | null> {
  const query = `SELECT IdCiclo FROM Ciclo ORDER BY FechaInicio DESC LIMIT 1`;
  const result = await pool.query(query);
  return result.rows[0]?.idciclo || null;
}

// Helper function to format hour number to HH:MM:SS
function formatTime(hour: number): string {
  const h = hour.toString().padStart(2, '0');
  return `${h}:00:00`;
}

// Helper function to parse HH:MM:SS time string to hour number
function parseTime(timeString: string): number {
  return parseInt(timeString.split(':')[0], 10);
}

// Type for the schedule grid slot
type ScheduleSlot = {
  professorId?: string;
  semester?: number;
};

// Type for the availability map
type AvailabilityMap = Map<string, ReturnType<typeof processAvailability>>;

// Process raw availability data for easier lookup
function processAvailability(availabilityData: Awaited<ReturnType<typeof Availability.findByProfessor>>) {
    const map = new Map<string, { start: number; end: number }[]>(); // Map<Day, {start, end}[]>
    const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

    daysOfWeek.forEach(day => map.set(day, []));

    availabilityData.forEach(avail => {
        if (map.has(avail.Dia)) {
            map.get(avail.Dia)?.push({
                start: parseTime(avail.HoraInicio),
                end: parseTime(avail.HoraFin),
            });
        }
    });

    // Sort intervals for each day
    daysOfWeek.forEach(day => {
        map.get(day)?.sort((a, b) => a.start - b.start);
    });

    return map;
}

// Helper to normalize group object keys
function normalizeGroup(group: any) {
  return {
    IdGrupo: group.IdGrupo ?? group.idgrupo,
    IdMateria: group.IdMateria ?? group.idmateria,
    IdProfesor: group.IdProfesor ?? group.idprofesor,
    IdSalon: group.IdSalon ?? group.idsalon,
    IdCiclo: group.IdCiclo ?? group.idciclo,
    Semestre: group.Semestre ?? group.semestre,
    // Preserve any extra fields
    ...group,
  };
}

/**
 * Generates the general schedule based on existing groups, professor availability, and subject requirements.
 * @param idCiclo Optional: The specific cycle ID to generate the schedule for. If not provided, the latest cycle is used.
 * @returns Promise<boolean> True if the schedule was generated and saved successfully, false otherwise.
 */
export async function generateGeneralSchedule(idCiclo?: number): Promise<boolean> {
  console.log("Starting general schedule generation...");

  try {
    // 1. Determine Cycle ID
    const targetCycleId = idCiclo ?? await getLatestCycleId();
    if (!targetCycleId) {
      console.error("No cycle found. Cannot generate schedule.");
      return false;
    }
    console.log(`Generating schedule for Cycle ID: ${targetCycleId}`);

    // 2. Fetch Data
    console.log("Fetching groups...");
    // Use the existing getGroups function which joins necessary details
    const groupsRaw = await getGroups({ idCiclo: targetCycleId });
    const groups = groupsRaw.map(normalizeGroup);
    console.log("Sample group object:", groups[0]);
    if (!groups || groups.length === 0) {
      console.log("No groups found for this cycle. Schedule generation skipped.");
      return true; // Not an error, just nothing to schedule
    }
    console.log(`Found ${groups.length} groups.`);

    console.log("Fetching subjects...");
    const subjects = await Subject.findAll();
    const subjectsMap = new Map(subjects.map(s => [s.IdMateria, s]));
    console.log(`Found ${subjectsMap.size} subjects.`);

    console.log("Fetching professor availability...");
    const professorIds = [...new Set(groups.map(g => g.IdProfesor))];
    const availabilityMap: AvailabilityMap = new Map();
    for (const profId of professorIds) {
        if (typeof profId !== 'string') {
            console.warn(`Professor ID is not a string:`, profId);
            continue;
        }
        // Normalize the professor ID (trim and uppercase)
        const normalizedProfId = profId.trim().toUpperCase();
        const avail = await Availability.findByProfessor(normalizedProfId);
        availabilityMap.set(profId, processAvailability(avail));
    }
    console.log(`Fetched availability for ${availabilityMap.size} professors.`);


    // 3. Initialize Schedule Grid & Tracking
    // Track all assignments per slot to enforce unique semester and professor per timeslot
    const scheduleGrid = new Map<string, ScheduleSlot[]>(); // Key: "Day-Hour", Value: list of { professorId, semester }
    const assignedHours = new Map<number, number>(); // Key: GroupId, Value: Hours assigned
    const scheduleItems: GeneralScheduleItem[] = [];
    const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const scheduleHours = Array.from({ length: (16 - 7) }, (_, i) => 7 + i); // 7 AM to 3 PM (inclusive start hour)

    // 4. Iterate and Assign Groups
    console.log("Assigning groups to schedule slots...");
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const subject = subjectsMap.get(group.idmateria);
      const professorAvail = availabilityMap.get(group.idprofesor);

      if (!subject) {
        console.warn(`Subject with ID ${group.idmateria} not found for Group ${group.idgrupo}. Skipping.`);
        continue;
      }
      if (!professorAvail) {
        console.warn(`Availability not found for Professor ${group.idprofesor} of Group ${group.idgrupo}. Skipping.`);
        continue;
      }

      // Use Math.ceil to ensure enough blocks are scheduled for decimal hours
      const requiredBlocks = Math.ceil(subject.HorasClase);
      let currentAssignedBlocks = assignedHours.get(group.idgrupo) || 0;

      // Rotate weekdays per group to spread evenly across the week
      const dayOffset = i % daysOfWeek.length;
      const rotatedDays = [
        ...daysOfWeek.slice(dayOffset),
        ...daysOfWeek.slice(0, dayOffset),
      ];

      console.log(`Processing Group ${group.idgrupo} (Subject: ${subject.Nombre}, Prof: ${group.professor_name}, Required Blocks: ${requiredBlocks})`);

      // Iterate through rotated days and professor's available slots for that day
      daysLoop:
      for (const day of rotatedDays) {
        const dayAvailability = professorAvail.get(day) || [];

        for (const availSlot of dayAvailability) {
          // Iterate through each hour within the professor's available block
          for (let hour = availSlot.start; hour < availSlot.end; hour++) {
            if (currentAssignedBlocks >= requiredBlocks) {
              console.log(`Group ${group.idgrupo} fully scheduled.`);
              break daysLoop; // Move to the next group
            }

            // Check if the hour is within the general schedule time frame (7 AM - 4 PM)
            if (hour < 7 || hour >= 16) {
                continue; // Skip hours outside the allowed range
            }

            const gridKey = `${day}-${hour}`;
            // Gather existing assignments for this slot
            const assignments = scheduleGrid.get(gridKey) || [];
            // Conflict if same professor or same semester already scheduled in this slot
            const conflict = assignments.some(a => a.professorId === group.idprofesor || a.semester === group.Semestre);

            // If no conflict, assign the group
            if (!conflict) {
              // Record this assignment alongside any existing ones
              assignments.push({ professorId: group.idprofesor, semester: group.Semestre });
              scheduleGrid.set(gridKey, assignments);
              currentAssignedBlocks++;
              assignedHours.set(group.idgrupo, currentAssignedBlocks);

              const scheduleItem: GeneralScheduleItem = {
                IdHorarioGeneral: targetCycleId, // Use Cycle ID as the Schedule ID
                NombreCarrera: subject.Carrera || 'General', // Use subject's career or default
                IdGrupo: group.idgrupo,
                Dia: day as GeneralScheduleItem['Dia'], // Cast to the specific type
                HoraInicio: formatTime(hour),
                HoraFin: formatTime(hour + 1), // Assuming 1-hour blocks
              };
              scheduleItems.push(scheduleItem);
              console.log(`  Assigned Group ${group.idgrupo} to ${day} ${hour}:00-${hour + 1}:00 (Block ${currentAssignedBlocks}/${requiredBlocks})`);

              // Re-check if fully scheduled after assignment
              if (currentAssignedBlocks >= requiredBlocks) {
                 console.log(`Group ${group.idgrupo} fully scheduled.`);
                 break daysLoop;
              }
            }
          } // End hour loop
        } // End availability slot loop
      } // End day loop

      if (currentAssignedBlocks < requiredBlocks) {
        console.warn(`Could not fully schedule Group ${group.idgrupo}. Assigned ${currentAssignedBlocks}/${requiredBlocks} blocks.`);
      }
    } // End group loop

    // 5. Save Schedule
    if (scheduleItems.length > 0) {
      console.log(`Saving ${scheduleItems.length} schedule items to the database...`);
      await GeneralSchedule.saveGeneralSchedule(scheduleItems);
      console.log("General schedule saved successfully.");
    } else {
      console.log("No schedule items generated to save.");
       // Attempt to clear any old schedule for this cycle ID if nothing new was generated
       await GeneralSchedule.saveGeneralSchedule([]); // Pass empty array to clear
       console.log("Cleared any existing schedule for this cycle as no new items were generated.");
    }

    return true;

  } catch (error) {
    console.error("Error generating general schedule:", error);
    return false;
  }
}