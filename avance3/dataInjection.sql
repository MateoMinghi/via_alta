-- Script para la carga de datos de muestra para el sistema de gestión académica
-- Compatible con MySQL

-- Usar la base de datos
USE sistema_gestion_academica;

-- INSERCIÓN DE DATOS DE CLASIFICACIÓN (mínimo 10 registros)

-- Materias (clasificación)
INSERT INTO Materia (IdMateria, Nombre, HorasClase, Requisitos) VALUES
(1, 'Fundamentos de Diseño', 4.0, NULL),
(2, 'Dibujo del Cuerpo', 3.5, NULL),
(3, 'Patronaje de Prendas Básicas', 5.0, 'Taller manual'),
(4, 'Confección de Prendas Básicas', 5.0, 'Taller de confección'),
(5, 'Técnicas de Expresión Gráfica', 3.0, NULL),
(6, 'Historia de la Moda', 2.0, NULL),
(7, 'Herramientas y Puntadas Básicas', 4.0, 'Taller de confección'),
(8, 'Patronaje de Prendas Femeninas', 5.0, 'Taller manual'),
(9, 'Confección de Prendas Femeninas', 5.0, 'Taller de confección'),
(10, 'Conceptos y Tendencias de la Moda I', 2.5, NULL),
(11, 'Ilustración Técnica de la Moda I', 3.0, 'Laboratorio de dibujo'),
(12, 'Modelado en Maniquí I', 4.0, 'Taller de modelado'),
(13, 'Sistemas de Producción', 3.0, NULL),
(14, 'Graduación de Tallas', 4.0, 'Laboratorio de computación'),
(15, 'Diseño de Moda Asistido por Computadora', 4.5, 'Laboratorio de computación'),
(16, 'Desarrollo Empresarial', 3.0, NULL),
(17, 'Desarrollo de Proyecto Integrador', 5.0, NULL),
(18, 'Ilustración Técnica de la Moda II', 3.0, 'Laboratorio de dibujo'),
(19, 'Modelado en Maniquí II', 4.0, 'Taller de modelado'),
(20, 'Diseño de Accesorios', 3.5, 'Taller manual');

-- Salones (clasificación)
INSERT INTO Salon (IdSalon, Cupo, Tipo) VALUES
(101, 20, 'Aula Teórica'),
(102, 15, 'Taller de confección'),
(103, 15, 'Taller manual'),
(104, 18, 'Laboratorio de dibujo'),
(105, 25, 'Aula Magna'),
(106, 12, 'Laboratorio de computación'),
(107, 10, 'Taller de modelado'),
(108, 15, 'Taller de producción'),
(109, 20, 'Aula Teórica'),
(110, 8, 'Sala de Tutorías');

-- INSERCIÓN DE DATOS PERMANENTES (mínimo 20 registros)

-- Usuarios
INSERT INTO Usuario (IdUsuario, Tipo, Contraseña) VALUES
('COORD001', 'Coordinador', 'hash_password_1'),
('COORD002', 'Coordinador', 'hash_password_2'),
('ALU100027', 'Alumno', 'hash_password_3'),
('ALU100028', 'Alumno', 'hash_password_4'),
('ALU100029', 'Alumno', 'hash_password_5'),
('ALU100030', 'Alumno', 'hash_password_6'),
('ALU100031', 'Alumno', 'hash_password_7'),
('ALU100032', 'Alumno', 'hash_password_8'),
('ALU100033', 'Alumno', 'hash_password_9'),
('ALU100034', 'Alumno', 'hash_password_10'),
('ALU100035', 'Alumno', 'hash_password_11'),
('ALU100036', 'Alumno', 'hash_password_12'),
('ALU100037', 'Alumno', 'hash_password_13'),
('ALU100038', 'Alumno', 'hash_password_14'),
('ALU100039', 'Alumno', 'hash_password_15'),
('ALU100040', 'Alumno', 'hash_password_16'),
('ALU100041', 'Alumno', 'hash_password_17'),
('ALU100042', 'Alumno', 'hash_password_18'),
('ALU100043', 'Alumno', 'hash_password_19'),
('ALU100044', 'Alumno', 'hash_password_20'),
('ALU100045', 'Alumno', 'hash_password_21'),
('ALU100046', 'Alumno', 'hash_password_22');

-- Coordinadores
INSERT INTO Coordinador (IdCoordinador) VALUES
('COORD001'),
('COORD002');

