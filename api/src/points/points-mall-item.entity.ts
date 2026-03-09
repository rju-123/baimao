import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('points_mall_items')
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

  @Column({ type: 'integer' })
  pointsRequired: number;

  @Column({ type: 'integer', default: 0 })
  stock: number;
}

