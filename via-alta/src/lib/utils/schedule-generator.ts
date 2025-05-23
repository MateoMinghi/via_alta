import pool from "../../config/database";
import Subject from "../models/subject";
import Availability from "../models/availability";
import GeneralSchedule, { GeneralScheduleItem } from "../models/general-schedule";
import Cycle from "../models/cycle"; 
import { getGroups, generateGroupsForAllProfessors } from "./group-generator"; 
import fs from 'fs';
import path from 'path';

// Flag file path to track generation status
const GENERATION_FLAG_PATH = path.join(process.cwd(), 'schedule-generation-in-progress');

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
  subjectId?: number; // Added to track which subject is being taught
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
    // Create a flag file to indicate processing is in progress
    fs.writeFileSync(GENERATION_FLAG_PATH, new Date().toISOString());
    console.log("Created schedule generation flag file");
    
    // 1. Determine Cycle ID
    const targetCycleId = idCiclo ?? await getLatestCycleId();
    if (!targetCycleId) {
      console.error("No cycle found. Cannot generate schedule.");
      return false;
    }
    console.log(`Generating schedule for Cycle ID: ${targetCycleId}`);

    // 1.1 Delete existing general schedule for this cycle
    console.log("Clearing existing general schedule for this cycle...");
    await GeneralSchedule.deleteForCycle(targetCycleId);
    console.log("Existing general schedule cleared.");

    // 1.2 Delete all groups and generate new ones
    console.log("Deleting all groups and generating new groups for all professors...");
    await generateGroupsForAllProfessors(null as any, targetCycleId);
    console.log("Groups regenerated.");

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
    // Track all assignments per slot to ensure there's no room or semester conflict
    const scheduleGrid = new Map<string, ScheduleSlot[]>(); // Key: "Day-Hour", Value: list of { professorId, semester, subjectId }
    const assignedHours = new Map<number, number>(); // Key: GroupId, Value: Hours assigned
    const scheduleItems: GeneralScheduleItem[] = [];
    const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const scheduleHours = Array.from({ length: (16 - 7) }, (_, i) => 7 + i); // 7 AM to 3 PM (inclusive start hour)
    
    // Group by teacher for easy access
    const groupsByProfessor = new Map<string, any[]>();
    groups.forEach(group => {
        if (!groupsByProfessor.has(group.idprofesor)) {
            groupsByProfessor.set(group.idprofesor, []);
        }
        groupsByProfessor.get(group.idprofesor)?.push(group);
    });

    // 4. Iterate through professors and assign their groups
    console.log("Assigning groups to schedule slots...");
    for (const professorId of professorIds) {
        const professorGroups = groupsByProfessor.get(professorId) || [];
        const professorAvail = availabilityMap.get(professorId);
        
        if (!professorGroups.length) {
            console.warn(`No groups found for professor ${professorId}. Skipping.`);
            continue;
        }
        
        if (!professorAvail) {
            console.warn(`No availability found for professor ${professorId}. Skipping.`);
            continue;
        }
        
        console.log(`Processing professor ${professorId} with ${professorGroups.length} groups`);
        
        // For each group this professor teaches
        for (let i = 0; i < professorGroups.length; i++) {
            const group = professorGroups[i];
            const subject = subjectsMap.get(group.idmateria);
            
            if (!subject) {
                console.warn(`Subject with ID ${group.idmateria} not found for Group ${group.idgrupo}. Skipping.`);
                continue;
            }
            
            // Use Math.ceil to ensure enough blocks are scheduled for decimal hours
            const requiredBlocks = Math.ceil(subject.HorasClase);
            let currentAssignedBlocks = assignedHours.get(group.idgrupo) || 0;
            
            console.log(`Processing Group ${group.idgrupo} (Subject: ${subject.Nombre}, Prof: ${group.professor_name}, Required Blocks: ${requiredBlocks})`);
            
            // Rotate weekdays to distribute classes evenly
            const dayOffset = i % daysOfWeek.length;
            const rotatedDays = [
                ...daysOfWeek.slice(dayOffset),
                ...daysOfWeek.slice(0, dayOffset),
            ];
            
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
                        
                        // Check for conflicts:
                        // 1. Same professor teaching another subject at the same time
                        // 2. Same semester having another class at the same time
                        const professorConflict = assignments.some(a => a.professorId === professorId);
                        const semesterConflict = assignments.some(a => a.semester === group.Semestre);
                        
                        // If no conflict, assign the group
                        if (!professorConflict && !semesterConflict) {
                          // Record this assignment alongside any existing ones
                          assignments.push({ 
                              professorId, 
                              semester: group.Semestre,
                              subjectId: group.idmateria
                          });
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
        } // End group loop for this professor
    } // End professor loop

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

    // At the end, after successful generation:
    if (fs.existsSync(GENERATION_FLAG_PATH)) {
      fs.unlinkSync(GENERATION_FLAG_PATH);
      console.log("Removed schedule generation flag file");
    }

    return true;

  } catch (error) {
    console.error("Error generating general schedule:", error);
    
    // Clean up the flag file even if there's an error
    if (fs.existsSync(GENERATION_FLAG_PATH)) {
      try {
        fs.unlinkSync(GENERATION_FLAG_PATH);
        console.log("Removed schedule generation flag file after error");
      } catch (e) {
        console.error("Failed to remove flag file:", e);
      }
    }
    
    return false;
  }
}

/**
 * Checks if a schedule generation process is currently running
 * @returns boolean True if schedule generation is in progress
 */
export function isScheduleGenerationInProgress(): boolean {
  return fs.existsSync(GENERATION_FLAG_PATH);
}