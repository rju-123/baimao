import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// 映射到后台管理系统的 MySQL 表 `fa_knowledge_articles`
@Entity('fa_knowledge_articles')
export class KnowledgeArticle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'kb_no', default: '' })
  kbNo: string;

  @Column()
  title: string;

  @Column()
  summary: string;

  @Column()
  content: string;

  /**
   * draft / published
   */
  @Column()
  status: string;

  @Column({ name: 'attachment_url', default: '' })
  attachmentUrl: string;

  @Column({ name: 'attachment_name', default: '' })
  attachmentName: string;

  /**
   * head / tail
   */
  @Column({ name: 'attachment_position', default: 'tail' })
  attachmentPosition: string;

  @Column({ type: 'integer', nullable: true })
  createtime: number | null;

  @Column({ type: 'integer', nullable: true })
  updatetime: number | null;
}

