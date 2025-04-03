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
      
      // First, validate that all professor IDs exist
      for (const item of scheduleItems) {
        const professorCheck = await client.query(
          'SELECT COUNT(*) FROM Profesor WHERE IdProfesor = $1',
          [item.IdProfesor]
        );
        
        if (professorCheck.rows[0].count === '0') {
          throw new Error(`Professor with ID ${item.IdProfesor} does not exist in the database`);
        }
      }

      // Then proceed with deletion if validation passes
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
  static async getGeneralSchedule(): Promise<GeneralScheduleItem[]> {
    const query = `
      SELECT 
        hg.*,
        m.Nombre as MateriaNombre,
        p.Nombre as ProfesorNombre
      FROM HorarioGeneral hg
      LEFT JOIN Materia m ON hg.IdMateria = m.IdMateria
      LEFT JOIN Profesor p ON hg.IdProfesor = p.IdProfesor
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
}

export default GeneralSchedule;