-- Script para la carga de datos de muestra para el sistema de gestión académica
-- Compatible con PostgreSQL

-- Usar la base de datos
-- Nota: En PostgreSQL, debes crear primero la base de datos usando pgAdmin4
-- y luego conectarte a ella antes de ejecutar este script

-- Crear tablas

-- Tablas de clasificación
CREATE TABLE IF NOT EXISTS Materia (
    IdMateria INTEGER PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    HorasClase DECIMAL(3,1) NOT NULL,
    Requisitos TEXT,
    Carrera VARCHAR(100),
    Semestre INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS Prerequisito (
    IdMateria INTEGER,
    IdPrerequisito INTEGER,
    PRIMARY KEY (IdMateria, IdPrerequisito),
    FOREIGN KEY (IdMateria) REFERENCES Materia(IdMateria),
    FOREIGN KEY (IdPrerequisito) REFERENCES Materia(IdMateria)
);

CREATE TABLE IF NOT EXISTS Salon (
    IdSalon INTEGER PRIMARY KEY,
    Cupo INTEGER NOT NULL,
    Tipo VARCHAR(50) NOT NULL,
    Nota VARCHAR(50) NOT NULL
);

-- Tablas base
-- Create users table to store local authentication data
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  ivd_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_ivd_id ON users(ivd_id);

-- Create password_reset_tokens table if not exists
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    ivd_id TEXT NOT NULL,
    email TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_ivd_id ON password_reset_tokens(ivd_id);

CREATE TABLE IF NOT EXISTS Alumno (
    IdAlumno VARCHAR(10) PRIMARY KEY,
    Confirmacion BOOLEAN NOT NULL,
    FOREIGN KEY (IdAlumno) REFERENCES users(ivd_id)
);

CREATE TABLE IF NOT EXISTS Profesor (
    IdProfesor VARCHAR(10) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Clases TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS Disponibilidad (
    IdDisponibilidad INTEGER PRIMARY KEY,
    IdProfesor VARCHAR(10),
    Dia VARCHAR(10) NOT NULL,
    HoraInicio TIME NOT NULL,
    HoraFin TIME NOT NULL,
    FOREIGN KEY (IdProfesor) REFERENCES Profesor(IdProfesor)
);


CREATE TABLE IF NOT EXISTS Ciclo (
    IdCiclo INTEGER PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL,
    FechaInicio DATE NOT NULL,
    FechaFin DATE NOT NULL
);

-- Tablas transaccionales
CREATE TABLE IF NOT EXISTS Grupo (
    IdGrupo INTEGER PRIMARY KEY,
    IdMateria INTEGER,
    IdProfesor VARCHAR(10),
    IdSalon INTEGER,
    IdCiclo INTEGER,
    Semestre INTEGER,  
    FOREIGN KEY (IdMateria) REFERENCES Materia(IdMateria),
    FOREIGN KEY (IdProfesor) REFERENCES Profesor(IdProfesor),
    FOREIGN KEY (IdSalon) REFERENCES Salon(IdSalon),
    FOREIGN KEY (IdCiclo) REFERENCES Ciclo(IdCiclo)
);

CREATE TABLE IF NOT EXISTS Inscribe (
    IdInscripcion INTEGER PRIMARY KEY,
    IdAlumno VARCHAR(10),
    IdGrupo INTEGER,
    FOREIGN KEY (IdAlumno) REFERENCES Alumno(IdAlumno),
    FOREIGN KEY (IdGrupo) REFERENCES Grupo(IdGrupo)
);

CREATE TABLE IF NOT EXISTS Solicitud (
    IdSolicitud INTEGER PRIMARY KEY,
    Fecha DATE NOT NULL,
    Estado VARCHAR(20) NOT NULL,
    Descripcion TEXT,
    IdAlumno VARCHAR(10),
    FOREIGN KEY (IdAlumno) REFERENCES Alumno(IdAlumno)
);

CREATE TABLE IF NOT EXISTS HorarioGeneral (
    IdHorarioGeneral INTEGER NOT NULL,
    NombreCarrera VARCHAR(100) NOT NULL,
    IdGrupo INTEGER NOT NULL,
    Dia VARCHAR(10) NOT NULL,
    HoraInicio TIME NOT NULL,
    HoraFin TIME NOT NULL,
    CONSTRAINT chk_dia CHECK (Dia IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes')),
    PRIMARY KEY (IdHorarioGeneral, IdGrupo, Dia, HoraInicio),
    CONSTRAINT fk_grupo FOREIGN KEY (IdGrupo) REFERENCES Grupo(IdGrupo)
);