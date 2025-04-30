-- Script to DELETE all tables from the database

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS HorarioGeneral CASCADE;
DROP TABLE IF EXISTS Horario CASCADE;
DROP TABLE IF EXISTS Solicitud CASCADE;
DROP TABLE IF EXISTS Inscribe CASCADE;
DROP TABLE IF EXISTS Grupo CASCADE;
DROP TABLE IF EXISTS Prerequisito CASCADE;
DROP TABLE IF EXISTS Disponibilidad CASCADE;
DROP TABLE IF EXISTS Profesor CASCADE;
DROP TABLE IF EXISTS Alumno CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS Ciclo CASCADE;
DROP TABLE IF EXISTS Salon CASCADE;
DROP TABLE IF EXISTS Materia CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';