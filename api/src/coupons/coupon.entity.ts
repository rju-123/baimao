import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  name: string;

  /**
   * 满减 / 折扣 / 直减
   */
  @Column()
  type: string;

  /**
   * 面额或折扣，例如 100 元或 0.9（9 折）
   */
  @Column({ type: 'real' })
  value: number;

  @Column({ type: 'real', default: 0 })
  minAmount: number;

  @Column({ type: 'datetime' })
  validFrom: Date;

  @Column({ type: 'datetime' })
  validTo: Date;

  /**
   * available / locked / used / expired
   */
  @Column({ default: 'available' })
  status: string;

  /**
   * 锁定信息：加入购物车时占用优惠券，避免被重复使用
   */
  @Column({ type: 'int', nullable: true })
  lockedByUserId: number | null;

  @Column({ type: 'int', nullable: true })
  lockedForProductId: number | null;

  @Column({ type: 'datetime', nullable: true })
  lockedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}

