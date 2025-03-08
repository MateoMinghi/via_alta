/*
Escenario 4: Verificación de disponibilidad de profesores
El coordinador planea abrir un nuevo grupo para la materia "Diseño de Accesorios" (IdMateria 20) 
con el profesor "Valentina Fuentes" (IdProfesor 300116). El sistema consulta la tabla Disponibilidad 
y encuentra los registros 1026, 1027 y 1028, que indican que la profesora está disponible martes, miércoles 
y jueves de 15:00 a 19:00. El coordinador programa el grupo para los martes a las 16:00, y el sistema crea 
un nuevo registro en la tabla Grupo.
*/

USE sistema_gestion_academica;

-- 1. Verificar que la materia exista (IdMateria 20)
SELECT * FROM Materia WHERE IdMateria = 20;

-- 2. Verificar que la profesora exista (IdProfesor 300116)
SELECT * FROM Profesor WHERE IdProfesor = 300116;

-- 3. Consultar disponibilidad de la profesora
SELECT * FROM Disponibilidad 
WHERE IdProfesor = 300116
ORDER BY Dia, HoraInicio;

-- 4. Verificar si tiene disponibilidad el martes a las 16:00
-- (Debe estar entre HoraInicio y HoraFin)
SELECT * FROM Disponibilidad 
WHERE IdProfesor = 300116
AND Dia = 'Martes' 
AND '16:00:00' BETWEEN HoraInicio AND HoraFin;

-- 5. Seleccionar un salón apropiado para la materia
-- Primero revisamos el tipo de salón que requiere la materia
SELECT Requisitos FROM Materia WHERE IdMateria = 20;

-- 6. Buscar un salón del tipo adecuado y con capacidad suficiente
-- Como la materia "Diseño de Accesorios" utiliza "Taller manual" (según los datos de muestra)
SELECT * FROM Salon 
WHERE Tipo = 'Taller manual' 
AND Cupo >= 15 -- Supongamos que necesitamos capacidad para 15 estudiantes
LIMIT 1;

-- 7. Seleccionar el ciclo académico actual para asignar el grupo
SELECT * FROM Ciclo 
WHERE CURRENT_DATE() BETWEEN FechaInicio AND FechaFin
LIMIT 1;

-- 8. Obtener el siguiente ID de grupo disponible
SELECT MAX(IdGrupo) + 1 AS NuevoIdGrupo FROM Grupo;

-- 9. Crear el nuevo grupo
-- Nota: En una aplicación real, los valores se obtendrían de las consultas anteriores.
-- Para este ejemplo, utilizaremos los valores conocidos del escenario.
INSERT INTO Grupo (IdGrupo, IdMateria, IdProfesor, IdSalon, IdCiclo)
VALUES (
    1051, -- Siguiente ID disponible según nuestra muestra de datos (después de 1050)
    20,   -- IdMateria para "Diseño de Accesorios"
    300116, -- IdProfesor para "Valentina Fuentes"
    103,  -- IdSalon para un "Taller manual" (según datos de muestra)
    1     -- IdCiclo para "Primavera 2025" (según datos de muestra)
);

-- 10. Verificar que el grupo se haya creado correctamente
SELECT G.IdGrupo, 
       M.Nombre AS Materia, 
       P.Nombre AS Profesor, 
       S.IdSalon, 
       S.Tipo AS TipoSalon,
       C.Nombre AS Ciclo
FROM Grupo G
JOIN Materia M ON G.IdMateria = M.IdMateria
JOIN Profesor P ON G.IdProfesor = P.IdProfesor
JOIN Salon S ON G.IdSalon = S.IdSalon
JOIN Ciclo C ON G.IdCiclo = C.IdCiclo
WHERE G.IdGrupo = 1051;