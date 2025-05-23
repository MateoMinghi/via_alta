import addMetadataToAvailability from '../lib/migrations/add-metadata-to-availability';

async function runMigration() {
  console.log('Starting availability table migration...');
  
  try {
    const result = await addMetadataToAvailability();
    
    if (result.success) {
      console.log('Migration completed successfully.');
      console.log(result.message);
    } else {
      console.error('Migration failed:');
      console.error(result.message);
      console.error(result.error);
    }
  } catch (error) {
    console.error('Unexpected error during migration:', error);
  } finally {
    // Exit the process
    process.exit();
  }
}

// Run the migration
runMigration();
