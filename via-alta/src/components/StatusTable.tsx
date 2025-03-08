"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Calendar, ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Change the students data to include some with 'irregular' status
// Add a new property 'isIrregular' to some students
const students = [
  {
    id: "00001",
    name: "Renata López",
    semestre: "3",
    status: "requiere-cambios",
    comentario: "Necesita completar documentación pendiente para inscripción.",
    isIrregular: false,
  },
  {
    id: "00002",
    name: "Alejandro Martínez",
    semestre: "2",
    status: "inscrito",
    comentario: "Inscripción completa. Sin observaciones.",
    isIrregular: false,
  },
  {
    id: "00003",
    name: "Diana Pérez",
    semestre: "4",
    status: "inscrito",
    comentario: "Inscripción exitosa. Buen rendimiento académico.",
    isIrregular: false,
  },
  {
    id: "00004",
    name: "Emiliano García",
    semestre: "1",
    status: "inscrito",
    comentario: "Primer semestre. Todos los documentos en regla.",
    isIrregular: false,
  },
  {
    id: "00005",
    name: "Fernando Torres",
    semestre: "5",
    status: "requiere-cambios",
    comentario: "Pendiente pago de matrícula para completar inscripción.",
    isIrregular: false,
  },
  {
    id: "00006",
    name: "Gabriela Sánchez",
    semestre: "2",
    status: "inscrito",
    comentario: "Inscripción completa. Excelente desempeño.",
    isIrregular: false,
  },
  {
    id: "00007",
    name: "Sofia Ramírez",
    semestre: "3",
    status: "requiere-cambios",
    comentario: "Falta certificado médico para actividades deportivas.",
    isIrregular: false,
  },
  {
    id: "00008",
    name: "Diana Gómez",
    semestre: "6",
    status: "no-inscrito",
    comentario: "No ha iniciado proceso de inscripción para este semestre.",
    isIrregular: false,
  },
  {
    id: "00009",
    name: "Lucia Fernández",
    semestre: "4",
    status: "inscrito",
    comentario: "Inscripción completa. Participante en programa de intercambio.",
    isIrregular: false,
  },
  {
    id: "00010",
    name: "Fernanda Ruiz",
    semestre: "1",
    status: "no-inscrito",
    comentario: "Documentación incompleta. No ha pagado matrícula.",
    isIrregular: false,
  },
  {
    id: "00011",
    name: "Héctor Mendoza",
    semestre: "5",
    status: "no-inscrito",
    comentario: "Baja temporal solicitada por el estudiante.",
    isIrregular: false,
  },
  {
    id: "00012",
    name: "Alejandro Ortiz",
    semestre: "2",
    status: "requiere-cambios",
    comentario: "Pendiente validación de materias previas.",
    isIrregular: false,
  },
  // Add irregular students
  {
    id: "00013",
    name: "Carlos Vega",
    semestre: "N/A",
    status: "no-inscrito",
    comentario: "Estudiante con materias de diferentes semestres.",
    isIrregular: true,
  },
  {
    id: "00014",
    name: "María Jiménez",
    semestre: "N/A",
    status: "requiere-cambios",
    comentario: "Reincorporación después de baja temporal.",
    isIrregular: true,
  },
  {
    id: "00015",
    name: "José Morales",
    semestre: "N/A",
    status: "inscrito",
    comentario: "Cursando materias de diferentes semestres por reprobación.",
    isIrregular: true,
  },
]

