-- 为已有 fa_order 表增加电子合同相关字段
-- 使用方式：mysql -u root -p baimao_admin < admin/upgrade_fa_order_add_contract.sql

ALTER TABLE `fa_order`
  ADD COLUMN `contract_status` varchar(32) NOT NULL DEFAULT 'none' COMMENT '电子合同状态' AFTER `status`,
  ADD COLUMN `contract_url` varchar(255) NOT NULL DEFAULT '' COMMENT '电子合同PDF地址' AFTER `contract_status`;

