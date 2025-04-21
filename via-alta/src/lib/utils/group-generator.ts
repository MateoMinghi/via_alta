// Group Generator Utility
// This utility helps generate groups for academic subjects with proper semester mapping

import Group from '../models/group';
import Subject from '../models/subject';
import Professor from '../models/professor';
import Classroom from '../models/classroom';
import Cycle from '../models/cycle';
import pool from '../../config/database';
import { syncCoursesFromAPI } from './subject-handler';
import stringSimilarity from 'string-similarity';
// Interface for input parameters when generating a group
export interface GroupGenerationParams {
  idGrupo?: number; // Optional - if not provided, will be auto-generated
  idMateria?: number; // Optional - will be determined from professor's classes if not provided
  idProfesor: string; // Required - the professor who will teach the group
  idSalon: number; // Required - the classroom where the group will be held
  idCiclo?: number; // Optional - will use the latest cycle if not provided
}

// Interface for group validation errors
export interface GroupValidationError {
  field: string;
  message: string;
}

/**
 * Generates a new group based on the provided parameters.
 * Ensures that the group's semester matches the subject's semester.
 * 
 * @param params Parameters needed to generate a group
 * @returns The created group data
 * @throws Error if validation fails
 */
export async function generateGroup(params: GroupGenerationParams) {
  console.log("Starting generateGroup with params:", params);
  // Synchronize subjects before creating a group
  try {
    console.log("Running syncCoursesFromAPI...");
    await syncCoursesFromAPI();
    console.log("syncCoursesFromAPI completed.");
  } catch (syncError) {
    console.error("Error during syncCoursesFromAPI:", syncError);
    throw new Error(`Failed during course sync: ${syncError instanceof Error ? syncError.message : String(syncError)}`);
  }

  // Find the professor to get their classes
  console.log(`Finding professor with ID: ${params.idProfesor}`);
  const professor = await Professor.findById(params.idProfesor);
  if (!professor) {
    console.error(`Professor with ID ${params.idProfesor} not found`);
    throw new Error(`Professor with ID ${params.idProfesor} not found`);
  }
  console.log("Professor found:", professor);

  // Get the latest cycle if not provided
  let idCiclo = params.idCiclo;
  if (!idCiclo) {
    console.log("No cycle ID provided, fetching latest cycle...");
    const latestCycle = await getLatestCycle();
    if (!latestCycle) {
      console.error('No school cycles found in the database');
      throw new Error('No school cycles found in the database');
    }
    // Use the correct property name from the DB row (lowercase)
    idCiclo = parseInt(latestCycle.idciclo);
    console.log(`Using latest cycle ID: ${idCiclo}`);
  }
  // Find the subject based on professor's classes if not provided
  let idMateria = params.idMateria;
  if (!idMateria) {
    console.log(`No subject ID provided, determining from professor classes: ${professor.Clases}`);
    if (!professor.Clases || professor.Clases.trim() === '') {
      console.warn(`Professor with ID ${params.idProfesor} has empty assigned classes`); // Changed to warn
      throw new Error(`Professor with ID ${params.idProfesor} does not have any assigned classes`);
    }
    
    // Find a subject that matches the professor's classes
    const matchingSubject = await findSubjectByName(professor.Clases);
    if (!matchingSubject) {
      console.error(`No subject found matching professor's classes: ${professor.Clases}`);
      throw new Error(`No subject found matching professor's classes: ${professor.Clases}`);
    }
    idMateria = matchingSubject.idmateria; // <-- use lowercase
    console.log(`Determined subject ID: ${idMateria}`);
  }
  
  // At this point, idMateria must be defined
  if (!idMateria) {
    console.error('Failed to determine a valid subject ID after checks.');
    throw new Error('Failed to determine a valid subject ID');
  }

  // Update params with the determined values
  const updatedParams = {
    ...params,
    idMateria,
    idCiclo
  };
  console.log("Updated params for validation:", updatedParams);

  // Validate input parameters
  console.log("Validating group parameters...");
  const validationErrors = await validateGroupParams(updatedParams);
  if (validationErrors.length > 0) {
    console.error("Group validation failed:", validationErrors);
    throw new Error(`Group validation failed: ${JSON.stringify(validationErrors)}`);
  }
  console.log("Validation successful.");

  // At this point, both idMateria and idCiclo must be defined
  // Redundant check, but good for sanity
  if (!idMateria || !idCiclo) {
      console.error('Critical error: idMateria or idCiclo became undefined before fetching subject.');
      throw new Error('Critical error: idMateria or idCiclo became undefined.');
  }

  // Get the subject to extract its semester
  console.log(`Fetching subject details for ID: ${idMateria}`);
  const subject = await Subject.findById(idMateria);
  if (!subject) {
    console.error(`Subject with ID ${idMateria} not found after validation.`);
    throw new Error(`Subject with ID ${idMateria} not found`);
  }
  console.log("Subject found:", subject);

  // Generate a group ID if not provided
  const groupId = params.idGrupo || await generateUniqueGroupId();
  console.log(`Using Group ID: ${groupId}`);

  // Ensure subject.semestre is defined
  if (typeof subject.semestre !== 'number') {
    throw new Error(`Subject with ID ${idMateria} does not have a valid 'semestre' value.`);
  }

  // Create the group with the subject's semester
  const groupData = {
    IdGrupo: groupId,
    IdMateria: idMateria,
    IdProfesor: params.idProfesor,
    IdSalon: params.idSalon,
    IdCiclo: idCiclo,
    Semestre: subject.semestre // Use the subject's semester as required (lowercase)
  };
  console.log("Prepared group data for creation:", groupData);

  // Create the group in the database
  try {
    console.log("Attempting to create group in database...");
    const createdGroup = await Group.create(groupData);
    console.log("Group created successfully:", createdGroup);
    return createdGroup;
  } catch (creationError) {
    console.error("Error during Group.create:", creationError);
    throw new Error(`Failed to create group in database: ${creationError instanceof Error ? creationError.message : String(creationError)}`);
  }
}

