import { ForbiddenException } from '@nestjs/common';

export interface ForbiddenDetails {
  message: string;
  required?: string[];
  granted?: string[];
  missing?: string[];
  reason?: string; // short machine keyword (e.g. missing_permissions, ownership)
}

/**
 * Helper to standardize ForbiddenException bodies across guards/controllers.
 * Adds a stable shape for frontend consumers and metrics labeling.
 */
export function throwForbidden(details: ForbiddenDetails): never {
  const { message, required, granted, missing, reason } = details;
  throw new ForbiddenException({
    error: 'Forbidden',
    message,
    reason: reason || inferReason(missing),
    required: required || [],
    granted: granted || [],
    missing: missing || [],
  });
}

function inferReason(missing?: string[]): string {
  if (!missing || missing.length === 0) return 'forbidden';
  if (missing.includes('ownership')) return 'ownership';
  return 'missing_permissions';
}

