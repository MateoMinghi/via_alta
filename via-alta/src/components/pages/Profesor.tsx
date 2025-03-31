'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, X, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import ProfessorGrid from '../ProfessorGrid';
import ProfessorSearch from '../ProfessorSearch';
import { getProfessors } from '@/api/getProfessors';

export type Professor = {
    id: number;
    name: string;
    department: string;
};

export default function Profesor() {
    const [professors, setProfessors] = useState<Professor[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedSlots, setSelectedSlots] = useState<Record<string, boolean>>({});
    const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);

    // State to store availability in memory
    const [availabilityData, setAvailabilityData] = useState<Record<number, Record<string, boolean>>>({});

    // Load availability data from localStorage on component mount
    useEffect(() => {
        const storedAvailability = localStorage.getItem('availabilityData');
        if (storedAvailability) {
            setAvailabilityData(JSON.parse(storedAvailability));
        }
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            const { result, error } = await getProfessors();
            setProfessors(result);
            if (error) {
                setError(error);
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

    const handleProfessorSelect = (professor: Professor) => {
        console.log("Selected professor details:", professor); // Log all attributes of the selected professor
        setSelectedProfessor(professor);
        // Load existing availability for the selected professor, if any
        setSelectedSlots(availabilityData[professor.id] || {});
    };

    const removeSelectedProfessor = () => {
        setSelectedProfessor(null);
        setSelectedSlots({});
    };

    const handleSaveAvailability = () => {
        if (!selectedProfessor) {
            alert("Please select a professor.");
            return;
        }

        // Save the availability in memory and localStorage
        const updatedAvailability = {
            ...availabilityData,
            [selectedProfessor.id]: selectedSlots,
        };
        setAvailabilityData(updatedAvailability);

        // Save to localStorage
        localStorage.setItem('availabilityData', JSON.stringify(updatedAvailability));
        alert('Se guardó la disponibilidad del profesor!');
        console.log('Availability data:', updatedAvailability);

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
                                </Card>
                            </div>
                        ) : (
                            <div>
                                <p className="text-gray-500">No hay profesor seleccionado</p>
                                <p className="pt-4">Selecciona un profesor para asignarle disponibilidad</p>
                            </div>
                        )}
                    </div>

                    {selectedProfessor !== null && (
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
                                >
                                    <Save className="h-4 w-4" />
                                    Guardar
                                </Button>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}