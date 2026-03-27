import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/order.entity';
import { Company } from '../companies/company.entity';
import { Product } from '../products/product.entity';
import { ContractService } from './contract.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Company, Product], 'mysql'),
  ],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}
