import fs from 'fs'
import path from 'path'

const _path = process.cwd()
const plugin = "deepseek-plugin"
const getRoot = (root = "") => {
  if (root === "root" || root === "yunzai") {
    root = `${_path}/`
  } else if (!root) {
    root = `${_path}/plugins/${plugin}/`
  }
  return root
}

let fc = {

  createDir(path = "", root = "", includeFile = false) {
    root = getRoot(root)
    let pathList = path.split("/")
    let nowPath = root
    pathList.forEach((name, idx) => {
      name = name.trim()
      if (!includeFile && idx <= pathList.length - 1) {
        nowPath += name + "/"
        if (name) {
          if (!fs.existsSync(nowPath)) {
            fs.mkdirSync(nowPath)
          }
        }
      }
    })
  },

  /**
   * 读取json
   * @param file
   * @param root
   */
  readJSON(file = "", root = "") {
    root = getRoot(root)
    if (fs.existsSync(`${root}/${file}`)) {
      try {
        return JSON.parse(fs.readFileSync(`${root}/${file}`, "utf8"))
      } catch (e) {
        console.log(e)
      }
    }
    return {}
  },

  /**
   * 写JSON
   * @param file
   * @param data
   * @param root
   * @param space
   */
  writeJSON(file, data, root = "", space = 4) {
    fc.createDir(file, root, true)
    root = getRoot(root)
    try {
      fs.writeFileSync(`${root}/${file}`, JSON.stringify(data, null, space))
      return true
    } catch (err) {
      logger.error(err)
      return false
    }
  },

  async importModule(file, root = "") {
    root = getRoot(root)
    if (!/\.js$/.test(file)) {
      file = file + ".js"
    }
    if (fs.existsSync(`${root}/${file}`)) {
      try {
        let data = await import(`file://${root}/${file}?t=${new Date() * 1}`)
        return data || {}
      } catch (e) {
        console.log(e)
      }
    }
    return {}
  },

  async importDefault(file, root) {
    let ret = await fc.importModule(file, root)
    return ret.default || {}
  },

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  },

  /**
   * 读取文件夹和子文件夹指定后缀文件名
   * @param directory
   * @param extension
   * @param excludeDir
   */
  readDirRecursive(directory, extension, excludeDir) {
    let files = fs.readdirSync(directory)

    let jsFiles = files.filter(file => path.extname(file) === `.${extension}` && !file.startsWith("_"))

    files.filter(file => fs.statSync(path.join(directory, file)).isDirectory())
      .forEach(subdirectory => {
        if (subdirectory === excludeDir) {
          return
        }

        const subdirectoryPath = path.join(directory, subdirectory)
        jsFiles.push(...fc.readDirRecursive(subdirectoryPath, extension, excludeDir)
          .map(fileName => path.join(subdirectory, fileName)))
      })

    return jsFiles
  }
}

export default fc
