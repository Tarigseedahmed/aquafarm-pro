import { Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountingSeedService } from './accounting-seed.service';

@ApiTags('Accounting Seed')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounting/seed')
export class AccountingSeedController {
  constructor(private readonly accountingSeedService: AccountingSeedService) {}

  @Post()
  @ApiOperation({ summary: 'Seed accounting data for the current tenant' })
  @ApiResponse({ status: 201, description: 'Accounting data seeded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async seedAccountingData(@Request() req) {
    const tenantId = req.tenantId;

    // Check if data already exists
    const hasData = await this.accountingSeedService.hasSeededData(tenantId);
    if (hasData) {
      return {
        message: 'Accounting data already exists for this tenant',
        hasData: true,
      };
    }

    const result = await this.accountingSeedService.seedAll(tenantId);

    return {
      message: 'Accounting data seeded successfully',
      data: {
        accountsCreated: result.accounts.length,
        profilesCreated: result.profiles.length,
        ratesCreated: result.rates.length,
      },
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Check if accounting data is seeded for the current tenant' })
  @ApiResponse({ status: 200, description: 'Status of seeded data' })
  async getSeedStatus(@Request() req) {
    const tenantId = req.tenantId;
    const hasData = await this.accountingSeedService.hasSeededData(tenantId);

    return {
      hasSeededData: hasData,
      tenantId,
    };
  }

  @Post('chart-of-accounts')
  @ApiOperation({ summary: 'Seed chart of accounts for the current tenant' })
  @ApiResponse({ status: 201, description: 'Chart of accounts seeded successfully' })
  async seedChartOfAccounts(@Request() req) {
    const tenantId = req.tenantId;
    const accounts = await this.accountingSeedService.seedChartOfAccounts(tenantId);

    return {
      message: 'Chart of accounts seeded successfully',
      accountsCreated: accounts.length,
    };
  }

  @Post('tax-profiles')
  @ApiOperation({ summary: 'Seed tax profiles for the current tenant' })
  @ApiResponse({ status: 201, description: 'Tax profiles seeded successfully' })
  async seedTaxProfiles(@Request() req) {
    const tenantId = req.tenantId;
    const profiles = await this.accountingSeedService.seedTaxProfiles(tenantId);

    return {
      message: 'Tax profiles seeded successfully',
      profilesCreated: profiles.length,
    };
  }

  @Post('tax-rates')
  @ApiOperation({ summary: 'Seed tax rates for the current tenant' })
  @ApiResponse({ status: 201, description: 'Tax rates seeded successfully' })
  async seedTaxRates(@Request() req) {
    const tenantId = req.tenantId;
    const rates = await this.accountingSeedService.seedTaxRates(tenantId);

    return {
      message: 'Tax rates seeded successfully',
      ratesCreated: rates.length,
    };
  }
}
