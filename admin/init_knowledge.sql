-- =========================================
-- 知识库：表结构 + 菜单权限（FastAdmin）
-- 使用方式：mysql -u root -p baimao_admin < admin/init_knowledge.sql
-- =========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE baimao_admin;

-- 知识库文章表 fa_knowledge_articles
CREATE TABLE IF NOT EXISTS `fa_knowledge_articles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `kb_no` varchar(32) NOT NULL DEFAULT '' COMMENT '文档编号',
  `title` varchar(255) NOT NULL COMMENT '标题',
  `summary` text NOT NULL COMMENT '摘要',
  `content` longtext NOT NULL COMMENT '内容',
  `status` enum('draft','published') NOT NULL DEFAULT 'draft' COMMENT '状态:draft=草稿,published=上架',
  `attachment_url` varchar(255) NOT NULL DEFAULT '' COMMENT '附件URL',
  `attachment_name` varchar(255) NOT NULL DEFAULT '' COMMENT '附件名称',
  `attachment_position` enum('head','tail') NOT NULL DEFAULT 'tail' COMMENT '附件位置:head=文章开头,tail=文章结尾',
  `createtime` int(10) unsigned DEFAULT NULL COMMENT '创建时间',
  `updatetime` int(10) unsigned DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_status_time` (`status`,`createtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识库文章';

-- 菜单与权限（fa_auth_rule）
SET @general_id := (SELECT `id` FROM `fa_auth_rule` WHERE `name` = 'general' LIMIT 1);
SET @general_id := IFNULL(@general_id, 0);

-- 「知识库管理」菜单
INSERT INTO `fa_auth_rule` (`type`,`pid`,`name`,`title`,`icon`,`condition`,`ismenu`,`weigh`,`status`)
SELECT 'file', @general_id, 'knowledge/article', '知识库管理', 'fa fa-book', '', 1, 60, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM `fa_auth_rule` WHERE `name` = 'knowledge/article' AND `pid` = @general_id);

SET FOREIGN_KEY_CHECKS = 1;

