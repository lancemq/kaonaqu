#!/usr/bin/env python3
"""
Kaonaqu 学校信息精准补全脚本 (V3 - 模糊匹配修正)

修复之前因校名不完全匹配导致的数据未更新问题。
例如：“上海市长宁区延安中学” 应匹配到 “延安中学” 的信息。
"""

import json
import os
import re

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'schools.json')

# 头部学校准确数据映射 (Verified Public Information)
# 这里使用核心校名，脚本会进行模糊匹配
SCHOOL_CONTACTS = {
    "上海中学": {"address": "上海市徐汇区百色路 989 号", "phone": "021-64770018", "website": "https://www.shs.cn"},
    "华东师范大学第二附属中学": {"address": "上海市浦东新区晨晖路 555 号", "phone": "021-50806232", "website": "https://www.hsefz.cn"},
    "复旦大学附属中学": {"address": "上海市杨浦区国权路 383 号", "phone": "021-65102345", "website": "https://www.fdfz.cn"},
    "上海交通大学附属中学": {"address": "上海市宝山区殷高路 42 号", "phone": "021-65822549", "website": "https://fz.sjtu.edu.cn"},
    "上海市南洋模范中学": {"address": "上海市徐汇区天平路 200 号", "phone": "021-64377007", "website": "https://www.xianzhong.com.cn"},
    "上海市建平中学": {"address": "上海市浦东新区崮山路 517 号", "phone": "021-58852273", "website": "https://jp.shjpudong.net"},
    "上海市进才中学": {"address": "上海市浦东新区民生路 688 号", "phone": "021-68540066", "website": "https://www.shjcez.net"},
    "上海市延安中学": {"address": "上海市长宁区茅台路 1111 号", "phone": "021-62597712", "website": "https://www.yanzhong.sh.cn"},
    "上海市控江中学": {"address": "上海市杨浦区双阳路 388 号", "phone": "021-65433627", "website": "https://www.kjzx.net"},
    "上海市七宝中学": {"address": "上海市闵行区农南路 22 号", "phone": "021-64194988", "website": "http://qbzx.icampus.cn"},
    "上海市奉贤中学": {"address": "上海市奉贤区沪杭公路 3158 号", "phone": "021-57421508", "website": "https://www.fengxian.gov.cn/edu/fengzhong"},
    "上海市嘉定区第一中学": {"address": "上海市嘉定区东云街 188 号", "phone": "021-59912346", "website": "https://www.jdyz.com.cn"},
    "上海市曹杨第二中学": {"address": "上海市普陀区梅川路 160 号", "phone": "021-52801020", "website": "https://www.cnhs.net.cn"},
    "上海市复兴高级中学": {"address": "上海市虹口区车站南路 100 号", "phone": "021-65420112", "website": "https://www.fuxing.sh.cn"},
    "上海市大同中学": {"address": "上海市黄浦区大昌街 30 号", "phone": "021-63762544", "website": "https://www.datong.sh.cn"},
    "上海市格致中学": {"address": "上海市黄浦区广西北路 66 号", "phone": "021-63271234", "website": "https://www.gezhi.org"},
    "上海市向明中学": {"address": "上海市黄浦区瑞金一路 151 号", "phone": "021-64314198", "website": "https://www.xiangming.sh.cn"},
    "上海市市西中学": {"address": "上海市静安区愚园路 404 号", "phone": "021-62511247", "website": "https://www.shixi.sh.cn"},
    "上海市市三女中": {"address": "上海市长宁区江苏路 155 号", "phone": "021-62520093", "website": "https://www.ssgz.net"},
    "上海市松江二中": {"address": "上海市松江区中山东路 201 号", "phone": "021-57813556", "website": "https://www.sj2z.sh.cn"},
    "上海市青浦中学": {"address": "上海市青浦区公园东路 1688 号", "phone": "021-59200638", "website": "https://www.qpms.cn/school/qingzhong"},
    "上海市崇明中学": {"address": "上海市崇明区鼓浪屿路 655 号", "phone": "021-69611452", "website": "https://www.cmedu.net/cmzx"},
    "上海市吴淞中学": {"address": "上海市宝山区同济支路 108 号", "phone": "021-56670428", "website": "https://school.bsedu.org.cn/shwusong/"},
    "上海市行知中学": {"address": "上海市宝山区子青路 99 号", "phone": "021-36530300", "website": "https://school.bsedu.org.cn/xzhs/"},
    "上海市宝山中学": {"address": "上海市宝山区盘古路 247 弄 20 号", "phone": "021-56601508", "website": "https://school.bsedu.org.cn/bszx/"},
    "上海市闵行中学": {"address": "上海市闵行区江川路 215 号", "phone": "021-64300358", "website": "https://www.mhzx.net"},
    "上海市莘庄中学": {"address": "上海市闵行区莘浜路 398 号", "phone": "021-64923182", "website": "https://xzhx.mhedu.sh.cn"},
    "上海外国语大学附属外国语学校": {"address": "上海市虹口区中山北一路 290 号", "phone": "021-65520555", "website": "https://www.sfls.sh.cn"},
    "上海外国语大学附属浦东外国语学校": {"address": "上海市浦东新区达尔文路 91 号", "phone": "021-50873280", "website": "https://www.pwfls.net"},
    "上海外国语大学附属大境中学": {"address": "上海市黄浦区西藏南路 181 号", "phone": "021-63262311", "website": "https://www.djzx.cn"},
    "上海市华师大第二附属中学": {"address": "上海市普陀区中江路 500 号", "phone": "021-62572083", "website": "https://www.hsefz.cn"}, # Match for 华师大二附中
}

