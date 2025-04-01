import {Version} from '#components'
import chalk from "chalk"
import { Plugin_Path} from '#path'
import {fc} from "#components"
import {deepseekInit} from "#lib";

logger.info(chalk.rgb(134, 142, 204)(`deepseek-plugin${Version.ver}初始化~`))

const app = "/apps"
const appPath = Plugin_Path+app
const jsFiles = fc.readDirRecursive(appPath,"js")

deepseekInit.CSH()

let ret = jsFiles.map(file => {
  return import(`./apps/${file}`)
})

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in jsFiles) {
  let name = jsFiles[i].replace(".js", "")

  if (ret[i].status !== "fulfilled") {
    logger.error(name, ret[i].reason)
    continue
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}

export { apps }

