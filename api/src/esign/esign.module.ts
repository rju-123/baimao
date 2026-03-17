import { Module } from '@nestjs/common';
import { EsignController } from './esign.controller';
import { EsignService } from './esign.service';
import { OrdersModule } from '../orders/orders.module';
import { CouponsModule } from '../coupons/coupons.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [OrdersModule, CouponsModule, ProductsModule],
  controllers: [EsignController],
  providers: [EsignService],
})
export class EsignModule {}

