const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// 导入关键词
const { zhongkaoKeywords, schoolKeywords, districtKeywords } = require('./keywords');

class IntelligentCrawler {
  constructor() {
    this.visitedUrls = new Set();
    this.relevantPages = [];
    this.maxDepth = 2;
    this.delay = 1000; // 1秒延迟，避免被封
  }

  async fetchPage(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error.message);
      return null;
    }
  }

  extractLinks(html, baseUrl) {
    const dom = new JDOM(html);
    const links = [];
    const anchorTags = dom.window.document.querySelectorAll('a[href]');
    
    for (const anchor of anchorTags) {
      const href = anchor.getAttribute('href');
      if (href) {
        let fullUrl;
        if (href.startsWith('http')) {
          fullUrl = href;
        } else if (href.startsWith('/')) {
          const urlObj = new URL(baseUrl);
          fullUrl = urlObj.origin + href;
        } else {
          fullUrl = baseUrl + '/' + href;
        }
        links.push(fullUrl);
      }
    }
    return links;
  }

  isRelevantContent(html) {
    const text = html.toLowerCase();
    
    // 检查是否包含中考相关关键词
    for (const keyword of zhongkaoKeywords) {
      if (text.includes(keyword)) {
        return true;
      }
    }
    
    // 检查是否包含学校相关关键词
    let schoolCount = 0;
    for (const keyword of schoolKeywords) {
      if (text.includes(keyword)) {
        schoolCount++;
      }
    }
    
    // 检查是否包含区域相关关键词
    let districtCount = 0;
    for (const keyword of districtKeywords) {
      if (text.includes(keyword)) {
        districtCount++;
      }
    }
    
    // 如果同时包含学校和区域关键词，也认为是相关的
    if (schoolCount >= 2 && districtCount >= 1) {
      return true;
    }
    
    return false;
  }

  async crawlUrl(url, depth = 0) {
    if (depth > this.maxDepth || this.visitedUrls.has(url)) {
      return;
    }
    
    console.log(`Crawling: ${url} (depth: ${depth})`);
    this.visitedUrls.add(url);
    
    const html = await this.fetchPage(url);
    if (!html) {
      return;
    }
    
    // 检查页面是否相关
    if (this.isRelevantContent(html)) {
      console.log(`✅ Found relevant page: ${url}`);
      this.relevantPages.push({
        url: url,
        content: html,
        timestamp: new Date().toISOString()
      });
      
      // 保存原始HTML
      const filename = `raw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.html`;
      fs.writeFileSync(
        path.join(__dirname, 'data', 'raw', filename),
        html
      );
    }
    
    // 如果还没达到最大深度，继续爬取链接
    if (depth < this.maxDepth) {
      const links = this.extractLinks(html, url);
      for (const link of links) {
        // 只爬取同一域名的链接
        if (link.includes('shmeea.edu.cn') || link.includes('edu.sh.gov.cn')) {
          await this.crawlUrl(link, depth + 1);
          // 添加延迟
          await new Promise(resolve => setTimeout(resolve, this.delay));
        }
      }
    }
  }

  async start() {
    console.log('Starting intelligent crawl...');
    
    // 创建数据目录
    if (!fs.existsSync(path.join(__dirname, 'data', 'raw'))) {
      fs.mkdirSync(path.join(__dirname, 'data', 'raw'), { recursive: true });
    }
    
    // 起始URL列表
    const startUrls = [
      'https://www.shmeea.edu.cn/',
      'https://edu.sh.gov.cn/',
      'https://www.shmeea.edu.cn/page/02000/index.html',
      'https://www.shmeea.edu.cn/page/01100/20241108/1923.html'
    ];
    
    for (const url of startUrls) {
      await this.crawlUrl(url);
    }
    
    console.log(`\nCrawling completed! Found ${this.relevantPages.length} relevant pages.`);
    
    // 保存结果
    fs.writeFileSync(
      path.join(__dirname, 'data', 'relevant-pages.json'),
      JSON.stringify(this.relevantPages, null, 2)
    );
    
    return this.relevantPages;
  }
}

module.exports = IntelligentCrawler;