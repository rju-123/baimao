import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { convert as libConvert } from 'libreoffice-convert';
import { Order } from '../orders/order.entity';
import { Company } from '../companies/company.entity';
import { Product } from '../products/product.entity';

/** 红队检测 / 渗透测试 / 合并单 / 未知类型 */
const CONTRACT_TEMPLATE_REDTEAM_PENTEST = 'contract_v1.docx';
/** 其他产品 */
const CONTRACT_TEMPLATE_OTHER = 'contract_other.docx';

export interface ContractOrderData {
  orderNo: string;
  productName: string;
  quantity: number;
  payAmount: number;
  /** 两位小数金额字符串，用于合同总价行 */
  payAmountFmt: string;
  /** 人民币大写数字部分（如「肆仟」），模板中另写「元整」 */
  amountWords: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  /** 合同日期（建议格式：YYYY年MM月DD日） */
  signDate: string;
  /** 交付对象/最终用户（公司名称） */
  deliveryTarget: string;
  /** 交付时间（如：2026-03-28） */
  deliveryTime: string;
  items: Array<{
    index: number;
    name: string;
    desc: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Order, 'mysql')
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Company, 'mysql')
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Product, 'mysql')
    private readonly productRepo: Repository<Product>,
  ) {}

  /**
   * 根据订单生成 PDF 合同，写入 uploads/contracts/，并更新订单的 contract_url、contract_status
   */
  async generateContract(orderId: number): Promise<string> {
    const order = await this.findOrderSafe(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    const existing = String(order.contractUrl ?? '').trim();
    if (existing) {
      const absPath = join(process.cwd(), existing.replace(/^\//, ''));
      if (existsSync(absPath)) {
        return existing;
      }
    }

    const company = order.companyId
      ? await this.companyRepo.findOne({ where: { id: order.companyId } })
      : null;

    const items = this.buildContractItems(order);
    const payNum = Number(order.payAmount ?? 0);
    const payAmountFmt = Number.isFinite(payNum) ? payNum.toFixed(2) : '0.00';

    const deliveryTarget = await this.resolveDeliveryTarget(order, items);
    const deliveryTime = await this.resolveDeliveryTime(order);
    const signDate = formatDateZhYmd(new Date());

    const orderData: ContractOrderData = {
      orderNo: order.orderNo,
      productName: order.productName || '—',
      quantity: Number(order.quantity) || 1,
      payAmount: payNum,
      payAmountFmt,
      amountWords: yuanAmountToChineseUpper(payNum),
      companyName: (company?.name ?? '').trim() || '—',
      companyAddress: (company?.address ?? '').trim() || '—',
      companyPhone: (company?.contactPhone ?? '').trim() || '—',
      signDate: signDate || '—',
      deliveryTarget: deliveryTarget || '—',
      deliveryTime: deliveryTime || '—',
      items,
    };

    const templateFile = await this.resolveContractTemplateFile(order);
    const docxBuffer = this.fillTemplate(orderData, templateFile);
    const pdfBuffer = await this.convertToPdf(docxBuffer);

    const filename = `${orderId}_${Date.now()}.pdf`;
    const relPath = `uploads/contracts/${filename}`;
    const absPath = join(process.cwd(), relPath);
    const dir = dirname(absPath);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(absPath, pdfBuffer);

    await this.ordersRepo.update(orderId, {
      contractUrl: relPath,
      contractStatus: 'generated',
    } as any);

    return relPath;
  }

  private async findOrderSafe(orderId: number): Promise<Order | null> {
    try {
      return await this.ordersRepo.findOne({ where: { id: orderId } });
    }
    catch (e: any) {
      const msg = String(e?.message || e || '');
      // 兼容 fa_order 尚未执行升级 SQL（缺少 line_items_json）时仍可生成合同（会退化为单行 items）
      if (msg.includes('Unknown column') && msg.includes('line_items_json')) {
        return await this.ordersRepo
          .createQueryBuilder('o')
          .select([
            'o.id',
            'o.orderNo',
            'o.userId',
            'o.companyId',
            'o.productId',
            'o.productName',
            'o.productBrief',
            'o.unitPrice',
            'o.quantity',
            'o.amount',
            'o.payAmount',
            'o.status',
            'o.contractStatus',
            'o.contractUrl',
            'o.createtime',
          ])
          .where('o.id = :id', { id: orderId })
          .getOne();
      }
      throw e;
    }
  }

  private buildContractItems(order: Order): ContractOrderData['items'] {
    const raw = (order as any)?.lineItemsJson ?? null;
    if (Array.isArray(raw) && raw.length) {
      return raw
        .map((it: any, i: number) => ({
          index: Number(it?.index || i + 1),
          name: String(it?.name ?? '').trim() || '—',
          desc: String(it?.desc ?? '').trim() || '—',
          quantity: Math.max(1, Number(it?.quantity || 1)),
          unitPrice: Number(it?.unitPrice || 0),
          lineTotal: Number(it?.lineTotal || 0),
        }));
    }

    // 兼容历史订单：无明细时退化为单行
    const qty = Math.max(1, Number((order as any)?.quantity || 1));
    const unitPrice = Number((order as any)?.unitPrice || 0);
    const amount = Number((order as any)?.amount || unitPrice * qty || 0);
    return [
      {
        index: 1,
        name: String((order as any)?.productName ?? '').trim() || '—',
        desc: String((order as any)?.productBrief ?? '').trim() || '—',
        quantity: qty,
        unitPrice,
        lineTotal: amount,
      },
    ];
  }

  /**
   * 合并订单统一使用红队/渗透模板；单品按产品 type 选择（other → contract_other.docx）。
   */
  private async resolveContractTemplateFile(order: Order): Promise<string> {
    if (this.isMergedOrder(order)) {
      return CONTRACT_TEMPLATE_REDTEAM_PENTEST;
    }

    const pid = Number(order.productId ?? 0);
    if (!pid) {
      return CONTRACT_TEMPLATE_REDTEAM_PENTEST;
    }

    const product = await this.productRepo.findOne({ where: { id: pid } });
    const type = String(product?.type ?? '')
      .trim()
      .toLowerCase();

    if (type === 'other') {
      return CONTRACT_TEMPLATE_OTHER;
    }

    // redteam / pentest / 旧值 product、service、空 → 同一套模板
    return CONTRACT_TEMPLATE_REDTEAM_PENTEST;
  }

  /** 与 createMerged 的 itemsSummary（多商品「，」拼接）及 productId=0 对齐 */
  private isMergedOrder(order: Order): boolean {
    const pid = Number(order.productId ?? 0);
    if (pid === 0) return true;
    const name = String(order.productName ?? '');
    if (name.includes('，') || name.includes(',')) return true;
    return false;
  }

  private fillTemplate(orderData: ContractOrderData, templateFile: string): Buffer {
    const safeName = templateFile.replace(/[/\\]/g, '').trim() || CONTRACT_TEMPLATE_REDTEAM_PENTEST;
    const templatePath = join(process.cwd(), 'templates', safeName);
    if (!existsSync(templatePath)) {
      const hint =
        safeName === CONTRACT_TEMPLATE_OTHER
          ? `请将「其他产品」合同模板以文件名 ${CONTRACT_TEMPLATE_OTHER} 放入目录 api/templates/（与 ${CONTRACT_TEMPLATE_REDTEAM_PENTEST} 同级）。`
          : '';
      throw new Error(
        `合同模板不存在: ${templatePath}${hint ? ` ${hint}` : ''}`,
      );
    }
    const content = readFileSync(templatePath);
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    doc.setData(orderData);
    doc.render();
    return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer;
  }

  private convertToPdf(docxBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      libConvert(docxBuffer, '.pdf', undefined, (err: Error | null, pdfBuffer: Buffer) => {
        if (err) {
          reject(new Error(`PDF 转换失败，请确保已安装 LibreOffice: ${err.message}`));
        } else {
          resolve(pdfBuffer);
        }
      });
    });
  }

  /**
   * 交付对象/最终用户优先级：
   * - 合并单：优先尝试从 line_items_json 的首行取 customer（若存在）
   * - 单品：从产品表 fa_product.customer 读取
   */
  private async resolveDeliveryTarget(
    order: Order,
    items: ContractOrderData['items'],
  ): Promise<string> {
    // 合并单/历史数据：如果 items 里含 customer（旧数据可能没有），先取第一条
    const rawItems = (order as any)?.lineItemsJson;
    if (Array.isArray(rawItems) && rawItems.length) {
      const c = String(rawItems[0]?.customer ?? '').trim();
      if (c)
        return c;
    }

    const pid = Number(order.productId ?? 0);
    if (pid) {
      const product = await this.productRepo.findOne({ where: { id: pid } });
      const c = String((product as any)?.customer ?? '').trim();
      if (c)
        return c;
    }

    // 最后兜底：用订单公司名（比 undefined 强）
    const companyId = Number(order.companyId ?? 0);
    if (companyId) {
      const company = await this.companyRepo.findOne({ where: { id: companyId } });
      const n = String(company?.name ?? '').trim();
      if (n)
        return n;
    }

    // 兜底：订单产品名
    const name = String(order.productName ?? '').trim();
    return name || '—';
  }

  /**
   * 合同“交付时间”占位符值：
   * - 单品订单：取产品表 fa_product.delivery_time
   * - 合并单/缺失：返回兜底文案
   */
  private async resolveDeliveryTime(order: Order): Promise<string> {
    const pid = Number(order.productId ?? 0);
    if (pid) {
      const product = await this.productRepo.findOne({ where: { id: pid } });
      const t = String((product as any)?.deliveryTime ?? '').trim();
      if (t)
        return t;
    }
    return '以合同约定为准';
  }
}

