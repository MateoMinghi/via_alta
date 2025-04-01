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

// Interfaz para representar un elemento del horario general
interface GeneralScheduleItem {
  teacher: string;
  subject: string;
  day: string;
  time: string;
  endTime: string;
  classroom: string;
  semester: number;
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

  // Método para guardar el horario general
  static async saveGeneralSchedule(scheduleItems: GeneralScheduleItem[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Primero, elimina el horario general existente
      await client.query('DELETE FROM HorarioGeneral');
      
      // Inserta todos los nuevos elementos del horario
      const insertQuery = `
        INSERT INTO HorarioGeneral 
        (profesor, materia, dia, hora_inicio, hora_fin, salon, semestre)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      for (const item of scheduleItems) {
        await client.query(insertQuery, [
          item.teacher,
          item.subject,
          item.day,
          item.time,
          item.endTime,
          item.classroom,
          item.semester
        ]);
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Método para obtener el horario general
  static async getGeneralSchedule(): Promise<GeneralScheduleItem[]> {
    const query = `
      SELECT profesor as teacher, 
             materia as subject,
             dia as day,
             hora_inicio as time,
             hora_fin as "endTime",
             salon as classroom,
             semestre as semester
      FROM HorarioGeneral
      ORDER BY dia, hora_inicio
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

export default Schedule;
export type { ScheduleData, ScheduleWithGroup, GeneralScheduleItem };