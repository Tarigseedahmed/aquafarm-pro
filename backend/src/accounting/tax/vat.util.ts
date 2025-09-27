// Minimal VAT calculation utilities (round half up to 2 decimals)

export interface VatComputationResult {
  net: number;
  ratePercent: number; // e.g. 15 means 15%
  vat: number;
  gross: number;
}

export function calculateVat(net: number, ratePercent: number): VatComputationResult {
  if (net < 0) throw new Error('Net must be >= 0');
  if (ratePercent < 0 || ratePercent > 100) throw new Error('Rate out of bounds');
  const vatRaw = net * (ratePercent / 100);
  const vat = Math.round(vatRaw * 100) / 100; // 2dp
  const gross = Math.round((net + vat) * 100) / 100;
  return { net, ratePercent, vat, gross };
}

export function splitGross(gross: number, ratePercent: number): VatComputationResult {
  if (gross < 0) throw new Error('Gross must be >= 0');
  if (ratePercent < 0 || ratePercent > 100) throw new Error('Rate out of bounds');
  const divisor = 1 + ratePercent / 100;
  const netRaw = gross / divisor;
  const net = Math.round(netRaw * 100) / 100;
  const vat = Math.round((gross - net) * 100) / 100;
  return { net, ratePercent, vat, gross };
}
