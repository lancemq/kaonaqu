#!/usr/bin/env python3
"""
Kaonaqu 学校信息全面丰富脚本 v4

- 模糊匹配修复 tier（处理区名前缀等变体）
- 补充 group 和 admissionRoutes
"""

import json
import os
from datetime import datetime, timezone, timedelta

CST = timezone(timedelta(hours=8))
DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'schools.json')

# 区名前缀（用于标准化学校名称）
DISTRICT_PREFIXES = [
    "上海市黄浦区", "上海市徐汇区", "上海市长宁区", "上海市静安区",
    "上海市普陀区", "上海市虹口区", "上海市杨浦区",
    "上海市宝山区", "上海市闵行区", "上海市嘉定区",
    "上海市浦东新区", "上海市松江区", "上海市青浦区",
    "上海市奉贤区", "上海市金山区", "上海市崇明区",
    "上海市",
]

def strip_district(name):
    """去掉区名前缀得到核心校名"""
    for prefix in DISTRICT_PREFIXES:
        if name.startswith(prefix):
            return name[len(prefix):]
    return name

# ============================================================
# Tier 定义
# ============================================================

# 四校本部
SI_XIAO_MAIN = {"上海中学", "华东师范大学第二附属中学", "复旦大学附属中学", "上海交通大学附属中学"}

# 四校分校
SI_XIAO_BRANCHES = {
    "华东师范大学第二附属中学（宝山校区）", "华东师范大学第二附属中学（普陀校区）",
    "华东师范大学第二附属中学（紫竹校区）", "华东师大二附中前滩学校",
    "华东师大二附中紫竹校区", "华东师范大学第二附属中学松江分校",
    "华东师范大学第二附属中学崇明分校", "华东师范大学第二附属中学临港奉贤分校",
    "复旦大学附属中学浦东分校", "复旦附中浦东分校",
    "上海交通大学附属中学嘉定分校", "交大附中嘉定分校", "交大附中闵行分校",
    "上海中学东校", "上海中学国际部", "上中东校",
}

# 八大本部
BA_DA_MAIN = {
    "南洋模范中学", "建平中学", "进才中学", "控江中学",
    "七宝中学", "延安中学", "奉贤中学", "嘉定区第一中学", "嘉定一中",
}

# 八大分校
BA_DA_BRANCHES = {
    "建平实验中学", "建平实验学校", "建平中学西校", "建平中学南校", "建平远翔学校",
    "进才实验中学", "进才中学北校", "进才中学南校",
    "七宝实验中学", "七宝德怀特高级中学",
    "延安实验中学", "延安实验初级中学", "延安中学新城分校", "西延安中学", "延安初级中学",
    "南洋模范初级中学", "南洋初级中学",
    "控江实验中学", "控江初级中学",
    "奉贤实验中学",
}

# 市实验性示范性高中（核心校名，不含区名前缀）
SHI_YAN_CORE = {
    "川沙中学", "高桥中学", "南汇中学", "周浦中学", "新场中学", "三林中学",
    "陆行中学", "文建中学", "上南中学",
    "格致中学", "大同中学", "向明中学", "卢湾高级中学", "敬业中学",
    "南洋模范中学", "位育中学", "徐汇中学", "西南位育中学", "中国中学", "南洋中学",
    "市三女中", "第三女子中学", "延安中学", "复旦中学", "天山中学", "建青实验学校",
    "市西中学", "育才中学", "新中高级中学",
    "曹杨第二中学", "宜川中学", "晋元中学",
    "复兴高级中学", "北虹高级中学", "虹口高级中学", "继光高级中学",
    "控江中学", "杨浦高级中学", "同济中学", "鞍山中学",
    "七宝中学", "闵行中学", "莘庄中学",
    "吴淞中学", "行知中学", "宝山中学", "淞浦中学", "通河中学",
    "嘉定区第一中学", "嘉定一中", "嘉定二中",
    "松江二中", "松江一中",
    "青浦中学", "朱家角中学",
    "奉贤中学", "曙光中学",
    "金山中学", "华东师范大学第三附属中学",
    "崇明中学", "城桥中学", "民本中学", "横沙中学", "堡镇中学",
    "华东政法大学附属中学", "仙霞高级中学", "第五十二中学",
    "华东师范大学第一附属中学", "同济一附中",
    # 分校也计入
    "复兴高级中学分校", "大同中学分校", "向明中学浦江分校",
    "七宝中学浦江分校", "市西中学新城分校",
}

