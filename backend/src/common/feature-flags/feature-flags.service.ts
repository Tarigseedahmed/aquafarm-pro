import { Injectable } from '@nestjs/common';

type FlagState = 'on' | 'off';

@Injectable()
export class FeatureFlagsService {
  private parseFlags(envValue?: string): Record<string, FlagState> {
    const result: Record<string, FlagState> = {};
    if (!envValue) return result;
    for (const raw of envValue
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)) {
      const [key, value] = raw.split('=').map((s) => s.trim());
      if (!key) continue;
      const normalized: FlagState = (value?.toLowerCase() as FlagState) === 'off' ? 'off' : 'on';
      result[key] = normalized;
    }
    return result;
  }

  isEnabled(flagKey: string, tenantId?: string): boolean {
    // Tenant override: FEATURE_FLAGS_TENANT_<TENANTID>="flagA=on,flagB=off"
    const tenantEnvKey = tenantId
      ? `FEATURE_FLAGS_TENANT_${String(tenantId).replace(/-/g, '').toUpperCase()}`
      : undefined;
    const tenantFlags = tenantEnvKey ? this.parseFlags(process.env[tenantEnvKey]) : {};

    if (tenantFlags[flagKey] !== undefined) {
      return tenantFlags[flagKey] === 'on';
    }

    // Global flags: FEATURE_FLAGS
    const globalFlags = this.parseFlags(process.env.FEATURE_FLAGS);
    if (globalFlags[flagKey] !== undefined) {
      return globalFlags[flagKey] === 'on';
    }

    // Default: off if not specified
    return false;
  }
}
