import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @Permissions('farm.create')
  create(@Body(new ValidationPipe()) createFarmDto: CreateFarmDto, @Request() req) {
    return this.farmsService.create(createFarmDto, req.user.id, req.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @Permissions('farm.read')
  findAll(
    @Request() req,
    @Query('all') all?: string,
    @Query('page') pageQ?: string,
    @Query('limit') limitQ?: string,
  ) {
    const ownerId = req.user.role === 'admin' && all === 'true' ? undefined : req.user.id;
    const page = pageQ ? parseInt(pageQ, 10) || 1 : 1;
    const limit = limitQ ? Math.min(parseInt(limitQ, 10) || 25, 100) : 25;
    return this.farmsService.findAll(ownerId, req.tenantId, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @Permissions('farm.read')
  findOne(@Param('id') id: string, @Request() req) {
    const ownerId = req.user.role === 'admin' ? undefined : req.user.id;
    return this.farmsService.findOne(id, ownerId, req.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/stats')
  @Permissions('farm.read')
  getFarmStats(@Param('id') id: string, @Request() req) {
    const ownerId = req.user.role === 'admin' ? undefined : req.user.id;
    return this.farmsService.getFarmStats(id, ownerId, req.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @Permissions('farm.update')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateFarmDto: UpdateFarmDto,
    @Request() req,
  ) {
    const ownerId = req.user.role === 'admin' ? undefined : req.user.id;
    return this.farmsService.update(id, updateFarmDto, ownerId, req.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @Permissions('farm.delete')
  async remove(@Param('id') id: string, @Request() req) {
    const ownerId = req.user.role === 'admin' ? undefined : req.user.id;
    await this.farmsService.remove(id, ownerId, req.tenantId);
    return { status: 204 };
  }

  // Endpoint ØªØ¬Ø±ÙŠØ¨ÙŠ Ù„Ù„Ø§Ø®ØªØ¨Ø§Ø±
  @Get('test/mock')
  getMockFarms() {
    return this.farmsService.createMockFarms();
  }
}
