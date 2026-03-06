#!/usr/bin/env node

/**
 * 上海各区教育局网站爬虫
 * 抓取16个行政区的教育局网站信息
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { delay, saveData, log } = require('./utils');
const config = require('./config');

// 上海16个行政区教育局网站配置
const DISTRICTS_CONFIG = {
  'pudong': {
    name: '浦东新区',
    url: 'http://www.pudong.gov.cn/jyj/',
    selectors: {
      policies: '.policy-list a',
      schools: '.school-list a',
      announcements: '.notice-list a'
    }
  },
  'huangpu': {
    name: '黄浦区', 
    url: 'http://www.huangpu.gov.cn/jyj/',
    selectors: {
      policies: '.policy-item a',
      schools: '.school-item a',
      announcements: '.notice-item a'
    }
  },
  'xuhui': {
    name: '徐汇区',
    url: 'http://www.xuhui.gov.cn/jyj/',
    selectors: {
      policies: '.policy-link',
      schools: '.school-link',
      announcements: '.notice-link'
    }
  },
  'changning': {
    name: '长宁区',
    url: 'http://www.shcn.gov.cn/jyj/',
    selectors: {
      policies: '.policy a',
      schools: '.school a',
      announcements: '.notice a'
    }
  },
  'jingan': {
    name: '静安区',
    url: 'http://www.jingan.gov.cn/jyj/',
    selectors: {
      policies: '.policy-entry a',
      schools: '.school-entry a',
      announcements: '.notice-entry a'
    }
  },
  'putuo': {
    name: '普陀区',
    url: 'http://www.shpt.gov.cn/jyj/',
    selectors: {
      policies: '.policy-box a',
      schools: '.school-box a',
      announcements: '.notice-box a'
    }
  },
  'hongkou': {
    name: '虹口区',
    url: 'http://www.shhk.gov.cn/jyj/',
    selectors: {
      policies: '.policy-content a',
      schools: '.school-content a',
      announcements: '.notice-content a'
    }
  },
  'yangpu': {
    name: '杨浦区',
    url: 'http://www.shyp.gov.cn/jyj/',
    selectors: {
      policies: '.policy-section a',
      schools: '.school-section a',
      announcements: '.notice-section a'
    }
  },
  'minhang': {
    name: '闵行区',
    url: 'http://www.shmh.gov.cn/jyj/',
    selectors: {
      policies: '.policy-area a',
      schools: '.school-area a',
      announcements: '.notice-area a'
    }
  },
  'baoshan': {
    name: '宝山区',
    url: 'http://www.shbsq.gov.cn/jyj/',
    selectors: {
      policies: '.policy-zone a',
      schools: '.school-zone a',
      announcements: '.notice-zone a'
    }
  },
  'jiading': {
    name: '嘉定区',
    url: 'http://www.jiading.gov.cn/jyj/',
    selectors: {
      policies: '.policy-region a',
      schools: '.school-region a',
      announcements: '.notice-region a'
    }
  },
  'jinshan': {
    name: '金山区',
    url: 'http://www.jinshan.gov.cn/jyj/',
    selectors: {
      policies: '.policy-district a',
      schools: '.school-district a',
      announcements: '.notice-district a'
    }
  },
  'songjiang': {
    name: '松江区',
    url: 'http://www.songjiang.gov.cn/jyj/',
    selectors: {
      policies: '.policy-county a',
      schools: '.school-county a',
      announcements: '.notice-county a'
    }
  },
  'qingpu': {
    name: '青浦区',
    url: 'http://www.shqp.gov.cn/jyj/',
    selectors: {
      policies: '.policy-town a',
      schools: '.school-town a',
      announcements: '.notice-town a'
    }
  },
  'fengxian': {
    name: '奉贤区',
    url: 'http://www.fx.gov.cn/jyj/',
    selectors: {
      policies: '.policy-village a',
      schools: '.school-village a',
      announcements: '.notice-village a'
    }
  },
  'chongming': {
    name: '崇明区',
    url: 'http://www.chongming.gov.cn/jyj/',
    selectors: {
      policies: '.policy-island a',
      schools: '.school-island a',
      announcements: '.notice-island a'
    }
  }
};

class DistrictsEducationCrawler {
  constructor() {
    this.browser = null;
    this.data = {
      districts: [],
      policies: [],
      schools: [],
      announcements: []
    };
  }

  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      log('✅ 各区教育局爬虫初始化成功');
    } catch (error) {
      log('❌ 各区教育局爬虫初始化失败:', error.message);
      throw error;
    }
  }

  async crawlDistrict(districtKey, districtConfig) {
    const { name, url, selectors } = districtConfig;
    log(`🔍 开始爬取 ${name} 教育局: ${url}`);
    
    try {
      const page = await this.browser.newPage();
      await page.setUserAgent(config.USER_AGENTS[Math.floor(Math.random() * config.USER_AGENTS.length)]);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // 爬取政策信息
      const policies = await this.extractLinks(page, selectors.policies, 'policy');
      // 爬取学校信息  
      const schools = await this.extractLinks(page, selectors.schools, 'school');
      // 爬取公告信息
      const announcements = await this.extractLinks(page, selectors.announcements, 'announcement');
      
      const districtData = {
        id: districtKey,
        name: name,
        url: url,
        policies: policies,
        schools: schools,
        announcements: announcements,
        crawledAt: new Date().toISOString()
      };
      
      this.data.districts.push(districtData);
      this.data.policies.push(...policies.map(p => ({ ...p, district: name })));
      this.data.schools.push(...schools.map(s => ({ ...s, district: name })));
      this.data.announcements.push(...announcements.map(a => ({ ...a, district: name })));
      
      log(`✅ ${name} 教育局爬取完成 (${policies.length} 政策, ${schools.length} 学校, ${announcements.length} 公告)`);
      
      await page.close();
      await delay(config.DELAY_RANGE.min + Math.random() * (config.DELAY_RANGE.max - config.DELAY_RANGE.min));
      
    } catch (error) {
      log(`❌ ${name} 教育局爬取失败:`, error.message);
    }
  }

  async extractLinks(page, selector, type) {
    try {
      const links = await page.$$eval(selector, elements => 
        elements.map(el => ({
          title: el.textContent.trim(),
          url: el.href,
          type: type
        })).filter(item => item.title && item.url)
      );
      return links;
    } catch (error) {
      log(`⚠️ 提取链接失败 (${selector}):`, error.message);
      return [];
    }
  }

  async crawlAllDistricts() {
    log('🚀 开始爬取上海16个行政区教育局...');
    
    for (const [districtKey, districtConfig] of Object.entries(DISTRICTS_CONFIG)) {
      await this.crawlDistrict(districtKey, districtConfig);
    }
    
    log('✅ 所有行政区教育局爬取完成');
    return this.data;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      log('🔒 各区教育局爬虫已关闭');
    }
  }
}

// 导出爬虫类
module.exports = DistrictsEducationCrawler;

// 如果直接运行此文件
if (require.main === module) {
  (async () => {
    const crawler = new DistrictsEducationCrawler();
    try {
      await crawler.init();
      const data = await crawler.crawlAllDistricts();
      await saveData('districts-education', data);
      log('💾 各区教育局数据已保存');
    } catch (error) {
      log('❌ 爬取过程中发生错误:', error.message);
    } finally {
      await crawler.close();
    }
  })();
}