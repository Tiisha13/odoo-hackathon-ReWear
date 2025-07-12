import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env';

export class FileUploader {
  private static ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  static createAvatarUpload() {
    const uploadPath = path.join(config.upload.path, 'avatars');
    this.ensureDirectoryExists(uploadPath);

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    });

    return multer({
      storage,
      limits: {
        fileSize: config.upload.maxFileSize,
      },
      fileFilter: (req, file, cb) => {
        if (config.upload.allowedFormats.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
        }
      }
    });
  }

  static createItemImageUpload() {
    const uploadPath = path.join(config.upload.path, 'items');
    this.ensureDirectoryExists(uploadPath);

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `item-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    });

    return multer({
      storage,
      limits: {
        fileSize: config.upload.maxFileSize,
      },
      fileFilter: (req, file, cb) => {
        if (config.upload.allowedFormats.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
        }
      }
    });
  }

  static deleteFile(filePath: string): boolean {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}
