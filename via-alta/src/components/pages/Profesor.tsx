'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, X, RefreshCw, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import ProfessorGrid from '../ProfessorGrid';
import ProfessorSearch from '../ProfessorSearch';
import ProfessorClasses from '../ProfessorClasses';
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
    }, []);

    const handleProfessorSelect = async (professor: Professor) => {
        console.log("Selected professor details:", professor);
        setSelectedProfessor(professor);
        setSelectedSlots({}); // Clear slots while loading
        setShowClassesEditor(false); // Hide classes editor when selecting new professor
        
        try {
            // Fetch availability from database
            const availability = await getAvailabilityFromDatabase(professor.id);
            setSelectedSlots(availability);
        } catch (err) {
            console.error("Error fetching professor availability:", err);
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
    };

    const handleClassesEditComplete = () => {
        setShowClassesEditor(false);
        fetchData(); // Refresh professor data to get updated classes
    };

    return (
        <div className="container mx-auto py-6 px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <p className="text-3xl font-bold">Registro de Disponibilidad</p>
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

                    <div className="w-full pl-8 mt-6">
                        <p className="text-2xl font-bold">Profesor seleccionado:</p>
                        {selectedProfessor !== null ? (
                            <div className="mt-4 mb-4">
                                <Card className="p-3 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{selectedProfessor.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {selectedProfessor.id} • {selectedProfessor.department} dpmto
                                            {selectedProfessor.classes && (
                                                <span> • Materias: {selectedProfessor.classes.split(',').length}</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setShowClassesEditor(true)}
                                            className="h-8 w-8 text-blue-500"
                                            title="Editar materias"
                                        >
                                            <BookOpen className="h-4 w-4" />
                                        </Button>
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
                            </div>
                        ) : (
                            <div>
                                <p className="text-gray-500">No hay profesor seleccionado</p>
                                <p className="pt-4">Selecciona un profesor para asignarle disponibilidad</p>
                            </div>
                        )}
                    </div>

                    {selectedProfessor !== null && showClassesEditor && (
                        <div className="py-4">
                            <ProfessorClasses 
                                professor={selectedProfessor} 
                                onSave={handleClassesEditComplete} 
                                onCancel={() => setShowClassesEditor(false)}
                            />
                        </div>
                    )}

                    {selectedProfessor !== null && !showClassesEditor && (
                        <>
                            <div className="pt-4">
                                <ProfessorGrid selectedSlots={selectedSlots} setSelectedSlots={setSelectedSlots} />
                            </div>

                            <div className="flex justify-between mt-8 gap-4">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setSelectedSlots({})} 
                                    className="w-full bg-red-700 text-white hover:bg-red-800"
                                >
                                    Limpiar
                                </Button>
                                <Button 
                                    className="w-full flex items-center gap-2" 
                                    onClick={handleSaveAvailability}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {isSaving ? 'Guardando...' : 'Guardar'}
                                </Button>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}