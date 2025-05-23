import { fileURLToPath } from 'node:url';
import { basename, dirname, join } from 'node:path';
import path from 'path';
import fs from 'fs';

export const Path = process.cwd();
export const Plugin_Path = join(dirname(fileURLToPath(import.meta.url)), '..').replace(/\\/g, '/');
export const Plugin_Name = basename(Plugin_Path);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const configDir = path.resolve(__dirname, './../../../data/deepseek');
export const configPath = path.resolve(configDir, 'config.json');
export const defaultConfigPath = path.resolve(__dirname, './../config/default.json');
const configFile = fs.readFileSync(defaultConfigPath, 'utf8');
export const defaultConfig = JSON.parse(configFile);
//const README_path = `${Plugin_Path}/README.md`;
//const CHANGELOG_path = `${Plugin_Path}/CHANGELOG.md`;
export const deepseekConfigPath = 'data/deepseek/config.json';
