import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiStandardErrorResponses } from '../common/errors/error-responses.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard, AdminGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiStandardErrorResponses()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get('me')
  @ApiStandardErrorResponses()
  getMyTenant(@Req() req) {
    return this.tenantsService.findByCodeOrId(req.tenantId, req.tenantId);
  }

  @Get(':id')
  @ApiStandardErrorResponses()
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Post()
  @Roles('admin')
  @Permissions('tenant.create')
  @ApiStandardErrorResponses()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  @Permissions('tenant.update')
  @ApiStandardErrorResponses()
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @Permissions('tenant.delete')
  @ApiStandardErrorResponses()
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
