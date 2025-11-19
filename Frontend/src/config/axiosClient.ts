import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

type RefreshApiResponse = {
  success: boolean;
  message: string;
  data?: {
    accessToken?: string;
  };
};

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// In production (Docker), VITE_API_URL="" (empty string) for relative paths
// In development, VITE_API_URL=undefined, fallback to localhost:5000
const baseURL = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:5000';

const axiosClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// =============================
// ✅ Global flags & helpers
// =============================
let isRefreshing = false;
let isLoggingOut = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const clearStoredCredentials = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('sessionId');
};

const subscribeTokenRefresh = (callback: (token: string | null) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// =============================
// ✅ Logout helper
// =============================
export const logout = async () => {
  try {
    isLoggingOut = true; // <--- đánh dấu đang logout
    const sessionId = localStorage.getItem('sessionId');
    await axiosClient.post('/v1/api/auth/logout', { sessionId });
  } finally {
    clearStoredCredentials();
    isLoggingOut = false;
  }
};

// =============================
// ✅ Request interceptor
// =============================
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =============================
// ✅ Response interceptor
// =============================
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { response, config } = error;
    const originalRequest = config as CustomAxiosRequestConfig | undefined;

    if (!response || !originalRequest) {
      return Promise.reject(error);
    }

    const status = response.status;
    const isAuthEndpoint =
      typeof originalRequest.url === 'string' &&
      /\/auth\/login|\/auth\/register|\/auth\/refresh|\/auth\/logout/.test(originalRequest.url);

    // Nếu đang logout thì KHÔNG refresh token
    if (isLoggingOut) {
      return Promise.reject(error);
    }

    if (status !== 401 || originalRequest._retry || isAuthEndpoint) {
      if (status === 401 && !isAuthEndpoint) {
        clearStoredCredentials();
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      clearStoredCredentials();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (!token) {
            reject(error);
            return;
          }
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axiosClient(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshResponse = await axios.post<RefreshApiResponse>(
        `${baseURL}/v1/api/auth/refresh`,
        { sessionId },
        { withCredentials: true }
      );

      const newToken = refreshResponse.data?.data?.accessToken;
      if (!refreshResponse.data.success || !newToken) {
        throw new Error(refreshResponse.data.message || 'Không thể làm mới phiên đăng nhập');
      }

      localStorage.setItem('accessToken', newToken);
      axiosClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      onTokenRefreshed(newToken);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return axiosClient(originalRequest);
    } catch (refreshError) {
      onTokenRefreshed(null);
      clearStoredCredentials();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;
