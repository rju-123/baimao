import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('exchange_records')
export class ExchangeRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  itemId: number;

  @Column({ type: 'integer', default: 1 })
  quantity: number;

  @Column({ type: 'integer' })
  pointsSpent: number;

  /**
   * 实体商品收货地址（快照）
   */
  @Column({ type: 'text', nullable: true })
  addressSnapshot: string | null;

  /**
   * 兑换种类：physical / virtual
   */
  @Column()
  kind: string;

  /**
   * 发货状态：pending_shipment / shipped / received / completed
   * 虚拟商品统一为 completed
   */
  @Column({ default: 'completed' })
  status: string;

  /**
   * 虚拟商品券码（示意）
   */
  @Column({ type: 'text', nullable: true })
  code: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

