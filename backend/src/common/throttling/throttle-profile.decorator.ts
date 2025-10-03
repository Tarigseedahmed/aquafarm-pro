import { SetMetadata } from '@nestjs/common';

export const THROTTLE_PROFILE_KEY = 'throttle_profile';

/**
 * Decorator to specify which throttler profile to use for an endpoint
 * @param profileName The name of the throttler profile
 */
export const ThrottleProfile = (profileName: string) =>
  SetMetadata(THROTTLE_PROFILE_KEY, profileName);

/**
 * Predefined profile decorators for common use cases
 */
export const ThrottleAuth = () => ThrottleProfile('auth');
export const ThrottlePasswordReset = () => ThrottleProfile('password-reset');
export const ThrottleWaterQuality = () => ThrottleProfile('water-quality');
export const ThrottleFileUpload = () => ThrottleProfile('file-upload');
export const ThrottleReports = () => ThrottleProfile('reports');
export const ThrottleMetrics = () => ThrottleProfile('metrics');
export const ThrottleAPI = () => ThrottleProfile('api');
