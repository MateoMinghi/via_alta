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
 * Function to delete (drop) all database tables
 */
async function deleteDatabase() {
  console.log('Deleting all database tables...');
  
  try {
    // Read the SQL file for dropping tables
    const migrationsDir = path.join(__dirname, 'migrations');
    const dropTablesSQL = fs.readFileSync(
      path.join(migrationsDir, 'drop_tables.sql'),
      'utf8'
    );
    
    // Execute the SQL
    await pool.query(dropTablesSQL);
    console.log('✅ All database tables deleted successfully');
    
  } catch (error) {
    console.error('Error deleting database tables:', error);
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the delete operation
deleteDatabase()
  .then(() => {
    console.log('Database tables deletion completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to delete database tables:', error);
    process.exit(1);
  });