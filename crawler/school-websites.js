const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const { delay, saveData } = require('./utils');

/**
 * 学校官网信息爬虫
 * 抓取上海重点中学的官方网站信息
 */
class SchoolWebsiteCrawler {
  constructor() {
    this.browser = null;
    this.schools = [
      // 徐汇区
      { name: '上海中学', url: 'http://www.shs.cn/' },
      { name: '南洋模范中学', url: 'http://www.nanyangmodel.org/' },
      { name: '位育中学', url: 'http://www.weiyu.net/' },
      // 静安区
      { name: '市西中学', url: 'http://www.shixi.sh.cn/' },
      { name: '育才中学', url: 'http://www.yucaizhongxue.com/' },
      // 黄浦区
      { name: '格致中学', url: 'http://www.gezhi.sh.cn/' },
      { name: '大同中学', url: 'http://www.datong.sh.cn/' },
      { name: '向明中学', url: 'http://www.xiangming.sh.cn/' },
      // 浦东新区
      { name: '建平中学', url: 'http://www.jianping.sh.cn/' },
      { name: '进才中学', url: 'http://www.jincai.sh.cn/' },
      // 闵行区
      { name: '七宝中学', url: 'http://www.qibao.sh.cn/' },
      { name: '交大附中', url: 'http://www.jdfz.sh.cn/' },
      // 其他重点学校
      { name: '复旦附中', url: 'http://www.fdfz.cn/' },
      { name: '华师大二附中', url: 'http://www.hsefz.cn/' },
      { name: '交大附中', url: 'http://www.jdfz.sh.cn/' }
    ];
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
  }

  async extractSchoolInfo(school) {
    try {
      await this.initBrowser();
      const page = await this.browser.newPage();
      
      // 设置用户代理和视窗
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });
      
      console.log(`🔍 正在抓取 ${school.name} 信息...`);
      
      // 访问学校官网
      await page.goto(school.url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // 获取页面内容
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // 提取基本信息
      const schoolInfo = {
        name: school.name,
        officialUrl: school.url,
        district: this.getDistrictFromName(school.name),
        address: this.extractAddress($),
        phone: this.extractPhone($),
        email: this.extractEmail($),
        description: this.extractDescription($),
        features: this.extractFeatures($),
        scrapedAt: new Date().toISOString()
      };
      
      await page.close();
      await delay(2000); // 避免请求过于频繁
      
      return schoolInfo;
    } catch (error) {
      console.error(`❌ 抓取 ${school.name} 失败:`, error.message);
      return {
        name: school.name,
        officialUrl: school.url,
        district: this.getDistrictFromName(school.name),
        error: error.message,
        scrapedAt: new Date().toISOString()
      };
    }
  }

  getDistrictFromName(schoolName) {
    const districtMap = {
      '上海中学': '徐汇区',
      '南洋模范中学': '徐汇区',
      '位育中学': '徐汇区',
      '市西中学': '静安区',
      '育才中学': '静安区',
      '格致中学': '黄浦区',
      '大同中学': '黄浦区',
      '向明中学': '黄浦区',
      '建平中学': '浦东新区',
      '进才中学': '浦东新区',
      '七宝中学': '闵行区',
      '交大附中': '闵行区',
      '复旦附中': '杨浦区',
      '华师大二附中': '浦东新区'
    };
    return districtMap[schoolName] || '未知';
  }

  extractAddress($) {
    const addressSelectors = [
      '.address', '.contact-address', '.school-address',
      'p:contains("地址")', 'div:contains("地址")',
      '[class*="address"]', '[id*="address"]'
    ];
    
    for (const selector of addressSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        let text = element.text().trim();
        // 清理文本，提取纯地址
        text = text.replace(/地址[:：]?\s*/i, '').trim();
        if (text && text.length > 5) {
          return text;
        }
      }
    }
    return '';
  }

  extractPhone($) {
    const phoneSelectors = [
      '.phone', '.contact-phone', '.telephone',
      'p:contains("电话")', 'div:contains("电话")',
      '[class*="phone"]', '[id*="phone"]'
    ];
    
    for (const selector of phoneSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        let text = element.text().trim();
        // 提取电话号码
        const phoneMatch = text.match(/(\d{3,4}[-\s]?\d{7,8}|\d{11})/);
        if (phoneMatch) {
          return phoneMatch[0];
        }
      }
    }
    return '';
  }

  extractEmail($) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const bodyText = $('body').text();
    const emailMatch = bodyText.match(emailRegex);
    return emailMatch ? emailMatch[0] : '';
  }

  extractDescription($) {
    // 尝试从多个可能的位置提取学校描述
    const descSelectors = [
      '.description', '.about', '.introduction',
      '.school-desc', '.overview',
      'meta[name="description"]',
      'p:contains("学校")', 'div:contains("简介")'
    ];
    
    for (const selector of descSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        let text = element.text().trim();
        if (text && text.length > 50) {
          // 限制描述长度
          return text.substring(0, 500) + (text.length > 500 ? '...' : '');
        }
      }
    }
    return '';
  }

  extractFeatures($) {
    const features = [];
    const featureKeywords = ['特色', '课程', '实验班', '国际班', '竞赛', '体育', '艺术'];
    
    $('*').each((i, elem) => {
      const text = $(elem).text();
      featureKeywords.forEach(keyword => {
        if (text.includes(keyword) && text.length < 100) {
          features.push(text.trim());
        }
      });
    });
    
    // 去重并限制数量
    return [...new Set(features)].slice(0, 5);
  }

  async crawlAllSchools() {
    console.log('🚀 开始抓取学校官网信息...');
    const results = [];
    
    for (const school of this.schools) {
      const info = await this.extractSchoolInfo(school);
      results.push(info);
      
      // 保存到文件
      await saveData('school-websites', results);
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    console.log(`✅ 完成抓取 ${results.length} 所学校信息`);
    return results;
  }
}

module.exports = SchoolWebsiteCrawler;