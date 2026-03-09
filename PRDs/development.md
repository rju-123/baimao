一、 技术架构总览 (Architecture Overview)本系统采用 前后端分离 架构，且所有服务均部署在本地环境（Local Environment），不依赖任何云端 API 或 SaaS 服务。层次选型理由前端框架Vue 3 + Uni-app跨端能力强，兼容微信小程序风格，文档极丰富 +1UI 组件库NutUI-Uniapp (京东)成熟的移动端组件库，完美适配微信蓝配色，组件 API 规范 后端语言Node.js (NestJS)模块化结构，适合快速生成 CRUD 逻辑，与前端 TS 共享类型定义本地数据库SQLite / Better-SQLite3单文件数据库，无需安装大型服务，高性能，完全本地化本地缓存LocalStorage (前端) / Map (后端)满足会话存储需求，无需部署 Redis二、 前端技术规范 (Frontend Specs)2.1 样式与配色 (Style & Theme)前端需配置全局变量，严格执行 PRD 要求的微信生态配色：Primary: #0A7AFF (微信蓝) Danger: #FF3B30 (红色/过期提示) Background: #F2F2F7 (浅灰) 2.2 核心组件映射 (Component Mapping)禁止 Cursor 手写基础组件，必须使用 NutUI 提供的成熟单元：下单页 Tabs: 使用 nut-tabs + nut-tab-pane 实现“全部/服务/产品”切换 。搜索框: 使用 nut-searchbar。产品/订单卡片: 使用 nut-cell 或封装的自定义卡片。价格展示: 使用 nut-price 组件（自带删除线和符号处理） 。地址/角色选择: 使用 nut-picker 或 nut-popup 。+1三、 后端接口与数据规范 (Backend Specs)3.1 数据库结构 (Local Database)后端使用 TypeORM 连接本地 database.sqlite 文件。表名关键字段说明Usersid, phone, role (sales/partner), company_id存储用户及角色信息 +1Productsid, name, type (service/product), price, discount_price, status (active/expired)核心商品库 +1Ordersid, order_no, customer_name, total_amount, status, created_at销售订单记录 +1ExchangeRecordsid, user_id, product_name, points_spent, status积分兑换记录 3.2 离线存储逻辑文件上传：合作伙伴提交的开票资料  需保存至本地项目的 /uploads 文件夹。Mock 数据：在开发阶段，后端需预置模拟订单数据（如 ORD-2026-101 等）供前端调用 。四、 本地部署方案 (Local Deployment)为了实现“全本地”运行，Cursor 在生成环境配置时应包含以下步骤：Node.js 环境：要求本地安装 Node.js 18+。启动脚本：npm run dev:api: 启动 NestJS 后端服务（端口 3000）。npm run dev:h5: 启动 Uni-app 前端（端口 8080，使用 H5 模式预览）。本地网络联通：前端 VITE_API_URL 设置为 http://localhost:3000。图片上传路径映射为本地静态资源路径。五、 给 Cursor 的“技术文档执行”指令在 Cursor 中开启开发时，请发送以下指令以确保其遵循此技术文档：指令：“请基于白帽子业务平台技术文档，使用 Vue3 + Uni-app + NutUI-Uniapp 构建。严禁手写复杂 CSS：所有间距、颜色、边框必须优先使用 NutUI 组件属性或微信规范样式类。后端对接：使用 Axios 访问本地 http://localhost:3000 接口，禁止使用任何 Firebase 或云开发 API。
3. 本地化存储：用户角色 (userRole) 和 Token 必须持久化在 uni.setStorageSync 中 。+1组件调用逻辑：
- 下单页面 (/sales/order) 必须调用 nut-tabs 实现 。
- 价格显示必须调用 nut-price 。
- ID=12 的产品点击时，需判断 status === 'expired' 并拦截跳转 。”+2六、 UI 补充说明 (针对最新修改)在实现 下单页面 时，Cursor 需特别注意：Data Filter: 后端 GET /products 接口需通过参数筛选产品，且默认不再返回已下架产品 。Simple Card: 产品卡片组件只接收 name, desc, price, discount_price 四个主要 Props，不再渲染类型标签 。

