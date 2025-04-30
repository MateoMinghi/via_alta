#!/bin/bash
echo "Dropping all tables from Heroku database..."
heroku pg:psql -a ivd-inscripciones-ceams -f src/lib/migrations/drop_tables.sql

echo "Creating new tables in Heroku database..."
heroku pg:psql -a ivd-inscripciones-ceams -f src/lib/migrations/database_creation.sql

echo "Database reset completed!"
