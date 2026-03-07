const path = require('path');

const DEFAULT_RAW_DIR = path.join(__dirname, '../../data/raw');
const DEFAULT_PROCESSED_DIR = path.join(__dirname, '../../data/processed');
const DEFAULT_ROOT_DATA_DIR = path.join(__dirname, '../../../data');

function resolvePath(value, fallback) {
  return value ? path.resolve(value) : fallback;
}

const RAW_DIR = resolvePath(process.env.KAONAQU_RUNTIME_RAW_DIR, DEFAULT_RAW_DIR);
const PROCESSED_DIR = resolvePath(process.env.KAONAQU_RUNTIME_PROCESSED_DIR, DEFAULT_PROCESSED_DIR);
const ROOT_DATA_DIR = resolvePath(process.env.KAONAQU_RUNTIME_ROOT_DATA_DIR, DEFAULT_ROOT_DATA_DIR);

module.exports = {
  RAW_DIR,
  PROCESSED_DIR,
  ROOT_DATA_DIR,
  DEFAULT_RAW_DIR,
  DEFAULT_PROCESSED_DIR,
  DEFAULT_ROOT_DATA_DIR
};
