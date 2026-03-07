# 上海社交平台补充源说明

该补充层仅用于导入上海地区的公开元数据，作为新闻、政策和学校信息的补充线索。

当前支持的平台：

- 小红书
- 抖音
- 哔哩哔哩
- 微信公众号

输入文件：

- `crawler/data/raw/shanghai-social-platform-input.json`

推荐字段：

```json
[
  {
    "platform": "xiaohongshu",
    "recordType": "school",
    "title": "上海某中学开放日信息整理",
    "summary": "整理校园开放日时间、预约方式和参观重点。",
    "sourceUrl": "https://example.com/post",
    "publishedAt": "2026-03-07",
    "district": "徐汇区",
    "schoolName": "某某中学",
    "schoolStage": "senior_high",
    "type": "市重点",
    "features": ["开放日", "校园探访"],
    "tags": ["上海", "徐汇区"]
  }
]
```

处理原则：

- 仅保留上海全市或上海各区相关内容
- 仅处理公开可访问内容
- 仅导入标题、摘要、时间、链接和可验证字段
- 不覆盖官方来源字段
- 作为 `social` 类型来源进入处理链，默认可信度低于官方来源
