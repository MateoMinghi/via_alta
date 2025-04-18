// Group Generator Utility
// This utility helps generate groups for academic subjects with proper semester mapping

import Group from '../models/group';
import Subject from '../models/subject';
import Professor from '../models/professor';
import Classroom from '../models/classroom';
import Cycle from '../models/cycle';
import pool from '../../config/database';

// Interface for input parameters when generating a group
export interface GroupGenerationParams {
  idGrupo?: number; // Optional - if not provided, will be auto-generated
  idMateria: number; // Required - the subject for which to create a group
  idProfesor: string; // Required - the professor who will teach the group
  idSalon: number; // Required - the classroom where the group will be held
  idCiclo: number; // Required - the school cycle for the group
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
  // Validate input parameters
  const validationErrors = await validateGroupParams(params);
  if (validationErrors.length > 0) {
    throw new Error(`Group validation failed: ${JSON.stringify(validationErrors)}`);
  }

  // Get the subject to extract its semester
  const subject = await Subject.findById(params.idMateria);
  if (!subject) {
    throw new Error(`Subject with ID ${params.idMateria} not found`);
  }

  // Generate a group ID if not provided
  const groupId = params.idGrupo || await generateUniqueGroupId();

  // Create the group with the subject's semester
  const groupData = {
    IdGrupo: groupId,
    IdMateria: params.idMateria,
    IdProfesor: params.idProfesor,
    IdSalon: params.idSalon,
    IdCiclo: params.idCiclo,
    Semestre: subject.Semestre // Use the subject's semester as required
  };

  // Create the group in the database
  return await Group.create(groupData);
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
  const subject = await Subject.findById(params.idMateria);
  if (!subject) {
    errors.push({
      field: 'idMateria',
      message: `Subject with ID ${params.idMateria} not found`
    });
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
