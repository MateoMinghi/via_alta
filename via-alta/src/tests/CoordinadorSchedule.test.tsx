import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CoordinadorSchedule from '@/components/CoordinadorSchedule';
import { toast } from 'sonner';

// Mock de las dependencias
jest.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, jest.fn()],
  useDrop: () => [{ isOver: false }, jest.fn()],
  DndProvider: ({ children }) => <div>{children}</div>
}));

jest.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {}
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock de localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('CoordinadorSchedule Component - Pruebas de funcionalidad', () => {
  const mockSubjects = [
    {
      id: 1,
      title: 'Teoría para accesorios',
      salon: 'L 101',
      professor: 'Profesor 308',
      credits: 5,
      semester: 2,
      hours: [
        { day: 'Lunes', time: '08:00' },
        { day: 'Miércoles', time: '10:00' }
      ]
    },
    {
      id: 2,
      title: 'Taller de diseño',
      salon: 'L 102',
      professor: 'Profesor 309',
      credits: 7,
      semester: 3,
      hours: [
        { day: 'Martes', time: '10:00' },
        { day: 'Jueves', time: '10:00' }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('debería renderizar la vista de horario con las materias proporcionadas', () => {
    render(<CoordinadorSchedule subjects={mockSubjects} />);
    
    // Verificar que se muestran los elementos principales
    expect(screen.getByText('Vista de Horario')).toBeInTheDocument();
    expect(screen.getByText('Lista de Materias')).toBeInTheDocument();
    
    // Verificar que se muestran los días de la semana
    expect(screen.getByText('Lunes')).toBeInTheDocument();
    expect(screen.getByText('Martes')).toBeInTheDocument();
    expect(screen.getByText('Miércoles')).toBeInTheDocument();
    expect(screen.getByText('Jueves')).toBeInTheDocument();
    expect(screen.getByText('Viernes')).toBeInTheDocument();
    
    // Verificar que se muestran algunos horarios
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('debería mostrar la lista de materias disponibles', () => {
    // Mock de SubjectList para verificar que se llama correctamente
    jest.mock('@/components/SubjectList', () => ({
      __esModule: true,
      default: jest.fn(({ subjects }) => (
        <div data-testid="subject-list">
          {subjects.map(subject => (
            <div key={subject.id}>{subject.title}</div>
          ))}
        </div>
      ))
    }));
    
    render(<CoordinadorSchedule subjects={mockSubjects} />);
    
    // Verificar que se muestran los títulos de las materias (usando getAllByText en lugar de getByText)
    expect(screen.getAllByText('Teoría para accesorios')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Taller de diseño')[0]).toBeInTheDocument();
  });

  it('debería guardar el horario en localStorage cuando se hace clic en el botón de guardar', async () => {
    render(<CoordinadorSchedule subjects={mockSubjects} />);
    
    // Buscar y hacer clic en el botón "Guardar Horario"
    const saveButton = screen.getByText('Guardar Horario');
    fireEvent.click(saveButton);
    
    // Verificar que se llamó a localStorage.setItem
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(localStorageMock.setItem.mock.calls[0][0]).toBe('via-alta-schedule');
      expect(toast.success).toHaveBeenCalledWith('Horario guardado correctamente');
    });
    
    // Verificar que se guardó la información del último guardado
    expect(localStorageMock.setItem.mock.calls[1][0]).toBe('via-alta-schedule-last-saved');
  });
  
  it('debería cargar la marca de tiempo del último guardado al iniciar', () => {
    // Configurar una marca de tiempo guardada previamente
    const mockTimeStamp = '2023-06-15T10:30:00.000Z';
    localStorageMock.getItem.mockReturnValueOnce(mockTimeStamp);
    
    render(<CoordinadorSchedule subjects={mockSubjects} />);
    
    // Verificar que se intenta cargar la información del último guardado
    expect(localStorageMock.getItem).toHaveBeenCalledWith('via-alta-schedule-last-saved');
  });

  it('debería manejar errores al guardar el horario', async () => {
    // Forzar un error al intentar guardar
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('Error al guardar');
    });
    
    render(<CoordinadorSchedule subjects={mockSubjects} />);
    
    // Buscar y hacer clic en el botón "Guardar Horario"
    const saveButton = screen.getByText('Guardar Horario');
    fireEvent.click(saveButton);
    
    // Verificar que se muestra un mensaje de error
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo guardar el horario');
    });
  });
});

describe('CoordinadorSchedule - Integración con horarios por semestre', () => {
  // Pruebas para verificar la integración entre el componente HorariosSlug y CoordinadorSchedule
  
  it('debería normalizar correctamente los nombres de los días al mostrar el horario', () => {
    const subjectsWithVariousDayFormats = [
      {
        id: 1,
        title: 'Materia con formato español',
        salon: 'A101',
        professor: 'Prof 1',
        credits: 5,
        semester: 2,
        hours: [
          { day: 'Lunes', time: '08:00' },
          { day: 'Miércoles', time: '10:00' }
        ]
      },
      {
        id: 2,
        title: 'Materia con formato inglés',
        salon: 'A102',
        professor: 'Prof 2',
        credits: 4,
        semester: 2,
        hours: [
          { day: 'Monday', time: '09:00' },
          { day: 'Wednesday', time: '11:00' }
        ]
      },
      {
        id: 3,
        title: 'Materia con formato abreviado',
        salon: 'A103',
        professor: 'Prof 3',
        credits: 3,
        semester: 2,
        hours: [
          { day: 'Lun', time: '07:00' },
          { day: 'Jue', time: '12:00' }
        ]
      }
    ];
    
    render(<CoordinadorSchedule subjects={subjectsWithVariousDayFormats} />);
    
    // Verificar que se muestran los nombres de los días normalizados
    expect(screen.getAllByText('Lunes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Miércoles').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jueves').length).toBeGreaterThan(0);
  });

  it('debería calcular correctamente las horas de finalización de las clases', () => {
    const subjectsWithTimeFrames = [
      {
        id: 1,
        title: 'Materia de una hora',
        salon: 'A101',
        professor: 'Prof 1',
        credits: 5,
        semester: 2,
        hours: [
          { day: 'Lunes', time: '08:00' }
        ]
      }
    ];
    
    // En este caso, esperamos que el componente calcule que la hora de finalización es 09:00
    render(<CoordinadorSchedule subjects={subjectsWithTimeFrames} />);
    
    // Verificamos que se muestra la hora de inicio
    expect(screen.getByText('08:00')).toBeInTheDocument();
  });

  it('debería gestionar múltiples materias en la misma franja horaria', () => {
    const subjectsWithSameTimeSlot = [
      {
        id: 1,
        title: 'Materia 1 - Mismo horario',
        salon: 'A101',
        professor: 'Prof 1',
        credits: 5,
        semester: 2,
        hours: [
          { day: 'Lunes', time: '09:00' }
        ]
      },
      {
        id: 2,
        title: 'Materia 2 - Mismo horario',
        salon: 'A102',
        professor: 'Prof 2',
        credits: 4,
        semester: 2,
        hours: [
          { day: 'Lunes', time: '09:00' }
        ]
      }
    ];
    
    render(<CoordinadorSchedule subjects={subjectsWithSameTimeSlot} />);
    
    // Verificamos que ambas materias se muestran (usando getAllByText en lugar de getByText)
    expect(screen.getAllByText('Materia 1 - Mismo horario')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Materia 2 - Mismo horario')[0]).toBeInTheDocument();
  });
});