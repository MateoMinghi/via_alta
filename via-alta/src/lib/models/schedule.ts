import pool from "../../config/database";

// Interfaz para los datos del horario
interface ScheduleData {
  idHorario?: string; // Opcional, ya que podría ser auto-generado
  fecha: Date;
  idGrupo: string;
  idAlumno: string;
}

// Interfaz que extiende ScheduleData e incluye información del grupo
interface ScheduleWithGroup extends ScheduleData {
  IdGrupo: string;
  IdMateria?: string;
  IdProfesor?: string;
  IdSalon?: string;
  IdCiclo?: string;
  // Agrega otros campos del grupo según sea necesario
}

// Interfaces para los datos del horario detallado y general
interface DetailedScheduleData extends ScheduleWithGroup {
  MateriaNombre?: string;
  ProfesorNombre?: string;
  idsalon?: string;
  TipoSalon?: string;
}

interface GeneralScheduleData {
  IdGrupo: string;
  Dia?: number;
  HoraInicio?: string;
  HoraFin?: string;
  MateriaNombre?: string;
  ProfesorNombre?: string;
  idsalon?: string;
  TipoSalon?: string;
}

// Clase Schedule: Representa el modelo de la tabla Horario en la base de datos.
// Define métodos para interactuar con los datos del horario.
class Schedule {
  // Método para crear un nuevo horario
  static async create(schedule: ScheduleData) {
    const query =
      "INSERT INTO Horario (fecha, idGrupo, idAlumno) VALUES ($1, $2, $3) RETURNING *";
    const result = await pool.query(query, [
      schedule.fecha,
      schedule.idGrupo,
      schedule.idAlumno,
    ]);
    return result.rows[0] as ScheduleData;
  }

  // Método para encontrar un horario por su ID
  static async findById(id: string) {
    const query = "SELECT * FROM Horario WHERE idHorario = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] as ScheduleData;
  }

  // Método para encontrar horarios por ID de estudiante
  static async findByStudent(studentId: string) {
    const query = `
      SELECT h.*, g.* 
      FROM Horario h
      JOIN Grupo g ON h.idGrupo = g.IdGrupo
      WHERE h.idAlumno = $1`;
    const result = await pool.query(query, [studentId]);
    return result.rows as ScheduleWithGroup[];
  }

  // Metodo para encontrar horarios detallados por ID de estudiante
  static async findDetailedStudentSchedule(studentId: string) {
    const query = `
      SELECT h.*, g.*, m.Nombre as MateriaNombre, p.Nombre as ProfesorNombre, s.idsalon, s.tipo as TipoSalon
      FROM Horario h
      JOIN Grupo g ON h.idGrupo = g.IdGrupo
      LEFT JOIN Materia m ON g.IdMateria = m.IdMateria
      LEFT JOIN Profesor p ON g.IdProfesor = p.IdProfesor
      LEFT JOIN salon s ON g.IdSalon = s.idsalon
      WHERE h.idAlumno = $1
    `;
    const result = await pool.query(query, [studentId]);
    return result.rows as DetailedScheduleData[];
  }

  // Metodo para encontrar horarios generales por semestre
  static async findGeneralScheduleBySemester(semester: string) {
    const query = `
      SELECT hg.*, g.*, m.Nombre as MateriaNombre, p.Nombre as ProfesorNombre, s.idsalon, s.tipo as TipoSalon
      FROM HorarioGeneral hg
      JOIN Grupo g ON hg.IdGrupo = g.IdGrupo
      LEFT JOIN Materia m ON g.IdMateria = m.IdMateria
      LEFT JOIN Profesor p ON g.IdProfesor = p.IdProfesor
      LEFT JOIN salon s ON g.IdSalon = s.idsalon
      WHERE g.Semestre = $1
      ORDER BY hg.Dia, hg.HoraInicio
    `;
    const result = await pool.query(query, [semester]);
    return result.rows as GeneralScheduleData[];
  }

  // Método para encontrar horarios generales por semestre y carrera
  static async findGeneralScheduleBySemesterAndDegree(semester: string, degree: string) {
    const query = `
      SELECT hg.*, g.*, m.Nombre as MateriaNombre, p.Nombre as ProfesorNombre, s.idsalon, s.tipo as TipoSalon
      FROM HorarioGeneral hg
      JOIN Grupo g ON hg.IdGrupo = g.IdGrupo
      LEFT JOIN Materia m ON g.IdMateria = m.IdMateria
      LEFT JOIN Profesor p ON g.IdProfesor = p.IdProfesor
      LEFT JOIN salon s ON g.IdSalon = s.idsalon
      WHERE g.Semestre = $1 AND hg.NombreCarrera = $2
      ORDER BY hg.Dia, hg.HoraInicio
    `;
    const result = await pool.query(query, [semester, degree]);
    return result.rows as GeneralScheduleData[];
  }

  // Metodo para eliminar todos los horarios de un estudiante
  static async deleteAllForStudent(studentId: string) {
    const query = 'DELETE FROM Horario WHERE idAlumno = $1';
    const result = await pool.query(query, [studentId]);
    return result.rowCount;
  }
  
  // Metodo para eliminar horarios por ID de grupo
  static async bulkCreate(studentId: string, groupIds: string[]) {
    const client = await pool.connect();
    let insertedCount = 0;
    
    try {
      await client.query('BEGIN');
      const currentDate = new Date();
      
      for (const groupId of groupIds) {
        const query = `
          INSERT INTO Horario (fecha, idGrupo, idAlumno)
          VALUES ($1, $2, $3)
        `;
        await client.query(query, [currentDate, groupId, studentId]);
        insertedCount++;
      }
      
      await client.query('COMMIT');
      return insertedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Método para actualizar un horario existente
  static async update(id: string, schedule: Partial<ScheduleData>) {
    const query =
      "UPDATE Horario SET fecha = $1, idGrupo = $2 WHERE idHorario = $3 RETURNING *";
    const result = await pool.query(query, [
      schedule.fecha,
      schedule.idGrupo,
      id,
    ]);
    return result.rows[0] as ScheduleData;
  }

  // Método para eliminar un horario
  static async delete(id: string) {
    const query = "DELETE FROM Horario WHERE idHorario = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as ScheduleData;
  }

  // Método para eliminar todos los horarios de un estudiante
  static async deleteStudentSchedule(studentId: string) {
    const query = 'DELETE FROM Horario WHERE idAlumno = $1';
    const result = await pool.query(query, [studentId]);
    return result.rowCount;
  }

  // Método para eliminar horarios por ID de grupo
  static async addScheduleEntry(studentId: string, groupId: string | number, date: Date = new Date()) {
    const query = 'INSERT INTO Horario (fecha, idGrupo, idAlumno) VALUES ($1, $2, $3) RETURNING *';
    const result = await pool.query(query, [date, groupId, studentId]);
    return result.rows[0];
  }

  static async getClient() {
    return await pool.connect();
  }
}

export default Schedule;
export type { ScheduleData, ScheduleWithGroup, DetailedScheduleData, GeneralScheduleData };