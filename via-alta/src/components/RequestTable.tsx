'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Search, Eye, Calendar, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface Student {
  ivd_id: string;
  name: string;
  semestre: string;
  status: string;
  comentario: string;
}

interface ChangeRequest {
  idsolicitud: number;
  idalumno: string;
  descripcion: string;
  fecha: string;
  estado: string;
  studentName?: string;
}

interface StudentDetails {
  id: number;
  ivd_id: number;
  name: string;
  first_surname: string;
  second_surname: string;
  email: string;
  status: string;
}

interface RequestTableProps {
  students: Student[];
}

export default function RequestTable({ students }: RequestTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ChangeRequest[]>([]);
  const router = useRouter();
  const [selectedComment, setSelectedComment] = useState('');
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [solveDialogOpen, setSolveDialogOpen] = useState(false);
  const [requestToSolve, setRequestToSolve] = useState<ChangeRequest | null>(null);
  const [solvingRequest, setSolvingRequest] = useState(false);

  // Fetch change requests from database
  useEffect(() => {
    const fetchChangeRequests = async () => {
      try {
        setLoading(true);
        console.log("Fetching change requests from database...");
        
        // Use a simple query parameter to fetch all pending requests
        const response = await fetch('/api/schedule-change-request?count=true&fetchAll=true');
        
        if (!response.ok) {
          throw new Error(`Error fetching change requests: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("API response:", data);
        
        if (data.success && Array.isArray(data.requests)) {
          console.log("Found change requests:", data.requests);
          setChangeRequests(data.requests);
          setFilteredRequests(data.requests);
          
          // Fetch student names for each request
          const studentIds = data.requests.map((req: ChangeRequest) => req.idalumno);
          fetchStudentNames(studentIds);
        } else {
          console.error("Failed to parse change requests from response:", data);
          setChangeRequests([]);
          setFilteredRequests([]);
        }
      } catch (error) {
        console.error("Error fetching change requests:", error);
        setChangeRequests([]);
        setFilteredRequests([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChangeRequests();
  }, []);

  // Function to fetch student names from the IVD API
  const fetchStudentNames = async (studentIds: string[]) => {
    // Remove duplicates
    const uniqueIds = [...new Set(studentIds)];
    
    // Create a map to store student names
    const newStudentNames: Record<string, string> = {};
    
    // Fetch each student's details
    for (const studentId of uniqueIds) {
      try {
        // First check if we can find the student in the passed students array
        const localStudent = students.find(s => s.ivd_id === studentId);
        
        if (localStudent) {
          newStudentNames[studentId] = localStudent.name;
        } else {
          // If not found locally, fetch from the API
          const response = await fetch(`/api/student-info?studentId=${studentId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.student) {
              // Format the full name from the API response
              const fullName = [
                data.student.name,
                data.student.first_surname,
                data.student.second_surname
              ].filter(Boolean).join(' ');
              
              newStudentNames[studentId] = fullName;
            } else {
              newStudentNames[studentId] = "Estudiante no encontrado";
            }
          } else {
            newStudentNames[studentId] = "Error al buscar estudiante";
          }
        }
      } catch (error) {
        console.error(`Error fetching details for student ${studentId}:`, error);
        newStudentNames[studentId] = "Error al buscar estudiante";
      }
    }
    
    // Update the state with all student names
    setStudentNames(newStudentNames);
  };

  // Filter change requests when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRequests(changeRequests);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = changeRequests.filter(
      (request) => {
        // Search by student ID
        if (request.idalumno.toLowerCase().includes(query)) {
          return true;
        }
        
        // Search by student name
        const studentName = studentNames[request.idalumno] || "";
        if (studentName.toLowerCase().includes(query)) {
          return true;
        }
        
        return false;
      }
    );
    setFilteredRequests(results);
  }, [searchQuery, changeRequests, studentNames]);

  const handleViewComment = (comment: string) => {
    setSelectedComment(comment);
    setIsCommentOpen(true);
  };

  const handleViewSchedule = (studentId: string) => {
    if (!studentId) {
      toast.error('Este estudiante no tiene un ID de matrícula válido');
      return;
    }
    router.push(`/dashboard/horarios/${studentId}`);
  };

  // Handle opening the solve request dialog
  const handleSolveRequest = (request: ChangeRequest) => {
    setRequestToSolve(request);
    setSolveDialogOpen(true);
  };

  // Handle the actual solving of the request
  const confirmSolveRequest = async () => {
    if (!requestToSolve) return;
    
    try {
      setSolvingRequest(true);
      const response = await fetch(`/api/schedule-change-request?requestId=${requestToSolve.idsolicitud}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Solicitud resuelta correctamente`);
        
        // Remove the solved request from the list
        setChangeRequests(prevRequests => 
          prevRequests.filter(req => req.idsolicitud !== requestToSolve.idsolicitud)
        );
        setFilteredRequests(prevRequests => 
          prevRequests.filter(req => req.idsolicitud !== requestToSolve.idsolicitud)
        );
        
        setSolveDialogOpen(false);
      } else {
        toast.error(`Error: ${data.message || 'No se pudo resolver la solicitud'}`);
      }
    } catch (error) {
      console.error('Error solving request:', error);
      toast.error('Ocurrió un error al resolver la solicitud');
    } finally {
      setSolvingRequest(false);
    }
  };

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString; // Return as-is if parsing fails
    }
  };

  // Get the student name from our cached names
  const getStudentName = (studentId: string) => {
    return studentNames[studentId] || "Cargando...";
  };

  return (
    <div className="w-full mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder="Buscar por matrícula o nombre"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>Cargando solicitudes de cambio...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-8 border rounded-md">
          <p className="text-gray-500">No se encontraron solicitudes de cambio pendientes.</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="text-center self-center font-medium">Matrícula</TableHead>
                <TableHead className="text-center self-center font-medium">Nombre</TableHead>
                <TableHead className="text-center self-center font-medium">Fecha</TableHead>
                <TableHead className="text-center self-center font-medium">Estado</TableHead>
                <TableHead className="" />
                <TableHead className="" />
                <TableHead className="" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.idsolicitud} className="border-b border-gray-200">
                  <TableCell className="font-medium text-gray-500">{request.idalumno}</TableCell>
                  <TableCell>{getStudentName(request.idalumno)}</TableCell>
                  <TableCell className="text-center">
                    {formatDate(request.fecha)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                      {request.estado === 'pendiente' ? 'Pendiente' : request.estado}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      className="flex items-center gap-1 text-via border-2 border-via"
                      onClick={() => handleViewComment(request.descripcion)}
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver comentario</span>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="default"
                      className="flex items-center gap-1 text-white"
                      onClick={() => handleViewSchedule(request.idalumno)}
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Ver horario</span>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      onClick={() => handleSolveRequest(request)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Resolver</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog for viewing comments */}
      <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comentario del Estudiante</DialogTitle>
          </DialogHeader>
          <p className="mt-4">{selectedComment}</p>
        </DialogContent>
      </Dialog>

      {/* Dialog for solving requests */}
      <Dialog open={solveDialogOpen} onOpenChange={setSolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver solicitud</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas marcar esta solicitud como resuelta? Esta acción eliminará la solicitud de la base de datos.
            </DialogDescription>
          </DialogHeader>
          
          {requestToSolve && (
            <div className="my-4 p-4 bg-gray-50 rounded-md">
              <p><strong>Estudiante:</strong> {getStudentName(requestToSolve.idalumno)}</p>
              <p><strong>Matrícula:</strong> {requestToSolve.idalumno}</p>
              <p><strong>Fecha:</strong> {formatDate(requestToSolve.fecha)}</p>
              <div className="mt-2">
                <p><strong>Comentario:</strong></p>
                <p className="mt-1 italic">{requestToSolve.descripcion}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSolveDialogOpen(false)}
              disabled={solvingRequest}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={confirmSolveRequest}
              disabled={solvingRequest}
            >
              {solvingRequest ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Resolviendo...
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
