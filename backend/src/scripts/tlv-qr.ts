/* TLV QR (ZATCA Phase 1) generator PoC.
 * Tags:
 * 1 = Seller Name
 * 2 = VAT Registration Number
 * 3 = Timestamp (ISO8601)
 * 4 = Invoice Total (with VAT)
 * 5 = VAT Total
 */
import { Buffer } from 'buffer';

interface TlvInput {
  sellerName: string;
  vatNumber: string;
  timestamp: string; // ISO
  totalWithVat: string; // decimal string
  vatTotal: string; // decimal string
}

function encodeTLV(tag: number, value: string): Buffer {
  const vBuf = Buffer.from(value, 'utf8');
  return Buffer.concat([Buffer.from([tag]), Buffer.from([vBuf.length]), vBuf]);
}

export function generateZatcaTlvBase64(input: TlvInput): string {
  const payload = Buffer.concat([
    encodeTLV(1, input.sellerName),
    encodeTLV(2, input.vatNumber),
    encodeTLV(3, input.timestamp),
    encodeTLV(4, input.totalWithVat),
    encodeTLV(5, input.vatTotal),
  ]);
  return payload.toString('base64');
}

if (require.main === module) {
  const sample = generateZatcaTlvBase64({
    sellerName: 'AquaFarm Example Co',
    vatNumber: '123456789012345',
    timestamp: new Date().toISOString(),
    totalWithVat: '115.00',
    vatTotal: '15.00',
  });
  console.log(sample);
}
