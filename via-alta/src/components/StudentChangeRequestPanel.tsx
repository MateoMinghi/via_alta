'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  Eye, 
  XCircle,
  Calendar,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription, 
  DialogFooter
} from '@/components/ui/dialog';

interface ChangeRequest {
  idsolicitud: number;
  idalumno: string;
  descripcion: string;
  fecha: string;
  estado: string;
}

interface StudentChangeRequestPanelProps {
  studentId: string;
  onRequestResolved?: () => void;
}

export default function StudentChangeRequestPanel({ 
  studentId,
  onRequestResolved 
}: StudentChangeRequestPanelProps) {
  const [loading, setLoading] = useState(true);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [viewCommentDialog, setViewCommentDialog] = useState(false);
  const [resolveDialog, setResolveDialog] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  
  // Fetch change requests for this specific student
  useEffect(() => {
    const fetchStudentRequests = async () => {
      if (!studentId) return;
      
      try {
        setLoading(true);
        console.log(`Fetching change requests for student: ${studentId}`);
        
        const response = await fetch(`/api/schedule-change-request?studentId=${studentId}`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          console.log(`Found ${data.data.length} change requests for student ${studentId}`);
          setChangeRequests(data.data);
        } else {
          console.error("Failed to parse student change requests:", data);
          setChangeRequests([]);
        }
      } catch (error) {
        console.error("Error fetching student change requests:", error);
        setChangeRequests([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentRequests();
  }, [studentId]);

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString; // Return as-is if parsing fails
    }
  };

  // Handle opening the view comment dialog
  const handleViewComment = (request: ChangeRequest) => {
    setSelectedRequest(request);
    setViewCommentDialog(true);
  };

  // Handle opening the resolve request dialog
  const handleResolveRequest = (request: ChangeRequest) => {
    setSelectedRequest(request);
    setResolveDialog(true);
  };

  // Handle resolving the request
  const confirmResolveRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      setProcessingAction(true);
      console.log(`Resolving request ID: ${selectedRequest.idsolicitud}`);
      
      const response = await fetch(`/api/schedule-change-request?requestId=${selectedRequest.idsolicitud}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('La solicitud ha sido resuelta correctamente');
        
        // Remove the resolved request from the list
        setChangeRequests(prev => 
          prev.filter(req => req.idsolicitud !== selectedRequest.idsolicitud)
        );
        
        // Notify parent component if needed
        if (onRequestResolved) {
          onRequestResolved();
        }
        
        setResolveDialog(false);
      } else {
        toast.error(`Error: ${data.message || 'No se pudo resolver la solicitud'}`);
      }
    } catch (error) {
      console.error('Error resolving request:', error);
      toast.error('Ocurrió un error al resolver la solicitud');
    } finally {
      setProcessingAction(false);
    }
  };

  // If there are no requests, show a message
  if (!loading && changeRequests.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 w-full">
      <div className="border border-amber-300 bg-amber-50 rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-amber-800 mb-2 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Solicitudes de Cambio Pendientes
        </h3>
        
        <p className="text-sm text-amber-700 mb-4">
          Este estudiante tiene {changeRequests.length} {changeRequests.length === 1 ? 'solicitud' : 'solicitudes'} de cambio pendiente{changeRequests.length !== 1 ? 's' : ''}.
        </p>
        
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-4 border-amber-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {changeRequests.map((request) => (
              <div 
                key={request.idsolicitud} 
                className="bg-white border border-amber-200 rounded-lg p-3 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium">Fecha: {formatDate(request.fecha)}</span>
                  </div>
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                    {request.estado === 'pendiente' ? 'Pendiente' : request.estado}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={() => handleViewComment(request)}
                  >
                    <Eye className="h-4 w-4" />
                    <span>Ver comentario</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 border-green-300 text-green-800 hover:bg-green-100"
                    onClick={() => handleResolveRequest(request)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Resolver solicitud</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Dialog for viewing comment */}
      <Dialog open={viewCommentDialog} onOpenChange={setViewCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comentario del Estudiante</DialogTitle>
            <DialogDescription>
              Solicitud creada el {selectedRequest ? formatDate(selectedRequest.fecha) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-amber-900">{selectedRequest?.descripcion}</p>
          </div>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setViewCommentDialog(false)}
            >
              Cerrar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setViewCommentDialog(false);
                if (selectedRequest) {
                  handleResolveRequest(selectedRequest);
                }
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Resolver esta solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for resolving request */}
      <Dialog open={resolveDialog} onOpenChange={setResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Solicitud de Cambio</DialogTitle>
            <DialogDescription>
              ¿Confirmas que has atendido esta solicitud y deseas marcarla como resuelta?
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="my-4 p-4 bg-amber-50 rounded-md border border-amber-200">
              <p><strong>Fecha:</strong> {formatDate(selectedRequest.fecha)}</p>
              <div className="mt-2">
                <p><strong>Comentario:</strong></p>
                <p className="mt-1 italic text-amber-900">{selectedRequest.descripcion}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialog(false)}
              disabled={processingAction}
            >
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={confirmResolveRequest}
              disabled={processingAction}
            >
              {processingAction ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmar y resolver
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}