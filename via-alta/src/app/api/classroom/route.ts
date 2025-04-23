import { NextRequest, NextResponse } from "next/server";
import Classroom from "../../../lib/models/classroom";

// Obtener todos los salones
export async function GET() {
  try {
    const classrooms = await Classroom.findAll();
    return NextResponse.json(classrooms);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener los salones" },
      { status: 500 }
    );
  }
}

// Crear un nuevo salón
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
<<<<<<< HEAD
    const nuevoSalon = await Classroom.create(data);
    return NextResponse.json(nuevoSalon, { status: 201 });
  } catch (error) {
    console.error("❌ Error al crear el salón:", error);
=======
    const { idsalon, tipo, cupo, nota } = data;

    // Validación básica
    if (
      typeof idsalon !== "number" ||
      typeof tipo !== "string" ||
      typeof cupo !== "number"
    ) {
      return NextResponse.json(
        { error: "Datos incompletos o incorrectos para crear el salón" },
        { status: 400 }
      );
    }

    const nuevoSalon = await Classroom.create({ idsalon, tipo, cupo, nota });
    return NextResponse.json(nuevoSalon, { status: 201 });
  } catch (error) {
    console.error("Error al crear el salón:", error);
>>>>>>> develop
    return NextResponse.json(
      { error: (error as Error).message || "Error al crear el salón" },
      { status: 500 }
    );
  }
<<<<<<< HEAD
  
}

// Actualizar datos de un salón (tipo, cupo o nota)
=======
}

// Actualizar datos de un salón (tipo, cupo, nota o idsalon)
>>>>>>> develop
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, campo, valor } = data;

    let updatedClassroom;

    if (campo === "cupo") {
      updatedClassroom = await Classroom.updateCupo(id, parseInt(valor));
    } else if (campo === "tipo") {
      updatedClassroom = await Classroom.updateTipo(id, valor);
    } else if (campo === "nota") {
      updatedClassroom = await Classroom.updateNota(id, valor);
<<<<<<< HEAD
=======
    } else if (campo === "idsalon") {
      updatedClassroom = await Classroom.updateId(id, parseInt(valor));
>>>>>>> develop
    } else {
      return NextResponse.json({ error: "Campo inválido" }, { status: 400 });
    }

    return NextResponse.json(updatedClassroom);
  } catch (error) {
    return NextResponse.json(
<<<<<<< HEAD
      { error: "Error al actualizar el salón" },
=======
      { error: (error as Error).message || "Error al actualizar el salón" },
>>>>>>> develop
      { status: 500 }
    );
  }
}

// Eliminar un salón por ID
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json({ error: "ID no válido" }, { status: 400 });
    }

    const eliminado = await Classroom.delete(id);
    return NextResponse.json(eliminado);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar el salón" },
      { status: 500 }
    );
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> develop
