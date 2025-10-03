import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const deflate = promisify(zlib.deflate);
const brotliCompress = promisify(zlib.brotliCompress);

export interface CompressionOptions {
  level?: number; // Compression level (1-9)
  threshold?: number; // Minimum size to compress (bytes)
  chunkSize?: number; // Chunk size for streaming
}

export interface CompressionResult {
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  algorithm: string;
  data: Buffer | string;
}

@Injectable()
export class CompressionService {
  private readonly logger = new Logger(CompressionService.name);
  private readonly defaultOptions: CompressionOptions = {
    level: 6,
    threshold: 1024, // 1KB
    chunkSize: 1024 * 16, // 16KB
  };

  constructor(private configService: ConfigService) {}

  /**
   * Compress data using the best available algorithm
   */
  async compress(
    data: string | Buffer,
    options: CompressionOptions = {},
  ): Promise<CompressionResult> {
    const opts = { ...this.defaultOptions, ...options };
    const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    
    // Don't compress small data
    if (inputBuffer.length < opts.threshold!) {
      return {
        compressed: false,
        originalSize: inputBuffer.length,
        compressedSize: inputBuffer.length,
        compressionRatio: 1,
        algorithm: 'none',
        data: inputBuffer,
      };
    }

    try {
      // Try different compression algorithms and pick the best one
      const results = await Promise.all([
        this.compressGzip(inputBuffer, opts.level!),
        this.compressDeflate(inputBuffer, opts.level!),
        this.compressBrotli(inputBuffer, opts.level!),
      ]);

      // Find the best compression ratio
      const bestResult = results.reduce((best, current) => 
        current.compressionRatio < best.compressionRatio ? current : best
      );

      this.logger.debug(
        `Compression completed: ${bestResult.algorithm}, ` +
        `${bestResult.originalSize} -> ${bestResult.compressedSize} bytes ` +
        `(${Math.round(bestResult.compressionRatio * 100)}% ratio)`
      );

      return bestResult;
    } catch (error) {
      this.logger.error('Compression failed:', error);
      
      // Return uncompressed data on error
      return {
        compressed: false,
        originalSize: inputBuffer.length,
        compressedSize: inputBuffer.length,
        compressionRatio: 1,
        algorithm: 'none',
        data: inputBuffer,
      };
    }
  }

  /**
   * Compress using GZIP
   */
  private async compressGzip(data: Buffer, level: number): Promise<CompressionResult> {
    const compressed = await gzip(data, { level });
    return {
      compressed: true,
      originalSize: data.length,
      compressedSize: compressed.length,
      compressionRatio: compressed.length / data.length,
      algorithm: 'gzip',
      data: compressed,
    };
  }

  /**
   * Compress using DEFLATE
   */
  private async compressDeflate(data: Buffer, level: number): Promise<CompressionResult> {
    const compressed = await deflate(data, { level });
    return {
      compressed: true,
      originalSize: data.length,
      compressedSize: compressed.length,
      compressionRatio: compressed.length / data.length,
      algorithm: 'deflate',
      data: compressed,
    };
  }

  /**
   * Compress using Brotli
   */
  private async compressBrotli(data: Buffer, level: number): Promise<CompressionResult> {
    const compressed = await brotliCompress(data, { 
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: level,
        [zlib.constants.BROTLI_PARAM_SIZE_HINT]: data.length,
      }
    });
    return {
      compressed: true,
      originalSize: data.length,
      compressedSize: compressed.length,
      compressionRatio: compressed.length / data.length,
      algorithm: 'br',
      data: compressed,
    };
  }

  /**
   * Decompress data
   */
  async decompress(
    data: Buffer,
    algorithm: string,
  ): Promise<Buffer> {
    try {
      switch (algorithm.toLowerCase()) {
        case 'gzip':
          return await promisify(zlib.gunzip)(data);
        case 'deflate':
          return await promisify(zlib.inflate)(data);
        case 'br':
          return await promisify(zlib.brotliDecompress)(data);
        default:
          throw new Error(`Unsupported compression algorithm: ${algorithm}`);
      }
    } catch (error) {
      this.logger.error(`Decompression failed for algorithm ${algorithm}:`, error);
      throw error;
    }
  }

  /**
   * Get compression statistics
   */
  getCompressionStats(): {
    enabled: boolean;
    algorithms: string[];
    threshold: number;
    level: number;
  } {
    return {
      enabled: this.configService.get<string>('COMPRESSION_ENABLED') !== 'false',
      algorithms: ['gzip', 'deflate', 'br'],
      threshold: this.defaultOptions.threshold!,
      level: this.defaultOptions.level!,
    };
  }

  /**
   * Check if compression should be applied based on content type
   */
  shouldCompress(contentType: string): boolean {
    const compressibleTypes = [
      'text/',
      'application/json',
      'application/javascript',
      'application/xml',
      'application/rss+xml',
      'application/atom+xml',
      'image/svg+xml',
    ];

    const nonCompressibleTypes = [
      'image/',
      'video/',
      'audio/',
      'application/zip',
      'application/gzip',
      'application/x-rar-compressed',
    ];

    // Don't compress already compressed content
    if (nonCompressibleTypes.some(type => contentType.includes(type))) {
      return false;
    }

    // Compress text-based content
    return compressibleTypes.some(type => contentType.includes(type));
  }

  /**
   * Get appropriate Content-Encoding header
   */
  getContentEncoding(algorithm: string): string {
    switch (algorithm.toLowerCase()) {
      case 'gzip':
        return 'gzip';
      case 'deflate':
        return 'deflate';
      case 'br':
        return 'br';
      default:
        return '';
    }
  }

  /**
   * Compress streaming data
   */
  createCompressionStream(algorithm: string = 'gzip'): NodeJS.ReadWriteStream {
    switch (algorithm.toLowerCase()) {
      case 'gzip':
        return zlib.createGzip({ level: this.defaultOptions.level });
      case 'deflate':
        return zlib.createDeflate({ level: this.defaultOptions.level });
      case 'br':
        return zlib.createBrotliCompress({
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: this.defaultOptions.level,
          }
        });
      default:
        throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }
  }

  /**
   * Decompress streaming data
   */
  createDecompressionStream(algorithm: string): NodeJS.ReadWriteStream {
    switch (algorithm.toLowerCase()) {
      case 'gzip':
        return zlib.createGunzip();
      case 'deflate':
        return zlib.createInflate();
      case 'br':
        return zlib.createBrotliDecompress();
      default:
        throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }
  }
}
