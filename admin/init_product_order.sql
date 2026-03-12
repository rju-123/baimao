-- =========================================
-- 初始化：产品 & 订单模块（FastAdmin）
-- 使用方式：在 Navicat 新建查询粘贴执行，或在 CMD：mysql -u root -p fastadmin < init_product_order.sql
-- =========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE `USE baimao_admin`;

-- =========================================
-- 1. 创建产品表 fa_product
-- =========================================
CREATE TABLE IF NOT EXISTS `fa_product` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `name` varchar(255) NOT NULL COMMENT '名称',
  `type` enum('product','service') NOT NULL DEFAULT 'product' COMMENT '类型',
  `customer` varchar(255) NOT NULL DEFAULT '' COMMENT '客户',
  `brief` varchar(500) NOT NULL DEFAULT '' COMMENT '简介',
  `detail` text NULL COMMENT '详情',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '价格',
  `discount_price` decimal(10,2) DEFAULT NULL COMMENT '优惠价',
  `inventory` int(11) NOT NULL DEFAULT '0' COMMENT '库存',
  `delivery_time` varchar(255) DEFAULT NULL COMMENT '交付时间',
  `status` enum('active','expired') NOT NULL DEFAULT 'active' COMMENT '状态',
  `createtime` int(10) unsigned DEFAULT NULL COMMENT '创建时间',
  `updatetime` int(10) unsigned DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type_status` (`type`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品';

-- =========================================
-- 2. 创建订单表 fa_order
-- =========================================
CREATE TABLE IF NOT EXISTS `fa_order` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `order_no` varchar(64) NOT NULL COMMENT '订单号',
  `user_id` int(10) unsigned NOT NULL COMMENT '用户ID',
  `sales_name` varchar(64) NOT NULL DEFAULT '' COMMENT '销售人员姓名（下单时的销售快照）',
  `sales_phone` varchar(50) NOT NULL DEFAULT '' COMMENT '销售人员手机号（下单时的快照）',
  `company_id` int(10) unsigned DEFAULT NULL COMMENT '企业ID',
  `product_id` int(10) unsigned NOT NULL COMMENT '产品ID',
  `product_name` varchar(255) NOT NULL COMMENT '产品名称',
  `product_brief` varchar(500) NOT NULL DEFAULT '' COMMENT '产品简介',
  `product_detail` text NULL COMMENT '产品详情',
  `product_customer` varchar(255) NOT NULL DEFAULT '' COMMENT '产品客户（来自产品表customer，订单列表展示用）',
  `unit_price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '单价',
  `quantity` int(11) NOT NULL DEFAULT '1' COMMENT '数量',
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '原始金额',
  `discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '优惠金额',
  `pay_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '应付金额',
  `customer_name` varchar(255) NOT NULL DEFAULT '' COMMENT '客户姓名',
  `customer_phone` varchar(50) NOT NULL DEFAULT '' COMMENT '客户电话',
  `customer_company` varchar(255) NOT NULL DEFAULT '' COMMENT '客户公司',
  `whitehat_id` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '接单员ID（白帽子ID）',
  `whitehat_name` varchar(255) NOT NULL DEFAULT '' COMMENT '接单员姓名（白帽子姓名快照）',
  `whitehat_phone` varchar(50) NOT NULL DEFAULT '' COMMENT '接单员电话（白帽子手机号快照）',
  `status` varchar(32) NOT NULL DEFAULT 'pending_contract' COMMENT '状态',
  `contract_status` varchar(32) NOT NULL DEFAULT 'none' COMMENT '电子合同状态',
  `contract_url` varchar(255) NOT NULL DEFAULT '' COMMENT '电子合同PDF地址',
  `createtime` int(10) unsigned DEFAULT NULL COMMENT '创建时间',
  `updatetime` int(10) unsigned DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_order_no` (`order_no`),
  KEY `idx_user` (`user_id`),
  KEY `idx_product` (`product_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单';

-- =========================================
-- 3. 初始化菜单 & 权限（fa_auth_rule）
-- =========================================

SET @general_id := (SELECT `id` FROM `fa_auth_rule` WHERE `name` = 'general' LIMIT 1);
SET @general_id := IFNULL(@general_id, 0);

-- 产品管理根菜单
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @general_id, 'product', '产品管理', 'fa fa-cubes', '', 1, 100, 'normal'
WHERE NOT EXISTS (
    SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'product' AND `pid` = @general_id
);

SET @product_root_id := (
    SELECT `id` FROM `fa_auth_rule`
    WHERE `name` = 'product' AND `pid` = @general_id
    LIMIT 1
);

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @product_root_id, 'product/product', '产品列表', 'fa fa-cube', '', 1, 99, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'product/product');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @product_root_id, 'product/product/add', '添加', 'fa fa-plus', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'product/product/add');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @product_root_id, 'product/product/edit', '编辑', 'fa fa-pencil', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'product/product/edit');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @product_root_id, 'product/product/del', '删除', 'fa fa-trash', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'product/product/del');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @product_root_id, 'product/product/multi', '批量更新', 'fa fa-cogs', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'product/product/multi');

-- 订单管理根菜单
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @general_id, 'order', '订单管理', 'fa fa-file-text', '', 1, 90, 'normal'
WHERE NOT EXISTS (
    SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'order' AND `pid` = @general_id
);

SET @order_root_id := (
    SELECT `id` FROM `fa_auth_rule`
    WHERE `name` = 'order' AND `pid` = @general_id
    LIMIT 1
);

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @order_root_id, 'order/order', '订单列表', 'fa fa-file-text-o', '', 1, 89, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'order/order');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @order_root_id, 'order/order/add', '添加', 'fa fa-plus', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'order/order/add');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @order_root_id, 'order/order/edit', '编辑', 'fa fa-pencil', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'order/order/edit');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @order_root_id, 'order/order/del', '删除', 'fa fa-trash', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'order/order/del');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @order_root_id, 'order/order/multi', '批量更新', 'fa fa-cogs', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'order/order/multi');

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================
-- 已有库升级说明：
-- 1）若 fa_order 表已存在且无 product_customer 列，请执行：
--    ALTER TABLE fa_order ADD COLUMN product_customer varchar(255) NOT NULL DEFAULT '' COMMENT '产品客户（来自产品表customer）' AFTER product_detail;
-- 2）若 fa_order 表已存在且无 whitehat_* 接单员字段，请执行：
--    参考 upgrade_fa_order_add_whitehat.sql 脚本，为 fa_order 增加 whitehat_id/whitehat_name/whitehat_phone 三个字段。
-- =========================================
