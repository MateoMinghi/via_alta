import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import SetupPasswordForm from '@/app/(routes)/setup_password/SetupPasswordForm';
import { useRouter, useSearchParams } from 'next/navigation';

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
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('SetupPasswordForm Component', () => {
  const mockRouterPush = jest.fn();
  const mockSearchParams = new Map();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockRouterPush
    }));
    
    // Default search params
    mockSearchParams.clear();
    mockSearchParams.set('ivd_id', '100128');
    
    (useSearchParams as jest.Mock).mockImplementation(() => ({
      get: (param: string) => mockSearchParams.get(param)
    }));
    
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
    
    // Setup fake timers for timeout testing
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders setup password form correctly', async () => {
    await act(async () => {
      render(<SetupPasswordForm />);
    });
    
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    // Use exact selector to avoid matching multiple elements
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar contraseña")).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /acepto los términos y condiciones/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear contraseña/i })).toBeInTheDocument();
  });

  test('redirects to home if no ivd_id is provided', async () => {
    mockSearchParams.delete('ivd_id');
    
    await act(async () => {
      render(<SetupPasswordForm />);
    });
    
    expect(mockRouterPush).toHaveBeenCalledWith('/');
  });

  test('shows loading state when token is being verified', async () => {
    mockSearchParams.set('token', 'valid-token');
    
    // Mock the fetch response for token verification
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          message: 'Token valid',
          user: { ivd_id: '100128', email: 'user@example.com' } 
        })
      })
    );
    
    render(<SetupPasswordForm />);
    
    // Look for a loading indicator instead of specific text
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('validates form inputs correctly', async () => {
    await act(async () => {
      render(<SetupPasswordForm />);
    });
    
    const submitButton = screen.getByRole('button', { name: /crear contraseña/i });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Wait for validation errors to appear
    await waitFor(() => {
      // Check validation errors - use more general regex to match actual error messages
      expect(screen.getByText(/ingresa un correo electrónico válido/i)).toBeInTheDocument();
      expect(screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
      expect(screen.getByText(/debes aceptar los términos y condiciones/i)).toBeInTheDocument();
    });
  });

  test('validates password requirements', async () => {
    await act(async () => {
      render(<SetupPasswordForm />);
    });
    
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText("Contraseña");
    const confirmPasswordInput = screen.getByLabelText("Confirmar contraseña");
    const termsCheckbox = screen.getByRole('checkbox', { name: /acepto los términos y condiciones/i });
    const submitButton = screen.getByRole('button', { name: /crear contraseña/i });
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
      fireEvent.click(termsCheckbox);
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
      fireEvent.click(submitButton);
    });
    
    expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
  });

  test('submits form with valid data and redirects after success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Contraseña configurada exitosamente' })
    });
    
    await act(async () => {
      render(<SetupPasswordForm />);
    });
    
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText("Contraseña");
    const confirmPasswordInput = screen.getByLabelText("Confirmar contraseña");
    const termsCheckbox = screen.getByRole('checkbox', { name: /acepto los términos y condiciones/i });
    const submitButton = screen.getByRole('button', { name: /crear contraseña/i });
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
      fireEvent.click(termsCheckbox);
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/setup-password', expect.any(Object));
      const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      const requestBody = JSON.parse(fetchOptions.body);
      
      expect(requestBody).toEqual({
        ivdId: '100128',
        email: 'test@example.com',
        password: 'Password123!'
      });
    });
    
    expect(screen.getByText(/contraseña configurada exitosamente/i)).toBeInTheDocument();
    
    // Wait for the redirection timeout
    jest.advanceTimersByTime(2000);
    expect(mockRouterPush).toHaveBeenCalledWith('/');
  });

  test('shows error when API returns an error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Error al configurar la contraseña' })
    });
    
    await act(async () => {
      render(<SetupPasswordForm />);
    });
    
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText("Contraseña");
    const confirmPasswordInput = screen.getByLabelText("Confirmar contraseña");
    const termsCheckbox = screen.getByRole('checkbox', { name: /acepto los términos y condiciones/i });
    const submitButton = screen.getByRole('button', { name: /crear contraseña/i });
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
      fireEvent.click(termsCheckbox);
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/error al configurar la contraseña/i)).toBeInTheDocument();
    });
  });

  test('verifies token when provided', async () => {
    mockSearchParams.set('token', 'valid-token');
    
    // Since the fetch in the component doesn't include options parameter, we don't need to include it here
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: async () => ({ 
          message: 'Token valid',
          user: {
            ivd_id: '100128',
            email: 'user@example.com'
          } 
        })
      })
    );
    
    await act(async () => {
      render(<SetupPasswordForm />);
    });
    
    // Just check the URL without expecting any options
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/verify-token?token=valid-token');
    });
    
    // Check if email is pre-filled
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    expect(emailInput).toHaveValue('user@example.com');
  });

  test('shows error when token verification fails', async () => {
    mockSearchParams.set('token', 'invalid-token');
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Token inválido o expirado' })
    });
    
    await act(async () => {
      render(<SetupPasswordForm />);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/token inválido o expirado/i)).toBeInTheDocument();
    });
  });
});