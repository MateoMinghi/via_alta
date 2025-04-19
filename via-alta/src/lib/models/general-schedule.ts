import pool from "../../config/database";

// Interface for a general schedule item
export interface GeneralScheduleItem {
  IdHorarioGeneral: number;
  NombreCarrera: string;
  IdGrupo: number;
  Dia: string;
  HoraInicio: string;
  HoraFin: string;
}

class GeneralSchedule {  // Method to save the general schedule
  static async saveGeneralSchedule(scheduleItems: GeneralScheduleItem[]) {
    console.log(`SaveGeneralSchedule called with ${scheduleItems.length} items`);
    
    // If no items to save, just return success
    if (scheduleItems.length === 0) {
      console.log("No schedule items to save, returning early");
      return true;
    }
    
    const client = await pool.connect();
    try {
      console.log("Connected to database, beginning transaction");
      await client.query('BEGIN');
      
      // Delete existing schedule if there are new items
      //if (scheduleItems.length > 0) {
        //await client.query('DELETE FROM HorarioGeneral WHERE IdHorarioGeneral = $1', [scheduleItems[0].IdHorarioGeneral]);
      //}
        // Insert all new schedule items
      const insertQuery = `
        INSERT INTO HorarioGeneral 
        (IdHorarioGeneral, NombreCarrera, IdGrupo, Dia, HoraInicio, HoraFin)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      console.log(`Preparing to insert ${scheduleItems.length} schedule items`);
      for (const item of scheduleItems) {
        console.log(`Inserting item: ${JSON.stringify(item)}`);
        await client.query(insertQuery, [
          item.IdHorarioGeneral,
          item.NombreCarrera,
          item.IdGrupo,
          item.Dia,
          item.HoraInicio,
          item.HoraFin,
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
      SELECT *
      FROM HorarioGeneral
      ORDER BY Dia, HoraInicio
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