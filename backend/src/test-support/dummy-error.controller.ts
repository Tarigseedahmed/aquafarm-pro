import { Controller, Get, NotFoundException, BadRequestException } from '@nestjs/common';
import { ErrorCode } from '../common/errors/error-codes.enum';

@Controller('dummy-error')
export class DummyErrorController {
  @Get('explicit')
  explicit() {
    throw new NotFoundException({
      message: 'Explicit pond missing',
      code: ErrorCode.POND_NOT_FOUND,
    });
  }

  @Get('implicit404')
  implicit404() {
    throw new NotFoundException('Not here');
  }

  @Get('badrequest')
  badRequest() {
    throw new BadRequestException('Bad shape');
  }

  @Get('boom')
  boom() {
    throw new Error('Kaboom');
  }
}
