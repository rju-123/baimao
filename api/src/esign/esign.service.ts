import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CouponsService } from '../coupons/coupons.service';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';

interface CartItemPayload {
  productId: number;
  productName?: string;
  unitPrice?: number;
  quantity: number;
  couponId?: number | null;
  couponType?: string;
  couponValue?: number;
  couponMinAmount?: number;
}

interface CreateFlowPayload {
  userId: number;
  companyId?: number;
  items: CartItemPayload[];
}

function calcItemAmount(unitPrice: number, qty: number) {
  return Math.max(0, Number(unitPrice || 0)) * Math.max(1, Number(qty || 1));
}

function calcItemDiscount(amount: number, it: CartItemPayload) {
  if (!it.couponId)
    return 0;
  const min = Number(it.couponMinAmount || 0);
  if (amount < min)
    return 0;
  const t = it.couponType || 'amount';
  const v = Number(it.couponValue || 0);
  if (t === 'discount')
    return Math.max(0, Math.round(amount * (1 - v)));
  return Math.max(0, Math.min(amount, v));
}

@Injectable()
export class EsignService {
  private flows = new Map<string, { payload: CreateFlowPayload; createdAt: number }>();

  constructor(
    private readonly ordersService: OrdersService,
    private readonly couponsService: CouponsService,
    private readonly productsService: ProductsService,
  ) {}

  async createFlow(payload: CreateFlowPayload) {
    const flowId = randomUUID();
    const cleanItems = Array.isArray(payload.items) ? payload.items : [];
    if (!cleanItems.length)
      throw new Error('购物车为空');

    // 校验并预处理：仅允许数量 >= 1
    const normalized = cleanItems.map((it) => ({
      ...it,
      productId: Number(it.productId || 0),
      quantity: Math.max(1, Number(it.quantity || 1)),
      couponId: it.couponId != null ? Number(it.couponId) : null,
    }));

    // 校验产品存在
    for (const it of normalized) {
      const p = await this.productsService.findById(it.productId);
      if (!p)
        throw new Error(`产品不存在：${it.productId}`);
    }

    this.flows.set(flowId, {
      payload: { userId: payload.userId, companyId: payload.companyId, items: normalized },
      createdAt: Date.now(),
    });

    return { flowId };
  }

  async getFlow(flowId: string) {
    const flow = this.flows.get(flowId);
    if (!flow)
      throw new Error('签署流程不存在或已过期');
    const items = flow.payload.items;
    let totalAmount = 0;
    let totalDiscount = 0;
    for (const it of items) {
      const product = await this.productsService.findById(it.productId);
      if (!product)
        throw new Error(`产品不存在：${it.productId}`);
      const unit = product.discountPrice ?? product.price;
      const amount = calcItemAmount(unit, it.quantity);
      const discount = calcItemDiscount(amount, it);
      totalAmount += amount;
      totalDiscount += discount;
    }
    return {
      flowId,
      createdAt: flow.createdAt,
      payload: flow.payload,
      pricing: {
        amount: totalAmount,
        discountAmount: totalDiscount,
        payAmount: Math.max(0, totalAmount - totalDiscount),
      },
    };
  }

  async completeFlow(flowId: string): Promise<number> {
    const flow = this.flows.get(flowId);
    if (!flow)
      throw new Error('签署流程不存在或已过期');

    const { userId, companyId, items } = flow.payload;

    // 计算金额与汇总字段
    const parts: string[] = [];
    let totalAmount = 0;
    let totalDiscount = 0;

    for (const it of items) {
      const product = await this.productsService.findById(it.productId);
      if (!product)
        throw new Error(`产品不存在：${it.productId}`);
      const unit = product.discountPrice ?? product.price;
      const amount = unit * it.quantity;
      totalAmount += amount;

      // 优惠券折扣（仅简单演示：amount/discount 两种）
      let discount = 0;
      if (it.couponId) {
        const min = Number(it.couponMinAmount || 0);
        if (amount >= min) {
          const t = it.couponType || 'amount';
          const v = Number(it.couponValue || 0);
          if (t === 'discount')
            discount = Math.round(amount * (1 - v));
          else
            discount = Math.min(amount, v);
        }
      }
      totalDiscount += discount;
      parts.push(`${product.name}x${it.quantity}`);
    }

    const itemsSummary = parts.join('，');
    const payAmount = Math.max(0, totalAmount - totalDiscount);

    // 将优惠券标记为已使用（演示：不做强一致性事务）
    for (const it of items) {
      if (it.couponId) {
        await this.couponsService.markUsed(it.couponId);
      }
    }

    // 创建合并订单（复用 Order 表结构：productName 存汇总，productId 取第一个商品）
    const firstProductId = items[0]?.productId || 0;
    const order = await this.ordersService.createMerged({
      userId,
      companyId,
      firstProductId,
      itemsSummary,
      amount: totalAmount,
      discountAmount: totalDiscount,
      payAmount,
      status: 'signing',
    });

    // 扣减库存（按每个商品）
    for (const it of items) {
      await this.productsService.decreaseInventory(it.productId, it.quantity);
    }

    // 订单创建后，清理 flow
    this.flows.delete(flowId);
    return order.id;
  }
}

