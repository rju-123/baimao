import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 禁用 ETag，避免小程序端出现 304 导致拿不到响应体
  const expressApp: any = app.getHttpAdapter().getInstance();
  if (expressApp?.set) {
    expressApp.set('etag', false);
  }

  // API 统一关闭缓存，确保每次请求都有响应体
  app.use((_req: any, res: any, next: any) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // 提供 uploads 目录的静态文件访问，用于展示上传的图片（如开票资料）
  const uploadsPath = join(process.cwd(), 'uploads');
  if (existsSync(uploadsPath)) {
    app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });
  }
  app.enableCors({
    origin: true,
    credentials: true,
  });
  const port = process.env.PORT ?? 3000;
  // 监听 0.0.0.0 确保微信小程序模拟器等可访问
  await app.listen(port, '0.0.0.0');
  console.log(`API 服务已启动: http://127.0.0.1:${port}`);
}
bootstrap();
