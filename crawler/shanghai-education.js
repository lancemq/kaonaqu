const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { delay, saveData } = require('./utils');
const config = require('./config');

/**
 * 上海市教育委员会官网爬虫
 * 目标：抓取官方招生政策文件和通知
 */
class ShanghaiEducationCrawler {
  constructor() {
    this.baseUrl = 'http://edu.sh.gov.cn';
    this.dataDir = path.join(__dirname, '../data');
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 初始化上海教育委员会爬虫...');
    
    // 创建数据目录
    await fs.mkdir(this.dataDir, { recursive: true });
    
    // 启动浏览器
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // 设置用户代理
    await this.page.setUserAgent(config.userAgent);
    
    // 设置视口
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    console.log('✅ 浏览器初始化完成');
  }

  async crawlPolicies() {
    console.log('🔍 开始抓取招生政策...');
    
    try {
      // 访问政策页面
      await this.page.goto(`${this.baseUrl}/zwgk/zcwj/index.html`, { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // 等待页面加载
      await this.page.waitForSelector('.list-item', { timeout: 10000 });
      
      // 获取政策列表
      const policies = await this.page.evaluate(() => {
        const items = document.querySelectorAll('.list-item');
        return Array.from(items).map(item => {
          const link = item.querySelector('a');
          const date = item.querySelector('.date');
          
          return {
            title: link ? link.textContent.trim() : '',
            url: link ? link.href : '',
            date: date ? date.textContent.trim() : '',
            source: '上海市教育委员会'
          };
        }).filter(policy => policy.title && policy.url);
      });
      
      console.log(`📋 找到 ${policies.length} 条政策信息`);
      
      // 详细抓取每条政策内容
      const detailedPolicies = [];
      for (let i = 0; i < Math.min(policies.length, 20); i++) { // 限制抓取前20条
        try {
          console.log(`📄 抓取第 ${i + 1} 条政策: ${policies[i].title}`);
          
          await this.page.goto(policies[i].url, { 
            waitUntil: 'networkidle2',
            timeout: 30000
          });
          
          // 等待内容加载
          await this.page.waitForSelector('.content', { timeout: 10000 });
          
          const content = await this.page.evaluate(() => {
            const contentDiv = document.querySelector('.content');
            return contentDiv ? contentDiv.innerHTML : '';
          });
          
          detailedPolicies.push({
            ...policies[i],
            content: content,
            crawledAt: new Date().toISOString()
          });
          
          // 随机延迟，避免被反爬
          await delay(2000, 4000);
          
        } catch (error) {
          console.warn(`⚠️ 抓取政策 ${policies[i].title} 失败:`, error.message);
          detailedPolicies.push({
            ...policies[i],
            content: '',
            crawledAt: new Date().toISOString(),
            error: error.message
          });
        }
      }
      
      // 保存数据
      await saveData(detailedPolicies, path.join(this.dataDir, 'shanghai-policies.json'));
      
      console.log('✅ 招生政策抓取完成');
      return detailedPolicies;
      
    } catch (error) {
      console.error('❌ 抓取招生政策失败:', error);
      throw error;
    }
  }

  async crawlNotices() {
    console.log('🔍 开始抓取通知公告...');
    
    try {
      // 访问通知页面
      await this.page.goto(`${this.baseUrl}/zwgk/tzgg/index.html`, { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // 等待页面加载
      await this.page.waitForSelector('.list-item', { timeout: 10000 });
      
      // 获取通知列表
      const notices = await this.page.evaluate(() => {
        const items = document.querySelectorAll('.list-item');
        return Array.from(items).map(item => {
          const link = item.querySelector('a');
          const date = item.querySelector('.date');
          
          return {
            title: link ? link.textContent.trim() : '',
            url: link ? link.href : '',
            date: date ? date.textContent.trim() : '',
            source: '上海市教育委员会'
          };
        }).filter(notice => notice.title && notice.url);
      });
      
      console.log(`📋 找到 ${notices.length} 条通知信息`);
      
      // 保存通知数据
      await saveData(notices, path.join(this.dataDir, 'shanghai-notices.json'));
      
      console.log('✅ 通知公告抓取完成');
      return notices;
      
    } catch (error) {
      console.error('❌ 抓取通知公告失败:', error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ 浏览器已关闭');
    }
  }
}

module.exports = ShanghaiEducationCrawler;