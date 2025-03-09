/*
Escenario 9: Gestión de baja de materias
El alumno 'ALU100029' solicita la baja de la materia "Ilustración Técnica I" (Solicitud ID 403). 
El coordinador revisa la solicitud pero la rechaza porque es una materia prerequisito para
 materias avanzadas que el alumno planea cursar. El estado de la solicitud se actualiza a 
 "Rechazada" y se mantiene la inscripción en la tabla Inscribe.
*/

-- Usar la base de datos
USE sistema_gestion_academica;

-- 1. Verificar que el alumno ALU100029 esté inscrito en la materia "Ilustración Técnica I" (IdMateria 11)
-- Primero identificamos los grupos que imparten esta materia
SELECT g.IdGrupo, g.IdMateria, m.Nombre AS NombreMateria
FROM Grupo g
JOIN Materia m ON g.IdMateria = m.IdMateria
WHERE m.IdMateria = 11;

-- Verificar si el alumno está inscrito en alguno de estos grupos
SELECT i.IdInscripcion, i.IdAlumno, i.IdGrupo, g.IdMateria, m.Nombre AS NombreMateria
FROM Inscribe i
JOIN Grupo g ON i.IdGrupo = g.IdGrupo
JOIN Materia m ON g.IdMateria = m.IdMateria
WHERE i.IdAlumno = 'ALU100029' AND g.IdMateria = 11;

-- 2. Verificar que la materia es prerrequisito para otras materias
SELECT p.IdMateria, m1.Nombre AS Materia, p.IdPrerequisito, m2.Nombre AS Prerequisito
FROM Prerequisito p
JOIN Materia m1 ON p.IdMateria = m1.IdMateria
JOIN Materia m2 ON p.IdPrerequisito = m2.IdMateria
WHERE p.IdPrerequisito = 11;

-- 3. Verificar el estado actual de la solicitud 403
SELECT * FROM Solicitud WHERE IdSolicitud = 403;

-- 4. Si el alumno no está inscrito en la materia, podemos insertar una inscripción para simular el escenario
-- (Asumimos que no está inscrito basado en los datos proporcionados)
INSERT INTO Inscribe (IdInscripcion, IdAlumno, IdGrupo)
VALUES (5076, 'ALU100029', 1004);

-- 5. Simulación de la revisión y rechazo de la solicitud por parte del coordinador
-- Actualizamos el estado de la solicitud a "Rechazada" (aunque ya aparece como rechazada en los datos)
UPDATE Solicitud 
SET Estado = 'Rechazada', 
    Descripcion = 'Solicitud de baja de materia Ilustración Técnica I rechazada por ser prerequisito para materias avanzadas'
WHERE IdSolicitud = 403;

-- 6. Verificar que la inscripción se mantiene
SELECT i.IdInscripcion, i.IdAlumno, i.IdGrupo, g.IdMateria, m.Nombre AS NombreMateria
FROM Inscribe i
JOIN Grupo g ON i.IdGrupo = g.IdGrupo
JOIN Materia m ON g.IdMateria = m.IdMateria
WHERE i.IdAlumno = 'ALU100029' AND g.IdMateria = 11;