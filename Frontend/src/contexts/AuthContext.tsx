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
      console.log('[AuthContext] Initializing auth...');
      const token = localStorage.getItem('accessToken');
      const sessionId = localStorage.getItem('sessionId');
      console.log('[AuthContext] Token exists:', !!token, 'SessionId:', !!sessionId);

      if (token && !isTokenExpired(token)) {
        const extractedUserId = getUserIdFromToken(token);
        const extractedEmail = getUserEmailFromToken(token);
        console.log('[AuthContext] Token valid, userId:', extractedUserId, 'email:', extractedEmail);
        
        if (isMounted) {
          setIsAuthenticated(true);
          setUserId(extractedUserId);
          setUserEmail(extractedEmail);
        }
        return;
      }

      if (sessionId) {
        console.log('[AuthContext] Attempting token refresh...');
        try {
          const response = await requestRefresh(sessionId);
          const newToken = response.data?.accessToken;
          if (response.success && newToken) {
            localStorage.setItem('accessToken', newToken);
            const extractedUserId = getUserIdFromToken(newToken);
            const extractedEmail = getUserEmailFromToken(newToken);
            console.log('[AuthContext] Refresh success, userId:', extractedUserId);
            
            if (isMounted) {
              setIsAuthenticated(true);
              setUserId(extractedUserId);
              setUserEmail(extractedEmail);
            }
            return;
          }
        } catch (error) {
          console.error('[AuthContext] Failed to refresh session', error);
        }
      }

      console.log('[AuthContext] No valid auth, clearing...');
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
        console.log('[AuthContext] Auth initialization complete, ready: true');
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
        console.log('Logged out from server');
      } else {
        success = false;
      }
    } catch (error) {
      console.error('Failed to log out from server', error);
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