-- =========================================
-- 公司表扩展：合作伙伴开票信息与审核状态（可重复执行）
-- 执行前请确认 fa_company 已存在
-- 使用方式: mysql -u root -p baimao_admin < admin/upgrade_company_partner_safe.sql
-- =========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE baimao_admin;

-- 1. 移除 credit_code 唯一约束（若存在）
SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fa_company' AND INDEX_NAME = 'uniq_credit_code');
SET @sql = IF(@exist > 0, 'ALTER TABLE `fa_company` DROP INDEX `uniq_credit_code`', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加 credit_code 普通索引（若不存在）
SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fa_company' AND INDEX_NAME = 'idx_credit_code');
SET @sql = IF(@exist = 0, 'ALTER TABLE `fa_company` ADD INDEX `idx_credit_code` (`credit_code`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 新增 status 字段（若不存在）
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fa_company' AND COLUMN_NAME = 'status');
SET @sql = IF(@exist = 0, 
  'ALTER TABLE `fa_company` ADD COLUMN `status` enum(''pending'',''approved'',''rejected'') NOT NULL DEFAULT ''approved'' COMMENT ''审核状态'' AFTER `updatetime`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 新增 invoice_image_path 字段（若不存在）
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fa_company' AND COLUMN_NAME = 'invoice_image_path');
SET @sql = IF(@exist = 0, 
  'ALTER TABLE `fa_company` ADD COLUMN `invoice_image_path` varchar(500) NOT NULL DEFAULT '''' COMMENT ''开票资料图片路径'' AFTER `status`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 新增 user_id 字段（若不存在）
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fa_company' AND COLUMN_NAME = 'user_id');
SET @sql = IF(@exist = 0, 
  'ALTER TABLE `fa_company` ADD COLUMN `user_id` int(10) unsigned DEFAULT NULL COMMENT ''关联提交人用户ID'' AFTER `invoice_image_path`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. 新增 bank_name 字段（若不存在）
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fa_company' AND COLUMN_NAME = 'bank_name');
SET @sql = IF(@exist = 0, 
  'ALTER TABLE `fa_company` ADD COLUMN `bank_name` varchar(255) NOT NULL DEFAULT '''' COMMENT ''开户银行'' AFTER `user_id`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. 新增 bank_account 字段（若不存在）
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fa_company' AND COLUMN_NAME = 'bank_account');
SET @sql = IF(@exist = 0, 
  'ALTER TABLE `fa_company` ADD COLUMN `bank_account` varchar(64) NOT NULL DEFAULT '''' COMMENT ''银行账号'' AFTER `bank_name`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. 审核权限（company/company/approve, company/company/reject）
SET @company_root_id := (SELECT `id` FROM `fa_auth_rule` WHERE `name` = 'company/company' LIMIT 1);
SET @company_root_id := IFNULL(@company_root_id, 0);

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @company_root_id, 'company/company/approve', '审核通过', 'fa fa-check', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'company/company/approve');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @company_root_id, 'company/company/reject', '审核驳回', 'fa fa-times', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'company/company/reject');

SET FOREIGN_KEY_CHECKS = 1;
