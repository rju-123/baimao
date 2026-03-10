import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('fa_company')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'credit_code', type: 'varchar', length: 64, default: '' })
  creditCode: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  address: string;

  @Column({ name: 'contact_name', type: 'varchar', length: 64, default: '' })
  contactName: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 32, default: '' })
  contactPhone: string;

  @Column({ type: 'int', unsigned: true, nullable: true })
  createtime: number | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  updatetime: number | null;
}
