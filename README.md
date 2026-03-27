# 白帽子业务平台

面向 B2B 的销售订单管理移动端与后台管理系统。基于 [uniapp-vue3-template](https://github.com/oyjt/uniapp-vue3-template) 作为前端脚手架。

## 项目结构

- **front/** - 移动端 (Vue3 + Uni-app)，支持 H5 / 微信小程序
- **api/** - 后端 API（NestJS），端口 **3000**，**小程序/H5 必须连接此服务**
- **admin/** - 后台管理 (PHP FastAdmin)，端口 8000，与小程序无关
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

### 后端 API（小程序/H5 必需）

```bash
cd api
npm install
npm run start:dev    # 端口 3000，启动后控制台显示「API 服务已启动」
```

> ⚠️ **小程序连接失败时请确认**：你启动的是 `api`（NestJS 端口 3000），而不是 `admin`（PHP 端口 8000）。两者是不同的服务。

> **订单 PDF 合同自动生成**依赖本机安装 [LibreOffice](https://www.libreoffice.org/)，并将 `soffice` 加入系统 PATH。Windows 安装后可将 `C:\Program Files\LibreOffice\program` 加入环境变量。详见 [api/README.md](api/README.md) 中「LibreOffice 安装」章节。

### 后台管理（可选）

```bash
cd admin
php -S 127.0.0.1:8000 -t public   # PHP 内置服务器，端口 8000
```

## 配置说明

- 前端接口地址：见 `front/env/.env.development`，默认 `VITE_API_BASE_URL=http://127.0.0.1:3000`（小程序需用 127.0.0.1）
- 微信小程序 AppID：已配置于 `front/src/manifest.json` 的 `mp-weixin.appid`，可与微信开发者工具关联

### 微信小程序开发（网络连接错误排查）

若小程序出现「网络连接错误」或请求失败：

1. **确保后端已启动**：在项目根目录执行 `cd api && npm run start:dev`，确认控制台输出「API 服务已启动」
2. **微信开发者工具设置**：打开 详情 → 本地设置 → 勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」
3. **重新构建**：修改配置后执行 `cd front && pnpm dev:mp-weixin`，再在微信开发者工具中刷新
4. **若 127.0.0.1 仍不可用**：将 `front/env/.env.development` 中的 `VITE_API_BASE_URL` 改为本机局域网 IP（如 `http://192.168.1.100:3000`），然后重新构建

## 文档

- 需求与业务：`PRDs/prd.md`
- UI 规范：`PRDs/UI.md`
- 技术规范：`PRDs/development.md`
