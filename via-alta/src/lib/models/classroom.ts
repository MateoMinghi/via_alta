import pool from "../../config/database";

interface ClassroomData {
  idsalon: number;
  cupo: number;
  tipo: string;
  nota: string;
}

class Classroom {
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
      ]);

      return result.rows[0] as ClassroomData;
    } catch (error) {
      console.error("❌ Error al crear el salón:", error);
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

  static async findById(id: string) {
    const query = "SELECT * FROM Salon WHERE IdSalon = $1";
    const result = await pool.query(query, [id]);
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

  // Eliminar salón por ID
  static async delete(id: number) {
    const query = "DELETE FROM salon WHERE idsalon = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as ClassroomData;
  }
}

export default Classroom;
