import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { PointsMallItem } from './points-mall-item.entity';
import { ExchangeRecord } from './exchange-record.entity';
import { CreateExchangeDto } from './dto/create-exchange.dto';

@Injectable()
export class PointsService implements OnModuleInit {
  constructor(
    @InjectRepository(PointsMallItem)
    private readonly itemsRepo: Repository<PointsMallItem>,
    @InjectRepository(ExchangeRecord)
    private readonly recordsRepo: Repository<ExchangeRecord>,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    const count = await this.itemsRepo.count();
    if (count === 0) {
      const seed: Partial<PointsMallItem>[] = [
        { name: '小米无线鼠标', type: 'physical', description: '轻便实用的无线鼠标', pointsRequired: 500, stock: 50 },
        { name: '星巴克咖啡券', type: 'physical', description: '星巴克饮品券', pointsRequired: 300, stock: 100 },
        { name: '视频网站会员月卡', type: 'virtual', description: '视频平台会员 1 个月', pointsRequired: 200, stock: 999 },
        { name: '10 元话费充值', type: 'virtual', description: '手机话费充值 10 元', pointsRequired: 100, stock: 999 },
      ];
      await this.itemsRepo.save(this.itemsRepo.create(seed));
    }
  }

  listItems(type?: string) {
    const where: any = {};
    if (type)
      where.type = type;
    return this.itemsRepo.find({ where });
  }

  listRecords(userId: number) {
    return this.recordsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async createExchange(dto: CreateExchangeDto) {
    const user = await this.usersService.findById(dto.userId);
    if (!user)
      throw new Error('用户不存在');

    const item = await this.itemsRepo.findOne({ where: { id: dto.itemId } });
    if (!item)
      throw new Error('积分商品不存在');

    const totalPoints = item.pointsRequired * dto.quantity;
    if (user.points < totalPoints)
      throw new Error('积分不足');

    user.points -= totalPoints;
    await this.usersService.addPoints(user.id, -totalPoints);

    if (item.type === 'physical') {
      if (item.stock < dto.quantity)
        throw new Error('库存不足');
      item.stock -= dto.quantity;
      await this.itemsRepo.save(item);
    }

    const record = this.recordsRepo.create({
      userId: dto.userId,
      itemId: dto.itemId,
      quantity: dto.quantity,
      pointsSpent: totalPoints,
      addressSnapshot: dto.addressSnapshot ?? null,
      kind: item.type,
      status: item.type === 'physical' ? 'pending_shipment' : 'completed',
      code: item.type === 'virtual' ? `C${Date.now().toString(36).toUpperCase()}` : null,
    });
    return this.recordsRepo.save(record);
  }
}

