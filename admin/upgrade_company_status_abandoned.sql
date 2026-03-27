-- =========================================
-- 公司表 status 增加 abandoned 枚举值
-- 用于用户「放弃公司申请」后，findByUser 不再返回该记录
-- 使用方式: mysql -u root -p baimao_admin < admin/upgrade_company_status_abandoned.sql
-- =========================================

SET NAMES utf8mb4;

USE baimao_admin;

ALTER TABLE `fa_company`
  MODIFY COLUMN `status` enum('pending','approved','rejected','abandoned') NOT NULL DEFAULT 'approved' COMMENT '审核状态';
