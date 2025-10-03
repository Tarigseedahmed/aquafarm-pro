import { describe, it, expect } from '@jest/globals';
import { calculateVat, splitGross } from './vat.util';
import fc from 'fast-check';

describe('VAT utils', () => {
  it('calculateVat basic correctness', () => {
    const r = calculateVat(100, 15);
    expect(r.vat).toBe(15);
    expect(r.gross).toBe(115);
  });

  it('splitGross inverse of calculateVat (property)', () => {
    fc.assert(
      fc.property(
        // Use float32 compatible boundaries
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        fc.float({ min: 0, max: 60, noNaN: true }),
        (net, rate) => {
          fc.pre(net >= 0 && rate >= 0 && rate <= 60);
          const { gross } = calculateVat(net, rate);
          const split = splitGross(gross, rate);
          // Rounding differences should remain tiny
          expect(Math.abs(split.net - net)).toBeLessThanOrEqual(0.02);
        },
      ),
      { verbose: false },
    );
  });
});
