# 白帽子业务平台

面向 B2B 的销售订单管理移动端与后台管理系统。基于 [uniapp-vue3-template](https://github.com/oyjt/uniapp-vue3-template) 作为前端脚手架。

## 项目结构

- **front/** - 移动端 (Vue3 + Uni-app + uview-plus)，支持 H5 / 微信小程序
- **api/** - 后端服务 (NestJS + SQLite)，端口 3000
- **admin/** - 后台管理 (Vue3 + Vite + Element Plus)
- **PRDs/** - 产品需求与开发规范文档

## 开发

### 环境要求

- Node.js >= 18
- pnpm >= 8（前端推荐）

### 前端（移动端）

```bash
cd front
pnpm install
pnpm dev:h5          # H5 开发，默认端口 9527
pnpm dev:mp-weixin  # 微信小程序（需用微信开发者工具打开 dist/dev/mp-weixin）
```

### 后端

```bash
cd api
npm install
npm run start:dev    # 端口 3000
```

### 后台管理

```bash
cd admin
npm install
npm run dev
```

## 配置说明

- 前端接口地址：见 `front/env/.env.development`，默认 `VITE_API_BASE_URL=http://localhost:3000`
- 微信小程序 AppID：已配置于 `front/src/manifest.json` 的 `mp-weixin.appid`，可与微信开发者工具关联

## 文档

- 需求与业务：`PRDs/prd.md`
- UI 规范：`PRDs/UI.md`
- 技术规范：`PRDs/development.md`
