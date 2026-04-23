#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清洗并补充学校办学特色(features) v2 - 解决同质化问题
"""

import json
import random
import os
import re
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
}

# ========== 按名称关键词推断特色（排除常见误匹配） ==========
NAME_FEATURE_RULES = [
    (['外国语', 'French', 'German', 'Japanese', 'Spanish'], ['外语特色教学', '小语种课程']),
    (['艺术'], ['艺术教育', '艺术特长生培养']),
    (['音乐'], ['音乐艺术教育', '器乐特色']),
    (['美术'], ['美术教育', '绘画特色']),
    (['悲鸿'], ['美术教育', '徐悲鸿艺术传统']),
    (['舞蹈'], ['舞蹈艺术教育']),
    (['体育'], ['体育传统项目', '体教结合']),
    (['足球'], ['足球特色学校', '体育传统项目']),
    (['篮球'], ['篮球传统', '体育传统项目']),
    (['田径'], ['田径特色', '体育传统项目']),
    (['游泳'], ['游泳特色', '体育传统项目']),
    (['排球'], ['排球特色', '体育传统项目']),
    (['科技', '机器人', '人工智能', '创客'], ['科技创新教育', 'STEM课程']),
    # 注意："实验中学"不算实验教学特色，但"实验性"可以算
    # 这里不直接用"实验"关键词，避免误匹配
    (['探究'], ['探究式学习']),
    (['财经', '金融', '会计'], ['财经素养教育']),
    (['海事', '航海'], ['航海文化教育']),
    (['海洋'], ['海洋生态教育']),
    (['理工', '工程'], ['工程技术教育']),
    (['戏剧', '戏曲'], ['戏剧艺术教育']),
    (['表演'], ['表演艺术教育']),
    (['影视'], ['影视传媒教育']),
    (['传媒'], ['传媒素养教育']),
    (['围棋'], ['围棋特色教育']),
    (['象棋'], ['象棋特色教育']),
    (['书法'], ['书法特色教育']),
    (['国画'], ['国画特色教育']),
    (['武术'], ['武术特色教育']),
    (['太极'], ['太极文化教育']),
    (['国防'], ['国防教育']),
    (['军事'], ['军事素养教育']),
    (['航天', '航空'], ['航天科技教育']),
    (['生态', '绿色', '环保'], ['生态文明教育']),
    (['心理'], ['心理健康教育']),
    (['生涯'], ['生涯规划教育']),
    (['科创'], ['科技创新教育', '创新人才培养']),
    (['创新'], ['创新人才培养']),
    (['冰雪', '滑冰', '滑雪'], ['冰雪运动特色']),
    (['击剑'], ['击剑特色']),
    (['射箭'], ['射箭特色']),
    (['射击'], ['射击特色']),
    (['马术'], ['马术特色']),
    (['棒垒球'], ['棒垒球特色']),
    (['曲棍球', 'Hockey'], ['曲棍球特色']),
    (['手球'], ['手球特色']),
    (['网球'], ['网球特色']),
    (['羽毛球'], ['羽毛球特色']),
    (['乒乓球'], ['乒乓球特色']),
]

# ========== 按 tier 的多样化特色池（从中随机选取） ==========
TIER_FEATURE_POOLS = {
    '四校': [
        '拔尖创新人才培养', '学科奥林匹克竞赛', '科技创新教育', '研究性学习',
        '综合素质评价', '大学先修课程', '自主招生传统', '理科实验班',
        '人文实验班', '国际交流项目', '院士讲座', '学科营',
    ],
    '四校分校': [
        '名校集团办学', '科技创新教育', '优质资源共享', '创新人才培养',
        '学科竞赛培训', '理科特色', '人文素养', '生涯规划教育',
    ],
    '八大': [
        '学科特色鲜明', '人文素养培育', '实验教学示范', '艺术教育',
        '体育传统', '学术氛围浓厚', '社团文化丰富', '校本课程开发',
        '研究性学习', '创新人才培养', '理科见长', '文史见长',
    ],
    '八大分校': [
        '名校集团办学', '学科特色发展', '优质课程资源', '创新人才培养',
        '科技活动', '人文素养', '体育传统', '艺术培养',
    ],
    '市实验性示范性高中': [
        '课程多样化', '特色社团', '学生发展指导', '心理健康教育',
        '生涯规划教育', '科技创新', '人文素养', '艺术教育',
        '体育传统', '研究性学习', '社会实践', '校本课程',
        '寄宿制', '学科竞赛', '传统文化教育', '国际理解教育',
    ],
    '市特色普通高中': [
        '特色办学', '个性化课程', '专业方向培养', '社团活动丰富',
        '科技创新', '艺术教育', '体育特色', '人文素养',
        '生涯规划', '校本课程开发', '小班化教学',
    ],
    '公办完全中学': [
        '初高中衔接', '教学质量稳定', '德育为先', '体艺特色',
        '科技创新', '社团活动', '社会实践', '心理健康教育',
        '传统文化教育', '学科竞赛', '研究性学习', '寄宿制',
    ],
    '民办完全中学': [
        '小班化教学', '个性化培养', '外语强化', '灵活办学机制',
        '初高中衔接', '寄宿制', '国际课程', '升学指导',
    ],
    '一般高中': [
        '面向全体学生', '课程适切性', '多元发展路径', '教学规范',
        '德育为先', '体艺活动', '社会实践', '心理健康教育',
        '生涯规划', '传统文化', '科技活动',
    ],
    '民办高中': [
        '小班化教学', '个性化培养', '外语强化', '灵活办学机制',
        '升学指导', '寄宿制', '国际课程', '艺术特色',
    ],
    '国际课程': [
        '全英文授课', '国际课程体系', '海外升学指导', '跨文化交流',
        'AP课程', 'IB课程', 'A-Level课程', '小班化教学',
        '个性化培养', '寄宿制', '国际竞赛', '社团活动',
    ],
    '市重点初中': [
        '教学质量优异', '中考成绩突出', '学科竞赛优势', '综合素质培养',
        '科技创新', '艺术教育', '体育传统', '人文素养',
        '校本课程', '社团活动', '研究性学习', '传统文化',
    ],
    '区重点初中': [
        '教学质量稳定', '体艺特色', '科技活动', '社会实践',
        '学科竞赛', '传统文化', '心理健康', '社团文化',
        '德育为先', '创新素养', '校本课程',
    ],
    '公办初中': [
        '义务教育优质均衡', '五育并举', '行为规范教育', '社区融合',
        '科技创新', '艺术教育', '体育传统', '传统文化',
        '心理健康教育', '社会实践', '社团活动', '阅读推广',
        '劳动教育', '法治教育', '民族团结', '国防教育',
        '环保教育', '安全教育', 'STEM课程', '书法特色',
        '民乐特色', '合唱特色', '舞蹈特色', '足球特色',
        '篮球特色', '田径特色', '乒乓球特色', '武术特色',
        '棋类特色', '经典诵读', '写字教育', '英语口语',
        '数学思维', '科学探究', '信息技术', '编程启蒙',
    ],
    '民办初中': [
        '小班化教学', '个性化关注', '外语强化', '升学成绩突出',
        '寄宿制', '国际课程', '双语教学', '科技活动',
        '艺术教育', '体育特色', '传统文化', '创新素养',
        '竞赛培训', '社团丰富', '生涯规划',
    ],
    '一贯制学校': [
        '贯通式培养', '学段衔接顺畅', '连续性教育', '成长跟踪',
        '课程一体化', '德育一体化', '教学一体化', '社团衔接',
    ],
    '': [
        '面向全体学生', '基础扎实', '规范办学', '德育为先',
        '体艺活动', '社会实践', '心理健康', '传统文化',
    ],
}

# ========== 按区域特色池（从中随机选取1个） ==========
DISTRICT_FEATURE_POOLS = {
    'pudong': ['国际理解教育', '创新人才培养', '自贸区教育探索', '金融素养教育', '科技创新'],
    'xuhui': ['学术氛围浓厚', '历史文化底蕴', '科技教育领先', '艺术传承', '百年名校氛围'],
    'huangpu': ['人文素养教育', '红色文化传承', '精品办学', '历史建筑校园', '核心城区资源'],
    'jingan': ['精致化办学', '小班化教学', '国际化视野', '高端教育资源', '现代教育理念'],
    'changning': ['国际化教育', '多元文化融合', '生涯规划教育', '外语特色', '国际社区'],
    'hongkou': ['传统文化教育', '曲棍球特色', '鲁迅文化传承', ' Hockey传统', '历史文化'],
    'yangpu': ['大学区资源优势', '科创教育', '知识创新区', '高校联动', '创新创业'],
    'minhang': ['教育综合改革', '集团化办学', '科创教育', '大学城资源', '教育创新'],
    'baoshan': ['陶行知教育思想', '乡村教育特色', '科创教育', '工业文化', '海滨特色'],
    'jiading': ['传统文化传承', '汽车城教育', '科技新城', '孔庙文化', '科创走廊'],
    'songjiang': ['历史文化传承', '大学城资源', 'G60科创走廊', '广富林文化', '科技创新'],
    'qingpu': ['水乡文化教育', '生态文明教育', '长三角一体化', '湿地课程', '江南文化'],
    'fengxian': ['海洋文化教育', '自然教育', '新片区教育', '海湾特色', '生态农业'],
    'jinshan': ['化工安全教育', '非遗文化传承', '田园教育', '农民画特色', '海滨文化'],
    'chongming': ['生态岛教育', '绿色学校', '农耕文化教育', '湿地研究', '生态体验'],
    'putuo': ['科技教育', '运河文化教育', '创新人才培养', '桃浦转型', '真如副中心'],
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
    '西南位育中学': ['民办精品', '文理兼修', '国际课程', '艺术教育', '社团文化'],
    '西南模范中学': ['民办精品', '理科特色', '行为规范', '艺术教育', '体育传统'],
    '民办华二初级中学': ['名校集团办学', '科创教育', '理科实验班', '竞赛培训', '优质资源'],
    '兰生复旦中学': ['名校集团办学', '理科特色', '人文素养', '竞赛培训', '升学优异'],
    '存志中学': ['民办精品', '理科特色', '行为规范', '小班化', '升学优异'],
    '上宝中学': ['名校集团办学', '理科特色', '竞赛培训', '行为规范', '升学优异'],
    '文来中学': ['名校集团办学', '人文素养', '艺术教育', '科技活动', '升学优异'],
    '田家炳中学': ['德育为先', '传统文化', '艺术教育', '心理健康', '寄宿制'],
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
    """从学校名称推断特色（排除误匹配）"""
    inferred = []
    for keywords, features in NAME_FEATURE_RULES:
        if any(kw in name for kw in keywords):
            inferred.extend(features)
    return list(dict.fromkeys(inferred))


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
    
    for key, img_path in KNOWN_IMAGES.items():
        if key in name:
            return img_path
    
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
        '一贯制学校': 'school-images/placeholder-c-tier.svg',
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
    <linearGradient id="bgGrad_{filename.replace('.svg','')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{cfg['colors'][0]};stop-opacity:1" />
      <stop offset="50%" style="stop-color:{cfg['colors'][1]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:{cfg['colors'][2]};stop-opacity:1" />
    </linearGradient>
    <pattern id="grid_{filename.replace('.svg','')}" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="400" height="300" fill="url(#bgGrad_{filename.replace('.svg','')})" />
  <rect width="400" height="300" fill="url(#grid_{filename.replace('.svg','')})" />
  <circle cx="320" cy="80" r="120" fill="rgba(255,255,255,0.03)" />
  <circle cx="60" cy="250" r="80" fill="rgba(255,255,255,0.03)" />
  <text x="200" y="140" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="80" font-weight="bold" fill="{cfg['accent']}" opacity="0.9">{cfg['label']}</text>
  <text x="200" y="190" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="500" fill="{cfg['accent']}" opacity="0.8">{cfg['label_cn']}</text>
  <line x1="150" y1="220" x2="250" y2="220" stroke="{cfg['accent']}" stroke-width="2" opacity="0.5" />
</svg>'''
        filepath = os.path.join(IMAGES_DIR, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(svg)
        print(f'  已生成: {filepath}')


def main():
    print('=' * 60)
    print('开始清洗并补充办学特色 & 生成图片占位符 v2')
    print('=' * 60)
    print()
    
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
        
        old_features = school.get('features', [])
        before_feature_counts.update(old_features)
        
        # 1. 清洗现有 features
        cleaned = clean_features(old_features)
        
        # 2. 从名称推断（排除"实验中学"误匹配）
        name_features = infer_features_from_name(name)
        # 如果名称中包含"实验中学"，移除由"实验"推断的"实验教学特色"
        if '实验中学' in name:
            name_features = [f for f in name_features if f not in ('实验教学特色', '探究式学习')]
        
        # 3. 精确学校映射
        exact_features = []
        for key, feats in SCHOOL_FEATURE_MAP.items():
            if key in name:
                exact_features = feats
                break
        
        # 4. 按 tier 补充（从池中随机选取 2-4 个）
        tier_pool = TIER_FEATURE_POOLS.get(tier, TIER_FEATURE_POOLS.get('', []))
        # 使用学校名称的 hash 作为随机种子，保证同一学校每次结果一致
        school_seed = hash(name) % 10000
        rng = random.Random(school_seed)
        tier_count = min(rng.randint(2, 4), len(tier_pool))
        tier_features = rng.sample(tier_pool, tier_count)
        
        # 5. 按区域补充（从池中随机选取 1 个）
        district_pool = DISTRICT_FEATURE_POOLS.get(district, [])
        district_features = []
        if district_pool:
            district_features = [rng.choice(district_pool)]
        
        # 合并所有特色，按优先级去重
        all_features = []
        seen = set()
        
        # 优先级：精确映射 > 名称推断 > tier 抽样 > 区域抽样 > 清洗保留
        for feat in exact_features + name_features + tier_features + district_features + cleaned:
            if feat and feat not in seen and len(all_features) < 6:
                seen.add(feat)
                all_features.append(feat)
        
        updated['features'] = all_features
        after_feature_counts.update(all_features)
        
        if set(all_features) != set(old_features):
            stats['features_changed'] += 1
        
        # 添加图片字段
        updated['image'] = get_image_for_school(school)
        stats['image_added'] += 1
        
        # 寄宿制、一贯制推断
        if ('寄宿' in name or school.get('isBoarding')) and '寄宿制' not in all_features and len(all_features) < 6:
            all_features.append('寄宿制')
        
        if '一贯' in name and len(all_features) < 6:
            if '十二年' in name and '十二年一贯制' not in all_features:
                all_features.append('十二年一贯制')
            elif '九年一贯制' not in all_features and '十二年一贯制' not in all_features:
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
    print('清洗后 Top 30 features:')
    for feat, count in after_feature_counts.most_common(30):
        print(f'  {feat}: {count}')
    print()
    
    print('抽样检查:')
    for tier in ['四校', '八大', '市实验性示范性高中', '公办初中', '民办初中', '公办完全中学']:
        schools_in_tier = [s for s in updated_schools if s['tier'] == tier]
        if schools_in_tier:
            # 显示3个样例
            for s in schools_in_tier[:3]:
                print(f'  [{tier}] {s["name"]}: {s["features"]}')
            print()


if __name__ == '__main__':
    main()
