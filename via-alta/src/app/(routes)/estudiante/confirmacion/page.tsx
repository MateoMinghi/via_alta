'use client';

import EstudianteHeader from '@/components/EstudianteHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

// Possible student statuses
type StudentStatus = 'no-inscrito' | 'inscrito' | 'cambios-solicitados' | 'cancelado';

export default function Confirm() {
  const router = useRouter();
  const currentDate = new Date().toLocaleDateString();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChangesDialogOpen, setIsChangesDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  
  // Student state with status and comments
  const [studentData, setStudentData] = useState({
    id: "00001",
    nombre: "Juan Pérez",
    matricula: "#12345",
    status: 'inscrito' as StudentStatus,
    comentarios: '',
    fecha: currentDate
  });
  
  // Load status from localStorage on mount
  useEffect(() => {
    const savedStatus = localStorage.getItem('studentStatus');
    const savedComments = localStorage.getItem('studentComments');
    
    if (savedStatus) {
      setStudentData(prev => ({
        ...prev,
        status: savedStatus as StudentStatus,
        comentarios: savedComments || '',
        fecha: currentDate
      }));
    } else {
      // If there's no status, redirect to the main view
      router.push('/estudiante');
    }
  }, []);
  
  // Handle cancel confirmation or change request
  const handleCancel = () => {
    setIsCancelDialogOpen(false);
    setIsProcessing(true);
    
    try {
      // Update status in state and localStorage
      setStudentData(prev => ({...prev, status: 'no-inscrito'}));
      localStorage.removeItem('studentStatus');
      localStorage.removeItem('studentComments');
      
      toast.success('Se ha cancelado tu solicitud correctamente');
      // Redirect to the main page after a brief delay
      setTimeout(() => {
        router.push('/estudiante');
      }, 1500);
    } catch (error) {
      toast.error('Error al cancelar la solicitud');
      setIsProcessing(false);
    }
  };
  
  // Handle request for changes
  const handleRequestChanges = () => {
    setIsChangesDialogOpen(false);
    setIsProcessing(true);
    
    try {
      if (!changeReason.trim()) {
        toast.error('Debes proporcionar un motivo para solicitar cambios');
        setIsProcessing(false);
        return;
      }
      
      setStudentData(prev => ({
        ...prev, 
        status: "cambios-solicitados",
        comentarios: changeReason,
        fecha: currentDate
      }));
      
      localStorage.setItem('studentStatus', 'cambios-solicitados');
      localStorage.setItem('studentComments', changeReason);
      
      toast.success('Solicitud de cambios enviada correctamente');
      setIsProcessing(false);
      setChangeReason('');
    } catch (error) {
      toast.error('Error al enviar la solicitud de cambios');
      setIsProcessing(false);
    }
  };
  
  // Handle confirmation of schedule
  const handleConfirmSchedule = () => {
    setIsConfirmDialogOpen(false);
    setIsProcessing(true);
    
    try {
      setStudentData(prev => ({
        ...prev, 
        status: "inscrito",
        fecha: currentDate
      }));
      localStorage.setItem('studentStatus', 'inscrito');
      // Keep the previous comments in case they're needed
      
      toast.success('Horario confirmado correctamente');
      setIsProcessing(false);
    } catch (error) {
      toast.error('Error al confirmar el horario');
      setIsProcessing(false);
    }
  };
  
  // Render different views based on status
  const renderStatusContent = () => {
    switch (studentData.status) {
      case 'inscrito':
        return (
          <Card className="p-8 my-12 text-center border-green-500 border-2">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-24 w-24 text-green-500" />
            </div>
            
            <h1 className="text-green-600 text-4xl font-bold mb-4">
              ¡Horario Confirmado!
            </h1>
            
            <p className="text-green-600 text-2xl font-bold mb-8">
              Tu proceso de inscripción ha finalizado exitosamente
            </p>
            
            <div className="bg-green-50 p-4 rounded-md mb-8 text-left">
              <p className="mb-2"><span className="font-semibold">Fecha de confirmación:</span> {studentData.fecha}</p>
              <p className="mb-2"><span className="font-semibold">Estado:</span> Inscrito</p>
              <p className="mb-2"><span className="font-semibold">Matrícula:</span> {studentData.matricula}</p>
              <p><span className="font-semibold">Nota:</span> Recibirás un correo electrónico con los detalles de tu inscripción.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => router.push('/estudiante')}
                className="bg-red-700 hover:bg-red-800 px-6 py-2"
              >
                Visualizar Horario
              </Button>
              
              <Button 
                onClick={() => setIsChangesDialogOpen(true)}
                variant="outline"
                className="border-red-700 text-red-700 hover:bg-red-50"
                disabled={isProcessing}
              >
                Solicitar Cambios
              </Button>
            </div>
          </Card>
        );
        
      case 'cambios-solicitados':
        return (
          <Card className="p-8 my-12 text-center border-yellow-500 border-2">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-24 w-24 text-yellow-500" />
            </div>
            
            <h1 className="text-yellow-600 text-4xl font-bold mb-4">
              ¡Solicitud Enviada!
            </h1>
            
            <p className="text-yellow-600 text-2xl font-bold mb-8">
              Tu solicitud de cambios ha sido registrada
            </p>
            
            <div className="bg-yellow-50 p-4 rounded-md mb-8 text-left">
              <p className="mb-2"><span className="font-semibold">Fecha de solicitud:</span> {studentData.fecha}</p>
              <p className="mb-2"><span className="font-semibold">Estado:</span> Cambios Solicitados</p>
              <p className="mb-2"><span className="font-semibold">Matrícula:</span> {studentData.matricula}</p>
              <p className="mb-2"><span className="font-semibold">Motivo de la solicitud:</span></p>
              <p className="bg-white p-3 rounded border border-yellow-200 mb-2">{studentData.comentarios}</p>
              <p><span className="font-semibold">Nota:</span> El coordinador revisará tu solicitud y te contactará pronto.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => router.push('/estudiante')}
                className="bg-red-700 hover:bg-red-800 px-6 py-2"
              >
                Visualizar Horario
              </Button>
              
              <Button 
                onClick={() => setIsConfirmDialogOpen(true)}
                variant="outline"
                className="border-red-700 text-red-700 hover:bg-red-50"
                disabled={isProcessing}
              >
                Confirmar Horario
              </Button>
            </div>
          </Card>
        );
        
      default:
        // Should not reach here due to our redirect in useEffect
        return null;
    }
  };
  
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <EstudianteHeader/>
      
      {renderStatusContent()}
      
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Cancelación</DialogTitle>
            <DialogDescription>
              {studentData.status === 'inscrito' 
                ? '¿Estás seguro que deseas cancelar tu inscripción? Necesitarás volver a inscribirte.'
                : '¿Estás seguro que deseas cancelar tu solicitud de cambios?'}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCancelDialogOpen(false)}
              disabled={isProcessing}
            >
              Regresar
            </Button>
            <Button 
              onClick={handleCancel}
              disabled={isProcessing}
              className="bg-red-700 hover:bg-red-800"
            >
              Confirmar Cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isChangesDialogOpen} onOpenChange={setIsChangesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitud de Cambios</DialogTitle>
            <DialogDescription>
              Por favor describe detalladamente qué cambios necesitas realizar en tu horario.
              El coordinador evaluará tu solicitud.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
            <textarea 
              className="w-full border-2 border-gray-200 rounded-md p-2 min-h-[100px]"
              placeholder="Explica aquí tu solicitud de cambios..."
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsChangesDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleRequestChanges}
              disabled={isProcessing || !changeReason.trim()}
              className="bg-red-700 hover:bg-red-800"
            >
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmación de Horario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas confirmar este horario? Una vez confirmado, no podrás realizar cambios sin la autorización del coordinador.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmSchedule}
              disabled={isProcessing}
              className="bg-red-700 hover:bg-red-800"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer/>
    </main>
  );
}
