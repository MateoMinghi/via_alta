/*
Escenario 3: Gestión de solicitudes de cambio de grupo
El alumno 'ALU100027' ha registrado una solicitud (ID 401) para cambiar su inscripción del grupo 1002 (Patronaje Básico) a otro horario. 
El coordinador 'COORD001' revisa la solicitud, confirma que hay cupo disponible en otro grupo, aprueba la solicitud (Estado: 'Aprobada') 
y actualiza el registro correspondiente en la tabla Inscribe.
*/

USE sistema_gestion_academica;

-- Definición de variables para el escenario 3
SET @id_solicitud = 401;
SET @id_alumno = 'ALU100027';
SET @id_coordinador = 'COORD001';
SET @grupo_actual = 1002;

-- Mostrar información inicial
SELECT 'Iniciando proceso de gestión de solicitud de cambio de grupo' AS 'Proceso';
SELECT 'Datos del escenario:' AS 'Información';
SELECT @id_solicitud AS 'ID Solicitud', @id_alumno AS 'ID Alumno', 
       @id_coordinador AS 'Coordinador', @grupo_actual AS 'Grupo Actual';

-- Verificar que la solicitud existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM Solicitud WHERE IdSolicitud = @id_solicitud AND IdAlumno = @id_alumno) 
        THEN 'La solicitud existe' 
        ELSE 'Error: La solicitud especificada no existe o no pertenece al alumno indicado' 
    END AS 'Validación';

-- Obtener información de la inscripción actual
SELECT i.IdInscripcion AS 'ID Inscripción', g.IdMateria AS 'ID Materia',
       m.Nombre AS 'Nombre Materia'
FROM Inscribe i
JOIN Grupo g ON i.IdGrupo = g.IdGrupo
JOIN Materia m ON g.IdMateria = m.IdMateria
WHERE i.IdAlumno = @id_alumno AND i.IdGrupo = @grupo_actual;

-- Guardar la información en variables
SET @id_inscripcion = (
    SELECT i.IdInscripcion
    FROM Inscribe i
    WHERE i.IdAlumno = @id_alumno AND i.IdGrupo = @grupo_actual
);

SET @materia_id = (
    SELECT g.IdMateria
    FROM Grupo g
    JOIN Inscribe i ON g.IdGrupo = i.IdGrupo
    WHERE i.IdAlumno = @id_alumno AND i.IdGrupo = @grupo_actual
);

-- Buscar grupos alternativos de la misma materia con cupo disponible
SELECT g.IdGrupo, g.IdSalon, s.Cupo,
       COUNT(i.IdInscripcion) AS 'Inscritos',
       (s.Cupo - COUNT(i.IdInscripcion)) AS 'Lugares Disponibles'
FROM Grupo g
JOIN Salon s ON g.IdSalon = s.IdSalon
LEFT JOIN Inscribe i ON g.IdGrupo = i.IdGrupo
WHERE g.IdMateria = @materia_id
AND g.IdGrupo != @grupo_actual
GROUP BY g.IdGrupo, g.IdSalon, s.Cupo
HAVING COUNT(i.IdInscripcion) < s.Cupo
ORDER BY g.IdGrupo;

-- Seleccionar un grupo alternativo (el primero disponible)
SET @grupo_nuevo = (
    SELECT g.IdGrupo
    FROM Grupo g
    JOIN Salon s ON g.IdSalon = s.IdSalon
    LEFT JOIN Inscribe i ON g.IdGrupo = i.IdGrupo
    WHERE g.IdMateria = @materia_id
    AND g.IdGrupo != @grupo_actual
    GROUP BY g.IdGrupo, g.IdSalon, s.Cupo
    HAVING COUNT(i.IdInscripcion) < s.Cupo
    ORDER BY g.IdGrupo
    LIMIT 1
);

-- Mostrar mensaje si no se encontraron grupos alternativos
SELECT 
    CASE 
        WHEN @grupo_nuevo IS NULL THEN 'No se encontraron grupos alternativos con cupo disponible'
        ELSE CONCAT('Se encontró el grupo alternativo: ', @grupo_nuevo)
    END AS 'Resultado de búsqueda';

-- Si se encontró un grupo alternativo, mostrar sus detalles
SELECT 
    g.IdGrupo AS 'Nuevo Grupo',
    g.IdSalon AS 'Salón',
    s.Cupo AS 'Cupo Total',
    COUNT(i.IdInscripcion) AS 'Inscritos',
    (s.Cupo - COUNT(i.IdInscripcion)) AS 'Lugares Disponibles'
FROM Grupo g
JOIN Salon s ON g.IdSalon = s.IdSalon
LEFT JOIN Inscribe i ON g.IdGrupo = i.IdGrupo
WHERE g.IdGrupo = @grupo_nuevo
GROUP BY g.IdGrupo, g.IdSalon, s.Cupo;

-- Iniciar la transacción para el cambio de grupo
START TRANSACTION;

-- Actualizar la inscripción para cambiar de grupo
UPDATE Inscribe
SET IdGrupo = @grupo_nuevo
WHERE IdInscripcion = @id_inscripcion
AND @grupo_nuevo IS NOT NULL;

-- Actualizar el estado de la solicitud
UPDATE Solicitud
SET Estado = 'Aprobada'
WHERE IdSolicitud = @id_solicitud
AND @grupo_nuevo IS NOT NULL;

-- Confirmar la transacción
COMMIT;

-- Mostrar resumen del cambio realizado
SELECT 
    CASE
        WHEN @grupo_nuevo IS NULL THEN 'No se pudo realizar el cambio de grupo'
        ELSE 'Cambio de grupo procesado con éxito'
    END AS 'Resultado',
    @id_solicitud AS 'ID Solicitud',
    @id_alumno AS 'ID Alumno',
    (SELECT Nombre FROM Materia WHERE IdMateria = @materia_id) AS 'Materia',
    @grupo_actual AS 'Grupo Anterior',
    @grupo_nuevo AS 'Grupo Nuevo';

-- Mostrar detalle de la inscripción actualizada
SELECT 
    i.IdInscripcion,
    i.IdAlumno,
    i.IdGrupo,
    m.Nombre AS 'Materia',
    CONCAT(p.Nombre, ' (ID: ', p.IdProfesor, ')') AS 'Profesor',
    CONCAT('Salon ', s.IdSalon, ' (Cupo: ', s.Cupo, ')') AS 'Salón',
    c.Nombre AS 'Ciclo'
FROM Inscribe i
JOIN Grupo g ON i.IdGrupo = g.IdGrupo
JOIN Materia m ON g.IdMateria = m.IdMateria
JOIN Profesor p ON g.IdProfesor = p.IdProfesor
JOIN Salon s ON g.IdSalon = s.IdSalon
JOIN Ciclo c ON g.IdCiclo = c.IdCiclo
WHERE i.IdInscripcion = @id_inscripcion;

-- Mostrar estado actual de la solicitud
SELECT 
    IdSolicitud,
    Fecha,
    Estado,
    Descripcion
FROM Solicitud
WHERE IdSolicitud = @id_solicitud;