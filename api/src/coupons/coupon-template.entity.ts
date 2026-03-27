import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('fa_coupon_templates')
export class CouponTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 32, unique: true })
  code: string;

  @Column()
  name: string;

  /**
   * amount=满减 / discount=折扣 / direct=直减
   */
  @Column({ length: 32, default: 'amount' })
  type: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minAmount: number;

  @Column({ type: 'datetime' })
  validFrom: Date;

  @Column({ type: 'datetime' })
  validTo: Date;

  @Column({ type: 'int', default: 0 })
  totalQuantity: number;

  /**
   * not_started / in_progress / ended
   */
  @Column({ length: 32, default: 'not_started' })
  status: string;

  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  createtime: number | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  updatetime: number | null;
}
