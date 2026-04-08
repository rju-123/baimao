import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './company.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Sales } from '../sales/sales.entity';
import { Order } from '../orders/order.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    // MySQL 连接：公司 / 销售 / 订单
    TypeOrmModule.forFeature([Company, Sales, Order], 'mysql'),
    // 用户表也切到 mysql，避免依赖 sqlite 默认连接
    TypeOrmModule.forFeature([User], 'mysql'),
  ],
  providers: [CompaniesService],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}