二、 后台系统架构设计后台管理系统主要面向管理员，用于处理合作伙伴审核、订单监控、产品上架及积分商城管理。维度技术选型理由前端框架Vue 3 + Vite极致的本地开发启动速度，生态成熟UI 组件库Element PlusPC端最成熟的开源组件库，Cursor 对其 API 调用极其精准路由/状态Vue Router + Pinia标准化配置，易于扩展权限路由后端服务Node.js (NestJS)与移动端共用一套后端服务，通过角色权限（RBAC）区分接口报表处理xlsx (Excel.js)纯前端或服务端本地生成 Excel，无需云端转换二、 核心功能模块与组件映射禁止 Cursor 自行编写复杂的表格或表单，必须调用 Element Plus 的成熟方案：1. 合作伙伴审核模块 (/admin/partners)功能：查看合作伙伴提交的企业信息、营业执照，并进行“通过/驳回”操作。组件使用：el-table：展示申请列表，利用 scoped slot 渲染状态标签。el-image：利用其自带的 预览功能 查看营业执照大图。el-dialog：弹出审核框，录入驳回原因。2. 产品/商城管理 (/admin/products)功能：发布新服务/产品，管理库存，设置积分兑换规则。组件使用：el-form：多级表单输入（产品名、价格、简介）。el-switch：快速切换产品上下架状态（包含 ID=12 的特殊产品逻辑）。3. 订单与履约监控 (/admin/orders)功能：监控销售订单状态，手动更新履约进度。组件使用：el-tabs：按状态（签约中、履约中、已完成）切分子表。el-tag：根据 PRD 规范使用不同颜色标识订单状态（Success, Warning, Danger）。三、 页面草图 (Markdown 演示)后台管理主界面布局Markdown+-------------------------------------------------------------+
| [LOGO] 白帽子后台管理系统              [管理员: Admin v]     |
+-----------+-------------------------------------------------+
| 菜单栏    |  面包屑: 首页 / 合作伙伴审核                     |
+-----------+-------------------------------------------------+
| 用户管理  |  [ 输入企业名称 ] [ 状态筛选 v ] [ 搜索 ]        |
|           |                                                 |
| 合作伙伴 >| +----------+----------+----------+------------+ |
|           | | 企业名   | 申请时间 | 状态     | 操作       | |
| 订单管理  | +----------+----------+----------+------------+ |
|           | | 某某科技 | 02-03    | [待审核] | [查看/审核]| |
| 产品管理  | | 华夏咨询 | 02-02    | [已通过] | [详情]     | |
|           | +----------+----------+----------+------------+ |
| 积分商城  |                                                 |
|           | [ <  1  2  3  4  > ] 分页组件                    |
+-----------+-------------------------------------------------+
四、 本地化数据与安全规范RBAC 权限控制：在本地 SQLite 数据库中增加 permissions 表。后端拦截器（Interceptor）校验 JWT 中的角色字段，非 admin 角色禁止访问 /admin/* 路径。本地文件管理：合作伙伴上传的证件图片存储在本地 public/uploads/auth/。后台直接读取本地文件路径进行展示，不调用任何对象存储（如阿里云 OSS）。数据导出：调用 xlsx 库，一键将当前 el-table 的数据转换为本地 .xlsx 文件下载。

五、 Monorepo 目录结构与开发总则
1. 目录结构（本地开发）：
   - `/front`：微信小程序前端（Vue3 + Uni-app + NutUI），仅放前端小程序/H5 代码。
   - `/admin`：后台管理系统（Vue3 + Element Plus），仅放管理后台前端代码。
   - `/api`：后端接口服务（Node.js + NestJS + SQLite），仅放服务端与数据库访问代码。
2. 路径守则：
   - 开发小程序功能时，所有文件必须创建在 `/front` 目录下；
   - 开发后台管理功能时，所有文件必须创建在 `/admin` 目录下；
   - 开发接口与业务逻辑时，所有文件必须创建在 `/api` 目录下。
3. 协作规则：
   - `/front` 与 `/admin` 均通过 Axios 访问本地 `http://localhost:3000`（由 `/api` 提供服务）。
4. 文档阅读要求（强制）：
   - 在每次开始新功能开发或重构前，必须优先阅读根目录 `PRDs` 目录下的文档：
     - `prd.md`：产品需求与业务规则；
     - `UI.md`：UI/交互规范；
     - `development.md`：技术与架构规范（本文件）。
   - 所有实现必须以以上文档为准，如有冲突，需优先更新文档，再调整实现。