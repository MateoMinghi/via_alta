import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Professor } from '@/api/getProfessors';
import { Check, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfessorClassesProps {
  professor: Professor | null;
  onSave: (updatedClasses?: string) => void;
  onCancel: () => void;
}

// Define interfaces for API response structure
interface Degree {
  id: number;
  name: string;
  status: string;
}

interface Plan {
  id: number;
  version: string;
  status: string;
  degree: Degree;
}

interface Subject {
  id: number;
  name: string;
  credits: string;
  plans: Plan[];
  // Other properties as needed
}

export default function ProfessorClasses({ professor, onSave, onCancel }: ProfessorClassesProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<number>>(new Set());
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [selectedDegree, setSelectedDegree] = useState<string>("all");
  
  // Load subjects and professor's classes when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available subjects
        const response = await fetch('/api/subjects');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const subjectsData = data.data;
            setSubjects(subjectsData);
            setFilteredSubjects(subjectsData); // Initialize filteredSubjects
            
            // Extract unique degrees from subjects
            const uniqueDegrees = extractUniqueDegrees(subjectsData);
            setDegrees(uniqueDegrees);
          }
        }

        // Parse existing classes if professor has any
        if (professor?.classes) {
          // Handle both formats - IDs or names
          if (/^\d+(,\d+)*$/.test(professor.classes)) {
            // If it's a list of numbers (old format)
            const classIds = professor.classes.split(',')
              .map(id => parseInt(id.trim()))
              .filter(id => !isNaN(id));
            setSelectedSubjects(new Set(classIds));
          } else {
            // If it's a list of names (new format)
            // Find the IDs that match the names
            const classNames = professor.classes.split(',').map(name => name.trim());
            const matchingIds = subjects
              .filter(subject => classNames.includes(subject.name))
              .map(subject => subject.id);
            setSelectedSubjects(new Set(matchingIds));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error loading subjects");
      }
    };

    fetchData();
  }, [professor, subjects.length]);
  
  // Extract unique degrees from the subjects data
  const extractUniqueDegrees = (subjects: Subject[]): Degree[] => {
    const degreeMap = new Map<number, Degree>();
    
    subjects.forEach(subject => {
      subject.plans?.forEach(plan => {
        if (plan.degree && !degreeMap.has(plan.degree.id)) {
          degreeMap.set(plan.degree.id, plan.degree);
        }
      });
    });
    
    return Array.from(degreeMap.values());
  };

  const handleSave = async () => {
    if (!professor) return;
    
    setIsSaving(true);
    try {
      // Get the names of the selected subjects
      const selectedSubjectNames = Array.from(selectedSubjects)
        .map(id => subjects.find(subject => subject.id === id)?.name || '')
        .filter(name => name !== '');
      
      // Store the classes as a comma-separated string
      const classesString = selectedSubjectNames.join(',');
      
      // Store the names instead of IDs
      const response = await fetch('/api/professors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          professorId: professor.id,
          classes: classesString
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update classes');
      }

      toast.success('Materias actualizadas correctamente');
      
      // Pass the updated classes string back to the parent component
      // This ensures the UI is updated immediately without waiting for an API fetch
      onSave(classesString);
    } catch (error) {
      console.error("Error saving professor classes:", error);
      toast.error('Error al guardar las materias');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSubject = (subjectId: number) => {
    const newSelected = new Set(selectedSubjects);
    if (newSelected.has(subjectId)) {
      newSelected.delete(subjectId);
    } else {
      newSelected.add(subjectId);
    }
    setSelectedSubjects(newSelected);
  };

  const handleDegreeChange = (value: string) => {
    setSelectedDegree(value);
    
    if (value === "all") {
      setFilteredSubjects(subjects);
    } else {
      const filtered = subjects.filter(subject => 
        subject.plans?.some(plan => 
          plan.degree && plan.degree.name === value
        )
      );
      setFilteredSubjects(filtered);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Asigne las materias para {professor?.name}</CardTitle>
      </CardHeader>      <CardContent>
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Filtrar por Carrera:</label>
          <Select onValueChange={handleDegreeChange} value={selectedDegree}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas las carreras" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las carreras</SelectItem>
              {degrees.map((degree) => (
                <SelectItem key={degree.id} value={degree.name}>{degree.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredSubjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredSubjects.map((subject) => (
              <div 
                key={subject.id} 
                className={`p-2 border rounded-md cursor-pointer ${
                  selectedSubjects.has(subject.id) ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleSubject(subject.id)}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 mr-2 flex items-center justify-center border rounded ${
                    selectedSubjects.has(subject.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-400'
                  }`}>
                    {selectedSubjects.has(subject.id) && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-sm">{subject.name}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">Cargando materias disponibles...</p>
          </div>
        )}

        <div className="mt-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Materias seleccionadas:</span> {selectedSubjects.size}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? (
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Guardando...' : 'Guardar Información del Profesor'}
        </Button>
      </CardFooter>
    </Card>
  );
}