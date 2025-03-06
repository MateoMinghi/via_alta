"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import ProfessorGrid from "../ProfessorGrid"

export default function Profesor() {
  const [selectedSlots, setSelectedSlots] = useState<Record<string, boolean>>({})

  const handleSaveAvailability = () => {
    console.log("Guardando disponibilidad:", selectedSlots)
    alert("Disponibilidad guardada correctamente")
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <p className="text-3xl font-bold">Registro de Disponibilidad</p>
        </div>
      </div>
      <div>
            <div className="pt-4">
              <ProfessorGrid selectedSlots={selectedSlots} setSelectedSlots={setSelectedSlots} />
            </div>
            <div className="flex justify-between mt-8 gap-4">
              <Button variant="outline" onClick={() => setSelectedSlots({})} className="w-full bg-red-700 text-white">
                Limpiar
              </Button>
              <Button className="w-full" onClick={handleSaveAvailability} >
                <Save/>
                Guardar
              </Button>
            </div>
          </div>
    </div>
  )
}

