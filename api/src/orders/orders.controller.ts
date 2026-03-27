import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import { ContractService } from '../contract/contract.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly contractService: ContractService,
  ) {}

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

  @Post(':id/generate-contract')
  async generateContract(@Param('id') id: string) {
    try {
      const contractUrl = await this.contractService.generateContract(Number(id));
      return {
        code: 200,
        message: '合同生成成功',
        result: { contractUrl },
      };
    }
    catch (e: any) {
      return {
        code: 400,
        message: e?.message || '合同生成失败',
        result: null,
      };
    }
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

