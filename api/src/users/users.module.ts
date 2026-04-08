import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SalesModule } from '../sales/sales.module';
import { CompaniesModule } from '../companies/companies.module';
import { WechatService } from '../wechat/wechat.service';

@Module({
  imports: [TypeOrmModule.forFeature([User], 'mysql'), SalesModule, CompaniesModule],
  providers: [UsersService, WechatService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

