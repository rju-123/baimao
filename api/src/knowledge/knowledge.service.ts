import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { KnowledgeArticle } from './knowledge.entity';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(KnowledgeArticle, 'mysql')
    private readonly repo: Repository<KnowledgeArticle>,
  ) {}

  async list(params: { keyword?: string; page?: number; pageSize?: number }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;

    const where: any = { status: 'published' };
    if (params.keyword && params.keyword.trim()) {
      const kw = `%${params.keyword.trim()}%`;
      where.title = Like(kw);
      where.summary = Like(kw);
    }

    const [list, total] = await this.repo.findAndCount({
      where,
      order: { createtime: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: ['id', 'title', 'summary', 'createtime', 'updatetime'],
    });

    return { list, total, page, pageSize };
  }

  async detail(id: number) {
    const article = await this.repo.findOne({ where: { id, status: 'published' } });
    return article || null;
  }
}

