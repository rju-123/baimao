import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// 映射到后台管理系统的 MySQL 表 `fa_points_mall_items`
@Entity('fa_points_mall_items')
export class PointsMallItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  /**
   * physical / virtual
   */
  @Column()
  type: string;

  @Column()
  description: string;

  @Column({ default: '' })
  image: string;

  @Column({ type: 'integer' })
  pointsRequired: number;

  @Column({ type: 'integer', default: 0 })
  stock: number;
}

