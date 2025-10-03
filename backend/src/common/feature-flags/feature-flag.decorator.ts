import { SetMetadata } from '@nestjs/common';

export const FEATURE_FLAG_KEY = 'feature_flag_required';

export function RequireFeatureFlag(flagKey: string) {
  return SetMetadata(FEATURE_FLAG_KEY, flagKey);
}
