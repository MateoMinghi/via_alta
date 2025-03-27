import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Estudiante from '@/components/pages/Estudiante';
import { useGetSubjects } from '@/api/getSubjects';
import { toast } from 'sonner';

// Mock de las dependencias
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/api/getSubjects', () => ({
  useGetSubjects: jest.fn()
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('@/components/CoordinadorSchedule', () => ({
  __esModule: true,
  default: jest.fn(({ subjects }) => (
    <div data-testid="schedule-component">
      {subjects.map((subject) => (
        <div key={subject.id} data-testid={`subject-${subject.id}`}>
          {subject.title}
        </div>
      ))}
    </div>
  ))
}));

describe('Caso de Uso: Alumno confirma selección de horarios - Pruebas Unitarias', () => {
  const mockRouter = { push: jest.fn() };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('debería mostrar el mensaje de carga mientras se cargan las materias', () => {
    // Configurar estado de carga
    (useGetSubjects as jest.Mock).mockReturnValue({
      result: null,
      loading: true,
      error: null
    });

    render(<Estudiante />);
    
    // Verificar que se muestra el mensaje de carga
    expect(screen.getByText('Cargando materias...')).toBeInTheDocument();
    
    // Verificar que no se muestra el componente de horario
    expect(screen.queryByTestId('schedule-component')).not.toBeInTheDocument();
  });

  it('debería mostrar un mensaje de error si ocurre un error al cargar las materias', () => {
    // Configurar estado de error
    (useGetSubjects as jest.Mock).mockReturnValue({
      result: null,
      loading: false,
      error: 'Error al cargar las materias'
    });

    render(<Estudiante />);
    
    // Verificar que se muestra el mensaje de error
    expect(screen.getByText('Error: Error al cargar las materias')).toBeInTheDocument();
  });

  it('debería mostrar un mensaje cuando no hay materias disponibles para el semestre', () => {
    // Configurar respuesta sin materias para el semestre actual
    (useGetSubjects as jest.Mock).mockReturnValue({
      result: [
        { id: 1, title: 'Materia 1', semester: 1 },
        { id: 2, title: 'Materia 2', semester: 2 }
      ],
      loading: false,
      error: null
    });

    render(<Estudiante />);
    
    // Verificar que se muestra el mensaje de advertencia
    expect(screen.getByText('No hay materias disponibles para tu semestre. Contacta al coordinador académico.')).toBeInTheDocument();
    
    // Verificar que se muestra un toast de advertencia
    expect(toast.warning).toHaveBeenCalledWith('No hay materias disponibles para tu semestre (3)');
    
    // Verificar que los botones de acción están deshabilitados
    const confirmButton = screen.getByText('Confirmar Horario');
    const requestChangesButton = screen.getByText('Solicitar Cambios');
    
    expect(confirmButton).toBeDisabled();
    expect(requestChangesButton).toBeDisabled();
  });

  it('debería mostrar las materias del semestre del estudiante y habilitar los botones', () => {
    // Configurar materias para el semestre actual
    (useGetSubjects as jest.Mock).mockReturnValue({
      result: [
        { id: 1, title: 'Diseño de Prendas', semester: 1 },
        { id: 2, title: 'Patronaje Básico', semester: 2 },
        { id: 3, title: 'Confección Avanzada', semester: 3 },
        { id: 4, title: 'Tecnología Textil', semester: 3 }
      ],
      loading: false,
      error: null
    });

    render(<Estudiante />);
    
    // Verificar que se muestran solo las materias del semestre 3
    expect(screen.getByTestId('subject-3')).toBeInTheDocument();
    expect(screen.getByTestId('subject-4')).toBeInTheDocument();
    expect(screen.queryByTestId('subject-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('subject-2')).not.toBeInTheDocument();
    
    // Verificar que los botones están habilitados
    const confirmButton = screen.getByText('Confirmar Horario');
    const requestChangesButton = screen.getByText('Solicitar Cambios');
    
    expect(confirmButton).not.toBeDisabled();
    expect(requestChangesButton).not.toBeDisabled();
  });

  it('debería mostrar el diálogo de confirmación al hacer clic en Confirmar Horario', async () => {
    // Configurar materias para el semestre actual
    (useGetSubjects as jest.Mock).mockReturnValue({
      result: [
        { id: 3, title: 'Confección Avanzada', semester: 3 },
        { id: 4, title: 'Tecnología Textil', semester: 3 }
      ],
      loading: false,
      error: null
    });

    render(<Estudiante />);
    
    // Hacer clic en el botón de confirmación
    const confirmButton = screen.getByText('Confirmar Horario');
    fireEvent.click(confirmButton);
    
    // Verificar que se muestra el diálogo de confirmación
    expect(screen.getByText('Confirmación de Horario')).toBeInTheDocument();
    expect(screen.getByText('¿Estás seguro que deseas confirmar este horario? Una vez confirmado, no podrás realizar cambios sin la autorización del coordinador.')).toBeInTheDocument();
  });

  it('debería cerrar el diálogo de confirmación al hacer clic en Cancelar', async () => {
    // Configurar materias para el semestre actual
    (useGetSubjects as jest.Mock).mockReturnValue({
      result: [
        { id: 3, title: 'Confección Avanzada', semester: 3 },
        { id: 4, title: 'Tecnología Textil', semester: 3 }
      ],
      loading: false,
      error: null
    });

    render(<Estudiante />);
    
    // Abrir el diálogo de confirmación
    const confirmButton = screen.getByText('Confirmar Horario');
    fireEvent.click(confirmButton);
    
    // Cerrar el diálogo haciendo clic en Cancelar
    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);
    
    // Verificar que el diálogo ya no está presente
    await waitFor(() => {
      expect(screen.queryByText('Confirmación de Horario')).not.toBeInTheDocument();
    });
  });

  it('debería confirmar el horario y redirigir a la página de confirmación', async () => {
    // Configurar materias para el semestre actual
    (useGetSubjects as jest.Mock).mockReturnValue({
      result: [
        { id: 3, title: 'Confección Avanzada', semester: 3 },
        { id: 4, title: 'Tecnología Textil', semester: 3 }
      ],
      loading: false,
      error: null
    });

    render(<Estudiante />);
    
    // Abrir el diálogo de confirmación
    const confirmButton = screen.getByText('Confirmar Horario');
    fireEvent.click(confirmButton);
    
    // Confirmar el horario
    const confirmDialogButton = screen.getAllByText('Confirmar')[1]; // El segundo botón "Confirmar" es el del diálogo
    fireEvent.click(confirmDialogButton);
    
    // Verificar que se muestra un mensaje de éxito
    expect(toast.success).toHaveBeenCalledWith('Horario confirmado correctamente');
    
    // Verificar que se redirige a la página de confirmación
    expect(mockRouter.push).toHaveBeenCalledWith('/estudiante/confirmacion');
  });
});