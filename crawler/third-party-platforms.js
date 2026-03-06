const axios = require('axios');
const cheerio = require('cheerio');
const { delay, saveData, logger } = require('./utils');

/**
 * 第三方教育平台爬虫
 * 目标网站：家长帮、升学帮、学而思等教育论坛
 */

class ThirdPartyPlatformsCrawler {
  constructor() {
    this.platforms = [
      {
        name: '家长帮',
        baseUrl: 'https://www.jzb.com',
        searchUrl: '/bbs/search.php?mod=forum&searchid=',
        selectors: {
          schoolList: '.school-item',
          schoolName: '.school-name a',
          schoolInfo: '.school-info',
          location: '.school-location',
          rating: '.rating-score'
        }
      },
      {
        name: '升学帮',
        baseUrl: 'https://www.shengxuebang.com',
        searchUrl: '/search/schools?q=',
        selectors: {
          schoolList: '.school-card',
          schoolName: '.school-title a',
          schoolInfo: '.school-desc',
          location: '.school-district',
          rating: '.school-rating'
        }
      },
      {
        name: '学而思',
        baseUrl: 'https://www.xueersi.com',
        searchUrl: '/school/search?keyword=',
        selectors: {
          schoolList: '.school-item',
          schoolName: '.school-name',
          schoolInfo: '.school-intro',
          location: '.school-area',
          rating: '.school-score'
        }
      }
    ];
  }

  async crawlAllPlatforms() {
    const allSchools = [];
    
    for (const platform of this.platforms) {
      try {
        logger.info(`开始爬取 ${platform.name} 平台数据...`);
        const schools = await this.crawlPlatform(platform);
        allSchools.push(...schools);
        logger.info(`${platform.name} 平台爬取完成，获取 ${schools.length} 条学校数据`);
        
        // 避免请求过于频繁
        await delay(2000);
      } catch (error) {
        logger.error(`爬取 ${platform.name} 平台失败:`, error.message);
      }
    }
    
    return allSchools;
  }

  async crawlPlatform(platform) {
    const schools = [];
    const maxPages = 10; // 限制爬取页数
    
    for (let page = 1; page <= maxPages; page++) {
      try {
        const url = `${platform.baseUrl}${platform.searchUrl}上海&page=${page}`;
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        const schoolElements = $(platform.selectors.schoolList);
        
        if (schoolElements.length === 0) {
          // 没有更多数据，跳出循环
          break;
        }
        
        for (const element of schoolElements) {
          try {
            const $element = $(element);
            const schoolName = $element.find(platform.selectors.schoolName).text().trim();
            const schoolInfo = $element.find(platform.selectors.schoolInfo).text().trim();
            const location = $element.find(platform.selectors.location).text().trim();
            const ratingText = $element.find(platform.selectors.rating).text().trim();
            
            if (schoolName && location.includes('上海')) {
              const school = {
                name: schoolName,
                info: schoolInfo,
                location: location,
                rating: this.parseRating(ratingText),
                source: platform.name,
                crawledAt: new Date().toISOString(),
                type: 'third_party'
              };
              
              schools.push(school);
            }
          } catch (error) {
            logger.warn(`解析学校数据失败:`, error.message);
          }
        }
        
        // 避免请求过于频繁
        await delay(1000);
        
      } catch (error) {
        logger.warn(`爬取第 ${page} 页失败:`, error.message);
        // 如果连续失败，跳出循环
        if (error.code === 'ECONNABORTED' || error.response?.status >= 500) {
          break;
        }
      }
    }
    
    return schools;
  }

  parseRating(ratingText) {
    // 解析评分文本，转换为数字
    const match = ratingText.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : null;
  }

  async start() {
    logger.info('开始爬取第三方教育平台数据...');
    const schools = await this.crawlAllPlatforms();
    
    // 保存数据
    await saveData('third_party_schools.json', schools);
    
    logger.info(`第三方平台数据爬取完成，共获取 ${schools.length} 条学校数据`);
    return schools;
  }
}

module.exports = ThirdPartyPlatformsCrawler;