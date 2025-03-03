"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronDown } from "lucide-react"

interface Subject {
  id: number
  title: string
  description: string
  professor: string
  credits: number
  hours: { day: string; time: string }[]
}

interface SubjectsProps {
  subjects: Subject[]
}

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
const timeSlots = ["7:00", "8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00"]

export default function ScheduleView({ subjects }: SubjectsProps) {
  const [activeDayIndex, setActiveDayIndex] = useState(0)

  // Function to find a subject at a specific day and time
  const findSubject = (day: string, time: string) => {
    return subjects.find((subject) =>
      subject.hours.some((hour) => hour.day.toLowerCase() === day.toLowerCase() && hour.time === time),
    )
  }

  // Navigate to the next or previous day in mobile view
  const navigateDay = (direction: number) => {
    const newIndex = (activeDayIndex + direction + daysOfWeek.length) % daysOfWeek.length
    setActiveDayIndex(newIndex)
  }

  return (
    <div className="w-full pb-8">
      {/* Desktop View - Hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Header row with days */}
          <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-1 mb-1">
            <div className="h-14"></div> {/* Empty corner cell */}
            {daysOfWeek.map((day) => (
              <Card key={day} className="flex items-center justify-center h-14 bg-slate-50 border">
                <div className="text-center font-medium text-slate-600">{day}</div>
              </Card>
            ))}
          </div>

          {/* Time slots and subject cells */}
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-[100px_repeat(5,1fr)] gap-1 mb-1">
              {/* Time slot */}
              <Card className="flex items-center justify-center bg-slate-50 border h-20">
                <div className="text-center font-medium text-slate-600">{time}</div>
              </Card>

              {/* Subject cells for each day */}
              {daysOfWeek.map((day) => {
                const subject = findSubject(day, time)
                return subject ? (
                  <Card key={`${day}-${time}`} className="flex items-center justify-center h-full p-2 bg-slate-50 border">
                      <div className="font-medium text-slate-600 text-sm text-center">{subject.title}</div>
                  </Card>
                ) : (
                  <div key={`${day}-${time}`} className="h-full"></div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile View - Visible only on mobile */}
      <div className="md:hidden">
        {/* Day navigation header */}
        <div className="flex justify-center items-center mb-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigateDay(-1)}>
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Previous day</span>
          </Button>

          <Card className="flex-1 max-w-[200px] flex items-center justify-center h-12 bg-slate-50 border mx-2">
            <div className="text-center font-medium text-slate-600">{daysOfWeek[activeDayIndex]}</div>
          </Card>

          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigateDay(1)}>
            <ChevronLeft className="h-5 w-5 rotate-180" />
            <span className="sr-only">Next day</span>
          </Button>
        </div>

        {/* Current day's schedule */}
        <div className="space-y-1">
          {timeSlots.map((time) => {
            const currentDay = daysOfWeek[activeDayIndex]
            const subject = findSubject(currentDay, time)

            return (
              <div key={`mobile-${currentDay}-${time}`} className="flex gap-1">
                <Card className="w-[100px] flex items-center justify-center h-20 bg-slate-50 border">
                  <div className="text-center font-medium text-slate-600">{time}</div>
                </Card>

                {subject ? (
                  <Card className="flex flex-1 p-2 bg-slate-50 border items-center justify-center">
                      <div className="font-medium text-slate-600 text-sm text-center">{subject.title}</div>
                     
                  </Card>
                ) : (
                  <div className="flex-1 h-16"></div>
                )}
              </div>
            )
          })}
        </div>

        {/* Floating action button */}
        <div className="fixed bottom-6 right-6">
          <Button
            className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
            onClick={() => {}}
          >
            <ChevronDown className="h-6 w-6" />
          </Button>
        </div>
      </div>

    
    </div>
  )
}

