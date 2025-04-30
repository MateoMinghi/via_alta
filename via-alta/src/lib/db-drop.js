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
 * Function to clear database tables
 */
async function clearDatabase() {
  console.log('Clearing database tables...');
  
  try {
    // Read the SQL file for truncating tables
    const migrationsDir = path.join(__dirname, 'migrations');
    const truncateTablesSQL = fs.readFileSync(
      path.join(migrationsDir, 'truncate_tables.sql'),
      'utf8'
    );
    
    // Execute the SQL
    await pool.query(truncateTablesSQL);
    console.log('✅ Database tables cleared successfully');
    
  } catch (error) {
    console.error('Error clearing database tables:', error);
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the clear operation
clearDatabase()
  .then(() => {
    console.log('Database tables cleared');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to clear database tables:', error);
    process.exit(1);
  });