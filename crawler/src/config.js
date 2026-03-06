/**
 * 爬虫配置文件
 */

const config = {
  // 请求配置
  request: {
    timeout: 10000, // 10秒超时
    retries: 3,     // 重试次数
    delay: 1000,    // 请求间隔（毫秒）
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },

  // 数据源配置
  sources: {
    // 上海市教委官网
    shanghaiEducation: {
      baseUrl: 'http://edu.sh.gov.cn',
      paths: {
        policies: '/xxgk/zxwj/index.html',
        admissions: '/xxgk/zsks/index.html',
        schools: '/xxgk/xxmd/index.html'
      }
    },
    
    // 各区教育局
    districts: {
      xuhui: 'http://www.xhedu.sh.cn',
      jingan: 'http://www.ja.edu.sh.cn',
      huangpu: 'http://www.hpe.sh.cn',
      pudong: 'http://www.pudong.gov.cn/jyj',
      minhang: 'http://www.mhedu.sh.cn',
      changning: 'http://www.cnedu.sh.cn',
      putuo: 'http://www.pte.sh.cn',
      hongkou: 'http://www.hkedu.sh.cn',
      yangpu: 'http://www.yp.edu.sh.cn',
      baoshan: 'http://www.eicbs.sh.cn',
      jiading: 'http://www.jiading.gov.cn/jiaoyu',
      songjiang: 'http://www.sjedu.cn',
      qingpu: 'http://www.qpedu.cn',
      fengxian: 'http://www.fx.edu.sh.cn',
      jinshan: 'http://www.jsedu.sh.cn',
      chongming: 'http://www.cmjy.sh.cn'
    },
    
    // 第三方数据源
    thirdParty: {
      jzb: 'https://sh.jzb.com',
      xueersi: 'https://www.xueersi.com',
      eol: 'https://www.eol.cn'
    }
  },

  // 输出配置
  output: {
    dataDir: './data',
    format: 'json', // json, csv, sqlite
    encoding: 'utf8'
  },

  // 日志配置
  logging: {
    level: 'info',
    file: './logs/crawler.log',
    console: true
  },

  // 反爬虫配置
  antiCrawl: {
    rotateUserAgents: true,
    randomDelays: true,
    maxConcurrentRequests: 3,
    respectRobotsTxt: true
  }
};

module.exports = config;