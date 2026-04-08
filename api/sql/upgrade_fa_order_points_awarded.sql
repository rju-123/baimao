-- 订单完成时发放积分（与 Nest OrdersService.awardCompletionPointsIfCompleted 配合，防重复发放）
-- mysql -u... -p baimao_admin < api/sql/upgrade_fa_order_points_awarded.sql

ALTER TABLE `fa_order`
  ADD COLUMN `points_awarded` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否已按完成态发放积分 0/1' AFTER `line_items_json`;
