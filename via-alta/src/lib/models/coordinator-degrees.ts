import pool from "../../config/database";

interface CoordinatorDegreeData {
  coordinator_id: string;
  degree_id: number;
  degree_name: string;
}

class CoordinatorDegree {
  /**
   * Create a new coordinator-degree relationship
   */
  static async create(coordinatorDegree: CoordinatorDegreeData): Promise<CoordinatorDegreeData> {
    const query = `
      INSERT INTO coordinator_degrees (coordinator_id, degree_id, degree_name)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [
        coordinatorDegree.coordinator_id,
        coordinatorDegree.degree_id,
        coordinatorDegree.degree_name
      ]);
      
      return result.rows[0] as CoordinatorDegreeData;
    } catch (error) {
      console.error("Error creating coordinator-degree relationship:", error);
      throw new Error("Failed to create coordinator-degree relationship");
    }
  }

  /**
   * Find degrees managed by a coordinator
   */
  static async findByCoordinatorId(coordinatorId: string): Promise<CoordinatorDegreeData[]> {
    const query = `
      SELECT * FROM coordinator_degrees
      WHERE coordinator_id = $1
      ORDER BY degree_name
    `;
    
    try {
      const result = await pool.query(query, [coordinatorId]);
      return result.rows as CoordinatorDegreeData[];
    } catch (error) {
      console.error("Error finding coordinator degrees:", error);
      throw new Error("Failed to find coordinator degrees");
    }
  }

  /**
   * Delete all degrees for a coordinator (useful when updating)
   */
  static async deleteByCoordinatorId(coordinatorId: string): Promise<void> {
    const query = `
      DELETE FROM coordinator_degrees
      WHERE coordinator_id = $1
    `;
    
    try {
      await pool.query(query, [coordinatorId]);
    } catch (error) {
      console.error("Error deleting coordinator degrees:", error);
      throw new Error("Failed to delete coordinator degrees");
    }
  }

  /**
   * Check if user is coordinator of a specific degree
   */
  static async isCoordinatorOfDegree(coordinatorId: string, degreeId: number): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count FROM coordinator_degrees
      WHERE coordinator_id = $1 AND degree_id = $2
    `;
    
    try {
      const result = await pool.query(query, [coordinatorId, degreeId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error("Error checking coordinator degree:", error);
      throw new Error("Failed to check coordinator degree");
    }
  }
}

export default CoordinatorDegree;