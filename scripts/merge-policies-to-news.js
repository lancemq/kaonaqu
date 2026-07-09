// 一次性迁移脚本：将 policies.json 的 15 条政策合并进 news.json
// 用法：node scripts/merge-policies-to-news.js
const fs = require('fs');
const path = require('path');

function inferExamType(title) {
  const text = String(title || '').toLowerCase();
  if (text.includes('高考') || text.includes('春考') || text.includes('高招') || text.includes('普通高校')) {
    return 'gaokao';
  }
  if (text.includes('中考') || text.includes('中招') || text.includes('义务教育') || text.includes('小学')) {
    return 'zhongkao';
  }
  return '';
}

function inferCategory(title, examType) {
  if (examType === 'gaokao') return '高招政策';
  if (examType === 'zhongkao') return '中招政策';
  return '综合政策';
}

function policyToNews(policy) {
  const examType = inferExamType(policy.title);
  const category = policy.category || inferCategory(policy.title, examType);
  return {
    id: policy.id,
    title: policy.title,
    newsType: 'policy',
    category,
    examType,
    summary: policy.summary || '',
    publishedAt: policy.publishedAt || null,
    updatedAt: policy.updatedAt || policy.publishedAt || null,
    source: policy.source || {},
    contentFile: policy.contentFile || '',
    districtId: policy.districtId || 'all',
    districtName: policy.districtName || '全市'
  };
}

function main() {
  const dataDir = path.resolve(__dirname, '../data');
  const newsPath = path.join(dataDir, 'news.json');
  const policiesPath = path.join(dataDir, 'policies.json');

  const news = JSON.parse(fs.readFileSync(newsPath, 'utf8'));
  const policies = JSON.parse(fs.readFileSync(policiesPath, 'utf8'));

  const newsIds = new Set(news.map((n) => n.id));
  const converted = policies.map(policyToNews);
  const newItems = converted.filter((item) => !newsIds.has(item.id));

  if (newItems.length === 0) {
    console.log('所有 policy 已在 news.json 中，无需迁移');
    return;
  }

  const merged = [...news, ...newItems].sort((a, b) => {
    return String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''));
  });

  fs.writeFileSync(newsPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  console.log(`已合并 ${newItems.length} 条 policy 到 news.json (总计 ${merged.length} 条)`);

  // 删除 policies.json
  fs.unlinkSync(policiesPath);
  console.log('已删除 data/policies.json');
}

main();
