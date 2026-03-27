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
      status,
    });
    return {
      code: 200,
      message: 'OK',
      result: data,
    };
  }

  /**
   * 批量获取库存与状态，用于购物车等场景实时标记售罄
   * GET /products/stocks?ids=1,2,3
   */
  @Get('stocks')
  async stocks(@Query('ids') ids: string) {
    const list = String(ids || '')
      .split(',')
      .map(s => Number(s.trim()))
      .filter(n => Number.isFinite(n) && n > 0);
    const products = await this.productsService.findByIds(list);
    const foundMap = new Map<number, any>();
    for (const p of products) {
      foundMap.set(p.id, {
        id: p.id,
        inventory: p.inventory,
        status: p.status,
        // 售罄以库存为准；缺失商品在下面统一视为 soldOut
        soldOut: typeof p.inventory === 'number' ? p.inventory <= 0 : false,
      });
    }
    const result = list.map((id) => {
      const hit = foundMap.get(id);
      if (hit)
        return hit;
      return {
        id,
        inventory: 0,
        status: 'missing',
        soldOut: true,
      };
    });
    return { code: 200, message: 'OK', result };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const product = await this.productsService.findById(Number(id));
    if (!product || product.status === 'expired')
      return { code: 404, message: '产品已下架或不存在', result: null };
    return {
      code: 200,
      message: 'OK',
      result: product,
    };
  }
}