/** 整数元转中文大写（含「元整」），用于合同总价大写栏 */
function yuanAmountToChineseUpper(yuan: number): string {
  const n = Math.floor(Math.max(0, Number(yuan) || 0));
  if (n === 0)
    return '零';
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const unit = ['', '拾', '佰', '仟'];

  function section4(x: number): string {
    let s = '';
    let zero = false;
    for (let i = 3; i >= 0; i--) {
      const m = Math.floor(x / 10 ** i) % 10;
      if (m === 0) {
        zero = true;
        continue;
      }
      if (zero && s)
        s += digit[0];
      zero = false;
      s += digit[m] + unit[i];
    }
    return s;
  }

  const yi = Math.floor(n / 100000000);
  let rest = n % 100000000;
  const wan = Math.floor(rest / 10000);
  rest %= 10000;
  const ge = rest;

  let out = '';
  if (yi)
    out += section4(yi) + '亿';
  if (wan)
    out += section4(wan) + '万';
  if (ge) {
    if (wan && ge < 1000)
      out += digit[0];
    out += section4(ge);
  }
  // 模板中通常另有「元整」字样，此处只返回金额大写数字部分（如「肆仟」）
  return out;
}

function pad2(n: number) {
  return String(Math.max(0, Math.floor(Number(n) || 0))).padStart(2, '0');
}

/** 格式：YYYY年MM月DD日 */
function formatDateZhYmd(d: Date) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime()))
    return '';
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}年${m}月${day}日`;
}
