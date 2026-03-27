import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { ContractService } from '../contract/contract.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './order.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    // 使用名为 'mysql' 的连接中的 OrderRepository
    @InjectRepository(Order, 'mysql')
    private readonly ordersRepo: Repository<Order>,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
    private readonly contractService: ContractService,
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
    const lineItems = [
      {
        index: 1,
        name: String(product.name ?? '').trim() || '—',
        desc: String(product.brief ?? '').trim() || '—',
        customer: String((product as any)?.customer ?? '').trim() || '',
        quantity: Math.max(1, Number(dto.quantity || 1)),
        unitPrice: Number(unitPrice || 0),
        lineTotal: Number(amount || 0),
      },
    ];

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
      lineItemsJson: lineItems as any,
      status: 'pending_contract',
      createtime: Math.floor(Date.now() / 1000),
    });
    const saved = await this.ordersRepo.save(entity);

    // 扣减库存（简单演示，未加事务控制）
    if (typeof product.inventory === 'number') {
      product.inventory -= dto.quantity;
      if (product.inventory <= 0)
        product.inventory = 0;
      await (this.productsService as any).productsRepo.save(product);
    }

    await this.tryGenerateContractAfterCreate(saved.id);

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
    lineItemsJson?: any;
    amount: number;
    discountAmount: number;
    payAmount: number;
    status: string;
  }) {
    const user = await this.usersService.findById(params.userId);
    const companyId = params.companyId ?? user?.companyId ?? null;
    const orderNo = await this.generateOrderNo();

    // 合并单“客户”展示：优先聚合明细内的 customer，否则取首个产品 customer
    let productCustomer = '';
    const raw = params.lineItemsJson;
    if (Array.isArray(raw) && raw.length) {
      const set = new Set<string>();
      for (const it of raw) {
        const c = String(it?.customer ?? '').trim();
        if (c)
          set.add(c);
      }
      if (set.size)
        productCustomer = Array.from(set).join('、');
    }
    if (!productCustomer && params.firstProductId) {
      const firstProduct = await this.productsService.findById(params.firstProductId);
      if (firstProduct?.customer)
        productCustomer = String(firstProduct.customer).trim();
    }

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
      productCustomer,
      unitPrice: 0,
      customerName: user?.name ?? '',
      customerPhone: user?.phone ?? '',
      customerCompany: '',
      quantity: 1,
      amount: params.amount,
      discountAmount: params.discountAmount,
      payAmount: params.payAmount,
      lineItemsJson: params.lineItemsJson ?? null,
      status: params.status,
      createtime: Math.floor(Date.now() / 1000),
    });
    const saved = await this.ordersRepo.save(entity);
    await this.tryGenerateContractAfterCreate(saved.id);
    return saved;
  }

  /**
   * 订单创建成功后生成 PDF 合同（等待完成后再返回，便于前端立刻展示）；失败不影响订单本身，仅打日志
   */
  private async tryGenerateContractAfterCreate(orderId: number): Promise<void> {
    try {
      await this.contractService.generateContract(orderId);
    }
    catch (e: any) {
      this.logger.warn(`订单 ${orderId} 合同自动生成失败: ${e?.message || e}`);
    }
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

    let list: Order[] = [];
    try {
      list = await this.ordersRepo.find({
        where,
        // MySQL 中使用 int 类型的 createtime 记录下单时间，这里按 createtime 倒序
        order: { createtime: 'DESC' },
      });
    }
    catch (e: any) {
      // 兼容数据库尚未执行升级 SQL（fa_order 缺少 line_items_json）时的查询
      const msg = String(e?.message || e || '');
      if (msg.includes('Unknown column') && msg.includes('line_items_json')) {
        const qb = this.ordersRepo
          .createQueryBuilder('o')
          .select([
            'o.id',
            'o.orderNo',
            'o.userId',
            'o.salesName',
            'o.salesPhone',
            'o.companyId',
            'o.productId',
            'o.productName',
            'o.productBrief',
            'o.productDetail',
            'o.productCustomer',
            'o.unitPrice',
            'o.customerName',
            'o.customerPhone',
            'o.customerCompany',
            'o.whitehatId',
            'o.whitehatName',
            'o.whitehatPhone',
            'o.quantity',
            'o.amount',
            'o.discountAmount',
            'o.payAmount',
            'o.status',
            'o.contractStatus',
            'o.contractUrl',
            'o.createtime',
          ])
          .where('o.userId = :userId AND o.companyId = :companyId', { userId, companyId: user.companyId })
          .orderBy('o.createtime', 'DESC');
        if (status)
          qb.andWhere('o.status = :status', { status });
        list = await qb.getMany();
      }
      else {
        throw e;
      }
    }

    // 为前端提供产品是否已售罄的标记（一次性批量查询产品，避免 N+1）
    const ids = Array.from(new Set(list.map(o => Number((o as any).productId || 0)).filter(n => n > 0)));
    const products = await this.productsService.findByIds(ids);
    const map = new Map<number, any>();
    for (const p of products) {
      const inv = (p as any)?.inventory;
      const soldOut = typeof inv === 'number' ? inv <= 0 : false;
      map.set(Number((p as any).id), { soldOut });
    }
    return list.map((order) => {
      const pid = Number((order as any).productId || 0);
      const info = map.get(pid);
      // 合并单/异常 productId：无法定位产品时不做售罄限制（避免误判全部售罄）
      const productSoldOut = pid > 0 ? (info ? Boolean(info.soldOut) : true) : false;
      return { ...order, productSoldOut } as any;
    });
  }

  async findById(id: number) {
    try {
      return await this.ordersRepo.findOne({ where: { id } });
    }
    catch (e: any) {
      const msg = String(e?.message || e || '');
      if (msg.includes('Unknown column') && msg.includes('line_items_json')) {
        return await this.ordersRepo
          .createQueryBuilder('o')
          .select([
            'o.id',
            'o.orderNo',
            'o.userId',
            'o.salesName',
            'o.salesPhone',
            'o.companyId',
            'o.productId',
            'o.productName',
            'o.productBrief',
            'o.productDetail',
            'o.productCustomer',
            'o.unitPrice',
            'o.customerName',
            'o.customerPhone',
            'o.customerCompany',
            'o.whitehatId',
            'o.whitehatName',
            'o.whitehatPhone',
            'o.quantity',
            'o.amount',
            'o.discountAmount',
            'o.payAmount',
            'o.status',
            'o.contractStatus',
            'o.contractUrl',
            'o.createtime',
          ])
          .where('o.id = :id', { id })
          .getOne();
      }
      throw e;
    }
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

