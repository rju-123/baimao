import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerInvoice } from './partner-invoice.entity';
import { CreatePartnerInvoiceDto } from './dto/create-partner-invoice.dto';

@Injectable()
export class PartnerService {
  constructor(
    @InjectRepository(PartnerInvoice)
    private readonly invoicesRepo: Repository<PartnerInvoice>,
  ) {}

  async submitInvoice(dto: CreatePartnerInvoiceDto) {
    const entity = this.invoicesRepo.create({
      ...dto,
      status: 'pending',
    });
    return this.invoicesRepo.save(entity);
  }

  findByUser(userId: number) {
    return this.invoicesRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 1,
    });
  }
}

