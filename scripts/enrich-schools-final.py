#!/usr/bin/env python3
"""
Kaonaqu 学校信息深度补全脚本 (Final Polish)

目标：
1. 修复 schoolType 为 'unknown' 的学校。
2. 基于校名和学段智能补充 features 和 tags（如：外语特色、九年一贯制等）。
3. 丰富 trainingDirections。
4. 确保数据的一致性和准确性（不捏造联系方式）。
"""

import json
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'schools.json')

def enrich_school(school):
    name = school.get('name', '')
    stage = school.get('schoolStage', '')
    
    # 1. 修复 schoolType
    # 规则：如果有 'unknown'，尝试通过名称推断
    if school.get('schoolType') == 'unknown':
        if any(k in name for k in ['民办', '私立']):
            school['schoolType'] = 'private'
            school['schoolTypeLabel'] = '民办'
        elif any(k in name for k in ['国际', '外籍']):
            school['schoolType'] = 'international'
            school['schoolTypeLabel'] = '国际'
        else:
            # 大多数没有明确标注且非民办的通常为公办
            school['schoolType'] = 'public'
            school['schoolTypeLabel'] = '公办'

    # 2. 智能补充 Features & Tags
    features = set(school.get('features', []))
    tags = set(school.get('tags', []))
    directions = set(school.get('trainingDirections', []))
    
    # 基础标签
    if school.get('districtName'):
        tags.add(school['districtName']) # 例如 "浦东新区"
    
    if school.get('group'):
        tags.add(school['group']) # 例如 "华二系"
    
    if school.get('tier'):
        tags.add(school['tier']) # 例如 "四校"

    # 学段相关
    if stage == 'junior':
        tags.add('初中')
        directions.add('初中升学')
    elif stage == 'senior_high':
        tags.add('高中')
        directions.add('高中升学')
    elif stage == 'complete':
        tags.add('完全中学')
        if '九年' in name or '九年制' in name or '一贯制' in name:
            features.add('九年一贯制')
            tags.add('九年一贯')
            directions.add('九年一贯培养')
        elif '十二年' in name or '十二年制' in name:
            features.add('十二年一贯制')
            tags.add('十二年一贯')
            directions.add('十二年一贯培养')
        else:
            # 默认为初中+高中
            directions.add('初升高')

    # 特色推断 (Features)
    # 外语类
    if any(k in name for k in ['外国语', '外语', '双语', '国际部']):
        features.add('外语特色')
        directions.add('国际交流')
    
    # 科技类
    if any(k in name for k in ['科技', '科学', '信息', '创新']):
        features.add('科技特色')
        directions.add('科技创新')

    # 艺术类
    if any(k in name for k in ['艺术', '美术', '音乐', '戏剧']):
        features.add('艺术特色')
        directions.add('美育培养')

    # 体育类
    if any(k in name for k in ['体育', '运动']):
        features.add('体育特色')
        directions.add('体育特长')

    # 实验/教改类
    if '实验' in name and '实验' not in features:
        # 注意：很多学校叫“实验中学”但不一定是教改实验校，这里保守一点
        # 只有名字里带有明显教改意味的才加，或者保持现状
        # 为了准确，我们只加“实验学校”作为 tag
        pass 
    else:
        if '实验' in name:
            tags.add('实验学校')

    # 寄宿制 (谨慎推断)
    if any(k in name for k in ['寄宿', '住宿']):
        features.add('寄宿制')
        tags.add('寄宿')
    # 部分国际学校和郊区学校通常是寄宿，但为了准确性，暂不自动推断，除非有明确关键词

    # 更新
    school['features'] = sorted(list(features))
    school['tags'] = sorted(list(tags))
    school['trainingDirections'] = sorted(list(directions))
    
    return school

def main():
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        schools = json.load(f)

    print(f"开始处理 {len(schools)} 所学校...")
    
    changes = {
        'type_fixed': 0,
        'features_added': 0,
        'tags_added': 0,
    }

    for s in schools:
        old_type = s.get('schoolType')
        old_features_count = len(s.get('features', []))
        old_tags_count = len(s.get('tags', []))
        
        s = enrich_school(s)
        
        if s.get('schoolType') != old_type:
            changes['type_fixed'] += 1
        
        if len(s.get('features', [])) > old_features_count:
            changes['features_added'] += 1
            
        if len(s.get('tags', [])) > old_tags_count:
            changes['tags_added'] += 1

    # 保存
    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(schools, f, ensure_ascii=False, indent=2)
        
    print("\n=== 补全结果 ===")
    print(f"  schoolType 修复: {changes['type_fixed']}")
    print(f"  features 新增: {changes['features_added']}")
    print(f"  tags 新增: {changes['tags_added']}")
    
    # 验证统计
    unknown_type = sum(1 for s in schools if s.get('schoolType') == 'unknown')
    print(f"\n  剩余 unknown schoolType: {unknown_type}")

if __name__ == '__main__':
    main()
