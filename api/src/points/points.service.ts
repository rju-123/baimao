import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { PointsMallItem } from './points-mall-item.entity';
import { ExchangeRecord } from './exchange-record.entity';
import { PointsCode } from './points-code.entity';
import { CreateExchangeDto } from './dto/create-exchange.dto';

@Injectable()
export class PointsService implements OnModuleInit {
  constructor(
    @InjectRepository(PointsMallItem, 'mysql')
    private readonly itemsRepo: Repository<PointsMallItem>,
    @InjectRepository(ExchangeRecord, 'mysql')
    private readonly recordsRepo: Repository<ExchangeRecord>,
    @InjectRepository(PointsCode, 'mysql')
    private readonly codesRepo: Repository<PointsCode>,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    // 若积分商城商品表为空，填充一批默认示例数据（仅在首次初始化时执行）
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

  getItem(id: number) {
    return this.itemsRepo.findOne({ where: { id } });
  }

  listRecords(userId: number) {
    return this.recordsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  getRecord(id: number) {
    return this.recordsRepo.findOne({ where: { id } });
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

    let assignedCode: string | null = null;
    let usedCode: PointsCode | null = null;
    if (item.type === 'virtual') {
      if (item.stock < dto.quantity)
        throw new Error('库存不足');
      // 从券码池中取出一条未使用券码
      usedCode = await this.codesRepo.findOne({
        where: {
          itemId: item.id,
          status: 'unused',
        },
      });
      if (!usedCode)
        throw new Error('券码已用完，请联系管理员补充库存');
      assignedCode = usedCode.code;
      // 虚拟商品兑换成功后同步扣减库存，保证前后端库存展示一致
      item.stock -= dto.quantity;
      await this.itemsRepo.save(item);
    }

    const now = Math.floor(Date.now() / 1000);

    const record = this.recordsRepo.create({
      userId: dto.userId,
      itemId: dto.itemId,
      quantity: dto.quantity,
      pointsSpent: totalPoints,
      addressSnapshot: dto.addressSnapshot ?? null,
      kind: item.type,
      status: item.type === 'physical' ? 'pending_shipment' : 'completed',
      code: assignedCode,
    });
    const saved = await this.recordsRepo.save(record);

    // 标记券码已使用，并同步批次已使用数
    if (usedCode) {
      usedCode.status = 'used';
      usedCode.recordId = saved.id;
      usedCode.usedAt = now;
      await this.codesRepo.save(usedCode);

      // 同步更新批次表中的已使用数，便于后台列表展示
      if (usedCode.batchId) {
        await this.recordsRepo.query(
          'UPDATE fa_points_code_batches SET used = used + 1 WHERE id = ?',
          [usedCode.batchId],
        );
      }
    }

    return saved;
  }
}

