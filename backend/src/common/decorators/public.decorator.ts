import { SetMetadata } from '@nestjs/common';

// Marks a route as public (no tenant header required explicitly).
// Still assigns a fallback tenant via interceptor for consistency.
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
