-- Script para la creación de la base de datos y las tablas del sistema de gestión académica
-- Compatible con MySQL

-- Crear la base de datos
CREATE DATABASE sistema_gestion_academica;

-- Usar la base de datos creada
USE sistema_gestion_academica;

-- Tabla Usuario (entidad principal)
CREATE TABLE Usuario (
    IdUsuario VARCHAR(50) PRIMARY KEY,
    Tipo VARCHAR(15) NOT NULL,
    Contraseña VARCHAR(50) NOT NULL
);

-- Tabla Coordinador (especialización de Usuario)
CREATE TABLE Coordinador (
    IdCoordinador VARCHAR(50) PRIMARY KEY,
    CONSTRAINT FK_Coordinador_Usuario FOREIGN KEY (IdCoordinador) REFERENCES Usuario(IdUsuario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla Alumno (especialización de Usuario)
CREATE TABLE Alumno (
    IdAlumno VARCHAR(50) PRIMARY KEY,
    Confirmacion BOOLEAN,
    CONSTRAINT FK_Alumno_Usuario FOREIGN KEY (IdAlumno) REFERENCES Usuario(IdUsuario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla Profesor
CREATE TABLE Profesor (
    IdProfesor INT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL
);

-- Tabla Disponibilidad
CREATE TABLE Disponibilidad (
    IdDisponibilidad INT PRIMARY KEY,
    IdProfesor INT NOT NULL,
    Dia VARCHAR(15) NOT NULL,
    HoraInicio TIME NOT NULL,
    HoraFin TIME NOT NULL,
    CONSTRAINT FK_Disponibilidad_Profesor FOREIGN KEY (IdProfesor) REFERENCES Profesor(IdProfesor) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla Materia
CREATE TABLE Materia (
    IdMateria INT PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL,
    HorasClase FLOAT NOT NULL,
    Requisitos VARCHAR(50)
);

-- Tabla Salon
CREATE TABLE Salon (
    IdSalon INT PRIMARY KEY,
    Cupo INT NOT NULL,
    Tipo VARCHAR(50) NOT NULL
);

-- Tabla Ciclo
CREATE TABLE Ciclo (
    IdCiclo INT PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL,
    FechaInicio DATE NOT NULL,
    FechaFin DATE NOT NULL
);

-- Tabla Grupo
CREATE TABLE Grupo (
    IdGrupo INT PRIMARY KEY,
    IdMateria INT NOT NULL,
    IdProfesor INT NOT NULL,
    IdSalon INT NOT NULL,
    IdCiclo INT NOT NULL,
    CONSTRAINT FK_Grupo_Materia FOREIGN KEY (IdMateria) REFERENCES Materia(IdMateria) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_Grupo_Profesor FOREIGN KEY (IdProfesor) REFERENCES Profesor(IdProfesor) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_Grupo_Salon FOREIGN KEY (IdSalon) REFERENCES Salon(IdSalon) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_Grupo_Ciclo FOREIGN KEY (IdCiclo) REFERENCES Ciclo(IdCiclo) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabla de prerequisitos entre materias
CREATE TABLE Prerequisito (
    IdMateria INT,
    IdPrerequisito INT,
    PRIMARY KEY (IdMateria, IdPrerequisito),
    CONSTRAINT FK_Prerequisito_Materia FOREIGN KEY (IdMateria) REFERENCES Materia(IdMateria) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT FK_Prerequisito_Materia_Req FOREIGN KEY (IdPrerequisito) REFERENCES Materia(IdMateria) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla Inscribe (Inscripción)
CREATE TABLE Inscribe (
    IdInscripcion INT PRIMARY KEY,
    IdAlumno VARCHAR(50) NOT NULL,
    IdGrupo INT NOT NULL,
    CONSTRAINT FK_Inscribe_Alumno FOREIGN KEY (IdAlumno) REFERENCES Alumno(IdAlumno) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_Inscribe_Grupo FOREIGN KEY (IdGrupo) REFERENCES Grupo(IdGrupo) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabla Solicitud
CREATE TABLE Solicitud (
    IdSolicitud INT PRIMARY KEY,
    Fecha DATE NOT NULL,
    Estado VARCHAR(20) NOT NULL,
    Descripcion TEXT,
    IdAlumno VARCHAR(50) NOT NULL,
    CONSTRAINT FK_Solicitud_Alumno FOREIGN KEY (IdAlumno) REFERENCES Alumno(IdAlumno) ON DELETE CASCADE ON UPDATE CASCADE
);
