import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLoggerService } from '../logging/pino-logger.service';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  progressive?: boolean;
  lossless?: boolean;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  channels: number;
  density?: number;
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
  dimensions: {
    original: { width: number; height: number };
    optimized: { width: number; height: number };
  };
  filePath: string;
}

@Injectable()
export class ImageOptimizationService {
  private readonly logger = new Logger(ImageOptimizationService.name);
  private readonly defaultOptions: ImageOptimizationOptions = {
    quality: 85,
    format: 'webp',
    progressive: true,
    lossless: false,
  };

  constructor(
    private configService: ConfigService,
    private pinoLogger: PinoLoggerService,
  ) {}

  /**
   * Optimize image file
   */
  async optimizeImage(
    inputPath: string,
    outputPath: string,
    options: ImageOptimizationOptions = {},
  ): Promise<OptimizationResult> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Get original image metadata
      const originalMetadata = await this.getImageMetadata(inputPath);
      const originalSize = fs.statSync(inputPath).size;

      // Create Sharp instance
      let sharpInstance = sharp(inputPath);

      // Apply resizing if specified
      if (opts.width || opts.height) {
        sharpInstance = sharpInstance.resize(opts.width, opts.height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Apply format-specific optimizations
      sharpInstance = this.applyFormatOptimizations(sharpInstance, opts);

      // Apply additional optimizations
      sharpInstance = this.applyAdditionalOptimizations(sharpInstance, opts);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Process and save image
      await sharpInstance.toFile(outputPath);

      // Get optimized image metadata
      const optimizedMetadata = await this.getImageMetadata(outputPath);
      const optimizedSize = fs.statSync(outputPath).size;

      const result: OptimizationResult = {
        originalSize,
        optimizedSize,
        compressionRatio: optimizedSize / originalSize,
        format: optimizedMetadata.format,
        dimensions: {
          original: { width: originalMetadata.width, height: originalMetadata.height },
          optimized: { width: optimizedMetadata.width, height: optimizedMetadata.height },
        },
        filePath: outputPath,
      };

      this.logger.debug(
        `Image optimized: ${originalSize} -> ${optimizedSize} bytes ` +
        `(${Math.round(result.compressionRatio * 100)}% ratio)`
      );

      return result;
    } catch (error) {
      this.logger.error(`Image optimization failed for ${inputPath}:`, error);
      throw error;
    }
  }

