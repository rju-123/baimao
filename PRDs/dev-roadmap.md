## 小程序 & 后台整体开发顺序表

> 目标：优先跑通“登录 → 选择公司 → 下单 → 查看订单”的完整闭环，再逐步补齐其它功能和后台管理。

---

### 阶段 1：账号与公司选择（当前进行中）

**目标**：解决“请选择公司”等基础身份问题，让任意用户都可以完成登录 + 选择公司，并正常进入下单流程。

- **1.1 登录最小闭环**
  - **前端**
    - 手机验证码登录页通过 `userStore.login` 完成登录。
    - 登录成功后，在 `userStore` 中写入：`user_id`, `user_name`, `phone`, `token`, `currentRole`。
    - 登录成功统一跳转到角色选择页 `/pages/common/role-selection/index`。
  - **后端/接口**
    - 确认 `/login` 或验证码登录接口返回字段：`id`, `name`, `phone`, `role`, `companyId` 等。
    - 若未设计 `role` 字段，前端默认 `currentRole = 'sales'`，后续可由角色选择页覆盖。

- **1.2 角色选择（销售人员优先）**
  - **前端**
    - 角色选择页仅打通“销售人员”路径，点击后：
      - 将 `currentRole` 设为 `'sales'`。
      - 跳转到公司选择页 `/pages/sales/company-selection/index`。
    - “合作伙伴”路径暂时仅做样式展示，可提示“功能开发中”。

- **1.3 公司选择与本地持久化**
  - **前端**
    - 公司列表页 `/pages/sales/company-selection/index`：
      - 优先调用后端接口 `CompanyApi.listCompanies()`，失败时用本地示例公司兜底。
      - 选择公司后在 `userStore` 中写入：`companyId`, `companyName`，必要时给默认 `user_id`，并确保 `persist: true`。
      - 选择成功后 `switchTab` 跳转到下单页 `/pages/sales/order/index`。
    - 确认购买页和下单页中，用 `userStore.companyId` 判断是否已选择公司；未选择时统一跳回公司选择页，而不只是弹 toast。
  - **后端/接口**
    - 若后端已有“用户关联公司”接口，例如 `UserApi.updateCompany(userId, companyId)`，在前端成功选择公司后尝试同步；失败也不阻塞前端流程。

---

### 阶段 2：下单主链路（列表 → 详情 → 下单 → 订单详情）

**目标**：实现从产品列表到订单详情的端到端下单流程，所有数据都来自真实接口。

- 产品列表页 `/pages/sales/order/index` 接入 `/products`，支持按 `type` 和 `status` 过滤。
- 产品详情页 `/pages/sales/product-detail/index` 接入 `/products/:id`，展示价格、库存、交付时间等。
- 确认购买页 `/pages/sales/purchase-confirm/index`：
  - 根据 `productId` 和 `quantity` 重新拉取产品信息与单价。
  - 计算“产品总额 / 优惠金额 / 实付金额”。
  - 调用创建订单接口 `OrderApi.createOrder`。
- 订单详情页 `/pages/sales/order-detail/index`：
  - 根据订单 ID 拉取订单详情。
  - 展示状态、金额、产品信息等。

---

### 阶段 3：用户侧增强功能

- 订单列表页（我的订单）：接入 `/orders`，支持按状态筛选。
- 优惠券：拉取可用优惠券列表，按门槛和类型过滤，联动确认购买页的金额计算。
- 积分 / 积分商城：积分余额、兑换记录、积分商品列表、兑换接口。
- 个人中心：展示用户与公司信息，支持退出登录。

---

### 阶段 4：后台管理系统

- 产品管理：增删改查产品，字段需与小程序使用的产品接口保持一致。
- 公司管理：维护公司基本信息、联系人等。
- 用户与角色管理：维护销售人员、合作伙伴及其角色/权限。
- 订单管理：查看订单列表、详情，更新订单状态。

