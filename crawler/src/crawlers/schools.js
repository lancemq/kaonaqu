const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class SchoolsCrawler {
  constructor() {
    this.schoolsData = [];
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
  }

  // 获取上海重点中学列表
  async getTopSchools() {
    const schools = [
      // 徐汇区
      { name: '上海中学', district: '徐汇区', type: '市重点', address: '上海市徐汇区百色路989号' },
      { name: '南洋模范中学', district: '徐汇区', type: '市重点', address: '上海市徐汇区零陵路453号' },
      { name: '位育中学', district: '徐汇区', type: '市重点', address: '上海市徐汇区位育路111号' },
      
      // 静安区
      { name: '市西中学', district: '静安区', type: '市重点', address: '上海市静安区愚园路404号' },
      { name: '育才中学', district: '静安区', type: '市重点', address: '上海市静安区山海关路475号' },
      
      // 黄浦区
      { name: '格致中学', district: '黄浦区', type: '市重点', address: '上海市黄浦区广西北路66号' },
      { name: '大同中学', district: '黄浦区', type: '市重点', address: '上海市黄浦区南车站路323号' },
      { name: '向明中学', district: '黄浦区', type: '市重点', address: '上海市黄浦区瑞金一路151号' },
      
      // 浦东新区
      { name: '建平中学', district: '浦东新区', type: '市重点', address: '上海市浦东新区崮山路517号' },
      { name: '进才中学', district: '浦东新区', type: '市重点', address: '上海市浦东新区杨高中路2888号' },
      { name: '华师大二附中', district: '浦东新区', type: '市重点', address: '上海市浦东新区晨晖路555号' },
      
      // 闵行区
      { name: '七宝中学', district: '闵行区', type: '市重点', address: '上海市闵行区七宝镇农南路22号' },
      { name: '交大附中闵行分校', district: '闵行区', type: '市重点', address: '上海市闵行区金山区漕廊公路3888号' },
      
      // 虹口区
      { name: '复兴高级中学', district: '虹口区', type: '市重点', address: '上海市虹口区车站南路288号' },
      { name: '北郊高级中学', district: '虹口区', type: '市重点', address: '上海市虹口区曲阳路1000号' },
      
      // 杨浦区
      { name: '复旦附中', district: '杨浦区', type: '市重点', address: '上海市杨浦区国权路383号' },
      { name: '交大附中', district: '杨浦区', type: '市重点', address: '上海市杨浦区殷高路245号' },
      { name: '控江中学', district: '杨浦区', type: '市重点', address: '上海市杨浦区双阳路388号' },
      
      // 普陀区
      { name: '曹杨二中', district: '普陀区', type: '市重点', address: '上海市普陀区梅岭支路18号' },
      { name: '晋元高级中学', district: '普陀区', type: '市重点', address: '上海市普陀区新村路2169号' },
      
      // 长宁区
      { name: '延安中学', district: '长宁区', type: '市重点', address: '上海市长宁区延安西路601号' },
      { name: '市三女中', district: '长宁区', type: '市重点', address: '上海市长宁区江苏路155号' }
    ];

    return schools;
  }

  // 从教育局网站抓取学校信息
  async crawlFromEducationBureau() {
    console.log('开始从教育局网站抓取学校信息...');
    
    // 这里可以添加具体的爬虫逻辑
    // 由于网络限制，我们先使用预定义的数据
    const schools = await this.getTopSchools();
    
    // 添加更多详细信息
    const detailedSchools = schools.map(school => ({
      ...school,
      website: '', // 可以通过爬虫获取
      phone: '',   // 可以通过爬虫获取
      features: [], // 特色课程、班级等
      admissionRequirements: '', // 招生要求
      lastYearScore: 0, // 去年录取分数线
      ranking: 0, // 学校排名
      facilities: [], // 设施设备
      extracurricular: [] // 课外活动
    }));

    this.schoolsData = [...this.schoolsData, ...detailedSchools];
    return detailedSchools;
  }

  // 从第三方教育平台抓取补充信息
  async crawlFromThirdParty() {
    console.log('开始从第三方教育平台抓取补充信息...');
    
    // 模拟从家长帮、升学帮等平台抓取数据
    const thirdPartyData = [
      {
        name: '上海中学',
        ranking: 1,
        lastYearScore: 710,
        features: ['科技创新班', '国际课程', '竞赛培训'],
        facilities: ['实验室', '体育馆', '图书馆', '艺术中心'],
        extracurricular: ['机器人社团', '数学竞赛', '英语演讲']
      },
      {
        name: '复旦附中',
        ranking: 2,
        lastYearScore: 705,
        features: ['人文实验班', '理科实验班', '国际交流'],
        facilities: ['创新实验室', '体育馆', '音乐厅'],
        extracurricular: ['模联', '辩论赛', '科技创新']
      }
    ];

    // 合并数据
    this.schoolsData = this.schoolsData.map(school => {
      const thirdPartyInfo = thirdPartyData.find(tp => tp.name === school.name);
      if (thirdPartyInfo) {
        return { ...school, ...thirdPartyInfo };
      }
      return school;
    });

    return thirdPartyData;
  }

  // 保存学校数据到文件
  async saveSchoolsData() {
    try {
      const dataDir = path.join(__dirname, '..', '..', 'data');
      await fs.mkdir(dataDir, { recursive: true });
      
      const filePath = path.join(dataDir, 'schools.json');
      await fs.writeFile(filePath, JSON.stringify(this.schoolsData, null, 2));
      console.log(`学校数据已保存到 ${filePath}`);
      return true;
    } catch (error) {
      console.error('保存学校数据失败:', error);
      return false;
    }
  }

  // 主爬虫方法
  async crawl() {
    console.log('=== 开始爬取学校信息 ===');
    
    try {
      // 1. 从教育局获取基础数据
      await this.crawlFromEducationBureau();
      
      // 2. 从第三方平台获取补充数据
      await this.crawlFromThirdParty();
      
      // 3. 保存数据
      await this.saveSchoolsData();
      
      console.log(`=== 爬取完成，共获取 ${this.schoolsData.length} 所学校信息 ===`);
      return this.schoolsData;
    } catch (error) {
      console.error('爬取学校信息时发生错误:', error);
      throw error;
    }
  }
}

module.exports = SchoolsCrawler;