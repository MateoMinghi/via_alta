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
 * Function to initialize database and populate tables with group data
 */
async function initializeDatabaseWithGroups() {
  console.log('Initializing and populating database tables...');
  
  try {
    // Step 1: Read the database creation SQL file
    const migrationsDir = path.join(__dirname, 'migrations');
    const databaseCreationSQL = fs.readFileSync(
      path.join(migrationsDir, 'database_creation.sql'),
      'utf8'
    );
    
    // Step 2: Execute the database creation SQL
    console.log('Creating database tables...');
    await pool.query(databaseCreationSQL);
    console.log('✅ Database tables created successfully');
    
    // Step 3: Read the tables_for_groups SQL file
    const tablesForGroupsSQL = fs.readFileSync(
      path.join(migrationsDir, 'tables_for_groups.sql'),
      'utf8'
    );
    
    // Step 4: Execute the tables_for_groups SQL to populate the tables
    console.log('Populating tables with group data...');
    await pool.query(tablesForGroupsSQL);
    console.log('✅ Tables populated with group data successfully');
    
  } catch (error) {
    console.error('Error initializing database with groups:', error);
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the initialization
initializeDatabaseWithGroups()
  .then(() => {
    console.log('Database initialization with groups completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to initialize database with groups:', error);
    process.exit(1);
  });