import { generateGroupsForAllProfessors } from '../utils/group-generator';
import GeneralSchedule, { GeneralScheduleItem } from '../models/general-schedule'; // Import GeneralScheduleItem
import Availability from '../models/availability';
import Subject from '../models/subject';

interface TimeSlot {
    day: string;
    startTime: string;
    endTime: string;
    assigned: boolean;
}

interface DaySchedule {
    day: string;
    slots: TimeSlot[];
}

// Use GeneralScheduleItem directly or create a compatible interface
// interface ScheduleItem { // This interface is no longer needed if using GeneralScheduleItem directly
//     IdHorarioGeneral: number;
//     NombreCarrera: string;
//     IdGrupo: number;
//     Dia: string;
//     HoraInicio: string;
//     HoraFin: string;
// }

// Main function to generate schedule.
// Note: Now we no longer rely on a hardcoded classroom.
export async function generateSchedule(cicloId?: number): Promise<void> {
  // 1. Generate Groups first
  // (Assumes each group already has its own IdSalon)
  // Use a type assertion so that undefined becomes acceptable.
  const groupResult = await generateGroupsForAllProfessors(undefined as unknown as number, cicloId);
  if (groupResult.errors && groupResult.errors.length > 0) {
      console.error("Group generation errors:", groupResult.errors);
      throw new Error("Failed to generate groups");
  }

  const groups = groupResult.createdGroups;

  // 2. Create a schedule grid: Monday to Friday from 07:00 to 16:00 in 30-minute slots
  const scheduleGrid = createScheduleGrid();

  // 3. Fetch professor availabilities and create a map [professorId -> availabilities]
  const professorAvailabilities = await fetchAllProfessorAvailabilities();

  // 4. Fetch existing schedule to avoid conflicts with already scheduled items (e.g., classroom conflicts)
  // Note: The existing schedule check for classroom conflict might need adjustment
  // if IdSalon is not part of GeneralScheduleItem. We might need to fetch group info separately.
  const existingSchedule = await GeneralSchedule.getGeneralSchedule();

  const newScheduleItems: GeneralScheduleItem[] = []; // Use GeneralScheduleItem type

  // 5. Iterate through each group
  for (const group of groups) {
      // Log the entire group object to inspect its properties
      console.log("Current group:", group);

      // Get the subject details to know how many hours per week are needed
      const subjectId = group.IdMateria;

      // Check if subjectId is undefined or null
      if (subjectId === undefined || subjectId === null) {
          console.warn(`Subject ID is undefined or null for group ${group.IdGrupo}. Skipping.`);
          continue; // Skip to the next group
      }

      // Ensure subjectId is a number
      const subjectIdNumber = Number(subjectId);
      if (isNaN(subjectIdNumber)) {
          console.warn(`Subject ID is not a number for group ${group.IdGrupo}. Skipping.`);
          continue; // Skip to the next group
      }

      const subject = await Subject.findById(subjectIdNumber);
      if (!subject) {
          console.warn(`Subject with Id ${subjectIdNumber} not found, skipping group ${group.IdGrupo}`);
          continue;
      }
      // Convert HorasClase (in hours) to number of 30-minute slots
      const requiredSlots = Math.ceil(subject.HorasClase * 2);
      let assignedSlots = 0;

      // Loop over each day in the grid
      for (const daySchedule of scheduleGrid) {
          if (assignedSlots >= requiredSlots) break;
          // Loop over time slots of the day
          for (const slot of daySchedule.slots) {
              if (assignedSlots >= requiredSlots) break;
              if (slot.assigned) continue;

              // Check professor availability for this slot
              const availabilities = professorAvailabilities[group.IdProfesor];
              if (!availabilities) continue;
              const isProfAvailable = availabilities.some(avail =>
                  avail.day === daySchedule.day &&
                  avail.startTime <= slot.startTime &&
                  avail.endTime >= slot.endTime
              );
              if (!isProfAvailable) continue;

              // Check classroom conflict using the group's own IdSalon
              // This check needs adjustment as IdSalon is not in HorarioGeneral
              // Option 1: Fetch Group details for each existingSchedule item (less efficient)
              // Option 2: Modify the check logic or database schema if classroom conflicts are critical here.
              // For now, commenting out the classroom check based on existingSchedule:
              /*
              const isClassroomOccupied = existingSchedule.some(item =>
                  // We need a way to link item.IdGrupo back to an IdSalon
                  // This requires fetching Group details based on item.IdGrupo
                  // Example (pseudo-code, needs implementation):
                  // const itemGroup = await Group.findById(item.IdGrupo);
                  // return itemGroup && itemGroup.IdSalon === group.IdSalon &&
                  item.Dia === daySchedule.day &&
                  item.HoraInicio === slot.startTime
              );
              if (isClassroomOccupied) continue;
              */

              // Mark the slot as used and add a new schedule item
              slot.assigned = true;
              assignedSlots++;
              newScheduleItems.push({
                  IdHorarioGeneral: generateUniqueId(),
                  NombreCarrera: subject.Carrera || 'Unknown', // Use Carrera from Subject, provide fallback
                  IdGrupo: group.IdGrupo,
                  Dia: daySchedule.day,
                  HoraInicio: slot.startTime,
                  HoraFin: slot.endTime,
                  // Removed fields: IdMateria, IdProfesor, IdCiclo, Semestre
              });
          }
      }

      if (assignedSlots < requiredSlots) {
          console.warn(`Group ${group.IdGrupo} scheduled only ${assignedSlots} out of ${requiredSlots} required slots.`);
      }
  }

  // 6. Save the new schedule into the database
  try {
      // Ensure the items passed match the expected type for saveGeneralSchedule
      await GeneralSchedule.saveGeneralSchedule(newScheduleItems);
      console.log("Schedule generated and saved successfully.");
  } catch (error) {
      console.error("Error saving the schedule:", error);
      throw error;
  }
}