  /**
   * Generate multiple sizes for responsive images
   */
  async generateResponsiveSizes(
    inputPath: string,
    outputDir: string,
    sizes: { width: number; suffix: string }[],
    options: ImageOptimizationOptions = {},
  ): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];

    for (const size of sizes) {
      const outputPath = path.join(
        outputDir,
        `${path.parse(inputPath).name}${size.suffix}.${options.format || 'webp'}`
      );

      const result = await this.optimizeImage(inputPath, outputPath, {
        ...options,
        width: size.width,
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Create image thumbnail
   */
  async createThumbnail(
    inputPath: string,
    outputPath: string,
    width: number = 300,
    height: number = 300,
    options: ImageOptimizationOptions = {},
  ): Promise<OptimizationResult> {
    return this.optimizeImage(inputPath, outputPath, {
      ...options,
      width,
      height,
      quality: options.quality || 75,
    });
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(filePath: string): Promise<ImageMetadata> {
    try {
      const metadata = await sharp(filePath).metadata();
      const stats = fs.statSync(filePath);

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: stats.size,
        channels: metadata.channels || 0,
        density: metadata.density,
      };
    } catch (error) {
      this.logger.error(`Failed to get image metadata for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Apply format-specific optimizations
   */
  private applyFormatOptimizations(
    sharpInstance: sharp.Sharp,
    options: ImageOptimizationOptions,
  ): sharp.Sharp {
    switch (options.format) {
      case 'jpeg':
        return sharpInstance.jpeg({
          quality: options.quality,
          progressive: options.progressive,
          mozjpeg: true,
        });

      case 'png':
        return sharpInstance.png({
          quality: options.quality,
          progressive: options.progressive,
          compressionLevel: 9,
        });

      case 'webp':
        return sharpInstance.webp({
          quality: options.quality,
          lossless: options.lossless,
          effort: 6,
        });

      case 'avif':
        return sharpInstance.avif({
          quality: options.quality,
          lossless: options.lossless,
          effort: 4,
        });

      default:
        return sharpInstance;
    }
  }

  /**
   * Apply additional optimizations
   */
  private applyAdditionalOptimizations(
    sharpInstance: sharp.Sharp,
    options: ImageOptimizationOptions,
  ): sharp.Sharp {
    // Apply sharpening for better quality
    sharpInstance = sharpInstance.sharpen(1.0, 1.0, 2.0);

    // Apply noise reduction
    sharpInstance = sharpInstance.median(3);

    // Convert to sRGB color space
    sharpInstance = sharpInstance.toColorspace('srgb');

    return sharpInstance;
  }

  /**
   * Validate image file
   */
  async validateImage(filePath: string): Promise<{
    isValid: boolean;
    format?: string;
    error?: string;
  }> {
    try {
      const metadata = await this.getImageMetadata(filePath);
      
      // Check if it's a supported format
      const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp', 'tiff'];
      if (!supportedFormats.includes(metadata.format.toLowerCase())) {
        return {
          isValid: false,
          error: `Unsupported image format: ${metadata.format}`,
        };
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (metadata.size > maxSize) {
        return {
          isValid: false,
          error: `Image too large: ${metadata.size} bytes (max: ${maxSize} bytes)`,
        };
      }

      return {
        isValid: true,
        format: metadata.format,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Get optimal format for client
   */
  getOptimalFormat(acceptHeader: string): 'jpeg' | 'png' | 'webp' | 'avif' {
    // Check for modern formats first
    if (acceptHeader.includes('image/avif')) {
      return 'avif';
    }
    if (acceptHeader.includes('image/webp')) {
      return 'webp';
    }
    
    // Fallback to JPEG for maximum compatibility
    return 'jpeg';
  }

  /**
   * Generate image hash for caching
   */
  async generateImageHash(filePath: string): Promise<string> {
    try {
      const metadata = await this.getImageMetadata(filePath);
      const stats = fs.statSync(filePath);
      
      // Create hash from file properties
      const hashInput = `${metadata.width}x${metadata.height}-${metadata.format}-${stats.size}-${stats.mtime.getTime()}`;
      
      // Simple hash function (in production, use crypto.createHash)
      let hash = 0;
      for (let i = 0; i < hashInput.length; i++) {
        const char = hashInput.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return Math.abs(hash).toString(36);
    } catch (error) {
      this.logger.error(`Failed to generate image hash for ${filePath}:`, error);
      return Date.now().toString(36);
    }
  }

  /**
   * Clean up old optimized images
   */
  async cleanupOldImages(directory: string, maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    let deletedCount = 0;
    
    try {
      const files = fs.readdirSync(directory);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
      
      this.logger.log(`Cleaned up ${deletedCount} old images from ${directory}`);
    } catch (error) {
      this.logger.error(`Failed to cleanup old images from ${directory}:`, error);
    }
    
    return deletedCount;
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): {
    enabled: boolean;
    supportedFormats: string[];
    defaultQuality: number;
    defaultFormat: string;
  } {
    return {
      enabled: this.configService.get<string>('IMAGE_OPTIMIZATION_ENABLED') !== 'false',
      supportedFormats: ['jpeg', 'png', 'webp', 'avif'],
      defaultQuality: this.defaultOptions.quality!,
      defaultFormat: this.defaultOptions.format!,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test Sharp functionality
      const testBuffer = Buffer.from('test');
      await sharp(testBuffer).png().toBuffer();
      return true;
    } catch (error) {
      this.logger.error('Image optimization health check failed:', error);
      return false;
    }
  }
}
