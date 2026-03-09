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
import { PointsMallItem } from './points/points-mall-item.entity';
import { ExchangeRecord } from './points/exchange-record.entity';
import { PartnerInvoice } from './partner/partner-invoice.entity';
import { PartnerModule } from './partner/partner.module';

@Module({
  imports: [
    // 默认连接：继续使用 SQLite，给用户、公司、地址等模块使用
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'database.sqlite',
      entities: [User, Company, Address, Coupon, PointsMallItem, ExchangeRecord, PartnerInvoice],
      synchronize: true,
    }),
    // 第二个连接：连接到后台管理系统使用的 MySQL，专门用于产品和订单
    TypeOrmModule.forRoot({
      name: 'mysql',
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      username: 'root',
      password: 'admin123',
      database: 'baimao_admin',
      entities: [Product, Order],
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
