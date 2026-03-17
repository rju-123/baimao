import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './order.entity';

@Injectable()
export class OrdersService {
  constructor(
    // 使用名为 'mysql' 的连接中的 OrderRepository
    @InjectRepository(Order, 'mysql')
    private readonly ordersRepo: Repository<Order>,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateOrderDto) {
    const product = await this.productsService.findById(dto.productId);
    if (!product)
      throw new Error('产品不存在');
    const user = await this.usersService.findById(dto.userId);

    // 当前阶段：前端已限制购买数量且售罄产品不会出现在下单列表，
    // 因此这里不再因为库存不足而直接阻止下单，避免边界情况下订单无法生成。

    const unitPrice = product.discountPrice ?? product.price;
    const amount = unitPrice * dto.quantity;
    const discountAmount = dto.couponDiscount ?? 0;
    const payAmount = amount - discountAmount;

    // 订单所属公司：优先使用传入的 companyId，否则回退为当前用户的 companyId
    const companyId = dto.companyId ?? user?.companyId ?? null;

    const orderNo = await this.generateOrderNo();

    const entity = this.ordersRepo.create({
      orderNo,
      userId: dto.userId,
      salesName: user?.name ?? '',
      salesPhone: user?.phone ?? '',
      companyId,
      productId: dto.productId,
      productName: product.name,
      productBrief: product.brief,
      productDetail: product.detail,
      productCustomer: product.customer ?? '',
      unitPrice,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerCompany: dto.customerCompany,
      quantity: dto.quantity,
      amount,
      discountAmount,
      payAmount,
      status: 'pending_contract',
      createtime: Math.floor(Date.now() / 1000),
    });
    const saved = await this.ordersRepo.save(entity);

    // 扣减库存（简单演示，未加事务控制）
    if (typeof product.inventory === 'number') {
      product.inventory -= dto.quantity;
      if (product.inventory <= 0) {
        // 库存用尽时，将库存置 0 并标记为已下架，但保留产品记录，
        // 以保证历史订单详情仍然可以展示完整的产品信息
        product.inventory = 0;
        (product as any).status = 'expired';
        await (this.productsService as any).productsRepo.save(product);
      }
      else {
        await (this.productsService as any).productsRepo.save(product);
      }
    }

    return saved;
  }

  /**
   * 创建合并订单：复用现有订单表结构，使用 productName 存储多商品汇总信息
   * 注意：这是为“购物车一次下单”提供的最小可用实现
   */
  async createMerged(params: {
    userId: number;
    companyId?: number;
    firstProductId: number;
    itemsSummary: string;
    amount: number;
    discountAmount: number;
    payAmount: number;
    status: string;
  }) {
    const user = await this.usersService.findById(params.userId);
    const companyId = params.companyId ?? user?.companyId ?? null;
    const orderNo = await this.generateOrderNo();

    const entity = this.ordersRepo.create({
      orderNo,
      userId: params.userId,
      salesName: user?.name ?? '',
      salesPhone: user?.phone ?? '',
      companyId,
      productId: params.firstProductId || 0,
      productName: params.itemsSummary,
      productBrief: '',
      productDetail: '',
      productCustomer: '',
      unitPrice: 0,
      customerName: user?.name ?? '',
      customerPhone: user?.phone ?? '',
      customerCompany: '',
      quantity: 1,
      amount: params.amount,
      discountAmount: params.discountAmount,
      payAmount: params.payAmount,
      status: params.status,
      createtime: Math.floor(Date.now() / 1000),
    });
    return this.ordersRepo.save(entity);
  }

  async findAllByUser(userId: number, status?: string) {
    // 先根据 userId 获取当前用户的最新公司信息
    const user = await this.usersService.findById(userId);
    // 没有用户或尚未选择公司时，不返回任何订单，引导其先选择公司
    if (!user || !user.companyId)
      return [];

    const where: any = {
      userId,
      companyId: user.companyId,
    };
    if (status)
      where.status = status;

    return this.ordersRepo.find({
      where,
      // MySQL 中使用 int 类型的 createtime 记录下单时间，这里按 createtime 倒序
      order: { createtime: 'DESC' },
    });
  }

  findById(id: number) {
    return this.ordersRepo.findOne({ where: { id } });
  }

  /**
   * 生成唯一订单号 ORD-{年}-{序号}，基于当年已有最大订单号递增，避免与历史/后台数据重复
   */
  private async generateOrderNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;
    const raw = await this.ordersRepo
      .createQueryBuilder('o')
      .select('MAX(o.orderNo)', 'maxNo')
      .where('o.orderNo LIKE :prefix', { prefix: `${prefix}%` })
      .getRawOne<{ maxNo: string | null }>();
    const maxNo = raw?.maxNo ?? null;
    let seq = 1;
    if (maxNo && typeof maxNo === 'string' && maxNo.startsWith(prefix)) {
      const numPart = maxNo.slice(prefix.length);
      const num = parseInt(numPart, 10);
      if (!Number.isNaN(num) && num >= 1)
        seq = num + 1;
    }
    const seqStr = String(seq).padStart(3, '0');
    return `${prefix}${seqStr}`;
  }
}

