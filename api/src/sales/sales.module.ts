import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sales } from './sales.entity';
import { SalesService } from './sales.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sales], 'mysql')],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
