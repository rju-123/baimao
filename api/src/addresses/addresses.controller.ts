import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  async list(@Query('userId') userId: string) {
    const data = await this.addressesService.findAllByUser(Number(userId));
    return {
      code: 200,
      message: 'OK',
      result: data,
    };
  }

  @Post()
  async create(@Body() body: any) {
    const dto = plainToInstance(CreateAddressDto, body);
    await validateOrReject(dto);
    const address = await this.addressesService.create(dto);
    return {
      code: 200,
      message: '地址创建成功',
      result: address,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const dto = plainToInstance(UpdateAddressDto, body);
    await validateOrReject(dto);
    const address = await this.addressesService.update(Number(id), dto);
    return {
      code: 200,
      message: '地址更新成功',
      result: address,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.addressesService.remove(Number(id));
    return {
      code: 200,
      message: '地址已删除',
      result: true,
    };
  }
}

