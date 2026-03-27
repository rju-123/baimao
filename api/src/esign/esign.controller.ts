import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EsignService } from './esign.service';

@Controller('esign')
export class EsignController {
  constructor(private readonly esignService: EsignService) {}

  /**
   * 发起签署流程（当前为占位实现：生成 flowId 并保存购物车快照）
   */
  @Post('flows')
  async createFlow(@Body() body: any) {
    const data = body?.data ?? body ?? {};
    const userId = Number(data.userId || 0);
    if (!userId) {
      return { code: 400, message: '缺少 userId', result: null };
    }
    const flow = await this.esignService.createFlow(data);
    return { code: 200, message: 'OK', result: flow };
  }

  @Get('flows/:flowId')
  async getFlow(@Param('flowId') flowId: string): Promise<any> {
    const data = await this.esignService.getFlow(flowId);
    return { code: 200, message: 'OK', result: data };
  }

  /**
   * 完成签署并创建订单（当前为占位：用户点击“我已完成签署”触发）
   */
  @Post('flows/complete')
  async complete(@Body() body: any) {
    const data = body?.data ?? body ?? {};
    const flowId = String(data.flowId || '');
    if (!flowId) {
      return { code: 400, message: '缺少 flowId', result: null };
    }
    const orderId = await this.esignService.completeFlow(flowId);
    return { code: 200, message: 'OK', result: { orderId } };
  }
}

