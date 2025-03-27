import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Confirm from '@/app/(routes)/estudiante/confirmacion/page';

// Mock de las dependencias
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock de EstudianteHeader
jest.mock('@/components/EstudianteHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="estudiante-header">EstudianteHeader</div>
}));

// Mock de Footer
jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Footer</div>
}));

describe('Página de Confirmación de Horario - Pruebas', () => {
  const mockRouter = { push: jest.fn() };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock de Date para tener una fecha constante en las pruebas
    const mockDate = new Date('2023-08-15T10:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debería renderizar la página de confirmación con todos sus elementos', () => {
    render(<Confirm />);
    
    // Verificar que se muestran los componentes de cabecera y pie de página
    expect(screen.getByTestId('estudiante-header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    
    // Verificar que se muestra el ícono de confirmación
    expect(screen.getByRole('img', { name: /checkmark/i })).toBeInTheDocument();
    
    // Verificar que se muestran los mensajes de confirmación
    expect(screen.getByText('¡Horario Confirmado!')).toBeInTheDocument();
    expect(screen.getByText('Tu proceso de inscripción ha finalizado exitosamente')).toBeInTheDocument();
    
    // Verificar que se muestra la información de fecha de confirmación
    expect(screen.getByText(/Fecha de confirmación:/i)).toBeInTheDocument();
    expect(screen.getByText(/15\/8\/2023/i)).toBeInTheDocument();
    
    // Verificar que se muestra el estado y la matrícula
    expect(screen.getByText(/Estado: Inscrito/i)).toBeInTheDocument();
    expect(screen.getByText(/Matrícula: #12345/i)).toBeInTheDocument();
    
    // Verificar que se muestra el mensaje de nota
    expect(screen.getByText(/Nota: Recibirás un correo electrónico con los detalles de tu inscripción./i)).toBeInTheDocument();
    
    // Verificar que se muestra el botón para volver al inicio
    expect(screen.getByText('Volver al Inicio')).toBeInTheDocument();
  });

  it('debería redirigir al inicio del estudiante al hacer clic en el botón', () => {
    render(<Confirm />);
    
    // Buscar y hacer clic en el botón "Volver al Inicio"
    const backButton = screen.getByText('Volver al Inicio');
    backButton.click();
    
    // Verificar que se redirige a la página de inicio del estudiante
    expect(mockRouter.push).toHaveBeenCalledWith('/estudiante');
  });
});