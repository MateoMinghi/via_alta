import pool from "../../config/database";

interface ScheduleData {
  idHorario?: string; // Optional as it might be auto-generated
  fecha: Date;
  idGrupo: string;
  idAlumno: string;
}

interface ScheduleWithGroup extends ScheduleData {
  IdGrupo: string;
  IdMateria?: string;
  IdProfesor?: string;
  IdSalon?: string;
  IdCiclo?: string;
  // Add other group fields as needed
}

interface GeneralScheduleItem {
  teacher: string;
  subject: string;
  day: string;
  time: string;
  endTime: string;
  classroom: string;
  semester: number;
}

class Schedule {
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

  static async findById(id: string) {
    const query = "SELECT * FROM Horario WHERE idHorario = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] as ScheduleData;
  }

  static async findByStudent(studentId: string) {
    const query = `
      SELECT h.*, g.* 
      FROM Horario h
      JOIN Grupo g ON h.idGrupo = g.IdGrupo
      WHERE h.idAlumno = $1`;
    const result = await pool.query(query, [studentId]);
    return result.rows as ScheduleWithGroup[];
  }

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

  static async delete(id: string) {
    const query = "DELETE FROM Horario WHERE idHorario = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as ScheduleData;
  }

  static async saveGeneralSchedule(scheduleItems: GeneralScheduleItem[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // First clear existing general schedule
      await client.query('DELETE FROM HorarioGeneral');
      
      // Insert all new schedule items
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
