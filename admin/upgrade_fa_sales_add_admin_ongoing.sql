-- 为已有 fa_sales 表增加进行中订单数与管理员标识字段
-- 使用方式：mysql -u root -p baimao_admin < admin/upgrade_fa_sales_add_admin_ongoing.sql

ALTER TABLE `fa_sales`
  ADD COLUMN `ongoing_orders` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '进行中订单数' AFTER `company_id`,
  ADD COLUMN `is_admin` tinyint(1) unsigned NOT NULL DEFAULT 0 COMMENT '是否管理员 1=管理员 0=普通' AFTER `ongoing_orders`;

