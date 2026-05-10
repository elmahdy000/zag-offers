import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Validate content type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      try {
        // Basic JSON injection prevention
        const bodyString = JSON.stringify(req.body);
        if (
          bodyString.includes('<script>') ||
          bodyString.includes('javascript:')
        ) {
          throw new BadRequestException('بيانات غير آمنة');
        }
      } catch {
        throw new BadRequestException('بيانات غير صالحة');
      }
    }

    // Note: In production, use Redis for distributed rate limiting

    next();
  }
}
