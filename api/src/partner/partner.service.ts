import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../companies/company.entity';
import { User } from '../users/user.entity';
import { Sales } from '../sales/sales.entity';
import { CreatePartnerInvoiceDto } from './dto/create-partner-invoice.dto';

@Injectable()
export class PartnerService {
  constructor(
    @InjectRepository(Company, 'mysql')
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(User, 'mysql')
    private readonly userRepo: Repository<User>,
    @InjectRepository(Sales, 'mysql')
    private readonly salesRepo: Repository<Sales>,
  ) {}

  async submitInvoice(dto: CreatePartnerInvoiceDto) {
    const now = Math.floor(Date.now() / 1000);
    const entity = this.companyRepo.create({
      name: dto.companyName,
      creditCode: dto.taxNo,
      address: dto.registeredAddress,
      contactName: dto.contactName,
      contactPhone: dto.contactPhone,
      salesName: dto.salesName,
      bankName: dto.bankName,
      bankAccount: dto.bankAccount,
      invoiceImagePath: dto.invoiceImagePath,
      userId: dto.userId,
      status: 'pending',
      createtime: now,
      updatetime: now,
    });
    return this.companyRepo.save(entity);
  }

  async findByUser(userId: number) {
    const list = await this.companyRepo.find({
      where: { userId },
      order: { updatetime: 'DESC' },
    });
    // 过滤掉已放弃的记录，只返回 pending / approved / rejected
    const company = list.find(c => c.status !== 'abandoned') ?? null;
    if (!company)
      return null;
    return {
      id: company.id,
      userId: company.userId,
      salesName: (company as any).salesName || '',
      companyName: company.name,
      contactName: company.contactName,
      contactPhone: company.contactPhone,
      registeredAddress: company.address,
      taxNo: company.creditCode,
      bankName: company.bankName,
      bankAccount: company.bankAccount,
      invoiceImagePath: company.invoiceImagePath,
      status: company.status,
      createdAt: company.createtime ? new Date(company.createtime * 1000) : null,
      updatedAt: company.updatetime ? new Date(company.updatetime * 1000) : null,
    };
  }

  async approve(companyId: number) {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company || company.status !== 'pending')
      return false;

    const userId = company.userId;
    if (!userId) {
      await this.companyRepo.update(companyId, { status: 'approved' });
      return true;
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    const now = Math.floor(Date.now() / 1000);

    await this.companyRepo.update(companyId, { status: 'approved' });

    if (user) {
      const salesName = String((company as any).salesName ?? '').trim();
      if (salesName) {
        user.name = salesName;
      }
      user.companyId = companyId;
      user.role = 'sales';
      user.isAdmin = true;
      await this.userRepo.save(user);

      // 合作伙伴申请通过后，申请人自动成为该企业的管理员（fa_sales 按 phone 唯一，需 upsert）
      const existing = await this.salesRepo.findOne({
        where: { phone: user.phone },
      });
      if (existing) {
        existing.companyId = companyId;
        existing.isAdmin = 1;
        existing.name = user.name || existing.name || '';
        existing.updatetime = now;
        await this.salesRepo.save(existing);
      }
      else {
        const sales = this.salesRepo.create({
          phone: user.phone,
          name: user.name || '',
          companyId,
          isAdmin: 1,
          createtime: now,
          updatetime: now,
        });
        await this.salesRepo.save(sales);
      }
    }
    return true;
  }

  async reject(companyId: number) {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company || company.status !== 'pending')
      return false;
    await this.companyRepo.update(companyId, { status: 'rejected' });
    return true;
  }

  /**
   * 用户放弃已驳回的公司申请，标记为 abandoned，findByUser 将不再返回
   */
  async abandonInvoice(userId: number) {
    const list = await this.companyRepo.find({
      where: { userId },
      order: { updatetime: 'DESC' },
    });
    const rejected = list.find(c => c.status === 'rejected');
    if (!rejected)
      return false;
    await this.companyRepo.update(rejected.id, { status: 'abandoned' as any });
    return true;
  }
}

