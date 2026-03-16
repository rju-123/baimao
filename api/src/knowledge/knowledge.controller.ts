import { Controller, Get, Param, Query } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}

  @Get()
  async list(
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const data = await this.service.list({
      keyword,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return {
      code: 200,
      message: 'OK',
      result: data,
    };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const article = await this.service.detail(Number(id));
    if (!article) {
      return {
        code: 404,
        message: 'Article not found',
        result: null,
      };
    }
    return {
      code: 200,
      message: 'OK',
      result: article,
    };
  }
}

