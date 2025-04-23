import pool from "../../config/database";

interface ClassroomData {
  idsalon: number;
  cupo: number;
  tipo: string;
  nota: string;
}

class Classroom {
<<<<<<< HEAD
  // Crear un nuevo salón
  static async create(classroom: ClassroomData) {
    try {
      // Obtener el valor máximo de 'idsalon'
      const maxIdResult = await pool.query('SELECT MAX(idsalon) AS max_id FROM salon');
      const maxId = maxIdResult.rows[0].max_id || 0; // Si no hay valores previos, maxId será 0

      // Establecer el nuevo 'idsalon'
      const newIdSalon = maxId + 1;

      // Insertar el nuevo salón con el 'idsalon' generado
      const query = `
        INSERT INTO salon (idsalon, cupo, tipo, nota)
        VALUES ($1, $2, $3, $4) RETURNING *`;

      const result = await pool.query(query, [
        newIdSalon, // Usamos el nuevo id generado
        classroom.cupo,
        classroom.tipo,
        classroom.nota
=======
  // Crear un nuevo salón con ID proporcionado por el usuario
  static async create(classroom: ClassroomData) {
    try {
      // Verificar si ya existe un salón con ese ID
      const existsQuery = "SELECT * FROM salon WHERE idsalon = $1";
      const existsResult = await pool.query(existsQuery, [classroom.idsalon]);

      if (existsResult.rows.length > 0) {
        throw new Error(`Ya existe un salón con el ID ${classroom.idsalon}`);
      }

      // Insertar el nuevo salón
      const query = `
        INSERT INTO salon (idsalon, cupo, tipo, nota)
        VALUES ($1, $2, $3, $4)
        RETURNING *`;

      const result = await pool.query(query, [
        classroom.idsalon,
        classroom.cupo,
        classroom.tipo,
        classroom.nota,
>>>>>>> develop
      ]);

      return result.rows[0] as ClassroomData;
    } catch (error) {
<<<<<<< HEAD
      console.error("❌ Error al crear el salón:", error);
=======
      console.error("Error al crear el salón:", error);
>>>>>>> develop
      throw error;
    }
  }

  // Leer todos los salones
  static async findAll() {
    const query = "SELECT * FROM salon ORDER BY idsalon";
    const result = await pool.query(query);
    return result.rows as ClassroomData[];
  }

  // Modificar cupo de un salón
  static async updateCupo(id: number, newCupo: number) {
    const query = "UPDATE salon SET cupo = $1 WHERE idsalon = $2 RETURNING *";
    const result = await pool.query(query, [newCupo, id]);
    return result.rows[0] as ClassroomData;
  }

<<<<<<< HEAD
  // Modificar tipo de un salón
  static async updateTipo(id: number, newTipo: string) {
    const query = "UPDATE salon SET tipo = $1 WHERE idsalon = $2 RETURNING *";
    const result = await pool.query(query, [newTipo, id]);
    return result.rows[0] as ClassroomData;
  }

  // Modificar nota de un salón
  static async updateNota(id: number, newNota: string) {
    const query = "UPDATE salon SET nota = $1 WHERE idsalon = $2 RETURNING *";
    const result = await pool.query(query, [newNota, id]);
    return result.rows[0] as ClassroomData;
  }

=======
  static async findById(id: string) {
    const query = "SELECT * FROM salon WHERE idsalon = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] as ClassroomData;
  }

  // Modificar tipo de un salón
  static async updateTipo(id: number, newTipo: string) {
    const query = "UPDATE salon SET tipo = $1 WHERE idsalon = $2 RETURNING *";
    const result = await pool.query(query, [newTipo, id]);
    return result.rows[0] as ClassroomData;
  }

  // Modificar nota de un salón
  static async updateNota(id: number, newNota: string) {
    const query = "UPDATE salon SET nota = $1 WHERE idsalon = $2 RETURNING *";
    const result = await pool.query(query, [newNota, id]);
    return result.rows[0] as ClassroomData;
  }

>>>>>>> develop
  // Eliminar salón por ID
  static async delete(id: number) {
    const query = "DELETE FROM salon WHERE idsalon = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as ClassroomData;
  }

  // Modificar idsalon de un salón
static async updateId(oldId: number, newId: number) {
  try {
    // Verificar si el nuevo ID ya existe
    const existsQuery = "SELECT 1 FROM salon WHERE idsalon = $1";
    const existsResult = await pool.query(existsQuery, [newId]);

    if (existsResult.rows.length > 0) {
      throw new Error(`Ya existe un salón con el ID ${newId}`);
    }

    const query = "UPDATE salon SET idsalon = $1 WHERE idsalon = $2 RETURNING *";
    const result = await pool.query(query, [newId, oldId]);
    return result.rows[0] as ClassroomData;
  } catch (error) {
    console.error("Error al actualizar el ID del salón:", error);
    throw error;
  }
}

}

export default Classroom;