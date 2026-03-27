@echo off
REM 执行公司表扩展迁移（解决 Unknown column 'Company.status' 错误）
REM 请根据实际 MySQL 配置修改下面的用户名和密码

set DB_USER=root
set DB_PASS=root
set DB_NAME=baimao_admin

echo 正在执行 fa_company 表扩展迁移...
mysql -u %DB_USER% -p%DB_PASS% %DB_NAME% < "%~dp0upgrade_company_partner_safe.sql"

if %ERRORLEVEL% EQU 0 (
    echo 迁移执行成功！请重启 NestJS API 服务。
) else (
    echo 迁移执行失败，请检查 MySQL 连接配置。
    echo 可编辑本文件修改 DB_USER、DB_PASS。
    pause
)