# 教育集团
EDUCATION_GROUPS = {
    "华二系": ["华东师范大学第二附属中学", "华师大二附中", "华二"],
    "复旦系": ["复旦大学附属中学", "复旦附中", "复旦初级中学", "复旦中学"],
    "交大系": ["上海交通大学附属中学", "交大附中"],
    "上中系": ["上海中学", "华育", "上宝"],
    "南洋系": ["南洋模范", "南洋中学", "南洋初级"],
    "建平系": ["建平中学", "建平实验", "建平西", "建平南", "建平远翔", "建平香梅"],
    "进才系": ["进才中学", "进才实验", "进才北", "进才南"],
    "控江系": ["控江中学", "控江实验", "控江初级"],
    "七宝系": ["七宝中学", "七宝实验", "七宝德怀特", "文来"],
    "延安系": ["延安中学", "延安实验", "延安初级", "延安初级中学", "西延安"],
    "奉贤系": ["奉贤中学", "奉贤实验"],
    "位育系": ["位育中学", "位育实验", "西南位育"],
    "市西系": ["市西中学", "市西实验"],
    "市北系": ["市北初级", "市北实验", "市北中学"],
    "曹杨系": ["曹杨第二中学", "曹杨实验", "曹杨二中"],
    "晋元系": ["晋元中学", "晋元实验"],
    "育才系": ["育才中学", "育才实验"],
    "格致系": ["格致中学", "格致实验", "格致初级"],
    "大同系": ["大同中学", "大同初级", "大同实验"],
    "向明系": ["向明中学", "向明初级", "向明实验"],
    "复兴系": ["复兴高级", "复兴实验", "复兴初级"],
    "北虹系": ["北虹高级", "北虹实验", "北虹初级"],
    "吴淞系": ["吴淞中学", "吴淞实验"],
    "行知系": ["行知中学", "行知实验"],
    "上大系": ["上海大学附属", "上大附属", "上大附中"],
    "华师系": ["华东师范大学附属", "华师大附属", "华东师大附属"],
    "上外系": ["上海外国语大学附属", "上外附属", "上外附中"],
    "上师大系": ["上海师范大学附属", "上师大附属", "上师大附中"],
    "世外系": ["世外", "上海世外", "世外教育"],
    "协和系": ["协和", "上海协和"],
    "松江系": ["松江二中", "松江一中", "松江实验"],
    "青浦系": ["青浦中学", "青浦实验", "青浦一中"],
    "崇明系": ["崇明中学", "崇明实验", "城桥中学", "民本中学"],
    "金山系": ["金山中学", "金山实验"],
    "川沙系": ["川沙中学", "川沙实验"],
    "嘉定系": ["嘉定一中", "嘉定二中", "嘉定实验"],
    "平和系": ["平和", "上海平和"],
    "华东政法系": ["华东政法大学附属"],
    "同济系": ["同济大学附属", "同济附属", "同济一附中"],
    "华理系": ["华东理工大学附属"],
    "上理工系": ["上海理工大学附属"],
    "上大系": ["上海大学附属", "上大附属"],
    "上外系": ["上海外国语大学附属", "上外附属"],
    "上师大系": ["上海师范大学附属", "上师大附属"],
    "复旦系": ["复旦大学附属", "复旦附属"],
    "交大系": ["上海交通大学附属", "交大附属"],
    "同济系": ["同济大学附属", "同济附属"],
    "华东师大系": ["华东师范大学附属", "华师大附属"],
    "建平系": ["建平"],
    "进才系": ["进才"],
    "七宝系": ["七宝"],
    "延安系": ["延安"],
    "控江系": ["控江"],
    "南洋系": ["南洋"],
    "位育系": ["位育"],
    "市北系": ["市北"],
    "市西系": ["市西"],
    "曹杨系": ["曹杨"],
    "晋元系": ["晋元"],
    "育才系": ["育才"],
    "格致系": ["格致"],
    "大同系": ["大同"],
    "向明系": ["向明"],
    "复兴系": ["复兴"],
    "北虹系": ["北虹"],
    "吴淞系": ["吴淞"],
    "行知系": ["行知"],
    "华二系": ["华二"],
    "上大系": ["上大"],
    "上中系": ["上中"],
}

