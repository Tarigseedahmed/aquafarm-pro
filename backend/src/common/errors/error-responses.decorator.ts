import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ErrorResponseDto } from './error.response';

export function ApiStandardErrorResponses(options?: {
  notFound?: boolean;
  unauthorized?: boolean;
  forbidden?: boolean;
  badRequest?: boolean;
  conflict?: boolean;
}) {
  const {
    notFound = true,
    unauthorized = true,
    forbidden = true,
    badRequest = true,
    conflict = true,
  } = options || {};
  const decorators: MethodDecorator[] = [ApiExtraModels(ErrorResponseDto) as any];
  if (badRequest) {
    decorators.push(
      ApiResponse({
        status: 400,
        description: 'Bad Request',
        schema: { $ref: getSchemaPath(ErrorResponseDto) },
      }) as any,
    );
  }
  if (unauthorized) {
    decorators.push(
      ApiResponse({
        status: 401,
        description: 'Unauthorized',
        schema: { $ref: getSchemaPath(ErrorResponseDto) },
      }) as any,
    );
  }
  if (forbidden) {
    decorators.push(
      ApiResponse({
        status: 403,
        description: 'Forbidden',
        schema: { $ref: getSchemaPath(ErrorResponseDto) },
      }) as any,
    );
  }
  if (notFound) {
    decorators.push(
      ApiResponse({
        status: 404,
        description: 'Not Found',
        schema: { $ref: getSchemaPath(ErrorResponseDto) },
      }) as any,
    );
  }
  if (conflict) {
    decorators.push(
      ApiResponse({
        status: 409,
        description: 'Conflict',
        schema: { $ref: getSchemaPath(ErrorResponseDto) },
      }) as any,
    );
  }
  return applyDecorators(...decorators);
}