export default function StatusTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredStudents, setFilteredStudents] = useState(students)
  const router = useRouter()
  const [selectedComment, setSelectedComment] = useState("")
  const [isCommentOpen, setIsCommentOpen] = useState(false)
  const [expandedSemesters, setExpandedSemesters] = useState<Record<string, boolean>>({})

  // Modify the grouping logic to handle irregular students
  // Replace the groupedStudents calculation with this:
  const groupedStudents = filteredStudents.reduce(
    (acc, student) => {
      const key = student.isIrregular ? "irregular" : student.semestre
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(student)
      return acc
    },
    {} as Record<string, typeof students>,
  )

  // Sort semesters numerically, but keep 'irregular' at the end
  const sortedSemesters = Object.keys(groupedStudents).sort((a, b) => {
    if (a === "irregular") return 1
    if (b === "irregular") return -1
    return Number.parseInt(a) - Number.parseInt(b)
  })

  // Replace the two useEffect hooks with the following implementation:

  // Initialize all sections as collapsed by default
  useEffect(() => {
    if (sortedSemesters.length === 0) return

    const initialExpandedState: Record<string, boolean> = {}
    sortedSemesters.forEach((semester) => {
      initialExpandedState[semester] = false // All collapsed by default
    })
    setExpandedSemesters(initialExpandedState)
  }, [])

  // Handle search and expand sections with matching results
  useEffect(() => {
    if (!searchQuery.trim()) {
      // When search is cleared, show all students AND collapse all sections
      setFilteredStudents(students)

      // Collapse all sections when search is empty
      setExpandedSemesters((prev) => {
        const newState = { ...prev }
        Object.keys(newState).forEach((sem) => {
          newState[sem] = false
        })
        return newState
      })
      return
    }

    const query = searchQuery.toLowerCase()
    const results = students.filter(
      (student) => student.id.toLowerCase().includes(query) || student.name.toLowerCase().includes(query),
    )
    setFilteredStudents(results)

    // Only update expanded sections if we have search results
    if (results.length > 0) {
      // Get the keys of the current groupedStudents
      const currentSemesters = Object.keys(
        results.reduce(
          (acc, student) => {
            const key = student.isIrregular ? "irregular" : student.semestre
            acc[key] = true
            return acc
          },
          {} as Record<string, boolean>,
        ),
      )

      // Only expand sections that have matching students
      setExpandedSemesters((prev) => {
        const newState = { ...prev }
        // First collapse all
        Object.keys(newState).forEach((sem) => {
          newState[sem] = false
        })
        // Then expand only those with matches
        currentSemesters.forEach((sem) => {
          newState[sem] = true
        })
        return newState
      })
    }
  }, [searchQuery])

  const handleViewComment = (comment: string) => {
    setSelectedComment(comment)
    setIsCommentOpen(true)
  }

  const handleViewSchedule = (studentId: string) => {
    router.push(`coordinador/horarios/${studentId}`)
  }

  const toggleSemester = (semester: string) => {
    setExpandedSemesters((prev) => ({
      ...prev,
      [semester]: !prev[semester],
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "inscrito":
        return "bg-emerald-500"
      case "requiere-cambios":
        return "bg-amber-400"
      case "no-inscrito":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  return (
    <div className="w-full mx-auto">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder="Buscar Alumno"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          {["inscrito", "requiere-cambios", "no-inscrito"].map((status) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${getStatusColor(status)}`} />
              <span className="text-sm capitalize">{status.replace("-", " ")}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        {sortedSemesters.length > 0 ? (
          sortedSemesters.map((semester) => (
            <div key={semester} className="border-b last:border-b-0">
              <div
                className="bg-gray-100 p-3 font-medium flex items-center cursor-pointer"
                onClick={() => toggleSemester(semester)}
              >
                {expandedSemesters[semester] ? (
                  <ChevronDown className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                {/* Modify the semester header display to show "Irregular" for the irregular section */}
                {/* Replace the semester header span with: */}
                <span>
                  {semester === "irregular"
                    ? `Estudiantes Irregulares (${groupedStudents[semester].length})`
                    : `Semestre ${semester} (${groupedStudents[semester].length} estudiantes)`}
                </span>
              </div>

              {expandedSemesters[semester] && (
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="text-center self-center font-medium">Matrícula de Alumno</TableHead>
                      <TableHead className="text-center self-center font-medium">Nombre de Alumno</TableHead>
                      <TableHead className="text-center self-center font-medium">Status de Inscripción</TableHead>
                      <TableHead className="" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedStudents[semester].map((student) => (
                      <TableRow key={student.id} className="border-b border-gray-200 last:border-b-0">
                        <TableCell className="font-medium text-gray-500">{student.id}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <div className={`w-4 h-4 rounded-full ${getStatusColor(student.status)}`} />
                          </div>
                        </TableCell>
                        {/* Remove the "Ver comentario" button by modifying the TableCell with buttons */}
                        {/* Replace the TableCell containing the buttons with: */}
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              variant="default"
                              size="sm"
                              className="flex items-center gap-1 text-white"
                              onClick={() => handleViewSchedule(student.id)}
                            >
                              <Calendar className="h-4 w-4" />
                              <span>Ver horario</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            No se encontraron estudiantes que coincidan con la búsqueda.
          </div>
        )}
      </div>

      <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comentario del Estudiante</DialogTitle>
          </DialogHeader>
          <p className="mt-4">{selectedComment}</p>
        </DialogContent>
      </Dialog>
    </div>
  )
}

