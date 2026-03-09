import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { CreateExchangeDto } from './dto/create-exchange.dto';
import { PointsService } from './points.service';

@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('mall-items')
  async listItems(@Query('type') type?: string) {
    const data = await this.pointsService.listItems(type);
    return {
      code: 200,
      message: 'OK',
      result: data,
    };
  }

  @Get('exchange-records')
  async listRecords(@Query('userId') userId: string) {
    const data = await this.pointsService.listRecords(Number(userId));
    return {
      code: 200,
      message: 'OK',
      result: data,
    };
  }

  @Post('exchange')
  async exchange(@Body() body: any) {
    const dto = plainToInstance(CreateExchangeDto, body);
    await validateOrReject(dto);
    const record = await this.pointsService.createExchange(dto);
    return {
      code: 200,
      message: '兑换成功',
      result: record,
    };
  }
}