/**
 * Generates a unique group ID that is not already in use
 * 
 * @returns A unique group ID
 */
async function generateUniqueGroupId(): Promise<number> {
  // Get the highest current group ID
  const query = 'SELECT MAX(IdGrupo) as maxId FROM Grupo';
  const result = await pool.query(query);
  const maxId = result.rows[0]?.maxid || 0;
  
  // Return the next available ID
  return maxId + 1;
}

/**
 * Validates the parameters for group generation
 * Checks if all required entities exist and are compatible
 * 
 * @param params Group generation parameters
 * @returns Array of validation errors (empty if valid)
 */
async function validateGroupParams(params: GroupGenerationParams): Promise<GroupValidationError[]> {
  const errors: GroupValidationError[] = [];

  // Check if the subject exists
  if (params.idMateria !== undefined) {
    const subject = await Subject.findById(params.idMateria);
    if (!subject) {
      errors.push({
        field: 'idMateria',
        message: `Subject with ID ${params.idMateria} not found`
      });
    }
  }

  // Check if the professor exists
  const professor = await Professor.findById(params.idProfesor);
  if (!professor) {
    errors.push({
      field: 'idProfesor',
      message: `Professor with ID ${params.idProfesor} not found`
    });
  }

  // Check if the classroom exists
  try {
    const classroom = await Classroom.findById(params.idSalon.toString());
    if (!classroom) {
      errors.push({
        field: 'idSalon',
        message: `Classroom with ID ${params.idSalon} not found`
      });
    }
  } catch (error) {
    errors.push({
      field: 'idSalon',
      message: `Error finding classroom: ${error instanceof Error ? error.message : String(error)}`
    });
  }
  // Check if the cycle exists
  if (params.idCiclo !== undefined) {
    try {
      const cycle = await Cycle.findById(params.idCiclo.toString());
      if (!cycle) {
        errors.push({
          field: 'idCiclo',
          message: `Cycle with ID ${params.idCiclo} not found`
        });
      }
    } catch (error) {
      errors.push({
        field: 'idCiclo',
        message: `Error finding cycle: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  // If a group ID is provided, check if it's already in use
  if (params.idGrupo !== undefined) {
    try {
      const existingGroup = await Group.findById(params.idGrupo);
      if (existingGroup) {
        errors.push({
          field: 'idGrupo',
          message: `A group with ID ${params.idGrupo} already exists`
        });
      }
    } catch (error) {
      // If there's an error but it's not because the group doesn't exist, add it to errors
      if (!(error instanceof Error && error.message.includes('not found'))) {
        errors.push({
          field: 'idGrupo',
          message: `Error validating group ID: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  }

  return errors;
}

/**
 * Gets all groups matching specific filters
 * 
 * @param filters Optional filters for querying groups
 * @returns Array of groups matching the filters
 */
export async function getGroups(filters?: {
  idMateria?: number;
  idProfesor?: string;
  idSalon?: number;
  idCiclo?: number;
  semestre?: number;
}) {
  // Build the WHERE clause based on provided filters
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (filters?.idMateria !== undefined) {
    conditions.push(`g.IdMateria = $${paramIndex++}`);
    values.push(filters.idMateria);
  }

  if (filters?.idProfesor !== undefined) {
    conditions.push(`g.IdProfesor = $${paramIndex++}`);
    values.push(filters.idProfesor);
  }

  if (filters?.idSalon !== undefined) {
    conditions.push(`g.IdSalon = $${paramIndex++}`);
    values.push(filters.idSalon);
  }

  if (filters?.idCiclo !== undefined) {
    conditions.push(`g.IdCiclo = $${paramIndex++}`);
    values.push(filters.idCiclo);
  }

  if (filters?.semestre !== undefined) {
    conditions.push(`g.Semestre = $${paramIndex++}`);
    values.push(filters.semestre);
  }

  // Construct the query with detailed information from related tables
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `
    SELECT 
      g.*,
      m.Nombre as subject_name,
      p.Nombre as professor_name,
      c.Nombre as cycle_name
    FROM 
      Grupo g
      JOIN Materia m ON g.IdMateria = m.IdMateria
      JOIN Profesor p ON g.IdProfesor = p.IdProfesor
      JOIN Ciclo c ON g.IdCiclo = c.IdCiclo
    ${whereClause}
    ORDER BY g.IdGrupo
  `;

  const result = await pool.query(query, values);
  return result.rows;
}

/**
 * Updates an existing group, ensuring that the semester still matches the subject's semester
 * 
 * @param idGrupo ID of the group to update
 * @param params New parameters for the group
 * @returns The updated group data
 * @throws Error if validation fails
 */
export async function updateGroup(idGrupo: number, params: Partial<GroupGenerationParams>) {
  // Get the current group to update only specified fields
  const currentGroup = await Group.findById(idGrupo);
  if (!currentGroup) {
    throw new Error(`Group with ID ${idGrupo} not found`);
  }

  // If the subject is being changed, get the new subject's semester
  let newSemester = currentGroup.Semestre;
  if (params.idMateria !== undefined && params.idMateria !== currentGroup.IdMateria) {
    const newSubject = await Subject.findById(params.idMateria);
    if (!newSubject) {
      throw new Error(`Subject with ID ${params.idMateria} not found`);
    }
    newSemester = newSubject.Semestre;
  }

  // Prepare the update data
  const updateData = {
    IdGrupo: idGrupo,
    IdMateria: params.idMateria ?? currentGroup.IdMateria,
    IdProfesor: params.idProfesor ?? currentGroup.IdProfesor,
    IdSalon: params.idSalon ?? currentGroup.IdSalon,
    IdCiclo: params.idCiclo ?? currentGroup.IdCiclo,
    Semestre: newSemester // Ensure semester matches the subject
  };

  // Validate the update data
  const validationErrors = await validateGroupUpdate(idGrupo, updateData);
  if (validationErrors.length > 0) {
    throw new Error(`Group update validation failed: ${JSON.stringify(validationErrors)}`);
  }

  // Update the group
  return await Group.update(idGrupo, updateData);
}

/**
 * Validates parameters for updating a group
 * 
 * @param idGrupo The ID of the group being updated
 * @param params The parameters for the update
 * @returns Array of validation errors (empty if valid)
 */
async function validateGroupUpdate(idGrupo: number, params: any): Promise<GroupValidationError[]> {
  const errors: GroupValidationError[] = [];

  // Similar validation as validateGroupParams but allows for partial updates
  const subject = await Subject.findById(params.IdMateria);
  if (!subject) {
    errors.push({
      field: 'idMateria',
      message: `Subject with ID ${params.IdMateria} not found`
    });
  }

  const professor = await Professor.findById(params.IdProfesor);
  if (!professor) {
    errors.push({
      field: 'idProfesor',
      message: `Professor with ID ${params.IdProfesor} not found`
    });
  }

  try {
    const classroom = await Classroom.findById(params.IdSalon.toString());
    if (!classroom) {
      errors.push({
        field: 'idSalon',
        message: `Classroom with ID ${params.IdSalon} not found`
      });
    }
  } catch (error) {
    errors.push({
      field: 'idSalon',
      message: `Error finding classroom: ${error instanceof Error ? error.message : String(error)}`
    });
  }

  try {
    const cycle = await Cycle.findById(params.IdCiclo.toString());
    if (!cycle) {
      errors.push({
        field: 'idCiclo',
        message: `Cycle with ID ${params.IdCiclo} not found`
      });
    }
  } catch (error) {
    errors.push({
      field: 'idCiclo',
      message: `Error finding cycle: ${error instanceof Error ? error.message : String(error)}`
    });
  }

  // Check that the semester matches the subject's semester
  if (subject && params.Semestre !== subject.Semestre) {
    errors.push({
      field: 'semestre',
      message: `Group semester (${params.Semestre}) does not match subject semester (${subject.Semestre})`
    });
  }

  return errors;
}

/**
 * Deletes a group by ID
 * 
 * @param idGrupo ID of the group to delete
 * @returns The deleted group data
 */
export async function deleteGroup(idGrupo: number) {
  return await Group.delete(idGrupo);
}

/**
 * Generates multiple groups in batch based on a list of parameters
 * 
 * @param paramsList List of group generation parameters
 * @returns Array of created groups
 */
export async function generateGroupsBatch(paramsList: GroupGenerationParams[]) {
  const createdGroups = [];
  const errors = [];

  for (const params of paramsList) {
    try {
      const group = await generateGroup(params);
      createdGroups.push(group);
    } catch (error) {
      errors.push({
        params,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return {
    createdGroups,
    errors
  };
}

/**
 * Gets the latest school cycle based on start date
 * 
 * @returns The latest school cycle or null if none exists
 */
async function getLatestCycle() {
  const query = `
    SELECT * FROM Ciclo 
    ORDER BY FechaInicio DESC 
    LIMIT 1
  `;
  const result = await pool.query(query);
  return result.rows[0] || null;
}

/**
 * Finds a subject by matching its name against the given text
 * Used to match a professor's classes with a subject
 * 
 * @param subjectName The name to search for
 * @returns The matching subject or null if none is found
 */
async function findSubjectByName(subjectName: string) {
  const classNames = subjectName.split(',').map(name => name.trim());

  for (const className of classNames) {
    // 1. Exact match
    let query = `SELECT * FROM Materia WHERE LOWER(Nombre) = LOWER($1) LIMIT 1`;
    let result = await pool.query(query, [className]);
    if (result.rows.length > 0) return result.rows[0];

    // 2. Improved Partial Match (all words must be present)
    const words = className.split(/\s+/); // Split into words
    if (words.length > 0) {
      let partialQuery = `SELECT * FROM Materia WHERE `;
      const conditions = words.map((word, index) => `LOWER(Nombre) LIKE LOWER($${index + 1})`);
      partialQuery += conditions.join(' AND ');
      partialQuery += ` LIMIT 1`;
      const partialValues = words.map(word => `%${word}%`);
      const partialResult = await pool.query(partialQuery, partialValues);
      if (partialResult.rows.length > 0) return partialResult.rows[0];
    }

    // 3. Fuzzy Matching (if no other match is found)
    const allSubjectsQuery = `SELECT IdMateria, Nombre FROM Materia`;
    const allSubjectsResult = await pool.query(allSubjectsQuery);
    const subjectNames = allSubjectsResult.rows.map(row => row.nombre);

    const matches = stringSimilarity.findBestMatch(className, subjectNames);
    if (matches.bestMatch.rating > 0.7) { // Adjust threshold as needed
      const bestMatchSubject = allSubjectsResult.rows.find(row => row.nombre === matches.bestMatch.target);
      return bestMatchSubject || null;
    }
  }

  return null;
}

/**
 * Deletes all groups from the database.
 *
 * @returns void
 */
async function deleteAllGroups(): Promise<void> {
  const query = 'DELETE FROM Grupo';
  await pool.query(query);
}

/**
 * Generates groups for all professors in the database.
 * Creates one group per professor based on their assigned classes.
 * 
 * @param idSalon - The classroom ID to be used for all groups (ignored, will use all classrooms)
 * @param idCiclo - Optional cycle ID (will use latest if not provided)
 * @returns Object containing created groups and any errors that occurred
 */
export async function generateGroupsForAllProfessors(idSalon: number, idCiclo?: number) {
  // First, delete all existing groups
  console.log("Deleting all existing groups...");
  await deleteAllGroups();
  console.log("Existing groups deleted.");
  // Get all professors from the database
  const query = 'SELECT * FROM Profesor WHERE Clases IS NOT NULL AND Clases <> \'\'';
  const result = await pool.query(query);
  const professors = result.rows;

  // Get all classrooms from the database
  const classrooms = await Classroom.findAll();
  if (!classrooms || classrooms.length === 0) {
    throw new Error('No classrooms available in the database');
  }

  // Prepare parameters for each professor, assign classrooms in round-robin
  const groupParams: GroupGenerationParams[] = professors.map((professor, idx) => ({
    idProfesor: professor.idprofesor,
    idSalon: classrooms[idx % classrooms.length].idsalon,
    idCiclo: idCiclo
  }));

  // Generate groups using the existing batch function
  return await generateGroupsBatch(groupParams);
}
