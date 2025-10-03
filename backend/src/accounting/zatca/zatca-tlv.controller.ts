import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ZATCATLVService, ZATCAInvoiceData, ZATCATLVResult } from './zatca-tlv.service';

export class ZATCAInvoiceDto {
  sellerName: string;
  sellerVATNumber: string;
  invoiceDate: string;
  invoiceTotal: number;
  vatTotal: number;
  invoiceNumber: string;
  timestamp: string;
}

export class ZATCAVerificationDto {
  tlvData: string;
  signature: string;
  publicKey: string;
}

@ApiTags('ZATCA TLV QR')
@UseGuards(JwtAuthGuard)
@Controller('zatca')
export class ZATCATLVController {
  constructor(private readonly zatcaService: ZATCATLVService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate ZATCA TLV QR code with digital signature' })
  @ApiBody({ type: ZATCAInvoiceDto })
  async generateZATCA(@Body() data: ZATCAInvoiceData): Promise<ZATCATLVResult> {
    // Validate input data
    const validation = this.zatcaService.validateInvoiceData(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return this.zatcaService.generateCompleteZATCA(data);
  }

  @Post('generate-with-key')
  @ApiOperation({ summary: 'Generate ZATCA TLV QR with custom private key' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        invoiceData: { $ref: '#/components/schemas/ZATCAInvoiceDto' },
        privateKey: { type: 'string', description: 'PEM formatted private key' },
      },
      required: ['invoiceData', 'privateKey'],
    },
  })
  async generateZATCAWithKey(
    @Body() body: { invoiceData: ZATCAInvoiceData; privateKey: string },
  ): Promise<ZATCATLVResult> {
    const { invoiceData, privateKey } = body;

    const validation = this.zatcaService.validateInvoiceData(invoiceData);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return this.zatcaService.generateCompleteZATCA(invoiceData, privateKey);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify ZATCA TLV signature' })
  @ApiBody({ type: ZATCAVerificationDto })
  async verifySignature(@Body() data: ZATCAVerificationDto): Promise<{ valid: boolean }> {
    const valid = this.zatcaService.verifySignature(data.tlvData, data.signature, data.publicKey);
    return { valid };
  }

  @Post('parse')
  @ApiOperation({ summary: 'Parse TLV data back to structured format' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tlvData: { type: 'string' },
      },
      required: ['tlvData'],
    },
  })
  async parseTLV(@Body() body: { tlvData: string }): Promise<Partial<ZATCAInvoiceData>> {
    return this.zatcaService.parseTLV(body.tlvData);
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate ZATCA invoice data' })
  @ApiQuery({ name: 'sellerName', required: true })
  @ApiQuery({ name: 'sellerVATNumber', required: true })
  @ApiQuery({ name: 'invoiceDate', required: true })
  @ApiQuery({ name: 'invoiceTotal', required: true })
  @ApiQuery({ name: 'vatTotal', required: true })
  @ApiQuery({ name: 'invoiceNumber', required: true })
  @ApiQuery({ name: 'timestamp', required: true })
  async validateInvoiceData(
    @Query('sellerName') sellerName: string,
    @Query('sellerVATNumber') sellerVATNumber: string,
    @Query('invoiceDate') invoiceDate: string,
    @Query('invoiceTotal') invoiceTotal: number,
    @Query('vatTotal') vatTotal: number,
    @Query('invoiceNumber') invoiceNumber: string,
    @Query('timestamp') timestamp: string,
  ) {
    const data: ZATCAInvoiceData = {
      sellerName,
      sellerVATNumber,
      invoiceDate,
      invoiceTotal,
      vatTotal,
      invoiceNumber,
      timestamp,
    };

    return this.zatcaService.validateInvoiceData(data);
  }

  @Get('test-certificate')
  @ApiOperation({ summary: 'Generate test certificate for PoC' })
  async generateTestCertificate() {
    return this.zatcaService.generateTestCertificate();
  }

  @Get('hash')
  @ApiOperation({ summary: 'Generate hash for TLV data' })
  @ApiQuery({ name: 'tlvData', required: true })
  async generateHash(@Query('tlvData') tlvData: string): Promise<{ hash: string }> {
    const hash = this.zatcaService.generateHash(tlvData);
    return { hash };
  }

  @Get('qr-code')
  @ApiOperation({ summary: 'Generate QR code from TLV data' })
  @ApiQuery({ name: 'tlvData', required: true })
  async generateQRCode(@Query('tlvData') tlvData: string): Promise<{ qrCode: string }> {
    const qrCode = this.zatcaService.generateQRCode(tlvData);
    return { qrCode };
  }
}
