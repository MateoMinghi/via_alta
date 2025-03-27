import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import HorariosSlug from '@/components/pages/HorariosSlug';
import { useGetSubjects } from '@/api/getSubjects';
import { toast } from 'sonner';

// Mock de las dependencias
jest.mock('next/navigation', () => ({
  useParams: jest.fn().mockReturnValue({ slug: 'semestre-3' }),
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() })
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
  default: jest.fn().mockImplementation(({ subjects }) => (
    <div data-testid="coordinador-schedule">
      {subjects.length} materias mostradas
    </div>
  ))
}));

describe('HorariosSlug Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería mostrar mensaje de carga cuando loading es true', () => {
    (useGetSubjects as jest.Mock).mockReturnValue({
      result: null,
      loading: true,
      error: null
    });

    render(<HorariosSlug />);
    expect(screen.getByText(/cargando materias/i)).toBeInTheDocument();
  });

  it('debería mostrar mensaje de error cuando hay un error', () => {
    (useGetSubjects as jest.Mock).mockReturnValue({
      result: null,
      loading: false,
      error: 'Error al cargar las materias'
    });

    render(<HorariosSlug />);
    expect(screen.getByText(/error: error al cargar las materias/i)).toBeInTheDocument();
  });

  it('debería mostrar mensaje cuando el semestre no es válido', () => {
    require('next/navigation').useParams.mockReturnValue({ slug: 'invalido' });
    
    (useGetSubjects as jest.Mock).mockReturnValue({
      result: [],
      loading: false,
      error: null
    });

    render(<HorariosSlug />);
    expect(screen.getByText(/semestre no válido/i)).toBeInTheDocument();
  });

  it('debería filtrar materias por semestre y mostrarlas en CoordinadorSchedule', async () => {
    require('next/navigation').useParams.mockReturnValue({ slug: 'semestre-3' });
    
    const mockSubjects = [
      { id: 1, title: 'Materia 1', semester: 1, professor: 'Prof 1', salon: 'A101', credits: 5, hours: [] },
      { id: 2, title: 'Materia 2', semester: 3, professor: 'Prof 2', salon: 'A102', credits: 4, hours: [] },
      { id: 3, title: 'Materia 3', semester: 3, professor: 'Prof 3', salon: 'A103', credits: 3, hours: [] },
      { id: 4, title: 'Materia 4', semester: 5, professor: 'Prof 4', salon: 'A104', credits: 6, hours: [] }
    ];

    (useGetSubjects as jest.Mock).mockReturnValue({
      result: mockSubjects,
      loading: false,
      error: null
    });

    render(<HorariosSlug />);
    
    await waitFor(() => {
      expect(screen.getByText('Horario del Semestre 3')).toBeInTheDocument();
      expect(screen.getByTestId('coordinador-schedule')).toBeInTheDocument();
      expect(screen.getByText('2 materias mostradas')).toBeInTheDocument();
    });
  });

  it('debería mostrar mensaje cuando no hay materias para el semestre', async () => {
    require('next/navigation').useParams.mockReturnValue({ slug: 'semestre-6' });
    
    const mockSubjects = [
      { id: 1, title: 'Materia 1', semester: 1, professor: 'Prof 1', salon: 'A101', credits: 5, hours: [] },
      { id: 2, title: 'Materia 2', semester: 3, professor: 'Prof 2', salon: 'A102', credits: 4, hours: [] }
    ];

    (useGetSubjects as jest.Mock).mockReturnValue({
      result: mockSubjects,
      loading: false,
      error: null
    });

    render(<HorariosSlug />);
    
    await waitFor(() => {
      expect(screen.getByText('Horario del Semestre 6')).toBeInTheDocument();
      expect(screen.getByText(/no hay materias disponibles para el semestre 6/i)).toBeInTheDocument();
      expect(toast.warning).toHaveBeenCalledWith('No hay materias disponibles para el semestre 6');
    });
  });

  it('debería manejar la función handleClearView correctamente', async () => {
    require('next/navigation').useParams.mockReturnValue({ slug: 'semestre-3' });
    
    const mockSubjects = [
      { id: 1, title: 'Materia 1', semester: 3, professor: 'Prof 1', salon: 'A101', credits: 5, hours: [] }
    ];

    (useGetSubjects as jest.Mock).mockReturnValue({
      result: mockSubjects,
      loading: false,
      error: null
    });

    render(<HorariosSlug />);
    
    // Encuentra y hace clic en el botón "Limpiar Vista"
    const clearButton = screen.getByText('Limpiar Vista');
    act(() => {
      clearButton.click();
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Vista limpiada');
      expect(screen.getByText(/no hay materias disponibles para el semestre 3/i)).toBeInTheDocument();
    });
  });
});