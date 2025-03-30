import pool from "../config/database";

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
}

export default Schedule;
