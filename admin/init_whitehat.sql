-- =========================================
-- 白帽子管理：表结构 + 菜单权限
-- 执行前请确认已存在 fa_auth_rule（如已执行过 FastAdmin 安装与 init_product_order.sql）
-- 使用方式：mysql -u root -p baimao_admin < init_whitehat.sql
-- =========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE baimao_admin;

-- =========================================
-- 1. 白帽子表 fa_whitehat
-- =========================================
CREATE TABLE IF NOT EXISTS `fa_whitehat` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `code` varchar(32) NOT NULL COMMENT '白帽子编号，如 H001',
  `name` varchar(64) NOT NULL COMMENT '姓名',
  `phone` varchar(20) NOT NULL COMMENT '手机号',
  `email` varchar(128) NOT NULL COMMENT '邮箱',
  `deletetime` int(10) unsigned DEFAULT NULL COMMENT '软删除时间',
  `createtime` int(10) unsigned DEFAULT NULL COMMENT '创建时间',
  `updatetime` int(10) unsigned DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_code` (`code`),
  UNIQUE KEY `uniq_phone` (`phone`),
  KEY `idx_deletetime` (`deletetime`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='白帽子（接单员）';

-- =========================================
-- 2. 菜单与权限（fa_auth_rule）
-- =========================================
SET @general_id := (SELECT `id` FROM `fa_auth_rule` WHERE `name` = 'general' LIMIT 1);
SET @general_id := IFNULL(@general_id, 0);

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @general_id, 'whitehat', '白帽子管理', 'fa fa-user-secret', '', 1, 85, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'whitehat' AND `pid` = @general_id);

SET @whitehat_root_id := (
    SELECT `id` FROM `fa_auth_rule`
    WHERE `name` = 'whitehat' AND `pid` = @general_id
    LIMIT 1
);

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @whitehat_root_id, 'whitehat/whitehat', '白帽子列表', 'fa fa-list', '', 1, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'whitehat/whitehat');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @whitehat_root_id, 'whitehat/whitehat/add', '添加', 'fa fa-plus', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'whitehat/whitehat/add');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @whitehat_root_id, 'whitehat/whitehat/edit', '编辑', 'fa fa-pencil', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'whitehat/whitehat/edit');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @whitehat_root_id, 'whitehat/whitehat/del', '删除', 'fa fa-trash', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'whitehat/whitehat/del');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @whitehat_root_id, 'whitehat/whitehat/multi', '批量更新', 'fa fa-cogs', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'whitehat/whitehat/multi');

SET FOREIGN_KEY_CHECKS = 1;
