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
  IdMateria?: number;
  IdProfesor?: number;
  IdSalon?: number;
}

class GeneralSchedule {  // Method to save the general schedule
  static async saveGeneralSchedule(scheduleItems: GeneralScheduleItem[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get all unique group IDs to be updated
      if (scheduleItems.length > 0) {
        const cycleId = scheduleItems[0].IdHorarioGeneral;
        const groupIds = [...new Set(scheduleItems.map(item => item.IdGrupo))];
        
        console.log(`Updating schedule for cycle ${cycleId} with ${groupIds.length} unique groups`);
        
        // Delete existing entries for these specific groups in this cycle
        await client.query(
          'DELETE FROM HorarioGeneral WHERE IdHorarioGeneral = $1 AND IdGrupo = ANY($2)',
          [cycleId, groupIds]
        );
        
        console.log(`Deleted existing entries for groups in cycle ${cycleId}`);
      }
      
      // Insert all schedule items with ON CONFLICT DO NOTHING to prevent duplicates
      const insertQuery = `
        INSERT INTO HorarioGeneral 
        (IdHorarioGeneral, NombreCarrera, IdGrupo, Dia, HoraInicio, HoraFin)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `;
      
      // Log groupings for debugging
      const groupingMap = new Map<string, number>();
      for (const item of scheduleItems) {
        const key = `${item.IdGrupo}-${item.Dia}-${item.HoraInicio}`;
        groupingMap.set(key, (groupingMap.get(key) || 0) + 1);
      }
      
      for (const [key, count] of groupingMap.entries()) {
        if (count > 1) {
          console.log(`Potential duplicate: ${key} appears ${count} times`);
        }
      }
      
      // For each schedule item
      for (const item of scheduleItems) {
        // First insert into HorarioGeneral
        await client.query(insertQuery, [
          item.IdHorarioGeneral,
          item.NombreCarrera,
          item.IdGrupo,
          item.Dia,
          item.HoraInicio,
          item.HoraFin
        ]);
        
        // Then update the Grupo table to set the classroom ID if provided
        if (item.IdSalon) {
          await client.query(
            'UPDATE Grupo SET IdSalon = $1 WHERE IdGrupo = $2',
            [item.IdSalon, item.IdGrupo]
          );
          console.log(`Updated Grupo ${item.IdGrupo} with Salon ${item.IdSalon}`);
        }
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
             g.IdSalon,
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

