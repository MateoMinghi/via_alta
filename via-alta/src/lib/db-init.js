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
 * Function to initialize database tables required for the system
 */
async function initializeDatabase() {
  console.log('Initializing database tables...');
  
  try {
    // Read the consolidated SQL file
    const migrationsDir = path.join(__dirname, 'migrations');
    const databaseCreationSQL = fs.readFileSync(
      path.join(migrationsDir, 'database_creation.sql'),
      'utf8'
    );
    
    // Execute the consolidated SQL
    await pool.query(databaseCreationSQL);
    console.log('✅ Database tables initialized successfully');
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the initialization
initializeDatabase()
  .then(() => {
    console.log('Database initialization completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });