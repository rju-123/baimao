-- 为已有 fa_order 表增加销售人员手机号快照字段
-- 使用方式：mysql -u root -p baimao_admin < admin/upgrade_fa_order_add_sales_phone.sql

ALTER TABLE `fa_order`
  ADD COLUMN `sales_phone` varchar(50) NOT NULL DEFAULT '' COMMENT '销售人员手机号（下单时的快照）' AFTER `sales_name`;

