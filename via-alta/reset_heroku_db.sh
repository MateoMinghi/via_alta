#!/bin/bash

# Set default retry values
MAX_RETRIES=3
RETRY_DELAY=5

echo "Dropping all tables from Heroku database..."

# Function to execute a Heroku command with retries
execute_with_retry() {
  local cmd=$1
  local attempt=1
  
  while [ $attempt -le $MAX_RETRIES ]; do
    echo "Attempt $attempt of $MAX_RETRIES: $cmd"
    
    if eval "$cmd"; then
      return 0
    else
      echo "Attempt $attempt failed. Waiting $RETRY_DELAY seconds before retrying..."
      sleep $RETRY_DELAY
      attempt=$((attempt + 1))
    fi
  done
  
  echo "All attempts failed. Please check your network connection and Heroku database status."
  return 1
}

# First, set the statement timeout
execute_with_retry "heroku pg:psql -a ivd-inscripciones-ceams -c \"SET statement_timeout = '60s';\""
if [ $? -ne 0 ]; then
  echo "Failed to set statement timeout. Exiting."
  exit 1
fi

# Execute drop tables with retries
execute_with_retry "heroku pg:psql -a ivd-inscripciones-ceams -f src/lib/migrations/drop_tables.sql"
if [ $? -ne 0 ]; then
  echo "Failed to drop tables. Exiting."
  exit 1
fi

echo "Creating new tables in Heroku database..."

# Execute create tables with retries
execute_with_retry "heroku pg:psql -a ivd-inscripciones-ceams -f src/lib/migrations/database_creation.sql" 
if [ $? -ne 0 ]; then
  echo "Failed to create tables. Exiting."
  exit 1
fi

echo "Database reset completed!"
