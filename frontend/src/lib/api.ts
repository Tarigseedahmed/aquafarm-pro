import axios from 'axios';

// In-memory cache of tenant id to avoid repeated localStorage access on every request
let currentTenantId: string | null = null;

export function setTenantId(tenantId: string | null) {
  currentTenantId = tenantId;
  if (tenantId) {
    try { localStorage.setItem('tenant_id', tenantId); } catch { /* ignore */ }
  } else {
    try { localStorage.removeItem('tenant_id'); } catch { /* ignore */ }
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add tenant ID (prefer in-memory cache, fallback to localStorage once)
    if (!currentTenantId && typeof window !== 'undefined') {
      try { currentTenantId = localStorage.getItem('tenant_id'); } catch { /* ignore */ }
    }
    const tenantId = currentTenantId;
    if (tenantId) {
      // Standardize header case (backend treats headers case-insensitively, but we use canonical form)
      config.headers['X-Tenant-Id'] = tenantId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and redirect to login
      try {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('tenant_id');
      } catch { /* ignore */ }
      currentTenantId = null;
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
