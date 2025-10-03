// Augment Express Request to include tenant fields and rawBody (if provided by middleware)
declare namespace Express {
  interface Request {
    tenantId?: string;
    tenantCode?: string;
    rawBody?: Buffer;
  }
}
