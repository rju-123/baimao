import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  phone: string;

  @Column({ default: '' })
  name: string;

  /**
   * sales / partner
   */
  @Column({ default: 'sales' })
  role: string;

  /**
   * 是否企业管理员（可访问“我的公司”等）
   */
  @Column({ default: false })
  isAdmin: boolean;

  /**
   * 当前所属公司 ID
   */
  @Column({ type: 'integer', nullable: true })
  companyId: number | null;

  /**
   * 当前积分
   */
  @Column({ type: 'integer', default: 0 })
  points: number;
}

