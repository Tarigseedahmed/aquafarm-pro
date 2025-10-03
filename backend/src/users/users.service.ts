import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '../common/errors/error-codes.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(
    currentUser?: { role: string; tenantId?: string },
    page = 1,
    limit = 25,
  ): Promise<{ items: User[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (currentUser && currentUser.role !== 'admin' && currentUser.tenantId) {
      where.tenantId = currentUser.tenantId;
    }
    const [items, total] = await this.usersRepository.findAndCount({ where, skip, take: limit });
    return { items, total };
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException({ message: 'User not found', code: ErrorCode.USER_NOT_FOUND });
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, updateData);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException({ message: 'User not found', code: ErrorCode.USER_NOT_FOUND });
    }
  }

  // Ù„Ù„ØªØ¬Ø±Ø¨Ø© - Ø¥Ù†Ø´Ø§Ø¡ Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† ØªØ¬Ø±ÙŠØ¨ÙŠÙŠÙ†
  async createMockUsers() {
    const mockUsers = [
      {
        name: 'Ø£Ø­Ù…Ø¯ Ù…Ø­Ù…Ø¯',
        email: 'ahmed@example.com',
        password: '$2b$10$dummy.hash.for.testing.123456789', // password123
        role: 'admin',
        company: 'Ù…Ø²Ø±Ø¹Ø© Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø­Ù…Ø±',
        phone: '+966501234567',
      },
      {
        name: 'Ø³Ø§Ø±Ø© Ø¹Ù„ÙŠ',
        email: 'sara@example.com',
        password: '$2b$10$dummy.hash.for.testing.123456789', // password123
        role: 'user',
        company: 'Ù…Ø²Ø±Ø¹Ø© Ø§Ù„Ø®Ù„ÙŠØ¬',
        phone: '+966509876543',
      },
    ];

    return mockUsers;
  }
}
