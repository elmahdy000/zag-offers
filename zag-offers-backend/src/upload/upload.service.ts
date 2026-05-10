import { Injectable, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { join } from 'path';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class UploadService {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB

  async processImage(file: Express.Multer.File): Promise<string> {
    // Validate file existence
    if (!file || !file.buffer) {
      throw new BadRequestException('الملف غير صحيح');
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException('حجم الملف يتجاوز الحد المسموح به (5MB)');
    }

    // Validate MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('نوع الملف غير مدعوم');
    }

    const uploadDir = './uploads';

    // التأكد من وجود المجلد
    if (!fsSync.existsSync(uploadDir)) {
      fsSync.mkdirSync(uploadDir, { recursive: true });
    }

    // Sanitize filename and add random hash for security
    const nameWithoutExt =
      file.originalname
        .split('.')
        .slice(0, -1)
        .join('')
        .replace(/[^a-zA-Z0-9]/g, '') || 'upload';
    const randomHash = crypto.randomBytes(8).toString('hex');
    const filename = `${Date.now()}-${randomHash}-${nameWithoutExt}.webp`;
    const path = join(uploadDir, filename);

    // Process image with security constraints
    await sharp(file.buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .webp({
        quality: 85,
        effort: 4,
      })
      .toFile(path);

    return filename;
  }

  async deleteImage(filename: string): Promise<void> {
    if (!filename) return;

    // إزالة السوابق إذا وجدت (مثل /uploads/)
    const pureFilename = filename.split('/').pop();
    if (!pureFilename) return;

    // Validate filename to prevent path traversal
    if (
      pureFilename.includes('..') ||
      pureFilename.includes('/') ||
      pureFilename.includes('\\')
    ) {
      return;
    }

    const path = join('./uploads', pureFilename);
    try {
      await fs.unlink(path);
    } catch (e) {
      console.error(`Failed to delete image: ${path}`, e);
    }
  }
}
