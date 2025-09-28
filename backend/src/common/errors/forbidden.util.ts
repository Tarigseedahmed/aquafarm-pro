import { ForbiddenException } from '@nestjs/common';
import { MetricsService } from '../../observability/metrics.service';

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
export function throwForbidden(
  details: ForbiddenDetails & { route?: string; metrics?: MetricsService },
): never {
  const { message, required, granted, missing, reason, route, metrics } = details as any;
  const finalReason = reason || inferReason(missing);
  try {
    // If metrics service passed explicitly OR globally retrievable later (keep simple now)
    if (metrics && route) {
      metrics.incForbidden(route, finalReason);
    }
  } catch {
    /* ignore metrics errors */
  }
  throw new ForbiddenException({
    error: 'Forbidden',
    message,
    reason: finalReason,
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

