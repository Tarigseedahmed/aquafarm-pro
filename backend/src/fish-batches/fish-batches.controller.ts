import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FishBatchesService } from './fish-batches.service';
import { CreateFishBatchDto } from './dto/create-fish-batch.dto';
import { UpdateFishBatchDto } from './dto/update-fish-batch.dto';
import { FindAllFishBatchesDto } from './dto/find-all-fish-batches.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('fish-batches')
@UseGuards(JwtAuthGuard)
export class FishBatchesController {
  constructor(private readonly service: FishBatchesService) {}

  @Post()
  create(@Body() dto: CreateFishBatchDto, @Request() req) {
    return this.service.create(dto, req.user, req.tenantId);
  }

  @Get()
  findAll(@Query() query: FindAllFishBatchesDto, @Request() req) {
    return this.service.findAll(query, req.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(id, req.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFishBatchDto, @Request() req) {
    return this.service.update(id, dto, req.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(id, req.tenantId);
  }
}
