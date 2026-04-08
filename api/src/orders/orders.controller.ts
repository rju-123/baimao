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

  /**
   * 后台将订单标为「已完成」后由 FastAdmin 回调：按实付金额 1:1 发放积分（仅一次）
   */
  @Post(':id/award-completion-points')
  async awardCompletionPoints(@Param('id') id: string) {
    const result = await this.ordersService.awardCompletionPointsIfCompleted(Number(id));
    const msg
      = result.awarded
        ? '积分已发放'
        : result.reason === 'already_awarded'
          ? '该订单已发放过完成积分'
          : result.reason === 'not_completed'
            ? '订单非已完成状态，未发放积分'
            : result.reason === 'not_found'
              ? '订单不存在'
              : result.reason === 'missing_column_points_awarded'
                ? '数据库未升级 points_awarded 字段'
                : '未发放积分';
    return {
      code: 200,
      message: msg,
      result,
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