# Deduplicate groups (keep last = most specific)
UNIQUE_GROUPS = {}
for g, kws in EDUCATION_GROUPS.items():
    for kw in kws:
        UNIQUE_GROUPS[kw] = g

# 对口升学
FEEDER_MAP = {
    "华育中学": ["上海中学"], "民办华育中学": ["上海中学"],
    "兰生复旦中学": ["复旦大学附属中学"], "民办兰生复旦中学": ["复旦大学附属中学"],
    "上宝中学": ["上海交通大学附属中学", "上海中学"],
    "文来中学": ["七宝中学"], "七宝文来学校": ["七宝中学"],
    "建平实验中学": ["建平中学"], "建平中学西校": ["建平中学"],
    "进才实验中学": ["进才中学"], "进才中学北校": ["进才中学"],
    "延安初级中学": ["延安中学"], "西延安中学": ["延安中学"],
    "格致初级中学": ["格致中学"], "大同初级中学": ["大同中学"],
    "向明初级中学": ["向明中学"], "西南位育中学": ["位育中学"],
    "南洋初级中学": ["南洋模范中学"], "控江初级中学": ["控江中学"],
    "复兴初级中学": ["复兴高级中学"], "北虹初级中学": ["北虹高级中学"],
    "七宝实验中学": ["七宝中学"], "奉贤实验中学": ["奉贤中学"],
    "松江实验中学": ["松江二中"], "青浦实验中学": ["青浦中学"],
    "嘉定实验中学": ["嘉定一中"], "吴淞实验中学": ["吴淞中学"],
    "行知实验中学": ["行知中学"], "市北初级中学": ["新中高级中学"],
    "复旦初级中学": ["复旦中学"], "川沙中学": ["川沙中学"],
}

# ============================================================
def assign_tier(name, stage):
    core = strip_district(name)
    
    # 精确匹配优先
    if name in SI_XIAO_MAIN or core in SI_XIAO_MAIN:
        return "四校"
    if name in SI_XIAO_BRANCHES or core in SI_XIAO_BRANCHES:
        return "四校分校"
    if name in BA_DA_MAIN or core in BA_DA_MAIN:
        return "八大"
    if name in BA_DA_BRANCHES or core in BA_DA_BRANCHES:
        return "八大分校"
    if core in SHI_YAN_CORE or name in SHI_YAN_CORE:
        return "市实验性示范性高中"
    
    is_private = "民办" in name or "私立" in name
    is_intl = any(k in name for k in ["国际部", "国际课程", "双语", "IB", "A-Level"])
    
    if stage == 'senior_high':
        if is_intl: return "国际课程"
        if is_private: return "民办高中"
        return "一般高中"
    elif stage == 'junior':
        if is_private: return "民办初中"
        return "公办初中"
    elif stage == 'complete':
        if is_intl: return "国际课程"
        if is_private: return "民办完全中学"
        return "公办完全中学"
    return "一般"

def assign_group(name):
    # Sort by keyword length descending (longer = more specific)
    for kw in sorted(UNIQUE_GROUPS.keys(), key=len, reverse=True):
        if kw in name:
            return UNIQUE_GROUPS[kw]
    return None

