/**
 * 考哪去项目 - 目标URL配置
 * 上海中考相关信息源列表
 */

const TARGET_URLS = {
  // 官方教育机构
  official: {
    shanghaiEducation: 'https://edu.sh.gov.cn/',
    shanghaiExam: 'https://www.shmeea.edu.cn/',
    shanghaiExamNews: 'https://www.shmeea.edu.cn/page/01000/index.html',
    middleSchoolAdmission: 'https://www.shmeea.edu.cn/page/01100/20241108/1923.html'
  },
  
  // 各区教育局网站
  districts: {
    xuhui: 'http://www.xhedu.sh.cn/',
    jingan: 'https://www.jingan.gov.cn/jyj/',
    huangpu: 'http://www.hpe.sh.cn/',
    pudong: 'http://www.pudong.gov.cn/jyj/',
    minhang: 'http://www.mhedu.sh.cn/',
    changning: 'http://www.chneic.sh.cn/',
    putuo: 'http://www.pteic.sh.cn/',
    hongkou: 'http://www.hkedu.sh.cn/',
    yangpu: 'http://www.ypjy.edu.sh.cn/',
    baoshan: 'http://www.eicbs.sh.cn/',
    jiading: 'http://www.jiading.gov.cn/jiaoyu/',
    songjiang: 'http://www.sjedu.cn/',
    qingpu: 'http://www.qpedu.cn/',
    fengxian: 'http://www.fxjy.gov.cn/',
    chongming: 'http://www.cmjy.sh.cn/',
    jinshan: 'http://www.jsjy.sh.cn/'
  },
  
  // 第三方教育平台
  thirdParty: {
    jzb: 'https://www.jzb.com/',
    shengxuebang: 'https://www.shengxuebang.com/',
    xueersi: 'https://www.xueersi.com/'
  },
  
  // 学校官网（重点中学示例）
  schools: {
    // 徐汇区
    nanyang: 'http://www.nanyangmodelsh.edu.sh.cn/',
    weiyu: 'http://www.weiyu.sh.cn/',
    // 静安区
    shanghaiNo1: 'http://www.sh1zh.sh.cn/',
    // 浦东新区
    jianping: 'http://www.jianping.sh.cn/',
    // 黄浦区
    gezhi: 'http://www.gezhi.sh.cn/',
    // 闵行区
    qibao: 'http://www.qibao.sh.cn/'
  }
};

module.exports = TARGET_URLS;