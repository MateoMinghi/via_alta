import pool from "../config/database";
import User from "../lib/models/user";
import Student from "../lib/models/student";
import Professor from "../lib/models/professor";
import Subject from "../lib/models/subject";
import Classroom from "../lib/models/classroom";
import Cycle from "../lib/models/cycle";
import Group from "../lib/models/group";

async function runDatabaseTests() {
  try {
    console.log("Starting database tests...");

    // Prueba de metodo create
    console.log("\nCreating base records...");

    const testUser = await User.create({
      IdUsuario: "TEST001",
      Tipo: "estudiante",
      Contraseña: "test123",
    });
    console.log("Created user:", testUser);

    const testStudent = await Student.create({
      IdAlumno: "TEST001",
      Confirmacion: true,
    });
    console.log("Created student:", testStudent);

    const testProfessor = await Professor.create({
      IdProfesor: "1",
      Nombre: "Test Professor",
    });
    console.log("Created professor:", testProfessor);

    const testSubject = await Subject.create({
      IdMateria: "21",
      Nombre: "Test Subject",
      HorasClase: 4.5,
      Requisitos: "None",
    });
    console.log("Created subject:", testSubject);

    const testClassroom = await Classroom.create({
      IdSalon: "1",
      Cupo: 30,
      Tipo: "Regular",
    });
    console.log("Created classroom:", testClassroom);

    const testCycle = await Cycle.create({
      IdCiclo: "6",
      Nombre: "Test Cycle 2024",
      FechaInicio: new Date("2024-01-01"),
      FechaFin: new Date("2024-06-30"),
    });
    console.log("Created cycle:", testCycle);

    const testGroup = await Group.create({
      IdGrupo: "1",
      IdMateria: "21",
      IdProfesor: "1",
      IdSalon: "1",
      IdCiclo: "6",
    });
    console.log("Created group:", testGroup);

    // Prueba de metodo findByID
    console.log("\nTesting finding records...");
    const foundUser = await User.findById("TEST001");
    console.log("Found user:", foundUser);

    const foundStudent = await Student.findById("TEST001");
    console.log("Found student:", foundStudent);

    const foundProfessor = await Professor.findById("1");
    console.log("Found professor:", foundProfessor);

    const foundSubject = await Subject.findById("21");
    console.log("Found subject:", foundSubject);

    const foundClassroom = await Classroom.findById("1");
    console.log("Found classroom:", foundClassroom);

    const foundCycle = await Cycle.findById("6");
    console.log("Found cycle:", foundCycle);

    const foundGroup = await Group.findById("1");
    console.log("Found group:", foundGroup);

    console.log("\nCleaning up test records...");
    await Group.delete("1");
    await Cycle.delete("6");
    await Classroom.delete("1");
    await Subject.delete("21");
    await Professor.delete("1");
    await Student.delete("TEST001");
    await User.delete("TEST001");

    console.log("All tests completed successfully!");
    await pool.end();
  } catch (error) {
    console.error("Test failed:", (error as Error).message);
    await pool.end();
    process.exit(1);
  }
}

runDatabaseTests();
