/*
Escenario 2: Verificación de prerequisitos
La alumna 'ALU100031' intenta inscribirse en el grupo 1037 (Ilustración Técnica II). El sistema consulta la tabla Prerequisito 
y detecta que necesita haber aprobado Ilustración Técnica I (IdMateria 11). La alumna ya tiene registrada la materia prerequisito 
en su historial (inscripción 5027), por lo que el sistema permite la inscripción. En contraste, cuando 'ALU100039' intenta inscribirse 
en la misma materia sin haber cursado el prerequisito, el sistema rechaza la solicitud y genera un registro en Solicitud (ID 413).
*/

USE sistema_gestion_academica;

-- Variables para el segundo escenario
SET @alumno1 = 'ALU100031';
SET @alumno2 = 'ALU100039';
SET @grupo = 1037;
SET @solicitud_id = 413;

-- Obtener información del grupo y materia
SET @materia_id = (
    SELECT g.IdMateria
    FROM Grupo g
    WHERE g.IdGrupo = @grupo
);

SET @materia_nombre = (
    SELECT m.Nombre
    FROM Materia m
    WHERE m.IdMateria = @materia_id
);

-- Obtener información del prerequisito
SET @prerequisito_id = (
    SELECT p.IdPrerequisito
    FROM Prerequisito p
    WHERE p.IdMateria = @materia_id
);

SET @prerequisito_nombre = (
    SELECT m.Nombre
    FROM Materia m
    WHERE m.IdMateria = @prerequisito_id
);

-- Verificar si ALU100031 cumple con el prerequisito
SET @alumno1_cumple = (
    SELECT EXISTS (
        SELECT 1
        FROM Inscribe i
        JOIN Grupo g ON i.IdGrupo = g.IdGrupo
        WHERE i.IdAlumno = @alumno1
        AND g.IdMateria = @prerequisito_id
    )
);

-- Verificar si ALU100039 cumple con el prerequisito
SET @alumno2_cumple = (
    SELECT EXISTS (
        SELECT 1
        FROM Inscribe i
        JOIN Grupo g ON i.IdGrupo = g.IdGrupo
        WHERE i.IdAlumno = @alumno2
        AND g.IdMateria = @prerequisito_id
    )
);

-- Mostrar información del escenario
SELECT 
    @grupo AS IdGrupo,
    @materia_nombre AS Materia, 
    @prerequisito_id AS IdPrerequisito,
    @prerequisito_nombre AS NombrePrerequisito;

-- Procesar la inscripción de ALU100031
SELECT 'Procesando inscripción para ALU100031' AS Mensaje;

-- Verificar si el alumno1 ya está inscrito
SET @alumno1_inscrito = (
    SELECT EXISTS (
        SELECT 1 FROM Inscribe 
        WHERE IdAlumno = @alumno1 
        AND IdGrupo = @grupo
    )
);

-- Mostrar resultados para alumno1
SELECT 
    CASE 
        WHEN @alumno1_inscrito = 1 THEN 'El alumno ALU100031 ya está inscrito en este grupo'
        WHEN @alumno1_cumple = 1 THEN 'Inscripción exitosa para ALU100031'
        ELSE 'Inscripción rechazada para ALU100031'
    END AS Resultado,
    CASE 
        WHEN @alumno1_cumple = 1 THEN 'La alumna tiene registrada la materia prerequisito (Inscripción 5027)'
        WHEN @alumno1_cumple = 0 THEN 'La alumna no cumple con el prerequisito requerido'
        ELSE ''
    END AS Motivo;

-- Realizar la inscripción del alumno1 si cumple con los requisitos y no está inscrito
SET @next_inscripcion_id = (
    SELECT COALESCE(MAX(IdInscripcion), 5000) + 1 
    FROM Inscribe
);

INSERT INTO Inscribe (IdInscripcion, IdAlumno, IdGrupo)
SELECT @next_inscripcion_id, @alumno1, @grupo
WHERE @alumno1_cumple = 1 AND @alumno1_inscrito = 0;

-- Procesar la inscripción de ALU100039
SELECT 'Procesando inscripción para ALU100039' AS Mensaje;

-- Verificar si el alumno2 ya está inscrito
SET @alumno2_inscrito = (
    SELECT EXISTS (
        SELECT 1 FROM Inscribe 
        WHERE IdAlumno = @alumno2 
        AND IdGrupo = @grupo
    )
);

-- Verificar si ya existe la solicitud con ID 413
SET @solicitud_existe = (
    SELECT EXISTS (
        SELECT 1 FROM Solicitud
        WHERE IdSolicitud = @solicitud_id
        AND IdAlumno = @alumno2
    )
);

-- Mostrar resultados para alumno2
SELECT 
    CASE 
        WHEN @alumno2_inscrito = 1 THEN 'El alumno ALU100039 ya está inscrito en este grupo'
        WHEN @alumno2_cumple = 1 THEN 'Inscripción exitosa para ALU100039'
        ELSE 'Inscripción rechazada para ALU100039'
    END AS Resultado,
    CASE 
        WHEN @alumno2_cumple = 0 THEN 'El alumno no ha cursado el prerequisito'
        ELSE ''
    END AS Motivo,
    CASE 
        WHEN @alumno2_cumple = 0 AND @solicitud_existe = 1 THEN CONCAT('Ya existe una solicitud rechazada con ID ', @solicitud_id)
        WHEN @alumno2_cumple = 0 AND @solicitud_existe = 0 THEN CONCAT('Se ha generado una solicitud rechazada con ID ', @solicitud_id)
        ELSE ''
    END AS Detalle;

-- Realizar la inscripción del alumno2 si cumple con los requisitos y no está inscrito
SET @next_inscripcion_id2 = (
    SELECT COALESCE(MAX(IdInscripcion), 5000) + 1 
    FROM Inscribe
);

INSERT INTO Inscribe (IdInscripcion, IdAlumno, IdGrupo)
SELECT @next_inscripcion_id2, @alumno2, @grupo
WHERE @alumno2_cumple = 1 AND @alumno2_inscrito = 0;

-- Crear la solicitud rechazada para alumno2 si no cumple con los requisitos y no existe la solicitud
INSERT INTO Solicitud (IdSolicitud, Fecha, Estado, Descripcion, IdAlumno)
SELECT 
    @solicitud_id,
    '2025-01-17',
    'Rechazada',
    'Solicitud de inscripción a materias con prerrequisitos no cumplidos',
    @alumno2
WHERE @alumno2_cumple = 0 AND @solicitud_existe = 0;