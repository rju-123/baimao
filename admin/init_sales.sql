-- =========================================
-- 销售人员管理：表结构 + 菜单权限
-- 执行前请确认已存在 fa_auth_rule、fa_company
-- 使用方式：mysql -u root -p baimao_admin < init_sales.sql
-- =========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE baimao_admin;

-- =========================================
-- 1. 销售人员表 fa_sales（小程序端登录/选公司时同步）
-- =========================================
CREATE TABLE IF NOT EXISTS `fa_sales` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `phone` varchar(20) NOT NULL COMMENT '手机号（唯一，与小程序用户对应）',
  `name` varchar(64) NOT NULL DEFAULT '' COMMENT '姓名',
  `company_id` int(10) unsigned DEFAULT NULL COMMENT '所属公司ID',
  `ongoing_orders` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '进行中订单数',
  `is_admin` tinyint(1) unsigned NOT NULL DEFAULT 0 COMMENT '是否管理员 1=管理员 0=普通',
  `createtime` int(10) unsigned DEFAULT NULL COMMENT '创建时间',
  `updatetime` int(10) unsigned DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_phone` (`phone`),
  KEY `idx_company_id` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='销售人员（小程序同步）';

-- =========================================
-- 2. 菜单与权限（fa_auth_rule）
-- =========================================
SET @general_id := (SELECT `id` FROM `fa_auth_rule` WHERE `name` = 'general' LIMIT 1);
SET @general_id := IFNULL(@general_id, 0);

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @general_id, 'sales', '销售人员管理', 'fa fa-user-circle', '', 1, 90, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'sales' AND `pid` = @general_id);

SET @sales_root_id := (
    SELECT `id` FROM `fa_auth_rule`
    WHERE `name` = 'sales' AND `pid` = @general_id
    LIMIT 1
);

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @sales_root_id, 'sales/sales', '销售人员列表', 'fa fa-list', '', 1, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'sales/sales');

INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @sales_root_id, 'sales/sales/edit', '编辑', 'fa fa-pencil', '', 0, 0, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'sales/sales/edit');

SET FOREIGN_KEY_CHECKS = 1;
