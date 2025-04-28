'use client';

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GeneralScheduleItem } from "@/lib/models/general-schedule";
import { toast } from "sonner";
import { useGetSubjects } from "@/api/getSubjects";

// Default careers to use if none are found in database
const DEFAULT_CAREERS = [
  "Ingeniería en Sistemas", 
  "Ingeniería Industrial", 
  "Contaduría Pública",
  "Administración de Empresas"
];

interface AddGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newGroup: GeneralScheduleItem) => void;
  currentCycleId?: number;
  editGroupData?: GeneralScheduleItem | null;
}

export default function AddGroupDialog({ 
  isOpen, 
  onClose, 
  onAdd,
  currentCycleId = 1, // Default cycle ID if not provided
  editGroupData = null // Optional data for editing an existing group
}: AddGroupDialogProps) {
  // Initial empty group state
  const initialGroup: GeneralScheduleItem = {
    IdHorarioGeneral: currentCycleId,
    NombreCarrera: "",
    IdGrupo: 0,
    Dia: "Lunes",
    HoraInicio: "07:00",
    HoraFin: "08:00",
    Semestre: 1,
    MateriaNombre: "",
    ProfesorNombre: "",
    IdSalon: undefined, // Add classroom field
  };
  
  const [newGroup, setNewGroup] = useState<GeneralScheduleItem>(initialGroup);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for dropdown options
  const [professors, setProfessors] = useState<{ id: number | string, name: string }[]>([]);
  const [professorsLoading, setProfessorsLoading] = useState(true);
  const [careers, setCareers] = useState<string[]>(DEFAULT_CAREERS); // Initialize with default careers
  const [careersLoading, setCareersLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<{ idsalon: number, tipo: string, cupo: number }[]>([]);
  const [classroomsLoading, setClassroomsLoading] = useState(true);
  const { result: subjects, loading: subjectsLoading } = useGetSubjects();

  // Reset form when dialog opens/closes or when editGroupData changes
  useEffect(() => {
    if (isOpen) {
      // If we're editing a group, use that data; otherwise start fresh
      if (editGroupData) {
        setNewGroup(editGroupData);
      } else {
        setNewGroup({...initialGroup, IdHorarioGeneral: currentCycleId});
        // Generate a new unique group ID when creating a new group
        generateUniqueGroupId().then(id => {
          setNewGroup(prev => ({ ...prev, IdGrupo: id }));
        });
      }
      
      fetchProfessors();
      fetchCareers();
      fetchClassrooms();
    }
  }, [isOpen, currentCycleId, editGroupData]);

  // Fetch professors from database
  const fetchProfessors = async () => {
    setProfessorsLoading(true);
    try {
      console.log("Fetching professors from database...");
      const response = await fetch('/api/professors');
      const data = await response.json();
      
      console.log("Professors API response:", data);
      
      if (data.success && Array.isArray(data.data)) {
        // Check if we have any professors 
        if (data.data.length > 0) {
          const formattedProfessors = data.data.map((prof: any) => ({
            id: prof.IdProfesor || prof.idprofesor,
            name: prof.Nombre || prof.nombre
          }));
          console.log("Formatted professors:", formattedProfessors);
          setProfessors(formattedProfessors);
        } else {
          console.warn("No professors found in database");
          // Add some default professors if none were found
          setProfessors([
            { id: 1, name: "Profesor Default 1" },
            { id: 2, name: "Profesor Default 2" },
          ]);
          toast.warning("No se encontraron profesores en la base de datos. Usando valores predeterminados.");
        }
      } else {
        console.error("Invalid response format from API:", data);
        setProfessors([
          { id: 1, name: "Profesor Default 1" },
          { id: 2, name: "Profesor Default 2" },
        ]);
        toast.warning("Formato de respuesta inválido. Usando valores predeterminados.");
      }
    } catch (error) {
      console.error("Error fetching professors:", error);
      setProfessors([
        { id: 1, name: "Profesor Default 1" },
        { id: 2, name: "Profesor Default 2" },
      ]);
      toast.error("Error cargando profesores. Usando valores predeterminados.");
    } finally {
      setProfessorsLoading(false);
    }
  };

  // Fetch careers from API (degree programs)
  const fetchCareers = async () => {
    setCareersLoading(true);
    try {
      console.log("Fetching careers from database...");
      const response = await fetch('/api/schedule/degree-programs');
      const data = await response.json();
      
      console.log("Careers API response:", data);
      
      if (data.success && Array.isArray(data.data)) {
        if (data.data.length > 0) {
          // Handle both PascalCase and camelCase property names with proper type checking
          const careerNames = Array.from(new Set(data.data.map((item: any) => 
            (item.NombreCarrera || item.nombrecarrera) as string
          ))).filter((name): name is string => typeof name === 'string');
          
          console.log("Formatted careers:", careerNames);
          
          if (careerNames.length > 0) {
            setCareers(careerNames);
            return;
          } else {
            console.warn("No careers found in response data");
          }
        } else {
          console.warn("Empty careers array in response");
        }
      } else {
        console.error("Invalid response format from API:", data);
      }
      
      // If we get here, use default careers
      console.log("Using default careers:", DEFAULT_CAREERS);
      setCareers(DEFAULT_CAREERS);
      toast.warning("No se encontraron carreras en la base de datos. Usando valores predeterminados.");
      
    } catch (error) {
      console.error("Error fetching careers:", error);
      setCareers(DEFAULT_CAREERS);
      toast.error("Error cargando carreras. Usando valores predeterminados.");
    } finally {
      setCareersLoading(false);
    }
  };

  // Fetch classrooms from database
  const fetchClassrooms = async () => {
    setClassroomsLoading(true);
    try {
      console.log("Fetching classrooms from database...");
      const response = await fetch('/api/classroom');
      const data = await response.json();
      
      console.log("Classrooms API response:", data);
      
      // Data is directly an array of classrooms, not wrapped in a data property
      if (Array.isArray(data)) {
        // Check if we have any classrooms 
        if (data.length > 0) {
          const formattedClassrooms = data.map((classroom: any) => ({
            idsalon: classroom.idsalon,
            tipo: classroom.tipo,
            cupo: classroom.cupo
          }));
          console.log("Formatted classrooms:", formattedClassrooms);
          setClassrooms(formattedClassrooms);
        } else {
          console.warn("No classrooms found in database");
          // Add some default classrooms if none were found
          setClassrooms([
            { idsalon: 1, tipo: "Aula", cupo: 30 },
            { idsalon: 2, tipo: "Laboratorio", cupo: 20 },
          ]);
          toast.warning("No se encontraron salones en la base de datos. Usando valores predeterminados.");
        }
      } else {
        console.error("Invalid response format from API:", data);
        setClassrooms([
          { idsalon: 1, tipo: "Aula", cupo: 30 },
          { idsalon: 2, tipo: "Laboratorio", cupo: 20 },
        ]);
        toast.warning("Formato de respuesta inválido. Usando valores predeterminados.");
      }
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      setClassrooms([
        { idsalon: 1, tipo: "Aula", cupo: 30 },
        { idsalon: 2, tipo: "Laboratorio", cupo: 20 },
      ]);
      toast.error("Error cargando salones. Usando valores predeterminados.");
    } finally {
      setClassroomsLoading(false);
    }
  };
  
  // Generate a unique group ID
  const generateUniqueGroupId = async (): Promise<number> => {
    try {
      const response = await fetch('/api/schedule/next-group-id');
      const data = await response.json();
      
      if (data.success && data.nextId) {
        console.log(`Generated next group ID: ${data.nextId}`);
        return data.nextId;
      } else {
        console.warn("Could not get next group ID from API, using fallback method");
        // Fallback to a random ID if the API fails
        const randomId = Math.floor(1000 + Math.random() * 9000);
        return randomId;
      }
    } catch (error) {
      console.error("Error generating unique group ID:", error);
      // Fallback to a random ID
      const randomId = Math.floor(1000 + Math.random() * 9000);
      return randomId;
    }
  };

  // Array of available days
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  
  // Generate available time slots (7:00 to 16:30 in 30-minute increments)
  const timeSlots = (() => {
    const slots = [];
    for (let i = 7; i <= 16; i++) {
      slots.push(`${String(i).padStart(2, '0')}:00`);
      slots.push(`${String(i).padStart(2, '0')}:30`);
    }
    return slots;
  })();

  // Validate the group data before adding
  const validateGroup = (): boolean => {
    if (!newGroup.MateriaNombre) {
      toast.error("El nombre de la materia es obligatorio");
      return false;
    }
    if (!newGroup.IdGrupo || newGroup.IdGrupo <= 0) {
      toast.error("El ID de grupo debe ser un número positivo");
      return false;
    }
    if (!newGroup.ProfesorNombre) {
      toast.error("El nombre del profesor es obligatorio");
      return false;
    }
    if (!newGroup.NombreCarrera) {
      toast.error("El nombre de la carrera es obligatorio");
      return false;
    }
    
    // Validate that end time is after start time
    const startTime = newGroup.HoraInicio.split(':').map(Number);
    const endTime = newGroup.HoraFin.split(':').map(Number);
    const startMinutes = startTime[0] * 60 + startTime[1];
    const endMinutes = endTime[0] * 60 + endTime[1];
    
    if (endMinutes <= startMinutes) {
      toast.error("La hora de finalización debe ser posterior a la hora de inicio");
      return false;
    }
    
    return true;
  };

  const handleAdd = async () => {
    if (!validateGroup()) return;
    
    setIsLoading(true);
    try {
      // Find professor ID from name
      const selectedProfessor = professors.find(prof => prof.name === newGroup.ProfesorNombre);
      if (!selectedProfessor) {
        throw new Error("No se pudo encontrar el ID del profesor seleccionado");
      }
      
      // Find subject ID from name
      const selectedSubject = subjects?.find((subj: any) => subj.name === newGroup.MateriaNombre);
      if (!selectedSubject) {
        throw new Error("No se pudo encontrar el ID de la materia seleccionada");
      }
      
      // Ensure subject ID is a valid integer
      if (!selectedSubject.id || isNaN(parseInt(selectedSubject.id.toString()))) {
        throw new Error(`ID de materia inválido: ${selectedSubject.id}`);
      }
      
      // Create or update the group in the database using the group-generator API
      const endpoint = editGroupData ? '/api/group/update' : '/api/group/create';
      
      const groupParams = {
        idGrupo: newGroup.IdGrupo,
        idMateria: parseInt(selectedSubject.id.toString()), // Ensure integer
        idProfesor: selectedProfessor.id,
        idSalon: newGroup.IdSalon,
        idCiclo: currentCycleId,
        semestre: newGroup.Semestre
      };
      
      console.log("Sending group data to API:", groupParams);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupParams)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Now create/update the general schedule entry
        const scheduleResponse = await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            schedule: [{
              ...newGroup,
              IdMateria: parseInt(selectedSubject.id.toString()), // Ensure integer
              IdProfesor: selectedProfessor.id
            }] 
          })
        });
        
        const scheduleData = await scheduleResponse.json();
        
        if (scheduleData.success) {
          toast.success(editGroupData ? "Grupo actualizado correctamente" : "Grupo agregado correctamente");
          
          // If everything was successful, update the UI
          onAdd(newGroup);
          onClose();
        } else {
          throw new Error(scheduleData.error || "Error al guardar el horario general");
        }
      } else {
        // Log detailed error information for debugging
        console.error("API error details:", data);
        
        // Provide more specific error messages based on common cases
        if (data.error && data.error.includes("Subject with ID")) {
          throw new Error(`La materia seleccionada (ID: ${selectedSubject.id}) no existe en la base de datos. Por favor, actualice la lista de materias o seleccione una materia diferente.`);
        } else if (data.error && data.error.includes("Professor with ID")) {
          throw new Error(`El profesor seleccionado (ID: ${selectedProfessor.id}) no existe en la base de datos. Por favor, actualice la lista de profesores o seleccione un profesor diferente.`);
        } else {
          throw new Error(data.error || "Error al crear/actualizar el grupo");
        }
      }
    } catch (error) {
      console.error(editGroupData ? "Error updating group:" : "Error adding group:", error);
      toast.error(editGroupData ? `Error al actualizar el grupo: ${error instanceof Error ? error.message : 'Error desconocido'}` : 
                                `Error al agregar el grupo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editGroupData ? "Editar Grupo" : "Agregar Nuevo Grupo"}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-IdGrupo" className="text-right">ID Grupo</Label>
              <Input
                id="edit-IdGrupo"
                type="number"
                value={newGroup.IdGrupo}
                onChange={(e) => setNewGroup({...newGroup, IdGrupo: parseInt(e.target.value) || 0})}
                className="col-span-3"
                readOnly={editGroupData !== null} // Make read-only when editing
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-MateriaNombre" className="text-right">Materia</Label>
              <Select 
                value={newGroup.MateriaNombre || ""} 
                onValueChange={(value) => setNewGroup({...newGroup, MateriaNombre: value})}
                disabled={subjectsLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar materia" />
                </SelectTrigger>
                <SelectContent>
                  {subjects && subjects.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                  {(!subjects || subjects.length === 0) && (
                    <SelectItem value="default">No hay materias disponibles</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-ProfesorNombre" className="text-right">Profesor</Label>
              <Select 
                value={newGroup.ProfesorNombre || ""} 
                onValueChange={(value) => setNewGroup({...newGroup, ProfesorNombre: value})}
                disabled={professorsLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar profesor" />
                </SelectTrigger>
                <SelectContent>
                  {professors && professors.map((prof) => (
                    <SelectItem key={prof.id} value={prof.name}>
                      {prof.name}
                    </SelectItem>
                  ))}
                  {(!professors || professors.length === 0) && (
                    <SelectItem value="default">No hay profesores disponibles</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-NombreCarrera" className="text-right">Carrera</Label>
              <Select 
                value={newGroup.NombreCarrera || ""} 
                onValueChange={(value) => setNewGroup({...newGroup, NombreCarrera: value})}
                disabled={careersLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar carrera" />
                </SelectTrigger>
                <SelectContent>
                  {careers.map((career) => (
                    <SelectItem key={career} value={career}>
                      {career}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-Dia" className="text-right">Día</Label>
              <Select 
                value={newGroup.Dia} 
                onValueChange={(value) => setNewGroup({...newGroup, Dia: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-HoraInicio" className="text-right">Hora Inicio</Label>
              <Select 
                value={newGroup.HoraInicio} 
                onValueChange={(value) => setNewGroup({...newGroup, HoraInicio: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-HoraFin" className="text-right">Hora Fin</Label>
              <Select 
                value={newGroup.HoraFin} 
                onValueChange={(value) => setNewGroup({...newGroup, HoraFin: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-Semestre" className="text-right">Semestre</Label>
              <Select 
                value={newGroup.Semestre?.toString() || '1'} 
                onValueChange={(value) => setNewGroup({...newGroup, Semestre: parseInt(value)})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>{`Semestre ${sem}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-IdSalon" className="text-right">Salón</Label>
              <Select 
                value={newGroup.IdSalon?.toString() || ''} 
                onValueChange={(value) => setNewGroup({...newGroup, IdSalon: parseInt(value)})}
                disabled={classroomsLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar salón" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((classroom) => (
                    <SelectItem key={classroom.idsalon} value={classroom.idsalon.toString()}>
                      {`Salón ${classroom.idsalon} - ${classroom.tipo} (Cupo: ${classroom.cupo})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={isLoading}>
              {isLoading ? (editGroupData ? "Actualizando..." : "Agregando...") : (editGroupData ? "Actualizar" : "Agregar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}