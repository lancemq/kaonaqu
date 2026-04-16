#!/usr/bin/env python3
"""
Kaonaqu 新闻数据批量补充脚本 - 第三批 (从 JSON 读取)
"""

import os
import json

def main():
    base_dir = '/root/project/kaonaqu/content/news'
    json_path = '/root/project/kaonaqu/data/news_batch3.json'
    
    # 读取 JSON 数据
    with open(json_path, 'r', encoding='utf-8') as f:
        articles = json.load(f)
        
    created_count = 0
    for art in articles:
        category = art['category']
        filename = art['filename']
        content = art['content']
        
        # 确保目录存在
        dir_path = os.path.join(base_dir, category)
        os.makedirs(dir_path, exist_ok=True)
        
        # 写入文件
        file_path = os.path.join(dir_path, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Created: {file_path}")
        created_count += 1
        
    print(f"\n🎉 Done! Created {created_count} articles.")

if __name__ == '__main__':
    main()
