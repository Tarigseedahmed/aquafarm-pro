/**
 * AquaFarm Pro - Phase 1: MVP Development
 * API Client - Base HTTP client with authentication
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  status: number
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling with token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      async (error) => {
        const originalRequest = error.config

        // SECURITY FIX AC-008: Implement Token Refresh Logic
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('refreshToken')

            if (!refreshToken) {
              throw new Error('No refresh token available')
            }

            // Attempt to refresh the token
            const response = await axios.post(
              `${this.client.defaults.baseURL}/api/auth/refresh`,
              { refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            )

            const { access_token, refresh_token } = response.data

            // Update stored tokens
            localStorage.setItem('accessToken', access_token)
            if (refresh_token) {
              localStorage.setItem('refreshToken', refresh_token)
            }

            // Update authorization header for retry
            originalRequest.headers.Authorization = `Bearer ${access_token}`

            // Retry original request
            return this.client(originalRequest)
          } catch (refreshError) {
            // Refresh failed - redirect to login
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        // For other errors or if refresh already attempted
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }

        // Extract error message from response
        const message = error.response?.data?.message ||
                        error.response?.data?.error ||
                        error.message ||
                        'حدث خطأ غير متوقع'

        return Promise.reject(new Error(message))
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config)
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config)
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config)
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config)
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config)
  }

  // File upload with progress
  async uploadFile<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  }

  // Set auth token
  setAuthToken(token: string) {
    localStorage.setItem('accessToken', token)
  }

  // Clear auth token
  clearAuthToken() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  // Get current token
  getAuthToken(): string | null {
    return localStorage.getItem('accessToken')
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAuthToken()
  }
}

export const api = new ApiClient()
export default api
