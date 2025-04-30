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
  regular?: boolean; // Added regular property to identify regular vs irregular students
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
        setIsLoading(true);
        
        // Try to get user from cookie first
        const storedUser = Cookies.get('user');
        
        if (storedUser) {
          // If user exists in cookies, parse it
          const parsedUser = JSON.parse(storedUser);
          
          // If it's a student, check their current status from the database
          if (parsedUser.role?.name === 'student') {
            try {
              // Call the student status API to get current status
              const studentId = parsedUser.ivd_id?.toString();
              if (studentId) {
                const statusResponse = await fetch(`/api/student-status?studentId=${studentId}`, {
                  method: 'GET',
                  credentials: 'include',
                });
                
                if (statusResponse.ok) {
                  const statusData = await statusResponse.json();
                  
                  if (statusData.success && statusData.status) {
                    // Update the user's status if it differs
                    if (parsedUser.status !== statusData.status) {
                      console.log(`Updating user status from ${parsedUser.status} to ${statusData.status}`);
                      const updatedUser = {
                        ...parsedUser,
                        status: statusData.status
                      };
                      
                      // Update cookies and localStorage
                      const expiryDate = new Date();
                      expiryDate.setDate(expiryDate.getDate() + 7);
                      
                      Cookies.set('user', JSON.stringify(updatedUser), { 
                        expires: expiryDate,
                        path: '/',
                        secure: window.location.protocol === 'https:'
                      });
                      
                      localStorage.setItem('via_alta_user', JSON.stringify(updatedUser));
                      
                      // Set updated user
                      setUser(updatedUser);
                    } else {
                      // Status is the same, just set the user
                      setUser(parsedUser);
                    }
                  } else {
                    setUser(parsedUser);
                  }
                } else {
                  // If API call fails, still set the user from cookie
                  setUser(parsedUser);
                }
              } else {
                // No student ID, just set the user from cookie
                setUser(parsedUser);
              }
            } catch (statusErr) {
              console.error('Error checking student status:', statusErr);
              // If status check fails, fall back to cookie data
              setUser(parsedUser);
            }
          } else {
            // Not a student, just set the user from cookie
            setUser(parsedUser);
          }
          
          setIsLoading(false);
        } else {
          // If no user in cookies, check with the server for a valid session
          const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include', // Important for cookies
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              setUser(data.user);
              
              // Set client-side cookie with explicit expiration
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now
              
              Cookies.set('user', JSON.stringify(data.user), { 
                expires: expiryDate,
                path: '/',
                secure: window.location.protocol === 'https:'
              }); // Refresh client-side cookie
            }
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
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
        credentials: 'include', // Important for receiving cookies
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
      
      // Store the user in state, cookies and localStorage
      setUser(userData);
      
      // Set client-side cookie with explicit expiration
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now
      
      const userJson = JSON.stringify(userData);
      
      Cookies.set('user', userJson, { 
        expires: expiryDate,
        path: '/',
        secure: window.location.protocol === 'https:'
      }); // Expires in 7 days
      
      // Also store in localStorage as backup
      localStorage.setItem('via_alta_user', userJson);
      
      // Redirect based on role
      if (userData.role.name === 'student') {
        if(userData.status === 'inscrito' || userData.status === 'requiere-cambios') { 
          // Already confirmed schedule, redirect to confirmation page
          router.push('/estudiante/confirmacion');
        }
        else {
          // Check if student is regular or irregular
          if (userData.regular === false) {
            // Irregular student
            router.push('/estudiante');
          } else {
            // Regular student (default case when regular is undefined or true)
            router.push('/estudiante');
          }
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
      setIsLoading(true);
      
      // Call the API to remove the HTTP-only cookie
      await fetch('/api/auth', {
        method: 'DELETE',
        credentials: 'include', // Important for cookies
      });
      
      // Remove client-side cookie
      Cookies.remove('user');
      
      // Remove from localStorage too
      localStorage.removeItem('via_alta_user');
      
      // Clear user state
      setUser(null);
      
      // Clear setup state
      clearSetupState();
      
      // Redirect to login page
      router.push('/');
      
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
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