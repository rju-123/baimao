/**
 * 构建完成后为 mp-weixin 产物修补 project.config.json，写入 miniprogramRoot: "./"
 * 确保微信开发者工具在正确目录下能找到 app.json，避免「app.json 文件内容错误」等报错
 */
import type { PluginOption } from 'vite';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CONFIG_FILE = 'project.config.json';

function patchProjectConfig(root: string, outDir: string) {
  const outPath = join(root, outDir, CONFIG_FILE);
  if (!existsSync(outPath))
    return;
  try {
    const content = readFileSync(outPath, 'utf-8');
    const json = JSON.parse(content) as Record<string, unknown>;
    if (json.miniprogramRoot !== undefined)
      return;
    json.miniprogramRoot = './';
    writeFileSync(outPath, `${JSON.stringify(json, null, 2)}\n`, 'utf-8');
    console.log('[patch-mp-weixin] 已写入 miniprogramRoot 到 project.config.json');
  }
  catch (e) {
    console.warn('[patch-mp-weixin] 修补 project.config.json 失败:', e);
  }
}

export function PatchMpWeixinProjectConfigPlugin(): PluginOption {
  return {
    name: 'patch-mp-weixin-project-config',
    closeBundle() {
      if (process.env.UNI_PLATFORM !== 'mp-weixin')
        return;
      const root = process.cwd();
      patchProjectConfig(root, 'dist/dev/mp-weixin');
      patchProjectConfig(root, 'dist/build/mp-weixin');
    },
  };
}
