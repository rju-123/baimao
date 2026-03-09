<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## 白帽子业务平台后端接口说明

本服务为白帽子业务平台提供本地化 API，端口默认为 `http://localhost:3000`，供：

- 微信小程序前端（`/front`）使用；
- 后台管理系统（`/admin`）使用。

数据库使用 SQLite（`database.sqlite`），通过 TypeORM 自动建表与初始化部分种子数据。

### 认证与用户

#### `POST /auth/send-code`

- **描述**：发送登录验证码（本地开发环境仅做模拟，不实际下发短信）。
- **请求体**

```json
{
  "phone": "18500000000"
}
```

- **响应**

```json
{
  "code": 200,
  "message": "验证码发送成功（测试环境固定为 1234）",
  "result": {
    "expireIn": 300
  }
}
```

> 说明：当前固定使用测试验证码 `1234`，前端在“手机验证码登录”页输入该验证码即可完成登录。

#### `POST /auth/login`

- **描述**：手机号 + 验证码登录（目前验证码固定为 `1234`，仅用于本地开发演示）。
- **请求体**

```json
{
  "phone": "18500000000",
  "code": "1234"
}
```

- **响应**

```json
{
  "code": 200,
  "message": "登录成功",
  "result": {
    "token": "mock-token-1",
    "user": {
      "id": 1,
      "phone": "18500000000",
      "name": "",
      "role": "sales",
      "isAdmin": false,
      "companyId": null,
      "points": 0
    }
  }
}
```

> 说明：当前 token 仅为前端本地存储使用，后端暂未做严格鉴权，可后续扩展为 JWT。

#### `GET /users/:id`

- **描述**：根据用户 ID 获取用户信息。
- **路径参数**：`id` 用户 ID。

---

### 公司（选择公司 / 我的公司）

#### `GET /companies`

- **描述**：获取所有可选公司列表，供前端公司选择页与“我的公司”使用。
- **响应 `result` 示例**

```json
[
  {
    "id": 1,
    "name": "某安全公司",
    "creditCode": "91110000XXXX000001",
    "address": "北京市朝阳区建国路88号",
    "contactName": "李经理",
    "contactPhone": "010-12345678"
  }
]
```

> 应与 PRD 中「公司选择页面」示例数据一致。

#### `POST /companies`

- **描述**：创建公司（后台管理使用）。
- **请求体**

```json
{
  "name": "某安全公司",
  "creditCode": "91110000XXXX000001",
  "address": "北京市朝阳区建国路88号",
  "contactName": "李经理",
  "contactPhone": "010-12345678"
}
```

---

### 产品（下单页 / 产品详情）

#### `GET /products`

- **描述**：获取产品/服务列表。
- **查询参数**
  - `type` 可选：`service` / `product`；
  - `status` 可选，默认 `active`，传 `expired` 可取出已过期产品（例如加密存储设备）。

- **响应 `result` 字段示例**

```json
[
  {
    "id": 1,
    "name": "企业网络安全评估服务",
    "type": "service",
    "category": "安全评估",
    "brief": "为企业提供全方位网络安全现状评估服务...",
    "detail": "网络架构安全分析、系统漏洞扫描...",
    "price": 60000,
    "discountPrice": 50000,
    "status": "active"
  }
]
```

> 已根据 PRD 4.3.5 / 4.3.6 中的产品列表预置种子数据，并将“加密存储设备”标记为 `status = expired`。

#### `GET /products/:id`

- **描述**：获取指定产品详情（下单前详情页使用）。

---

### 订单（下单 / 我的订单 / 订单详情）

#### `POST /orders`

- **描述**：创建订单。前端在确认订单页提交。
- **请求体**

```json
{
  "userId": 1,
  "companyId": 1,
  "productId": 1,
  "customerName": "张三",
  "customerPhone": "13800000000",
  "customerCompany": "某制造企业",
  "quantity": 1,
  "couponDiscount": 100
}
```

- **说明**
  - 金额字段由后端根据产品单价与数量计算：
    - `amount = price * quantity`
    - `discountAmount = couponDiscount`（如果传入）
    - `payAmount = amount - discountAmount`
  - 初始状态：`status = "pending_contract"`（待签约）。

#### `GET /orders`

- **描述**：获取用户的订单列表，对应“小程序端 - 我的订单页面”。
- **查询参数**
  - `userId`：必填；
  - `status`：可选，`pending_contract` / `pending_fulfillment` / `in_progress` / `completed` / `cancelled`。

#### `GET /orders/:id`

- **描述**：订单详情页使用。

---

### 收货地址（下单/兑换确认）

#### `GET /addresses?userId=1`

- **描述**：获取指定用户的收货地址列表（地址管理 / 地址选择页）。
- **排序规则**：默认地址在前，其余按创建时间倒序。

#### `POST /addresses`

- **请求体**

```json
{
  "userId": 1,
  "receiverName": "张三",
  "receiverPhone": "13800000000",
  "region": "北京市 朝阳区",
  "detail": "建国路88号 SOHO现代城A座10层",
  "isDefault": true
}
```

- 若 `isDefault = true`，会自动取消该用户其它默认地址。

#### `PUT /addresses/:id`

- **描述**：修改地址信息 / 设置默认地址。

#### `DELETE /addresses/:id`

- **描述**：删除地址。

---

### 优惠券（优惠券页 / 选择优惠券）

#### `GET /coupons?userId=1&status=available`

- **描述**：获取用户的优惠券列表，默认只返回可用优惠券；支持按 `status` 筛选：
  - `available`：可使用；
  - `used`：已使用；
  - `expired`：已过期。
- 请求前会自动执行一次过期检查：将已过期且仍为 `available` 的券标记为 `expired`。

#### `POST /coupons/:id/use`

- **描述**：标记某张优惠券为已使用。下单成功后调用。

---

### 积分商城与兑换记录

#### `GET /points/mall-items?type=physical`

- **描述**：获取积分商城可兑换商品列表。
- **查询参数**
  - `type` 可选：`physical`（实体商品） / `virtual`（虚拟商品），不传则返回全部。

#### `GET /points/exchange-records?userId=1`

- **描述**：获取指定用户的积分兑换记录列表。

#### `POST /points/exchange`

- **描述**：发起积分兑换（兑换确认页提交）。
- **请求体**

```json
{
  "userId": 1,
  "itemId": 1,
  "quantity": 1,
  "addressSnapshot": "张三 13800000000 北京市朝阳区建国路88号..."
}
```

- **逻辑说明**
  - 校验用户是否存在；
  - 校验积分是否足够：`user.points >= item.pointsRequired * quantity`；
  - 实体商品校验库存并扣减；虚拟商品库存视为充足；
  - 扣减用户积分；
  - 创建兑换记录：
    - `kind`：`physical` / `virtual`；
    - `status`：实体为 `pending_shipment`，虚拟为 `completed`；
    - 虚拟商品会生成简单券码字段 `code`。

---

### 开发与运行

## Project setup

```bash
cd api
npm install
```

## Compile and run the project

```bash
# 开发（监听模式）
npm run start:dev

# 或单次启动
npm run start
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
