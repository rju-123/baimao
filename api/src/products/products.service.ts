import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    // 使用名为 'mysql' 的连接中的 ProductRepository
    @InjectRepository(Product, 'mysql')
    private readonly productsRepo: Repository<Product>,
  ) {}

  async onModuleInit() {
    const count = await this.productsRepo.count();
    if (count === 0) {
      const seed: Partial<Product>[] = [
        // 服务类（初始库存统一设置为 10，便于演示）
        {
          name: '企业网络安全评估服务',
          type: 'service',
          category: '安全评估',
          brief: '为企业提供全方位网络安全现状评估服务，包括网络架构分析、系统漏洞扫描、安全策略检查、数据风险评估，出具专业安全评估报告',
          detail: '网络架构安全分析、系统漏洞扫描、安全策略合规性检查、数据安全风险评估、专业安全评估报告、加固建议方案等。',
          price: 60000,
          discountPrice: 50000,
          status: 'active',
          inventory: 10,
          deliveryTime: '2026-03-08',
        },
        {
          name: '渗透测试服务',
          type: 'service',
          category: '安全测试',
          brief: '模拟黑客攻击，发现系统漏洞。',
          detail: '模拟真实攻击场景，对外网、内网、应用系统进行渗透测试，发现潜在安全漏洞并出具整改建议。',
          price: 100000,
          discountPrice: 80000,
          status: 'active',
          inventory: 10,
          deliveryTime: '2026-03-15',
        },
        {
          name: '应急响应服务',
          type: 'service',
          category: '应急服务',
          brief: '7x24 小时应急响应，快速处理安全事件。',
          detail: '针对勒索病毒、入侵事件等提供快速处置和溯源分析服务。',
          price: 120000,
          discountPrice: 100000,
          status: 'active',
          inventory: 10,
          deliveryTime: '2026-03-10',
        },
        {
          name: '合规咨询服务',
          type: 'service',
          category: '咨询服务',
          brief: '等保、ISO27001 等合规咨询。',
          detail: '围绕等保、ISO27001 等标准，提供差距分析、整改方案与落地辅导。',
          price: 50000,
          discountPrice: 40000,
          status: 'active',
          inventory: 10,
          deliveryTime: '2026-03-20',
        },
        // 实体产品（初始库存统一设置为 10，便于演示）
        {
          name: '防火墙设备（企业级）',
          type: 'product',
          category: '网络设备',
          brief: '企业级防火墙，支持高并发访问。',
          detail: '支持 10Gbps 处理性能、500 万并发连接，集成入侵防御、病毒过滤等能力。',
          price: 30000,
          discountPrice: 25000,
          status: 'active',
          inventory: 10,
          deliveryTime: '2026-03-12',
        },
        {
          name: '入侵检测系统',
          type: 'product',
          category: '安全设备',
          brief: '实时监测网络入侵行为。',
          detail: '对网络流量进行深度检测与分析，发现异常行为并告警。',
          price: 45000,
          discountPrice: 35000,
          status: 'active',
          inventory: 10,
          deliveryTime: '2026-03-18',
        },
        {
          name: '安全网关',
          type: 'product',
          category: '网络设备',
          brief: '集成多种安全功能的网关设备。',
          detail: '集成防火墙、入侵检测、应用控制等多种功能于一体的安全网关。',
          price: 55000,
          discountPrice: 45000,
          status: 'active',
          inventory: 10,
          deliveryTime: '2026-03-22',
        },
        {
          name: '加密存储设备',
          type: 'product',
          category: '存储设备',
          brief: '硬件级数据加密存储。',
          detail: '提供硬件级别的数据加密与访问控制，适合敏感数据存储场景。',
          price: 25000,
          discountPrice: 20000,
          status: 'expired',
          inventory: 10,
          deliveryTime: '2025-12-31',
        },
      ];
      await this.productsRepo.save(this.productsRepo.create(seed));
    }
  }

  findAll(filter?: { type?: string; status?: string }) {
    const where: any = {};
    if (filter?.type)
      where.type = filter.type;
    if (filter?.status)
      where.status = filter.status;
    return this.productsRepo.find({ where });
  }

  findById(id: number) {
    return this.productsRepo.findOne({ where: { id } });
  }
}

