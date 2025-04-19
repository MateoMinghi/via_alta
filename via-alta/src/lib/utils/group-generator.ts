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

// Interface for input parameters when generating a group - Using PascalCase to match models
export interface GroupGenerationParams {
  IdGrupo?: number; // Optional - if not provided, will be auto-generated
  IdMateria?: number; // Optional - will be determined from professor's classes if not provided
  IdProfesor: string; // Required - the professor who will teach the group
  IdSalon: number; // Required - the classroom where the group will be held
  IdCiclo?: number; // Optional - will use the latest cycle if not provided
}

// Interface for group validation errors
export interface GroupValidationError {
  field: string;
  message: string;
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
 * @param params Group generation parameters (expects PascalCase keys)
 * @returns Array of validation errors (empty if valid)
 */
async function validateGroupParams(params: GroupGenerationParams): Promise<GroupValidationError[]> {
  const errors: GroupValidationError[] = [];

  // Check if the subject exists
  if (params.IdMateria !== undefined) {
    const subject = await Subject.findById(params.IdMateria);
    if (!subject) {
      errors.push({
        field: 'IdMateria',
        message: `Subject with ID ${params.IdMateria} not found`
      });
    }
  }

  // Check if the professor exists
  const professor = await Professor.findById(params.IdProfesor);
  if (!professor) {
    errors.push({
      field: 'IdProfesor',
      message: `Professor with ID ${params.IdProfesor} not found`
    });
  }

  // Check if the classroom exists
  try {
    const classroom = await Classroom.findById(params.IdSalon.toString());
    if (!classroom) {
      errors.push({
        field: 'IdSalon',
        message: `Classroom with ID ${params.IdSalon} not found`
      });
    }
  } catch (error) {
    errors.push({
      field: 'IdSalon',
      message: `Error finding classroom: ${error instanceof Error ? error.message : String(error)}`
    });
  }
  
  // Check if the cycle exists
  if (params.IdCiclo !== undefined) {
    try {
      const cycle = await Cycle.findById(params.IdCiclo.toString());
      if (!cycle) {
        errors.push({
          field: 'IdCiclo',
          message: `Cycle with ID ${params.IdCiclo} not found`
        });
      }
    } catch (error) {
      errors.push({
        field: 'IdCiclo',
        message: `Error finding cycle: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  // If a group ID is provided, check if it's already in use
  if (params.IdGrupo !== undefined) {
    try {
      const existingGroup = await Group.findById(params.IdGrupo);
      if (existingGroup) {
        errors.push({
          field: 'IdGrupo',
          message: `A group with ID ${params.IdGrupo} already exists`
        });
      }
    } catch (error) {
      // If there's an error but it's not because the group doesn't exist, add it to errors
      if (!(error instanceof Error && error.message.includes('not found'))) {
        errors.push({
          field: 'IdGrupo',
          message: `Error validating group ID: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  }

  return errors;
}

/**
 * Generates a new group based on the provided parameters.
 * Ensures that the group's semester matches the subject's semester.
 * 
 * @param params Parameters needed to generate a group (expects PascalCase keys)
 * @returns The created group data (with PascalCase keys)
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
  console.log(`Finding professor with ID: ${params.IdProfesor}`);
  const professor = await Professor.findById(params.IdProfesor);
  if (!professor) {
    console.error(`Professor with ID ${params.IdProfesor} not found`);
    throw new Error(`Professor with ID ${params.IdProfesor} not found`);
  }
  console.log("Professor found:", professor);

  // Get the latest cycle if not provided
  let idCiclo = params.IdCiclo;
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
  let idMateria = params.IdMateria;
  if (!idMateria) {
    console.log(`No subject ID provided, determining from professor classes: ${professor.Clases}`);
    if (!professor.Clases || professor.Clases.trim() === '') {
      console.warn(`Professor with ID ${params.IdProfesor} has empty assigned classes`); // Changed to warn
      throw new Error(`Professor with ID ${params.IdProfesor} does not have any assigned classes`);
    }
    
    // Find a subject that matches the professor's classes
    const matchingSubject = await findSubjectByName(professor.Clases);
    if (!matchingSubject) {
      console.error(`No subject found matching professor's classes: ${professor.Clases}`);
      throw new Error(`No subject found matching professor's classes: ${professor.Clases}`);
    }
    idMateria = matchingSubject.idmateria; // <-- use lowercase as it comes from direct DB query
    console.log(`Determined subject ID: ${idMateria}`);
  }
  
  // At this point, idMateria must be defined
  if (!idMateria) {
    console.error('Failed to determine a valid subject ID after checks.');
    throw new Error('Failed to determine a valid subject ID');
  }

  // Update params with the determined values
  const updatedParams: GroupGenerationParams = {
    ...params,
    IdMateria: idMateria, // Map to PascalCase
    IdCiclo: idCiclo // Map to PascalCase
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
  const groupId = params.IdGrupo || await generateUniqueGroupId();
  console.log(`Using Group ID: ${groupId}`);

  // Ensure subject.semestre is defined
  if (typeof subject.semestre !== 'number') {
    throw new Error(`Subject with ID ${idMateria} does not have a valid 'semestre' value.`);
  }

  // Create the group with the subject's semester - using PascalCase keys
  const groupData = {
    IdGrupo: groupId,
    IdMateria: idMateria,
    IdProfesor: params.IdProfesor,
    IdSalon: params.IdSalon,
    IdCiclo: idCiclo,
    Semestre: subject.semestre // Use the subject's semester as required
  };
  console.log("Prepared group data for creation:", groupData);

  // Create the group in the database
  try {
    console.log("Attempting to create group in database...");
    const createdGroup = await Group.create(groupData);
    console.log("Group created successfully:", createdGroup);
    
    // The Group.create returns an object with Database column names which might be lowercase
    // Use type assertion with any to handle potential property casing differences
    const dbResult = createdGroup as any;
    
    // Map the database result to ensure PascalCase keys
    const mappedGroup = {
      IdGrupo: dbResult.IdGrupo || dbResult.idgrupo,
      IdMateria: dbResult.IdMateria || dbResult.idmateria,
      IdProfesor: dbResult.IdProfesor || dbResult.idprofesor,
      IdSalon: dbResult.IdSalon || dbResult.idsalon,
      IdCiclo: dbResult.IdCiclo || dbResult.idciclo,
      Semestre: dbResult.Semestre || dbResult.semestre
    };
    
    return mappedGroup;
  } catch (creationError) {
    console.error("Error during Group.create:", creationError);
    throw new Error(`Failed to create group in database: ${creationError instanceof Error ? creationError.message : String(creationError)}`);
  }
}

/**
 * Validates parameters for updating a group
 * 
 * @param idGrupo The ID of the group being updated
 * @param params The parameters for the update (expects PascalCase keys)
 * @returns Array of validation errors (empty if valid)
 */
async function validateGroupUpdate(idGrupo: number, params: any): Promise<GroupValidationError[]> {
  const errors: GroupValidationError[] = [];

  // Similar validation as validateGroupParams but allows for partial updates
  const subject = await Subject.findById(params.IdMateria);
  if (!subject) {
    errors.push({
      field: 'IdMateria',
      message: `Subject with ID ${params.IdMateria} not found`
    });
  }

  const professor = await Professor.findById(params.IdProfesor);
  if (!professor) {
    errors.push({
      field: 'IdProfesor',
      message: `Professor with ID ${params.IdProfesor} not found`
    });
  }

  try {
    const classroom = await Classroom.findById(params.IdSalon.toString());
    if (!classroom) {
      errors.push({
        field: 'IdSalon',
        message: `Classroom with ID ${params.IdSalon} not found`
      });
    }
  } catch (error) {
    errors.push({
      field: 'IdSalon',
      message: `Error finding classroom: ${error instanceof Error ? error.message : String(error)}`
    });
  }

  try {
    const cycle = await Cycle.findById(params.IdCiclo.toString());
    if (!cycle) {
      errors.push({
        field: 'IdCiclo',
        message: `Cycle with ID ${params.IdCiclo} not found`
      });
    }
  } catch (error) {
    errors.push({
      field: 'IdCiclo',
      message: `Error finding cycle: ${error instanceof Error ? error.message : String(error)}`
    });
  }

  // Check that the semester matches the subject's semester
  if (subject && params.Semestre !== subject.Semestre) {
    errors.push({
      field: 'Semestre',
      message: `Group semester (${params.Semestre}) does not match subject semester (${subject.Semestre})`
    });
  }

  return errors;
}

/**
 * Updates an existing group, ensuring that the semester still matches the subject's semester
 * 
 * @param idGrupo ID of the group to update
 * @param params New parameters for the group (expects lowercase keys from old interface)
 * @returns The updated group data (with PascalCase keys)
 * @throws Error if validation fails
 */
export async function updateGroup(idGrupo: number, params: Partial<{ idGrupo?: number, idMateria?: number, idProfesor?: string, idSalon?: number, idCiclo?: number }>) {
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

  // Prepare the update data with PascalCase keys
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
  const updatedGroup = await Group.update(idGrupo, updateData);
  
  // The Group.update returns an object with Database column names which might be lowercase
  // Use type assertion with any to handle potential property casing differences
  const dbResult = updatedGroup as any;
  
  // Map the database result to ensure PascalCase keys
  const mappedResult = {
    IdGrupo: dbResult.IdGrupo || dbResult.idgrupo,
    IdMateria: dbResult.IdMateria || dbResult.idmateria,
    IdProfesor: dbResult.IdProfesor || dbResult.idprofesor,
    IdSalon: dbResult.IdSalon || dbResult.idsalon,
    IdCiclo: dbResult.IdCiclo || dbResult.idciclo,
    Semestre: dbResult.Semestre || dbResult.semestre
  };
  
  return mappedResult;
}

/**
 * Deletes a group by ID
 * 
 * @param idGrupo ID of the group to delete
 * @returns The deleted group data (with PascalCase keys)
 */
export async function deleteGroup(idGrupo: number) {
  const deletedGroup = await Group.delete(idGrupo);
  
  // The Group.delete returns an object with Database column names which might be lowercase
  // Use type assertion with any to handle potential property casing differences
  const dbResult = deletedGroup as any;
  
  // Map the database result to ensure PascalCase keys
  return {
    IdGrupo: dbResult.IdGrupo || dbResult.idgrupo,
    IdMateria: dbResult.IdMateria || dbResult.idmateria,
    IdProfesor: dbResult.IdProfesor || dbResult.idprofesor,
    IdSalon: dbResult.IdSalon || dbResult.idsalon,
    IdCiclo: dbResult.IdCiclo || dbResult.idciclo,
    Semestre: dbResult.Semestre || dbResult.semestre
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
 * Deletes all groups from the database.
 *
 * @returns void
 */
async function deleteAllGroups(): Promise<void> {
  const query = 'DELETE FROM Grupo';
  await pool.query(query);
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
 * Generates multiple groups in batch based on a list of parameters
 * 
 * @param paramsList List of group generation parameters (expects PascalCase keys)
 * @returns Object containing created groups (with PascalCase keys) and any errors that occurred
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
 * Generates groups for all professors in the database.
 * Creates one group per professor based on their assigned classes.
 * 
 * @param idSalon - The classroom ID to be used for all groups (ignored, will use all classrooms)
 * @param idCiclo - Optional cycle ID (will use latest if not provided)
 * @returns Object containing created groups (with PascalCase keys) and any errors that occurred
 */
export async function generateGroupsForAllProfessors(idSalon: number, idCiclo?: number) {
  // First, delete all existing groups
  console.log("Deleting all existing groups...");
  await deleteAllGroups();
  console.log("Existing groups deleted.");
  
  // Get all professors from the database
  const professorQuery = 'SELECT * FROM Profesor WHERE Clases IS NOT NULL AND Clases <> \'\'';
  const professorResult = await pool.query(professorQuery);
  const professors = professorResult.rows;

  // Get all classrooms from the database
  const classrooms = await Classroom.findAll();
  if (!classrooms || classrooms.length === 0) {
    throw new Error('No classrooms available in the database');
  }

  // Prepare parameters for each professor, assign classrooms in round-robin
  // Map database results to PascalCase properties for GroupGenerationParams
  const groupParams: GroupGenerationParams[] = professors.map((professor, idx) => ({
    IdProfesor: professor.idprofesor, // Map from lowercase from DB to PascalCase
    IdSalon: classrooms[idx % classrooms.length].idsalon, // Map from lowercase from DB to PascalCase
    IdCiclo: idCiclo
  }));

  // Generate groups using the existing batch function
  const batchResult = await generateGroupsBatch(groupParams);
  
  // Return the result directly - the createdGroups array already contains objects with PascalCase keys
  return {
    createdGroups: batchResult.createdGroups,
    errors: batchResult.errors
  };
}