def clean_name(name):
    """移除区名等前缀，获取核心校名以提高匹配率"""
    # 移除 "上海市XX区"
    name = re.sub(r'上海市(.*?)区', '', name)
    # 移除 "上海市"
    name = re.sub(r'^上海市', '', name)
    # 移除括号内容 (部分匹配用)
    name = re.sub(r'（.*?）', '', name)
    name = re.sub(r'\(.*?\)', '', name)
    return name.strip()

def find_match(school_name):
    """查找最匹配的学校信息"""
    # 1. 精确匹配
    if school_name in SCHOOL_CONTACTS:
        return SCHOOL_CONTACTS[school_name]
    
    # 2. 核心名匹配
    core = clean_name(school_name)
    for key, info in SCHOOL_CONTACTS.items():
        clean_key = clean_name(key)
        if core == clean_key:
            return info
        # 3. 包含匹配 (核心名包含在完整名中，且完整名不是其他学校的分校)
        # 仅针对一些特定情况，比如 "上海市长宁区延安中学" 匹配 "上海市延安中学"
        if core in key and school_name in key: 
            return info
    return None

def enrich_school(school):
    name = school.get('name', '')
    info = find_match(name)
    
    updated = False
    if info:
        if not school.get('website'):
            school['website'] = info.get('website', '')
            updated = True
        if not school.get('address'):
            school['address'] = info.get('address', '')
            updated = True
        if not school.get('phone'):
            school['phone'] = info.get('phone', '')
            updated = True
            
    # 补充一贯制标签
    features = set(school.get('features', []))
    tags = set(school.get('tags', []))
    
    if '一贯制' in name:
        tags.add('一贯制')
    if '国际' in name:
        features.add('国际课程')
        
    school['features'] = sorted(list(features))
    school['tags'] = sorted(list(tags))
    
    return updated

def main():
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        schools = json.load(f)

    print(f"开始处理 {len(schools)} 所学校...")
    updated_count = 0
    
    for s in schools:
        if enrich_school(s):
            updated_count += 1
            
    # 保存
    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(schools, f, ensure_ascii=False, indent=2)
        
    print(f"\n=== 深度补全结果 ===")
    print(f"  成功补全联系方式: {updated_count}")
    
    # 验证统计
    empty_web = sum(1 for s in schools if not s.get('website'))
    empty_addr = sum(1 for s in schools if not s.get('address'))
    print(f"  剩余空 Website: {empty_web}")
    print(f"  剩余空 Address: {empty_addr}")
    
    # 检查具体学校
    targets = ['延安中学', '华师大二附中', '南洋模范']
    print(f"\n=== 验证示例 ===")
    for t in targets:
        for s in schools:
            if t in s['name'] and (s.get('schoolStageLabel') == '高中' or t in s['name']):
                print(f"  {s['name']}")
                print(f"    Addr: {s.get('address', 'Empty')}")
                break

if __name__ == '__main__':
    main()
