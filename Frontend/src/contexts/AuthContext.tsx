import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserEmailFromToken, getUserIdFromToken, isTokenExpired } from '../utils/token';
import { logout as requestLogout, refresh as requestRefresh } from '../services/auth.service';


interface AuthContextProps {
  isAuthenticated: boolean;
  isAuthReady: boolean;
  userId: string | null;
  userEmail: string | null;
  login: (accessToken: string, sessionId: string) => void;
  logout: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: false,
  isAuthReady: false,
  userId: null,
  userEmail: null,
  login: () => {},
  logout: async () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const sessionId = localStorage.getItem('sessionId');

      if (token && !isTokenExpired(token)) {
        const extractedUserId = getUserIdFromToken(token);
        const extractedEmail = getUserEmailFromToken(token);        
        if (isMounted) {
          setIsAuthenticated(true);
          setUserId(extractedUserId);
          setUserEmail(extractedEmail);
        }
        return;
      }

      if (sessionId) {
        try {
          const response = await requestRefresh(sessionId);
          const newToken = response.data?.accessToken;
          if (response.success && newToken) {
            localStorage.setItem('accessToken', newToken);
            const extractedUserId = getUserIdFromToken(newToken);
            const extractedEmail = getUserEmailFromToken(newToken);            
            if (isMounted) {
              setIsAuthenticated(true);
              setUserId(extractedUserId);
              setUserEmail(extractedEmail);
            }
            return;
          }
        } catch {
          // Silently fail refresh attempt
        }
      }

      localStorage.removeItem('accessToken');
      localStorage.removeItem('sessionId');
      if (isMounted) {
        setIsAuthenticated(false);
        setUserId(null);
        setUserEmail(null);
      }
    };

    initializeAuth().finally(() => {
      if (isMounted) {
        setIsAuthReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((accessToken: string, sessionId: string) => {
    localStorage.setItem('accessToken', accessToken);
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
    } else {
      localStorage.removeItem('sessionId');
    }
    setUserId(getUserIdFromToken(accessToken));
    setUserEmail(getUserEmailFromToken(accessToken));
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    let success = true;
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) {
        await requestLogout(sessionId);
      } else {
        success = false;
      }
    } catch {
      success = false;
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('sessionId');
      setIsAuthenticated(false);
      setUserId(null);
      setUserEmail(null);
    }
    return success;
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthReady, userId, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);