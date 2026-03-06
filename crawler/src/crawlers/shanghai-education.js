#!/usr/bin/env node

/**
 * 上海市教育委员会官网爬虫
 * 抓取官方招生政策和相关文件
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class ShanghaiEducationCrawler {
  constructor() {
    this.baseUrl = 'http://edu.sh.gov.cn';
    this.outputDir = path.join(__dirname, '../../data/raw');
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
  }

  async initialize() {
    // 创建输出目录
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async crawlPolicies() {
    console.log('🔍 开始抓取上海市教委招生政策...');
    
    try {
      // 访问招生政策页面
      const response = await axios.get(`${this.baseUrl}/xxjy_zs.htm`, {
        headers: this.headers,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const policies = [];

      // 解析政策列表
      $('.list-item a').each((index, element) => {
        const title = $(element).text().trim();
        const href = $(element).attr('href');
        const date = $(element).closest('li').find('.date').text().trim();

        if (title && href) {
          policies.push({
            title,
            url: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
            date,
            source: 'shanghai-education',
            crawledAt: new Date().toISOString()
          });
        }
      });

      // 保存原始数据
      await fs.writeFile(
        path.join(this.outputDir, 'shanghai-policies.json'),
        JSON.stringify(policies, null, 2)
      );

      console.log(`✅ 成功抓取 ${policies.length} 条政策信息`);
      return policies;

    } catch (error) {
      console.error('❌ 抓取上海市教委政策失败:', error.message);
      return [];
    }
  }

  async crawlNews() {
    console.log('🔍 开始抓取上海市教委新闻动态...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/jyxw.htm`, {
        headers: this.headers,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const news = [];

      $('.list-item a').each((index, element) => {
        const title = $(element).text().trim();
        const href = $(element).attr('href');
        const date = $(element).closest('li').find('.date').text().trim();

        if (title && href) {
          news.push({
            title,
            url: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
            date,
            source: 'shanghai-education-news',
            crawledAt: new Date().toISOString()
          });
        }
      });

      await fs.writeFile(
        path.join(this.outputDir, 'shanghai-news.json'),
        JSON.stringify(news, null, 2)
      );

      console.log(`✅ 成功抓取 ${news.length} 条新闻信息`);
      return news;

    } catch (error) {
      console.error('❌ 抓取上海市教委新闻失败:', error.message);
      return [];
    }
  }
}

module.exports = ShanghaiEducationCrawler;