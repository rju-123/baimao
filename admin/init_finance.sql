-- =========================================
-- 财务看板：流水表结构
-- 使用方式：mysql -u root -p baimao_admin < admin/init_finance.sql
-- =========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE baimao_admin;

-- 财务流水表 fa_finance_flows
CREATE TABLE IF NOT EXISTS `fa_finance_flows` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `type` enum('receivable','payable') NOT NULL DEFAULT 'receivable' COMMENT '类型:receivable=应收,payable=应付',
  `target` varchar(255) NOT NULL DEFAULT '' COMMENT '收/付款对象',
  `order_no` varchar(64) NOT NULL DEFAULT '' COMMENT '关联订单号',
  `amount` decimal(10,2) unsigned NOT NULL DEFAULT '0.00' COMMENT '金额',
  `flow_date` date NOT NULL COMMENT '日期',
  `status` enum('pending','settled') NOT NULL DEFAULT 'pending' COMMENT '状态:pending=未结算,settled=已结算',
  `createtime` int(10) unsigned DEFAULT NULL COMMENT '创建时间',
  `updatetime` int(10) unsigned DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type_date` (`type`,`flow_date`),
  KEY `idx_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='财务流水';

-- 菜单与权限（fa_auth_rule）
SET @general_id := (SELECT `id` FROM `fa_auth_rule` WHERE `name` = 'general' LIMIT 1);
SET @general_id := IFNULL(@general_id, 0);

-- 财务看板主菜单
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @general_id, 'finance/finance', '财务看板', 'fa fa-line-chart', '', 1, 70, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'finance/finance' AND `pid` = @general_id);

-- 子权限：新增 / 编辑 / 删除
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @general_id, 'finance/finance/add', '新增流水', 'fa fa-plus', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'finance/finance/add');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @general_id, 'finance/finance/edit', '编辑流水', 'fa fa-pencil', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'finance/finance/edit');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @general_id, 'finance/finance/del', '删除流水', 'fa fa-trash', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'finance/finance/del');

SET FOREIGN_KEY_CHECKS = 1;

