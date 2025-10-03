import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { CompressionService } from './compression.service';
import { PinoLoggerService } from '../logging/pino-logger.service';

@Injectable()
export class CompressionInterceptor implements NestInterceptor {
  constructor(
    private compressionService: CompressionService,
    private logger: PinoLoggerService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest();

    // Check if compression is enabled
    if (!this.compressionService.getCompressionStats().enabled) {
      return next.handle();
    }

    // Check if client accepts compression
    const acceptEncoding = request.headers['accept-encoding'] || '';
    const supportedAlgorithms = this.getSupportedAlgorithms(acceptEncoding);

    if (supportedAlgorithms.length === 0) {
      return next.handle();
    }

    // Get the best supported algorithm
    const algorithm = this.getBestAlgorithm(supportedAlgorithms);

    return next.handle().pipe(
      map(async (data) => {
        try {
          // Skip compression for small responses or binary data
          if (this.shouldSkipCompression(data, response)) {
            return data;
          }

          // Compress the response
          const result = await this.compressionService.compress(
            JSON.stringify(data),
            { level: 6 }
          );

          if (result.compressed && result.compressionRatio < 0.9) {
            // Only use compression if it provides meaningful savings
            response.setHeader('Content-Encoding', result.algorithm);
            response.setHeader('Content-Length', result.compressedSize.toString());
            
            // Set Vary header to indicate compression
            const varyHeader = response.getHeader('Vary') || '';
            const varyValues = varyHeader ? varyHeader.toString().split(', ') : [];
            if (!varyValues.includes('Accept-Encoding')) {
              varyValues.push('Accept-Encoding');
              response.setHeader('Vary', varyValues.join(', '));
            }

            this.logger.debug(
              {
                event: 'response.compressed',
                algorithm: result.algorithm,
                originalSize: result.originalSize,
                compressedSize: result.compressedSize,
                ratio: Math.round(result.compressionRatio * 100),
                url: request.url,
              },
              `Response compressed: ${result.originalSize} -> ${result.compressedSize} bytes`
            );

            return result.data;
          }

          return data;
        } catch (error) {
          this.logger.error(
            {
              event: 'compression.error',
              error: error.message,
              url: request.url,
            },
            'Response compression failed'
          );
          
          // Return original data on compression error
          return data;
        }
      }),
    );
  }

  /**
   * Get supported compression algorithms from Accept-Encoding header
   */
  private getSupportedAlgorithms(acceptEncoding: string): string[] {
    const algorithms: string[] = [];
    
    if (acceptEncoding.includes('br')) {
      algorithms.push('br');
    }
    if (acceptEncoding.includes('gzip')) {
      algorithms.push('gzip');
    }
    if (acceptEncoding.includes('deflate')) {
      algorithms.push('deflate');
    }

    return algorithms;
  }

  /**
   * Get the best compression algorithm (prefer Brotli, then GZIP, then DEFLATE)
   */
  private getBestAlgorithm(algorithms: string[]): string {
    if (algorithms.includes('br')) return 'br';
    if (algorithms.includes('gzip')) return 'gzip';
    if (algorithms.includes('deflate')) return 'deflate';
    return algorithms[0];
  }

  /**
   * Determine if compression should be skipped
   */
  private shouldSkipCompression(data: any, response: Response): boolean {
    // Skip if data is null or undefined
    if (!data) return true;

    // Skip if response is already compressed
    if (response.getHeader('Content-Encoding')) return true;

    // Skip for binary content types
    const contentType = response.getHeader('Content-Type') as string;
    if (contentType && !this.compressionService.shouldCompress(contentType)) {
      return true;
    }

    // Skip for very small responses
    const dataSize = JSON.stringify(data).length;
    if (dataSize < 1024) { // Less than 1KB
      return true;
    }

    return false;
  }
}

/**
 * Stream compression interceptor for large responses
 */
@Injectable()
export class StreamCompressionInterceptor implements NestInterceptor {
  constructor(
    private compressionService: CompressionService,
    private logger: PinoLoggerService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest();

    // Check if compression is enabled
    if (!this.compressionService.getCompressionStats().enabled) {
      return next.handle();
    }

    // Check if client accepts compression
    const acceptEncoding = request.headers['accept-encoding'] || '';
    const supportedAlgorithms = this.getSupportedAlgorithms(acceptEncoding);

    if (supportedAlgorithms.length === 0) {
      return next.handle();
    }

    // Get the best supported algorithm
    const algorithm = this.getBestAlgorithm(supportedAlgorithms);

    return next.handle().pipe(
      map((data) => {
        // Check if data is a stream
        if (data && typeof data.pipe === 'function') {
          // Create compression stream
          const compressionStream = this.compressionService.createCompressionStream(algorithm);
          
          // Set response headers
          response.setHeader('Content-Encoding', algorithm);
          response.setHeader('Vary', 'Accept-Encoding');

          this.logger.debug(
            {
              event: 'stream.compressed',
              algorithm,
              url: request.url,
            },
            `Stream compressed with ${algorithm}`
          );

          // Pipe data through compression
          return data.pipe(compressionStream);
        }

        return data;
      }),
    );
  }

  private getSupportedAlgorithms(acceptEncoding: string): string[] {
    const algorithms: string[] = [];
    
    if (acceptEncoding.includes('br')) {
      algorithms.push('br');
    }
    if (acceptEncoding.includes('gzip')) {
      algorithms.push('gzip');
    }
    if (acceptEncoding.includes('deflate')) {
      algorithms.push('deflate');
    }

    return algorithms;
  }

  private getBestAlgorithm(algorithms: string[]): string {
    if (algorithms.includes('br')) return 'br';
    if (algorithms.includes('gzip')) return 'gzip';
    if (algorithms.includes('deflate')) return 'deflate';
    return algorithms[0];
  }
}
