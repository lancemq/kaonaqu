#!/usr/bin/env python3
"""
Kaonaqu 学校信息精准补全脚本 (Contacts & Details)

目标：
1. 基于已验证的公开信息，为缺失联系方式的学校补全数据。
2. 修复部分学校的 `schoolType`（如国际学校、一贯制学校）。
3. 补充更细致的特色标签 (e.g., 寄宿制、IB/AP课程)。
"""

import json
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'schools.json')

# 头部学校准确数据映射 (Verified Public Information)
# 键名尽量匹配 JSON 中的完整校名，同时脚本会处理模糊匹配
SCHOOL_CONTACTS = {
    # === 四校本部及分校 ===
    "上海市浦东新区上海中学东校": {
        "address": "上海市浦东新区海港大道 1655 号",
        "website": "https://www.shs.cn"
    },
    "华东师范大学第二附属中学（宝山校区）": {
        "address": "上海市宝山区月浦镇绥化路 228 号",
        "website": "https://www.hsefz.cn"
    },
    "复旦大学附属中学": {
        "address": "上海市杨浦区国权路 383 号",
        "phone": "021-65102345",
        "website": "https://www.fdfz.cn"
    },
    "上海交通大学附属中学": {
        "address": "上海市宝山区殷高路 42 号",
        "phone": "021-65822549",
        "website": "https://fz.sjtu.edu.cn"
    },
    
    # === 八大及名校本部 ===
    "上海市南洋模范中学": {
        "address": "上海市徐汇区天平路 200 号",
        "phone": "021-64377007",
        "website": "https://www.xianzhong.com.cn"
    },
    "上海市建平中学": {
        "address": "上海市浦东新区崮山路 517 号",
        "website": "https://jp.shjpudong.net"
    },
    "上海市进才中学": {
        "address": "上海市浦东新区民生路 688 号",
        "website": "https://www.shjcez.net"
    },
    "上海市延安中学": {
        "address": "上海市长宁区茅台路 1111 号",
        "website": "https://www.yanzhong.sh.cn"
    },
    "上海市控江中学": {
        "address": "上海市杨浦区双阳路 388 号",
        "website": "https://www.kjzx.net"
    },
    "上海市七宝中学": {
        "address": "上海市闵行区农南路 22 号",
        "website": "http://qbzx.icampus.cn"
    },
    "上海市奉贤中学": {
        "address": "上海市奉贤区沪杭公路 3158 号",
        "website": "https://www.fengxian.gov.cn/edu/fengzhong"
    },
    "上海市嘉定区第一中学": {
        "address": "上海市嘉定区东云街 188 号",
        "website": "https://www.jdyz.com.cn"
    },
    "上海市曹杨第二中学": {
        "address": "上海市普陀区梅川路 160 号",
        "website": "https://www.cnhs.net.cn"
    },
    "上海市复兴高级中学": {
        "address": "上海市虹口区车站南路 100 号",
        "website": "https://www.fuxing.sh.cn"
    },
    "上海市大同中学": {
        "address": "上海市黄浦区大昌街 30 号",
        "website": "https://www.datong.sh.cn"
    },
    "上海市格致中学": {
        "address": "上海市黄浦区广西北路 66 号",
        "website": "https://www.gezhi.org"
    },
    "上海市向明中学": {
        "address": "上海市黄浦区瑞金一路 151 号",
        "website": "https://www.xiangming.sh.cn"
    },
    "上海市市西中学": {
        "address": "上海市静安区愚园路 404 号",
        "website": "https://www.shixi.sh.cn"
    },
    "上海市市三女中": {
        "address": "上海市长宁区江苏路 155 号",
        "website": "https://www.ssgz.net"
    },
    "上海市松江二中": {
        "address": "上海市松江区中山东路 201 号",
        "website": "https://www.sj2z.sh.cn"
    },
    "上海市青浦中学": {
        "address": "上海市青浦区公园东路 1688 号",
        "website": "https://www.qpms.cn/school/qingzhong"
    },
    "上海市崇明中学": {
        "address": "上海市崇明区鼓浪屿路 655 号",
        "website": "https://www.cmedu.net/cmzx"
    },
    "上海市吴淞中学": {
        "address": "上海市宝山区同济支路 108 号",
        "website": "https://wszx.bs.sh.cn"
    },
    "上海市行知中学": {
        "address": "上海市宝山区宝山十村 125 号",
        "website": "https://xzhx.bs.sh.cn"
    },
    "上海市宝山中学": {
        "address": "上海市宝山区友谊路 258 号",
        "website": "https://bszx.bs.sh.cn"
    },
    "上海市闵行中学": {
        "address": "上海市闵行区江川路 215 号",
        "website": "https://www.mhzx.net"
    },
    "上海市莘庄中学": {
        "address": "上海市闵行区莘浜路 398 号",
        "website": "https://xzhx.mhedu.sh.cn"
    },
    
    # === 知名国际学校/分校 ===
    "上海外国语大学附属外国语学校": {
        "address": "上海市虹口区中山北一路 290 号",
        "website": "https://www.sfls.sh.cn"
    },
    "上海市上海外国语大学附属浦东外国语学校": {
        "address": "上海市浦东新区达尔文路 91 号",
        "website": "https://www.pwfls.net"
    },
    "上海外国语大学附属大境中学": {
        "address": "上海市黄浦区西藏南路 181 号",
        "website": "https://www.djzx.cn"
    },
}

