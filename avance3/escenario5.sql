/*
Escenario 5: Manejo de inscripciones tardías
El alumno 'ALU100031' ha solicitado una inscripción tardía (Solicitud ID 405) para la materia 
"Sistemas de Producción" (IdMateria 13). El coordinador aprueba la solicitud y crea una nueva 
inscripción en la tabla Inscribe, asociando al alumno con el grupo 1008 o 1034, verificando 
previamente que no haya conflictos de horario con sus otras materias inscritas (5027-5031).
*/
USE sistema_gestion_academica;

-- 1. Primero, verificamos en qué ciclo está actualmente inscrito el alumno
SELECT DISTINCT c.IdCiclo, c.Nombre 
FROM Inscribe i
JOIN Grupo g ON i.IdGrupo = g.IdGrupo
JOIN Ciclo c ON g.IdCiclo = c.IdCiclo
WHERE i.IdAlumno = 'ALU100031';

-- 2. Verificamos los grupos disponibles para Sistemas de Producción (materia 13)
-- y sus respectivos horarios
SELECT 
    g.IdGrupo,
    m.Nombre AS 'Materia',
    c.Nombre AS 'Ciclo',
    p.Nombre AS 'Profesor',
    d.Dia,
    d.HoraInicio,
    d.HoraFin,
    s.Tipo AS 'TipoSalon'
FROM Grupo g
JOIN Materia m ON g.IdMateria = m.IdMateria
JOIN Profesor p ON g.IdProfesor = p.IdProfesor
JOIN Ciclo c ON g.IdCiclo = c.IdCiclo
JOIN Salon s ON g.IdSalon = s.IdSalon
JOIN Disponibilidad d ON p.IdProfesor = d.IdProfesor
WHERE g.IdMateria = 13
AND (g.IdGrupo = 1008 OR g.IdGrupo = 1034);

-- 3. Verificamos los horarios actuales del alumno para detectar posibles conflictos
SELECT 
    i.IdGrupo,
    m.Nombre AS 'Materia',
    d.Dia,
    d.HoraInicio,
    d.HoraFin
FROM Inscribe i
JOIN Grupo g ON i.IdGrupo = g.IdGrupo
JOIN Materia m ON g.IdMateria = m.IdMateria
JOIN Profesor p ON g.IdProfesor = p.IdProfesor
JOIN Disponibilidad d ON p.IdProfesor = d.IdProfesor
WHERE i.IdAlumno = 'ALU100031';

-- 4. En base a los resultados de las consultas anteriores, seleccionamos el grupo adecuado
-- Suponiendo que el grupo 1008 es compatible con los horarios del alumno y pertenece al ciclo actual

-- 5. Generamos un nuevo ID de inscripción (siguiente al máximo existente)
SELECT MAX(IdInscripcion) + 1 AS 'NuevoIdInscripcion' FROM Inscribe;

-- 6. Insertamos la nueva inscripción
-- (Suponiendo que el nuevo ID de inscripción será 5076)
INSERT INTO Inscribe (IdInscripcion, IdAlumno, IdGrupo)
VALUES (5076, 'ALU100031', 1008);

-- 7. Verificamos que la inscripción se haya realizado correctamente
SELECT * FROM Inscribe WHERE IdAlumno = 'ALU100031' AND IdGrupo = 1008;

-- 8. Actualizamos el estado de la solicitud (aunque ya está marcada como Aprobada)
-- Esta línea es opcional ya que la solicitud ya tiene estado 'Aprobada'
-- UPDATE Solicitud SET Estado = 'Completada' WHERE IdSolicitud = 405;

-- 9. Imprimir mensaje de confirmación
SELECT 'Inscripción tardía del alumno ALU100031 en Sistemas de Producción (Grupo 1008) realizada con éxito' AS 'Mensaje de Confirmación';