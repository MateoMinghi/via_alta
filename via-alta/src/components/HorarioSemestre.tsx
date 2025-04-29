'use client';

import React from 'react';
import CoordinadorSchedule from './CoordinadorSchedule';
import { GeneralScheduleItem } from '@/lib/models/general-schedule';

interface HorariosSlugProps {
    schedule: GeneralScheduleItem[];
    semesterNum: number | null;
}

export default function HorarioSemestre({ schedule, semesterNum }: HorariosSlugProps) {

    if (semesterNum === null) {
        return (
            <div className="p-4">
                <p className="text-center text-red-600">Semestre no válido</p>
            </div>
        );
    }

    return (
        <div> 
            <p className="text-3xl font-bold mb-4">
                Horario del semestre {semesterNum}
            </p>
            {schedule.length > 0 ? (
                <CoordinadorSchedule subjects={schedule} />
            ) : (
                <p className="text-center py-4">No hay materias disponibles para el semestre {semesterNum}</p>
            )}
        </div>
    );
}
