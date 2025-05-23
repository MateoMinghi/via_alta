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

// Helper type for tracking course allocations
type CourseAllocation = {
    groupId: number;
    subjectId: number;
    requiredBlocks: number;
    assignedBlocks: number;
    lastAssignedDay?: string;
};

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
    
    // Group by teacher and prepare course allocations
    const groupsByProfessor = new Map<string, CourseAllocation[]>();
    groups.forEach(group => {
        const subject = subjectsMap.get(group.idmateria);
        if (!subject) return;

        if (!groupsByProfessor.has(group.idprofesor)) {
            groupsByProfessor.set(group.idprofesor, []);
        }
        groupsByProfessor.get(group.idprofesor)?.push({
            groupId: group.idgrupo,
            subjectId: group.idmateria,
            requiredBlocks: Math.ceil(subject.HorasClase),
            assignedBlocks: 0
        });
    });

    // 4. Schedule Generation
    console.log("Assigning groups to schedule slots...");
    for (const professorId of professorIds) {
        const professorCourses = groupsByProfessor.get(professorId) || [];
        const professorAvail = availabilityMap.get(professorId);
        
        if (!professorCourses.length || !professorAvail) {
            console.warn(`Skipping professor ${professorId}: No courses or no availability.`);
            continue;
        }

        console.log(`Processing professor ${professorId} with ${professorCourses.length} courses`);

        // Iterate through days first to ensure even distribution
        for (const day of daysOfWeek) {
            const dayAvailability = professorAvail.get(day) || [];
            
            for (const availSlot of dayAvailability) {
                // Process each hour in the availability slot
                for (let hour = availSlot.start; hour < availSlot.end; hour++) {
                    if (hour < 7 || hour >= 16) continue;

                    // Get unfinished courses that weren't last assigned on this day
                    const eligibleCourses = professorCourses.filter(course => 
                        course.assignedBlocks < course.requiredBlocks &&
                        course.lastAssignedDay !== day
                    );
                    
                    if (eligibleCourses.length === 0) continue;

                    const gridKey = `${day}-${hour}`;
                    const assignments = scheduleGrid.get(gridKey) || [];

                    // Try to assign the course with the least assigned blocks
                    const courseToAssign = eligibleCourses.reduce((a, b) => 
                        (a.assignedBlocks / a.requiredBlocks) < (b.assignedBlocks / b.requiredBlocks) ? a : b
                    );

                    const group = groups.find(g => g.idgrupo === courseToAssign.groupId);
                    if (!group) continue;

                    // Check for scheduling conflicts
                    const professorConflict = assignments.some(a => a.professorId === professorId);
                    const semesterConflict = assignments.some(a => a.semester === group.Semestre);

                    if (!professorConflict && !semesterConflict) {
                        // Make the assignment
                        assignments.push({
                            professorId,
                            semester: group.Semestre,
                            subjectId: courseToAssign.subjectId
                        });
                        scheduleGrid.set(gridKey, assignments);
                        
                        // Update course tracking
                        courseToAssign.assignedBlocks++;
                        courseToAssign.lastAssignedDay = day;

                        // Create schedule item
                        const subject = subjectsMap.get(courseToAssign.subjectId);
                        if (!subject) continue;

                        const scheduleItem: GeneralScheduleItem = {
                            IdHorarioGeneral: targetCycleId,
                            NombreCarrera: subject.Carrera || 'General',
                            IdGrupo: courseToAssign.groupId,
                            Dia: day as GeneralScheduleItem['Dia'],
                            HoraInicio: formatTime(hour),
                            HoraFin: formatTime(hour + 1)
                        };
                        scheduleItems.push(scheduleItem);
                        console.log(`Assigned Group ${courseToAssign.groupId} to ${day} ${hour}:00-${hour + 1}:00 ` +
                                  `(Block ${courseToAssign.assignedBlocks}/${courseToAssign.requiredBlocks})`);
                    }
                }
            }
        }

        // Log any unfinished courses
        for (const course of professorCourses) {
            if (course.assignedBlocks < course.requiredBlocks) {
                console.warn(`Could not fully schedule Group ${course.groupId}. ` +
                           `Assigned ${course.assignedBlocks}/${course.requiredBlocks} blocks.`);
            }
        }
    }

    // 5. Save Schedule
    if (scheduleItems.length > 0) {
        console.log(`Saving ${scheduleItems.length} schedule items to the database...`);
        await GeneralSchedule.saveGeneralSchedule(scheduleItems);
        console.log("General schedule saved successfully.");
    } else {
        console.log("No schedule items generated to save.");
        await GeneralSchedule.saveGeneralSchedule([]);
        console.log("Cleared any existing schedule for this cycle.");
    }

    // Clean up
    if (fs.existsSync(GENERATION_FLAG_PATH)) {
        fs.unlinkSync(GENERATION_FLAG_PATH);
        console.log("Removed schedule generation flag file");
    }

    return true;

  } catch (error) {
    console.error("Error generating general schedule:", error);
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

//me la pelo el algoritmo