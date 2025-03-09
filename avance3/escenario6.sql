/*
Escenario 6: Inscripción en grupos con cupo limitado
La alumna 'ALU100032' desea inscribirse en "Modelado en Maniquí I" (IdMateria 12, grupo 1007) 
pero el salón asignado (107) tiene un cupo limitado a 10 estudiantes. El sistema verifica que ya 
hay 10 alumnos inscritos, por lo que genera una solicitud (ID 406) con estado "Pendiente". 
El coordinador debe decidir si autoriza exceder el cupo o sugerir otro grupo.
*/

-- 1. Verificar que el grupo 1007 ya tiene 10 alumnos inscritos
-- (Asumiendo que ya ejecutamos el script anterior para agregar los 8 estudiantes adicionales)
SELECT 
    g.IdGrupo, 
    m.Nombre AS Materia, 
    s.IdSalon, 
    s.Cupo AS CapacidadSalon, 
    COUNT(i.IdInscripcion) AS AlumnosInscritos
FROM 
    Grupo g
    JOIN Materia m ON g.IdMateria = m.IdMateria
    JOIN Salon s ON g.IdSalon = s.IdSalon
    JOIN Inscribe i ON g.IdGrupo = i.IdGrupo
WHERE 
    g.IdGrupo = 1007
GROUP BY 
    g.IdGrupo, m.Nombre, s.IdSalon, s.Cupo;

-- 2. Obtener información del grupo y comprobar cupo disponible
SELECT 
    g.IdGrupo,
    m.IdMateria,
    m.Nombre AS Materia,
    s.Cupo AS CapacidadSalon,
    (SELECT COUNT(*) FROM Inscribe WHERE IdGrupo = g.IdGrupo) AS AlumnosInscritos,
    s.Cupo - (SELECT COUNT(*) FROM Inscribe WHERE IdGrupo = g.IdGrupo) AS CupoDisponible
FROM 
    Grupo g
    JOIN Materia m ON g.IdMateria = m.IdMateria
    JOIN Salon s ON g.IdSalon = s.IdSalon
WHERE 
    g.IdGrupo = 1007;
    
-- 3. Comprobar si hay cupo disponible e inscribir o generar solicitud según corresponda
-- Asumiendo que la consulta anterior muestra CupoDisponible <= 0, se genera una solicitud

-- Generar solicitud debido a que el grupo está lleno
INSERT INTO Solicitud (IdSolicitud, Fecha, Estado, Descripcion, IdAlumno)
VALUES (
    406, 
    CURDATE(), 
    'Pendiente', 
    'Solicitud de inscripción a grupo completo de Modelado en Maniquí I',
    'ALU100032'
);

-- 4. Verificar que la solicitud fue creada
SELECT * FROM Solicitud WHERE IdSolicitud = 406;

-- 5. Decisión del coordinador: Autorizar inscripción excepcional
-- (Esto lo ejecutaría el coordinador si decide aprobar la solicitud)
UPDATE Solicitud 
SET Estado = 'Aprobada' 
WHERE IdSolicitud = 406;

-- Si el coordinador aprueba, inscribir al alumno a pesar del cupo lleno
INSERT INTO Inscribe (IdInscripcion, IdAlumno, IdGrupo)
VALUES (5084, 'ALU100032', 1007);

-- 6. Decisión alternativa: Sugerir otro grupo
-- (Esto lo ejecutaría el coordinador si decide sugerir otro grupo)
-- Buscar grupos alternativos de la misma materia
SELECT 
    g.IdGrupo, 
    p.Nombre AS Profesor, 
    s.IdSalon,
    s.Cupo, 
    COUNT(i.IdInscripcion) AS AlumnosInscritos,
    s.Cupo - COUNT(i.IdInscripcion) AS CupoDisponible
FROM 
    Grupo g
    JOIN Materia m ON g.IdMateria = m.IdMateria
    JOIN Profesor p ON g.IdProfesor = p.IdProfesor
    JOIN Salon s ON g.IdSalon = s.IdSalon
    LEFT JOIN Inscribe i ON g.IdGrupo = i.IdGrupo
WHERE 
    g.IdMateria = 12  -- Modelado en Maniquí I
    AND g.IdGrupo <> 1007  -- Excluimos el grupo lleno
GROUP BY 
    g.IdGrupo, p.Nombre, s.IdSalon, s.Cupo
HAVING 
    CupoDisponible > 0;  -- Solo grupos con espacio