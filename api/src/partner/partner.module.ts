import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartnerInvoice } from './partner-invoice.entity';
import { PartnerService } from './partner.service';
import { PartnerController } from './partner.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PartnerInvoice])],
  providers: [PartnerService],
  controllers: [PartnerController],
})
export class PartnerModule {}

