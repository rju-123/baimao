/**
 * @name AutoComponentsPlugin
 * @description 按需加载，自动引入
 */
import Components from 'unplugin-vue-components/vite';

export const AutoComponentsPlugin = () => {
  return Components({
    dts: 'types/components.d.ts',
    // 不将 agree-privacy 注册为全局组件，避免微信小程序编译期查找该组件导致报错（当前流程未使用）
    exclude: [/agree-privacy/],
  });
};
