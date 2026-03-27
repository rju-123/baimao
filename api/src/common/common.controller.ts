import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Request } from 'express';

const UPLOAD_DIR = 'uploads';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

const imageFilter = (
  _req: Request,
  file: MulterFile,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('仅支持 jpg/png 格式'), false);
  }
};

@Controller('common')
export class CommonController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOAD_DIR)) {
            mkdirSync(UPLOAD_DIR, { recursive: true });
          }
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname) || '.jpg';
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: imageFilter,
    }),
  )
  upload(
    @UploadedFile() file: MulterFile,
    @Req() req: Request,
  ): { code: number; message: string; result: { url: string; path: string } } {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }
    const path = `${UPLOAD_DIR}/${file.filename}`;
    const protocol = (req.headers['x-forwarded-proto'] as string)?.split(',')[0] || req.protocol || 'http';
    const host = req.headers.host || 'localhost:3000';
    const url = `${protocol}://${host}/${path}`;
    return {
      code: 200,
      message: 'OK',
      result: { url, path },
    };
  }
}
