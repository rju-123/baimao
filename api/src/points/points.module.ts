import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { PointsMallItem } from './points-mall-item.entity';
import { ExchangeRecord } from './exchange-record.entity';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PointsMallItem, ExchangeRecord]), UsersModule],
  providers: [PointsService],
  controllers: [PointsController],
})
export class PointsModule {}

