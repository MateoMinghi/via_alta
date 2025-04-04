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
    const query = `
      INSERT INTO salon (idsalon, cupo, tipo, nota) 
      VALUES ($1, $2, $3, $4) RETURNING *`;
    const result = await pool.query(query, [
      classroom.idsalon,
      classroom.cupo,
      classroom.tipo,
      classroom.nota,
    ]);
    return result.rows[0] as ClassroomData;
  }

  // Modificar cupo de un salón
  static async updateCupo(id: number, newCupo: number) {
    const query = "UPDATE salon SET cupo = $1 WHERE idsalon = $2 RETURNING *";
    const result = await pool.query(query, [newCupo, id]);
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
  

}

export default Classroom;
