import fs from 'fs';
import path from 'path';
import { isHighInterestSchoolName } from '../lib/school-enrichment-config.mjs';
import { buildSchoolMarkdown, getSchoolContentAbsolutePath, getSchoolContentRelativePath } from '../lib/school-content-files.mjs';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const DETAIL_FIELDS = ['schoolDescription', 'admissionRequirements', 'schoolHighlights', 'suitableStudents', 'applicationTips'];

const overrides = {
  '上海中学': {
    schoolDescription: '上海中学是徐汇区辨识度最高的头部学校之一，学校长期围绕拔尖创新人才早期培养组织课程与活动，课程图谱、研究性学习、大学先修和现代创新实验室建设都是它最有代表性的办学看点。对于同时关注上中本部、国际部资源和高水平课程环境的家庭，这所学校通常会被放在第一梯队重点比较。',
    admissionRequirements: '如果主要关注高中升学，建议重点跟进上海当年统一招生、自主招生和学校开放日信息；如果关注初中口径，则要单独区分本部初中阶段与其他体系学校，不建议把“上中系”学校混为一谈。学校每年公开活动关注度很高，适合尽早留意官网通知。',
    schoolHighlights: [
      '课程图谱体系成熟，覆盖学习领域课程、资优生课程和优势潜能开发课程。',
      '研究型学习、竞赛课程和现代创新实验室资源是学校最核心的辨识度。',
      '本部与国际部资源联动明显，适合同时关注国内升学和国际课程视野的家庭。',
      '学校公开活动与开放日关注度一直很高，信息更新通常以官网为准。'
    ],
    suitableStudents: '适合学业基础强、主动性高、愿意投入研究性学习、竞赛探索或拔尖创新培养路径的学生，也适合希望尽早规划国内顶尖高校升学或国际化课程环境的家庭。',
    applicationTips: '先分清你关注的是上中本部高中录取、初中培养还是“上中系”其他学校，再判断是否匹配。学校信息更新速度快，建议优先看官网通知、开放日安排和招生口径，不要只凭外部经验贴做决定。',
    website: 'https://www.shs.cn/',
    source: {
      name: '上海中学官网',
      type: 'official',
      url: 'https://www.shs.cn/xxgk/spsz.htm',
      crawledAt: '2026-03-26T10:00:00+08:00',
      confidence: 0.95
    },
    updatedAt: '2026-03-26T10:00:00+08:00'
  },
  '华东师范大学第二附属中学': {
    schoolDescription: '华东师范大学第二附属中学是上海头部高中里科技创新和卓越人才培养特征最鲜明的一所。学校以“追求卓越，培养创造未来的人”为主线推进卓越教育，卓越学院、科技创新课程、领导力与研究型学习是最有代表性的关键词。',
    admissionRequirements: '华二的关注重点通常不只是分数本身，还包括学校的课程适配度、竞赛与科创氛围，以及本部和不同校区之间的区别。建议同时跟进统一招生、自主招生、开放日和校区信息，避免把本部、紫竹和普陀等校区口径混看。',
    schoolHighlights: [
      '卓越教育与卓越学院体系完整，拔尖创新培养辨识度很高。',
      '科技创新、学科竞赛、研究性课程和领导力培养是学校强项。',
      '本部之外还有紫竹、普陀等校区，比较时要注意校区差异。',
      '官网信息更新活跃，校园导览、课程和咨询活动入口较完整。'
    ],
    suitableStudents: '适合对科技创新、学科拓展、研究型学习和高强度课程环境有明确期待的学生，也适合愿意花时间区分华二不同校区培养路径的家庭。',
    applicationTips: '建议把“学校实力”和“具体校区口径”分开看。关注华二时，最好同步核对本部与各校区的招生安排、课程特色和开放日信息，再做判断。',
    website: 'https://www.hsefz.cn/',
    source: {
      name: '华东师大二附中官网',
      type: 'official',
      url: 'https://www.hsefz.cn/',
      crawledAt: '2026-03-26T10:00:00+08:00',
      confidence: 0.95
    },
    updatedAt: '2026-03-26T10:00:00+08:00'
  },
  '复旦大学附属中学': {
    schoolDescription: '复旦大学附属中学在上海头部高中里兼具大学附属背景、寄宿制办学和国际部资源三重辨识度。学校整体气质偏重人文与科技并举，既适合关注综合学术发展，也适合关注住宿管理、大学资源和国际化延展的家庭。',
    admissionRequirements: '关注复附时，除了分数和招生计划，还应把寄宿安排、课程节奏、大学附属资源和国际部口径一起看。学校整体关注度高，适合同步跟进当年中招、自招和学校公开说明。',
    schoolHighlights: [
      '复旦大学附属背景明显，大学资源联动是学校的重要吸引点。',
      '寄宿制办学和国际部资源并存，学校管理与学习节奏相对完整。',
      '人文与科技并重，适合不希望只走单一学科路线的学生。',
      '家长比较时通常会同时关注复附本部气质和生活管理适配度。'
    ],
    suitableStudents: '适合希望在高水平学术环境中获得更完整住宿管理、大学附属资源和综合发展机会的学生，也适合对学校整体人文氛围和国际视野有要求的家庭。',
    applicationTips: '建议重点看学校当年的中招和自招安排，并结合寄宿条件、课程节奏和个人适应度一起判断。对于复附这类学校，只看“头部名校”标签通常不够。',
    website: 'http://www.fdfz.cn/',
    source: {
      name: '复旦附中官网',
      type: 'official',
      url: 'http://www.fdfz.cn/',
      crawledAt: '2026-03-26T10:00:00+08:00',
      confidence: 0.92
    },
    updatedAt: '2026-03-26T10:00:00+08:00'
  },
  '上海交通大学附属中学': {
    schoolDescription: '上海交通大学附属中学的核心辨识度在于工程科技取向、创新人才培养和较成熟的课程中心建设。学校在科技、工程、生涯规划和多样化校本课程方面有很强标签，是交附体系里最值得优先了解的主校入口。',
    admissionRequirements: '关注交附时，建议把本部、嘉定分校、浦东实验高中等体系学校分开看。本部适合重点跟进统一招生、自主招生、课程特色和校园开放活动，比较时不要简单把“交附系”学校放在一个口径里判断。',
    schoolHighlights: [
      '学校以创新人才培养为主线，工程科技特色鲜明。',
      '八大课程中心和较成熟的生涯规划体系是重要看点。',
      '交附体系学校较多，主校与分校、实验高中要分开判断。',
      '官网已公开本部联系方式，适合继续核对最新活动与招生说明。'
    ],
    suitableStudents: '适合对工程科技、创新课程、生涯规划和校本课程选择更敏感的学生，也适合愿意细分比较交附本部与分校差异的家庭。',
    applicationTips: '先确认你关注的是交附本部还是交附体系其他学校，再进一步比对招生口径、课程安排和地理位置。交附本部信息建议优先以官网公开内容为准。',
    address: '上海市宝山区殷高路42号',
    phone: '021-65911245',
    website: 'https://fz.sjtu.edu.cn/',
    source: {
      name: '上海交通大学附属中学官网',
      type: 'official',
      url: 'https://fz.sjtu.edu.cn/jrjz/lxwm.htm',
      crawledAt: '2026-03-26T10:00:00+08:00',
      confidence: 0.95
    },
    updatedAt: '2026-03-26T10:00:00+08:00'
  },
  '上海市建平中学': {
    schoolDescription: '建平中学是浦东长期关注度很高的头部高中之一，学校的课程选择空间、科技创新活动和国际理解教育一直是家长讨论度较高的部分。相比只看“市重点”标签，建平更值得从课程开放度、活动平台和校风气质去理解。',
    admissionRequirements: '建平适合结合统一招生、自主招生、学校课程特色和校区口径一起看。学校还有北校区等信息露出，比较时建议先确认你关注的是主校本部还是其他关联校区。',
    schoolHighlights: [
      '课程开放度和选修空间较强，适合希望有更多课程选择的学生。',
      '科技创新活动和国际理解教育是学校较稳定的关注点。',
      '浦东家长关注度高，常被放在区域头部高中比较序列里。',
      '官网已公开本部联系方式，便于继续跟进活动和通知。'
    ],
    suitableStudents: '适合希望在高水平公办高中里兼顾课程选择、科技活动、综合素养和国际视野的学生，也适合更重视学校整体成长环境而不只看单一分数标签的家庭。',
    applicationTips: '建议同时核对建平主校、北校区和相关分校口径，不要把不同办学单元混看。正式比较时，最好把课程、活动平台、区位和当年招生计划放在一起判断。',
    address: '上海市浦东新区崮山路517号',
    phone: '021-58851542',
    website: 'https://www.jianping.com.cn/',
    source: {
      name: '建平中学官网',
      type: 'official',
      url: 'https://www.jianping.com.cn/web/index1.html?cid=133&id=1411',
      crawledAt: '2026-03-26T10:00:00+08:00',
      confidence: 0.95
    },
    updatedAt: '2026-03-26T10:00:00+08:00'
  },
  '上海市七宝中学': {
    schoolDescription: '七宝中学是闵行区最有代表性的头部高中之一，学校在人文见长的同时，科技创新教育和寄宿制管理也长期被家长反复提及。它的优势不是单一标签，而是整体办学完成度高、集团化影响力强。',
    admissionRequirements: '关注七宝时，建议把七宝中学本部、浦江分校以及七宝教育集团内其他学校分开看。本部更适合重点跟进中招、自招、住宿安排和学校公开活动，不建议简单把“七宝系”学校并成一个判断口径。',
    schoolHighlights: [
      '人文见长与科创活动并重，是七宝中学最稳定的学校辨识度。',
      '学校长期处于上海头部高中讨论序列，区域影响力和集团影响力都很强。',
      '高标准现代化寄宿制办学是很多家庭会单独比较的一项因素。',
      '查看七宝时，最好把本部、浦江分校和集团学校拆开理解。'
    ],
    suitableStudents: '适合希望在高水平公办高中里兼顾学术、人文、科创和相对完整校园管理体验的学生，也适合愿意细看本部与分校差异的家庭。',
    applicationTips: '正式比较时，建议把住宿安排、课程节奏、集团校差异和当年招生计划一起看。七宝系学校很多，先把对象学校确认清楚会省很多时间。',
    address: '上海市闵行区七宝镇农南路22号',
    phone: '021-64592100',
    website: 'http://qbzx.icampus.cn/',
    source: {
      name: '上海市七宝中学公开资料',
      type: 'third_party',
      url: 'https://zh.wikipedia.org/wiki/%E4%B8%8A%E6%B5%B7%E5%B8%82%E4%B8%83%E5%AE%9D%E4%B8%AD%E5%AD%A6',
      crawledAt: '2026-03-26T10:00:00+08:00',
      confidence: 0.78
    },
    updatedAt: '2026-03-26T10:00:00+08:00'
  },
  '上海市实验学校': {
    schoolDescription: '上海市实验学校最突出的辨识度是十年一贯弹性学制和贯通培养逻辑。它不是典型的单一学段学校，而是强调课程衔接、个性潜能开发和更长期的人才培养视角，因此特别适合放在\u201c长期规划型\u201d学校里看。',
    admissionRequirements: '关注上实时，建议把不同学部和校区的信息分开确认，尤其要分清中学部、本部相关学段和国际部口径。对这类学校来说，理解其培养逻辑通常比只看某一年招生结果更重要。',
    schoolHighlights: [
      '十年一贯弹性学制是学校最核心的辨识度。',
      '课程衔接、贯通培养和个性潜能开发是学校长期主线。',
      '更适合长期规划型家庭，而不是只看单一年级结果。',
      '学校官网提供中学部和国际部等多条信息入口，便于继续细分查看。'
    ],
    suitableStudents: '适合希望更早规划初高中衔接、关注长期培养路径、重视课程连贯性和个体发展节奏的家庭，也适合愿意花时间理解学校培养逻辑的家长。',
    applicationTips: '比较上实时，建议不要把它简单当作普通初中或普通高中来看，而要分清具体学部、校区和学段口径。后续最好继续核对官网公开的学部信息和咨询安排。',
    website: 'https://www.ses.sh.edu.cn/',
    source: {
      name: '上海市实验学校官网',
      type: 'official',
      url: 'https://www.ses.sh.edu.cn/web/syxy/5190002.htm',
      crawledAt: '2026-03-26T10:00:00+08:00',
      confidence: 0.95
    },
    updatedAt: '2026-03-26T10:00:00+08:00'
  },
  '上海市南洋模范中学': {
    schoolDescription: '南洋模范中学是徐汇区历史最悠久的高关注度高中之一，以\u201c勤、俭、敬、信\u201d为校训，在理工创新、篮球传统和交响乐三大特色方向上均有稳定辨识度。学校整体气质偏重严谨学风与多元发展并存，适合理工基础好但又不想放弃文体特长的学生。',
    admissionRequirements: '南模在中招统一招生和自主招生两个入口都有较高关注度。建议同步跟进当年的中招计划和自主招生安排，特别是创新实验班的选拔条件和篮球队/交响乐团的专项招生信息。',
    schoolHighlights: [
      '百年校史，徐汇区历史最悠久的重点中学之一。',
      '理工创新实验班以数理竞赛和科研项目为核心培养路径。',
      '篮球传统与交响乐特色是学校最稳定的非学术辨识度。',
      '与上海中学等同区头部学校的比较是家长最常做的功课。'
    ],
    suitableStudents: '适合学业基础扎实、同时希望在理工竞赛、篮球特长或交响乐等领域获得发展平台的学生，也适合看重学校历史底蕴和学风传承的家庭。',
    applicationTips: '关注南模时，建议把创新班选拔、体育/艺术特长招生和统一招生三条路径分开研究，再根据孩子优势判断哪条路径匹配度更高。',
    address: '上海市徐汇区零陵路453号',
    phone: '021-64176824',
    website: 'https://www.nanmo.cn/',
    source: {
      name: '南洋模范中学官网',
      type: 'official',
      url: 'https://www.nanmo.cn/',
      crawledAt: '2026-04-01T10:00:00+08:00',
      confidence: 0.92
    },
    updatedAt: '2026-04-01T10:00:00+08:00'
  },
  '上海市格致中学': {
    schoolDescription: '格致中学是中国近代最早系统传播自然科学的新式学堂之一，理科特色和实验教学传统是其最核心的辨识度。学校拥有上海市中学唯一的天文台和古籍修复实验室等独特资源，理科实验班在物理、天文方向的培养路径成熟。',
    admissionRequirements: '格致的理科实验班和特色课程是家长最关注的招生亮点。建议重点关注学校的自主招生方案和理科实验班选拔安排，同时留意黄浦区名额分配政策变化对录取的影响。',
    schoolHighlights: [
      '百年科学教育传统，理科实验班培养路径成熟。',
      '拥有上海市中学唯一的天文台，天文课程体系独特。',
      '古籍修复实验室等跨学科资源拓展了人文科技融合空间。',
      '黄浦区头部学校比较中通常与大同中学一起被讨论。'
    ],
    suitableStudents: '适合理科兴趣明确、对天文/物理等基础学科有持续热情的学生，也适合看重科学教育传统和实验教学资源的家庭。',
    applicationTips: '格致有本部和奉贤校区之分，关注时建议先确认目标校区，再分别核对招生安排和课程特色。理科实验班的选拔标准和培养方案值得重点研究。',
    address: '上海市黄浦区北海路150号',
    phone: '021-63510228',
    website: 'https://www.gezhi.sh.cn/',
    source: {
      name: '格致中学官网',
      type: 'official',
      url: 'https://www.gezhi.sh.cn/',
      crawledAt: '2026-04-01T10:00:00+08:00',
      confidence: 0.92
    },
    updatedAt: '2026-04-01T10:00:00+08:00'
  },
  '上海市大同中学': {
    schoolDescription: '大同中学是黄浦区与格致中学齐名的头部高中，以课程改革先锋和研究性学习体系成熟著称。学校在 STEM 跨学科项目、国际交流和科技创新教育方面持续保持较高辨识度，适合关注课程创新和多元化发展的家庭。',
    admissionRequirements: '大同的招生关注点通常在中招统一招生和自主招生两个通道。建议同步关注学校的研究性学习成果展示开放日和 STEM 项目体验活动，这些活动往往是了解学校培养理念的最佳窗口。',
    schoolHighlights: [
      '课程改革先锋，研究性学习体系在上海高中中具有较高知名度。',
      'STEM 跨学科项目和国际化交流是近年重点发展方向。',
      '黄浦区头部双雄之一，与格致中学的比较是家长常做的功课。',
      '科技创新竞赛成果在市级层面持续有稳定展现。'
    ],
    suitableStudents: '适合学习主动性强、对跨学科探究和项目式学习有兴趣的学生，也适合看重课程创新度和国际视野拓展机会的家庭。',
    applicationTips: '大同初中部和大境初级中学等关联学校的信息容易混淆。关注高中部时，建议以大同中学高中本部为核心口径，不要混入初中或分校信息。',
    address: '上海市黄浦区南车站路353号',
    phone: '021-63160973',
    website: 'http://www.hsdt.tp.edu.sh.cn/',
    source: {
      name: '大同中学官网',
      type: 'official',
      url: 'http://www.hsdt.tp.edu.sh.cn/',
      crawledAt: '2026-04-01T10:00:00+08:00',
      confidence: 0.92
    },
    updatedAt: '2026-04-01T10:00:00+08:00'
  },
  '上海市控江中学': {
    schoolDescription: '控江中学是杨浦区头部高中之一，以\u201c自主发展教育\u201d理念在全市中学教育中树立了鲜明辨识度。学校强调学生的自我规划、自我管理和自我评价能力，社团文化多元、科技创新活跃，适合自主性强的学生。',
    admissionRequirements: '控江的招生关注度在杨浦区一直很高，建议同步跟进中招统一招生和自主招生安排。学校近年开放日和社团体验活动信息丰富，是了解学校自主发展教育理念的好机会。',
    schoolHighlights: [
      '\u201c自主发展教育\u201d理念是学校最核心的辨识度。',
      '社团文化多元活跃，数十个学生社团覆盖科技、人文、艺术等领域。',
      '科技创新课题研究在市级赛事中常年有稳定产出。',
      '杨浦区头部学校比较中与复旦附中、交附等形成差异化定位。'
    ],
    suitableStudents: '适合自主管理能力强、希望在多元社团和科创平台上获得发展空间的学生，也适合认同\u201c自我规划、自我管理\u201d教育理念的家庭。',
    applicationTips: '关注控江时，建议把学校的自主发展理念和实际课程安排结合起来判断。开放日和社团展示日是了解学校氛围的最佳窗口，建议提前预约参加。',
    address: '上海市杨浦区双阳路388号',
    phone: '021-65437310',
    website: 'https://www.kjzx.net/',
    source: {
      name: '控江中学官网',
      type: 'official',
      url: 'https://www.kjzx.net/',
      crawledAt: '2026-04-01T10:00:00+08:00',
      confidence: 0.92
    },
    updatedAt: '2026-04-01T10:00:00+08:00'
  },
  '上海市长宁区延安中学': {
    schoolDescription: '延安中学是长宁区最具代表性的头部高中，以数学竞赛和理科特长在全市中学中保持持续辨识度。学校数学、物理竞赛成绩长期居全市前列，男子篮球培养也是学校特色标签之一，适合理科优势和体育特长并存的学生。',
    admissionRequirements: '延安中学的招生在长宁区关注度最高，建议重点关注统一招生和自主招生安排。理科实验班的选拔方案和竞赛培养路径是家长最需要提前了解的招生信息。',
    schoolHighlights: [
      '数学、物理竞赛是延安最突出的学科强项。',
      '理科实验班为特长生提供深度拓展和竞赛辅导。',
      '男子篮球传统项目在上海市中学篮球领域有较高知名度。',
      '长宁区头部学校的首选比较对象。'
    ],
    suitableStudents: '适合数学、物理学科优势明显、有志于竞赛发展的学生，也适合有篮球特长且不想牺牲学业培养的学生。',
    applicationTips: '关注延安时，建议重点研究理科实验班的选拔标准和竞赛培养路线，同时确认校区信息（延安有本部和新城分校之分），不要混看。',
    address: '上海市长宁区茅台路1111号',
    phone: '021-62900047',
    website: 'https://www.shyacz.com/',
    source: {
      name: '延安中学官网',
      type: 'official',
      url: 'https://www.shyacz.com/',
      crawledAt: '2026-04-01T10:00:00+08:00',
      confidence: 0.92
    },
    updatedAt: '2026-04-01T10:00:00+08:00'
  },
  '上海市复兴高级中学': {
    schoolDescription: '复兴高级中学是虹口区最具代表性的头部高中，以艺术教育特色、课程多样化和历史文化传承为办学辨识度。学校戏剧、合唱和美术教育在上海中学中具有较高知名度，课程体系兼顾人文、科技与艺术多元发展。',
    admissionRequirements: '复兴的招生以中招统一招生为主要入口，自主招生名额相对有限。建议重点关注学校的艺术特长招生信息和课程说明会，特别是对艺术教育方向有明确兴趣的家庭。',
    schoolHighlights: [
      '艺术教育特色鲜明，戏剧、合唱和美术教育在上海中学中有较高知名度。',
      '校本选修课程丰富，覆盖人文、科技和艺术等多领域。',
      '依托虹口区历史文化资源，地方课程开发有独特优势。',
      '虹口区头部学校的首选比较对象。'
    ],
    suitableStudents: '适合对艺术、人文有持续兴趣并在该领域有一定基础的学生，也适合希望在高水平高中获得课程多样化和个性化发展空间的家庭。',
    applicationTips: '复兴有本部和分校之分，关注前建议先确认目标校区。对艺术特长生来说，学校的艺术团招募时间和选拔方式是最需要提前掌握的招生信息。',
    address: '上海市虹口区车站南路28号',
    phone: '021-65435859',
    website: 'https://www.fuxing.sh.cn/',
    source: {
      name: '复兴高级中学官网',
      type: 'official',
      url: 'https://www.fuxing.sh.cn/',
      crawledAt: '2026-04-01T10:00:00+08:00',
      confidence: 0.92
    },
    updatedAt: '2026-04-01T10:00:00+08:00'
  }
};

