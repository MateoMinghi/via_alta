"use client";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useState, useEffect } from "react";

type Turno = {
  estudiante: string;
  fecha: string;
  hora: string;
  semestre: string; // Nuevo campo para categorizar
};

export default function TurnosPage() {
  //Generar turnos de inscripción
  const [turnosPorSemestre, setTurnosPorSemestre] = useState<Record<string, Turno[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const estudiantesPorSemestre: Record<string, string[]> = {
        "1° Semestre": ["Mateo", "Enrique", "Carlos"],
        "2° Semestre": ["María", "Leo", "Sofía"],
        "3° Semestre": ["Ana", "Luis", "Pedro"],
        "4° Semestre": ["Juan", "Miguel", "Andrea"],
        "5° Semestre": ["Lucía", "Sara", "Elena"],
        "6° Semestre": ["Laura", "Carmen", "Rosa"],
        "Irregulares": ["Julia", "Isabel"]
      };

      const turnosPorDia = 20;
      const duracionTurno = 5; // Minutos por turno
      const fechaInicio = new Date();
      fechaInicio.setHours(9, 0, 0, 0); // Iniciar a las 9:00 AM

      let fechaActual = new Date(fechaInicio);
      let turnosGenerados: Record<string, Turno[]> = {};

      Object.entries(estudiantesPorSemestre).forEach(([semestre, estudiantes]) => {
        turnosGenerados[semestre] = estudiantes.map((estudiante, i) => {
          const turno: Turno = {
            estudiante,
            fecha: fechaActual.toISOString().split("T")[0],
            hora: fechaActual.toTimeString().slice(0, 5),
            semestre,
          };

          if ((i + 1) % turnosPorDia === 0) {
            fechaActual.setDate(fechaActual.getDate() + 1);
            fechaActual.setHours(9, 0, 0, 0);
          } else {
            fechaActual.setMinutes(fechaActual.getMinutes() + duracionTurno);
          }

          return turno;
        });
      });

      console.log("Turnos generados:", turnosGenerados);
      setTurnosPorSemestre(turnosGenerados);
    } catch (err) {
      console.error("Error al generar turnos:", err);
      setError("Error al generar turnos.");
    }
  }, []);

  //Desplegar turnos de Inscripción
  return (
    <div className="overflow-x-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Turnos Generados</h1>

      {error && <p className="text-red-600">Error: {error}</p>}

      {Object.keys(turnosPorSemestre).length === 0 ? (
        <p>Cargando turnos...</p>
      ) : (
        <Table className="min-w-full">
          <TableHeader className="bg-gray-300">
            <TableRow>
              <TableHead className="text-center text-black text-lg font-bold">Estudiante</TableHead>
              <TableHead className="text-center text-black text-lg font-bold">Fecha</TableHead>
              <TableHead className="text-center text-black text-lg font-bold">Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(turnosPorSemestre).map(([semestre, turnos]) => (
              <>
                {/* Fila separadora de semestre */}
                <TableRow key={semestre} className="bg-gray-200">
                  <TableCell colSpan={3} className="text-center font-bold uppercase">{semestre}</TableCell>
                </TableRow>

                {/* Filas de los turnos */}
                {turnos.map((turno, index) => (
                  <TableRow key={index} className="border-t-2 border-b-2 border-red-700">
                    <TableCell className="text-center font-medium">{turno.estudiante}</TableCell>
                    <TableCell className="text-center font-medium">{turno.fecha}</TableCell>
                    <TableCell className="text-center font-medium">{turno.hora}</TableCell>
                  </TableRow>
                ))}
              </>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
