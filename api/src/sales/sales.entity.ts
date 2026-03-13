import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('fa_sales')
export class Sales {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 64, default: '' })
  name: string;

  @Column({ name: 'company_id', type: 'int', unsigned: true, nullable: true })
  companyId: number | null;

  /**
   * 是否管理员：1=管理员 0=普通
   * 映射 FastAdmin 中 fa_sales.is_admin 字段
   */
  @Column({ name: 'is_admin', type: 'tinyint', width: 1, unsigned: true, default: 0 })
  isAdmin: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  createtime: number | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  updatetime: number | null;
}
