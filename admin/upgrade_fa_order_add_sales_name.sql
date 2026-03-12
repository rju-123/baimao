-- 为已有 fa_order 表增加销售人员姓名快照字段
-- 使用方式：mysql -u root -p baimao_admin < admin/upgrade_fa_order_add_sales_name.sql

ALTER TABLE `fa_order`
  ADD COLUMN `sales_name` varchar(64) NOT NULL DEFAULT '' COMMENT '销售人员姓名（下单时的销售快照）' AFTER `user_id`;

