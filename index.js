import Version from './components/Version.js'
import chalk from "chalk"
import { Plugin_Path, Plugin_Name, configPath, configDir, defaultConfig, defaultConfigPath} from './constants/path.js'
import fs from 'fs'
import fc from "./components/tools.js"
logger.info(chalk.rgb(134, 142, 204)(`deepseek-plugin${Version.ver}初始化~`))
const app = "/apps"
const appPath = Plugin_Path+app
const jsFiles = fc.readDirRecursive(appPath,"js")

fc.createDir("deepseek-plugin", "deepseek")

function CSH() {
  try {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      logger.mark('Deepseek 配置文件夹创建成功..');
    }

    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
      logger.mark('Deepseek 配置文件创建成功，写入默认配置..');
      logger.mark('Deepseek 初始化成功..');
    } else {
      const configFile = fs.readFileSync(configPath, 'utf8');
      const loadedConfig = JSON.parse(configFile);
      let DeepseekConfig
      DeepseekConfig = { ...defaultConfig, ...loadedConfig };
      if (JSON.stringify(DeepseekConfig) !== JSON.stringify(loadedConfig)) {
        fs.writeFileSync(configPath, JSON.stringify(DeepseekConfig, null, 2), 'utf8');
        logger.mark('Deepseek 配置文件已更新，补充配置项..');
        logger.mark('Deepseek 初始化成功..');
      } else {
        logger.mark('Deepseek 初始化成功..');
      }
    }
  } catch (error) {
    logger.error('Deepseek 初始化失败:', error);
  }
}
CSH()
let ret = jsFiles.map(file => {
  return import(`./apps/${file}`)
})

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in jsFiles) {
  let name = jsFiles[i].replace(".js", "")

  if (ret[i].status != "fulfilled") {
    logger.error(name, ret[i].reason)
    continue
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}
export { apps }

