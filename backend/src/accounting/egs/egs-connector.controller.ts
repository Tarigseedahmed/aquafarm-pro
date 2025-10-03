import { Controller, Get, Post, Body, Query, Param, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EGSConnectorService, EGSSubmissionResult, EGSStatusResult } from './egs-connector.service';
// Minimal DTO mirrors EGSInvoice shape (avoid using interface as runtime type)
export class EGSInvoiceDto {
  invoiceNumber!: string;
  invoiceDate!: string;
  sellerVatNumber!: string;
  buyerVatNumber?: string;
  invoiceTotal!: number;
  vatTotal!: number;
  lines!: Array<{ description: string; quantity: number; unitPrice: number; vatRate: number }>;
}
import { Response } from 'express';

@ApiTags('EGS Egypt Connector')
@UseGuards(JwtAuthGuard)
@Controller('egs')
export class EGSConnectorController {
  constructor(private readonly egsService: EGSConnectorService) {}

  @Get('auth-url')
  @ApiOperation({ summary: 'Get OAuth authorization URL for EGS' })
  async getAuthorizationUrl(): Promise<{ authUrl: string }> {
    const authUrl = this.egsService.getAuthorizationUrl();
    return { authUrl };
  }

  @Post('exchange-token')
  @ApiOperation({ summary: 'Exchange authorization code for access token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        state: { type: 'string' },
      },
      required: ['code', 'state'],
    },
  })
  async exchangeToken(@Body() body: { code: string; state: string }) {
    return this.egsService.exchangeCodeForToken(body.code, body.state);
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refreshToken() {
    return this.egsService.refreshAccessToken();
  }

  @Get('token-status')
  @ApiOperation({ summary: 'Get current token status' })
  async getTokenStatus() {
    return this.egsService.getTokenStatus();
  }

  @Post('submit-invoice')
  @ApiOperation({ summary: 'Submit invoice to EGS' })
  @ApiBody({ type: EGSInvoiceDto })
  async submitInvoice(@Body() invoice: EGSInvoiceDto): Promise<EGSSubmissionResult> {
    // Validate invoice data
  const validation = this.egsService.validateInvoiceData(invoice as any);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

  return this.egsService.submitInvoice(invoice as any);
  }

  @Get('invoice-status/:submissionId')
  @ApiOperation({ summary: 'Get invoice submission status' })
  @ApiParam({ name: 'submissionId', description: 'Submission ID' })
  async getInvoiceStatus(@Param('submissionId') submissionId: string): Promise<EGSStatusResult> {
    return this.egsService.getInvoiceStatus(submissionId);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get list of submitted invoices' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSubmittedInvoices(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.egsService.getSubmittedInvoices(page || 1, limit || 50);
  }

  @Get('invoice/:submissionId/pdf')
  @ApiOperation({ summary: 'Download invoice PDF from EGS' })
  @ApiParam({ name: 'submissionId', description: 'Submission ID' })
  async downloadInvoicePDF(@Param('submissionId') submissionId: string, @Res() res: Response) {
    const pdfBuffer = await this.egsService.downloadInvoicePDF(submissionId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${submissionId}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    res.send(pdfBuffer);
  }

  @Post('validate-invoice')
  @ApiOperation({ summary: 'Validate invoice data before submission' })
  @ApiBody({ type: EGSInvoiceDto })
  async validateInvoice(@Body() invoice: EGSInvoiceDto) {
  return this.egsService.validateInvoiceData(invoice as any);
  }

  @Post('clear-tokens')
  @ApiOperation({ summary: 'Clear stored tokens (logout)' })
  async clearTokens() {
    this.egsService.clearTokens();
    return { message: 'Tokens cleared successfully' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check EGS connector health' })
  async healthCheck() {
    const tokenStatus = this.egsService.getTokenStatus();
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      tokenStatus,
    };
  }
}
