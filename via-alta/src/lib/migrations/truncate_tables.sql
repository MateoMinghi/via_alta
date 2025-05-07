-- Para que eliminen los registros de las tablas (menos la de usuario)

-- Truncate all tables except the 'users' table
TRUNCATE TABLE Prerequisito CASCADE;
TRUNCATE TABLE Salon CASCADE;
TRUNCATE TABLE password_reset_tokens CASCADE;
TRUNCATE TABLE Alumno CASCADE;
TRUNCATE TABLE Profesor CASCADE;
TRUNCATE TABLE Disponibilidad CASCADE;
TRUNCATE TABLE Ciclo CASCADE;
TRUNCATE TABLE Grupo CASCADE;
TRUNCATE TABLE Inscribe CASCADE;
TRUNCATE TABLE Solicitud CASCADE;
TRUNCATE TABLE HorarioGeneral CASCADE;