// ...existing code...

// Helper: Fetch and map professor availabilities
async function fetchAllProfessorAvailabilities(): Promise<{[professorId: string]: {day: string, startTime: string, endTime: string}[]}> {
    const availabilities = await Availability.getAllAvailability();
    const professorAvailMap: { [professorId: string]: { day: string, startTime: string, endTime: string }[] } = {};
    availabilities.forEach(avail => {
        const professorIdStr = String(avail.IdProfesor); // Ensure professor ID is string for map key
        if (!professorAvailMap[professorIdStr]) {
            professorAvailMap[professorIdStr] = [];
        }
        professorAvailMap[professorIdStr].push({
            day: avail.Dia,
            startTime: avail.HoraInicio,
            endTime: avail.HoraFin
        });
    });
    return professorAvailMap;
}

// Helper: Create a schedule grid from 07:00 to 16:00 in 30-minute slots (Monday to Friday)
function createScheduleGrid(): DaySchedule[] {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const startTime = "07:00";
    const endTime = "16:00";
    const slotDuration = 30; // minutes

    return days.map(day => {
        const slots: TimeSlot[] = [];
        let currentTime = startTime;
        while (isBefore(currentTime, endTime)) {
            const nextTime = addMinutes(currentTime, slotDuration);
            // Ensure the end time does not exceed the overall end time
            const effectiveEndTime = isBefore(nextTime, endTime) ? nextTime : endTime;
            if (isBefore(currentTime, endTime)) { // Only add slot if start time is before end time
                 slots.push({ day, startTime: currentTime, endTime: effectiveEndTime, assigned: false });
            }
            currentTime = nextTime;
        }
        return { day, slots };
    });
}

// Helper: Checks if a time in "HH:MM" is before another time.
function isBefore(time1: string, time2: string): boolean {
    return time1 < time2;
}

// Helper: Adds a given number of minutes to a time string "HH:MM"
function addMinutes(time: string, minutes: number): string {
    let [hours, mins] = time.split(':').map(num => parseInt(num, 10));
    mins += minutes;
    hours += Math.floor(mins / 60);
    mins = mins % 60;
    // Handle potential overflow beyond 24:00 if needed, though schedule is within a day
    hours = hours % 24;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Helper: Generate a unique ID for schedule items
// Consider using a more robust method for production (e.g., sequence or UUID)
let currentId = Date.now(); // Simple starting point, might have collisions
function generateUniqueId(): number {
    // This simple incrementer is NOT collision-proof across restarts or concurrent runs.
    // Replace with a database sequence or UUID generation if true uniqueness is required.
    currentId++;
    return currentId % 1000000; // Keep it within a reasonable range for INTEGER type
}