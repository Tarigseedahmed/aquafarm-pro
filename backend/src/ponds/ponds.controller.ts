import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PondsService } from './ponds.service';
import { CreatePondDto } from './dto/create-pond.dto';
import { UpdatePondDto } from './dto/update-pond.dto';
import { FindAllPondsDto } from './dto/find-all-ponds.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ponds')
@UseGuards(JwtAuthGuard)
export class PondsController {
  constructor(private readonly pondsService: PondsService) {}

  @Post()
  create(@Body() createPondDto: CreatePondDto, @Request() req) {
    return this.pondsService.create(createPondDto, req.user, req.tenantId);
  }

  @Get()
  findAll(@Query() query: FindAllPondsDto, @Request() req) {
    return this.pondsService.findAll(query, req.tenantId).then(res => ({
      ...res,
      // Backward compatibility: old clients expected an array at root named 'ponds'
      ponds: res.data,
    }));
  }

  @Get('test/mock')
  getMockPonds() {
    return this.pondsService.createMockPonds();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.pondsService.findOne(id, req.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePondDto: UpdatePondDto, @Request() req) {
    return this.pondsService.update(id, updatePondDto, req.tenantId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.pondsService.remove(id, req.tenantId);
    return { status: 204 };
  }
}