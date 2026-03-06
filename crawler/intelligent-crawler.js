const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const { sleep, normalizeUrl } = require('./utils');

class IntelligentCrawler {
  constructor() {
    this.visitedUrls = new Set();
    this.targetKeywords = [
      '中考', '初中学业水平考试', '中招', '招生', '录取', 
      '分数线', '学校', '教育', '政策', '2026', '2025'
    ];
    this.data = {
      schools: [],
      policies: [],
      districts: []
    };
  }

  async crawlShanghaiEducation() {
    console.log('Starting intelligent crawl of Shanghai education websites...');
    
    // 主要目标网站
    const mainTargets = [
      'https://www.shmeea.edu.cn/',
      'https://edu.sh.gov.cn/'
    ];

    for (const url of mainTargets) {
      await this.crawlPage(url, 2); // 深度为2
    }

    // 保存数据
    await this.saveData();
    console.log('Intelligent crawl completed!');
  }

  async crawlPage(url, depth) {
    if (depth <= 0 || this.visitedUrls.has(url)) {
      return;
    }

    try {
      console.log(`Crawling: ${url} (depth: ${depth})`);
      this.visitedUrls.add(url);

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // 提取页面标题和内容
      const title = $('title').text().trim();
      const content = $('body').text();

      // 检查是否包含目标关键词
      if (this.containsTargetKeywords(title + ' ' + content)) {
        console.log(`Found relevant content at: ${url}`);
        await this.extractRelevantData($, url, title, content);
      }

      // 如果还有深度，继续爬取链接
      if (depth > 1) {
        const links = [];
        $('a[href]').each((i, elem) => {
          const href = $(elem).attr('href');
          if (href) {
            const fullUrl = normalizeUrl(href, url);
            if (fullUrl && this.isRelevantDomain(fullUrl)) {
              links.push(fullUrl);
            }
          }
        });

        // 去重并限制数量
        const uniqueLinks = [...new Set(links)].slice(0, 10);
        
        for (const link of uniqueLinks) {
          await sleep(1000); // 避免请求过快
          await this.crawlPage(link, depth - 1);
        }
      }

    } catch (error) {
      console.error(`Error crawling ${url}:`, error.message);
    }
  }

  containsTargetKeywords(text) {
    const lowerText = text.toLowerCase();
    return this.targetKeywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
  }

  isRelevantDomain(url) {
    try {
      const domain = new URL(url).hostname;
      return domain.includes('shmeea.edu.cn') || 
             domain.includes('edu.sh.gov.cn') ||
             domain.includes('shanghai.gov.cn');
    } catch {
      return false;
    }
  }

  async extractRelevantData($, url, title, content) {
    // 这里可以添加具体的提取逻辑
    // 例如：提取学校列表、政策文件、分数线等
    
    const dataItem = {
      url,
      title,
      timestamp: new Date().toISOString(),
      content: content.substring(0, 1000) + '...'
    };

    // 根据内容类型分类存储
    if (title.includes('学校') || title.includes('中学')) {
      this.data.schools.push(dataItem);
    } else if (title.includes('政策') || title.includes('招生')) {
      this.data.policies.push(dataItem);
    } else if (title.includes('区') || title.includes('区域')) {
      this.data.districts.push(dataItem);
    }
  }

  async saveData() {
    const dataDir = path.join(__dirname, 'data');
    await fs.mkdir(dataDir, { recursive: true });

    await fs.writeFile(
      path.join(dataDir, 'intelligent-crawl-results.json'),
      JSON.stringify(this.data, null, 2)
    );

    console.log(`Saved ${this.data.schools.length} schools, ${this.data.policies.length} policies, ${this.data.districts.length} districts`);
  }
}

module.exports = IntelligentCrawler;