import pool from "../../config/database";

// Definimos la interfaz para los datos de disponibilidad tal como vienen de la base de datos
interface RawAvailabilityData {
  iddisponibilidad?: number;
  idprofesor?: string;
  dia?: string;
  horainicio?: string;
  horafin?: string;
  // También permitimos las versiones en PascalCase
  IdDisponibilidad?: number;
  IdProfesor?: string;
  Dia?: string;
  HoraInicio?: string;
  HoraFin?: string;
}

// Definimos la interfaz para los datos de disponibilidad normalizados
interface AvailabilityData {
  IdDisponibilidad: number;
  IdProfesor: string;
  Dia: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';
  HoraInicio: string;
  HoraFin: string;
}

// Función auxiliar para normalizar los datos de la base de datos
function normalizeAvailabilityData(raw: RawAvailabilityData): AvailabilityData {
  return {
    IdDisponibilidad: raw.iddisponibilidad || raw.IdDisponibilidad || 0,
    IdProfesor: raw.idprofesor || raw.IdProfesor || '',
    Dia: (raw.dia || raw.Dia || 'Lunes') as AvailabilityData['Dia'],
    HoraInicio: raw.horainicio || raw.HoraInicio || '',
    HoraFin: raw.horafin || raw.HoraFin || ''
  };
}

// Clase para gestionar las operaciones sobre la tabla "Disponibilidad" en la base de datos
class Availability {
  /**
   * Crea una nueva disponibilidad en la base de datos.
   * param {AvailabilityData} availability - Los datos de disponibilidad a crear.
   * returns {Promise<AvailabilityData>} Los datos de la disponibilidad creada.
   */
  static async create(availability: AvailabilityData): Promise<AvailabilityData> {
    const query =
      "INSERT INTO Disponibilidad (IdDisponibilidad, IdProfesor, Dia, HoraInicio, HoraFin) VALUES ($1, $2, $3, $4, $5) RETURNING *";
    const result = await pool.query(query, [
      availability.IdDisponibilidad,
      availability.IdProfesor,
      availability.Dia,
      availability.HoraInicio,
      availability.HoraFin,
    ]);
    return result.rows[0] as AvailabilityData; // Retornamos la disponibilidad creada
  }

  /**
   * Busca una disponibilidad por su ID.
   * param {number} id - El ID de la disponibilidad.
   * returns {Promise<AvailabilityData>} Los datos de la disponibilidad encontrada.
   */
  static async findById(id: number): Promise<AvailabilityData | null> {
    const query = "SELECT * FROM Disponibilidad WHERE IdDisponibilidad = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] as AvailabilityData || null; // Retorna null si no se encuentra la disponibilidad
  }

  /**
   * Busca todas las disponibilidades de un profesor por su ID.
   * param {string} professorId - El ID del profesor.
   * returns {Promise<AvailabilityData[]>} Una lista de disponibilidades del profesor.
   */
  static async findByProfessor(professorId: string): Promise<AvailabilityData[]> {
    const trimmedId = professorId.trim();
    const query = "SELECT * FROM Disponibilidad WHERE LOWER(IdProfesor) = LOWER($1)";
    const result = await pool.query(query, [trimmedId]);
    return result.rows.map(normalizeAvailabilityData);
  }

  /**
   * Actualiza los detalles de una disponibilidad.
   * param {number} id - El ID de la disponibilidad a actualizar.
   * param {Partial<AvailabilityData>} availability - Los datos de la disponibilidad a actualizar.
   * returns {Promise<AvailabilityData>} Los datos de la disponibilidad actualizada.
   */
  static async update(
    id: number,
    availability: Partial<AvailabilityData>
  ): Promise<AvailabilityData> {
    const query = `UPDATE Disponibilidad 
      SET Dia = $1, HoraInicio = $2, HoraFin = $3 
      WHERE IdDisponibilidad = $4 RETURNING *`;
    const result = await pool.query(query, [
      availability.Dia,
      availability.HoraInicio,
      availability.HoraFin,
      id,
    ]);
    return result.rows[0] as AvailabilityData; // Retorna la disponibilidad actualizada
  }

  /**
   * Elimina una disponibilidad por su ID.
   * param {number} id - El ID de la disponibilidad a eliminar.
   * returns {Promise<AvailabilityData>} Los datos de la disponibilidad eliminada.
   */
  static async delete(id: number): Promise<AvailabilityData> {
    const query =
      "DELETE FROM Disponibilidad WHERE IdDisponibilidad = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as AvailabilityData; // Retorna la disponibilidad eliminada
  }

  /**
   * Obtiene todas las disponibilidades de la base de datos.
   * returns {Promise<AvailabilityData[]>} Una lista de todas las disponibilidades.
   * throws Error Si ocurre algún problema al obtener los datos.
   */
  static async getAllAvailability(): Promise<AvailabilityData[]> {
    try {
      const query = "SELECT * FROM Disponibilidad";
      const result = await pool.query(query);
      return result.rows as AvailabilityData[]; // Retorna todas las disponibilidades
    } catch (error) {
      console.error("Error fetching availability:", (error as Error).message);
      throw error; // Lanza el error si falla la consulta
    }
  }

  /**
   * Obtiene el ID más alto de disponibilidad en la base de datos.
   * returns {Promise<number>} El máximo ID de disponibilidad.
   * throws Error Si ocurre algún problema al obtener el ID.
   */
  static async getMaxId(): Promise<number> {
    try {
      const query = "SELECT MAX(IdDisponibilidad) as max_id FROM Disponibilidad";
      const result = await pool.query(query);
      return (result.rows[0]?.max_id as number) || 0; // Retorna el máximo ID, o 0 si no existe ninguno
    } catch (error) {
      console.error("Error getting max ID:", (error as Error).message);
      throw error; // Lanza el error si falla la consulta
    }
  }
}

// Exportamos la clase Availability para poder usarla en otros módulos
export default Availability;
