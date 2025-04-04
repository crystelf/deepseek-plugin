import { fc } from '#components';
import { deepseekConfigPath } from '#path';

let configCache = null;
let lastModified = 0;

const configControl = {
  getConfig() {
    try {
      const stats = fc.statSync(deepseekConfigPath, 'root');
      if (!configCache || stats.mtimeMs > lastModified) {
        configCache = fc.readJSON(deepseekConfigPath, 'root'); // 直接赋值
        lastModified = stats.mtimeMs;
      }
      return configCache;
    } catch (err) {
      console.error('读取配置失败:', err);
      return {};
    }
  },

  updateConfig(updater) {
    try {
      const config = this.getConfig();
      configCache = { ...config, ...updater };
      fc.safeWriteJSON(deepseekConfigPath, configCache, 'root', 4);
    } catch (err) {
      console.error('更新配置失败:', err);
    }
  },
};

export default configControl;
