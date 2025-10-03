import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage store for propagating correlationId across async boundaries (e.g. background jobs, scheduled tasks)
export interface CorrelationStore {
  correlationId: string;
}

export const correlationStorage = new AsyncLocalStorage<CorrelationStore>();

export function getCorrelationId(): string | undefined {
  return correlationStorage.getStore()?.correlationId;
}
