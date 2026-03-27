-- =========================================
-- 公司表扩展：合作伙伴开票信息与审核状态
-- 执行前请确认 fa_company 已存在
-- 使用方式: mysql -u root -p baimao_admin < admin/upgrade_company_partner.sql
-- =========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE baimao_admin;

-- 1. 移除 credit_code 唯一约束（pending 记录可能重复提交）
ALTER TABLE `fa_company` DROP INDEX IF EXISTS `uniq_credit_code`;
ALTER TABLE `fa_company` ADD INDEX `idx_credit_code` (`credit_code`);

-- 2. 新增字段
ALTER TABLE `fa_company`
  ADD COLUMN `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'approved' COMMENT '审核状态' AFTER `updatetime`,
  ADD COLUMN `invoice_image_path` varchar(500) NOT NULL DEFAULT '' COMMENT '开票资料图片路径' AFTER `status`,
  ADD COLUMN `user_id` int(10) unsigned DEFAULT NULL COMMENT '关联提交人用户ID' AFTER `invoice_image_path`,
  ADD COLUMN `bank_name` varchar(255) NOT NULL DEFAULT '' COMMENT '开户银行' AFTER `user_id`,
  ADD COLUMN `bank_account` varchar(64) NOT NULL DEFAULT '' COMMENT '银行账号' AFTER `bank_name`;

-- 3. 现有记录保持 status=approved（DEFAULT 已处理）

-- 4. 审核权限（company/company/approve, company/company/reject）
SET @company_root_id := (SELECT `id` FROM `fa_auth_rule` WHERE `name` = 'company/company' LIMIT 1);
SET @company_root_id := IFNULL(@company_root_id, 0);

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @company_root_id, 'company/company/approve', '审核通过', 'fa fa-check', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'company/company/approve');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @company_root_id, 'company/company/reject', '审核驳回', 'fa fa-times', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'company/company/reject');

SET FOREIGN_KEY_CHECKS = 1;
