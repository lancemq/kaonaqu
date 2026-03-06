/**
 * 爬虫配置文件
 * 考哪去项目 - 上海中考信息爬虫
 */

const config = {
  // 基础配置
  name: 'kaonaqu-crawler',
  version: '1.0.0',
  
  // 请求配置
  request: {
    timeout: 30000, // 30秒超时
    retries: 3,     // 重试次数
    delay: 2000,    // 请求间隔（毫秒）
    userAgent: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  },
  
  // 数据源配置
  sources: {
    // 上海市教委官网
    shanghai_edu: {
      baseUrl: 'http://edu.sh.gov.cn',
      paths: {
        policies: '/zwgk/zcwj/index.html',
        news: '/xwzx/index.html'
      }
    },
    
    // 各区教育局
    districts: {
      xuhui: 'http://www.xhedu.sh.cn',
      jingan: 'http://www.ja.edu.sh.cn',
      huangpu: 'http://www.hpe.sh.cn',
      pudong: 'http://www.pudong.gov.cn/jyj',
      minhang: 'http://www.mhedu.sh.cn',
      // 其他区...
    },
    
    // 第三方教育平台
    third_party: {
      jzb: 'https://www.jzb.com',
      shengxuebang: 'https://www.shengxuebang.com',
      xueersi: 'https://www.xueersi.com'
    }
  },
  
  // 数据存储配置
  storage: {
    outputDir: './data/output',
    format: 'json', // json, csv, sqlite
    batchSize: 100 // 批量保存大小
  },
  
  // 代理配置（可选）
  proxy: {
    enabled: false,
    list: []
  },
  
  // 日志配置
  logging: {
    level: 'info',
    file: './logs/crawler.log'
  }
};

module.exports = config;