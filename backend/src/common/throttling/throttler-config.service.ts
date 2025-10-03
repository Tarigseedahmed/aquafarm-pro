import { Injectable } from '@nestjs/common';
import { ThrottlerModuleOptions, ThrottlerOptions } from '@nestjs/throttler';

export interface ThrottlerProfile {
  name: string;
  ttl: number; // Time to live in milliseconds
  limit: number; // Number of requests allowed
  skipIf?: (context: any) => boolean; // Optional skip condition
}

@Injectable()
export class ThrottlerConfigService {
  private profiles: Map<string, ThrottlerProfile> = new Map();

  constructor() {
    this.initializeProfiles();
  }

  private initializeProfiles(): void {
    // Authentication endpoints - stricter limits
    this.profiles.set('auth', {
      name: 'auth',
      ttl: 15 * 60 * 1000, // 15 minutes
      limit: 5, // 5 attempts per 15 minutes
    });

    // Password reset - very strict
    this.profiles.set('password-reset', {
      name: 'password-reset',
      ttl: 60 * 60 * 1000, // 1 hour
      limit: 3, // 3 attempts per hour
    });

    // API endpoints - moderate limits
    this.profiles.set('api', {
      name: 'api',
      ttl: 60 * 1000, // 1 minute
      limit: 100, // 100 requests per minute
    });

    // Water quality readings - higher limits for data collection
    this.profiles.set('water-quality', {
      name: 'water-quality',
      ttl: 60 * 1000, // 1 minute
      limit: 200, // 200 readings per minute
    });

    // File uploads - strict limits
    this.profiles.set('file-upload', {
      name: 'file-upload',
      ttl: 60 * 1000, // 1 minute
      limit: 10, // 10 uploads per minute
    });

    // Reports generation - moderate limits
    this.profiles.set('reports', {
      name: 'reports',
      ttl: 5 * 60 * 1000, // 5 minutes
      limit: 10, // 10 reports per 5 minutes
    });

    // Metrics endpoint - very strict
    this.profiles.set('metrics', {
      name: 'metrics',
      ttl: 60 * 1000, // 1 minute
      limit: 10, // 10 requests per minute
      skipIf: (context) => {
        // Skip rate limiting for internal health checks
        const request = context.switchToHttp().getRequest();
        return request.headers['x-internal'] === 'true';
      },
    });
  }

  getProfile(name: string): ThrottlerProfile | undefined {
    return this.profiles.get(name);
  }

  getAllProfiles(): ThrottlerProfile[] {
    return Array.from(this.profiles.values());
  }

  getThrottlerOptions(): ThrottlerModuleOptions {
    const throttlers: ThrottlerOptions[] = this.getAllProfiles().map((profile) => ({
      name: profile.name,
      ttl: profile.ttl,
      limit: profile.limit,
      skipIf: profile.skipIf,
    }));

    return {
      throttlers,
      errorMessage: 'Too many requests',
    };
  }

  // Calculate retry-after header value
  calculateRetryAfter(profile: ThrottlerProfile, remainingRequests: number): number {
    if (remainingRequests > 0) {
      return 0; // No retry needed
    }

    // Return TTL in seconds for retry-after header
    return Math.ceil(profile.ttl / 1000);
  }

  // Get retry-after header for specific profile
  getRetryAfterHeader(profileName: string, remainingRequests: number): number {
    const profile = this.getProfile(profileName);
    if (!profile) {
      return 60; // Default 1 minute
    }

    return this.calculateRetryAfter(profile, remainingRequests);
  }
}
