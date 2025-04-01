import pool from "../../config/database"; // Importamos la instancia de pool para interactuar con la base de datos

// Definimos la interfaz para los datos de disponibilidad
interface AvailabilityData {
  IdDisponibilidad: number;
  IdProfesor: string;
  Dia: string;
  HoraInicio: string;
  HoraFin: string;
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
    const query = "SELECT * FROM Disponibilidad WHERE IdProfesor = $1";
    const result = await pool.query(query, [professorId]);
    return result.rows as AvailabilityData[]; // Retorna un arreglo de disponibilidades
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
