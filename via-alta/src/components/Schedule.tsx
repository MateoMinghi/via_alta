"use client";
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Eye } from 'lucide-react';
import Subjects from './Subjects';
import ScheduleView from './ScheduleView';

function Schedule() {
    const [showScheduleView, setShowScheduleView] = useState(true);

    const toggleView = () => {
        setShowScheduleView(!showScheduleView);
    };
    const subjects = [
      {
        id: 129,
        title: "Matemáticas",
        description: "Un curso introductorio a las Matemáticas.",
        professor: "Dr. John Doe",
        credits: 3,
        hours: [
          { day: "Lunes", time: "10:00" },
          { day: "Lunes", time: "11:00" },
          { day: "Miércoles", time: "10:00" },
        ],
      },
      {
        id: 202,
        title: "Historia",
        description: "Un estudio comprensivo de la historia mundial.",
        professor: "Dr. Jane Doe",
        credits: 9,
        hours: [
          { day: "Martes", time: "14:00" },
          { day: "Jueves", time: "14:00" },
          { day: "Viernes", time: "10:00" },
        ],
      },
      {
        id: 401,
        title: "Literatura",
        description: "Exploración de la literatura clásica y moderna.",
        professor: "Dr. Emily Bronte",
        credits: 4,
        hours: [
          { day: "Lunes", time: "08:00" },
          { day: "Miércoles", time: "08:00" },
        ],
      },
      {
        id: 502,
        title: "Física",
        description: "Fundamentos de mecánica y termodinámica.",
        professor: "Dr. Albert Einstein",
        credits: 5,
        hours: [
          { day: "Martes", time: "10:00" },
          { day: "Jueves", time: "10:00" },
          { day: "Viernes", time: "08:00" },
        ],
      },
      {
        id: 603,
        title: "Química",
        description: "Introducción a la química orgánica e inorgánica.",
        professor: "Dr. Marie Curie",
        credits: 4,
        hours: [
          { day: "Lunes", time: "14:00" },
          { day: "Miércoles", time: "14:00" },
        ],
      },
      {
        id: 704,
        title: "Filosofía",
        description: "Un estudio de pensamientos y teorías filosóficas.",
        professor: "Dr. Sócrates",
        credits: 3,
        hours: [
          { day: "Martes", time: "08:00" },
          { day: "Jueves", time: "08:00" },
        ],
      },
      {
        id: 805,
        title: "Arte",
        description: "Historia y técnicas de las artes visuales.",
        professor: "Dr. Leonardo da Vinci",
        credits: 2,
        hours: [
          { day: "Viernes", time: "16:00" },
        ],
      },
      {
        id: 906,
        title: "Ciencias de la Computación",
        description: "Introducción a algoritmos y programación.",
        professor: "Dr. Alan Turing",
        credits: 6,
        hours: [
          { day: "Lunes", time: "18:00" },
          { day: "Miércoles", time: "18:00" },
          { day: "Viernes", time: "12:00" },
        ],
      },
      {
        id: 9346,
        title: "Coordinación de eventos de moda",
        description: "Introducción a algoritmos y programación.",
        professor: "Dr. Alan Turing",
        credits: 6,
        hours: [
          { day: "Lunes", time: "8:00" },
          { day: "Miércoles", time: "8:00" },
          { day: "Viernes", time: "8:00" },
        ],
      }
    ];

  return (
    <div className='p-4'>
        {!showScheduleView && <ScheduleView subjects={subjects}/>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {showScheduleView && <Subjects subjects={subjects} />}
            <button 
                className="text-via w-full h-full border-1 flex flex-col items-center justify-center rounded-lg py-8"
                onClick={toggleView}
            >
                <Eye className="w-16 h-16" />
                <span className='p-4 text-3xl font-bold'>Vista Previa</span>
            </button>
        </div> 
        <div className='flex flex-col sm:flex-row justify-between gap-8 py-8'>
            <Button className='w-full font-bold'>Confirmar Horario</Button>
            <Button className='w-full border-2 border-via text-via font-bold' variant="outline">Solicitar Cambios</Button>
        </div>
    </div>
  );
}

export default Schedule;