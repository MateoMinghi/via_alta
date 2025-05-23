'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, X, RefreshCw, BookOpen, User, Book, PenLine, Trash, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import ProfessorGrid from '@/components/ProfessorGrid';
import ProfessorClasses from '@/components/ProfessorClasses';
import ProfessorListWithSearch from '@/components/ProfessorListWithSearch';
import { getProfessors, getProfessorsFromDatabase } from '@/api/getProfessors';
import { saveAvailabilityToDatabase, getAvailabilityFromDatabase } from '@/lib/utils/availability-utils';
import { parseClassesToSubjects, type Subject } from '@/lib/utils/professor-utils';

export type Professor = {
    id: number;
    name: string;
    department: string;
    classes?: string;
    ivd_id?: string;
    first_name?: string;
    last_name?: string;
    first_surname?: string;
    second_surname?: string;
};

export default function Profesor() {
    const [professors, setProfessors] = useState<Professor[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedSlots, setSelectedSlots] = useState<Record<string, boolean>>({});
    const [originalSlots, setOriginalSlots] = useState<Record<string, boolean>>({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showClassesEditor, setShowClassesEditor] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'search'>('list');

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            const { result, error } = await getProfessors();
            setProfessors(result);
            if (error) {
                setError(error);
                
                // Try to use database as fallback if API fails
                if (result && result.length === 0) {
                    console.log("Attempting to fetch professors from database as fallback");
                    const dbProfessors = await getProfessorsFromDatabase();
                    if (dbProfessors && dbProfessors.length > 0) {
                        setProfessors(dbProfessors);
                        setError(""); // Clear error if we got professors from the database
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
            console.error("Error in fetchData:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);    // Effect to detect unsaved changes
    useEffect(() => {
        const checkForChanges = () => {
            // Compare original slots with current selected slots
            const originalKeys = Object.keys(originalSlots);
            const currentKeys = Object.keys(selectedSlots);
            
            // Quick check if number of keys is different
            if (originalKeys.length !== currentKeys.length) {
                setHasUnsavedChanges(true);
                return;
            }
            
            // Check if any slot has changed status
            for (const key of currentKeys) {
                if (selectedSlots[key] !== originalSlots[key]) {
                    setHasUnsavedChanges(true);
                    return;
                }
            }
            
            // Check if any original slot was removed
            for (const key of originalKeys) {
                if (selectedSlots[key] !== originalSlots[key]) {
                    setHasUnsavedChanges(true);
                    return;
                }
            }
            
            setHasUnsavedChanges(false);
        };
        
        checkForChanges();
    }, [selectedSlots, originalSlots]);const handleProfessorSelect = async (professor: Professor) => {
        console.log("Selected professor details:", professor);
        try {
            // First, fetch availability before updating any state
            const { slots } = await getAvailabilityFromDatabase(professor.id);
            
            setSelectedProfessor(professor);
            setSelectedSlots(slots); // Set the fetched availability
            setOriginalSlots(slots); // Track original availability
            setHasUnsavedChanges(false); // Reset unsaved changes flag
            setShowClassesEditor(false);
            
            // Fetch the latest professor data from database to ensure we have updated classes
            const response = await fetch(`/api/professors/single?professorId=${professor.id}`);
            const data = await response.json();

            if (data.success && data.data) {
                console.log("Professor data from database:", data.data);
                // Update the selected professor with the most recent data from the database
                const updatedProfessor = {
                    ...professor,
                    classes: data.data.clases || data.data.Clases || ''
                };
                
                // Update the selected professor state
                setSelectedProfessor(updatedProfessor);
                
                // Also update this professor in the professors array if needed
                if (professors) {
                    const newProfessors = [...professors];
                    const index = newProfessors.findIndex(p => p.id === professor.id);
                    if (index !== -1) {
                        newProfessors[index] = updatedProfessor;
                        setProfessors(newProfessors);
                    }
                }
            } else {
                console.error("Failed to get updated professor data:", data.error);
            }
        } catch (err) {
            console.error("Error fetching professor data:", err);
        }
    };

    const handleEditClasses = (professor: Professor) => {
        handleProfessorSelect(professor).then(() => {
            setShowClassesEditor(true);
        });
    };    const removeSelectedProfessor = () => {
        // Check if there are unsaved changes and confirm before leaving
        if (hasUnsavedChanges) {
            const confirmLeave = window.confirm("Tienes cambios sin guardar en la disponibilidad. ¿Deseas salir sin guardar?");
            if (!confirmLeave) {
                return; // User chose to stay on the page
            }
        }
        setSelectedProfessor(null);
        setSelectedSlots({});
        setOriginalSlots({});
        setHasUnsavedChanges(false);
        setShowClassesEditor(false);
    };

    // Helper function to format professor name properly
    const formatProfessorName = (professor: Professor): string => {
        if (professor.first_surname || professor.second_surname) {
            // If we have surname data, prioritize using name + surnames format
            const nameParts = [];
            if (professor.first_name) nameParts.push(professor.first_name);
            if (professor.first_surname) nameParts.push(professor.first_surname);
            if (professor.second_surname) nameParts.push(professor.second_surname);
            return nameParts.length > 0 ? nameParts.join(' ') : professor.name;
        } 
        else if (professor.first_name || professor.last_name) {
            // Fall back to first_name and last_name fields
            return `${professor.first_name || ''} ${professor.last_name || ''}`.trim();
        }
        // Fallback to just the name field
        return professor.name || 'Profesor';
    };    const handleSaveAvailability = async () => {
        if (!selectedProfessor) {
            alert("Please select a professor.");
            return;
        }

        setIsSaving(true);
        
        try {
            // Save availability to database
            await saveAvailabilityToDatabase(
                selectedProfessor.id, 
                selectedSlots
            );
            alert('Se guardó la disponibilidad del profesor en la base de datos!');
            setOriginalSlots(selectedSlots); // Update original slots after saving
            setHasUnsavedChanges(false); // Reset unsaved changes flag
        } catch (err) {
            console.error("Error saving availability:", err);
            alert('Error al guardar la disponibilidad. Por favor intente nuevamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClassesEditComplete = async (updatedClasses?: string) => {
        setShowClassesEditor(false);
        
        if (selectedProfessor) {
            // If we received updated classes directly from the ProfessorClasses component,
            // use them to immediately update the state without making an API call
            if (updatedClasses !== undefined) {
                console.log("Directly updating professor with classes:", updatedClasses);
                
                // Update the selected professor with the classes we just saved
                const updatedProfessor = {
                    ...selectedProfessor,
                    classes: updatedClasses
                };
                
                // Update the selected professor state
                setSelectedProfessor(updatedProfessor);
                
                // Also update this professor in the professors array if needed
                if (professors) {
                    const newProfessors = [...professors];
                    const index = newProfessors.findIndex(p => p.id === selectedProfessor.id);
                    if (index !== -1) {
                        newProfessors[index] = updatedProfessor;
                        setProfessors(newProfessors);
                    }
                }
                
                return; // Skip the API call since we already have the updated data
            }
            
            // If we didn't get updated classes directly, fall back to the API call
            try {
                // Fetch the specific professor directly from the API to get the most up-to-date data
                const response = await fetch(`/api/professors/single?professorId=${selectedProfessor.id}`);
                const data = await response.json();
                
                console.log("Fetched professor data:", data);
                
                if (data.success && data.data) {
                    console.log("Professor data from API:", data.data);
                    console.log("Classes from API:", data.data.clases);
                    
                    // Update the selected professor with the fresh data
                    const updatedProfessor = {
                        ...selectedProfessor,
                        classes: data.data.clases || data.data.Clases || ''
                    };
                    
                    console.log("Updated professor object:", updatedProfessor);
                    
                    // Update the selected professor state
                    setSelectedProfessor(updatedProfessor);
                    
                    // Also update this professor in the professors array
                    if (professors) {
                        const newProfessors = [...professors];
                        const index = newProfessors.findIndex(p => p.id === selectedProfessor.id);
                        if (index !== -1) {
                            newProfessors[index] = updatedProfessor;
                            setProfessors(newProfessors);
                        }
                    }
                } else {
                    console.error("Failed to get updated professor data:", data.error);
                }
            } catch (err) {
                console.error("Error fetching updated professor data:", err);
            }
        }
    };

    return ( 
        <div className="text-start px-16  mx-auto py-8 flex flex-col gap-8">
            
            {loading && (
                <div className="py-8 flex justify-center items-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mb-2"></div>
                        <p className="text-gray-600">Cargando profesores...</p>
                    </div>
                </div>
            )}

            {!loading && error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
                    <p className="font-medium mb-2">Error:</p>
                    <p className="mb-3">{error}</p>
                    <Button 
                        variant="outline" 
                        onClick={fetchData} 
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Reintentar
                    </Button>
                </div>
            )}

            {!loading && professors && !error && professors.length > 0 &&(
                <>
                    {!selectedProfessor && (
                        <>
                                 <div>
                                 <h2 className="font-bold text-3xl mb-4">Registro de Profesores</h2>
                                 <div className="p-4 bg-white rounded-lg text-gray-600 mb-8">
                                   <p>En esta sección, el coordinador puede gestionar los profesores activos, asignar materias, registrar su disponibilidad horaria, buscar profesores, entre otras funciones. Si tienes alguna duda, contacta al soporte técnico.</p>
                                 </div>
                               </div>
                             
                                    <ProfessorListWithSearch 
                                        professors={professors}
                                        onSelectProfessor={handleProfessorSelect}
                                        onEditClasses={handleEditClasses}
                                    />
                                    </>
                    )}

                    {selectedProfessor && (
                        <div className="mt-6 grid grid-cols-1 lg:grid-cols-9 gap-6">
                            {/* Left Column - Professor Details and Classes */}
                            <div className="flex flex-col gap-4 lg:col-span-5">
                                    <div className="flex flex-row items-center justify-between">
                                        <h2 className="text-3xl font-semibold">Gestión de Materias</h2>
                                        <Button 
                                    variant="outline" 
                                    className="text-gray-700 hover:text-gray-900 pl-0"
                                    onClick={removeSelectedProfessor}
                                    >
                                    ← Volver a la lista de profesores
                                    </Button>
                                    </div>

                                    <Card className="p-3 mt-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="m-3 p-2 bg-via rounded-full">
                                                    <User className="h-10 w-10 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-3xl">{formatProfessorName(selectedProfessor)}</p>
                                                    <p className="text-md text-muted-foreground">
                                                        ID: {selectedProfessor.id} {selectedProfessor.ivd_id && `• IVD ID: ${selectedProfessor.ivd_id}`} • Departamento: {selectedProfessor.department}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={removeSelectedProfessor}
                                                className="h-8 w-8 text-red-500"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        
                                    </Card>

                                    {/* Always show the editor */}
                                    <div className="mt-4">
                                        <ProfessorClasses 
                                            professor={selectedProfessor} 
                                            onSave={handleClassesEditComplete} 
                                            onCancel={() => {}}
                                        />
                                    </div>
                            </div>

                            {/* Right Column - Availability Grid */}
                            <div className="flex flex-col lg:col-span-4">
                                <h2 className="text-3xl font-semibold mb-2">Disponibilidad Horaria</h2>
                                <p className="text-md text-gray-500 mb-4">
                                    {selectedProfessor.classes ? 
                                        "Seleccione los horarios en que el profesor está disponible" : 
                                        "Primero asigne materias al profesor antes de registrar su disponibilidad"}
                                </p>
                                
                                {hasUnsavedChanges && (
                                    <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-md flex items-center gap-2 text-amber-800">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>Tienes cambios sin guardar en la disponibilidad</span>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-3 justify-between gap-4">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            setSelectedSlots({});
                                            // Verificar si había slots seleccionados antes para determinar si hay un cambio
                                            if (Object.keys(selectedSlots).length > 0) {
                                                setHasUnsavedChanges(true);
                                            }
                                        }} 
                                        className="w-full bg-red-700 text-white hover:bg-red-800 col-span-1"
                                        disabled={!selectedProfessor.classes}
                                    >
                                        <Trash className="h-4 w-4" />
                                        Limpiar
                                    </Button>
                                    <Button 
                                        className={`w-full flex items-center gap-2 col-span-2 ${hasUnsavedChanges ? 'bg-green-600' : 'bg-green-400 cursor-not-allowed'}`}
                                        onClick={handleSaveAvailability}
                                        disabled={isSaving || !selectedProfessor.classes || !hasUnsavedChanges}
                                    >
                                        {isSaving ? (
                                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        {isSaving ? 'Guardando...' : 'Guardar Disponibilidad'}
                                    </Button>
                                </div>
                                <div className="pt-4">
                                    <ProfessorGrid 
                                        selectedSlots={selectedSlots} 
                                        setSelectedSlots={(slots) => {
                                            setSelectedSlots(slots);
                                            const slotsChanged = JSON.stringify(slots) !== JSON.stringify(originalSlots);
                                            setHasUnsavedChanges(slotsChanged);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
            </>
        )}
        {!loading && (!professors || professors.length === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4 mb-6">
            <p className="font-medium mb-2">No se encontraron profesores</p>
            <p>No hay profesores registrados en el sistema. Contacte al administrador para agregar profesores.</p>
        </div>
        )}
        </div>
    );
}