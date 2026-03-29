const schoolOpenDays = [
  {
    id: 'shs-open-info',
    schoolName: '上海中学',
    district: '徐汇区',
    tag: '官网入口 / 开放日',
    window: '近年公开活动',
    summary: '学校官网长期保留学校概况、课程图谱和开放日相关通知入口，适合持续跟进上中本部活动与公开信息。',
    detail: '对于关注拔尖创新培养、课程图谱和校园开放活动的家庭，建议优先以学校官网更新为准，再结合当年招生政策判断。',
    href: 'https://www.shs.cn/'
  },
  {
    id: 'hsefz-open-info',
    schoolName: '华东师范大学第二附属中学',
    district: '浦东新区',
    tag: '官网入口 / 咨询会',
    window: '近年公开活动',
    summary: '华二官网会持续发布学校新闻、课程介绍和招生咨询活动入口，适合区分本部与不同校区后继续核对。',
    detail: '对华二这类校区差异较明显的学校，建议同时留意校区资讯、咨询会和课程信息，不要只看单一名校标签。',
    href: 'https://www.hsefz.cn/'
  },
  {
    id: 'vkbs-2025-grade6',
    schoolName: '上海闵行区万科双语学校（初中）',
    district: '闵行区',
    tag: '招生简章',
    window: '2025学年六年级',
    summary: '最近可查的公开资料显示，六年级招生计划 145 人，其中统招 17 人，仅招走读。',
    detail: '页面同时保留“校园开放日”入口，并公开了招生办电话、邮箱和班车说明，适合重点关注闵行双语路线的家庭。',
    href: 'https://www.021school.cn/schools/16287'
  },
  {
    id: 'liangyuan-2025-grade6',
    schoolName: '上海市燎原双语学校（初中）',
    district: '闵行区',
    tag: '开放日 / 招简',
    window: '2025学年六年级',
    summary: '最近可查的公开资料显示，学校六年级分双语班与融合班，合计招生 165 人，可申请住宿。',
    detail: '学校页面保留“校园开放日”入口，也公开了双语班、融合班收费和报名时间，适合关注 IB 理念与本地课程融合的家庭。',
    href: 'https://www.021school.cn/schools/15975'
  },
  {
    id: 'nordanglia-2025-grade6',
    schoolName: '上海闵行区诺达双语学校（初中）',
    district: '闵行区',
    tag: '招生简章',
    window: '2025学年六年级',
    summary: '最近可查的公开资料显示，六年级招生计划 312 人，可提供全寄宿和 7 天全寄宿服务。',
    detail: '页面保留“校园开放日”入口，并披露了统招、教职工子女、举办者员工子女分类计划，适合关注寄宿型双语学校的家庭。',
    href: 'https://www.021school.cn/schools/16288'
  },
  {
    id: 'suis-pudong-2025-grade6',
    schoolName: '上海浦东新区民办协和双语学校（初中）',
    district: '浦东新区',
    tag: '招生简章',
    window: '2025学年六年级',
    summary: '最近可查的公开资料显示，学校六年级招生计划 180 人，页面保留“校园开放日”入口。',
    detail: '当前可查页面同时公开了康桥校区地址、招生电话和学费标准，适合关注浦东协和体系双语赛道的家庭。',
    href: 'https://www.021school.cn/schools/16278'
  },
  {
    id: 'hwb-jinshan-2025-grade6',
    schoolName: '上海金山杭州湾双语学校（初中部）',
    district: '金山区',
    tag: '招生简章',
    window: '2025年',
    summary: '最近可查的公开资料显示，学校为 1-9 年级一贯制高品质民办双语寄宿学校，页面提供招生简章与开放日入口。',
    detail: '资料里明确提到寄宿制、实验室、艺术中心和晚自修安排，适合关注金山双语寄宿学校的家庭。',
    href: 'https://www.021school.cn/schools/16328'
  },
  {
    id: 'hudong-2025-grade6',
    schoolName: '上海民办沪东外国语学校（初中）',
    district: '杨浦区',
    tag: '招生简章',
    window: '2025学年六年级',
    summary: '最近可查的公开资料显示，学校公开了 2025 年初中部招生简章，并保留“校园开放日”入口。',
    detail: '页面公开了区内统一招生范围、报名时间与咨询电话，适合关注外语特色民办初中的家庭。',
    href: 'https://www.021school.cn/schools/16310'
  },
  {
    id: 'sjtu-fz-open-info',
    schoolName: '上海交通大学附属中学',
    district: '杨浦区',
    tag: '官网入口 / 联系方式',
    window: '近年公开活动',
    summary: '交附官网公开课程中心、生涯规划、校园新闻和联系方式，适合进一步核对主校活动和招生说明。',
    detail: '交附体系学校较多，建议先确认是否为主校本部，再根据官网公开内容继续比较课程、活动和招生口径。',
    href: 'https://fz.sjtu.edu.cn/'
  },
  {
    id: 'jianping-open-info',
    schoolName: '上海市建平中学',
    district: '浦东新区',
    tag: '官网入口 / 联系方式',
    window: '近年公开活动',
    summary: '建平中学官网公开了学校新闻、国际课程、联系方式和校区地址，适合继续核对主校与北校区信息。',
    detail: '对于浦东头部高中比较，建议把建平的课程开放度、科技活动和区位一起看，再判断是否匹配。',
    href: 'https://www.jianping.com.cn/'
  },
  {
    id: 'ses-open-info',
    schoolName: '上海市实验学校',
    district: '浦东新区',
    tag: '官网入口 / 学部信息',
    window: '近年公开活动',
    summary: '上实官网会单独展示学校概况、中学部和国际部等信息入口，适合按学部继续核对。',
    detail: '这类学校更适合按长期培养路径理解，建议结合学校官网公开的学部信息和咨询入口持续跟进。',
    href: 'https://www.ses.sh.edu.cn/'
  }
];

export default schoolOpenDays;
