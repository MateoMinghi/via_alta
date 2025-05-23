import pool from "../../config/database";

async function addMetadataToAvailability() {
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if the Metadata column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'disponibilidad' 
      AND column_name = 'metadata'
    `;
    
    const checkResult = await client.query(checkColumnQuery);
    
    // If the column doesn't exist, add it
    if (checkResult.rowCount === 0) {
      console.log('Adding Metadata column to Disponibilidad table...');
      
      const addColumnQuery = `
        ALTER TABLE Disponibilidad
        ADD COLUMN Metadata TEXT NULL
      `;
      
      await client.query(addColumnQuery);
      console.log('Metadata column added successfully.');
    } else {
      console.log('Metadata column already exists in Disponibilidad table.');
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully.');
    
    return { success: true, message: 'Metadata column added to Disponibilidad table' };
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error during migration:', error);
    return { success: false, message: 'Failed to add Metadata column', error };
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

export default addMetadataToAvailability;
