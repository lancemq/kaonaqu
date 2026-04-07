import fs from 'fs';
import path from 'path';
import { buildSchoolMarkdown, getSchoolContentAbsolutePath, getSchoolContentRelativePath } from '../lib/school-content-files.mjs';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const DETAIL_FIELDS = ['schoolDescription', 'admissionRequirements', 'schoolHighlights', 'suitableStudents', 'applicationTips'];
const UPDATED_AT = '2026-04-07T21:30:00+08:00';

const overrides = {
  '上海市行知中学': {
    address: '上海市宝山区子青路99号',
    phone: '021-56104504',
    website: 'https://school.bsedu.org.cn/xzhs/',
    admissionNotes: '宝山区市重点高中，适合重点关注统一招生、自主招生、学科基地与科技艺术特色项目。',
    schoolDescription: '上海市行知中学的辨识度，不只在“市重点”这三个字，更在陶行知教育思想留下来的学校气质。学校前身是陶行知先生1939年在重庆创办的育才学校，1978年成为上海市首批市重点中学之一，2005年进入首批上海市实验性示范性高中序列。相比只看升学结果，行知更值得从“求真做人”的校风、课程系统和创新实验平台一起看。',
    admissionRequirements: '看行知时，除了统一招生分数线，也建议同步关注学校自主招生、学科基地、科技艺术项目和特色课程。对这类学校来说，是否适应它更强调主动探索、项目实践和综合发展的培养方式，往往和分数同样重要。',
    schoolHighlights: [
      '陶行知办学传统鲜明，学校长期围绕“行知合一，卓立英才”组织课程与育人活动。',
      '依托复旦、交大、同济、华师大等高校资源，建设了生活教育实验基地和多类创新实验室。',
      '“行·知·真·创”四维课程体系辨识度高，科技节、艺术节、劳动节和各类社团活动非常活跃。',
      '学校同时覆盖科技、艺术、劳动和国际交流等多条发展线，适合不想只走单一升学路径的学生。'
    ],
    suitableStudents: '适合学业基础较好、愿意主动参与项目学习、科技创新或综合活动，同时希望在老牌市重点里获得更完整成长平台的学生，也适合比较看重学校精神气质和课程生态的家庭。',
    applicationTips: '如果你在比较宝山几所头部高中，行知最值得单独看的不是“名气”，而是它的课程气质和学生发展节奏。建议把学校理念、创新实验室、社团活动和近年招生口径放在一起看，再判断是否匹配孩子。',
    trainingDirections: ['科创竞赛', '人文综合', '国际课程'],
    features: ['实验性示范性高中', '陶行知教育', '创新实验室', '科技艺术特色'],
    tags: ['高中', '市重点', '实验性示范性高中', '科创竞赛', '人文综合'],
    profileDepth: 'priority',
    source: {
      name: '上海市行知中学官网',
      type: 'official',
      url: 'https://school.bsedu.org.cn/xzhs/app/info/doc/index.php/1432',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  },
  '上海市吴淞中学': {
    address: '上海市宝山区泰和路99号',
    phone: '021-56580100',
    website: 'https://school.bsedu.org.cn/shwusong/',
    admissionNotes: '宝山区市重点高中，建议重点关注统一招生、自主招生以及学校艺术、科技和特色平台项目。',
    schoolDescription: '上海市吴淞中学是一所有鲜明历史感的老牌市重点高中。学校官网把自己的优势概括得很直接: 光辉卓越的教育历史、尽责报国的精神气质、科学全面的课程体系和精准培养的成长平台。和只看一条招生数据相比，吴淞更适合从百年传统、课程体系和特色项目一起理解。',
    admissionRequirements: '关注吴淞时，建议把统一招生、自主招生和学校特色项目一起看。学校在科技、艺术、桥牌、生物与环境等方向上长期有持续积累，如果孩子对这些平台有兴趣，比较吴淞时就不该只看静态分数。',
    schoolHighlights: [
      '学校是上海市实验性示范性高中，长期拥有绿色学校、科技教育特色示范学校、艺术教育特色学校等标签。',
      '官网持续公开道尔顿工坊、观澜书院、宽正体育、同济大学苗圃班等平台，说明课程与活动入口比较完整。',
      '科技艺术文化节和研究型课程长期活跃，适合把它当成“课程平台型”学校来判断。',
      '学校在历史底蕴、课程系统和综合活动舞台上都有较强辨识度。'
    ],
    suitableStudents: '适合希望在老牌市重点里兼顾课程完整度、科技艺术活动平台和综合发展空间的学生，也适合对学校传统、校园文化和特色项目比较敏感的家庭。',
    applicationTips: '吴淞最值得看的，不只是“市重点”标签，而是它能否给孩子提供合适的平台。建议把学校特色项目、课程入口、校园文化和通勤成本一起看，尤其适合和宝山其他头部高中横向比较。',
    trainingDirections: ['科创竞赛', '人文综合'],
    features: ['实验性示范性高中', '科技教育特色', '艺术教育特色', '同济大学苗圃班'],
    tags: ['高中', '市重点', '实验性示范性高中', '科技艺术特色'],
    profileDepth: 'priority',
    source: {
      name: '上海市吴淞中学官网',
      type: 'official',
      url: 'https://school.bsedu.org.cn/shwusong/app/info/doc/index.php/449',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  },
  '上海市宝山中学': {
    address: '上海市宝山区盘古路247弄20号',
    phone: '63160973',
    website: 'https://school.bsedu.org.cn/bszx/',
    admissionNotes: '宝山区区重点高中，建议结合统一招生口径、课程改革、校园管理和学校近年公开活动一起判断。',
    schoolDescription: '上海市宝山中学是一所百年老校。官网对学校最突出的表达是“百年宝中”，这意味着它的看点不只是当前分数段，还包括长期形成的学校文化、课程改革积累和相对完整的校园节奏。对希望在宝山本区找一所稳扎稳打型高中的家庭，宝山中学通常值得单独拿出来看。',
    admissionRequirements: '比较宝山中学时，建议把区重点高中常见的统一招生分数、学校课程改革、德育与体健活动、校风管理一起看。它更适合放在“稳健型高中”序列里判断，而不是只用头部名校的标准去套。',
    schoolHighlights: [
      '学校有明确的百年老校传统，校园公开表达里“百年宝中”是最鲜明的核心标签。',
      '官网持续设置课程改革、活力课堂、综合课程、强健体魄和特色社团等栏目，说明学校对综合培养和校园节奏都有长期建设。',
      '相比只看一次招生数据，宝中更适合从长期校风、课程组织和学生日常成长环境来理解。',
      '对于希望在宝山区内优先找一所节奏稳、辨识度清楚的公办高中家庭，它是典型的重点比较对象。'
    ],
    suitableStudents: '适合希望在本区公办高中里兼顾学习秩序、课程稳定性、校园活动和长期成长环境的学生，也适合更看重学校整体完成度而不只盯着顶尖光环的家庭。',
    applicationTips: '看宝山中学时，建议先确认孩子更需要的是“极强平台感”还是“稳定成长感”。如果更重视学校管理、课程稳健性和在区内的适配度，宝中往往会比单看排名更值得细读。',
    trainingDirections: ['人文综合', '德育活动强'],
    features: ['百年老校', '课程改革', '综合课程', '特色社团'],
    tags: ['高中', '区重点', '百年老校', '课程改革'],
    profileDepth: 'foundation',
    source: {
      name: '上海市宝山中学官网',
      type: 'official',
      url: 'https://school.bsedu.org.cn/bszx/',
      crawledAt: UPDATED_AT,
      confidence: 0.93
    },
    updatedAt: UPDATED_AT
  },
  '上海市通河中学': {
    address: '上海市宝山区呼玛路888号',
    phone: '56741519',
    website: 'https://school.bsedu.org.cn/thzx/',
    admissionNotes: '宝山区区重点高中，学校公开口径重点落在课程建设、科学教育、心理支持和足球等特色项目上。',
    schoolDescription: '通河中学是一所典型的“完成度高于想象”的区重点高中。官网首页给出的学校画像很清楚: 宝山区首批实验性示范性高中、上海大学基础教育集团项目学校，围绕“多元发展，健康成长”组织校园空间和课程体系。它的优势不在单一标签，而在稳稳把课程、科技、心理和校园节奏都做得比较扎实。',
    admissionRequirements: '如果你在比较通河，建议同时看统一招生口径和学校特色项目。学校在科技教育、科学实践、心理健康和足球项目上都有持续建设，这类信息往往比一句“区重点”更能帮助判断是否适合孩子。',
    schoolHighlights: [
      '学校是宝山区首批实验性示范性高中，也是上海大学基础教育集团项目学校。',
      '“多元发展，健康成长”是学校最稳定的办学表达，校园空间也围绕学习、活动和生活分区组织。',
      '学校曾获全国首批科学教育实践基地、市科技特色示范校、市中小学心理辅导实验校等称号。',
      '对希望孩子在高中阶段兼顾学业、心理支持和活动平台的家庭，通河是值得补看的一类学校。'
    ],
    suitableStudents: '适合希望在区重点高中里兼顾课程稳定、科技实践、校园活动和成长支持的学生，也适合不追求极端竞争、但希望学校环境比较完整的家庭。',
    applicationTips: '比较通河时，建议不要只看一条录取线。把学校科学教育、心理支持、活动平台和足球等特色项目一起看，会更容易判断它是不是“适合孩子长期待三年”的那类学校。',
    trainingDirections: ['科创竞赛', '人文综合'],
    features: ['实验性示范性高中', '科学教育实践基地', '心理辅导实验校', '足球特色'],
    tags: ['高中', '区重点', '实验性示范性高中', '科学教育'],
    profileDepth: 'foundation',
    source: {
      name: '上海市通河中学官网',
      type: 'official',
      url: 'https://school.bsedu.org.cn/thzx/app/info/doc/index.php/563',
      crawledAt: UPDATED_AT,
      confidence: 0.93
    },
    updatedAt: UPDATED_AT
  },
  '上海市崇明区崇明中学': {
    address: '上海市崇明区城桥镇鼓浪屿路801号',
    phone: '021-69672006',
    website: 'https://www.shcm.gov.cn/xwzx/002009/20241216/c958f995-c679-4b09-b664-d41b4a98fdac.html',
    admissionNotes: '崇明区市重点高中，建议重点关注学校自主发展特色、科技艺术项目和本区高中升学主线。',
    schoolDescription: '崇明中学是崇明本地最有代表性的高中之一。官方公开口径里，学校创办于1915年，是上海市实验性示范性高中，校园体量和师资规模在崇明都很突出。相比把它只当作“崇明头部学校”，更值得关注的是它长期强调的“自主发展”特色，以及在科技、艺术和教师专业发展方面形成的整体氛围。',
    admissionRequirements: '对准备在崇明区内读高中的家庭来说，崇明中学通常是必须重点比较的对象。建议同时看区内招生主线、学校近年公开活动、教师队伍和学校强调的自主发展特色，不要只看静态名气。',
    schoolHighlights: [
      '学校创办于1915年，是上海市实验性示范性高中，历史底蕴和校园规模都很突出。',
      '官方口径明确提出“为了全体师生的发展，为了中华民族的振兴”的办学理念，以及“自主发展”办学特色。',
      '学校同时拥有科技教育特色、艺术教育特色、心理健康和教师专业发展等多项荣誉标签。',
      '对于关注崇明区内优质高中资源的家庭，崇明中学通常是最重要的起点学校之一。'
    ],
    suitableStudents: '适合希望在崇明区内进入更成熟的市重点高中体系、同时重视学校文化、教师力量和综合培养氛围的学生，也适合倾向本地长期发展路径的家庭。',
    applicationTips: '崇明中学的看点不只是“区内头部”，而是它是否适合孩子未来三年的成长节奏。建议把通勤、校风、课程、活动和区内可比学校一起看，再决定是否作为重点目标。',
    trainingDirections: ['科创竞赛', '人文综合', '艺术特色'],
    features: ['实验性示范性高中', '科技教育特色', '艺术教育特色', '百年老校'],
    tags: ['高中', '市重点', '实验性示范性高中', '百年老校'],
    profileDepth: 'priority',
    source: {
      name: '上海市崇明区人民政府',
      type: 'official',
      url: 'https://www.shcm.gov.cn/xwzx/002009/20241216/c958f995-c679-4b09-b664-d41b4a98fdac.html',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  }
};

let updated = 0;

const nextSchools = schools.map((school) => {
  const override = overrides[school.name];
  if (!override) return school;

  updated += 1;
  const detailed = {
    ...school,
    ...override,
    features: Array.from(new Set([...(school.features || []), ...(override.features || [])])),
    tags: Array.from(new Set([...(school.tags || []), ...(override.tags || [])])),
    contentFile: school.contentFile || getSchoolContentRelativePath(school.id)
  };

  const markdown = buildSchoolMarkdown(detailed);
  fs.writeFileSync(getSchoolContentAbsolutePath(detailed), `${markdown}\n`, 'utf8');

  const indexed = { ...detailed };
  for (const field of DETAIL_FIELDS) {
    delete indexed[field];
  }

  return indexed;
});

fs.writeFileSync(filePath, `${JSON.stringify(nextSchools, null, 2)}\n`);
console.log(JSON.stringify({ updated, names: Object.keys(overrides) }, null, 2));
