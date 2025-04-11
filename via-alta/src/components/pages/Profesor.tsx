'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, X, RefreshCw, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import ProfessorGrid from '../ProfessorGrid';
import ProfessorSearch from '../ProfessorSearch';
import ProfessorClasses from '../ProfessorClasses';
import ProfessorClassesList from '../ProfessorClassesList';
import { getProfessors, getProfessorsFromDatabase } from '@/api/getProfessors';
import { saveAvailabilityToDatabase, getAvailabilityFromDatabase } from '@/lib/utils/availability-utils';

export type Professor = {
    id: number;
    name: string;
    department: string;
    classes?: string;
};

export default function Profesor() {
    const [professors, setProfessors] = useState<Professor[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedSlots, setSelectedSlots] = useState<Record<string, boolean>>({});
    const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showClassesEditor, setShowClassesEditor] = useState(false);

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
    }, []);    const handleProfessorSelect = async (professor: Professor) => {
        console.log("Selected professor details:", professor);
        try {
            // First, fetch availability before updating any state
            const availability = await getAvailabilityFromDatabase(professor.id);
            
            setSelectedProfessor(professor);
            setSelectedSlots(availability); // Set the fetched availability
            setShowClassesEditor(false);
            
            // Fetch the latest professor data from database to ensure we have updated classes
            const response = await fetch(`/api/professors/single?professorId=${professor.id}`);
            const data = await response.json();

            if (data.success && data.data) {
                console.log("Professor data from database:", data.data);
                // Update the selected professor with the most recent data from the database
                const updatedProfessor = {
                    ...professor,
                    classes: data.data.clases || ''
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

    const removeSelectedProfessor = () => {
        setSelectedProfessor(null);
        setSelectedSlots({});
        setShowClassesEditor(false);
    };

    const handleSaveAvailability = async () => {
        if (!selectedProfessor) {
            alert("Please select a professor.");
            return;
        }

        setIsSaving(true);
        
        try {
            // Save availability to database
            await saveAvailabilityToDatabase(selectedProfessor.id, selectedSlots);
            alert('Se guardó la disponibilidad del profesor en la base de datos!');
        } catch (err) {
            console.error("Error saving availability:", err);
            alert('Error al guardar la disponibilidad. Por favor intente nuevamente.');
        } finally {
            setIsSaving(false);
        }
    };    const handleClassesEditComplete = async (updatedClasses?: string) => {
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
                    console.log("Professor data from API:", data.data);                    console.log("Classes from API:", data.data.clases);
                    
                    // Update the selected professor with the fresh data
                    const updatedProfessor = {
                        ...selectedProfessor,
                        classes: data.data.clases || ''
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
    };return (
        <div className="container mx-auto py-6 px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <p className="text-3xl font-bold">Registro de Profesores</p>
            </div>

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

            {!loading && professors !== null && !error && (
                <>
                    {professors.length > 0 ? (
                        <ProfessorSearch professors={professors} onProfessorSelect={handleProfessorSelect} />
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4 mb-6">
                            <p className="font-medium mb-2">No se encontraron profesores</p>
                            <p>No hay profesores registrados en el sistema. Contacte al administrador para agregar profesores.</p>
                        </div>
                    )}

                    {selectedProfessor !== null && (
                        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column - Professor Details and Classes */}
                            <div className="flex flex-col space-y-6">
                            <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold">Gestión de Materias</h2>
                                        <Button
                                            onClick={() => setShowClassesEditor(true)}
                                            className="flex items-center gap-2"
                                        >
                                            <BookOpen className="h-4 w-4" />
                                            {selectedProfessor.classes ? 'Editar Materias' : 'Asignar Materias'}
                                        </Button>
                                    </div>
                                <Card className="p-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-lg">{selectedProfessor.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                ID: {selectedProfessor.id} • Departamento: {selectedProfessor.department}
                                            </p>
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

                                {/* Display classes list */}
                                {selectedProfessor.classes && (
                                    <div className="mt-4">
                                        <ProfessorClassesList classes={selectedProfessor.classes} />
                                    </div>
                                )}

                                    {showClassesEditor && (
                                        <ProfessorClasses 
                                            professor={selectedProfessor} 
                                            onSave={handleClassesEditComplete} 
                                            onCancel={() => setShowClassesEditor(false)}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Availability Grid */}
                            <div className="flex flex-col">
                                <h2 className="text-lg font-semibold mb-2">Disponibilidad Horaria</h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    {selectedProfessor.classes ? 
                                        "Seleccione los horarios en que el profesor está disponible" : 
                                        "Primero asigne materias al profesor antes de registrar su disponibilidad"}
                                </p>
                                <div className="pt-4">
                                    <ProfessorGrid 
                                        selectedSlots={selectedSlots} 
                                        setSelectedSlots={setSelectedSlots}
                                        professorId={selectedProfessor.id}
                                    />
                                </div>

                                <div className="flex justify-between mt-8 gap-4">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setSelectedSlots({})} 
                                        className="w-full bg-red-700 text-white hover:bg-red-800"
                                        disabled={!selectedProfessor.classes}
                                    >
                                        Limpiar
                                    </Button>
                                    <Button 
                                        className="w-full flex items-center gap-2" 
                                        onClick={handleSaveAvailability}
                                        disabled={isSaving || !selectedProfessor.classes}
                                    >
                                        {isSaving ? (
                                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        {isSaving ? 'Guardando...' : 'Guardar Disponibilidad'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}