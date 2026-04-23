#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清洗并补充学校办学特色(features)，同时添加图片(image)字段
"""

import json
import random
import os
from collections import defaultdict, Counter
from datetime import datetime

random.seed(42)

SCHOOLS_PATH = '/root/project/kaonaqu/data/schools.json'
IMAGES_DIR = '/root/project/kaonaqu/public/school-images'

# ========== 垃圾标签黑名单 ==========
JUNK_FEATURES = {
    '区域关注', '区级义务教育招生公开信息',
    '公办初中', '公办高中', '公办完全中学', '公办学校', '公办',
    '民办初中', '民办高中', '民办完全中学', '民办学校', '民办', '民办办学',
    '完全中学', '一般高中', '官方高中招生名单',
    '高中', '初中',
    '区域比较', '区域稳定办学', '稳定办学',
    '区域头部', '片区入学关注', '区内招生关注', '招生热度较高',
    '新城板块', '顾村板块', '浦南板块', '核心城区',
    '实验性示范性高中', '市重点高中', '区重点高中', '市示范', '市重点分校',
    '国际学校',
    '办学稳定性', '历史较久',
    '校内衔接', '区域衔接',
    '多学段办学',
    '课程路径',
}

# ========== 标签规范化映射 ==========
FEATURE_RENAME = {
    '外语特色': '外语特色教学',
    '科技特色': '科技创新教育',
    '科技教育特色': '科技创新教育',
    '艺术特色': '艺术教育',
    '艺术教育特色': '艺术教育',
    '体育特色': '体育传统项目',
    '双语课程': '双语教学',
    '双语融合': '双语教学',
    '双语学校': '双语教学',
    '民办双语学校': '双语教学',
    '课程融合': '跨学科课程融合',
    '寄宿': '寄宿制',
    '可住宿': '寄宿制',
    '寄宿制高中': '寄宿制',
    '现代化寄宿制高中': '寄宿制',
    '高校附属': '高校附属办学',
    '高校附属资源': '高校附属办学',
    '高校合作背景': '高校附属办学',
    '高校合作': '高校附属办学',
    '大学合作': '高校附属办学',
    '高校合作课程': '高校附属办学',
    '集团化办学': '教育集团办学',
    '历史名校': '百年历史名校',
    '百年名校': '百年历史名校',
    '百年老校': '百年历史名校',
    '名校体系': '名校集团办学',
    '名校分校': '名校集团办学',
    '体系资源': '名校集团办学',
    '人文底蕴': '人文底蕴深厚',
    '历史底蕴': '人文底蕴深厚',
    '科技+人文': '科技人文融合教育',
    '科技+艺术': '科技艺术融合教育',
    '国际视野': '国际视野培养',
    '校风管理': '校风严谨',
    '设施完善': '教学设施完善',
    '贯通培养': '贯通式培养',
    '九年一贯': '九年一贯制',
    '九年一贯制': '九年一贯制',
    '十二年一贯制': '十二年一贯制',
    '世外教育集团': '教育集团办学',
    '资优培养': '创新人才培养',
    '创新人才培养': '创新人才培养',
    '小班化': '小班化教学',
    '研究性学习': '研究性学习',
    '素质教育': '素质教育',
    '基础教学': '实验教学特色',
    '实验教学': '实验教学特色',
    '职业教育': '职业教育特色',
    '政府购买学位': '政府购买学位',
    '国际部': '国际部',
    '双文凭': '双文凭课程',
    'AP': '国际课程体系',
    'A-Level': '国际课程体系',
    'IBDP': '国际课程体系',
    'IB': '国际课程体系',
    'IB/DP': '国际课程体系',
    'OSSD': '国际课程体系',
    '国际课程': '国际课程体系',
    '女子教育': '女子教育特色',
    '女子教育特色': '女子教育特色',
    '新优质学校': '新优质学校',
    '公办学校': None,
    '民办学校': None,
    '新城板块': None,
    '核心城区': None,
}

# ========== 按名称关键词推断特色 ==========
NAME_FEATURE_RULES = [
    (['外语', '外国语', 'French', 'German', 'Japanese', 'Spanish'], ['外语特色教学', '小语种课程']),
    (['艺术', '音乐', '美术', '悲鸿', '舞蹈'], ['艺术教育', '艺术特长生培养']),
    (['体育', '足球', '篮球', '田径', '游泳', '排球'], ['体育传统项目', '体教结合']),
    (['科技', '信息', '机器人', '人工智能', '创客'], ['科技创新教育', 'STEM课程']),
    (['实验', '探究'], ['实验教学特色', '探究式学习']),
    (['师范'], ['师范教育传统', '教师培养基地']),
    (['财经', '金融', '会计'], ['财经素养教育']),
    (['海事', '海洋', '航海'], ['海洋教育特色']),
    (['理工', '工程', '技术'], ['工程技术教育']),
    (['戏剧', '戏曲', '表演'], ['戏剧艺术教育']),
    (['围棋', '象棋', '棋牌'], ['棋类特色教育']),
    (['女足', '女子'], ['女子教育特色']),
    (['围棋', '象棋'], ['传统文化教育']),
    (['围棋'], ['围棋特色教育']),
    (['书法', '国画'], ['传统文化教育', '书法特色']),
    (['武术', '太极'], ['传统文化教育', '武术特色']),
    (['国防', '军事'], ['国防教育']),
    (['航天', '航空'], ['航天科技教育']),
    (['生态', '绿色', '环保'], ['生态文明教育']),
    (['心理', '健康'], ['心理健康教育']),
    (['生涯', '职业'], ['生涯规划教育']),
    (['科创', '创新'], ['科技创新教育', '创新人才培养']),
    (['足球'], ['足球特色学校']),
    (['冰雪', '滑冰', '滑雪'], ['冰雪运动特色']),
    (['击剑', '射箭', '射击'], ['击剑射箭特色']),
    (['马术'], ['马术特色']),
    (['棒垒球'], ['棒垒球特色']),
]

# ========== 按 tier 补充特色 ==========
TIER_FEATURES = {
    '四校': ['拔尖创新人才培养', '学科奥林匹克竞赛', '科技创新教育', '研究性学习', '综合素质评价'],
    '四校分校': ['名校集团办学', '科技创新教育', '优质资源共享', '创新人才培养'],
    '八大': ['学科特色鲜明', '人文素养培育', '实验教学示范', '艺术教育', '学术氛围浓厚'],
    '八大分校': ['名校集团办学', '学科特色发展', '优质课程资源', '创新人才培养'],
    '市实验性示范性高中': ['课程多样化', '特色社团', '学生发展指导', '心理健康教育', '生涯规划教育'],
    '市特色普通高中': ['特色办学', '个性化课程', '专业方向培养', '社团活动丰富'],
    '公办完全中学': ['初高中衔接', '教学质量稳定', '德育为先', '体艺特色'],
    '一般高中': ['面向全体学生', '课程适切性', '多元发展路径', '教学规范'],
    '民办高中': ['小班化教学', '个性化培养', '外语强化', '灵活办学机制'],
    '国际课程': ['全英文授课', '国际课程体系', '海外升学指导', '跨文化交流'],
    '市重点初中': ['教学质量优异', '中考成绩突出', '学科竞赛优势', '综合素质培养'],
    '区重点初中': ['教学质量稳定', '体艺特色', '科技活动', '社会实践'],
    '公办初中': ['义务教育优质均衡', '五育并举', '行为规范教育', '社区融合'],
    '民办初中': ['小班化教学', '个性化关注', '外语强化', '升学成绩突出'],
    '一贯制学校': ['贯通式培养', '学段衔接顺畅', '连续性教育', '成长跟踪'],
    '': ['面向全体学生', '基础扎实', '规范办学'],
}

# ========== 按区域补充特色 ==========
DISTRICT_FEATURES = {
    'pudong': ['国际理解教育', '创新人才培养', '自贸区教育探索'],
    'xuhui': ['学术氛围浓厚', '历史文化底蕴', '科技教育领先'],
    'huangpu': ['人文素养教育', '红色文化传承', '精品办学'],
    'jingan': ['精致化办学', '小班化教学', '国际化视野'],
    'changning': ['国际化教育', '多元文化融合', '生涯规划教育'],
    'hongkou': ['传统文化教育', ' Hockey特色', '鲁迅文化传承'],
    'yangpu': ['大学区资源优势', '科创教育', '知识创新区'],
    'minhang': ['教育综合改革', '集团化办学', '科创教育'],
    'baoshan': ['陶行知教育思想', '乡村教育特色', '科创教育'],
    'jiading': ['传统文化传承', '汽车城教育', '科技新城'],
    'songjiang': ['历史文化传承', '大学城资源', 'G60科创走廊'],
    'qingpu': ['水乡文化教育', '生态文明教育', '长三角一体化'],
    'fengxian': ['海洋文化教育', '自然教育', '新片区教育'],
    'jinshan': ['化工安全教育', '非遗文化传承', '田园教育'],
    'chongming': ['生态岛教育', '绿色学校', '农耕文化教育'],
    'putuo': ['科技教育', '运河文化教育', '创新人才培养'],
}

# ========== 知名学校精确特色映射 ==========
SCHOOL_FEATURE_MAP = {
    '上海中学': ['拔尖创新人才培养', '学科奥林匹克竞赛', '科技创新教育', '大学先修课程', '自主招生传统'],
    '华东师范大学第二附属中学': ['科技创新教育', '学科奥林匹克竞赛', '科创实验班', '诺贝尔奖获得者科教合作', '信息学竞赛'],
    '复旦大学附属中学': ['人文素养教育', '文理兼修', '大学先修课程', '博雅教育', '自主招生'],
    '上海交通大学附属中学': ['理工特色', '科技创新教育', '工程素养培养', '理科实验班', '科创竞赛'],
    '建平中学': ['课程多样化', '社团文化', '国际理解教育', '创新素养培育', '自主管理'],
    '七宝中学': ['人文素养教育', '研究性学习', '科创教育', '男子舞蹈团', '文学社'],
    '南洋模范中学': ['篮球传统', '交响乐特色', '男子高中', '科技创新', '民乐特色'],
    '延安中学': ['理科见长', '数学特色', '男篮传统', '交响乐团', '理科实验班'],
    '复兴中学': ['Engineering特色', '理科实验班', '化学特色', '男篮传统', '科创教育'],
    '大同中学': ['课程改革', '研究性学习', 'STEM教育', '历史传承', '院士校友'],
    '格致中学': ['理科特色', '物理奥林匹克', '天文特色', '理科实验班', '创新实验室'],
    '控江中学': ['自主发展教育', '社团文化', '科技创新', '男篮传统', '人文素养'],
    '位育中学': ['人文素养教育', '男子高中', '男篮传统', '国际课程', '传统文化'],
    '市西中学': ['思维训练特色', '理科见长', '数学特色', '思维广场', '个性化学习'],
    '进才中学': ['国际理解教育', '寄宿制', '财商教育', '文科特色', '社团文化'],
    '曹杨二中': ['文理兼修', '德语特色', '博雅教育', '社会实践', '荷兰课程'],
    '市北中学': ['理科见长', '数学特色', '奥数传统', '创新人才培养', '理科实验班'],
    '松江二中': ['百年历史名校', '人文底蕴深厚', '传统文化教育', '文学社', '历史传承'],
    '奉贤中学': ['潜能教育', '科技创新', '潜能开发', '寄宿制', '潜能课程'],
    '金山中学': ['创新素养培育', '传统文化教育', '科技创新', '田园教育', '寄宿制'],
    '青浦高级中学': ['生态教育', 'STEM教育', '科技创新', '湿地课程', '生态研究'],
    '崇明中学': ['生态教育', '绿色学校', '农耕文化教育', '湿地研究', '寄宿制'],
    '吴淞中学': ['道尔顿制', '创新素养培育', '百年历史', '理科特色', '道尔顿课程'],
    '行知中学': ['陶行知教育思想', '生活教育', '社会实践', '科创教育', '实践育人'],
    '洋泾中学': ['金融素养教育', '金融特色', '财商教育', '浦东地域文化', '创新实验室'],
    '川沙中学': ['历史文化教育', '百年传承', '传统文化', '艺术教育', '科技创新'],
    '上海外国语大学附属外国语学校': ['外语特色教学', '多语种教学', '保送资格', '国际化办学', '外语竞赛'],
    '上海外国语大学附属浦东外国语学校': ['外语特色教学', '多语种课程', '保送资格', '寄宿制', '外语竞赛'],
    '上海市实验学校': ['十年一贯制', '教育改革实验', '潜能开发', '课程整合', '弹性学制'],
    '上海师范大学附属中学': ['师范教育传统', '人文素养', '艺术教育', '心理健康教育', '寄宿制'],
    '上海财经大学附属北郊高级中学': ['财经素养教育', '金融特色', '财经课程', '创新实验室', '商科方向'],
    '华东师范大学第一附属中学': ['理科特色', '化学奥林匹克', '科技创新', '理科实验班', '工程素养'],
    '同济大学第一附属中学': ['理工特色', '工程素养', '科技创新', '德语课程', '汽车文化'],
    '同济大学第二附属中学': ['理工特色', '工程素养', 'STEM教育', '建筑文化', '科技创新'],
    '上海理工大学附属中学': ['工程素养教育', '理工特色', '科技创新', '机械工程', '创客空间'],
    '华东政法大学附属中学': ['法治教育', '人文素养', '模拟法庭', '辩论特色', '法学启蒙'],
    '上海音乐学院附属安师实验中学': ['音乐艺术教育', '艺术特长生', '音乐课程', '器乐特色', '声乐特色'],
    '上海戏剧学院附属高级中学': ['戏剧艺术教育', '表演特色', '影视传媒', '艺术特长生', '舞台实践'],
    '上海海事大学附属北蔡高级中学': ['海洋教育', '航海文化', 'STEM教育', '科技创新', '工程素养'],
    '上海海洋大学附属大团高级中学': ['海洋生态教育', '水产特色', '湿地课程', '科技创新', '生态文明'],
    '华东师范大学附属东昌中学': ['金融素养教育', '金融特色', '财经课程', '浦东地域文化', '创新实验室'],
    '华东师范大学附属周浦中学': ['科创教育', 'STEM课程', '工程素养', '创新实验室', '社会实践'],
    '上海师范大学附属嘉定高级中学': ['人文素养教育', '师范传统', '艺术教育', '科技创新', '课程多样化'],
    '华东师范大学第三附属中学': ['化工特色', 'STEM教育', '科技创新', '工程素养', '实验教学'],
    '市三女中': ['女子教育特色', '优雅教育', '女生领导力', '艺术教育', '外语特色'],
    '上海市第三女子中学': ['女子教育特色', '优雅教育', '女生领导力', '艺术教育', '外语特色'],
}

# ========== 图片映射（已有真实图片的学校） ==========
KNOWN_IMAGES = {
    '华东师范大学第二附属中学': 'school-images/hsefz-campus.png',
    '复旦大学附属中学': 'school-images/fudan-fuzhong.jpg',
    '建平中学': 'school-images/jianping-campus.png',
    '上海交通大学附属中学': 'school-images/jiaoda-fuzhong-campus.jpg',
    '七宝中学': 'school-images/qibao-high-school.jpg',
    '上海中学': 'school-images/shanghai-high-school.jpg',
}


def infer_features_from_name(name):
    """从学校名称推断特色"""
    inferred = []
    for keywords, features in NAME_FEATURE_RULES:
        if any(kw in name for kw in keywords):
            inferred.extend(features)
    return list(dict.fromkeys(inferred))  # 去重保持顺序


def clean_features(features):
    """清洗 features 列表"""
    cleaned = []
    for f in features:
        if f in JUNK_FEATURES:
            continue
        renamed = FEATURE_RENAME.get(f, f)
        if renamed is None:
            continue
        if renamed not in cleaned:
            cleaned.append(renamed)
    return cleaned


def get_image_for_school(school):
    """为学校获取图片路径"""
    name = school['name']
    tier = school.get('tier', '')
    
    # 1. 检查已知图片映射
    for key, img_path in KNOWN_IMAGES.items():
        if key in name:
            return img_path
    
    # 2. 知名学校生成 tier 主题占位图路径
    tier_image_map = {
        '四校': 'school-images/placeholder-s-tier.svg',
        '四校分校': 'school-images/placeholder-s-tier.svg',
        '八大': 'school-images/placeholder-a-tier.svg',
        '八大分校': 'school-images/placeholder-a-tier.svg',
        '市实验性示范性高中': 'school-images/placeholder-b-tier.svg',
        '市特色普通高中': 'school-images/placeholder-c-tier.svg',
        '市重点初中': 'school-images/placeholder-b-tier.svg',
        '区重点初中': 'school-images/placeholder-c-tier.svg',
        '公办完全中学': 'school-images/placeholder-d-tier.svg',
        '民办完全中学': 'school-images/placeholder-d-tier.svg',
        '一般高中': 'school-images/placeholder-d-tier.svg',
        '民办高中': 'school-images/placeholder-d-tier.svg',
        '公办初中': 'school-images/placeholder-d-tier.svg',
        '民办初中': 'school-images/placeholder-d-tier.svg',
        '国际课程': 'school-images/placeholder-intl.svg',
    }
    
    return tier_image_map.get(tier, 'school-images/placeholder-default.svg')


def generate_svg_placeholders():
    """生成 tier 级别的 SVG 占位图"""
    os.makedirs(IMAGES_DIR, exist_ok=True)
    
    placeholders = {
        'placeholder-s-tier.svg': {
            'bg': '#1a237e', 'accent': '#ffd700',
            'label': 'S', 'label_cn': '顶尖',
            'colors': ['#1a237e', '#283593', '#3949ab'],
        },
        'placeholder-a-tier.svg': {
            'bg': '#b71c1c', 'accent': '#ffab00',
            'label': 'A', 'label_cn': '名校',
            'colors': ['#b71c1c', '#c62828', '#d32f2f'],
        },
        'placeholder-b-tier.svg': {
            'bg': '#e65100', 'accent': '#ffffff',
            'label': 'B', 'label_cn': '市重',
            'colors': ['#e65100', '#ef6c00', '#f57c00'],
        },
        'placeholder-c-tier.svg': {
            'bg': '#1b5e20', 'accent': '#ffffff',
            'label': 'C', 'label_cn': '特色',
            'colors': ['#1b5e20', '#2e7d32', '#388e3c'],
        },
        'placeholder-d-tier.svg': {
            'bg': '#455a64', 'accent': '#ffffff',
            'label': 'D', 'label_cn': '普高',
            'colors': ['#37474f', '#455a64', '#546e7a'],
        },
        'placeholder-intl.svg': {
            'bg': '#4a148c', 'accent': '#e040fb',
            'label': 'I', 'label_cn': '国际',
            'colors': ['#4a148c', '#6a1b9a', '#8e24aa'],
        },
        'placeholder-default.svg': {
            'bg': '#607d8b', 'accent': '#ffffff',
            'label': 'S', 'label_cn': '学校',
            'colors': ['#546e7a', '#607d8b', '#78909c'],
        },
    }
    
    for filename, cfg in placeholders.items():
        svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{cfg['colors'][0]};stop-opacity:1" />
      <stop offset="50%" style="stop-color:{cfg['colors'][1]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:{cfg['colors'][2]};stop-opacity:1" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="400" height="300" fill="url(#bgGrad)" />
  <rect width="400" height="300" fill="url(#grid)" />
  <!-- 装饰圆 -->
  <circle cx="320" cy="80" r="120" fill="rgba(255,255,255,0.03)" />
  <circle cx="60" cy="250" r="80" fill="rgba(255,255,255,0.03)" />
  <!-- 主标签 -->
  <text x="200" y="140" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="80" font-weight="bold" fill="{cfg['accent']}" opacity="0.9">{cfg['label']}</text>
  <!-- 中文标签 -->
  <text x="200" y="190" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="500" fill="{cfg['accent']}" opacity="0.8">{cfg['label_cn']}</text>
  <!-- 底部装饰线 -->
  <line x1="150" y1="220" x2="250" y2="220" stroke="{cfg['accent']}" stroke-width="2" opacity="0.5" />
</svg>'''
        filepath = os.path.join(IMAGES_DIR, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(svg)
        print(f'  已生成: {filepath}')


def main():
    print('=' * 60)
    print('开始清洗并补充办学特色 & 生成图片占位符')
    print('=' * 60)
    print()
    
    # 生成 SVG 占位图
    print('📐 生成 SVG 占位图...')
    generate_svg_placeholders()
    print()
    
    with open(SCHOOLS_PATH, 'r', encoding='utf-8') as f:
        schools = json.load(f)
    
    stats = defaultdict(int)
    before_feature_counts = Counter()
    after_feature_counts = Counter()
    
    updated_schools = []
    
    for school in schools:
        updated = dict(school)
        name = school['name']
        tier = school.get('tier', '')
        district = school.get('districtId', '')
        
        # 统计清洗前
        old_features = school.get('features', [])
        before_feature_counts.update(old_features)
        
        # 1. 清洗现有 features
        cleaned = clean_features(old_features)
        
        # 2. 从名称推断
        name_features = infer_features_from_name(name)
        
        # 3. 精确学校映射
        exact_features = []
        for key, feats in SCHOOL_FEATURE_MAP.items():
            if key in name:
                exact_features = feats
                break
        
        # 4. 按 tier 补充
        tier_features = TIER_FEATURES.get(tier, TIER_FEATURES.get('', []))
        
        # 5. 按区域补充
        district_features = DISTRICT_FEATURES.get(district, [])
        
        # 合并所有特色，去重，限制数量
        all_features = []
        seen = set()
        
        # 优先级：精确映射 > 名称推断 > tier 补充 > 区域补充 > 清洗保留
        for feat in exact_features + name_features + tier_features + district_features + cleaned:
            if feat and feat not in seen and len(all_features) < 6:
                seen.add(feat)
                all_features.append(feat)
        
        updated['features'] = all_features
        
        # 统计清洗后
        after_feature_counts.update(all_features)
        
        if len(all_features) != len(old_features):
            stats['features_changed'] += 1
        
        # 添加图片字段
        updated['image'] = get_image_for_school(school)
        stats['image_added'] += 1
        
        # 寄宿制、一贯制等从 tier 或名称推断的标签也写入 features（如果不存在）
        if '寄宿' in name or '寄宿制' in tier or school.get('isBoarding'):
            if '寄宿制' not in all_features and len(all_features) < 6:
                all_features.append('寄宿制')
        
        if '一贯' in name:
            if '九年一贯制' not in all_features and '十二年一贯制' not in all_features and len(all_features) < 6:
                if '十二年' in name:
                    all_features.append('十二年一贯制')
                else:
                    all_features.append('九年一贯制')
        
        updated['updatedAt'] = datetime.now().isoformat()
        updated_schools.append(updated)
    
    with open(SCHOOLS_PATH, 'w', encoding='utf-8') as f:
        json.dump(updated_schools, f, ensure_ascii=False, indent=2)
    
    print('✅ 数据已保存')
    print()
    print('=' * 60)
    print('📊 统计报告')
    print('=' * 60)
    print(f'  features 变更学校数: {stats["features_changed"]}')
    print(f'  image 字段添加: {stats["image_added"]}')
    print()
    print('清洗前 Top 10 features:')
    for feat, count in before_feature_counts.most_common(10):
        print(f'  {feat}: {count}')
    print()
    print('清洗后 Top 20 features:')
    for feat, count in after_feature_counts.most_common(20):
        print(f'  {feat}: {count}')
    print()
    
    # 抽样检查
    print('抽样检查:')
    for tier in ['四校', '八大', '市实验性示范性高中', '公办初中', '民办初中']:
        schools_in_tier = [s for s in updated_schools if s['tier'] == tier]
        if schools_in_tier:
            s = schools_in_tier[0]
            print(f'  [{tier}] {s["name"]}')
            print(f'    features: {s["features"]}')
            print(f'    image: {s["image"]}')


if __name__ == '__main__':
    main()
