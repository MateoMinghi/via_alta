-- Add Clases column to Profesor table
ALTER TABLE Profesor ADD COLUMN IF NOT EXISTS Clases TEXT DEFAULT '';

-- Update existing records to have an empty string for Clases
UPDATE Profesor SET Clases = '' WHERE Clases IS NULL;