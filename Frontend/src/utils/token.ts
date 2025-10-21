import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp: number;
  iat: number;
  sub?: string;
  id?: string | number;
  email?: string;
}

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  return decoded.exp * 1000 < Date.now();
};

export const getUserIdFromToken = (token: string): string | null => {
  const decoded = decodeToken(token);
  if (!decoded) return null;

  if (decoded.id !== undefined && decoded.id !== null) {
    return String(decoded.id);
  }

  if (decoded.sub) {
    return String(decoded.sub);
  }

  return null;
};

export const getUserEmailFromToken = (token: string): string | null => {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  return decoded.email ?? null;
};