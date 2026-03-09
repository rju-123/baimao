/**
 * 重新生成微信小程序产物（单次构建）
 * 若 dist/dev/mp-weixin 或 dist/build/mp-weixin 为空，可执行：
 *   pnpm run regenerate:mp-weixin
 * 产物将输出到 dist/build/mp-weixin，可在微信开发者工具中导入该目录。
 */
const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
console.log('[regenerate-mp-weixin] 正在执行单次构建: pnpm run build:mp-weixin');
console.log('[regenerate-mp-weixin] 产物目录: dist/build/mp-weixin\n');

try {
  execSync('pnpm run build:mp-weixin', {
    stdio: 'inherit',
    cwd: root,
    shell: true,
  });
  console.log('\n[regenerate-mp-weixin] 构建完成，请在微信开发者工具中导入 front/dist/build/mp-weixin');
} catch (e) {
  console.error('\n[regenerate-mp-weixin] 构建失败，请检查控制台报错并修复后重试。');
  process.exit(1);
}
