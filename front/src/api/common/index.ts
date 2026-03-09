/**
 * 通用接口
 */
import type { SendCodeReq, SendCodeRes, UploadRes } from './types';
import { post, upload } from '@/utils/request';

// 文件上传
export const uploadFile = (filePath: string) =>
  upload<UploadRes>('/common/upload', { filePath, name: 'file' });

// 发送验证码（对接后端 /auth/send-code，测试环境固定返回成功）
export const sendCode = (data: SendCodeReq) =>
  post<SendCodeRes>('/auth/send-code', { data, custom: { auth: false } });
