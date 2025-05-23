const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Create a pool connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Function to update professor classes
 */
async function updateProfessorClasses() {
  console.log('Updating professor classes...');
  
  try {
    // Read the SQL file
    const migrationsDir = path.join(__dirname, 'migrations');
    const updateSQL = fs.readFileSync(
      path.join(migrationsDir, 'update_profesores.sql'),
      'utf8'
    );
    
    // Execute the update SQL
    await pool.query(updateSQL);
    console.log('✅ Professor classes updated successfully');
    
  } catch (error) {
    console.error('Error updating professor classes:', error);
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the update
updateProfessorClasses()
  .then(() => {
    console.log('Professor update completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to update professors:', error);
    process.exit(1);
  });
