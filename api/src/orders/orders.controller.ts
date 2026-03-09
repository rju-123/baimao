import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() body: any) {
    const dto = plainToInstance(CreateOrderDto, body);
    await validateOrReject(dto);
    const order = await this.ordersService.create(dto);
    return {
      code: 200,
      message: '订单创建成功',
      result: order,
    };
  }

  @Get()
  async list(
    @Query('userId') userId: string,
    @Query('status') status?: string,
  ) {
    const data = await this.ordersService.findAllByUser(Number(userId), status);
    return {
      code: 200,
      message: 'OK',
      result: data,
    };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const order = await this.ordersService.findById(Number(id));
    return {
      code: 200,
      message: 'OK',
      result: order,
    };
  }
}

