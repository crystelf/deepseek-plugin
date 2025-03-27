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

  /**
   * 递归创建目录结构
   * @param {string} [path=""] - 要创建的相对路径，支持多级目录（如 "dir1/dir2"）
   * @param {string} [root=""] - 基础根目录，可选值：
   *                            - "root" 或 "yunzai": 使用 Yunzai 根目录
   *                            - 空值: 使用插件目录
   * @param {boolean} [includeFile=false] - 是否包含最后一级作为文件名
   * @example
   * fc.createDir("config/deepseek", "root") // 在 Yunzai 根目录创建 config/deepseek 目录
   */
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
   * 读取JSON文件
   * @param {string} [file=""] - JSON文件路径（相对路径）
   * @param {string} [root=""] - 基础根目录（同 createDir）
   * @returns {object} 解析后的JSON对象，如文件不存在或解析失败返回空对象
   * @example
   * const config = fc.readJSON("config.json", "root")
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
   * 写入JSON文件（完全覆盖）
   * @param {string} file - 目标文件路径
   * @param {object} data - 要写入的JSON数据
   * @param {string} [root=""] - 基础根目录（同 createDir）
   * @param {number} [space=4] - JSON格式化缩进空格数
   * @returns {boolean} 是否写入成功
   * @warning 此方法会完全覆盖目标文件原有内容
   * @example
   * fc.writeJSON("config.json", {key: "value"}, "root", 4)
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
   * 安全写入JSON文件（合并模式）
   * @param {string} file - 目标文件路径
   * @param {object} data - 要合并的数据
   * @param {string} [root=""] - 基础根目录（同 createDir）
   * @param {number} [space=4] - JSON格式化缩进空格数
   * @returns {boolean} 是否写入成功
   * @description
   * - 如果目标文件不存在，创建新文件
   * - 如果目标文件存在，深度合并新旧数据
   * - 如果目标文件损坏，会创建新文件并记录警告
   * @example
   * fc.SafewriteJSON("config.json", {newKey: "value"})
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
   * 深度合并两个对象
   * @param {object} target - 目标对象（将被修改）
   * @param {object} source - 源对象
   * @returns {object} 合并后的目标对象
   * @description
   * - 递归合并嵌套对象
   * - 对于非对象属性直接覆盖
   * - 不会合并数组（数组会被直接覆盖）
   * @example
   * const merged = fc.deepMerge({a: 1}, {b: {c: 2}})
   * // 返回 {a: 1, b: {c: 2}}
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

  /**
   * 动态导入JS模块
   * @param {string} file - 模块文件路径（可省略.js后缀）
   * @param {string} [root=""] - 基础根目录（同 createDir）
   * @returns {Promise<object>} 模块导出对象，如导入失败返回空对象
   * @description
   * - 自动添加时间戳参数防止缓存
   * - 自动补全.js后缀
   * @example
   * const module = await fc.importModule("utils/helper")
   */
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

  /**
   * 动态导入JS模块的默认导出
   * @param {string} file - 模块文件路径
   * @param {string} [root=""] - 基础根目录（同 createDir）
   * @returns {Promise<object>} 模块的默认导出，如失败返回空对象
   * @example
   * const defaultExport = await fc.importDefault("components/Header")
   */
  async importDefault(file, root) {
    let ret = await fc.importModule(file, root)
    return ret.default || {}
  },

  /**
   * 异步延时函数
   * @param {number} ms - 等待的毫秒数
   * @returns {Promise<void>}
   * @example
   * await fc.sleep(1000) // 等待1秒
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  },

  /**
   * 递归读取目录中的特定扩展名文件
   * @param {string} directory - 要搜索的目录路径
   * @param {string} extension - 文件扩展名（不带点）
   * @param {string} [excludeDir] - 要排除的目录名
   * @returns {string[]} 匹配的文件相对路径数组
   * @description
   * - 自动跳过以下划线开头的文件
   * - 结果包含子目录中的文件
   * @example
   * const jsFiles = fc.readDirRecursive("./plugins", "js", "node_modules")
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
  },

  /**
   * 生成指定范围内的随机整数
   * @param {number} min - 最小值（包含）
   * @param {number} max - 最大值（包含）
   * @returns {number} 范围内的随机整数
   * @example
   * const randomNum = fc.randomInt(1, 10) // 可能返回 5
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * 格式化日期时间
   * @param {Date|number|string} [date=new Date()] - 可接收Date对象、时间戳或日期字符串
   * @param {string} [format='YYYY-MM-DD HH:mm:ss'] - 格式模板，支持：
   *                           YYYY-年, MM-月, DD-日,
   *                           HH-时, mm-分, ss-秒
   * @returns {string} 格式化后的日期字符串
   * @example
   * fc.formatDate(new Date(), 'YYYY年MM月DD日') // "2023年08月15日"
   */
  formatDate(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    const pad = n => n.toString().padStart(2, '0');

    return format
        .replace(/YYYY/g, d.getFullYear())
        .replace(/MM/g, pad(d.getMonth() + 1))
        .replace(/DD/g, pad(d.getDate()))
        .replace(/HH/g, pad(d.getHours()))
        .replace(/mm/g, pad(d.getMinutes()))
        .replace(/ss/g, pad(d.getSeconds()));
  },

  /**
   * 深度克隆对象（支持基本类型/数组/对象/Date/RegExp）
   * @param {*} source - 要克隆的数据
   * @returns {*} 深度克隆后的副本
   * @description
   * 1. 处理循环引用
   * 2. 保持原型链
   * 3. 支持特殊对象类型（Date/RegExp等）
   * @example
   * const obj = { a: 1, b: [2, 3] };
   * const cloned = fc.deepClone(obj);
   */
  deepClone(source) {
    const cache = new WeakMap();

    const clone = (value) => {
      if (value === null || typeof value !== 'object') {
        return value;
      }

      if (cache.has(value)) {
        return cache.get(value);
      }

      if (value instanceof Date) return new Date(value);
      if (value instanceof RegExp) return new RegExp(value);

      const target = new value.constructor();
      cache.set(value, target);

      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          target[key] = clone(value[key]);
        }
      }

      return target;
    };

    return clone(source);
  },

  /**
   * 防抖函数
   * @param {Function} fn - 要执行的函数
   * @param {number} [delay=300] - 延迟时间（毫秒）
   * @param {boolean} [immediate=false] - 是否立即执行
   * @returns {Function} 防抖处理后的函数
   * @description
   * 1. immediate=true时：先立即执行，后续调用在delay时间内被忽略
   * 2. immediate=false时：延迟执行，重复调用会重置计时器
   * @example
   * window.addEventListener('resize', fc.debounce(() => {
   *   console.log('resize end');
   * }, 500));
   */
  debounce(fn, delay = 300, immediate = false) {
    let timer = null;
    return function(...args) {
      if (immediate && !timer) {
        fn.apply(this, args);
      }

      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!immediate) {
          fn.apply(this, args);
        }
        timer = null;
      }, delay);
    };
  },

  /**
   * 异步重试机制
   * @param {Function} asyncFn - 返回Promise的异步函数
   * @param {number} [maxRetries=3] - 最大重试次数
   * @param {number} [delay=1000] - 重试间隔（毫秒）
   * @param {Function} [retryCondition] - 重试条件函数(err => boolean)
   * @returns {Promise} 最终成功或失败的结果
   * @example
   * await fc.retry(fetchData, 5, 2000, err => err.status !== 404);
   */
  async retry(asyncFn, maxRetries = 3, delay = 1000, retryCondition = () => true) {
    let attempt = 0;
    let lastError;

    while (attempt <= maxRetries) {
      try {
        return await asyncFn();
      } catch (err) {
        lastError = err;
        if (attempt === maxRetries || !retryCondition(err)) {
          break;
        }
        attempt++;
        await this.sleep(delay);
      }
    }

    throw lastError;
  },

  /**
   * 将对象转换为URL查询字符串
   * @param {object} params - 参数对象
   * @param {boolean} [encode=true] - 是否进行URL编码
   * @returns {string} 查询字符串（不带问号）
   * @example
   * fc.objectToQuery({a: 1, b: 'test'}) // "a=1&b=test"
   */
  objectToQuery(params, encode = true) {
    return Object.entries(params)
        .map(([key, val]) => {
          const value = val === null || val === undefined ? '' : val;
          return `${key}=${encode ? encodeURIComponent(value) : value}`;
        })
        .join('&');
  },

  /**
   * 从错误堆栈中提取简洁的错误信息
   * @param {Error} error - 错误对象
   * @param {number} [depth=3] - 保留的堆栈深度
   * @returns {string} 格式化后的错误信息
   * @example
   * try { ... } catch(err) {
   *   logger.error(fc.formatError(err));
   * }
   */
  formatError(error, depth = 3) {
    if (!(error instanceof Error)) return String(error);

    const stack = error.stack?.split('\n') || [];
    const message = `${error.name}: ${error.message}`;

    if (stack.length <= 1) return message;

    return [
      message,
      ...stack.slice(1, depth + 1).map(line => line.trim())
    ].join('\n    at ');
  }
}

export default fc
