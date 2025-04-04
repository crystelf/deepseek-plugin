import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import cfg from '../../../lib/config/config.js';
import _ from 'lodash';

const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJsonPath = resolve(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

let version = packageJson.version;
const author = packageJson.author;
let yunzaiName = cfg.package.name;
if (yunzaiName === 'miao-yunzai') {
  yunzaiName = 'Miao-Yunzai';
} else if (yunzaiName === 'yunzai') {
  yunzaiName = 'Yunzai-Bot';
} else if (yunzaiName === 'trss-yunzai') {
  yunzaiName = 'TRSS-Yunzai';
} else {
  yunzaiName = _.capitalize(yunzaiName);
}

let Version = {
  get ver() {
    return version;
  },

  get author() {
    return author;
  },

  get yunzai() {
    return yunzaiName;
  },
};

export default Version;
