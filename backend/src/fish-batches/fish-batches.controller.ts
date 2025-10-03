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
import { ApiPaginatedResponse } from '../common/pagination/pagination.decorator';
import { ApiExtraModels } from '@nestjs/swagger';
import { FishBatch } from './entities/fish-batch.entity';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiStandardErrorResponses } from '../common/errors/error-responses.decorator';

@ApiExtraModels(FishBatch)
@Controller('fish-batches')
@UseGuards(JwtAuthGuard)
export class FishBatchesController {
  constructor(private readonly service: FishBatchesService) {}

  @Post()
  @Permissions('fish-batch.create')
  @ApiStandardErrorResponses()
  create(@Body() dto: CreateFishBatchDto, @Request() req) {
    return this.service.create(dto, req.user, req.tenantId);
  }

  @Get()
  @ApiPaginatedResponse(FishBatch, { description: 'List fish batches (paginated)' })
  @Permissions('fish-batch.read')
  @ApiStandardErrorResponses()
  findAll(@Query() query: FindAllFishBatchesDto, @Request() req) {
    return this.service.findAll(query, req.tenantId);
  }

  @Get(':id')
  @Permissions('fish-batch.read')
  @ApiStandardErrorResponses()
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(id, req.tenantId);
  }

  @Patch(':id')
  @Permissions('fish-batch.update')
  @ApiStandardErrorResponses()
  update(@Param('id') id: string, @Body() dto: UpdateFishBatchDto, @Request() req) {
    return this.service.update(id, dto, req.tenantId);
  }

  @Delete(':id')
  @Permissions('fish-batch.delete')
  @ApiStandardErrorResponses()
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(id, req.tenantId);
  }
}
