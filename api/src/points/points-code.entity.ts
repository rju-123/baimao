import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 虚拟商品券码明细（映射 fa_points_codes）
 */
@Entity('fa_points_codes')
export class PointsCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'batch_id', type: 'int', unsigned: true })
  batchId: number;

  @Column({ name: 'item_id', type: 'int', unsigned: true })
  itemId: number;

  @Column({ name: 'code', type: 'varchar', length: 255, unique: true })
  code: string;

  @Column({ name: 'expire_at', type: 'datetime', nullable: true })
  expireAt: Date | null;

  @Column({ name: 'remark', type: 'varchar', length: 255, default: '' })
  remark: string;

  /**
   * unused / used / disabled
   */
  @Column({ name: 'status', type: 'varchar', length: 16, default: 'unused' })
  status: string;

  @Column({ name: 'record_id', type: 'int', unsigned: true, default: 0 })
  recordId: number;

  @Column({ name: 'used_at', type: 'int', unsigned: true, nullable: true })
  usedAt: number | null;
}

