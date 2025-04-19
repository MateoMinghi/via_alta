import { generateGroupsForAllProfessors } from '../utils/group-generator';
import GeneralSchedule from '../models/general-schedule';
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

interface ScheduleItem {
    IdHorarioGeneral: number;
    NombreCarrera: string;
    IdGrupo: number;
    Dia: string;
    HoraInicio: string;
    HoraFin: string;
    // Optionally, include other fields such as Salon
}

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
    const existingSchedule = await GeneralSchedule.getGeneralSchedule();

    const newScheduleItems: ScheduleItem[] = [];

    // 5. Iterate through each group
    for (const group of groups) {
        // Get the subject details to know how many hours per week are needed
        const subject = await Subject.findById(group.IdMateria);
        if (!subject) {
            console.warn(`Subject with Id ${group.IdMateria} not found, skipping group ${group.IdGrupo}`);
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
                const isClassroomOccupied = existingSchedule.some(item =>
                    (item as any).IdSalon === group.IdSalon &&
                    item.Dia === daySchedule.day &&
                    item.HoraInicio === slot.startTime
                );
                if (isClassroomOccupied) continue;

                // Mark the slot as used and add a new schedule item
                slot.assigned = true;
                assignedSlots++;
                newScheduleItems.push({
                    IdHorarioGeneral: generateUniqueId(),
                    NombreCarrera: "Example Carrera", // Replace with actual degree/career name as needed
                    IdGrupo: group.IdGrupo,
                    Dia: daySchedule.day,
                    HoraInicio: slot.startTime,
                    HoraFin: slot.endTime
                });
            }
        }

        if (assignedSlots < requiredSlots) {
            console.warn(`Group ${group.IdGrupo} scheduled only ${assignedSlots} out of ${requiredSlots} required slots.`);
        }
    }

    // 6. Save the new schedule into the database
    try {
        await GeneralSchedule.saveGeneralSchedule(newScheduleItems);
        console.log("Schedule generated and saved successfully.");
    } catch (error) {
        console.error("Error saving the schedule:", error);
        throw error;
    }
}

// Helper: Fetch and map professor availabilities
async function fetchAllProfessorAvailabilities(): Promise<{[professorId: string]: {day: string, startTime: string, endTime: string}[]}> {
    const availabilities = await Availability.getAllAvailability();
    const professorAvailMap: { [professorId: string]: { day: string, startTime: string, endTime: string }[] } = {};
    availabilities.forEach(avail => {
        if (!professorAvailMap[avail.IdProfesor]) {
            professorAvailMap[avail.IdProfesor] = [];
        }
        professorAvailMap[avail.IdProfesor].push({
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
            if (isBefore(nextTime, endTime) || nextTime === endTime) {
                slots.push({ day, startTime: currentTime, endTime: nextTime, assigned: false });
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
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Helper: Generate a unique ID for schedule items
function generateUniqueId(): number {
    return Math.floor(Math.random() * 1000000);
}