-- Alumnos
INSERT INTO Alumno (IdAlumno, Confirmacion) VALUES
('ALU100027', TRUE),
('ALU100028', TRUE),
('ALU100029', TRUE),
('ALU100030', TRUE),
('ALU100031', TRUE),
('ALU100032', TRUE),
('ALU100033', TRUE),
('ALU100034', TRUE),
('ALU100035', TRUE),
('ALU100036', TRUE),
('ALU100037', FALSE),
('ALU100038', TRUE),
('ALU100039', TRUE),
('ALU100040', FALSE),
('ALU100041', TRUE),
('ALU100042', TRUE),
('ALU100043', TRUE),
('ALU100044', TRUE),
('ALU100045', TRUE),
('ALU100046', FALSE);

-- Profesores
INSERT INTO Profesor (IdProfesor, Nombre) VALUES
(300101, 'María Sosa'),
(300102, 'Carlos Mendoza'),
(300103, 'Diana García'),
(300104, 'Lucía Moreno'),
(300105, 'Gabriel Tapia'),
(300106, 'Patricia Peña'),
(300107, 'Alejandro Paredes'),
(300108, 'Regina Gil'),
(300109, 'Miguel López'),
(300110, 'Naomi Ochoa'),
(300111, 'José Ramírez'),
(300112, 'Laura Vázquez'),
(300113, 'Fernando Ortega'),
(300114, 'Carmen Rojas'),
(300115, 'Daniel Acosta'),
(300116, 'Valentina Fuentes'),
(300117, 'Andrés Molina'),
(300118, 'Isabella Blanco'),
(300119, 'Ricardo Herrera'),
(300120, 'Mariana Valencia');

-- Disponibilidad de profesores
INSERT INTO Disponibilidad (IdDisponibilidad, IdProfesor, Dia, HoraInicio, HoraFin) VALUES
(1001, 300101, 'Lunes', '07:00:00', '11:00:00'),
(1002, 300101, 'Miércoles', '07:00:00', '11:00:00'),
(1003, 300101, 'Viernes', '07:00:00', '11:00:00'),
(1004, 300102, 'Lunes', '13:00:00', '17:00:00'),
(1005, 300102, 'Martes', '07:00:00', '11:00:00'),
(1006, 300102, 'Viernes', '07:00:00', '13:00:00'),
(1007, 300103, 'Lunes', '09:00:00', '13:00:00'),
(1008, 300103, 'Miércoles', '09:00:00', '13:00:00'),
(1009, 300103, 'Viernes', '09:00:00', '13:00:00'),
(1010, 300104, 'Lunes', '13:00:00', '19:00:00'),
(1011, 300104, 'Martes', '13:00:00', '19:00:00'),
(1012, 300105, 'Lunes', '15:00:00', '19:00:00'),
(1013, 300105, 'Miércoles', '15:00:00', '19:00:00'),
(1014, 300105, 'Jueves', '15:00:00', '19:00:00'),
(1015, 300106, 'Martes', '07:00:00', '13:00:00'),
(1016, 300106, 'Jueves', '07:00:00', '13:00:00'),
(1017, 300107, 'Martes', '09:00:00', '15:00:00'),
(1018, 300107, 'Jueves', '09:00:00', '15:00:00'),
(1019, 300107, 'Viernes', '09:00:00', '15:00:00'),
(1020, 300108, 'Martes', '11:00:00', '15:00:00'),
(1021, 300108, 'Jueves', '11:00:00', '15:00:00'),
(1022, 300108, 'Viernes', '11:00:00', '15:00:00'),
(1023, 300109, 'Martes', '13:00:00', '19:00:00'),
(1024, 300109, 'Jueves', '13:00:00', '19:00:00'),
(1025, 300109, 'Viernes', '13:00:00', '17:00:00'),
(1026, 300110, 'Martes', '15:00:00', '19:00:00'),
(1027, 300110, 'Miércoles', '15:00:00', '19:00:00'),
(1028, 300110, 'Jueves', '15:00:00', '19:00:00'),
(1029, 300111, 'Miércoles', '07:00:00', '13:00:00'),
(1030, 300111, 'Viernes', '07:00:00', '13:00:00');

-- Prerequisitos entre materias
INSERT INTO Prerequisito (IdMateria, IdPrerequisito) VALUES
(11, 5),   -- Ilustración Técnica I requiere Técnicas de Expresión Gráfica
(18, 11),  -- Ilustración Técnica II requiere Ilustración Técnica I
(19, 12),  -- Modelado en Maniquí II requiere Modelado en Maniquí I
(15, 14),  -- Diseño por Computadora requiere Graduación de Tallas
(8, 3),    -- Patronaje Femenino requiere Patronaje Básico
(9, 4),    -- Confección Femenina requiere Confección Básica
(17, 16);  -- Proyecto Integrador requiere Desarrollo Empresarial

