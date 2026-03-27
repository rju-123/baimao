-- =========================================
-- 优惠券管理：表结构 + 菜单权限（FastAdmin）
-- 使用方式：mysql -u root -p baimao_admin < admin/init_coupon.sql
-- =========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE baimao_admin;

-- 1. coupon template
CREATE TABLE IF NOT EXISTS `fa_coupon_templates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(32) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('amount','discount','direct') NOT NULL DEFAULT 'amount',
  `value` decimal(10,2) NOT NULL DEFAULT 0,
  `minAmount` decimal(10,2) NOT NULL DEFAULT 0,
  `validFrom` datetime NOT NULL,
  `validTo` datetime NOT NULL,
  `totalQuantity` int(10) unsigned NOT NULL DEFAULT 0,
  `status` enum('not_started','in_progress','ended') NOT NULL DEFAULT 'not_started',
  `deletedAt` datetime DEFAULT NULL,
  `createtime` int(10) unsigned DEFAULT NULL,
  `updatetime` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_code` (`code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. coupon instances
CREATE TABLE IF NOT EXISTS `fa_coupons` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `companyId` int(10) unsigned NOT NULL,
  `templateId` int(10) unsigned NOT NULL,
  `userId` int(10) unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(32) NOT NULL DEFAULT 'amount',
  `value` decimal(10,2) NOT NULL DEFAULT 0,
  `minAmount` decimal(10,2) NOT NULL DEFAULT 0,
  `validFrom` datetime NOT NULL,
  `validTo` datetime NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'available',
  `lockedByUserId` int(10) unsigned DEFAULT NULL,
  `lockedForProductId` int(10) unsigned DEFAULT NULL,
  `lockedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_company` (`companyId`),
  KEY `idx_template` (`templateId`),
  KEY `idx_user` (`userId`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. menu
SET @general_id := (SELECT `id` FROM `fa_auth_rule` WHERE `name` = 'general' LIMIT 1);
SET @general_id := IFNULL(@general_id, 0);

-- 「优惠券管理」根菜单
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @general_id, 'coupon', '优惠券管理', 'fa fa-ticket', '', 1, 75, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'coupon' AND `pid` = @general_id);

SET @coupon_root_id := (
    SELECT `id` FROM `fa_auth_rule`
    WHERE `name` = 'coupon' AND `pid` = @general_id
    LIMIT 1
);

-- 优惠券模板管理
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @coupon_root_id, 'coupon/template', '优惠券模板', 'fa fa-ticket', '', 1, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'coupon/template');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @coupon_root_id, 'coupon/template/add', '添加', 'fa fa-plus', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'coupon/template/add');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @coupon_root_id, 'coupon/template/edit', '编辑', 'fa fa-pencil', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'coupon/template/edit');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @coupon_root_id, 'coupon/template/del', '删除', 'fa fa-trash', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'coupon/template/del');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @coupon_root_id, 'coupon/template/allocate', '发放', 'fa fa-share', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'coupon/template/allocate');

SET FOREIGN_KEY_CHECKS = 1;
