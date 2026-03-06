const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

// 上海16个行政区的教育局信息
const DISTRICTS = [
  { name: '黄浦区', url: 'http://www.hpe.sh.cn/' },
  { name: '徐汇区', url: 'http://www.xhedu.sh.cn/' },
  { name: '长宁区', url: 'http://www.chneic.sh.cn/' },
  { name: '静安区', url: 'http://www.jingan.gov.cn/' },
  { name: '普陀区', url: 'http://www.pte.sh.cn/' },
  { name: '虹口区', url: 'http://www.hkedu.sh.cn/' },
  { name: '杨浦区', url: 'http://www.yp.edu.sh.cn/' },
  { name: '闵行区', url: 'http://www.mhedu.sh.cn/' },
  { name: '宝山区', url: 'http://www.eicbs.sh.cn/' },
  { name: '嘉定区', url: 'http://www.jdedu.net/' },
  { name: '浦东新区', url: 'http://www.pudong.gov.cn/' },
  { name: '金山区', url: 'http://www.jsjy.sh.cn/' },
  { name: '松江区', url: 'http://www.sjedu.cn/' },
  { name: '青浦区', url: 'http://www.qpedu.cn/' },
  { name: '奉贤区', url: 'http://www.fx.edu.sh.cn/' },
  { name: '崇明区', url: 'http://www.cmjy.sh.cn/' }
];

class DistrictCrawler {
  constructor() {
    this.districtsData = [];
    this.maxRetries = 3;
    this.delay = 2000; // 2秒延迟，避免被封
  }

  async crawlDistrict(district) {
    console.log(`🔍 正在爬取 ${district.name} 教育局网站...`);
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.get(district.url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        const $ = cheerio.load(response.data);
        const districtInfo = {
          name: district.name,
          url: district.url,
          admissionPolicies: [],
          schoolLists: [],
          lastUpdated: new Date().toISOString()
        };

        // 尝试提取招生政策链接
        const policyLinks = $('a[href*="zhaosheng"], a[href*="admission"], a:contains("招生"), a:contains("入学")');
        policyLinks.each((i, elem) => {
          const link = $(elem).attr('href');
          const text = $(elem).text().trim();
          if (link && text) {
            districtInfo.admissionPolicies.push({
              title: text,
              url: link.startsWith('http') ? link : new URL(link, district.url).href
            });
          }
        });

        // 尝试提取学校列表
        const schoolLinks = $('a[href*="school"], a[href*="xuexiao"], a:contains("学校"), a:contains("中学")');
        schoolLinks.each((i, elem) => {
          const link = $(elem).attr('href');
          const text = $(elem).text().trim();
          if (link && text && text.includes('中学')) {
            districtInfo.schoolLists.push({
              name: text,
              url: link.startsWith('http') ? link : new URL(link, district.url).href
            });
          }
        });

        return districtInfo;

      } catch (error) {
        console.warn(`⚠️  第${attempt}次尝试失败 (${district.name}): ${error.message}`);
        if (attempt < this.maxRetries) {
          await this.sleep(this.delay * attempt); // 指数退避
        }
      }
    }
    
    console.error(`❌  ${district.name} 爬取失败，已达到最大重试次数`);
    return null;
  }

  async crawlAllDistricts() {
    console.log('🚀 开始爬取上海16个行政区教育局网站...');
    
    for (const district of DISTRICTS) {
      const data = await this.crawlDistrict(district);
      if (data) {
        this.districtsData.push(data);
      }
      
      // 在每个区域之间添加延迟
      await this.sleep(this.delay);
    }

    console.log(`✅ 成功爬取 ${this.districtsData.length}/${DISTRICTS.length} 个行政区`);
    return this.districtsData;
  }

  async saveData() {
    const outputPath = path.join(__dirname, '../../data/districts-education.json');
    await fs.writeFile(outputPath, JSON.stringify(this.districtsData, null, 2), 'utf8');
    console.log(`💾 数据已保存到: ${outputPath}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = DistrictCrawler;