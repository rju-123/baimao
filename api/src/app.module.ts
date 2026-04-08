import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { AddressesModule } from './addresses/addresses.module';
import { CouponsModule } from './coupons/coupons.module';
import { PointsModule } from './points/points.module';
import { User } from './users/user.entity';
import { Company } from './companies/company.entity';
import { Product } from './products/product.entity';
import { Order } from './orders/order.entity';
import { Address } from './addresses/address.entity';
import { Coupon } from './coupons/coupon.entity';
import { CouponTemplate } from './coupons/coupon-template.entity';
import { PointsMallItem } from './points/points-mall-item.entity';
import { ExchangeRecord } from './points/exchange-record.entity';
import { PointsCode } from './points/points-code.entity';
import { KnowledgeArticle } from './knowledge/knowledge.entity';
import { PartnerModule } from './partner/partner.module';
import { Sales } from './sales/sales.entity';
import { SalesModule } from './sales/sales.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { EsignModule } from './esign/esign.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // 第二个连接：连接到后台管理系统使用的 MySQL，专门用于产品、订单、公司、销售与积分商城
    TypeOrmModule.forRoot({
      name: 'mysql',
      type: 'mysql',
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USERNAME ?? 'baimaoadmin',
      password: process.env.DB_PASSWORD ?? 'baimaoadmin',
      // MySQL 实际库名以 FastAdmin 导入/配置为准
      database: process.env.DB_DATABASE ?? 'baimao_admin',
      entities: [
        // User/Address 也切到 mysql，避免依赖 sqlite 默认连接
        User,
        Address,
        Product,
        Order,
        Company,
        Sales,
        PointsMallItem,
        ExchangeRecord,
        PointsCode,
        KnowledgeArticle,
        Coupon,
        CouponTemplate,
      ],
      synchronize: false,
    }),
    UsersModule,
    CompaniesModule,
    ProductsModule,
    OrdersModule,
    AddressesModule,
    CouponsModule,
    PointsModule,
    PartnerModule,
    SalesModule,
    KnowledgeModule,
    EsignModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
