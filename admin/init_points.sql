-- =========================================
-- 积分商城：表结构 + 菜单权限（FastAdmin）
-- 使用方式：mysql -u root -p baimao_admin < admin/init_points.sql
-- =========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE baimao_admin;

-- 1. 积分商城商品表 fa_points_mall_items
CREATE TABLE IF NOT EXISTS `fa_points_mall_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `name` varchar(255) NOT NULL COMMENT '商品名称',
  `type` enum('physical','virtual') NOT NULL DEFAULT 'physical' COMMENT '商品类型',
  `description` text NULL COMMENT '商品描述',
  `pointsRequired` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '所需积分',
  `stock` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '库存数量',
  `image` varchar(255) NOT NULL DEFAULT '' COMMENT '商品图片',
  `status` tinyint(1) unsigned NOT NULL DEFAULT 1 COMMENT '状态 1=上架 0=下架',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分商城商品';

-- 2. 兑换记录表 fa_exchange_records
CREATE TABLE IF NOT EXISTS `fa_exchange_records` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `userId` int(10) unsigned NOT NULL COMMENT '用户ID',
  `itemId` int(10) unsigned NOT NULL COMMENT '商品ID',
  `quantity` int(10) unsigned NOT NULL DEFAULT 1 COMMENT '数量',
  `pointsSpent` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '消耗积分',
  `addressSnapshot` text NULL COMMENT '地址快照（实体商品）',
  `kind` enum('physical','virtual') NOT NULL DEFAULT 'physical' COMMENT '兑换种类',
  `status` varchar(32) NOT NULL DEFAULT 'pending_shipment' COMMENT '发货状态',
  `code` text NULL COMMENT '虚拟商品券码',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`userId`),
  KEY `idx_item` (`itemId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分兑换记录';

-- 3. 虚拟券码批次表 fa_points_code_batches
CREATE TABLE IF NOT EXISTS `fa_points_code_batches` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `batch_code` varchar(32) NOT NULL COMMENT '批次编号',
  `item_id` int(10) unsigned NOT NULL COMMENT '关联积分商品ID',
  `item_name` varchar(255) NOT NULL DEFAULT '' COMMENT '商品名称快照',
  `filename` varchar(255) NOT NULL DEFAULT '' COMMENT '导入文件名',
  `total` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '总券码数',
  `used` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '已使用数',
  `createtime` int(10) unsigned DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_batch_code` (`batch_code`),
  KEY `idx_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='虚拟券码批次';

-- 4. 虚拟券码明细表 fa_points_codes
CREATE TABLE IF NOT EXISTS `fa_points_codes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `batch_id` int(10) unsigned NOT NULL COMMENT '批次ID',
  `item_id` int(10) unsigned NOT NULL COMMENT '商品ID',
  `code` varchar(255) NOT NULL COMMENT '券码',
  `expire_at` datetime DEFAULT NULL COMMENT '有效期',
  `remark` varchar(255) NOT NULL DEFAULT '' COMMENT '备注',
  `status` enum('unused','used','disabled') NOT NULL DEFAULT 'unused' COMMENT '状态',
  `record_id` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '关联兑换记录ID',
  `used_at` int(10) unsigned DEFAULT NULL COMMENT '使用时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_code` (`code`),
  KEY `idx_batch` (`batch_id`),
  KEY `idx_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='虚拟券码明细';

-- 5. 菜单与权限（fa_auth_rule）
SET @general_id := (SELECT `id` FROM `fa_auth_rule` WHERE `name` = 'general' LIMIT 1);
SET @general_id := IFNULL(@general_id, 0);

-- 「积分商城管理」根菜单
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @general_id, 'points', '积分商城管理', 'fa fa-gift', '', 1, 80, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'points' AND `pid` = @general_id);

SET @points_root_id := (
    SELECT `id` FROM `fa_auth_rule`
    WHERE `name` = 'points' AND `pid` = @general_id
    LIMIT 1
);

-- 商品管理
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @points_root_id, 'points/mallitem', '积分商品管理', 'fa fa-gift', '', 1, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'points/mallitem');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @points_root_id, 'points/mallitem/add', '添加', 'fa fa-plus', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'points/mallitem/add');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @points_root_id, 'points/mallitem/edit', '编辑', 'fa fa-pencil', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'points/mallitem/edit');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @points_root_id, 'points/mallitem/del', '删除', 'fa fa-trash', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'points/mallitem/del');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @points_root_id, 'points/mallitem/multi', '批量更新', 'fa fa-cogs', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'points/mallitem/multi');

-- 兑换记录管理
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @points_root_id, 'points/exchange', '兑换记录', 'fa fa-list', '', 1, -10, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'points/exchange');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @points_root_id, 'points/exchange/edit', '编辑', 'fa fa-pencil', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'points/exchange/edit');

-- 虚拟券码批次管理
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @points_root_id, 'points/codebatch', '虚拟券码管理', 'fa fa-database', '', 1, -20, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'points/codebatch');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @points_root_id, 'points/codebatch/add', '添加', 'fa fa-plus', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'points/codebatch/add');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @points_root_id, 'points/codebatch/del', '删除', 'fa fa-trash', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'points/codebatch/del');

SET FOREIGN_KEY_CHECKS = 1;

