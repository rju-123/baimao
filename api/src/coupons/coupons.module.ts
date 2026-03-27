import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from './coupon.entity';
import { CouponTemplate } from './coupon-template.entity';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { UsersModule } from '../users/users.module';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coupon, CouponTemplate], 'mysql'),
    UsersModule,
    SalesModule,
  ],
  providers: [CouponsService],
  controllers: [CouponsController],
  exports: [CouponsService],
})
export class CouponsModule {}

