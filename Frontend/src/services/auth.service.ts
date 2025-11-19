import axiosClient from '../config/axiosClient';
import type { SignInFormData, SignUpFormData } from '../types/auth';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type LoginResponseData = {
  accessToken: string;
  sessionId: string;
  [key: string]: unknown;
};

type RegisterResponseData = {
  id?: string | number;
  email?: string;
  [key: string]: unknown;
};
type LogoutResponseData = {
  message: string;
  [key: string]: unknown;
};
type RefreshResponseData = {
  accessToken: string;
  [key: string]: unknown;
};

export const logout = async (
  sessionId: string
): Promise<ApiResponse<LogoutResponseData>> => {
  const response = await axiosClient.post<ApiResponse<LogoutResponseData>>(
    '/v1/api/auth/logout',
    { sessionId },
    { withCredentials: true }
  );
  return response.data;
};
export const login = async (
  credentials: Pick<SignInFormData, 'email' | 'password'>
): Promise<ApiResponse<LoginResponseData>> => {
  const response = await axiosClient.post<ApiResponse<LoginResponseData>>(
    '/v1/api/auth/login',
    {
      email: credentials.email,
      password: credentials.password,
    }
  );

  return response.data;
};

export const register = async (
  payload: SignUpFormData
): Promise<ApiResponse<RegisterResponseData>> => {
  const response = await axiosClient.post<ApiResponse<RegisterResponseData>>(
    '/v1/api/auth/register',
    {
      firstname: payload.firstName,
      lastname: payload.lastName,
      email: payload.email,
      password: payload.password,
    }
  );
  return response.data;
};

export const refresh = async (
  sessionId: string
): Promise<ApiResponse<RefreshResponseData>> => {
  const response = await axiosClient.post<ApiResponse<RefreshResponseData>>(
    '/v1/api/auth/refresh',
    { sessionId }
  );
  return response.data;
};