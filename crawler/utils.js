const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

/**
 * 爬虫工具函数集合
 */

// 随机延迟函数，避免被反爬虫
async function randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

// 保存数据到文件
async function saveData(data, filename, dir = 'data') {
  const fullPath = path.join(__dirname, dir, filename);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ 数据已保存到: ${fullPath}`);
}

// 读取已存在的数据
async function loadData(filename, dir = 'data') {
  const fullPath = path.join(__dirname, dir, filename);
  try {
    const data = await fs.readFile(fullPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

// 获取随机User-Agent
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// 创建axios实例
function createAxiosInstance() {
  return axios.create({
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
    timeout: 10000,
    maxRedirects: 5
  });
}

// 数据清洗函数
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ') // 合并多个空白字符
    .replace(/^\s+|\s+$/g, '') // 去除首尾空格
    .replace(/[\r\n\t]/g, ''); // 去除换行符和制表符
}

// 格式化学校名称
function formatSchoolName(name) {
  if (!name) return '';
  // 移除常见的后缀
  return name
    .replace(/(中学|学校|初级中学|高级中学|实验学校)$/g, '')
    .trim();
}

module.exports = {
  randomDelay,
  saveData,
  loadData,
  getRandomUserAgent,
  createAxiosInstance,
  cleanText,
  formatSchoolName
};