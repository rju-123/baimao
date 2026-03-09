-- 升级脚本：为 fa_order 表增加接单员（白帽子）相关字段
-- 使用方式：在已存在的 baimao_admin 库中执行本脚本

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE `baimao_admin`;

ALTER TABLE `fa_order`
  ADD COLUMN `whitehat_id` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '接单员ID（白帽子ID）' AFTER `customer_company`,
  ADD COLUMN `whitehat_name` varchar(255) NOT NULL DEFAULT '' COMMENT '接单员姓名（白帽子姓名快照）' AFTER `whitehat_id`,
  ADD COLUMN `whitehat_phone` varchar(50) NOT NULL DEFAULT '' COMMENT '接单员电话（白帽子手机号快照）' AFTER `whitehat_name`;

SET FOREIGN_KEY_CHECKS = 1;

