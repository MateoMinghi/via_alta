import pool from "../../config/database";

interface ProfessorData {
  IdProfesor: string;
  Nombre: string;
  Clases: string; // Added new attribute to store classes the professor teaches
}

class Professor {
  static async create(professor: ProfessorData) {
    const query =
      "INSERT INTO Profesor (IdProfesor, Nombre, Clases) VALUES ($1, $2, $3) RETURNING *";
    const result = await pool.query(query, [
      professor.IdProfesor,
      professor.Nombre,
      professor.Clases || '', // Default empty string if not provided
    ]);
    return result.rows[0] as ProfessorData;
  }

  static async findById(id: string) {
    const query = "SELECT * FROM Profesor WHERE IdProfesor = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] as ProfessorData;
  }

  static async findAll() {
    const query = "SELECT * FROM Profesor ORDER BY Nombre";
    const result = await pool.query(query);
    return result.rows as ProfessorData[];
  }

  static async update(id: string, professor: Partial<ProfessorData>) {
    // Modified to accept partial updates and handle the Clases attribute
    let updateFields: string[] = [];
    let values: any[] = [];
    let paramCounter = 1;
    
    if (professor.Nombre !== undefined) {
      updateFields.push(`Nombre = $${paramCounter++}`);
      values.push(professor.Nombre);
    }
    
    if (professor.Clases !== undefined) {
      updateFields.push(`Clases = $${paramCounter++}`);
      values.push(professor.Clases);
    }
    
    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }
    
    values.push(id);
    
    const query = `
      UPDATE Profesor 
      SET ${updateFields.join(', ')} 
      WHERE IdProfesor = $${paramCounter} 
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0] as ProfessorData;
  }

  static async delete(id: string) {
    const query = "DELETE FROM Profesor WHERE IdProfesor = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as ProfessorData;
  }
  
  static async updateClasses(id: string, classes: string) {
    // Convenience method specifically for updating classes
    const query = "UPDATE Profesor SET Clases = $1 WHERE IdProfesor = $2 RETURNING *";
    const result = await pool.query(query, [classes, id]);
    return result.rows[0] as ProfessorData;
  }
}

export default Professor;
