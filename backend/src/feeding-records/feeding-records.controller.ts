import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { FeedingRecordsService } from './feeding-records.service';
import { CreateFeedingRecordDto } from './dto/create-feeding-record.dto';
import { FindAllFeedingRecordsDto } from './dto/find-all-feeding-records.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiPaginatedResponse } from '../common/pagination/pagination.decorator';
import { ApiExtraModels } from '@nestjs/swagger';
import { ApiStandardErrorResponses } from '../common/errors/error-responses.decorator';
// Correct import path to shared FeedingRecord entity under fish-batches
import { FeedingRecord } from '../fish-batches/entities/feeding-record.entity';

@ApiExtraModels(FeedingRecord)
@Controller('feeding-records')
@UseGuards(JwtAuthGuard)
export class FeedingRecordsController {
  constructor(private readonly service: FeedingRecordsService) {}

  @Post()
  @Permissions('feeding.create')
  @ApiStandardErrorResponses()
  create(@Body() dto: CreateFeedingRecordDto, @Request() req) {
    return this.service.create(dto, req.user, req.tenantId);
  }

  @Get()
  @ApiPaginatedResponse(FeedingRecord, { description: 'List feeding records (paginated)' })
  @Permissions('feeding.read')
  @ApiStandardErrorResponses()
  list(@Query() query: FindAllFeedingRecordsDto, @Request() req) {
    return this.service.findAll(query, req.tenantId);
  }
}
