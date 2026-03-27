import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('fa_coupons')
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unsigned: true })
  companyId: number;

  @Column({ type: 'int', unsigned: true })
  templateId: number;

  /**
   * 分配用户，null=公司池中未分配（共享）
   */
  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null;

  @Column()
  name: string;

  /**
   * 满减(amount) / 折扣(discount) / 直减(direct)
   */
  @Column({ length: 32 })
  type: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minAmount: number;

  @Column({ type: 'datetime' })
  validFrom: Date;

  @Column({ type: 'datetime' })
  validTo: Date;

  /**
   * available / locked / used / expired
   */
  @Column({ length: 32, default: 'available' })
  status: string;

  @Column({ type: 'int', unsigned: true, nullable: true })
  lockedByUserId: number | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  lockedForProductId: number | null;

  @Column({ type: 'datetime', nullable: true })
  lockedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
