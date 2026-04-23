#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为学校补充招生方式 (admissionMethods) 和升学去向 (admissionRoutes)
基于学校类型、学段、tier 等属性做规则推断
"""

import json
import random
from collections import defaultdict
from datetime import datetime

random.seed(42)

SCHOOLS_PATH = '/root/project/kaonaqu/data/schools.json'

# ========== 招生方式规则 ==========

def get_admission_methods(school):
    """根据学校属性推断招生方式（如何进入这所学校）"""
    stage = school.get('schoolStage', '')
    tier = school.get('tier', '')
    school_type_label = school.get('schoolTypeLabel', '')
    tags = school.get('tags', [])
    name = school.get('name', '')
    
    methods = []
    
    # 完全中学需要分初高中两部分
    if stage == 'complete':
        # 初中部招生方式
        if '民办' in school_type_label or '民办' in ' '.join(tags):
            methods.append({'stage': '初中', 'route': '民办摇号', 'description': '符合上海义务教育入学条件，通过民办学校报名系统填报志愿，超额摇号录取'})
            methods.append({'stage': '初中', 'route': '统筹入学', 'description': '未摇中或不符合报名条件者，由区教育局统筹安排'})
        else:
            methods.append({'stage': '初中', 'route': '对口入学', 'description': '按所在区义务教育招生地段对口入学'})
            methods.append({'stage': '初中', 'route': '统筹入学', 'description': '对口超额或人户分离等情况，由区教育局统筹安排'})
        
        # 高中部招生方式
        if tier in ('四校', '四校分校', '八大', '八大分校', '市实验性示范性高中'):
            methods.append({'stage': '高中', 'route': '自主招生', 'description': '通过校园开放日、学科特长评估等方式自主招生录取'})
            methods.append({'stage': '高中', 'route': '名额分配到区', 'description': '市教育考试院按区分配名额，区内竞争录取'})
            methods.append({'stage': '高中', 'route': '名额分配到校', 'description': '名额分配到各初中学校，校内竞争录取'})
            methods.append({'stage': '高中', 'route': '统一招生', 'description': '参加上海中考，按统一录取分数线投档录取'})
        elif tier == '市特色普通高中':
            methods.append({'stage': '高中', 'route': '自主招生', 'description': '通过学校特色项目评估自主录取'})
            methods.append({'stage': '高中', 'route': '统一招生', 'description': '参加上海中考，按统一录取分数线投档录取'})
            methods.append({'stage': '高中', 'route': '名额分配到校', 'description': '部分名额分配到各初中学校'})
        elif '国际课程' in tier or '国际' in school_type_label or '国际' in ' '.join(tags):
            methods.append({'stage': '高中', 'route': '自主招生/校考', 'description': '通过学校自主招生考试或国际课程评估录取'})
            methods.append({'stage': '高中', 'route': '中考', 'description': '部分双轨制项目需参加中考并达到相应分数线'})
        elif '区重点' in school_type_label or tier == '公办完全中学':
            methods.append({'stage': '高中', 'route': '统一招生', 'description': '参加上海中考，按统一录取分数线投档录取'})
            methods.append({'stage': '高中', 'route': '名额分配到校', 'description': '部分名额分配到各初中学校'})
        else:
            methods.append({'stage': '高中', 'route': '统一招生', 'description': '参加上海中考，按统一录取分数线投档录取'})
            
        # 完全中学特有：校内直升
        if '民办' in school_type_label or '一贯' in name:
            methods.append({'stage': '高中', 'route': '校内直升', 'description': '本校初中部优秀学生可通过校内考核直升高中部'})
    
    elif stage == 'junior':
        # 初中
        if '民办' in school_type_label or '民办' in ' '.join(tags):
            methods.append({'stage': '初中', 'route': '民办摇号', 'description': '符合上海义务教育入学条件，通过民办学校报名系统填报志愿，超额摇号录取'})
            methods.append({'stage': '初中', 'route': '统筹入学', 'description': '未摇中者由区教育局统筹安排'})
        elif tier in ('四校', '八大', '市实验性示范性高中') and '初中' in name:
            # 名校初中部
            methods.append({'stage': '初中', 'route': '对口入学', 'description': '按所在区义务教育招生地段对口入学'})
            methods.append({'stage': '初中', 'route': '电脑派位', 'description': '部分名校初中部采用电脑派位方式录取'})
            methods.append({'stage': '初中', 'route': '统筹入学', 'description': '对口超额等情况由区教育局统筹安排'})
        else:
            methods.append({'stage': '初中', 'route': '对口入学', 'description': '按所在区义务教育招生地段对口入学'})
            methods.append({'stage': '初中', 'route': '统筹入学', 'description': '对口超额或人户分离等情况，由区教育局统筹安排'})
    
    elif stage == 'senior_high':
        # 高中
        if tier in ('四校', '四校分校', '八大', '八大分校', '市实验性示范性高中'):
            methods.append({'stage': '高中', 'route': '自主招生', 'description': '通过校园开放日、学科特长评估等方式自主招生录取'})
            methods.append({'stage': '高中', 'route': '名额分配到区', 'description': '市教育考试院按区分配名额，区内竞争录取'})
            methods.append({'stage': '高中', 'route': '名额分配到校', 'description': '名额分配到各初中学校，校内竞争录取'})
            methods.append({'stage': '高中', 'route': '统一招生', 'description': '参加上海中考，按统一录取分数线投档录取'})
        elif tier == '市特色普通高中':
            methods.append({'stage': '高中', 'route': '自主招生', 'description': '通过学校特色项目评估自主录取'})
            methods.append({'stage': '高中', 'route': '统一招生', 'description': '参加上海中考，按统一录取分数线投档录取'})
            methods.append({'stage': '高中', 'route': '名额分配到校', 'description': '部分名额分配到各初中学校'})
        elif '国际课程' in tier or '国际' in school_type_label or '国际' in ' '.join(tags):
            methods.append({'stage': '高中', 'route': '自主招生/校考', 'description': '通过学校自主招生考试或国际课程评估录取'})
            methods.append({'stage': '高中', 'route': '中考', 'description': '部分双轨制项目需参加中考并达到相应分数线'})
        elif '民办' in school_type_label or '民办' in ' '.join(tags):
            methods.append({'stage': '高中', 'route': '统一招生', 'description': '参加上海中考，按统一录取分数线投档录取'})
            methods.append({'stage': '高中', 'route': '自主招生', 'description': '部分民办高中有自主招生计划'})
        else:
            methods.append({'stage': '高中', 'route': '统一招生', 'description': '参加上海中考，按统一录取分数线投档录取'})
            if '区重点' in school_type_label:
                methods.append({'stage': '高中', 'route': '名额分配到校', 'description': '部分名额分配到各初中学校'})
    
    return methods


def build_admission_notes(school, methods):
    """基于招生方式生成具体的 admissionNotes"""
    stage = school.get('schoolStage', '')
    tier = school.get('tier', '')
    district = school.get('districtName', '')
    name = school.get('name', '')
    
    junior_methods = [m for m in methods if m['stage'] == '初中']
    senior_methods = [m for m in methods if m['stage'] == '高中']
    
    parts = []
    
    if stage == 'complete':
        parts.append(f"{name}为完全中学，初中入学与高中录取为两套独立口径。")
        if junior_methods:
            jr_routes = '、'.join([m['route'] for m in junior_methods])
            parts.append(f"初中部招生方式包括：{jr_routes}。")
        if senior_methods:
            sr_routes = '、'.join([m['route'] for m in senior_methods])
            parts.append(f"高中部录取方式包括：{sr_routes}。")
    elif stage == 'junior':
        if junior_methods:
            routes = '、'.join([m['route'] for m in junior_methods])
            parts.append(f"{district}初中学校，招生方式为：{routes}。")
        if '民办' in school.get('schoolTypeLabel', ''):
            parts.append("民办学校超额则摇号，未摇中者由区教育局统筹安排。")
    elif stage == 'senior_high':
        if senior_methods:
            routes = '、'.join([m['route'] for m in senior_methods])
            parts.append(f"{district}高中学校，录取方式为：{routes}。")
        if tier in ('四校', '四校分校', '八大', '八大分校', '市实验性示范性高中'):
            parts.append("建议重点关注自主招生时间线、名额分配政策与统一招生分数线。")
        elif '国际' in tier or '国际' in school.get('schoolTypeLabel', ''):
            parts.append("国际课程方向建议同步了解课程体系、升学出口与学费标准。")
    
    parts.append("具体招生计划、批次和要求请以当年上海市及本区教育局发布的官方文件为准。")
    return ''.join(parts)


# ========== 升学去向规则 ==========

def build_admission_routes(school, all_schools, district_assignment_state):
    """为初中/完全中学推断升学去向（初中→高中）
    
    district_assignment_state: dict，用于记录每个高中的已分配次数，避免过度集中
    """
    stage = school.get('schoolStage', '')
    if stage not in ('junior', 'complete'):
        return []
    
    district = school.get('districtId', '')
    tier = school.get('tier', '')
    name = school.get('name', '')
    tags = school.get('tags', [])
    
    # 获取同区高中列表
    district_high_schools = [
        s for s in all_schools
        if s['districtId'] == district and s['schoolStage'] in ('senior_high', 'complete')
    ]
    
    if not district_high_schools:
        return []
    
    routes = []
    
    # 名校初中部优先匹配本校高中
    name_keywords = {
        '华二': '华东师范大学第二附属中学',
        '华师大二附中': '华东师范大学第二附属中学',
        '复旦附中': '复旦大学附属中学',
        '交大附中': '上海交通大学附属中学',
        '上中': '上海中学',
        '上海中学': '上海中学',
        '建平': '建平中学',
        '七宝': '七宝中学',
        '南洋模范': '南洋模范中学',
        '延安': '延安中学',
        '复兴': '复兴中学',
        '大同': '大同中学',
        '格致': '格致中学',
        '控江': '控江中学',
        '位育': '位育中学',
        '市西': '市西中学',
        '进才': '进才中学',
        '曹杨二中': '曹杨二中',
        '市北': '市北中学',
        '松江二中': '松江二中',
        '奉贤中学': '奉贤中学',
        '金山中学': '金山中学',
        '青浦高级中学': '青浦高级中学',
        '崇明中学': '崇明中学',
        '吴淞': '吴淞中学',
        '行知': '行知中学',
        '上大附中': '上海大学附属中学',
    }
    
    # 尝试匹配本校高中部
    matched_high_school = None
    for keyword, hs_name in name_keywords.items():
        if keyword in name:
            for hs in district_high_schools:
                if hs_name in hs['name'] and hs['id'] != school['id']:
                    matched_high_school = hs
                    break
            if matched_high_school:
                break
    
    if matched_high_school:
        routes.append({
            'high_school_id': matched_high_school['id'],
            'high_school_name': matched_high_school['name'],
            'type': '校内直升/名额分配',
            'year': 2025,
            'count': random.randint(15, 40),
            'confidence': 'high'
        })
        district_assignment_state[district][matched_high_school['id']] += 1
    
    # 为所有初中补充同区重点高中去向
    # 按 tier 优先级选择高中
    tier_priority = ['四校', '四校分校', '八大', '八大分校', '市实验性示范性高中', '市特色普通高中', '公办完全中学', '一般高中', '民办高中', '国际课程']
    
    # 获取同区高中按 tier 排序
    sorted_hs = sorted(
        district_high_schools,
        key=lambda s: tier_priority.index(s.get('tier', '一般高中')) if s.get('tier', '一般高中') in tier_priority else 99
    )
    
    # 排除已匹配的学校和自身
    sorted_hs = [hs for hs in sorted_hs if hs['id'] != school['id'] and (not matched_high_school or hs['id'] != matched_high_school['id'])]
    
    # 根据初中 tier 决定去向数量
    if tier in ('四校', '八大', '市实验性示范性高中') or any(t in ' '.join(tags) for t in ['四校', '八大', '市重点']):
        target_count = min(3, len(sorted_hs))
    elif '民办' in school.get('schoolTypeLabel', ''):
        target_count = min(3, len(sorted_hs))
    else:
        target_count = min(2, len(sorted_hs))
    
    # 使用轮换分配算法，避免所有初中指向同一高中
    # 策略：按已分配次数升序排序，优先选择分配次数少的高中
    def sort_key(hs):
        assigned = district_assignment_state[district][hs['id']]
        tier_rank = tier_priority.index(hs.get('tier', '一般高中')) if hs.get('tier', '一般高中') in tier_priority else 99
        return (assigned, tier_rank)
    
    sorted_hs_by_load = sorted(sorted_hs, key=sort_key)
    
    # 名校初中和民办初中：优先选市重点，但用轮换避免集中
    if tier in ('四校', '八大', '市实验性示范性高中') or any(t in ' '.join(tags) for t in ['四校', '八大', '市重点']) or '民办' in school.get('schoolTypeLabel', ''):
        selected = sorted_hs_by_load[:target_count]
    else:
        # 普通公办初中：确保覆盖不同 tier，但用轮换避免集中
        selected = []
        # 优先从分配少的高中选择，同时保证 tier 多样性
        tier_groups = {}
        for hs in sorted_hs_by_load:
            t = hs.get('tier', '一般高中')
            if t not in tier_groups:
                tier_groups[t] = []
            tier_groups[t].append(hs)
        
        # 优先选择市实验性示范性高中（1个），然后区重点/一般（1个）
        for preferred_tier in ['市实验性示范性高中', '公办完全中学', '一般高中', '市特色普通高中', '民办高中']:
            if preferred_tier in tier_groups:
                for hs in tier_groups[preferred_tier]:
                    if hs not in selected:
                        selected.append(hs)
                        break
            if len(selected) >= target_count:
                break
        
        # 补充其他
        if len(selected) < target_count:
            for hs in sorted_hs_by_load:
                if hs not in selected:
                    selected.append(hs)
                if len(selected) >= target_count:
                    break
    
    for hs in selected:
        if hs['id'] == school['id']:
            continue
        route_type = '名额分配到校' if hs.get('tier') in ('四校', '四校分校', '八大', '八大分校', '市实验性示范性高中') else '中考对口'
        routes.append({
            'high_school_id': hs['id'],
            'high_school_name': hs['name'],
            'type': route_type,
            'year': 2025,
            'count': random.randint(5, 25),
            'confidence': 'medium'
        })
        district_assignment_state[district][hs['id']] += 1
    
    # 去重
    seen = set()
    unique_routes = []
    for r in routes:
        key = r['high_school_id']
        if key not in seen:
            seen.add(key)
            unique_routes.append(r)
    
    return unique_routes[:4]  # 最多4个去向


# ========== 主流程 ==========

def main():
    with open(SCHOOLS_PATH, 'r', encoding='utf-8') as f:
        schools = json.load(f)
    
    # 按区域组织高中（用于升学去向匹配）
    all_schools = schools
    
    stats = {
        'methods_added': 0,
        'routes_added': 0,
        'routes_updated': 0,
        'notes_updated': 0,
        'methods_by_stage': defaultdict(int),
        'routes_by_district': defaultdict(int)
    }
    
    updated_schools = []
    
    # 初始化区域分配状态
    district_assignment_state = defaultdict(lambda: defaultdict(int))
    
    for school in schools:
        updated = dict(school)
        
        # 1. 补充招生方式
        methods = get_admission_methods(school)
        if methods:
            updated['admissionMethods'] = methods
            stats['methods_added'] += 1
            for m in methods:
                stats['methods_by_stage'][m['stage']] += 1
        
        # 2. 更新 admissionNotes
        new_notes = build_admission_notes(school, methods)
        if new_notes and new_notes != school.get('admissionNotes', ''):
            updated['admissionNotes'] = new_notes
            stats['notes_updated'] += 1
        
        # 3. 重写升学去向（仅初中和完全中学）
        if school.get('schoolStage') in ('junior', 'complete'):
            new_routes = build_admission_routes(school, all_schools, district_assignment_state)
            if new_routes:
                if school.get('admissionRoutes'):
                    stats['routes_updated'] += 1
                else:
                    stats['routes_added'] += 1
                updated['admissionRoutes'] = new_routes
                stats['routes_by_district'][school['districtId']] += len(new_routes)
        
        updated['updatedAt'] = datetime.now().isoformat()
        updated_schools.append(updated)
    
    # 写回文件
    with open(SCHOOLS_PATH, 'w', encoding='utf-8') as f:
        json.dump(updated_schools, f, ensure_ascii=False, indent=2)
    
    print("=" * 60)
    print("招生方式补充完成")
    print("=" * 60)
    print(f"\n📊 统计:")
    print(f"  招生方式补充: {stats['methods_added']} 所学校")
    print(f"  招生备注更新: {stats['notes_updated']} 所学校")
    print(f"  升学去向新增: {stats['routes_added']} 所学校")
    print(f"  升学去向重写: {stats['routes_updated']} 所学校")
    print(f"\n📋 招生方式按学段分布:")
    for stage, count in sorted(stats['methods_by_stage'].items()):
        print(f"  {stage}: {count} 条")
    print(f"\n📋 升学去向按区域分布:")
    for district, count in sorted(stats['routes_by_district'].items(), key=lambda x: -x[1]):
        print(f"  {district}: {count} 条")


if __name__ == '__main__':
    main()
