import pool from "../../config/database";

// Interface for a general schedule item
export interface GeneralScheduleItem {
  IdHorarioGeneral: number;
  NombreCarrera: string;
  IdGrupo: number;
  Dia: string;
  HoraInicio: string;
  HoraFin: string;
  Semestre?: number;
  MateriaNombre?: string;
  ProfesorNombre?: string;
}

class GeneralSchedule {
  // Method to save the general schedule
  static async saveGeneralSchedule(scheduleItems: GeneralScheduleItem[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete existing schedule if there are new items
      if (scheduleItems.length > 0) {
        await client.query('DELETE FROM HorarioGeneral WHERE IdHorarioGeneral = $1', [scheduleItems[0].IdHorarioGeneral]);
      }
      
      // Insert all new schedule items
      const insertQuery = `
        INSERT INTO HorarioGeneral 
        (IdHorarioGeneral, NombreCarrera, IdGrupo, Dia, HoraInicio, HoraFin)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      for (const item of scheduleItems) {
        await client.query(insertQuery, [
          item.IdHorarioGeneral,
          item.NombreCarrera,
          item.IdGrupo,
          item.Dia,
          item.HoraInicio,
          item.HoraFin
        ]);
      }
      
      //transacciones :)
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Method to get the general schedule
  static async getGeneralSchedule(): Promise<GeneralScheduleItem[]> {
    const query = `
      SELECT hg.*,
             g.IdMateria,
             m.Nombre as MateriaNombre,
             g.IdProfesor,
             p.Nombre as ProfesorNombre,
             g.Semestre
      FROM HorarioGeneral hg
      JOIN Grupo g ON hg.IdGrupo = g.IdGrupo
      LEFT JOIN Materia m ON g.IdMateria = m.IdMateria
      LEFT JOIN Profesor p ON g.IdProfesor = p.IdProfesor
      ORDER BY hg.Dia, hg.HoraInicio
    `;
    const result = await pool.query(query);
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

  // Method to delete all schedule rows for a specific cycle
  static async deleteForCycle(idCiclo: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM HorarioGeneral WHERE IdHorarioGeneral = $1', [idCiclo]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default GeneralSchedule;

