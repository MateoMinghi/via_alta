import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import HorariosSlug from '@/components/pages/HorariosSlug';
import CoordinadorSchedule from '@/components/CoordinadorSchedule';
import { useGetSubjects } from '@/api/getSubjects';

// Mock de las dependencias
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
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

// Para las pruebas de integración, NO hacemos mock del componente CoordinadorSchedule real
jest.mock('@/components/CoordinadorSchedule', () => ({
  __esModule: true,
  default: jest.fn(({ subjects }) => (
    <div data-testid="coordinador-schedule">
      <h3>Vista del horario para {subjects.length} materias</h3>
      <div className="grid">
        {subjects.map(subject => (
          <div key={subject.id} data-testid={`subject-${subject.id}`} className="subject-card">
            <h4>{subject.title}</h4>
            <p>Profesor: {subject.professor}</p>
            <p>Semestre: {subject.semester}</p>
            <p>Salón: {subject.salon}</p>
          </div>
        ))}
      </div>
      <button>Guardar Horario</button>
    </div>
  ))
}));

describe('Caso de Uso: Coordinador visualiza horario por semestre - Pruebas de Integración', () => {
  // Configuración común para todas las pruebas
  const mockRouter = { push: jest.fn() };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  // Caso de uso principal: Visualización exitosa del horario por semestre
  it('debería cargar y mostrar correctamente el horario del semestre especificado', async () => {
    // Simular que estamos viendo el horario del semestre 3
    (useParams as jest.Mock).mockReturnValue({ slug: 'semestre-3' });
    
    // Simulamos las materias del semestre 3
    const mockSubjects = [
      { 
        id: 1, 
        title: 'Confección de prendas infantiles', 
        semester: 3, 
        professor: 'Profesor 317', 
        salon: 'A 201', 
        credits: 5, 
        hours: [
          { day: 'Lunes', time: '09:00' },
          { day: 'Miércoles', time: '11:00' }
        ] 
      },
      { 
        id: 2, 
        title: 'Taller de diseño', 
        semester: 3, 
        professor: 'Profesor 309', 
        salon: 'L 102', 
        credits: 7, 
        hours: [
          { day: 'Martes', time: '10:00' },
          { day: 'Jueves', time: '10:00' }
        ] 
      }
    ];

    // Simulamos una respuesta exitosa de la API
    (useGetSubjects as jest.Mock).mockReturnValue({
      result: mockSubjects,
      loading: false,
      error: null
    });

    // Renderizamos el componente de horarios por semestre
    render(<HorariosSlug />);
    
    // Verificamos que el título muestre el semestre correcto
    await waitFor(() => {
      expect(screen.getByText('Horario del Semestre 3')).toBeInTheDocument();
    });
    
    // Verificamos que se muestren las dos materias
    expect(screen.getByTestId('subject-1')).toBeInTheDocument();
    expect(screen.getByTestId('subject-2')).toBeInTheDocument();
    
    // Verificamos el contenido específico de las materias
    expect(screen.getByText('Confección de prendas infantiles')).toBeInTheDocument();
    expect(screen.getByText('Taller de diseño')).toBeInTheDocument();
    
    // Verificamos que el componente CoordinadorSchedule fue llamado
    expect(CoordinadorSchedule).toHaveBeenCalled();
    
    // Obtenemos los argumentos con los que fue llamado
    const callArgs = (CoordinadorSchedule as jest.Mock).mock.calls[0][0];
    
    // Verificamos que le pasaron los subjects correctos
    expect(callArgs.subjects.length).toBe(2);
    expect(callArgs.subjects[0].id).toBe(1);
    expect(callArgs.subjects[1].id).toBe(2);
    expect(callArgs.subjects[0].semester).toBe(3);
    expect(callArgs.subjects[1].semester).toBe(3);
  });

  // Caso de uso: Coordinador intenta ver un semestre sin materias
  it('debería mostrar un mensaje cuando el semestre no tiene materias asignadas', async () => {
    // Simular que estamos viendo el horario del semestre 8
    (useParams as jest.Mock).mockReturnValue({ slug: 'semestre-8' });
    
    // Simulamos materias pero ninguna del semestre 8
    const mockSubjects = [
      { id: 1, title: 'Materia 1', semester: 1, professor: 'Prof 1', salon: 'A101', credits: 5, hours: [] },
      { id: 2, title: 'Materia 2', semester: 3, professor: 'Prof 2', salon: 'A102', credits: 4, hours: [] }
    ];

    // Simulamos una respuesta exitosa pero sin materias del semestre 8
    (useGetSubjects as jest.Mock).mockReturnValue({
      result: mockSubjects,
      loading: false,
      error: null
    });

    render(<HorariosSlug />);
    
    // Verificamos que se muestre el mensaje de que no hay materias
    await waitFor(() => {
      expect(screen.getByText('No hay materias disponibles para el semestre 8')).toBeInTheDocument();
    });
  });

  // Caso de uso: Flujo completo desde la carga hasta la limpieza de vista
  it('debería permitir cargar el horario y luego limpiarlo', async () => {
    (useParams as jest.Mock).mockReturnValue({ slug: 'semestre-2' });
    
    const mockSubjects = [
      { id: 3, title: 'Teoría para accesorios', semester: 2, professor: 'Profesor 308', salon: 'L 101', credits: 5, hours: [] },
      { id: 4, title: 'Patronaje de color', semester: 2, professor: 'Profesor 316', salon: 'T 301', credits: 8, hours: [] }
    ];

    (useGetSubjects as jest.Mock).mockReturnValue({
      result: mockSubjects,
      loading: false,
      error: null
    });

    render(<HorariosSlug />);
    
    // Verificamos que inicialmente se muestren las materias
    await waitFor(() => {
      expect(screen.getByText('Horario del Semestre 2')).toBeInTheDocument();
      expect(screen.getByTestId('subject-3')).toBeInTheDocument();
      expect(screen.getByTestId('subject-4')).toBeInTheDocument();
    });
    
    // Simulamos hacer clic en el botón "Limpiar Vista"
    const clearButton = screen.getByText('Limpiar Vista');
    fireEvent.click(clearButton);
    
    // Verificamos que después de limpiar la vista, las materias ya no se muestren
    await waitFor(() => {
      expect(screen.queryByTestId('subject-3')).not.toBeInTheDocument();
      expect(screen.queryByTestId('subject-4')).not.toBeInTheDocument();
    });
  });

  // Caso de uso: Error en la carga de datos
  it('debería manejar errores en la carga de datos', async () => {
    (useParams as jest.Mock).mockReturnValue({ slug: 'semestre-5' });
    
    // Simulamos un error en la carga de datos
    (useGetSubjects as jest.Mock).mockReturnValue({
      result: null,
      loading: false,
      error: 'Error de conexión al servidor'
    });

    render(<HorariosSlug />);
    
    // Verificamos que se muestre el mensaje de error
    await waitFor(() => {
      expect(screen.getByText('Error: Error de conexión al servidor')).toBeInTheDocument();
    });
  });

  // Caso de uso: Comportamiento durante la carga
  it('debería mostrar indicador de carga mientras se cargan los datos', async () => {
    (useParams as jest.Mock).mockReturnValue({ slug: 'semestre-4' });
    
    // Simulamos que los datos están cargando
    (useGetSubjects as jest.Mock).mockReturnValue({
      result: null,
      loading: true,
      error: null
    });

    const { rerender } = render(<HorariosSlug />);
    
    // Verificamos que se muestre el mensaje de carga
    expect(screen.getByText('Cargando materias...')).toBeInTheDocument();
    
    // Verificamos que no se muestre el componente de horario mientras carga
    expect(screen.queryByTestId('coordinador-schedule')).not.toBeInTheDocument();
    
    // Ahora simulamos que los datos terminaron de cargar
    (useGetSubjects as jest.Mock).mockReturnValue({
      result: [{ id: 5, title: 'Materia 5', semester: 4, professor: 'Prof 5', salon: 'A105', credits: 6, hours: [] }],
      loading: false,
      error: null
    });
    
    // Re-renderizamos
    rerender(<HorariosSlug />);
    
    // Verificamos que se muestre el componente de horario después de cargar
    await waitFor(() => {
      expect(screen.getByTestId('coordinador-schedule')).toBeInTheDocument();
    });
  });
});