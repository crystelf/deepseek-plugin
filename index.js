import Version from "./components/Version.js"
import {Plugin_Name as AppName} from "./constants/path.js";
import { loadApps, logSuccess } from "./lib/load/loadApps.js"

let apps, loadedFilesCount = 0, loadedFilesCounterr = 0;
try{
    const {
        apps: loadedApps,
        loadedCount: count,
        LoadedErrCount: counterr
    } = await loadApps({ AppsName: "apps" });

    apps = loadedApps
    loadedFilesCount = count
    loadedFilesCounterr = counterr

    logSuccess(
        `${AppName} v${Version.ver} 载入成功~`,
        `作者：${Version.author}噢`,
        `共加载了 ${loadedFilesCount} 个插件文件，${loadedFilesCounterr} 个失败~`
    )
} catch(error) {
    logger.error(`${AppName}插件加载失败了：`,error);
}
