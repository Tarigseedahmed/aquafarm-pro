import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath, ApiQuery } from '@nestjs/swagger';

// Reusable swagger decorator for paginated endpoints.
// Usage: @ApiPaginatedResponse(NotificationDto)
export function ApiPaginatedResponse<TModel extends Type<unknown>>(
  model: TModel,
  options?: { description?: string; metaExample?: any },
) {
  const description = options?.description || 'Paginated response';
  const metaExample = options?.metaExample || {
    page: 1,
    limit: 25,
    total: 120,
    totalPages: 5,
    hasNextPage: true,
    hasPreviousPage: false,
  };
  return applyDecorators(
    ApiExtraModels(model),
    ApiQuery({
      name: 'limit',
      required: false,
      schema: { type: 'integer', minimum: 1, maximum: 100 },
    }),
    ApiQuery({ name: 'page', required: false, schema: { type: 'integer', minimum: 1 } }),
    ApiOkResponse({
      description,
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(model) },
          },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              limit: { type: 'number' },
              total: { type: 'number' },
              totalPages: { type: 'number' },
              hasNextPage: { type: 'boolean' },
              hasPreviousPage: { type: 'boolean' },
            },
            example: metaExample,
          },
        },
      },
    }),
  );
}
