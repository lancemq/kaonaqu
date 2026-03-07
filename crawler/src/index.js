#!/usr/bin/env node

/**
 * "考哪去"爬虫主入口
 * 执行所有爬虫任务并汇总数据
 */

const path = require('path');
const crawlOfficialPolicies = require('./crawlers/policies-official');
const crawlOfficialNews = require('./crawlers/news-official');
const crawlOfficialSchools = require('./crawlers/schools-official');
const crawlSchoolWebsites = require('./crawlers/schools-websites');
const crawlSocialPlatforms = require('./crawlers/social-platforms');
const crawlCommunityFallback = require('./crawlers/community-fallback');
const { processAllData } = require('./process-data');
const { ensureDir, writeJson } = require('./utils/io');

async function main() {
  console.log('开始执行 "考哪去" 采集任务...');
  console.log('日期:', new Date().toISOString().split('T')[0]);
  console.log('目标: 官方优先收集新闻、政策和学校信息\n');

  try {
    const outputDir = path.join(__dirname, '../data/raw');
    await ensureDir(outputDir);

    console.log('步骤1: 采集官方政策...');
    const policies = await crawlOfficialPolicies();

    console.log('步骤2: 采集官方新闻...');
    const news = await crawlOfficialNews();

    console.log('步骤3: 整理官方学校名录...');
    const schools = await crawlOfficialSchools();

    console.log('步骤4: 尝试补充学校官网详情...');
    const schoolWebsiteDetails = await crawlSchoolWebsites();

    console.log('步骤5: 导入上海社交平台补充数据...');
    const social = await crawlSocialPlatforms();

    console.log('步骤6: 采集社区补充数据...');
    const community = await crawlCommunityFallback();

    console.log('步骤7: 处理并发布结构化数据...\n');
    const processed = await processAllData();

    const summary = {
      officialPolicies: policies.length,
      officialNews: news.length,
      officialSchools: schools.length,
      schoolWebsiteDetails: schoolWebsiteDetails.length,
      socialNews: social.news.length,
      socialPolicies: social.policies.length,
      socialSchools: social.schools.length,
      fallbackSchools: community.schools.length,
      fallbackDiscussions: community.discussions.length,
      publishedSchools: processed.schools.length,
      publishedPolicies: processed.policies.length,
      publishedNews: processed.news.length,
      crawledAt: new Date().toISOString(),
      status: 'success'
    };

    await writeJson(path.join(outputDir, 'crawl-summary.json'), summary);

    console.log('\n采集任务完成');
    console.log(`已发布: ${processed.districts.length} 个区, ${processed.schools.length} 所学校, ${processed.policies.length} 条政策, ${processed.news.length} 条新闻`);
    console.log(`原始数据目录: ${outputDir}`);
    
  } catch (error) {
    console.error('采集任务失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
