import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  // 使用名为 'mysql' 的连接，从后台管理系统的 MySQL 读取产品数据
  imports: [TypeOrmModule.forFeature([Product], 'mysql')],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}

