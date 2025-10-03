import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EGSConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

export interface EGSInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  sellerName: string;
  sellerVATNumber: string;
  buyerName: string;
  buyerVATNumber?: string;
  totalAmount: number;
  vatAmount: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    vatRate: number;
  }>;
}

export interface EGSSubmissionResult {
  submissionId: string;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'PENDING';
  message: string;
  timestamp: string;
  errors?: string[];
}

export interface EGSStatusResult {
  submissionId: string;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'PENDING';
  lastUpdated: string;
  details?: any;
}

@Injectable()
export class EGSConnectorService {
  private readonly logger = new Logger(EGSConnectorService.name);
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private refreshToken: string | null = null;

  constructor(private configService: ConfigService) {}

  private getConfig(): EGSConfig {
    return {
      baseUrl: this.configService.get<string>('EGS_BASE_URL', 'https://api.egs.gov.eg'),
      clientId: this.configService.get<string>('EGS_CLIENT_ID', ''),
      clientSecret: this.configService.get<string>('EGS_CLIENT_SECRET', ''),
      redirectUri: this.configService.get<string>('EGS_REDIRECT_URI', ''),
      scope: this.configService.get<string>('EGS_SCOPE', 'invoice_submission'),
    };
  }

  /**
   * Get OAuth authorization URL for EGS
   */
  getAuthorizationUrl(): string {
    const config = this.getConfig();
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope,
      state: this.generateState(),
    });

    return `${config.baseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    state: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const config = this.getConfig();

    // Validate state parameter
    if (!this.validateState(state)) {
      throw new Error('Invalid state parameter');
    }

    const response = await fetch(`${config.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const data = await response.json();

    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);

    this.logger.log('Successfully obtained access token from EGS');

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const config = this.getConfig();
    const response = await fetch(`${config.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    const data = await response.json();

    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);

    this.logger.log('Successfully refreshed access token');

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Check if access token is valid and not expired
   */
  isTokenValid(): boolean {
    if (!this.accessToken || !this.tokenExpiry) {
      return false;
    }

    // Refresh token if it expires in the next 5 minutes
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    return this.tokenExpiry.getTime() > Date.now() + bufferTime;
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.accessToken!;
    }

    if (this.refreshToken) {
      await this.refreshAccessToken();
      return this.accessToken!;
    }

    throw new Error('No valid access token available. Please re-authenticate.');
  }

  /**
   * Submit invoice to EGS
   */
  async submitInvoice(invoice: EGSInvoice): Promise<EGSSubmissionResult> {
    const accessToken = await this.getValidAccessToken();
    const config = this.getConfig();

    const response = await fetch(`${config.baseUrl}/api/invoices`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoice),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Invoice submission failed: ${error}`);
    }

    const result = await response.json();

    this.logger.log(`Invoice submitted successfully: ${result.submissionId}`);

    return {
      submissionId: result.submissionId,
      status: result.status,
      message: result.message,
      timestamp: result.timestamp,
      errors: result.errors,
    };
  }

  /**
   * Check invoice submission status
   */
  async getInvoiceStatus(submissionId: string): Promise<EGSStatusResult> {
    const accessToken = await this.getValidAccessToken();
    const config = this.getConfig();

    const response = await fetch(`${config.baseUrl}/api/invoices/${submissionId}/status`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Status check failed: ${error}`);
    }

    const result = await response.json();

    return {
      submissionId: result.submissionId,
      status: result.status,
      lastUpdated: result.lastUpdated,
      details: result.details,
    };
  }

  /**
   * Get list of submitted invoices
   */
  async getSubmittedInvoices(
    page = 1,
    limit = 50,
  ): Promise<{
    invoices: Array<{
      submissionId: string;
      invoiceNumber: string;
      status: string;
      submittedAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const accessToken = await this.getValidAccessToken();
    const config = this.getConfig();

    const response = await fetch(`${config.baseUrl}/api/invoices?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch invoices: ${error}`);
    }

    return await response.json();
  }

  /**
   * Download invoice PDF from EGS
   */
  async downloadInvoicePDF(submissionId: string): Promise<Buffer> {
    const accessToken = await this.getValidAccessToken();
    const config = this.getConfig();

    const response = await fetch(`${config.baseUrl}/api/invoices/${submissionId}/pdf`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PDF download failed: ${error}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Validate invoice data before submission
   */
  validateInvoiceData(invoice: EGSInvoice): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!invoice.invoiceNumber || invoice.invoiceNumber.trim().length === 0) {
      errors.push('Invoice number is required');
    }

    if (!invoice.invoiceDate || !/^\d{4}-\d{2}-\d{2}$/.test(invoice.invoiceDate)) {
      errors.push('Invoice date must be in YYYY-MM-DD format');
    }

    if (!invoice.sellerName || invoice.sellerName.trim().length === 0) {
      errors.push('Seller name is required');
    }

    if (!invoice.sellerVATNumber || !/^\d{9}$/.test(invoice.sellerVATNumber)) {
      errors.push('Seller VAT number must be 9 digits');
    }

    if (!invoice.buyerName || invoice.buyerName.trim().length === 0) {
      errors.push('Buyer name is required');
    }

    if (invoice.buyerVATNumber && !/^\d{9}$/.test(invoice.buyerVATNumber)) {
      errors.push('Buyer VAT number must be 9 digits if provided');
    }

    if (invoice.totalAmount <= 0) {
      errors.push('Total amount must be greater than 0');
    }

    if (invoice.vatAmount < 0) {
      errors.push('VAT amount cannot be negative');
    }

    if (!invoice.items || invoice.items.length === 0) {
      errors.push('At least one item is required');
    }

    for (const [index, item] of invoice.items.entries()) {
      if (!item.description || item.description.trim().length === 0) {
        errors.push(`Item ${index + 1}: Description is required`);
      }

      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }

      if (item.unitPrice <= 0) {
        errors.push(`Item ${index + 1}: Unit price must be greater than 0`);
      }

      if (item.totalPrice <= 0) {
        errors.push(`Item ${index + 1}: Total price must be greater than 0`);
      }

      if (item.vatRate < 0 || item.vatRate > 100) {
        errors.push(`Item ${index + 1}: VAT rate must be between 0 and 100`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate state parameter for OAuth flow
   */
  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Validate state parameter
   */
  private validateState(state: string): boolean {
    // In production, store and validate state properly
    return state && state.length > 0;
  }

  /**
   * Clear stored tokens (for logout)
   */
  clearTokens(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.refreshToken = null;
    this.logger.log('Tokens cleared');
  }

  /**
   * Get current token status
   */
  getTokenStatus(): {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    isExpired: boolean;
    expiresAt: Date | null;
  } {
    return {
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      isExpired: this.tokenExpiry ? this.tokenExpiry.getTime() <= Date.now() : true,
      expiresAt: this.tokenExpiry,
    };
  }
}
