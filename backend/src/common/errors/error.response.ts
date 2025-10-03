import { ApiProperty } from '@nestjs/swagger';
import { ErrorCode } from './error-codes.enum';

export class ErrorResponseDto {
  @ApiProperty({ example: 'Not Found' })
  error: string;

  @ApiProperty({ example: 'Resource not found' })
  message: string;

  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ enum: ErrorCode, example: ErrorCode.NOT_FOUND })
  code: ErrorCode;

  @ApiProperty({ example: '2025-09-29T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/ponds/123' })
  path: string;
}
