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
   * available / used / expired
   */
  @Column({ default: 'available' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}