function inferTrainingDirections(school) {
  const directions = new Set(Array.isArray(school.trainingDirections) ? school.trainingDirections.map((item) => String(item).trim()).filter(Boolean) : []);
  const haystack = [
    school.name,
    school.schoolDescription,
    school.admissionNotes,
    ...(school.features || []),
    ...(school.tags || []),
    ...(school.schoolHighlights || [])
  ].filter(Boolean).join(' ');

  if (/(科技|科创|创新|竞赛|研究)/.test(haystack)) directions.add('科创竞赛');
  if (/(人文|综合|通识|领导力)/.test(haystack)) directions.add('人文综合');
  if (/(国际|双语|ib|ap|alevel)/i.test(haystack)) directions.add('国际课程');
  if (/(寄宿|住宿)/.test(haystack)) directions.add('寄宿管理');
  if (/(贯通|一贯|衔接|完全中学|十年一贯)/.test(haystack)) directions.add('贯通培养');
  if (/(外语|外国语|英语)/.test(haystack)) directions.add('外语特色');

  return Array.from(directions).slice(0, 3);
}

let updated = 0;

const nextSchools = schools.map((school) => {
  const override = overrides[school.name];
  if (!override) return school;
  updated += 1;
  const detailed = {
    ...school,
    ...override
  };
  const profileDepth = isHighInterestSchoolName(detailed.name) ? 'priority' : (detailed.profileDepth || 'foundation');
  const trainingDirections = inferTrainingDirections(detailed);
  const markdown = buildSchoolMarkdown({
    ...detailed,
    trainingDirections,
    profileDepth,
    contentFile: detailed.contentFile || getSchoolContentRelativePath(detailed.id)
  });
  fs.writeFileSync(getSchoolContentAbsolutePath(detailed), `${markdown}\n`, 'utf8');

  const indexed = {
    ...detailed,
    profileDepth,
    trainingDirections,
    contentFile: detailed.contentFile || getSchoolContentRelativePath(detailed.id)
  };
  for (const field of DETAIL_FIELDS) {
    delete indexed[field];
  }

  return indexed;
});

fs.writeFileSync(filePath, `${JSON.stringify(nextSchools, null, 2)}\n`);
console.log(JSON.stringify({ updated, names: Object.keys(overrides) }, null, 2));
