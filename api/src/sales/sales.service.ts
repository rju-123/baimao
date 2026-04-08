import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sales } from './sales.entity';

/** 仅数字；大陆号去掉前缀 86 再比较，避免 134… 与 86134… 对不上 */
export function phoneDigitsForMatch(input: string | null | undefined): string {
  let d = String(input ?? '').replace(/\D/g, '');
  if (d.length > 11 && d.startsWith('86'))
    d = d.slice(2);
  return d;
}

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sales, 'mysql')
    private readonly salesRepo: Repository<Sales>,
  ) {}

  /**
   * 按手机号新增或更新销售人员（小程序登录/选公司时同步到后台）
   */
  async upsertByPhone(
    phone: string,
    name?: string,
    companyId?: number | null,
    isAdmin?: boolean,
  ): Promise<Sales> {
    const now = Math.floor(Date.now() / 1000);
    const phoneNorm = String(phone ?? '').trim();
    let row = await this.findByPhone(phoneNorm);
    if (row) {
      if (name !== undefined) row.name = name;
      if (companyId !== undefined) row.companyId = companyId ?? null;
      if (isAdmin !== undefined)
        row.isAdmin = isAdmin ? 1 : 0;
      row.updatetime = now;
      return this.salesRepo.save(row);
    }
    row = this.salesRepo.create({
      phone: phoneNorm,
      name: name ?? '',
      companyId: companyId ?? null,
      isAdmin: isAdmin ? 1 : 0,
      createtime: now,
      updatetime: now,
    });
    return this.salesRepo.save(row);
  }

  /**
   * 根据手机号查询 fa_sales：ORM + 原生 SQL + 内存规范化三层兜底，
   * 避免线上仅 TRIM/QB 对不上时 name 永远为空。
   */
  async findByPhone(phone: string | null | undefined): Promise<Sales | null> {
    const raw = String(phone ?? '').trim();
    if (!raw)
      return null;

    // 优先原生 SQL + hydrate：避免 QueryBuilder getOne() 在部分环境下对 `name` 等列映射异常导致姓名为空
    const exactRows: Record<string, unknown>[] = await this.salesRepo.query(
      `SELECT id, phone, name, company_id, ongoing_orders, is_admin, createtime, updatetime
       FROM fa_sales
       WHERE TRIM(phone) = ?
       LIMIT 1`,
      [raw],
    );
    if (exactRows?.length)
      return this.hydrateSalesRow(exactRows[0] as Record<string, unknown>);

    const target = phoneDigitsForMatch(raw);
    if (!target || target.length < 10)
      return null;
    const tail = target.length >= 11 ? target.slice(-11) : target;

    const sqlRows: Record<string, unknown>[] = await this.salesRepo.query(
      `SELECT id, phone, name, company_id, ongoing_orders, is_admin, createtime, updatetime
       FROM fa_sales
       WHERE TRIM(phone) = ?
          OR TRIM(phone) LIKE ?
       LIMIT 1`,
      [raw, `%${tail}`],
    );
    if (sqlRows?.length)
      return this.hydrateSalesRow(sqlRows[0] as Record<string, unknown>);

    const all = await this.salesRepo.find();
    return all.find(r => phoneDigitsForMatch(r.phone) === target) ?? null;
  }

  private hydrateSalesRow(r: Record<string, unknown>): Sales {
    return this.salesRepo.create({
      id: Number(r.id),
      phone: String(r.phone ?? ''),
      name: String(r.name ?? ''),
      companyId: r.company_id != null ? Number(r.company_id) : null,
      ongoingOrders: Number(r.ongoing_orders ?? 0),
      isAdmin: Number(r.is_admin ?? 0),
      createtime: r.createtime != null ? Number(r.createtime) : null,
      updatetime: r.updatetime != null ? Number(r.updatetime) : null,
    });
  }

  /**
   * 在数据库内用 users 表当前行的 phone 与 fa_sales 关联（避免 ORM 层 phone 未对齐时永远查不到销售姓名）
   */
  async findByLinkedUserId(userId: number): Promise<Sales | null> {
    if (!Number.isFinite(userId) || userId <= 0)
      return null;
    const rows: Record<string, unknown>[] = await this.salesRepo.query(
      `SELECT s.id, s.phone, s.name, s.company_id, s.ongoing_orders, s.is_admin, s.createtime, s.updatetime
       FROM fa_sales s
       INNER JOIN users u ON u.id = ?
       WHERE TRIM(COALESCE(u.phone, '')) <> ''
         AND (
           TRIM(s.phone) = TRIM(u.phone)
           OR s.phone LIKE CONCAT('%', RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(u.phone), '+86', ''), '-', ''), ' ', ''), '+', ''), 11))
         )
       LIMIT 1`,
      [userId],
    );
    if (rows?.length)
      return this.hydrateSalesRow(rows[0] as Record<string, unknown>);
    return null;
  }
}
