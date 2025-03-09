/*
Escenario 10: Confirmación de inscripción
Después de completar su proceso de inscripción, el alumno 'ALU100040' debe confirmar su horario. 
Sin embargo, su campo Confirmacion en la tabla Alumno está en FALSE. El coordinador contacta al 
alumno para que confirme su inscripción, y una vez recibida la confirmación, actualiza el valor a 
TRUE en la base de datos.
*/

-- Primero, verificamos el estado actual de confirmación del alumno
SELECT IdAlumno, Confirmacion 
FROM Alumno 
WHERE IdAlumno = 'ALU100040';

-- Verificamos las inscripciones actuales del alumno para tener constancia de su horario
SELECT i.IdInscripcion, g.IdGrupo, m.Nombre AS Materia, p.Nombre AS Profesor,
       s.IdSalon, s.Tipo AS TipoSalon, c.Nombre AS Ciclo
FROM Inscribe i
JOIN Grupo g ON i.IdGrupo = g.IdGrupo
JOIN Materia m ON g.IdMateria = m.IdMateria
JOIN Profesor p ON g.IdProfesor = p.IdProfesor
JOIN Salon s ON g.IdSalon = s.IdSalon
JOIN Ciclo c ON g.IdCiclo = c.IdCiclo
WHERE i.IdAlumno = 'ALU100040';

-- Ahora actualizamos el campo Confirmacion a TRUE
UPDATE Alumno
SET Confirmacion = TRUE
WHERE IdAlumno = 'ALU100040';

-- Verificamos que el cambio se ha realizado correctamente
SELECT IdAlumno, Confirmacion 
FROM Alumno 
WHERE IdAlumno = 'ALU100040';

-- Como alternativa, podemos crear un registro en la tabla de Solicitud para documentar esta acción
INSERT INTO Solicitud (IdSolicitud, Fecha, Estado, Descripcion, IdAlumno)
VALUES (
    451, -- Asumimos que el último ID de solicitud era 450
    CURRENT_DATE(), 
    'Aprobada', 
    'Confirmación de inscripción en el sistema académico', 
    'ALU100040'
);