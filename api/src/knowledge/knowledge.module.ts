import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeArticle } from './knowledge.entity';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeArticle], 'mysql')],
  providers: [KnowledgeService],
  controllers: [KnowledgeController],
})
export class KnowledgeModule {}

