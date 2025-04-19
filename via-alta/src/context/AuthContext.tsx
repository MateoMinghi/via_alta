'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

// Define user types based on the API response
export interface UserRole {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  uid: string;
  ivd_id: number;
  name: string;
  first_surname: string;
  second_surname: string;
  email: string;
  email_personal?: string | null;
  status: string;
  type: string;
  semester?: number | null;
  role: UserRole;
  has_password?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (ivdId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  setupEmailSent: boolean;
  setupUserInfo: {
    ivd_id?: number;
    email?: string;
    name?: string;
  } | null;
  setupMessage: string | null;
  clearSetupState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupEmailSent, setSetupEmailSent] = useState(false);
  const [setupUserInfo, setSetupUserInfo] = useState<{ ivd_id?: number; email?: string; name?: string; } | null>(null);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const router = useRouter();

  // Check for existing session on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = Cookies.get('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const clearSetupState = () => {
    setSetupEmailSent(false);
    setSetupUserInfo(null);
    setSetupMessage(null);
  };

  const login = async (ivdId: string, password: string) => {
    setIsLoading(true);
    setError(null);
    // Clear any previous setup state
    clearSetupState();
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ivdId, 
          password: password ? password : undefined 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }
      
      // Handle first-time login with email token
      if (data.first_time_login && data.email_sent) {
        // Store information about the setup email being sent
        setSetupEmailSent(true);
        setSetupUserInfo(data.user || null);
        setSetupMessage(data.message || 'Se ha enviado un enlace para configurar tu contraseña al correo electrónico institucional.');
        setIsLoading(false);
        return;
      }
      
      const { user: userData } = data;
      
      if (!userData) {
        throw new Error('User not found');
      }
      
      // Store the user in state and cookies
      setUser(userData);
      Cookies.set('user', JSON.stringify(userData), { expires: 7 }); // Expires in 7 days
      
      // Redirect based on role
      if (userData.role.name === 'student') {
        if(userData.status === 'inscrito' || userData.status === 'requiere-cambios') { //redirige a confirmacion
          router.push('/estudiante/confirmacion');
        }
        else { //redirige a su horario, si todavia no confirma el horario
          router.push('/estudiante');
        }
      } else if (['admin', 'coordinator'].includes(userData.role.name)) {
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call the API to remove the HTTP-only cookie
      await fetch('/api/auth', {
        method: 'DELETE',
      });
      
      // Also remove the client-side cookie
      Cookies.remove('user');
      
      // Clear user state
      setUser(null);
      
      // Clear setup state
      clearSetupState();
      
      // Redirect to login page
      router.push('/');
      
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        error,
        setupEmailSent,
        setupUserInfo,
        setupMessage,
        clearSetupState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}