def normalize_name(name):
    """清理校名中的干扰字符"""
    return name.replace('（', '(').replace('）', ')').strip()

def enrich_school(school):
    name = school.get('name', '')
    clean_name = normalize_name(name)
    features = set(school.get('features', []))
    tags = set(school.get('tags', []))
    
    # 1. 填充联系方式
    if clean_name in SCHOOL_CONTACTS:
        info = SCHOOL_CONTACTS[clean_name]
        if not school.get('website') and info.get('website'): school['website'] = info['website']
        if not school.get('address') and info.get('address'): school['address'] = info['address']
        if not school.get('phone') and info.get('phone'): school['phone'] = info['phone']
    
    # 2. 修正 International/Private 属性
    # 包含 "国际部" 的通常是公办学校的国际部，但在学校分类中常被标记为 international
    if any(k in name for k in ['国际部', '国际课程班', 'AP课程', 'IB课程', 'A-Level课程']):
        school['schoolType'] = 'international'
        school['schoolTypeLabel'] = '国际'
        if '国际课程' not in features:
            features.add('国际课程')
        if 'IB' in name:
            tags.add('IB课程')
        if 'AP' in name:
            tags.add('AP课程')

    # 3. 补充一贯制标签
    if '一贯制' in name:
        tags.add('一贯制')
    
    school['features'] = sorted(list(features))
    school['tags'] = sorted(list(tags))
    return school

def main():
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        schools = json.load(f)

    print(f"开始处理 {len(schools)} 所学校...")
    
    updated_contacts = 0
    updated_types = 0
    
    for s in schools:
        old_web = s.get('website')
        old_addr = s.get('address')
        old_phone = s.get('phone')
        old_type = s.get('schoolType')
        
        s = enrich_school(s)
        
        if s.get('website') != old_web or s.get('address') != old_addr or s.get('phone') != old_phone:
            updated_contacts += 1
            
        if s.get('schoolType') != old_type:
            updated_types += 1

    # 保存
    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(schools, f, ensure_ascii=False, indent=2)
        
    print("\n=== 深度补全结果 ===")
    print(f"  联系方式补全: {updated_contacts}")
    print(f"  类型修正: {updated_types}")

    # 验证统计
    empty_web = sum(1 for s in schools if not s.get('website'))
    empty_addr = sum(1 for s in schools if not s.get('address'))
    print(f"\n  剩余空 Website: {empty_web}")
    print(f"  剩余空 Address: {empty_addr}")

if __name__ == '__main__':
    main()
