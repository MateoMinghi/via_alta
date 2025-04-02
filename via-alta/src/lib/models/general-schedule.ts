import pool from "../../config/database";

// Interface for a general schedule item
export interface GeneralScheduleItem {
  IdHorarioGeneral: number;
  NombreCarrera: string;
  IdMateria: number;
  IdProfesor: number;
  IdCiclo: number;
  Dia: string;
  HoraInicio: string;
  HoraFin: string;
  Semestre: number;
}

class GeneralSchedule {
  // Method to save the general schedule
  static async saveGeneralSchedule(scheduleItems: GeneralScheduleItem[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // First, delete existing schedule for the same IdHorarioGeneral
      if (scheduleItems.length > 0) {
        await client.query('DELETE FROM HorarioGeneral WHERE IdHorarioGeneral = $1', [scheduleItems[0].IdHorarioGeneral]);
      }
      
      // Insert all new schedule items
      const insertQuery = `
        INSERT INTO HorarioGeneral 
        (IdHorarioGeneral, NombreCarrera, IdMateria, IdProfesor, IdCiclo, Dia, HoraInicio, HoraFin, Semestre)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      for (const item of scheduleItems) {
        await client.query(insertQuery, [
          item.IdHorarioGeneral,
          item.NombreCarrera,
          item.IdMateria,
          item.IdProfesor,
          item.IdCiclo,
          item.Dia,
          item.HoraInicio,
          item.HoraFin,
          item.Semestre
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

  // Method to get the general schedule for a specific degree program
  static async getGeneralSchedule(degreeId: number): Promise<GeneralScheduleItem[]> {
    const query = `
      SELECT 
        hg.*,
        m.Nombre as MateriaNombre,
        p.Nombre as ProfesorNombre
      FROM HorarioGeneral hg
      JOIN Materia m ON hg.IdMateria = m.IdMateria
      JOIN Profesor p ON hg.IdProfesor = p.IdProfesor
      WHERE hg.IdHorarioGeneral = $1
      ORDER BY hg.Dia, hg.HoraInicio
    `;
    const result = await pool.query(query, [degreeId]);
    return result.rows;
  }

  // Method to get all degree programs
  static async getDegreePrograms(): Promise<{ IdHorarioGeneral: number; NombreCarrera: string }[]> {
    const query = `
      SELECT DISTINCT IdHorarioGeneral, NombreCarrera
      FROM HorarioGeneral
      ORDER BY NombreCarrera
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

export default GeneralSchedule;