-- 为合同产品表格动态行（方案B）新增订单行明细快照字段
-- MySQL 5.7+ 推荐使用 JSON 类型；如不支持可改为 LONGTEXT

ALTER TABLE `fa_order`
  ADD COLUMN `line_items_json` JSON NULL COMMENT '订单行明细快照（合同表格按行渲染）' AFTER `contract_url`;

