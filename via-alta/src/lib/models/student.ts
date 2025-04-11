import pool from "../../config/database";

interface StudentData {
  IdAlumno: string;
  Confirmacion: boolean;
}

interface StudentWithUser extends StudentData {
  IdUsuario: string;
  Tipo: string;
  Contraseña: string;
  // Add other user fields as needed
}

interface StudentWithRequest extends StudentData {
  IdSolicitud?: string;
  // Add other request fields as needed
}

class Student {
  static async create(student: StudentData) {
    const query =
      "INSERT INTO Alumno (IdAlumno, Confirmacion) VALUES ($1, $2) RETURNING *";
    const values = [student.IdAlumno, student.Confirmacion];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll() {
    const query = "SELECT * FROM Alumno";
    const result = await pool.query(query);
    return result.rows as StudentData[];
  }

  static async findById(id: string) {
    const query = "SELECT * FROM Alumno WHERE IdAlumno = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] as StudentData;
  }

  static async update(id: string, student: StudentData) {
    const query =
      "UPDATE Alumno SET Confirmacion = $1 WHERE IdAlumno = $2 RETURNING *";
    const values = [student.Confirmacion, id];
    const result = await pool.query(query, values);
    return result.rows[0] as StudentData;
  }

  static async delete(id: string) {
    const query = "DELETE FROM Alumno WHERE IdAlumno = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as StudentData;
  }

  // Related queries
  static async findWithUser(id: string) {
    const query = `
      SELECT a.*, u.* 
      FROM Alumno a 
      JOIN Usuario u ON a.IdAlumno = u.IdUsuario 
      WHERE a.IdAlumno = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] as StudentWithUser;
  }

  static async findWithRequests(id: string) {
    const query = `
      SELECT a.*, s.* 
      FROM Alumno a 
      LEFT JOIN Solicitud s ON a.IdAlumno = s.IdAlumno 
      WHERE a.IdAlumno = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows as StudentWithRequest[];
  }

  // Método específico para confirmar horario
  static async confirmSchedule(id: string) {
    const query =
      "UPDATE Alumno SET Confirmacion = TRUE WHERE IdAlumno = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as StudentData;
  }
}

export default Student;
