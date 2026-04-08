-- 小程序 / API 使用的用户表（与 api/src/users/user.entity.ts 一致）
-- 若库中无此表，/auth/login 会在 INSERT 时报错并返回 500
-- 在 MySQL 中执行：mysql -u... -p baimao_admin < create_users_table.sql

CREATE TABLE IF NOT EXISTS `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `phone` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '',
  `role` varchar(255) NOT NULL DEFAULT 'sales',
  `isAdmin` tinyint(1) NOT NULL DEFAULT '0',
  `companyId` int NULL,
  `points` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_97601ac3e77a8266949322fc635` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
