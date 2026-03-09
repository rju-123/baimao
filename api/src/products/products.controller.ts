import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async list(
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.productsService.findAll({
      type,
      status: status ?? 'active',
    });
    return {
      code: 200,
      message: 'OK',
      result: data,
    };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const product = await this.productsService.findById(Number(id));
    return {
      code: 200,
      message: 'OK',
      result: product,
    };
  }
}

