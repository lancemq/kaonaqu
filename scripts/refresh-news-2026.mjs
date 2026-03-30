import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'news.json');

const news = [
  {
    id: 'exam-2026-shmeea-sports-culture-tip',
    title: '2026年上海市普通高等学校运动训练、武术与民族传统体育专业招生文化考试考前提示',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年3月17日发布考前提示，明确该项文化考试将于3月28日至29日举行，并公布考点、准考证打印和入场要求。',
    content: '通知明确考试地点为上海音乐学院实验学校，并提醒考生于3月21日12:00后打印准考证，考试当日提前45分钟到达考点。',
    publishedAt: '2026-03-17',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/02700/20260317/20114.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'exam-2026-shmeea-calendar',
    title: '2026年度上半年上海市教育考试院各类考试信息一览表',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'zhongkao',
    summary: '上海市教育考试院于2026年3月16日发布上半年考试日程总表，覆盖中考、高考、学业水平考试、教师资格考试等关键时间节点。',
    content: '一览表汇总了3月至6月各类考试安排，其中包括5月中下旬的初中学业水平外语听说测试、理化实验操作考试和6月20日至21日的中考笔试。',
    publishedAt: '2026-03-16',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/08000/20260316/20110.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'exam-2026-shmeea-xuekao-registration',
    title: '上海市教育考试院关于做好2026年上海市普通高中学业水平考试报名工作的通知',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年3月16日发布报名通知，明确5月等级性考试和6月合格性考试报名、确认及科目安排。',
    content: '通知明确报名确认主要集中在3月26日至3月28日，并同步给出5月等级考、6月合格考和相关技能操作测试的安排。',
    publishedAt: '2026-03-16',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/08000/20260316/20109.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'admission-2026-special-education-high-school',
    title: '上海市教育委员会关于做好2026年上海市特殊教育高中阶段招生入学工作的通知',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'zhongkao',
    summary: '上海市教委于2026年3月13日发布特殊教育高中阶段招生通知，明确招生对象、报名确认和后续录取安排。',
    content: '该通知是2026年中招配套政策之一，面向特殊教育学生的高中阶段升学路径提供了明确口径和时间节点。',
    publishedAt: '2026-03-13',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育委员会',
      type: 'official',
      url: 'https://edu.sh.gov.cn/xxgk2_zdgz_rxgkyzs_03/20260312/bd228a8895d348d89023d26df0a3b143.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'admission-2026-college-self-pay',
    title: '2026年上海市部分普通高校专科层次依法自主招生网上缴费将于3月13日开始',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年3月11日提醒，已完成专科自主招生志愿填报的考生须在3月13日至14日完成网上缴费。',
    content: '该通知与前序志愿填报安排衔接，强调逾期未缴费视作志愿填报无效，是3月专科自主招生链路中的关键节点信息。',
    publishedAt: '2026-03-11',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/02600/20260311/20099.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'admission-2026-foreign-language-school-recommendation-list',
    title: '2026年上海市普通高校招生外国语中学推荐保送生资格名单公示',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'gaokao',
    summary: '上海招考热线在2026年3月上旬公示外国语中学推荐保送生资格名单，属于当年保送生通道的重要公开节点。',
    content: '该类公示信息通常与外国语中学推荐保送办法配套阅读，适合关注保送路径、资格确认和名单公示的家庭持续跟进。',
    publishedAt: '2026-03-10',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/02200/',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.92
    }
  },
  {
    id: 'exam-2026-sports-admit-ticket',
    title: '上海市2026年普通高校招生体育类专业统考准考证下载将于3月10日至13日开通',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年3月6日发布通知，体育类专业统考准考证下载时间为3月10日至13日，考试于3月14日至15日举行。',
    content: '通知说明体育类专业统考的下载打印方式、考试时间和考生注意事项，属于2026年上海高考体育类招生流程中的关键安排。',
    publishedAt: '2026-03-06',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/02500/20260306/20090.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'admission-2026-college-self-choice',
    title: '2026年上海市部分普通高校专科自主招生志愿填报即将开始',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年3月5日发布消息，专科自主招生志愿填报安排在3月7日至8日进行。',
    content: '通知同时说明后续缴费时间为3月13日至14日，是春季后半段最直接的专科自主招生流程信息。',
    publishedAt: '2026-03-05',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/02600/20260305/20085.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'admission-2026-spring-confirmation',
    title: '2026年上海市普通高校春季考试招生预录取及候补资格网上确认将于3月6日9:00开始',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'gaokao',
    summary: '上海招考热线在2026年3月上旬发布预录取及候补资格网上确认提醒，明确春招录取链路进入关键确认阶段。',
    content: '该通知主要服务于已经进入春招后段流程的考生，适合与春招志愿填报、最低控制线和院校自主测试安排一起阅读。',
    publishedAt: '2026-03-04',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/02000/index.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.92
    }
  },
  {
    id: 'exam-2026-teacher-qualification-written-tip',
    title: '上海市2026年上半年全国中小学教师资格考试（笔试）考前公告',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年3月2日发布教师资格笔试考前公告，明确考试时间安排和考前入场要求。',
    content: '公告提醒考生至少预留60分钟入场核验时间，并公布各学段笔试科目的具体考试时段。',
    publishedAt: '2026-03-02',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/05500/20260302/20080.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'admission-2026-joint-exam-hmt',
    title: '2026年普通高校联合招收华侨港澳台学生入学考试3月1日起网上报名',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'gaokao',
    summary: '上海招考热线首页在2026年2月底集中提示，全国联招报名于3月1日开始，服务于华侨、港澳台学生报考。',
    content: '这一报名链路与内地普通高考不同，适合有港澳台及华侨身份背景的考生单独关注时间、报名系统和确认方式。',
    publishedAt: '2026-02-28',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.9
    }
  },
  {
    id: 'exam-2026-zhongzhao-policy-qa',
    title: '2026年上海市高中阶段学校招生考试政策出台（附问答）',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'zhongkao',
    summary: '上海教育在2026年2月27日发布中招政策解读与问答，对考试科目、分值、录取批次和整体稳定性做了集中说明。',
    content: '这一版问答比单纯看年度文件更适合家长快速理解政策要点，也是2026年中招舆论关注度最高的官方解读之一。',
    publishedAt: '2026-02-27',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育委员会',
      type: 'official',
      url: 'https://edu.sh.gov.cn/mbjy_xwzx/20260312/5a524384d54c4c9d9547d8b7123575bb.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'exam-2026-zhongzhao-opinion',
    title: '上海市教育委员会关于2026年上海市高中阶段学校招生工作的若干意见',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'zhongkao',
    summary: '上海市教委于2026年2月27日公布年度中招工作意见，明确2026年中招整体框架、考试安排和录取批次。',
    content: '文件重申中招总分750分，外语听说和理化实验操作考试在5月中旬举行，其他笔试科目在6月20日至21日举行。',
    publishedAt: '2026-02-27',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育委员会',
      type: 'official',
      url: 'https://edu.sh.gov.cn/xxgk2_zdgz_rxgkyzs_03/20260227/923fcd6838744ca59c213daa3fb180fd.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'admission-2026-retired-soldier-college',
    title: '上海市教育委员会 上海市退役军人事务局关于做好2026年上海市部分普通高校专科层次开展依法自主招收退役士兵试点工作的通知',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'gaokao',
    summary: '上海市教委与市退役军人事务局于2026年1月29日发布通知，明确2026年专科层次依法自主招收退役士兵试点工作。',
    content: '文件明确7所试点院校参加该项目，并对报名、招生计划和实施流程做出安排。',
    publishedAt: '2026-01-29',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育委员会',
      type: 'official',
      url: 'https://edu.sh.gov.cn/xxgk2_zdgz_rxgkyzs_04/20260128/7be2e2db78f34b01a66e3146399f0864.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'exam-2026-putonghua-march-registration',
    title: '2026年3月普通话水平测试报名即将开始',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年2月10日发布普通话测试报名提醒，明确3月各批次测试时间、报名开放节点和成绩公布安排。',
    content: '公告按测试日期分批列出了在线报名时间、准考证打印方式和测试地点，适合需要参加普通话等级测试的学生及时安排报名。',
    publishedAt: '2026-02-10',
    updatedAt: '2026-03-29T12:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/08000/20260210/20068.html',
      crawledAt: '2026-03-29T12:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'admission-2026-gaokao-sports-confirmation',
    title: '2026年上海市普通高校招生体育类专业统考个人信息确认及网上付费、体育类专业招生网上咨询将于3月1日开始',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年2月3日发布体育类专业统考确认公告，明确3月1日至2日为个人信息确认和网上付费时间窗口。',
    content: '公告同步说明体育类专业招生网上咨询安排、项目确认规则和逾期未确认视为放弃统考的后果，是体育类考生3月前必须处理的关键事项。',
    publishedAt: '2026-02-03',
    updatedAt: '2026-03-29T12:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/08000/20260203/20061.html',
      crawledAt: '2026-03-29T12:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'admission-2026-spring-choice-start',
    title: '2026年上海市普通高校春季考试招生志愿填报将于1月30日9:00开始',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年1月27日发布春考志愿填报安排，填报时间为1月30日至1月31日。',
    content: '通知同时重申填报春考志愿所需的成绩条件，是春考考生最关注的节点之一。',
    publishedAt: '2026-01-27',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/02000/index.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.92
    }
  },
  {
    id: 'admission-2026-foreign-language-school-method',
    title: '关于2026年上海市部分外国语中学推荐保送生推荐办法的公示',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年1月16日公示两所外国语学校2026届外语类保送生推荐办法，是保送通道中的关键公开节点。',
    content: '公示涉及上外附中和上外浦外两校的保送生推荐办法，适合关注外语类保送路径、校内推荐规则和资格条件的家庭重点查阅。',
    publishedAt: '2026-01-16',
    updatedAt: '2026-03-29T12:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/02200/20260116/20011.html',
      crawledAt: '2026-03-29T12:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'admission-2026-spring-qa',
    title: '2026年上海市普通高校春季考试招生志愿填报及录取问答',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'gaokao',
    summary: '上海招考热线在2026年1月下旬同步发布春考志愿填报及录取问答，适合考生快速理解当年流程。',
    content: '与正式通知相比，问答版更适合梳理资格条件、填报逻辑、预录取确认和录取链路中的易错点。',
    publishedAt: '2026-01-27',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/02000/index.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.9
    }
  },
  {
    id: 'admission-2026-gaokao-supplement-registration',
    title: '2026年上海市普通高校考试招生网上补报名即将开始',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'gaokao',
    summary: '上海招考热线秋季高考栏目于2026年1月23日提示，高考网上补报名即将开始，是错过大报名考生的重要补救窗口。',
    content: '该信息属于秋季高考报名链路中的关键补充节点，尤其适合晚确认报考资格或信息的考生及时关注。',
    publishedAt: '2026-01-23',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/02200/',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.9
    }
  },
  {
    id: 'admission-2026-spring-process-sheet',
    title: '2026年上海市普通高校春季招生预录取及候补资格确认网上流程一览表发布',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年1月23日发布春招预录取及候补资格确认流程表，明确3月6日至7日不同状态考生的确认路径。',
    content: '流程表对预录取、候补资格和后续是否还能参加其他考试做了清晰说明，适合在春招后段流程中快速判断自己的操作步骤。',
    publishedAt: '2026-01-23',
    updatedAt: '2026-03-29T12:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/download/20260123/3.pdf',
      crawledAt: '2026-03-29T12:00:00+08:00',
      confidence: 0.93
    }
  },
  {
    id: 'exam-2026-ncre-registration',
    title: '上海市2026年3月（第77次）全国计算机等级考试网上报名将于3月3日开始',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'gaokao',
    summary: '上海招考热线首页在2026年1月下旬集中提示，第77次全国计算机等级考试网上报名将于3月3日开始。',
    content: '该类证书考试虽不直接属于中高考，但一直是学生与家长关注的教育考试资讯的一部分。',
    publishedAt: '2026-01-23',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/index.html?ad_check=1',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.88
    }
  },
  {
    id: 'admission-2026-spring-livestream',
    title: '2026年上海市普通高校春招政策解读及志愿填报直播宣传和网上咨询活动将于1月下旬举行',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'gaokao',
    summary: '上海招考热线在2026年1月下旬发布春招政策解读直播和网上咨询活动提醒，方便考生集中了解志愿填报细节。',
    content: '这类活动通常是理解政策、专业和院校差异的高效率入口，适合在春招志愿填报前配套阅读。',
    publishedAt: '2026-01-21',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/index.html?ad_check=1',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.88
    }
  },
  {
    id: 'exam-2026-spring-score-distribution',
    title: '2026年上海市普通高校春季考试成绩分布表',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年1月21日发布春季考试成绩分布表，提供当年分数段人数和累计人数，便于考生判断成绩位置。',
    content: '成绩分布表与最低控制线、院校自主测试资格线一起构成春招定位的核心参考材料，适合填报志愿前配套阅读。',
    publishedAt: '2026-01-21',
    updatedAt: '2026-03-29T12:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/02300/20260121/20028.html',
      crawledAt: '2026-03-29T12:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'exam-2026-spring-score-qa',
    title: '上海市教育考试院负责人就2026年春季高考成绩公布答记者问',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年1月21日就春考成绩公布、志愿填报条件和后续流程答记者问，给出了更完整的官方解释口径。',
    content: '问答中明确了春招试点院校数量、招生计划、填报资格条件和获取招生信息的主要渠道，是理解春招全流程的高价值说明材料。',
    publishedAt: '2026-01-21',
    updatedAt: '2026-03-29T12:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/02300/20260121/20029.html',
      crawledAt: '2026-03-29T12:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'admission-2026-spring-program-plan',
    title: '2026年上海市普通高校春季考试招生专业计划一览表公布',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年1月21日公布春季招生专业计划，明确各校专业、计划数、自主测试方式和相关备注。',
    content: '一览表覆盖当年参与春招的本科院校及专业安排，是考生在志愿填报前了解招生规模、专业方向和测试方式的基础资料。',
    publishedAt: '2026-01-21',
    updatedAt: '2026-03-29T12:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/download/20260121/00.pdf',
      crawledAt: '2026-03-29T12:00:00+08:00',
      confidence: 0.93
    }
  },
  {
    id: 'exam-2026-spring-cutoff-line',
    title: '2026年上海市普通高校春季考试招生志愿填报最低控制分数线确定',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年1月21日公布春季考试招生志愿填报最低控制分数线，春招进入正式填报准备阶段。',
    content: '最低控制线的公布通常意味着春招流程进入最具操作性的阶段，也是考生判断院校选择范围的重要依据。',
    publishedAt: '2026-01-21',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/02000/index.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.9
    }
  },
  {
    id: 'exam-2026-spring-score-release',
    title: '2026年上海春季高考及1月外语科目成绩发布时间公布',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院在2026年1月18日公告，春季招生统一文化考试和1月外语科目考试成绩于1月21日18:00开放查询。',
    content: '公告明确了成绩查询入口、成绩复核和成绩通知单投送安排，是春考成绩节点的重要官方信息。',
    publishedAt: '2026-01-18',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/08000/20260118/20012.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'admission-2026-zhongzhao-registration-start',
    title: '2026年本市高中阶段学校招生网上报名及信息确认将于1月19日开始',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'zhongkao',
    summary: '上海市教育考试院于2026年1月12日发布中招网上报名及信息确认通知，明确应届生报名时间为1月19日至1月30日。',
    content: '这一通知是2026年中招正式进入操作阶段的关键入口文件，家长和学生需要重点关注报名资格和信息确认安排。',
    publishedAt: '2026-01-12',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/03300/20260112/20005.html',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'exam-2026-putonghua-january-open',
    title: '2026年1月普通话水平测试即将开考',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年1月7日提醒，1月普通话水平测试临近开考，并公布测试批次、地点和成绩发布时间。',
    content: '这类测试时间安排对需要语言水平证书的学生和教师资格备考人群都很重要，尤其适合与后续普通话报名公告一起持续关注。',
    publishedAt: '2026-01-07',
    updatedAt: '2026-03-29T12:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/pthspcs/index.html',
      crawledAt: '2026-03-29T12:00:00+08:00',
      confidence: 0.9
    }
  },
  {
    id: 'exam-2026-gaokao-sports-guide',
    title: '2026年上海市普通高校招生体育类专业统考考生报考指南发布',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年1月5日发布体育类专业统考报考指南，集中说明考试项目、时间安排和报考注意事项。',
    content: '报考指南比单条通知更完整，适合体育类考生系统了解文化考试、专项技术测试和后续咨询确认流程。',
    publishedAt: '2026-01-05',
    updatedAt: '2026-03-29T12:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/02500/',
      crawledAt: '2026-03-29T12:00:00+08:00',
      confidence: 0.9
    }
  },
  {
    id: 'admission-2026-gaokao-sports-implementation',
    title: '上海市教育考试院关于印发《上海市2026年普通高校体育类专业考试招生实施办法》的通知',
    newsType: 'admission',
    category: '招生新闻',
    examType: 'gaokao',
    summary: '上海市教育考试院于2026年1月5日印发体育类专业考试招生实施办法，明确文化考试、统考项目、确认付费和录取规则。',
    content: '实施办法是体育类考生理解当年招生政策的底层文件，比后续节点提醒更系统，适合与报考指南和个人确认公告配套阅读。',
    publishedAt: '2026-01-05',
    updatedAt: '2026-03-29T12:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/06300/20260105/19986.html',
      crawledAt: '2026-03-29T12:00:00+08:00',
      confidence: 0.95
    }
  },
  {
    id: 'exam-2026-xuekao-six-subjects',
    title: '2026年1月上海市普通高中学业水平六科合格性考试即将举行',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'gaokao',
    summary: '上海招考热线高中学业考栏目在2026年1月上旬提示，1月六科合格性考试即将举行。',
    content: '这一阶段的考试提醒与后续成绩公布、春考资格衔接关系紧密，适合高中家庭重点关注。',
    publishedAt: '2026-01-07',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/02100/',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.9
    }
  },
  {
    id: 'exam-2026-spring-exam-start',
    title: '2026年上海春考、高中学业水平合格考顺利开考',
    newsType: 'exam',
    category: '考试新闻',
    examType: 'gaokao',
    summary: '上海招考热线高中学业考栏目在2026年1月初发布消息，春考与高中学业水平合格考顺利开考。',
    content: '这类节点性消息虽然不涉及政策变化，但能帮助家长和学生把握当年考试进程和后续成绩节奏。',
    publishedAt: '2026-01-03',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/02100/',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.88
    }
  },
  {
    id: 'school-2026-shs-open-info',
    title: '上海中学官网持续更新课程图谱与开放日相关入口',
    newsType: 'school',
    category: '学校动态',
    examType: 'zhongkao',
    summary: '上海中学官网当前持续保留学校概况、课程图谱和开放日相关入口，适合作为关注头部学校动态的观察窗口。',
    content: '这类学校动态不等同于正式招生政策，但对理解学校课程逻辑、培养方向和校园开放节奏很有参考价值。',
    publishedAt: '2026-03-03',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海中学官网',
      type: 'official',
      url: 'https://www.shs.cn/',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.9
    }
  },
  {
    id: 'school-2026-hsefz-news-feed',
    title: '华东师大二附中新闻速递持续更新2026学生活动与竞赛成果',
    newsType: 'school',
    category: '学校动态',
    examType: 'zhongkao',
    summary: '二附中官网新闻速递页在2026年3月持续更新初中部活动、志愿服务和竞赛成果，是学校动态观察的重要入口。',
    content: '对于关注学校氛围、竞赛表现和校园活动节奏的家庭，这类新闻流比单独一条招生通知更适合长期跟进。',
    publishedAt: '2026-03-11',
    updatedAt: '2026-03-29T11:10:00+08:00',
    source: {
      name: '华东师大二附中官网',
      type: 'official',
      url: 'https://www.hsefz.cn/news2/',
      crawledAt: '2026-03-29T11:10:00+08:00',
      confidence: 0.9
    }
  },
  {
    id: 'school-2026-sjtu-fz-campus-feed',
    title: '上海交大附中官网持续更新课程中心与校园活动信息',
    newsType: 'school',
    category: '学校动态',
    examType: 'zhongkao',
    summary: '上海交大附中官网在2026年持续更新课程中心、校园活动和学生发展信息，是观察交附本部培养风格的重要入口。',
    content: '对于关注工程科技特色、生涯规划和交附体系差异的家庭，这类持续更新的官网信息比单一招生帖更适合长期跟进。',
    publishedAt: '2026-03-08',
    updatedAt: '2026-03-29T11:10:00+08:00',
    source: {
      name: '上海交通大学附属中学官网',
      type: 'official',
      url: 'https://fz.sjtu.edu.cn/',
      crawledAt: '2026-03-29T11:10:00+08:00',
      confidence: 0.9
    }
  },
  {
    id: 'school-2026-shs-party-plan',
    title: '上海中学党委召开2026年1月工作会议 聚焦学校2026年党委工作计划',
    newsType: 'school',
    category: '学校动态',
    examType: 'zhongkao',
    summary: '上海中学官网于2026年1月14日刊发学校党委工作会议报道，内容涉及2026年重点任务、拔尖创新培养和IMO赛事筹备。',
    content: '这类校内新闻更适合作为观察头部学校年度发展重点和校园治理方向的窗口，也能帮助家长理解学校在课程与培养上的阶段性重点。',
    publishedAt: '2026-01-14',
    updatedAt: '2026-03-29T11:10:00+08:00',
    source: {
      name: '上海中学官网',
      type: 'official',
      url: 'https://www.shs.cn/info/1571/109011.htm',
      crawledAt: '2026-03-29T11:10:00+08:00',
      confidence: 0.9
    }
  },
  {
    id: 'school-2026-jianping-campus-feed',
    title: '建平中学官网保持课程与校园活动资讯更新',
    newsType: 'school',
    category: '学校动态',
    examType: 'zhongkao',
    summary: '建平中学官网在2026年持续公开课程建设、校园活动与联系方式，是浦东头部高中观察的稳定入口。',
    content: '对于准备比较浦东头部高中课程开放度和校园气质的家庭，这类官网动态比单纯看名校标签更有实际参考价值。',
    publishedAt: '2026-02-18',
    updatedAt: '2026-03-29T11:10:00+08:00',
    source: {
      name: '建平中学官网',
      type: 'official',
      url: 'https://www.jianping.com.cn/',
      crawledAt: '2026-03-29T11:10:00+08:00',
      confidence: 0.9
    }
  },
  {
    id: 'school-2026-hsefz-info',
    title: '华东师大二附中官网持续更新校区与课程信息入口',
    newsType: 'school',
    category: '学校动态',
    examType: 'zhongkao',
    summary: '华东师大二附中官网近期持续更新学校概况、校区信息与课程栏目，是头部学校动态观察的重要入口之一。',
    content: '对华二这类校区差异明显的学校而言，官网公开信息更适合用来区分本部与不同校区的课程与培养路径。',
    publishedAt: '2026-02-24',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '华东师大二附中官网',
      type: 'official',
      url: 'https://www.hsefz.cn/',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.9
    }
  },
  {
    id: 'school-2026-ses-info',
    title: '上海市实验学校官网保持学部与培养路径信息更新',
    newsType: 'school',
    category: '学校动态',
    examType: 'zhongkao',
    summary: '上海市实验学校官网持续公开学校概况、中学部和国际部等信息入口，适合长期规划型家庭持续跟进。',
    content: '对于强调贯通培养和长期发展路径的学校，这类官网更新比单条活动信息更有持续参考价值。',
    publishedAt: '2026-02-20',
    updatedAt: '2026-03-29T10:00:00+08:00',
    source: {
      name: '上海市实验学校官网',
      type: 'official',
      url: 'https://www.ses.sh.edu.cn/',
      crawledAt: '2026-03-29T10:00:00+08:00',
      confidence: 0.9
    }
  }
].sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));

fs.writeFileSync(filePath, `${JSON.stringify(news, null, 2)}\n`);
console.log(JSON.stringify({ count: news.length, first: news[0].title, last: news[news.length - 1].title }, null, 2));
