import pool from "../../config/database";

interface RequestData {
  IdSolicitud: string;
  Fecha: Date;
  Estado: string;
  Descripcion: string;
  IdAlumno: string;
}

class Request {
  static async create(request: RequestData) {
    const query =
      "INSERT INTO Solicitud (IdSolicitud, Fecha, Estado, Descripcion, IdAlumno) VALUES ($1, $2, $3, $4, $5) RETURNING *";
    const result = await pool.query(query, [
      request.IdSolicitud,
      request.Fecha,
      request.Estado,
      request.Descripcion,
      request.IdAlumno,
    ]);
    return result.rows[0] as RequestData;
  }

  static async findById(id: string) {
    const query = "SELECT * FROM Solicitud WHERE IdSolicitud = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] as RequestData;
  }

  static async findByStudent(studentId: string) {
    const query = "SELECT * FROM Solicitud WHERE IdAlumno = $1";
    const result = await pool.query(query, [studentId]);
    return result.rows as RequestData[];
  }

  static async update(id: string, request: Partial<RequestData>) {
    const query =
      "UPDATE Solicitud SET Fecha = $1, Descripcion = $2, Estado = $3 WHERE IdSolicitud = $4 RETURNING *";
    const result = await pool.query(query, [
      request.Fecha,
      request.Descripcion,
      request.Estado,
      id,
    ]);
    return result.rows[0] as RequestData;
  }

  static async delete(id: string) {
    const query = "DELETE FROM Solicitud WHERE IdSolicitud = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as RequestData;
  }
}

export default Request;
