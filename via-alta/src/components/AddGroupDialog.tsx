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
  };
  
  const [newGroup, setNewGroup] = useState<GeneralScheduleItem>(initialGroup);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for dropdown options
  const [professors, setProfessors] = useState<{ id: number | string, name: string }[]>([]);
  const [professorsLoading, setProfessorsLoading] = useState(true);
  const [careers, setCareers] = useState<string[]>(DEFAULT_CAREERS); // Initialize with default careers
  const [careersLoading, setCareersLoading] = useState(true);
  const { result: subjects, loading: subjectsLoading } = useGetSubjects();

  // Reset form when dialog opens/closes or when editGroupData changes
  useEffect(() => {
    if (isOpen) {
      // If we're editing a group, use that data; otherwise start fresh
      if (editGroupData) {
        setNewGroup(editGroupData);
      } else {
        setNewGroup({...initialGroup, IdHorarioGeneral: currentCycleId});
      }
      
      fetchProfessors();
      fetchCareers();
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

  const handleAdd = () => {
    if (!validateGroup()) return;
    
    setIsLoading(true);
    try {
      // Add or update the group
      onAdd(newGroup);
      toast.success(editGroupData ? "Grupo actualizado correctamente" : "Grupo agregado correctamente");
      onClose();
    } catch (error) {
      console.error(editGroupData ? "Error updating group:" : "Error adding group:", error);
      toast.error(editGroupData ? "Error al actualizar el grupo" : "Error al agregar el grupo");
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