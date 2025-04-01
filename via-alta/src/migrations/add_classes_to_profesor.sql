-- Añade la columna 'Clases' a la tabla 'Profesor' si no existe
-- La columna 'Clases' es de tipo TEXT y su valor predeterminado es una cadena vacía ('')
ALTER TABLE Profesor ADD COLUMN IF NOT EXISTS Clases TEXT DEFAULT '';

-- Actualiza los registros existentes en la tabla 'Profesor' para establecer el valor de 'Clases' como una cadena vacía ('') 
-- donde el valor de 'Clases' sea NULL
UPDATE Profesor SET Clases = '' WHERE Clases IS NULL;
