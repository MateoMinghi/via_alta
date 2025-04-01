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
 * Function to initialize database tables required for the password management system
 */
async function initializeDatabase() {
  console.log('Initializing database tables...');
  
  try {
    // Read migration SQL files
    const migrationsDir = path.join(__dirname, 'migrations');
    const usersMigration = fs.readFileSync(
      path.join(migrationsDir, 'create_users_table.sql'),
      'utf8'
    );
    
    const resetTokensMigration = fs.readFileSync(
      path.join(migrationsDir, 'create_password_reset_table.sql'),
      'utf8'
    );
    
    // Execute migrations
    await pool.query(usersMigration);
    console.log('✅ Users table initialized');
    
    await pool.query(resetTokensMigration);
    console.log('✅ Password reset tokens table initialized');
    
    console.log('Database initialization completed successfully');
    
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