-- Tabla Ciclo
INSERT INTO Ciclo (IdCiclo, Nombre, FechaInicio, FechaFin) VALUES
(1, 'Primavera 2025', '2025-01-15', '2025-06-30'),
(2, 'Verano 2025', '2025-07-01', '2025-08-31'),
(3, 'Otoño 2025', '2025-09-01', '2025-12-15'),
(4, 'Invierno 2026', '2026-01-15', '2026-04-30'),
(5, 'Primavera 2026', '2026-05-01', '2026-08-31');

-- INSERCIÓN DE DATOS TRANSACCIONALES (mínimo 50 registros)

-- Grupos (datos transaccionales - primeros 25)
INSERT INTO Grupo (IdGrupo, IdMateria, IdProfesor, IdSalon, IdCiclo) VALUES
(1001, 1, 300101, 101, 1),
(1002, 3, 300102, 103, 1),
(1003, 8, 300103, 103, 1),
(1004, 11, 300104, 104, 1),
(1005, 6, 300105, 105, 1),
(1006, 15, 300106, 106, 1),
(1007, 12, 300107, 107, 1),
(1008, 13, 300108, 108, 1),
(1009, 10, 300109, 109, 1),
(1010, 16, 300110, 110, 1),
(1011, 2, 300111, 101, 1),
(1012, 4, 300112, 102, 1),
(1013, 9, 300113, 102, 1),
(1014, 18, 300114, 104, 1),
(1015, 7, 300115, 102, 1),
(1016, 20, 300116, 103, 1),
(1017, 19, 300117, 107, 1),
(1018, 14, 300118, 106, 1),
(1019, 5, 300119, 104, 1),
(1020, 17, 300120, 105, 1),
(1021, 1, 300101, 101, 2),
(1022, 8, 300103, 103, 2),
(1023, 6, 300105, 105, 2),
(1024, 12, 300107, 107, 2),
(1025, 10, 300109, 109, 2);

-- Grupos (datos transaccionales - siguientes 25)
INSERT INTO Grupo (IdGrupo, IdMateria, IdProfesor, IdSalon, IdCiclo) VALUES
(1026, 2, 300111, 101, 2),
(1027, 9, 300113, 102, 2),
(1028, 7, 300115, 102, 2),
(1029, 19, 300117, 107, 2),
(1030, 5, 300119, 104, 2),
(1031, 3, 300102, 103, 3),
(1032, 11, 300104, 104, 3),
(1033, 15, 300106, 106, 3),
(1034, 13, 300108, 108, 3),
(1035, 16, 300110, 110, 3),
(1036, 4, 300112, 102, 3),
(1037, 18, 300114, 104, 3),
(1038, 20, 300116, 103, 3),
(1039, 14, 300118, 106, 3),
(1040, 17, 300120, 105, 3),
(1041, 1, 300101, 101, 4),
(1042, 8, 300103, 103, 4),
(1043, 6, 300105, 105, 4),
(1044, 12, 300107, 107, 4),
(1045, 10, 300109, 109, 4),
(1046, 3, 300102, 103, 4),
(1047, 11, 300104, 104, 4),
(1048, 15, 300106, 106, 4),
(1049, 13, 300108, 108, 4),
(1050, 16, 300110, 110, 4);

-- Inscripciones (datos transaccionales - primeros 25)
INSERT INTO Inscribe (IdInscripcion, IdAlumno, IdGrupo) VALUES
(5001, 'ALU100027', 1001),
(5002, 'ALU100027', 1002),
(5003, 'ALU100027', 1011),
(5004, 'ALU100027', 1012),
(5005, 'ALU100027', 1019),
(5006, 'ALU100027', 1015),
(5007, 'ALU100027', 1023),
(5008, 'ALU100028', 1001),
(5009, 'ALU100028', 1002),
(5010, 'ALU100028', 1011),
(5011, 'ALU100028', 1012),
(5012, 'ALU100028', 1019),
(5013, 'ALU100028', 1015),
(5014, 'ALU100028', 1023),
(5015, 'ALU100029', 1003),
(5016, 'ALU100029', 1009),
(5017, 'ALU100029', 1013),
(5018, 'ALU100029', 1022),
(5019, 'ALU100029', 1025),
(5020, 'ALU100029', 1027),
(5021, 'ALU100030', 1003),
(5022, 'ALU100030', 1009),
(5023, 'ALU100030', 1013),
(5024, 'ALU100030', 1022),
(5025, 'ALU100030', 1025);

