-- 为 fa_company 增加销售人员姓名字段（合作伙伴资料提交页“你的姓名”）
-- 使用方式：mysql -u root -p baimao_admin < admin/upgrade_company_add_sales_name.sql

ALTER TABLE `fa_company`
  ADD COLUMN `sales_name` varchar(64) NOT NULL DEFAULT '' COMMENT '销售人员姓名（合作伙伴提交时填写）' AFTER `contact_phone`;

