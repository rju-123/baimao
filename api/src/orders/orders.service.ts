import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './order.entity';

@Injectable()
export class OrdersService {
  constructor(
    // 使用名为 'mysql' 的连接中的 OrderRepository
    @InjectRepository(Order, 'mysql')
    private readonly ordersRepo: Repository<Order>,
    private readonly productsService: ProductsService,
  ) {}

  async create(dto: CreateOrderDto) {
    const product = await this.productsService.findById(dto.productId);
    if (!product)
      throw new Error('产品不存在');

    // 当前阶段：前端已限制购买数量且售罄产品不会出现在下单列表，
    // 因此这里不再因为库存不足而直接阻止下单，避免边界情况下订单无法生成。

    const unitPrice = product.discountPrice ?? product.price;
    const amount = unitPrice * dto.quantity;
    const discountAmount = dto.couponDiscount ?? 0;
    const payAmount = amount - discountAmount;

    const orderNo = await this.generateOrderNo();

    const entity = this.ordersRepo.create({
      orderNo,
      userId: dto.userId,
      companyId: dto.companyId ?? null,
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

  async findAllByUser(userId: number, status?: string) {
    const where: any = { userId };
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

