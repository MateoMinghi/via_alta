'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';

interface Student {
    id: string;
    name: string;
    first_surname: string;
    second_surname: string;
    ivd_id: string;
    semestre: string;
    status: string;
    isIrregular: boolean;
}

interface StatusTableProps {
    students: Student[];
}

export default function StatusGrid({ students }: StatusTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredStudents, setFilteredStudents] = useState(students);
    const router = useRouter();

    const groupedStudents = filteredStudents.reduce(
        (acc, student) => {
            const key = student.isIrregular ? 'N/A' : student.semestre;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(student);
            return acc;
        },
        {} as Record<string, Student[]>,
    );

    const semesters = Object.keys(groupedStudents).sort((a, b) => {
        if (a === 'N/A') return 1;
        if (b === 'N/A') return -1;
        return Number.parseInt(a) - Number.parseInt(b);
    });

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredStudents(students);
            return;
        }

        const query = searchQuery.toLowerCase();
        const results = students.filter(
            (student) =>
                student.ivd_id.toLowerCase().includes(query) ||
                student.name.toLowerCase().includes(query) ||
                (student.ivd_id && String(student.ivd_id).toLowerCase().includes(query)),
        );
        setFilteredStudents(results);
    }, [searchQuery, students]);

    const handleViewSchedule = (studentId: string) => {
        if (!studentId) {
            toast.error('Este estudiante no tiene un ID de matrícula válido');
            return;
        }
        router.push(`dashboard/horarios/${studentId}`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'inscrito':
                return 'bg-emerald-500 text-white';
            case 'requiere-cambios':
                return 'bg-amber-400 text-white';
            case 'no-inscrito':
                return 'bg-red-500 text-white';
            default:
                return 'bg-red-500 text-white';
        }
    };

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
            </div>

            <p className="font-bold text-xl text-via mb-4">ESTUDIANTES ACTIVOS POR SEMESTRE</p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {semesters.map((semester) => (
                    <Card key={semester}>
                        <CardHeader>
                            <CardTitle>
                                {semester === 'N/A' ? 'Estudiantes Irregulares' : `Semestre ${semester}`}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-2">
                                Total: {groupedStudents[semester].length} estudiantes
                            </p>
                            <div className="max-h-60 overflow-y-auto">
                                <ul className="divide-y">
                                    {groupedStudents[semester].map((student) => (
                                        <li key={student.id} className="py-2">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">
                                                        {student.name} {student.first_surname} {student.second_surname}
                                                    </span>
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded ${getStatusColor(student.status)}`}
                                                    >
                                                        {student.status === 'active'
                                                            ? 'no inscrito'
                                                            : student.status.replace('-', ' ') || 'Inactivo'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm text-gray-500">
                                                    <div>
                                                        <span className="font-medium">Matrícula:</span> {student.ivd_id || 'N/A'}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex items-center gap-1 border-via text-via hover:bg-red-50"
                                                        onClick={() => handleViewSchedule(student.ivd_id)}
                                                    >
                                                        <Calendar className="h-3 w-3" />
                                                        <span className="text-xs">Horario</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
