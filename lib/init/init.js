import fs from "fs"
import {configDir, configPath, defaultConfig} from "#path"
import {configControl} from "#lib";

let deepseekInit = {



    CSH() {

        let deepseekConfig = configControl.getConfig()
        let mode = deepseekConfig.mode

        try {
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true })
                if(mode==="debug") {
                    logger.mark('Deepseek 配置文件夹创建成功..')
                }
            }

            if (!fs.existsSync(configPath)) {
                fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8')
                if(mode==="debug") {
                    logger.mark('Deepseek 配置文件创建成功，写入默认配置..')
                    logger.mark('Deepseek 初始化成功..')
                }
            } else {
                const configFile = fs.readFileSync(configPath, 'utf8');
                const loadedConfig = JSON.parse(configFile)
                let DeepseekConfig
                DeepseekConfig = { ...defaultConfig, ...loadedConfig }
                if (JSON.stringify(DeepseekConfig) !== JSON.stringify(loadedConfig)) {
                    fs.writeFileSync(configPath, JSON.stringify(DeepseekConfig, null, 2), 'utf8')
                    if(mode==="debug") {
                        logger.mark('Deepseek 配置文件已更新，补充配置项..')
                        logger.mark('Deepseek 初始化成功..')
                    }
                } else {
                    logger.mark('Deepseek 初始化成功..')
                }
            }
        } catch (error) {
            logger.error('Deepseek 初始化失败:', error)
        }
    }
}

export default deepseekInit;