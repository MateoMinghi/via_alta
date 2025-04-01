import pool from "../../config/database"; // Importamos la instancia de pool para interactuar con la base de datos

// Definimos la interfaz para los datos de los profesores
interface ProfessorData {
  IdProfesor: string;
  Nombre: string;
  Clases: string; // Se añade el atributo "Clases" para almacenar las clases que enseña el profesor
}

// Clase para gestionar las operaciones sobre la tabla "Profesor" en la base de datos
class Professor {
  /**
   * Crea un nuevo profesor en la base de datos.
   * @param {ProfessorData} professor - Los datos del profesor a crear.
   * @returns {Promise<ProfessorData>} Los datos del profesor creado.
   */
  static async create(professor: ProfessorData): Promise<ProfessorData> {
    const query =
      "INSERT INTO Profesor (IdProfesor, Nombre, Clases) VALUES ($1, $2, $3) RETURNING *";
    const result = await pool.query(query, [
      professor.IdProfesor,
      professor.Nombre,
      professor.Clases || '', // Si no se proporciona, asigna un string vacío por defecto
    ]);
    return result.rows[0] as ProfessorData; // Retornamos el profesor creado
  }

  /**
   * Busca un profesor por su ID.
   * @param {string} id - El ID del profesor.
   * @returns {Promise<ProfessorData | null>} Los datos del profesor encontrado, o null si no existe.
   */
  static async findById(id: string): Promise<ProfessorData | null> {
    const query = "SELECT * FROM Profesor WHERE IdProfesor = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] as ProfessorData || null; // Retorna null si no se encuentra el profesor
  }

  /**
   * Busca todos los profesores y los ordena por nombre.
   * @returns {Promise<ProfessorData[]>} Una lista de todos los profesores.
   */
  static async findAll(): Promise<ProfessorData[]> {
    const query = "SELECT * FROM Profesor ORDER BY Nombre";
    const result = await pool.query(query);
    return result.rows as ProfessorData[]; // Retorna una lista de profesores
  }

  /**
   * Actualiza los detalles de un profesor.
   * @param {string} id - El ID del profesor a actualizar.
   * @param {Partial<ProfessorData>} professor - Los datos de los campos a actualizar del profesor.
   * @returns {Promise<ProfessorData>} Los datos del profesor actualizado.
   * @throws {Error} Si no se especifican campos para actualizar.
   */
  static async update(
    id: string,
    professor: Partial<ProfessorData>
  ): Promise<ProfessorData> {
    let updateFields: string[] = [];
    let values: any[] = [];
    let paramCounter = 1;

    // Si el nombre está presente, se agrega al conjunto de actualizaciones
    if (professor.Nombre !== undefined) {
      updateFields.push(`Nombre = $${paramCounter++}`);
      values.push(professor.Nombre);
    }

    // Si las clases están presentes, se agrega al conjunto de actualizaciones
    if (professor.Clases !== undefined) {
      updateFields.push(`Clases = $${paramCounter++}`);
      values.push(professor.Clases);
    }

    // Si no se proporciona ningún campo para actualizar, lanzamos un error
    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }

    // Agregamos el ID del profesor como el último valor en los parámetros de la consulta
    values.push(id);

    // Creamos la consulta para actualizar el profesor
    const query = `
      UPDATE Profesor 
      SET ${updateFields.join(', ')} 
      WHERE IdProfesor = $${paramCounter} 
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] as ProfessorData; // Retornamos el profesor actualizado
  }

  /**
   * Elimina un profesor por su ID.
   * @param {string} id - El ID del profesor a eliminar.
   * @returns {Promise<ProfessorData>} Los datos del profesor eliminado.
   */
  static async delete(id: string): Promise<ProfessorData> {
    const query = "DELETE FROM Profesor WHERE IdProfesor = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as ProfessorData; // Retornamos el profesor eliminado
  }

  /**
   * Actualiza únicamente el atributo de clases de un profesor.
   * @param {string} id - El ID del profesor.
   * @param {string} classes - Las nuevas clases del profesor.
   * @returns {Promise<ProfessorData>} Los datos del profesor con las clases actualizadas.
   */
  static async updateClasses(id: string, classes: string): Promise<ProfessorData> {
    const query = "UPDATE Profesor SET Clases = $1 WHERE IdProfesor = $2 RETURNING *";
    const result = await pool.query(query, [classes, id]);
    return result.rows[0] as ProfessorData; // Retornamos el profesor con las clases actualizadas
  }
}

// Exportamos la clase Professor para poder usarla en otros módulos
export default Professor;