-- Inscripciones (datos transaccionales - siguientes 25)
INSERT INTO Inscribe (IdInscripcion, IdAlumno, IdGrupo) VALUES
(5026, 'ALU100030', 1027),
(5027, 'ALU100031', 1004),
(5028, 'ALU100031', 1014),
(5029, 'ALU100031', 1032),
(5030, 'ALU100031', 1037),
(5031, 'ALU100031', 1047),
(5032, 'ALU100032', 1004),
(5033, 'ALU100032', 1014),
(5034, 'ALU100032', 1032),
(5035, 'ALU100032', 1037),
(5036, 'ALU100032', 1047),
(5037, 'ALU100033', 1007),
(5038, 'ALU100033', 1017),
(5039, 'ALU100033', 1024),
(5040, 'ALU100033', 1029),
(5041, 'ALU100033', 1044),
(5042, 'ALU100034', 1007),
(5043, 'ALU100034', 1017),
(5044, 'ALU100034', 1024),
(5045, 'ALU100034', 1029),
(5046, 'ALU100034', 1044),
(5047, 'ALU100035', 1006),
(5048, 'ALU100035', 1016),
(5049, 'ALU100035', 1033),
(5050, 'ALU100035', 1038);

-- Inscripciones (datos transaccionales - últimos 25 para completar 75)
INSERT INTO Inscribe (IdInscripcion, IdAlumno, IdGrupo) VALUES
(5051, 'ALU100035', 1043),
(5052, 'ALU100035', 1048),
(5053, 'ALU100036', 1006),
(5054, 'ALU100036', 1016),
(5055, 'ALU100036', 1033),
(5056, 'ALU100036', 1038),
(5057, 'ALU100036', 1043),
(5058, 'ALU100036', 1048),
(5059, 'ALU100037', 1010),
(5060, 'ALU100037', 1020),
(5061, 'ALU100037', 1035),
(5062, 'ALU100037', 1040),
(5063, 'ALU100037', 1050),
(5064, 'ALU100038', 1010),
(5065, 'ALU100038', 1020),
(5066, 'ALU100038', 1035),
(5067, 'ALU100038', 1040),
(5068, 'ALU100038', 1050),
(5069, 'ALU100039', 1008),
(5070, 'ALU100039', 1018),
(5071, 'ALU100039', 1034),
(5072, 'ALU100039', 1039),
(5073, 'ALU100039', 1049),
(5074, 'ALU100040', 1008),
(5075, 'ALU100040', 1018);

-- Solicitudes (datos transaccionales - primeras 25)
INSERT INTO Solicitud (IdSolicitud, Fecha, Estado, Descripcion, IdAlumno) VALUES
(401, '2025-01-05', 'Aprobada', 'Solicitud de cambio de grupo de Patronaje Básico', 'ALU100027'),
(402, '2025-01-06', 'Aprobada', 'Solicitud de cambio de grupo de Confección Básica', 'ALU100028'),
(403, '2025-01-07', 'Rechazada', 'Solicitud de baja de materia Ilustración Técnica I', 'ALU100029'),
(404, '2025-01-08', 'Pendiente', 'Solicitud de equivalencia para Historia de la Moda', 'ALU100030'),
(405, '2025-01-09', 'Aprobada', 'Solicitud de inscripción tardía a Sistemas de Producción', 'ALU100031'),
(406, '2025-01-10', 'Pendiente', 'Solicitud de inscripción a grupo completo de Modelado en Maniquí I', 'ALU100032'),
(407, '2025-01-11', 'Aprobada', 'Solicitud de cambio de turno para Patronaje Femenino', 'ALU100033'),
(408, '2025-01-12', 'Rechazada', 'Solicitud de baja temporal del semestre', 'ALU100034'),
(409, '2025-01-13', 'Pendiente', 'Solicitud de cambio de carrera', 'ALU100035'),
(410, '2025-01-14', 'Aprobada', 'Solicitud de revisión de calificación de Confección Femenina', 'ALU100036'),
(411, '2025-01-15', 'Pendiente', 'Solicitud de horario especial por trabajo', 'ALU100037'),
(412, '2025-01-16', 'Aprobada', 'Solicitud de constancia de estudios', 'ALU100038'),
(413, '2025-01-17', 'Rechazada', 'Solicitud de inscripción a materias con prerrequisitos no cumplidos', 'ALU100039'),
(414, '2025-01-18', 'Pendiente', 'Solicitud de asesoría para proyecto final', 'ALU100040'),
(415, '2025-01-19', 'Aprobada', 'Solicitud de extensión para entrega de proyecto', 'ALU100041'),
(416, '2025-01-20', 'Pendiente', 'Solicitud de beca por excelencia académica', 'ALU100042'),
(417, '2025-01-21', 'Rechazada', 'Solicitud de cambio de profesor en Ilustración Técnica II', 'ALU100043'),
(418, '2025-01-22', 'Aprobada', 'Solicitud de acceso a taller en horario extendido', 'ALU100044'),
(419, '2025-01-23', 'Pendiente', 'Solicitud de material didáctico especial', 'ALU100045'),
(420, '2025-01-24', 'Aprobada', 'Solicitud de prórroga para pago de colegiatura', 'ALU100046'),
(421, '2025-01-25', 'Rechazada', 'Solicitud de inscripción a grupo cerrado', 'ALU100027'),
(422, '2025-01-26', 'Pendiente', 'Solicitud de revisión de situación académica', 'ALU100028'),
(423, '2025-01-27', 'Aprobada', 'Solicitud de cambio de modalidad a distancia', 'ALU100029'),
(424, '2025-01-28', 'Pendiente', 'Solicitud de revalidación de estudios previos', 'ALU100030'),
(425, '2025-01-29', 'Rechazada', 'Solicitud de examen extraordinario', 'ALU100031');

