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
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Permissions('user.write')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @Permissions('user.read')
  findAll(@Request() req): any {
    const page = req.query?.page ? parseInt(String(req.query.page), 10) || 1 : 1;
    const limit = req.query?.limit
      ? Math.min(parseInt(String(req.query.limit), 10) || 25, 100)
      : 25;
    return this.usersService.findAll({ role: req.user.role, tenantId: req.tenantId }, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @Permissions('user.read')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // Self profile without needing global user.read permission.
  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  getSelf(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @Permissions('user.write')
  update(@Param('id') id: string, @Body() updateUserDto: Partial<CreateUserDto>, @Request() req) {
    // Object-level rule: allow if admin or self
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw new ForbiddenException({
        error: 'Forbidden',
        message: 'Cannot modify other users',
        required: ['admin OR self'],
        granted: [req.user.role],
        missing: ['ownership'],
      } as any);
    }
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @Permissions('user.write')
  remove(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw new ForbiddenException({
        error: 'Forbidden',
        message: 'Cannot delete other users',
        required: ['admin OR self'],
        granted: [req.user.role],
        missing: ['ownership'],
      } as any);
    }
    return this.usersService.remove(id);
  }

  @Get('test/mock')
  getMockUsers() {
    return this.usersService.createMockUsers();
  }
}
