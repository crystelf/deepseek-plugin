import fs from 'fs';
import chalk from 'chalk'
import {Plugin_Name as AppName} from "#components";
import {configDir, configPath,defaultConfig} from '../../constants/path.js'
import path from "path";


async function ensureConfigFile() {
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
            if (JSON.stringify(defaultConfig) !== JSON.stringify(loadedConfig)) {
                fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
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

async function traverseDIR(dir){
    try{
        const files = await fs.readdir(dir,{withFileTypes: true});
        const jsFiles = [];
        for(const file of files){
            const pathName = path.join(dir,file.name);
            if(file.isDirectory()){
                jsFiles.push(...await traverseDIR(pathName))
            }else if(file.name.endsWith(".js")){
                jsFiles.push(pathName);
            }
        }
        return jsFiles;
    } catch(error){
        logger.error("读取插件目录发生了一些错误呢:",error.message);
        return [];
    }
}

const moduleCache = new Map();
const startTime = Date.now();

async function loadApps({AppsName}){
    await ensureConfigFile();
    const filepath = path.resolve("plugins",AppName,AppsName);
    const apps = {};
    let loadedCount = 0;
    let LoadedErrCount = 0;
    const packageErr = [];

    try{
        const jsFilePaths = await traverseDIR(filepath);

        await Promise.all(jsFilePaths.map(async(item) => {
            try {
                const allExport = moduleCache.get(item) ?? await import(`file://${item}`);
                moduleCache.set(item, allExport);

                for (const [ key, value ] of Object.entries(allExport)) {
                    if (typeof value === "function" && value.prototype) {
                        if (!apps[key]) {
                            apps[key] = value;
                            loadedCount++;
                        } else {
                            logDuplicateExport(item, key);
                            LoadedErrCount++;
                        }
                    }
                }
            } catch (error) {
                logPluginError(item,error,packageErr);
                LoadedErrCount++;
            }
        }))
    } catch(error) {
        packageTips(packageErr);
        return {apps,loadedCount,LoadedErrCount};
    }
}

function logDuplicateExport(item, key) {
    logger.info(`[${AppName}] 已存在 class ${key} 同名导出: ${item}`)
}

function packageTips(packageErr) {
    if (!packageErr.length) return
    logger.error("--------- 插件加载错误 ---------")
    for (const i of packageErr) {
        const pack = i.error.stack.match(/'(.+?)'/g)[0].replace(/'/g, "")
        logger.error(`${logger.cyan(i.file.name)} 缺少依赖 ${logger.red(pack)}`)
    }
    logger.error(`请使用 ${logger.red("pnpm i")} 安装依赖`)
    logger.error(`仍报错 ${logger.red("进入插件目录")} pnpm add 依赖`)
    logger.error("--------------------------------")
}

function logErrorAndExit(...messages) {
    logger.error("-------------------------")
    messages.forEach(message => logger.error(message))
    logger.error("-------------------------")
    process.exit(1)
}

function logSuccess(...messages) {
    const endTime = Date.now()
    logger.info(chalk.rgb(253, 235, 255)("-------------------------"))
    messages.forEach(msg => logger.info(chalk.rgb(82, 242, 255)(msg)))
    logger.info(chalk.rgb(82, 242, 255)(`耗时 ${endTime - startTime} 毫秒~`))
}

function logPluginError(item, error, packageErr) {
    logger.error(`[${AppName}] 载入插件错误了.. ${chalk.red(item)}`)

    if (error.code === "ERR_MODULE_NOT_FOUND") {
        packageErr.push({
            file: { name: item },
            error
        })
    } else {
        logger.error(error)
    }
}

export { loadApps,logSuccess,logErrorAndExit};