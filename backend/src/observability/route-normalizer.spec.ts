import { normalizeRoute } from './route-normalizer';

describe('normalizeRoute', () => {
  const cases: Array<[string, string]> = [
    ['/api/users', '/api/users'],
    ['/api/users/', '/api/users'],
    ['/api/users/1234', '/api/users/:id'],
    ['/api/users/123', '/api/users/123'], // short numeric not replaced
    ['/api/users/550e8400-e29b-41d4-a716-446655440000', '/api/users/:id'],
    ['/api/items/507f1f77bcf86cd799439011', '/api/items/:id'],
    ['/api/multi/123/456789', '/api/multi/123/:id'],
    ['/api/query/12345?include=meta', '/api/query/:id'],
    ['/api/hex/abcdefabcdefabcdef', '/api/hex/:id'],
    ['/api/mixed/abc123', '/api/mixed/abc123'], // short mixed token kept
  ];

  it.each(cases)('normalizes %s => %s', (input, expected) => {
    expect(normalizeRoute(input)).toBe(expected);
  });
});

