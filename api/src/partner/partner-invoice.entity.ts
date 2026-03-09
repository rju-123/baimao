import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('partner_invoices')
export class PartnerInvoice {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 关联的用户 ID（合作伙伴）
   */
  @Column()
  userId: number;

  @Column()
  companyName: string;

  @Column()
  contactName: string;

  @Column()
  contactPhone: string;

  @Column()
  registeredAddress: string;

  @Column()
  taxNo: string;

  @Column()
  bankName: string;

  @Column()
  bankAccount: string;

  @Column({ type: 'text', nullable: true })
  invoiceImagePath: string | null;

  /**
   * 审核状态：pending / approved / rejected
   */
  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  rejectReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

