import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { FeedingRecordsService } from './feeding-records.service';
import { CreateFeedingRecordDto } from './dto/create-feeding-record.dto';
import { FindAllFeedingRecordsDto } from './dto/find-all-feeding-records.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('feeding-records')
@UseGuards(JwtAuthGuard)
export class FeedingRecordsController {
  constructor(private readonly service: FeedingRecordsService) {}

  @Post()
  create(@Body() dto: CreateFeedingRecordDto, @Request() req) {
    return this.service.create(dto, req.user, req.tenantId);
  }

  @Get()
  list(@Query() query: FindAllFeedingRecordsDto, @Request() req) {
    return this.service.findAll(query, req.tenantId);
  }
}
