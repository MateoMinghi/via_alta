import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Professor } from '@/api/getProfessors';
import { Check, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetSubjects } from '@/api/getSubjects';

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
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Use the existing hook to get subjects instead of direct fetch
  const { result: subjectResults, loading: isLoading, error: subjectError } = useGetSubjects();
  
  // Extract unique degrees from the subjects data
  const extractUniqueDegrees = (subjects: Subject[]): Degree[] => {
    const degreeMap = new Map<number, Degree>();
    
    subjects.forEach(subject => {
      if (subject.plans) {
        subject.plans.forEach(plan => {
          if (plan.degree && !degreeMap.has(plan.degree.id)) {
            degreeMap.set(plan.degree.id, plan.degree);
          }
        });
      }
    });
    
    return Array.from(degreeMap.values());
  };
  
  // Process subjects data when it's loaded
  useEffect(() => {
    if (subjectResults && Array.isArray(subjectResults)) {
      try {
        console.log("Processing subject results:", subjectResults);
        
        // Map the subjects to the format expected by this component
        const mappedSubjects: Subject[] = subjectResults.map(subject => ({
          id: subject.id,
          name: subject.name,
          credits: "",
          plans: [] // Initialize with empty plans
        }));
        
        setSubjects(mappedSubjects);
        setFilteredSubjects(mappedSubjects);
        
        // If we have any subject-related API error, show it as a toast
        if (subjectError) {
          console.error("Subject fetch error:", subjectError);
          toast.error(`Error loading subjects: ${subjectError}`);
        }
      } catch (error) {
        console.error("Error processing subjects:", error);
        toast.error("Error processing subject data");
      }
    }
  }, [subjectResults, subjectError]);
  
  // Fetch degrees separately
  useEffect(() => {
    const fetchDegrees = async () => {
      try {
        const response = await fetch('/api/degrees');
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setDegrees(data.data);
          } else {
            // Fallback: Extract degrees from subjects
            const extractedDegrees = extractUniqueDegrees(subjects);
            if (extractedDegrees.length > 0) {
              setDegrees(extractedDegrees);
            } else {
              // Hard-coded fallback degrees if no degree data is available
              setDegrees([
                { id: 1, name: "Diseño de Modas", status: "active" },
                { id: 2, name: "Diseño de Interiores", status: "active" },
                { id: 3, name: "Diseño Gráfico", status: "active" }
              ]);
            }
          }
        } else {
          // Fallback: Extract degrees from subjects
          const extractedDegrees = extractUniqueDegrees(subjects);
          if (extractedDegrees.length > 0) {
            setDegrees(extractedDegrees);
          } else {
            // Hard-coded fallback degrees
            setDegrees([
              { id: 1, name: "Diseño de Modas", status: "active" },
              { id: 2, name: "Diseño de Interiores", status: "active" },
              { id: 3, name: "Diseño Gráfico", status: "active" }
            ]);
          }
        }
      } catch (error) {
        console.error("Error fetching degrees:", error);
        
        // Fallback: Extract degrees from subjects or use hard-coded ones
        const extractedDegrees = extractUniqueDegrees(subjects);
        if (extractedDegrees.length > 0) {
          setDegrees(extractedDegrees);
        } else {
          // Hard-coded fallback degrees
          setDegrees([
            { id: 1, name: "Diseño de Modas", status: "active" },
            { id: 2, name: "Diseño de Interiores", status: "active" },
            { id: 3, name: "Diseño Gráfico", status: "active" }
          ]);
        }
      }
    };
    
    // Only fetch degrees when subjects are loaded
    if (subjects.length > 0) {
      fetchDegrees();
    }
  }, [subjects]);
  
  // Set selected subjects when professor or subjects change
  useEffect(() => {
    if (!professor?.classes || subjects.length === 0) return;
    
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
  }, [professor?.classes, subjects]);

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

  // Update filtered subjects based on both degree and search query
  useEffect(() => {
    let filtered = [...subjects];
    
    // Apply degree filter
    if (selectedDegree !== "all") {
      filtered = filtered.filter(subject => 
        subject.plans?.some(plan => 
          plan.degree && plan.degree.name === selectedDegree
        )
      );
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(subject => 
        subject.name.toLowerCase().includes(query)
      );
    }
    
    setFilteredSubjects(filtered);
  }, [subjects, selectedDegree, searchQuery]);

  const handleDegreeChange = (value: string) => {
    setSelectedDegree(value);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Asigne las materias para {professor?.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
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
          
          <div>
            <label className="text-sm font-medium mb-2 block">Buscar por Nombre:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Buscar materia..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mb-2"></div>
            <p className="text-gray-500">Cargando materias disponibles...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No hay materias disponibles</p>
          </div>
        ) : filteredSubjects.length > 0 ? (
          <div className="max-h-[400px] overflow-y-auto mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredSubjects.map((subject) => (
                <div 
                  key={subject.id} 
                  className={`p-2 border rounded-md cursor-pointer ${
                    selectedSubjects.has(subject.id) ? 'bg-red-100 border-red-500' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleSubject(subject.id)}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 mr-2 flex items-center justify-center border rounded ${
                      selectedSubjects.has(subject.id) ? 'bg-red-500 border-red-500' : 'border-gray-400'
                    }`}>
                      {selectedSubjects.has(subject.id) && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-sm">{subject.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">No se encontraron materias que coincidan con los filtros actuales</p>
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
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
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