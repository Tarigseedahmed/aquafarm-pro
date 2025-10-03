import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '../context/request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const userId = (req as any).user?.id;
    const tenantId = (req as any).tenantId;
    RequestContext.run({ userId, tenantId }, () => next());
  }
}