-- Solicitudes (datos transaccionales - últimas 25)
INSERT INTO Solicitud (IdSolicitud, Fecha, Estado, Descripcion, IdAlumno) VALUES
(426, '2025-01-30', 'Aprobada', 'Solicitud de corrección de datos personales', 'ALU100032'),
(427, '2025-01-31', 'Pendiente', 'Solicitud de titulación anticipada', 'ALU100033'),
(428, '2025-02-01', 'Rechazada', 'Solicitud de apertura de grupo adicional', 'ALU100034'),
(429, '2025-02-02', 'Aprobada', 'Solicitud de cambio de turno por motivos laborales', 'ALU100035'),
(430, '2025-02-03', 'Pendiente', 'Solicitud de ampliación de plazo para proyecto', 'ALU100036'),
(431, '2025-02-04', 'Rechazada', 'Solicitud de baja definitiva', 'ALU100037'),
(432, '2025-02-05', 'Aprobada', 'Solicitud de acceso a software especializado', 'ALU100038'),
(433, '2025-02-06', 'Pendiente', 'Solicitud de cambio de asesor de tesis', 'ALU100039'),
(434, '2025-02-07', 'Aprobada', 'Solicitud de constancia de prácticas profesionales', 'ALU100040'),
(435, '2025-02-08', 'Rechazada', 'Solicitud de exención de materia por experiencia laboral', 'ALU100041'),
(436, '2025-02-09', 'Pendiente', 'Solicitud de asesoría adicional', 'ALU100042'),
(437, '2025-02-10', 'Aprobada', 'Solicitud de credencial de reposición', 'ALU100043'),
(438, '2025-02-11', 'Rechazada', 'Solicitud de beca alimenticia', 'ALU100044'),
(439, '2025-02-12', 'Pendiente', 'Solicitud de acceso a biblioteca en horario extendido', 'ALU100045'),
(440, '2025-02-13', 'Aprobada', 'Solicitud de cambio de modalidad de titulación', 'ALU100046'),
(441, '2025-02-14', 'Rechazada', 'Solicitud de dispensa de asistencia por enfermedad', 'ALU100027'),
(442, '2025-02-15', 'Pendiente', 'Solicitud de revisión de proyecto final', 'ALU100028'),
(443, '2025-02-16', 'Aprobada', 'Solicitud de constancia de no adeudo', 'ALU100029'),
(444, '2025-02-17', 'Rechazada', 'Solicitud de apertura de curso de verano', 'ALU100030'),
(445, '2025-02-18', 'Pendiente', 'Solicitud de préstamo de equipo especializado', 'ALU100031'),
(446, '2025-02-19', 'Aprobada', 'Solicitud de constancia de materias cursadas', 'ALU100032'),
(447, '2025-02-20', 'Rechazada', 'Solicitud de cambio de carrera', 'ALU100033'),
(448, '2025-02-21', 'Pendiente', 'Solicitud de acceso a concurso de diseño', 'ALU100034'),
(449, '2025-02-22', 'Aprobada', 'Solicitud de duplicado de credencial', 'ALU100035'),
(450, '2025-02-23', 'Pendiente', 'Solicitud de revisión de carga académica', 'ALU100036');