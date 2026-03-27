import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../companies/company.entity';
import { User } from '../users/user.entity';
import { Sales } from '../sales/sales.entity';
import { PartnerService } from './partner.service';
import { PartnerController } from './partner.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Sales], 'mysql'),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [PartnerService],
  controllers: [PartnerController],
})
export class PartnerModule {}

