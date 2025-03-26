import fs from 'fs'
import path from 'path'
import { configPath, defaultConfig, Plugin_Name } from '../constants/path.js'

const _path = process.cwd()
const getRoot = (root = "") => {
  if (root === "root" || root === "yunzai") {
    root = `${_path}/`
  } else if (!root) {
    root = `${_path}/plugins/${Plugin_Name}/`
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
   * @param {string} file - 文件路径
   * @param {object} data - 要合并的数据
   * @param {string} [root=""] - 根目录
   * @param {number} [space=4] - JSON缩进空格数
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

  /**
   * 合并写入JSON文件（保留原有数据）
   * @param {string} file - 文件路径
   * @param {object} data - 要合并的数据
   * @param {string} [root=""] - 根目录
   * @param {number} [space=4] - JSON缩进空格数
   * @returns {boolean} 是否写入成功
   */
  SafewriteJSON(file, data, root = "", space = 4) {
    fc.createDir(file, root, true);
    root = getRoot(root);
    const filePath = `${root}/${file}`;

    try {
      let existingData = {};
      if (fs.existsSync(filePath)) {
        try {
          existingData = JSON.parse(fs.readFileSync(filePath, 'utf8')) || {};
        } catch (e) {
          logger.warn(`无法解析现有JSON文件 ${filePath}，将创建新文件`);
        }
      }

      const mergedData = this.deepMerge(existingData, data);

      fs.writeFileSync(filePath, JSON.stringify(mergedData, null, space));
      return true;
    } catch (err) {
      logger.error(`写入JSON文件失败 ${filePath}:`, err);
      return false;
    }
  },

  /**
   * 深度合并对象
   * @param {object} target - 目标对象
   * @param {object} source - 源对象
   * @returns {object} 合并后的对象
   */
  deepMerge(target, source) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' &&
            target[key] && typeof target[key] === 'object') {
          this.deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    return target;
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
