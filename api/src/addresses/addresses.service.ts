import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressesRepo: Repository<Address>,
  ) {}

  findAllByUser(userId: number) {
    return this.addressesRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  findById(id: number) {
    return this.addressesRepo.findOne({ where: { id } });
  }

  async create(dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.addressesRepo.update({ userId: dto.userId, isDefault: true }, { isDefault: false });
    }
    const entity = this.addressesRepo.create(dto);
    return this.addressesRepo.save(entity);
  }

  async update(id: number, dto: UpdateAddressDto) {
    const address = await this.findById(id);
    if (!address)
      return null;
    if (dto.isDefault) {
      await this.addressesRepo.update({ userId: address.userId, isDefault: true }, { isDefault: false });
    }
    Object.assign(address, dto);
    return this.addressesRepo.save(address);
  }

  async remove(id: number) {
    await this.addressesRepo.delete(id);
  }
}

