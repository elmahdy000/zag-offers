import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { join } from 'path';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';

@Injectable()
export class UploadService {
  async processImage(file: Express.Multer.File): Promise<string> {
    const uploadDir = './uploads';

    // التأكد من وجود المجلد
    if (!fsSync.existsSync(uploadDir)) {
      fsSync.mkdirSync(uploadDir, { recursive: true });
    }

    const nameWithoutExt = file.originalname.split('.').slice(0, -1).join('.') || 'upload';
    const filename = `${Date.now()}-${nameWithoutExt}.webp`;
    const path = join(uploadDir, filename);

    await sharp(file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path);

    return filename;
  }

  async deleteImage(filename: string): Promise<void> {
    if (!filename) return;
    
    // إزالة السوابق إذا وجدت (مثل /uploads/)
    const pureFilename = filename.split('/').pop();
    if (!pureFilename) return;

    const path = join('./uploads', pureFilename);
    try {
      await fs.unlink(path);
    } catch (e) {
      console.error(`Failed to delete image: ${path}`, e);
    }
  }
}
