#!/usr/bin/env node

/**
 * "考哪去"爬虫主入口
 * 执行所有爬虫任务并汇总数据
 */

const fs = require('fs').promises;
const path = require('path');
const EducationForumsCrawler = require('./crawlers/education-forums');
const { processAllData } = require('./process-data');

async function main() {
  console.log('🚀 开始执行"考哪去"爬虫任务...');
  console.log('📅 日期:', new Date().toISOString().split('T')[0]);
  console.log('🎯 目标: 收集上海中考相关信息\n');

  try {
    // 创建输出目录
    const outputDir = path.join(__dirname, '../data/raw');
    await fs.mkdir(outputDir, { recursive: true });

    // 初始化爬虫
    const forumsCrawler = new EducationForumsCrawler();
    await forumsCrawler.initialize();

    // 执行爬虫任务
    console.log('🔍 步骤1: 爬取教育论坛和第三方平台...\n');
    
    const schools = await forumsCrawler.crawlSchoolInfo();
    const discussions = await forumsCrawler.crawlAdmissionDiscussions();

    console.log('🧱 步骤2: 处理并发布结构化数据...\n');
    const processed = await processAllData();

    // 汇总结果
    const summary = {
      totalSchools: schools.length,
      totalDiscussions: discussions.length,
      publishedSchools: processed.schools.length,
      publishedPolicies: processed.policies.length,
      crawledAt: new Date().toISOString(),
      status: 'success'
    };

    await fs.writeFile(
      path.join(outputDir, 'crawl-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('\n✅ 爬虫任务完成!');
    console.log(`📊 总计抓取: ${schools.length} 所学校, ${discussions.length} 条讨论`);
    console.log(`📦 已发布: ${processed.districts.length} 个区, ${processed.schools.length} 所学校, ${processed.policies.length} 条政策`);
    console.log(`📁 数据保存在: ${outputDir}`);
    
  } catch (error) {
    console.error('❌ 爬虫执行失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
