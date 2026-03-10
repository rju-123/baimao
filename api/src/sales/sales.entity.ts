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

  @Column({ type: 'int', unsigned: true, nullable: true })
  createtime: number | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  updatetime: number | null;
}
