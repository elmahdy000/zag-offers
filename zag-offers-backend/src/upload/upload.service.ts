import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { join } from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class UploadService {
  async processImage(file: Express.Multer.File): Promise<string> {
    const uploadDir = './uploads';

    // التأكد من وجود المجلد
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir);
    }

    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const outputPath = join(uploadDir, filename);

    await sharp(file.buffer)
      .resize(800) // عرض 800 بكسل كافٍ جداً للموبايل
      .webp({ quality: 80 }) // تحويل لـ WebP مع جودة 80% (توازن ممتاز بين الحجم والجودة)
      .toFile(outputPath);

    return filename;
  }
}
