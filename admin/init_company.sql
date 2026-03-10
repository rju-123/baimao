-- =========================================
-- 公司管理：表结构 + 菜单权限
-- 执行前请确认已存在 fa_auth_rule（如已执行过 FastAdmin 安装与 init_product_order.sql）
-- 使用方式：mysql -u root -p baimao_admin < init_company.sql
-- =========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE baimao_admin;

-- =========================================
-- 1. 公司表 fa_company
-- =========================================
CREATE TABLE IF NOT EXISTS `fa_company` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `name` varchar(255) NOT NULL COMMENT '公司名称',
  `credit_code` varchar(64) NOT NULL DEFAULT '' COMMENT '统一社会信用代码',
  `address` varchar(255) NOT NULL DEFAULT '' COMMENT '公司地址',
  `contact_name` varchar(64) NOT NULL DEFAULT '' COMMENT '联系人姓名',
  `contact_phone` varchar(32) NOT NULL DEFAULT '' COMMENT '联系人电话',
  `createtime` int(10) unsigned DEFAULT NULL COMMENT '创建时间',
  `updatetime` int(10) unsigned DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_credit_code` (`credit_code`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公司';

-- =========================================
-- 2. 菜单与权限（fa_auth_rule）
-- =========================================
SET @general_id := (SELECT `id` FROM `fa_auth_rule` WHERE `name` = 'general' LIMIT 1);
SET @general_id := IFNULL(@general_id, 0);

-- 后台左侧一级菜单：「公司管理」
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @general_id, 'company', '公司管理', 'fa fa-building', '', 1, 95, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'company' AND `pid` = @general_id);

SET @company_root_id := (
    SELECT `id` FROM `fa_auth_rule`
    WHERE `name` = 'company' AND `pid` = @general_id
    LIMIT 1
);

-- 公司列表
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @company_root_id, 'company/company', '公司列表', 'fa fa-list', '', 1, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'company/company');

-- 公司新增
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @company_root_id, 'company/company/add', '添加', 'fa fa-plus', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'company/company/add');

-- 公司编辑
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @company_root_id, 'company/company/edit', '编辑', 'fa fa-pencil', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'company/company/edit');

-- 公司删除
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @company_root_id, 'company/company/del', '删除', 'fa fa-trash', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'company/company/del');

-- 公司批量操作
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @company_root_id, 'company/company/multi', '批量更新', 'fa fa-cogs', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'company/company/multi');

SET FOREIGN_KEY_CHECKS = 1;

