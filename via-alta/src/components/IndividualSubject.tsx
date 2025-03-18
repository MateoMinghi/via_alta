import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { ScheduleItem } from "@/lib/schedule-generator"

interface IndividualSubjectProps {
  subject: ScheduleItem | null
  isOpen: boolean
  onClose: () => void
}

export function IndividualSubject({ subject, isOpen, onClose }: IndividualSubjectProps) {
  if (!subject) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{subject.subject}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Profesor:</div>
            <div className="col-span-3">{subject.teacher}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Día:</div>
            <div className="col-span-3">{subject.day}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Hora:</div>
            <div className="col-span-3">{subject.time}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Salón:</div>
            <div className="col-span-3">{subject.classroom}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}