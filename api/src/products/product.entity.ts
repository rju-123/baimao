import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// 映射到后台管理系统的 MySQL 表 `fa_product`
@Entity('fa_product')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  /**
   * service / product
   */
  @Column()
  type: string;

  /**
   * 分类，例如：安全评估、安全测试、网络设备等
   */
  // 分类字段：为兼容前端和原有种子数据，从 MySQL 中的 category 列读取
  @Column({ name: 'category', type: 'varchar', nullable: true })
  category?: string | null;

  /** 后台创建产品时填写的客户（展示在订单列表“客户”一栏） */
  @Column({ name: 'customer', type: 'varchar', length: 255, default: '' })
  customer: string;

  @Column({ type: 'text' })
  brief: string;

  @Column({ type: 'text' })
  detail: string;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'discount_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountPrice: number | null;

  /**
   * active / expired / inactive
   */
  @Column({ default: 'active' })
  status: string;

  /**
   * 库存数量（可销售数量）
   */
  @Column({ type: 'int', default: 0 })
  inventory: number;

  /**
   * 预计交付日期（yyyy-MM-dd），用于在前端展示“交付时间”
   */
  @Column({ name: 'delivery_time', type: 'varchar', nullable: true })
  deliveryTime: string | null;
}

