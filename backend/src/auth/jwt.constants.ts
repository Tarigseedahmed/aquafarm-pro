// Captured once at startup to ensure consistency between sign & verify even if process.env mutates later
export const JWT_STATIC_SECRET = process.env.JWT_SECRET || 'your-secret-key';
