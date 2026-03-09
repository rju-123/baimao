import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// 映射到后台管理系统的 MySQL 表 `fa_order`
@Entity('fa_order')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_no', unique: true })
  orderNo: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'company_id', type: 'int', nullable: true })
  companyId: number | null;

  @Column({ name: 'product_id' })
  productId: number;

  /**
   * 下单时的产品名称快照，用于保证历史订单在产品下架/改名后仍能正确展示
   */
  @Column({ name: 'product_name', type: 'text' })
  productName: string;

  /**
   * 下单时的产品简介快照
   */
  @Column({ name: 'product_brief', type: 'text', default: '' })
  productBrief: string;

  /**
   * 下单时的产品详情快照
   */
  @Column({ name: 'product_detail', type: 'text', default: '' })
  productDetail: string;

  /** 产品客户（来自后台产品表的 customer 字段，用于订单列表“客户”展示） */
  @Column({ name: 'product_customer', type: 'varchar', length: 255, default: '' })
  productCustomer: string;

  /**
   * 下单时的产品单价快照
   */
  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ name: 'customer_name' })
  customerName: string;

  @Column({ name: 'customer_phone' })
  customerPhone: string;

  @Column({ name: 'customer_company' })
  customerCompany: string;

  /** 接单员ID（白帽子ID） */
  @Column({ name: 'whitehat_id', type: 'int', default: 0 })
  whitehatId: number;

  /** 接单员姓名（白帽子姓名快照） */
  @Column({ name: 'whitehat_name', type: 'varchar', length: 255, default: '' })
  whitehatName: string;

  /** 接单员电话（白帽子手机号快照） */
  @Column({ name: 'whitehat_phone', type: 'varchar', length: 50, default: '' })
  whitehatPhone: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'pay_amount', type: 'decimal', precision: 10, scale: 2 })
  payAmount: number;

  /**
   * pending_contract / pending_fulfillment / in_progress / completed / cancelled
   */
  @Column({ default: 'pending_contract' })
  status: string;

  @Column({ name: 'createtime', type: 'int', nullable: true })
  createtime: number | null;
}

