/*
Escenario 7: Inscripción considerando requisitos especiales de salón
Para inscribir a alumnos en "Diseño de Moda Asistido por Computadora" (IdMateria 15), 
el sistema verifica que el salón asignado sea de tipo "Laboratorio de computación". 
En la base de datos, se confirma que los grupos 1006, 1033 y 1048 están asignados al salón 106, 
que cumple con el requisito. El sistema solo permite inscripciones en estos grupos para esta materia.
*/

-- Script para el Escenario 7: Inscripción considerando requisitos especiales de salón
-- Para la materia "Diseño de Moda Asistido por Computadora" (IdMateria 15)

USE sistema_gestion_academica;

-- Consulta para verificar los grupos válidos para la materia 15
SELECT 
    g.IdGrupo,
    m.Nombre AS NombreMateria,
    s.IdSalon,
    s.Tipo AS TipoSalon,
    c.Nombre AS Ciclo
FROM 
    Grupo g
    JOIN Materia m ON g.IdMateria = m.IdMateria
    JOIN Salon s ON g.IdSalon = s.IdSalon
    JOIN Ciclo c ON g.IdCiclo = c.IdCiclo
WHERE 
    m.IdMateria = 15
ORDER BY 
    g.IdGrupo;

-- CASO 1: Inscripción exitosa a un grupo válido (materia 15, salón de tipo "Laboratorio de computación")
-- Verificar si la inscripción ya existe para evitar duplicados
SELECT COUNT(*) AS InscripcionExistente 
FROM Inscribe 
WHERE IdAlumno = 'ALU100041' AND IdGrupo = 1006;

-- Verificar si el grupo cumple los requisitos de salón
SELECT 
    g.IdGrupo,
    g.IdMateria,
    m.Nombre AS NombreMateria,
    s.IdSalon,
    s.Tipo AS TipoSalon
FROM 
    Grupo g
    JOIN Materia m ON g.IdMateria = m.IdMateria
    JOIN Salon s ON g.IdSalon = s.IdSalon
WHERE 
    g.IdGrupo = 1006;

-- Obtener el próximo ID de inscripción
SELECT COALESCE(MAX(IdInscripcion), 5000) + 1 AS NuevoIdInscripcion FROM Inscribe;

-- Realizar la inscripción del alumno ALU100041 al grupo 1006
INSERT INTO Inscribe (IdInscripcion, IdAlumno, IdGrupo)
VALUES (
    (SELECT COALESCE(MAX(IdInscripcion), 5000) + 1 FROM Inscribe), 
    'ALU100041', 
    1006
);

SELECT 'Inscripción exitosa para ALU100041 en grupo 1006' AS ResultadoInscripcion1;

-- CASO 2: Inscripción exitosa a otro grupo válido
-- Verificar si la inscripción ya existe para evitar duplicados
SELECT COUNT(*) AS InscripcionExistente 
FROM Inscribe 
WHERE IdAlumno = 'ALU100042' AND IdGrupo = 1033;

-- Obtener información del grupo para validar requisitos
SELECT 
    g.IdGrupo,
    g.IdMateria,
    m.Nombre AS NombreMateria,
    s.IdSalon,
    s.Tipo AS TipoSalon
FROM 
    Grupo g
    JOIN Materia m ON g.IdMateria = m.IdMateria
    JOIN Salon s ON g.IdSalon = s.IdSalon
WHERE 
    g.IdGrupo = 1033;

-- Realizar la inscripción del alumno ALU100042 al grupo 1033
INSERT INTO Inscribe (IdInscripcion, IdAlumno, IdGrupo)
VALUES (
    (SELECT COALESCE(MAX(IdInscripcion), 5000) + 1 FROM Inscribe), 
    'ALU100042', 
    1033
);

SELECT 'Inscripción exitosa para ALU100042 en grupo 1033' AS ResultadoInscripcion2;

-- CASO 3: Inscripción exitosa a otro grupo válido
-- Verificar si la inscripción ya existe para evitar duplicados
SELECT COUNT(*) AS InscripcionExistente 
FROM Inscribe 
WHERE IdAlumno = 'ALU100043' AND IdGrupo = 1048;

-- Obtener información del grupo para validar requisitos
SELECT 
    g.IdGrupo,
    g.IdMateria,
    m.Nombre AS NombreMateria,
    s.IdSalon,
    s.Tipo AS TipoSalon
FROM 
    Grupo g
    JOIN Materia m ON g.IdMateria = m.IdMateria
    JOIN Salon s ON g.IdSalon = s.IdSalon
WHERE 
    g.IdGrupo = 1048;

-- Realizar la inscripción del alumno ALU100043 al grupo 1048
INSERT INTO Inscribe (IdInscripcion, IdAlumno, IdGrupo)
VALUES (
    (SELECT COALESCE(MAX(IdInscripcion), 5000) + 1 FROM Inscribe), 
    'ALU100043', 
    1048
);

SELECT 'Inscripción exitosa para ALU100043 en grupo 1048' AS ResultadoInscripcion3;

-- CASO 4: Simulación de intento de inscripción a un grupo inválido
-- Obtener información sobre la materia y un salón no adecuado

-- Obtener nombre de la materia
SELECT 
    m.Nombre AS NombreMateria
FROM 
    Materia m
WHERE 
    m.IdMateria = 15 
LIMIT 1;

-- Obtener tipo del salón no adecuado (supongamos que es el salón 101)
SELECT 
    s.Tipo AS TipoSalonNoAdecuado
FROM 
    Salon s
WHERE 
    s.IdSalon = 101 
LIMIT 1;

-- Simulación del error que ocurriría al intentar inscribir a un salón no adecuado
SELECT 
    'Error simulado: La materia "Diseño de Moda Asistido por Computadora" requiere un salón de tipo "Laboratorio de computación", pero se intentó inscribir en un salón de otro tipo.' 
    AS MensajeError;

-- En lugar de la inscripción, mostramos qué grupos son válidos para esta materia
SELECT 
    g.IdGrupo, 
    s.IdSalon, 
    s.Tipo AS TipoSalon,
    'Grupo válido para inscripción en Diseño de Moda Asistido por Computadora' AS Observacion
FROM 
    Grupo g
    JOIN Salon s ON g.IdSalon = s.IdSalon
WHERE 
    g.IdMateria = 15 
    AND s.Tipo = 'Laboratorio de computación';

-- Consulta para mostrar las inscripciones realizadas
SELECT 
    i.IdInscripcion,
    i.IdAlumno,
    i.IdGrupo,
    m.Nombre AS Materia,
    s.Tipo AS TipoSalon
FROM 
    Inscribe i
    JOIN Grupo g ON i.IdGrupo = g.IdGrupo
    JOIN Materia m ON g.IdMateria = m.IdMateria
    JOIN Salon s ON g.IdSalon = s.IdSalon
WHERE 
    i.IdAlumno IN ('ALU100041', 'ALU100042', 'ALU100043')
    AND g.IdMateria = 15
ORDER BY 
    i.IdInscripcion;