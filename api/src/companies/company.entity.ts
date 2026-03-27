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

  /** 销售人员姓名（合作伙伴提交时填写的“你的姓名”） */
  @Column({ name: 'sales_name', type: 'varchar', length: 64, default: '' })
  salesName: string;

  @Column({ type: 'int', unsigned: true, nullable: true })
  createtime: number | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  updatetime: number | null;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected', 'abandoned'], default: 'approved' })
  status: string;

  @Column({ name: 'invoice_image_path', type: 'varchar', length: 500, default: '' })
  invoiceImagePath: string;

  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: true })
  userId: number | null;

  @Column({ name: 'bank_name', type: 'varchar', length: 255, default: '' })
  bankName: string;

  @Column({ name: 'bank_account', type: 'varchar', length: 64, default: '' })
  bankAccount: string;
}
