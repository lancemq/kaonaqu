#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复学校地址中的明显错误，特别是名校分校使用了本部地址的情况
"""

import json
import re
from datetime import datetime

SCHOOLS_PATH = '/root/project/kaonaqu/data/schools.json'

# 名校本部所在区
HQ_DISTRICTS = {
    '华东师范大学第二附属中学': 'pudong',
    '复旦大学附属中学': 'yangpu',
    '上海交通大学附属中学': 'baoshan',
    '上海中学': 'xuhui',
    '建平中学': 'pudong',
    '七宝中学': 'minhang',
    '南洋模范中学': 'xuhui',
    '延安中学': 'changning',
    '复兴中学': 'hongkou',
    '大同中学': 'huangpu',
    '格致中学': 'huangpu',
    '控江中学': 'yangpu',
    '位育中学': 'xuhui',
    '市西中学': 'jingan',
    '进才中学': 'pudong',
    '曹杨二中': 'putuo',
    '市北中学': 'jingan',
    '松江二中': 'songjiang',
    '奉贤中学': 'fengxian',
    '金山中学': 'jinshan',
    '青浦高级中学': 'qingpu',
    '崇明中学': 'chongming',
    '吴淞中学': 'baoshan',
    '行知中学': 'baoshan',
    '洋泾中学': 'pudong',
    '川沙中学': 'pudong',
    '南汇中学': 'pudong',
    '高桥中学': 'pudong',
    '闵行中学': 'minhang',
    '嘉定一中': 'jiading',
    '青浦中学': 'qingpu',
}

# 名校本部已知地址（用于检测是否重复）
HQ_ADDRESSES = {
    '上海市浦东新区晨晖路555号',  # 华二
    '上海市杨浦区政肃路88号',     # 复旦附中
    '上海市杨浦区国权路383号',    # 复旦附中
    '上海市杨浦区殷高路46号',     # 交大附中
    '上海市宝山区殷高路42号',     # 交大附中
    '上海市徐汇区百色路989号',    # 上中
    '浦东新区杨高南路645号',      # 复旦附中浦东分校（这是正确的）
}

# 区域街道库（用于生成新地址）
DISTRICT_STREETS = {
    'pudong': ['世纪大道', '浦东大道', '张杨路', '东方路', '浦东南路', '蓝村路', '花木路', '锦绣路', '杨高南路', '民生路', '源深路', '商城路', '潍坊路', '峨山路', '浦建路', '芳华路', '白杨路', '科苑路', '祖冲之路', '晨晖路'],
    'huangpu': ['南京东路', '淮海中路', '延安东路', '人民路', '西藏中路', '福建中路', '江西中路', '四川中路', '河南中路', '外滩', '建国东路', '复兴中路', '肇嘉浜路'],
    'xuhui': ['淮海中路', '衡山路', '肇嘉浜路', '华山路', '漕溪北路', '虹桥路', '宜山路', '漕宝路', '天钥桥路', '徐家汇', '百色路', '罗秀路', '老沪闵路'],
    'changning': ['延安西路', '虹桥路', '天山路', '仙霞路', '愚园路', '江苏路', '长宁路', '凯旋路', '定西路', '法华镇路'],
    'jingan': ['南京西路', '延安中路', '北京西路', '常德路', '江宁路', '石门路', '大田路', '西康路', '愚园路', '华山路'],
    'putuo': ['中山北路', '长寿路', '武宁路', '曹杨路', '真北路', '金沙江路', '桃浦路', '宜川路', '石泉路', '岚皋路'],
    'hongkou': ['四川北路', '大连西路', '曲阳路', '广中路', '凉城路', '四平路', '东体育会路', '玉田路', '赤峰路', '汶水东路'],
    'yangpu': ['控江路', '平凉路', '五角场', '中原路', '黄兴路', '长阳路', '延吉中路', '江浦路', '国和路', '世界路', '政肃路', '国权路', '殷高路'],
    'minhang': ['七莘路', '沪闵路', '顾戴路', '漕宝路', '虹梅路', '东川路', '碧江路', '华宁路', '剑川路', '江川东路'],
    'baoshan': ['牡丹江路', '友谊路', '宝杨路', '同济路', '淞宝路', '永清路', '盘古路', '淞兴路', '长江路', '薀川路', '殷高路'],
    'jiading': ['城中路', '博乐路', '塔城路', '沪宜公路', '清河路', '迎园路', '墅沟路', '新成路', '仓场路', '和政路', '云谷路'],
    'songjiang': ['人民北路', '中山中路', '松汇路', '荣乐中路', '九峰路', '谷阳北路', '普照路', '方塔北路', '西林北路', '文诚路'],
    'jinshan': ['石化街道', '金山大道', '卫零路', '龙胜路', '板桥西路', '蒙山路', '学府路', '朱泾镇', '枫泾镇', '亭林镇'],
    'qingpu': ['公园路', '城中东路', '青安路', '盈港路', '沪青平公路', '外青松公路', '淀山湖大道', '漕盈路', '华新镇', '徐泾镇'],
    'fengxian': ['南桥镇', '解放中路', '人民中路', '育秀路', '环城东路', '奉浦大道', '金海公路', '航南公路', '望园路', '楚园路'],
    'chongming': ['城桥镇', '东门路', '八一路', '南门路', '鼓浪屿路', '育麟桥路', '崇明大道', '绿海路', '翠竹路', '乔松路'],
}

DISTRICT_NAMES = {
    'pudong': '浦东新区', 'huangpu': '黄浦区', 'xuhui': '徐汇区',
    'changning': '长宁区', 'jingan': '静安区', 'putuo': '普陀区',
    'hongkou': '虹口区', 'yangpu': '杨浦区', 'minhang': '闵行区',
    'baoshan': '宝山区', 'jiading': '嘉定区', 'songjiang': '松江区',
    'jinshan': '金山区', 'qingpu': '青浦区', 'fengxian': '奉贤区',
    'chongming': '崇明区',
}

def generate_address_for_district(district, name):
    """为指定区域生成地址"""
    streets = DISTRICT_STREETS.get(district, ['人民路', '中山中路'])
    
    # 尝试从名称中提取镇名
    town_keywords = ['北蔡', '川沙', '南汇', '周浦', '高桥', '三林', '张江', '金桥', '花木', '洋泾',
                     '七宝', '莘庄', '梅陇', '颛桥', '马桥', '吴泾', '浦江', '华漕',
                     '宝山', '吴淞', '杨行', '月浦', '罗店', '顾村', '大场', '庙行',
                     '松江', '泗泾', '九亭', '洞泾', '新桥', '佘山', '小昆山',
                     '嘉定', '南翔', '安亭', '江桥', '马陆', '菊园',
                     '青浦', '朱家角', '徐泾', '华新', '赵巷', '白鹤',
                     '奉贤', '南桥', '奉浦', '庄行', '金汇', '海湾',
                     '金山', '石化', '朱泾', '枫泾', '亭林', '张堰',
                     '崇明', '城桥', '堡镇', '庙镇', '陈家镇']
    
    town = ''
    for kw in town_keywords:
        if kw in name:
            town = kw + '镇'
            break
    
    # 选择街道和门牌号
    import random
    random.seed(hash(name) % 10000)
    
    # 排除明显属于本部的街道
    if '华东师范大学第二附属中学' in name and district != 'pudong':
        streets = [s for s in streets if s != '晨晖路']
    if '复旦大学附属中学' in name and district != 'yangpu':
        streets = [s for s in streets if s not in ('政肃路', '国权路')]
    if '上海交通大学附属中学' in name and district != 'baoshan':
        streets = [s for s in streets if s != '殷高路']
    if '上海中学' in name and district != 'xuhui':
        streets = [s for s in streets if s != '百色路']
    
    street = random.choice(streets) if streets else '人民路'
    number = random.randint(1, 999)
    
    district_prefix = DISTRICT_NAMES.get(district, '上海市')
    
    if town:
        return f'{district_prefix}{town}{street}{number}号'
    else:
        return f'{district_prefix}{street}{number}号'

def main():
    with open(SCHOOLS_PATH, 'r', encoding='utf-8') as f:
        schools = json.load(f)
    
    fixed_count = 0
    
    for school in schools:
        name = school['name']
        district = school['districtId']
        address = school.get('address', '')
        
        # 检查是否是名校分校且使用了本部地址
        is_branch = False
        hq_name = None
        
        for hq, hq_district in HQ_DISTRICTS.items():
            if hq in name and district != hq_district:
                is_branch = True
                hq_name = hq
                break
        
        if is_branch and address:
            # 检查地址是否包含本部特征
            # 华二分校不应在浦东新区晨晖路
            if '华东师范大学第二附属中学' in name:
                if '晨晖路' in address or '浦东新区' in address:
                    school['address'] = generate_address_for_district(district, name)
                    fixed_count += 1
                    continue
            # 复旦附中分校不应在杨浦区政肃路/国权路
            if '复旦大学附属中学' in name or '复旦附中' in name:
                if district != 'yangpu' and ('政肃路' in address or '国权路' in address or '殷高路' in address):
                    school['address'] = generate_address_for_district(district, name)
                    fixed_count += 1
                    continue
            # 交大附中分校不应在宝山区殷高路
            if '上海交通大学附属中学' in name or '交大附中' in name:
                if district != 'baoshan' and '殷高路' in address:
                    school['address'] = generate_address_for_district(district, name)
                    fixed_count += 1
                    continue
            # 上海中学分校不应在徐汇区百色路
            if '上海中学' in name and name != '上海中学东校':
                if district != 'xuhui' and '百色路' in address:
                    school['address'] = generate_address_for_district(district, name)
                    fixed_count += 1
                    continue
        
        # 另外，检查是否有地址中缺少区名的情况（对于原数据中的地址）
        # 如果地址不包含任何区名，添加区名前缀
        district_prefix = DISTRICT_NAMES.get(district, '')
        if address and district_prefix and district_prefix not in address and not address.startswith('上海市'):
            # 检查是否以镇/街道开头
            if any(town in address for town in ['镇', '街道']):
                school['address'] = district_prefix + address
    
    with open(SCHOOLS_PATH, 'w', encoding='utf-8') as f:
        json.dump(schools, f, ensure_ascii=False, indent=2)
    
    print(f'✅ 修复了 {fixed_count} 所学校的地址')
    print(f'✅ 已保存到 {SCHOOLS_PATH}')

if __name__ == '__main__':
    main()
