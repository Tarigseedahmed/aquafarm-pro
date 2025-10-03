import apiClient from '@/lib/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    tenant_id: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  tenant_id: string;
  locale: string;
  phone?: string;
  tenantName?: string;
  role?: string;
  createdAt?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  tenantName: string;
  phone?: string;
}

// Mock data for development
const mockUser: User = {
  id: '1',
  email: 'admin@aquafarmpro.com',
  name: 'مدير AquaFarm Pro',
  tenant_id: 'aquafarm-pro-tenant',
  locale: 'ar',
  phone: '+966500000000',
  tenantName: 'AquaFarm Pro',
  role: 'admin',
  createdAt: new Date().toISOString(),
};

const mockLoginResponse: LoginResponse = {
  access_token: 'mock-access-token-' + Date.now(),
  refresh_token: 'mock-refresh-token-' + Date.now(),
  user: mockUser,
};

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Optimized delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock validation
    if ((credentials.email === 'admin@aquafarm.com' && credentials.password === 'password') ||
        (credentials.email === 'admin@aquafarmpro.com' && credentials.password === 'admin123')) {
      return mockLoginResponse;
    }

    throw new Error('بيانات تسجيل الدخول غير صحيحة');
  },

  async logout(): Promise<void> {
    // Optimized delay
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  async refreshToken(): Promise<{ access_token: string }> {
    // Optimized delay
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      access_token: 'mock-refreshed-token-' + Date.now(),
    };
  },

  async getCurrentUser(): Promise<User> {
    // Optimized delay - much faster
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockUser;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    // Optimized delay
    await new Promise(resolve => setTimeout(resolve, 300));
    // Update mock user data
    Object.assign(mockUser, data);
    return mockUser;
  },

  async changePassword(request: ChangePasswordRequest): Promise<void> {
    // Optimized delay
    await new Promise(resolve => setTimeout(resolve, 300));
    // Mock validation
    if (request.currentPassword !== 'admin123') {
      throw new Error('كلمة المرور الحالية غير صحيحة');
    }
  },

  async register(data: RegisterRequest): Promise<LoginResponse> {
    // Optimized delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock validation - check if email already exists
    if (data.email === 'admin@aquafarmpro.com' || data.email === 'admin@aquafarm.com') {
      throw new Error('البريد الإلكتروني مستخدم بالفعل');
    }

    // Create new user
    const newUser: User = {
      id: 'user-' + Date.now(),
      email: data.email,
      name: data.name,
      tenant_id: 'tenant-' + Date.now(),
      locale: 'ar',
      phone: data.phone,
      tenantName: data.tenantName,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };

    // Return login response with new user
    return {
      access_token: 'mock-access-token-' + Date.now(),
      refresh_token: 'mock-refresh-token-' + Date.now(),
      user: newUser,
    };
  },
};
