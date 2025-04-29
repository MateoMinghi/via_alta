import pool from "../../config/database";

interface StudentData {
  IdAlumno: string;
  Confirmacion: boolean;
}

interface StudentWithUser extends StudentData {
  IdUsuario: string;
  Tipo: string;
  Contraseña: string;
  // Agrega otros campos de usuario según sea necesario
}

interface StudentWithRequest extends StudentData {
  IdSolicitud?: string;
  // Agrega otros campos de solicitud según sea necesario
}

class Student {
  static async create(student: StudentData) {
    const query =
      "INSERT INTO Alumno (IdAlumno, Confirmacion) VALUES ($1, $2) RETURNING *";
    const values = [student.IdAlumno, student.Confirmacion];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll() {
    const query = "SELECT * FROM Alumno";
    const result = await pool.query(query);
    return result.rows as StudentData[];
  }

  static async findById(id: string) {
    const query = "SELECT * FROM Alumno WHERE IdAlumno = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] as StudentData;
  }

  static async update(id: string, student: StudentData) {
    const query =
      "UPDATE Alumno SET Confirmacion = $1 WHERE IdAlumno = $2 RETURNING *";
    const values = [student.Confirmacion, id];
    const result = await pool.query(query, values);
    return result.rows[0] as StudentData;
  }

  static async delete(id: string) {
    const query = "DELETE FROM Alumno WHERE IdAlumno = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as StudentData;
  }

  // Related queries
  static async findWithUser(id: string) {
    const query = `
      SELECT a.*, u.* 
      FROM Alumno a 
      JOIN Usuario u ON a.IdAlumno = u.IdUsuario 
      WHERE a.IdAlumno = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] as StudentWithUser;
  }

  static async findWithRequests(id: string) {
    const query = `
      SELECT a.*, s.* 
      FROM Alumno a 
      LEFT JOIN Solicitud s ON a.IdAlumno = s.IdAlumno 
      WHERE a.IdAlumno = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows as StudentWithRequest[];
  }

  // Método específico para confirmar horario
  static async confirmSchedule(id: string) {
    const query =
      "UPDATE Alumno SET Confirmacion = TRUE WHERE IdAlumno = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0] as StudentData;
  }

  // Actualiza todos los registros de la tabla Alumno y pone Confirmacion en TRUE
  static async confirmAllSchedules() {
    const query = "UPDATE Alumno SET Confirmacion = TRUE RETURNING *";
    const result = await pool.query(query);
    return result.rows as StudentData[];
  }

  // Verifica si un usuario existe en la tabla users y lo crea si no existe
  static async ensureUserExists(studentId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      // Verificar si el estudiante existe en la tabla users
      const checkUserQuery = 'SELECT * FROM users WHERE ivd_id = $1';
      const userExists = await client.query(checkUserQuery, [studentId]);
      
      // Si ya existe, simplemente retornamos true
      if (userExists.rows.length > 0) {
        return true;
      }
      
      // Si no existe, lo creamos con un password por defecto
      const defaultPassword = '$2a$10$z6LUMa/LE79.A3dOEmUF6.j54y.gf2dH0s9/lZ8hQcZZvkY3mYjam';
      
      // Insertar en la tabla users
      const insertUserQuery = `
        INSERT INTO users (ivd_id, password, created_at, updated_at) 
        VALUES ($1, $2, NOW(), NOW())
        RETURNING id
      `;
      
      await client.query(insertUserQuery, [studentId, defaultPassword]);
      console.log(`Created user entry for ${studentId}`);
      return true;
    } catch (error) {
      console.error(`Error ensuring user exists for ${studentId}:`, error);
      return false;
    } finally {
      client.release();
    }
  }
  
  // Asigna horarios a un estudiante según su semestre
  static async assignScheduleBySemester(studentId: string, semester: number): Promise<{ success: boolean, groupsAssigned: number }> {
    const client = await pool.connect();
    let success = false;
    let groupsAssigned = 0;
    
    try {
      await client.query('BEGIN');
      
      // Borrar horarios existentes para el estudiante
      const deleteQuery = 'DELETE FROM Horario WHERE idAlumno = $1';
      await client.query(deleteQuery, [studentId]);
      
      // Obtener los grupos correspondientes al semestre del estudiante
      const getGroupsQuery = `
        SELECT g.IdGrupo 
        FROM Grupo g
        JOIN Materia m ON g.IdMateria = m.IdMateria
        WHERE m.Semestre = $1
      `;
      
      const groupsResult = await client.query(getGroupsQuery, [semester]);
      const currentDate = new Date();
      
      // Insertar los horarios para cada grupo del semestre del estudiante
      if (groupsResult.rows.length > 0) {
        for (const group of groupsResult.rows) {
          // Asegurarnos de acceder correctamente a la propiedad idgrupo
          const groupId = group.idgrupo || group.IdGrupo;
          if (groupId) {
            const insertQuery = `
              INSERT INTO Horario (fecha, idGrupo, idAlumno)
              VALUES ($1, $2, $3)
            `;
            await client.query(insertQuery, [currentDate, groupId, studentId]);
            groupsAssigned++;
          }
        }
      }
      
      await client.query('COMMIT');
      success = true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error assigning schedule for student ${studentId}:`, error);
      success = false;
    } finally {
      client.release();
    }
    
    return { success, groupsAssigned };
  }
  
  // Método completo para confirmar estudiante y asignar horario
  static async confirmStudentWithSchedule(studentId: string, semester: number): Promise<{ 
    success: boolean, 
    message: string 
  }> {
    try {
      // Paso 1: Asegurar que el usuario existe en la tabla users
      const userExists = await this.ensureUserExists(studentId);
      if (!userExists) {
        return { 
          success: false, 
          message: `Failed to ensure user exists for student ${studentId}` 
        };
      }
      
      // Paso 2: Verificar si el estudiante ya existe en la tabla Alumno
      const student = await this.findById(studentId);
      
      if (!student) {
        // Si no existe, crear un nuevo registro
        await this.create({
          IdAlumno: studentId,
          Confirmacion: true
        });
      } else {
        // Si existe, actualizar el estado a confirmado
        await this.confirmSchedule(studentId);
      }
      
      // Paso 3: Asignar horarios según el semestre
      const { success, groupsAssigned } = await this.assignScheduleBySemester(studentId, semester);
      
      if (!success) {
        return { 
          success: false, 
          message: `Failed to assign schedule for student ${studentId}` 
        };
      }
      
      return { 
        success: true, 
        message: `Successfully processed student ${studentId} with ${groupsAssigned} groups assigned` 
      };
    } catch (error) {
      console.error(`Error in confirmStudentWithSchedule for ${studentId}:`, error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error processing student' 
      };
    }
  }

  // Verifica si un estudiante existe en la tabla Alumno
  static async checkExists(studentId: string) {
    const query = 'SELECT * FROM Alumno WHERE IdAlumno = $1';
    const result = await pool.query(query, [studentId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Crear un nuevo registro de estudiante con confirmación
  static async createWithStatus(studentId: string, confirmation: boolean = false) {
    const query = 'INSERT INTO Alumno (IdAlumno, Confirmacion) VALUES ($1, $2) RETURNING *';
    const result = await pool.query(query, [studentId, confirmation]);
    return result.rows[0];
  }
}

export default Student;
