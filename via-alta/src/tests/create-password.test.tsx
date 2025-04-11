import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { CreatePasswordClient } from '@/app/(routes)/create_password/[token]/password-client.tsx';
import { useRouter } from 'next/navigation';

// Mock ResizeObserver which is used by UI components
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('CreatePassword Component', () => {
  const mockRouterPush = jest.fn();
  const validToken = 'valid-token-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockRouterPush
    }));
    
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
    
    // Setup fake timers for each test
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  test('shows loading state during token verification', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Unresolved promise to keep loading
    
    render(<CreatePasswordClient token={validToken} />);
    
    expect(screen.getByText(/verificando token/i)).toBeInTheDocument();
    // Look for the spinner by its class rather than role, since it doesn't have a status role
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('shows error when token is invalid', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Token inválido o expirado' })
    });
    
    await act(async () => {
      render(<CreatePasswordClient token={validToken} />);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/token inválido o expirado/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /volver al inicio de sesión/i })).toBeInTheDocument();
    });
    
    // Test returning to login
    fireEvent.click(screen.getByRole('button', { name: /volver al inicio de sesión/i }));
    expect(mockRouterPush).toHaveBeenCalledWith('/');
  });

  test('renders password form after successful token verification', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        message: 'Token valid',
        user: {
          ivd_id: '100128',
          email: 'user@example.com'
        } 
      })
    });
    
    await act(async () => {
      render(<CreatePasswordClient token={validToken} />);
    });
    
    // Use longer timeout as component may take time to render
    await waitFor(() => {
      expect(screen.getByText(/crear nueva contraseña/i)).toBeInTheDocument();
    }, { timeout: 2000 });
    
    expect(screen.getByText(/usuario: 100128/i)).toBeInTheDocument();
    // Use a more specific selector to find the password fields by their label text
    expect(screen.getByLabelText(/nueva contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear contraseña/i })).toBeInTheDocument();
  });

  test('validates password requirements', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        message: 'Token valid',
        user: { ivd_id: '100128' } 
      })
    });
    
    await act(async () => {
      render(<CreatePasswordClient token={validToken} />);
    });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear contraseña/i })).toBeInTheDocument();
    });
    
    const submitButton = screen.getByRole('button', { name: /crear contraseña/i });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Wait for validation error to appear - looking at the DOM, the actual error is about length
    await waitFor(() => {
      expect(screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
    });
    
    // Use more specific selectors for the password inputs
    const passwordInput = screen.getByLabelText(/nueva contraseña/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
    
    await act(async () => {
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);
    });
    
    // Error message doesn't change since it's still too short
    expect(screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.change(passwordInput, { target: { value: 'Password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password456' } });
      fireEvent.click(submitButton);
    });
    
    expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
  });

  test('submits form with valid data and shows success message', async () => {
    // Mock token verification
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        message: 'Token valid',
        user: { ivd_id: '100128' } 
      })
    });
    
    // Mock password creation API
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Contraseña actualizada exitosamente' })
    });
    
    await act(async () => {
      render(<CreatePasswordClient token={validToken} />);
    });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear contraseña/i })).toBeInTheDocument();
    });
    
    // Use more specific selectors
    const passwordInput = screen.getByLabelText(/nueva contraseña/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
    const submitButton = screen.getByRole('button', { name: /crear contraseña/i });
    
    await act(async () => {
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      // Check API call
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/create-password', expect.any(Object));
      const fetchOptions = (global.fetch as jest.Mock).mock.calls[1][1]; // Second call (first was token verification)
      const requestBody = JSON.parse(fetchOptions.body);
      
      expect(requestBody).toEqual({
        token: validToken,
        password: 'Password123!'
      });
      
      // Check success message
      expect(screen.getByText(/contraseña creada exitosamente/i)).toBeInTheDocument();
    });
    
    // Wait for the redirection timeout
    jest.advanceTimersByTime(3000);
    expect(mockRouterPush).toHaveBeenCalledWith('/');
  });

  test('shows error when API returns an error', async () => {
    // Mock token verification
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        message: 'Token valid',
        user: { ivd_id: '100128' } 
      })
    });
    
    // Mock password creation API failure
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Error al establecer la contraseña' })
    });
    
    await act(async () => {
      render(<CreatePasswordClient token={validToken} />);
    });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear contraseña/i })).toBeInTheDocument();
    });
    
    const passwordInput = screen.getByLabelText(/nueva contraseña/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
    const submitButton = screen.getByRole('button', { name: /crear contraseña/i });
    
    await act(async () => {
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/error al establecer la contraseña/i)).toBeInTheDocument();
    });
  });

  test('toggles password visibility when show/hide button is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        message: 'Token valid',
        user: { ivd_id: '100128' } 
      })
    });
    
    await act(async () => {
      render(<CreatePasswordClient token={validToken} />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/nueva contraseña/i)).toBeInTheDocument();
    });
    
    const passwordInput = screen.getByLabelText(/nueva contraseña/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    const showPasswordCheckbox = screen.getByRole('checkbox', { name: /mostrar contraseña/i });
    fireEvent.click(showPasswordCheckbox);
    
    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
