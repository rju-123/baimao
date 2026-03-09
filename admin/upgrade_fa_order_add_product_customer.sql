-- =========================================
-- 升级脚本：为 fa_order 表添加 product_customer 列
-- 使用场景：fa_order 表是旧版脚本创建的，缺少 product_customer 列，导致下单时报 500
-- 执行方式：在 Navicat 或 MySQL 命令行执行本文件，例如：
--   mysql -u root -p baimao_admin < upgrade_fa_order_add_product_customer.sql
-- 若提示 Duplicate column name 'product_customer'，说明列已存在，可忽略。
-- =========================================

USE baimao_admin;

ALTER TABLE fa_order
  ADD COLUMN product_customer varchar(255) NOT NULL DEFAULT '' COMMENT '产品客户（来自产品表customer）' AFTER product_detail;
