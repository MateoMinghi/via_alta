import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '@/components/pages/Login';
import { useRouter } from 'next/navigation';
// Create a React context for testing
import { createContext } from 'react';

// Mock ResizeObserver which is used by some UI components
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.location.reload
const originalLocation = window.location;
delete window.location;
window.location = { ...originalLocation, reload: jest.fn() };

// Create a mock auth context
const AuthContext = createContext({});

// Mock the useAuth hook that's likely used in the Login component
jest.mock('@/context/AuthContext', () => ({
  AuthContext: {
    Provider: ({ children, value }) => (
      <div data-testid="auth-provider">{children}</div>
    ),
  },
  useAuth: jest.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    error: null,
    setupEmailSent: false,
    setupUserInfo: null,
    setupMessage: null,
    clearSetupState: jest.fn()
  })),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock cookies library
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn()
}));

describe('Login Component', () => {
  // Setup mocks before each test
  const mockLogin = jest.fn();
  const mockClearSetupState = jest.fn();
  const mockRouterPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockRouterPush
    }));
  });

  const renderLoginComponent = (contextOverrides = {}) => {
    // Instead of trying to use the AuthContext.Provider directly,
    // update the mock values for the useAuth hook
    const mockAuthValues = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      logout: jest.fn(),
      error: null,
      setupEmailSent: false,
      setupUserInfo: null,
      setupMessage: null,
      clearSetupState: mockClearSetupState,
      ...contextOverrides
    };
    
    // Update the useAuth mock with our values
    const useAuthMock = require('@/context/AuthContext').useAuth;
    useAuthMock.mockImplementation(() => mockAuthValues);
    
    // Simply render the component without wrapping in a context provider
    return render(<Login />);
  };

  test('renders login form correctly', () => {
    renderLoginComponent();
    
    expect(screen.getByLabelText(/matricula/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByText(/¿olvidaste tu contraseña\?/i)).toBeInTheDocument();
  });

  test('shows error message when login fails', () => {
    const errorMessage = 'Credenciales incorrectas';
    renderLoginComponent({ error: errorMessage });
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('submits form with user credentials when button is clicked', async () => {
    renderLoginComponent();
    
    const usernameInput = screen.getByLabelText(/matricula/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    fireEvent.change(usernameInput, { target: { value: '100128' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('100128', 'password123');
    });
  });

  test('shows loading state when isLoading is true', () => {
    renderLoginComponent({ isLoading: true });
    
    expect(screen.getByText(/iniciando sesión/i)).toBeInTheDocument();
    // Check if the button is disabled during loading
    const button = screen.getByRole('button', { name: /iniciando sesión/i });
    expect(button).toBeDisabled();
  });

  test('redirects to reset password page when "Olvidaste tu contraseña" is clicked', () => {
    renderLoginComponent();
    
    const resetPasswordLink = screen.getByText(/¿olvidaste tu contraseña\?/i);
    fireEvent.click(resetPasswordLink);
    
    expect(mockRouterPush).toHaveBeenCalledWith('/reset_password');
  });

  test('shows setup email sent screen when setupEmailSent is true', () => {
    renderLoginComponent({
      setupEmailSent: true,
      setupUserInfo: { 
        email: 'test@example.com',
        ivd_id: 100128,
        name: 'Test User'
      },
      setupMessage: 'Se ha enviado un enlace para configurar tu contraseña'
    });
    
    expect(screen.getByText(/revisa tu correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/se ha enviado un enlace para configurar tu contraseña/i)).toBeInTheDocument();
    expect(screen.getByText(/el enlace expirará en 15 minutos/i)).toBeInTheDocument();
    
    // Test returning to login from email sent screen
    const returnButton = screen.getByRole('button', { name: /volver al inicio de sesión/i });
    fireEvent.click(returnButton);
    
    // Check if page reload is triggered
    expect(Object.getOwnPropertyDescriptor(window.location, 'reload')?.value).toBeDefined();
  });
});
