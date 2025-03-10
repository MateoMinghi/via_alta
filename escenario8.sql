/*
Escenario 8: Inscripción a materias que deben cursarse en simultáneo
Los alumnos 'ALU100037' y 'ALU100038' necesitan inscribirse a "Desarrollo Empresarial" (IdMateria 16) 
y "Desarrollo de Proyecto Integrador" (IdMateria 17). El sistema verifica en la tabla Prerequisito 
que son materias relacionadas (17 requiere 16) y, según las condicionales del documento, deben cursarse 
juntas. El sistema asegura que ambos alumnos estén inscritos en ambas materias (inscripciones 5059-5063 y 5064-5068).
*/

-- 1. Verificar la relación de prerequisito entre las materias 16 y 17
SELECT 'Verificando relación de prerequisito entre materias' AS 'Operación';
SELECT * FROM Prerequisito WHERE IdMateria = 17 AND IdPrerequisito = 16;

-- 2. Verificar que ambos alumnos estén inscritos en ambas materias
SELECT 'Verificando inscripciones actuales de los alumnos' AS 'Operación';

-- Para ALU100037
SELECT a.IdAlumno, m.IdMateria, m.Nombre AS NombreMateria
FROM Alumno a
LEFT JOIN Inscribe i ON a.IdAlumno = i.IdAlumno
LEFT JOIN Grupo g ON i.IdGrupo = g.IdGrupo
LEFT JOIN Materia m ON g.IdMateria = m.IdMateria
WHERE a.IdAlumno = 'ALU100037'
AND m.IdMateria IN (16, 17);

-- Para ALU100038
SELECT a.IdAlumno, m.IdMateria, m.Nombre AS NombreMateria
FROM Alumno a
LEFT JOIN Inscribe i ON a.IdAlumno = i.IdAlumno
LEFT JOIN Grupo g ON i.IdGrupo = g.IdGrupo
LEFT JOIN Materia m ON g.IdMateria = m.IdMateria
WHERE a.IdAlumno = 'ALU100038'
AND m.IdMateria IN (16, 17);

-- 3. Inscribir alumnos en las materias necesarias

-- 3.1 Obtener los grupos disponibles para las materias
SELECT 'Grupos disponibles para inscripción' AS 'Operación';
SELECT g.IdGrupo, m.IdMateria, m.Nombre FROM Grupo g 
JOIN Materia m ON g.IdMateria = m.IdMateria
WHERE m.IdMateria IN (16, 17) AND g.IdCiclo = 3;

-- 3.2 Insertar inscripciones faltantes para ALU100037
SELECT 'Realizando inscripciones para ALU100037' AS 'Operación';

-- Insertar en Desarrollo Empresarial (IdMateria 16) si no está inscrito
INSERT INTO Inscribe (IdInscripcion, IdAlumno, IdGrupo)
SELECT 5059, 'ALU100037', g.IdGrupo
FROM Grupo g
WHERE g.IdMateria = 16 AND g.IdCiclo = 3
AND NOT EXISTS (
    SELECT 1 FROM Inscribe i 
    JOIN Grupo g2 ON i.IdGrupo = g2.IdGrupo 
    WHERE i.IdAlumno = 'ALU100037' AND g2.IdMateria = 16
)
LIMIT 1;

-- Insertar en Desarrollo de Proyecto Integrador (IdMateria 17) si no está inscrito
INSERT INTO Inscribe (IdInscripcion, IdAlumno, IdGrupo)
SELECT 5060, 'ALU100037', g.IdGrupo
FROM Grupo g
WHERE g.IdMateria = 17 AND g.IdCiclo = 3
AND NOT EXISTS (
    SELECT 1 FROM Inscribe i 
    JOIN Grupo g2 ON i.IdGrupo = g2.IdGrupo 
    WHERE i.IdAlumno = 'ALU100037' AND g2.IdMateria = 17
)
LIMIT 1;

-- 3.3 Insertar inscripciones faltantes para ALU100038
SELECT 'Realizando inscripciones para ALU100038' AS 'Operación';

-- Insertar en Desarrollo Empresarial (IdMateria 16) si no está inscrito
INSERT INTO Inscribe (IdInscripcion, IdAlumno, IdGrupo)
SELECT 5064, 'ALU100038', g.IdGrupo
FROM Grupo g
WHERE g.IdMateria = 16 AND g.IdCiclo = 3
AND NOT EXISTS (
    SELECT 1 FROM Inscribe i 
    JOIN Grupo g2 ON i.IdGrupo = g2.IdGrupo 
    WHERE i.IdAlumno = 'ALU100038' AND g2.IdMateria = 16
)
LIMIT 1;

-- Insertar en Desarrollo de Proyecto Integrador (IdMateria 17) si no está inscrito
INSERT INTO Inscribe (IdInscripcion, IdAlumno, IdGrupo)
SELECT 5065, 'ALU100038', g.IdGrupo
FROM Grupo g
WHERE g.IdMateria = 17 AND g.IdCiclo = 3
AND NOT EXISTS (
    SELECT 1 FROM Inscribe i 
    JOIN Grupo g2 ON i.IdGrupo = g2.IdGrupo 
    WHERE i.IdAlumno = 'ALU100038' AND g2.IdMateria = 17
)
LIMIT 1;

-- 4. Verificar el resultado final
SELECT 'Verificando inscripciones finales' AS 'Operación';

-- Mostrar inscripciones finales para ALU100037
SELECT i.IdInscripcion, i.IdAlumno, m.IdMateria, m.Nombre AS NombreMateria
FROM Inscribe i
JOIN Grupo g ON i.IdGrupo = g.IdGrupo
JOIN Materia m ON g.IdMateria = m.IdMateria
WHERE i.IdAlumno = 'ALU100037'
AND m.IdMateria IN (16, 17);

-- Mostrar inscripciones finales para ALU100038
SELECT i.IdInscripcion, i.IdAlumno, m.IdMateria, m.Nombre AS NombreMateria
FROM Inscribe i
JOIN Grupo g ON i.IdGrupo = g.IdGrupo
JOIN Materia m ON g.IdMateria = m.IdMateria
WHERE i.IdAlumno = 'ALU100038'
AND m.IdMateria IN (16, 17);