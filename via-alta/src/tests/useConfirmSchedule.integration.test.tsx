import { renderHook, act } from '@testing-library/react';
import { useConfirmSchedule } from '@/api/useConfirmSchedule';

// Mock de fetch global
global.fetch = jest.fn();

describe('useConfirmSchedule - Pruebas de integración', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería iniciar con estados correctos', () => {
    const { result } = renderHook(() => useConfirmSchedule());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.success).toBe(false);
  });

  it('debería manejar una confirmación exitosa', async () => {
    // Mock de respuesta exitosa
    const mockResponse = {
      success: true,
      message: 'Horario confirmado exitosamente',
      data: { id: '00001', confirmacion: true }
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const { result } = renderHook(() => useConfirmSchedule());
    
    // Estado inicial
    expect(result.current.loading).toBe(false);
    
    // Ejecutar la confirmación
    let response;
    await act(async () => {
      response = await result.current.confirmSchedule('00001');
    });
    
    // Verificar llamada a fetch
    expect(global.fetch).toHaveBeenCalledWith('/api/confirmSchedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studentId: '00001' }),
    });
    
    // Verificar estados después de la confirmación
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.success).toBe(true);
    
    // Verificar respuesta
    expect(response).toEqual(mockResponse);
  });

  it('debería manejar error por ID de estudiante faltante', async () => {
    // Mock de respuesta de error
    const mockErrorResponse = {
      success: false,
      message: 'ID de estudiante requerido'
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => mockErrorResponse
    });
    
    const { result } = renderHook(() => useConfirmSchedule());
    
    let response;
    await act(async () => {
      response = await result.current.confirmSchedule('');
    });
    
    // Verificar estados después del error
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('ID de estudiante requerido');
    expect(result.current.success).toBe(false);
    
    // Verificar respuesta
    expect(response).toBeNull();
  });

  it('debería manejar error por estudiante no encontrado', async () => {
    // Mock de respuesta de error
    const mockErrorResponse = {
      success: false,
      message: 'Estudiante no encontrado'
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => mockErrorResponse
    });
    
    const { result } = renderHook(() => useConfirmSchedule());
    
    let response;
    await act(async () => {
      response = await result.current.confirmSchedule('99999');
    });
    
    // Verificar estados después del error
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Estudiante no encontrado');
    expect(result.current.success).toBe(false);
    
    // Verificar respuesta
    expect(response).toBeNull();
  });

  it('debería manejar error de red', async () => {
    // Mock de error de red
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Error de conexión'));
    
    const { result } = renderHook(() => useConfirmSchedule());
    
    let response;
    await act(async () => {
      response = await result.current.confirmSchedule('00001');
    });
    
    // Verificar estados después del error
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Error de conexión');
    expect(result.current.success).toBe(false);
    
    // Verificar respuesta
    expect(response).toBeNull();
  });

  it('debería manejar error del servidor', async () => {
    // Mock de error del servidor
    const mockErrorResponse = {
      success: false,
      message: 'Error interno del servidor',
      error: 'Database connection failed'
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => mockErrorResponse
    });
    
    const { result } = renderHook(() => useConfirmSchedule());
    
    let response;
    await act(async () => {
      response = await result.current.confirmSchedule('00001');
    });
    
    // Verificar estados después del error
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Error interno del servidor');
    expect(result.current.success).toBe(false);
    
    // Verificar respuesta
    expect(response).toBeNull();
  });
});