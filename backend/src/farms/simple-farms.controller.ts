/**
 * AquaFarm Pro - Simple Farms Controller for Testing
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  SimpleFarmsService,
  SimpleFarm,
  CreateTestFarmDto,
  UpdateTestFarmDto,
} from './simple-farms.service';

@Controller('api/simple-farms')
export class SimpleFarmsController {
  constructor(private readonly simpleFarmsService: SimpleFarmsService) {}

  @Post()
  async create(@Body() createFarmDto: CreateTestFarmDto): Promise<{
    success: boolean;
    message: string;
    data?: SimpleFarm;
    error?: string;
  }> {
    try {
      const farm = await this.simpleFarmsService.create(createFarmDto);
      return {
        success: true,
        message: 'ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø²Ø±Ø¹Ø© Ø¨Ù†Ø¬Ø§Ø­',
        data: farm,
      };
    } catch (error) {
      return {
        success: false,
        message: 'ÙØ´Ù„ ÙÙŠ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø²Ø±Ø¹Ø©',
        error: error.message,
      };
    }
  }

  @Get()
  async findAll(@Query('tenant') tenantId?: string): Promise<{
    success: boolean;
    message: string;
    data?: SimpleFarm[];
    count?: number;
    error?: string;
  }> {
    try {
      const farms = await this.simpleFarmsService.findAll(tenantId);
      return {
        success: true,
        message: 'ØªÙ… Ø¬Ù„Ø¨ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…Ø²Ø§Ø±Ø¹ Ø¨Ù†Ø¬Ø§Ø­',
        data: farms,
        count: farms.length,
      };
    } catch (error) {
      return {
        success: false,
        message: 'ÙØ´Ù„ ÙÙŠ Ø¬Ù„Ø¨ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…Ø²Ø§Ø±Ø¹',
        error: error.message,
      };
    }
  }

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('tenant') tenantId?: string,
  ): Promise<{
    success: boolean;
    message: string;
    data?: SimpleFarm[];
    count?: number;
    error?: string;
  }> {
    try {
      if (!query) {
        throw new HttpException('Query parameter is required', HttpStatus.BAD_REQUEST);
      }

      const farms = await this.simpleFarmsService.search(query, tenantId);
      return {
        success: true,
        message: `ØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ ${farms.length} Ù…Ø²Ø±Ø¹Ø©`,
        data: farms,
        count: farms.length,
      };
    } catch (error) {
      return {
        success: false,
        message: 'ÙØ´Ù„ ÙÙŠ Ø§Ù„Ø¨Ø­Ø«',
        error: error.message,
      };
    }
  }

  @Get('stats')
  async getStats(@Query('tenant') tenantId?: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
    error?: string;
  }> {
    try {
      const stats = await this.simpleFarmsService.getStats(tenantId);
      return {
        success: true,
        message: 'ØªÙ… Ø¬Ù„Ø¨ Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø¨Ù†Ø¬Ø§Ø­',
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        message: 'ÙØ´Ù„ ÙÙŠ Ø¬Ù„Ø¨ Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª',
        error: error.message,
      };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data?: SimpleFarm;
    error?: string;
  }> {
    try {
      const farm = await this.simpleFarmsService.findOne(id);
      if (!farm) {
        return {
          success: false,
          message: 'Ø§Ù„Ù…Ø²Ø±Ø¹Ø© ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©',
        };
      }
      return {
        success: true,
        message: 'ØªÙ… Ø¬Ù„Ø¨ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø²Ø±Ø¹Ø© Ø¨Ù†Ø¬Ø§Ø­',
        data: farm,
      };
    } catch (error) {
      return {
        success: false,
        message: 'ÙØ´Ù„ ÙÙŠ Ø¬Ù„Ø¨ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø²Ø±Ø¹Ø©',
        error: error.message,
      };
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateFarmDto: UpdateTestFarmDto,
  ): Promise<{
    success: boolean;
    message: string;
    data?: SimpleFarm;
    error?: string;
  }> {
    try {
      const farm = await this.simpleFarmsService.update(id, updateFarmDto);
      if (!farm) {
        return {
          success: false,
          message: 'Ø§Ù„Ù…Ø²Ø±Ø¹Ø© ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©',
        };
      }
      return {
        success: true,
        message: 'ØªÙ… ØªØ­Ø¯ÙŠØ« Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø²Ø±Ø¹Ø© Ø¨Ù†Ø¬Ø§Ø­',
        data: farm,
      };
    } catch (error) {
      return {
        success: false,
        message: 'ÙØ´Ù„ ÙÙŠ ØªØ­Ø¯ÙŠØ« Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø²Ø±Ø¹Ø©',
        error: error.message,
      };
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      const result = await this.simpleFarmsService.remove(id);
      if (!result) {
        return {
          success: false,
          message: 'Ø§Ù„Ù…Ø²Ø±Ø¹Ø© ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©',
        };
      }
      return {
        success: true,
        message: 'ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…Ø²Ø±Ø¹Ø© Ø¨Ù†Ø¬Ø§Ø­',
      };
    } catch (error) {
      return {
        success: false,
        message: 'ÙØ´Ù„ ÙÙŠ Ø­Ø°Ù Ø§Ù„Ù…Ø²Ø±Ø¹Ø©',
        error: error.message,
      };
    }
  }
}
