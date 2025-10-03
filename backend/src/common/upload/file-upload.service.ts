import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { PinoLoggerService } from '../logging/pino-logger.service';

export interface FileUploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  uploadPath: string;
}

export interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

@Injectable()
export class FileUploadService {
  private readonly config: FileUploadConfig;
  private readonly upload: multer.Multer;

  constructor(
    private configService: ConfigService,
    private logger: PinoLoggerService,
  ) {
    this.config = this.getUploadConfig();
    this.upload = this.createMulterInstance();
    this.ensureUploadDirectory();
  }

  getMulterInstance(): multer.Multer {
    return this.upload;
  }

  private getUploadConfig(): FileUploadConfig {
    return {
      maxFileSize: this.parseSize(this.configService.get<string>('MAX_FILE_SIZE', '10mb')),
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.xls', '.xlsx'],
      uploadPath: this.configService.get<string>('UPLOAD_PATH', './uploads'),
    };
  }

  private createMulterInstance(): multer.Multer {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.config.uploadPath);
      },
      filename: (req, file, cb) => {
        // Generate unique filename with timestamp and random string
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
      },
    });

    const fileFilter = (req: any, file: any, cb: multer.FileFilterCallback) => {
      try {
        // Check MIME type
        if (!this.config.allowedMimeTypes.includes(file.mimetype)) {
          this.logger.warn(
            {
              event: 'file_upload.rejected',
              reason: 'invalid_mime_type',
              mimetype: file.mimetype,
              originalname: file.originalname,
            },
            'File upload rejected due to invalid MIME type',
          );
          return cb(new BadRequestException('File type not allowed'), false);
        }

        // Check file extension
        const ext = path.extname(file.originalname).toLowerCase();
        if (!this.config.allowedExtensions.includes(ext)) {
          this.logger.warn(
            {
              event: 'file_upload.rejected',
              reason: 'invalid_extension',
              extension: ext,
              originalname: file.originalname,
            },
            'File upload rejected due to invalid extension',
          );
          return cb(new BadRequestException('File extension not allowed'), false);
        }

        // Check filename length
        if (file.originalname.length > 255) {
          this.logger.warn(
            {
              event: 'file_upload.rejected',
              reason: 'filename_too_long',
              originalname: file.originalname,
            },
            'File upload rejected due to filename too long',
          );
          return cb(new BadRequestException('Filename too long'), false);
        }

        this.logger.info(
          {
            event: 'file_upload.accepted',
            originalname: file.originalname,
            mimetype: file.mimetype,
          },
          'File upload accepted',
        );

        cb(null, true);
      } catch (error) {
        this.logger.error(
          {
            event: 'file_upload.error',
            error: error.message,
            originalname: file.originalname,
          },
          'File upload error',
        );
        cb(new BadRequestException('File validation error'), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.config.maxFileSize,
        files: parseInt(this.configService.get<string>('MAX_FILES_PER_REQUEST', '5')),
      },
    });
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      const mkdir = promisify(fs.mkdir);
      await mkdir(this.config.uploadPath, { recursive: true });
    } catch (error) {
      this.logger.error(
        {
          event: 'upload_directory.error',
          error: error.message,
          path: this.config.uploadPath,
        },
        'Failed to create upload directory',
      );
    }
  }

  private parseSize(sizeStr: string): number {
    const units: { [key: string]: number } = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
    };

    const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    if (!match) {
      throw new Error(`Invalid size format: ${sizeStr}`);
    }

    const [, value, unit = 'mb'] = match;
    return parseFloat(value) * units[unit];
  }

  async validateFile(file: any): Promise<UploadedFile> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Additional validation
    if (file.size > this.config.maxFileSize) {
      throw new BadRequestException('File too large');
    }

    return {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    };
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const unlink = promisify(fs.unlink);
      await unlink(filePath);
      this.logger.info(
        {
          event: 'file_deleted',
          path: filePath,
        },
        'File deleted successfully',
      );
    } catch (error) {
      this.logger.warn(
        {
          event: 'file_delete_failed',
          error: error.message,
          path: filePath,
        },
        'Failed to delete file',
      );
    }
  }
}
