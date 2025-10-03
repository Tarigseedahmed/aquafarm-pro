import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface ZATCAInvoiceData {
  sellerName: string;
  sellerVATNumber: string;
  invoiceDate: string; // ISO date
  invoiceTotal: number;
  vatTotal: number;
  invoiceNumber: string;
  timestamp: string; // ISO datetime
}

export interface ZATCATLVResult {
  tlvData: string;
  qrCode: string;
  hash: string;
  signature: string;
}

@Injectable()
export class ZATCATLVService {
  private readonly logger = new Logger(ZATCATLVService.name);

  /**
   * Generate TLV (Tag-Length-Value) data for ZATCA QR Code
   * Based on ZATCA E-Invoicing Implementation Standard
   */
  generateTLV(data: ZATCAInvoiceData): string {
    const tlvFields = [
      { tag: '01', value: data.sellerName },
      { tag: '02', value: data.sellerVATNumber },
      { tag: '03', value: data.invoiceDate },
      { tag: '04', value: data.invoiceTotal.toFixed(2) },
      { tag: '05', value: data.vatTotal.toFixed(2) },
      { tag: '06', value: data.invoiceNumber },
      { tag: '07', value: data.timestamp },
    ];

    let tlvData = '';
    for (const field of tlvFields) {
      const length = field.value.length.toString().padStart(2, '0');
      tlvData += field.tag + length + field.value;
    }

    return tlvData;
  }

  /**
   * Generate QR Code data for ZATCA
   * Format: Base64 encoded TLV data
   */
  generateQRCode(tlvData: string): string {
    return Buffer.from(tlvData).toString('base64');
  }

  /**
   * Generate hash for TLV data using SHA256
   */
  generateHash(tlvData: string): string {
    return crypto.createHash('sha256').update(tlvData).digest('hex');
  }

  /**
   * Generate digital signature for TLV data
   * Note: This is a PoC implementation. In production, use proper certificate-based signing
   */
  generateSignature(tlvData: string, privateKey?: string): string {
    if (!privateKey) {
      // Generate a test private key for PoC
      const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      privateKey = keyPair.privateKey;
    }

    const sign = crypto.createSign('sha256');
    sign.update(tlvData);
    sign.end();

    return sign.sign(privateKey, 'base64');
  }

  /**
   * Verify digital signature
   */
  verifySignature(tlvData: string, signature: string, publicKey: string): boolean {
    try {
      const verify = crypto.createVerify('sha256');
      verify.update(tlvData);
      verify.end();

      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      this.logger.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Complete ZATCA TLV generation with QR code and signature
   */
  generateCompleteZATCA(data: ZATCAInvoiceData, privateKey?: string): ZATCATLVResult {
    const tlvData = this.generateTLV(data);
    const qrCode = this.generateQRCode(tlvData);
    const hash = this.generateHash(tlvData);
    const signature = this.generateSignature(tlvData, privateKey);

    return {
      tlvData,
      qrCode,
      hash,
      signature,
    };
  }

  /**
   * Parse TLV data back to structured format
   */
  parseTLV(tlvData: string): Partial<ZATCAInvoiceData> {
    const result: Partial<ZATCAInvoiceData> = {};
    let index = 0;

    while (index < tlvData.length) {
      if (index + 4 > tlvData.length) break;

      const tag = tlvData.substring(index, index + 2);
      const length = parseInt(tlvData.substring(index + 2, index + 4), 10);

      if (index + 4 + length > tlvData.length) break;

      const value = tlvData.substring(index + 4, index + 4 + length);

      switch (tag) {
        case '01':
          result.sellerName = value;
          break;
        case '02':
          result.sellerVATNumber = value;
          break;
        case '03':
          result.invoiceDate = value;
          break;
        case '04':
          result.invoiceTotal = parseFloat(value);
          break;
        case '05':
          result.vatTotal = parseFloat(value);
          break;
        case '06':
          result.invoiceNumber = value;
          break;
        case '07':
          result.timestamp = value;
          break;
      }

      index += 4 + length;
    }

    return result;
  }

  /**
   * Validate ZATCA invoice data
   */
  validateInvoiceData(data: ZATCAInvoiceData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.sellerName || data.sellerName.length < 1) {
      errors.push('Seller name is required');
    }

    if (!data.sellerVATNumber || !/^\d{15}$/.test(data.sellerVATNumber)) {
      errors.push('Seller VAT number must be 15 digits');
    }

    if (!data.invoiceDate || !/^\d{4}-\d{2}-\d{2}$/.test(data.invoiceDate)) {
      errors.push('Invoice date must be in YYYY-MM-DD format');
    }

    if (data.invoiceTotal < 0) {
      errors.push('Invoice total cannot be negative');
    }

    if (data.vatTotal < 0) {
      errors.push('VAT total cannot be negative');
    }

    if (!data.invoiceNumber || data.invoiceNumber.length < 1) {
      errors.push('Invoice number is required');
    }

    if (!data.timestamp || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data.timestamp)) {
      errors.push('Timestamp must be in ISO format');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate test certificate for PoC
   */
  generateTestCertificate(): { privateKey: string; publicKey: string; certificate: string } {
    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    return {
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      // Placeholder PEM (not a valid certificate) for development use only
      certificate:
        '-----BEGIN CERTIFICATE-----\nMIIDEzCCAfugAwIBAgIUTESTCERTDEVONLY\n-----END CERTIFICATE-----',
    };
  }
}