def gen_routes(school, all_schools):
    name = school['name']
    stage = school['schoolStage']
    routes = []
    
    if stage in ('junior', 'complete'):
        core = strip_district(name)
        for feeder_name, targets in FEEDER_MAP.items():
            if feeder_name in name or feeder_name == core:
                for hs_name in targets:
                    for hs in all_schools:
                        if hs['schoolStage'] == 'senior_high' and hs_name in hs['name']:
                            routes.append({
                                "high_school_id": hs['id'],
                                "high_school_name": hs['name'],
                                "type": "中考对口",
                                "confidence": "medium"
                            })
                            break
    
    if stage == 'complete':
        base = name.replace("（初中部）", "").replace("(初中部)", "")
        for hs in all_schools:
            if hs['schoolStage'] == 'senior_high' and hs['id'] != school['id']:
                if base in hs['name'] or hs['name'] in base:
                    if not any(r['high_school_id'] == hs['id'] for r in routes):
                        routes.append({
                            "high_school_id": hs['id'],
                            "high_school_name": hs['name'],
                            "type": "校内直升",
                            "confidence": "high"
                        })
                    break
    return routes

# ============================================================
def main():
    print("=" * 60)
    print("Kaonaqu 学校信息全面丰富 v4")
    print("=" * 60)
    
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        schools = json.load(f)
    
    total = len(schools)
    before_t = sum(1 for s in schools if s.get('tier') and s['tier'] != '')
    before_g = sum(1 for s in schools if s.get('group'))
    before_r = sum(1 for s in schools if s.get('admissionRoutes'))
    print(f"\n学校: {total} | Before: tier={before_t}, group={before_g}, routes={before_r}")
    
    now = datetime.now(CST).isoformat()
    
    for s in schools:
        new_tier = assign_tier(s['name'], s['schoolStage'])
        old_tier = s.get('tier', '')
        if new_tier != old_tier:
            s['tier'] = new_tier
        
        new_group = assign_group(s['name'])
        if new_group and not s.get('group'):
            s['group'] = new_group
        
        if not s.get('admissionRoutes'):
            routes = gen_routes(s, schools)
            if routes:
                s['admissionRoutes'] = routes
        
        s['updatedAt'] = now
        if s.get('profileDepth') == 'foundation' and (s.get('group') or s.get('admissionRoutes')):
            s['profileDepth'] = 'enhanced'
    
    after_t = sum(1 for s in schools if s.get('tier') and s['tier'] != '')
    after_g = sum(1 for s in schools if s.get('group'))
    after_r = sum(1 for s in schools if s.get('admissionRoutes'))
    print(f"\nAfter: tier={after_t}, group={after_g}, routes={after_r}")
    
    td = {}
    for s in schools:
        t = s.get('tier', '') or '未分类'
        td[t] = td.get(t, 0) + 1
    print(f"\n梯队分布:")
    for t, c in sorted(td.items(), key=lambda x: -x[1]):
        print(f"  {t}: {c}")
    
    gd = {}
    for s in schools:
        g = s.get('group', '') or '未分配'
        gd[g] = gd.get(g, 0) + 1
    print(f"\n教育集团 (Top 20):")
    for g, c in sorted(gd.items(), key=lambda x: -x[1])[:20]:
        print(f"  {g}: {c}")
    
    # Sample verification
    print(f"\n=== 四校验证 ===")
    for s in schools:
        if s.get('tier') == '四校':
            print(f"  ✓ {s['name']}")
    
    print(f"\n=== 市实验性示范性高中抽样 ===")
    shiyan = [s for s in schools if s.get('tier') == '市实验性示范性高中']
    for s in shiyan[:15]:
        print(f"  ✓ {s['name']}")
    print(f"  ... 共 {len(shiyan)} 所")
    
    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(schools, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ 已保存")

if __name__ == '__main__':
    main()
