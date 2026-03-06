#!/usr/bin/env node

/**
 * 考哪去 - 爬虫主入口文件
 * 
 * 执行所有爬虫任务，收集上海中考相关数据
 */

const path = require('path');
const { logger } = require('./utils');

// 爬虫模块
const shanghaiEducation = require('./shanghai-education');
const districtsEducation = require('./districts-education');
const schoolWebsites = require('./school-websites');
const thirdPartyPlatforms = require('./third-party-platforms');

// 数据存储目录
const DATA_DIR = path.join(__dirname, '..', 'data', 'crawled');

async function main() {
  logger.info('🚀 开始执行考哪去爬虫任务...');
  
  try {
    // 创建数据目录
    const fs = require('fs').promises;
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // 执行各个爬虫任务
    const tasks = [
      { name: '上海市教委官网', crawler: shanghaiEducation },
      { name: '各区教育局网站', crawler: districtsEducation },
      { name: '学校官网', crawler: schoolWebsites },
      { name: '第三方教育平台', crawler: thirdPartyPlatforms }
    ];
    
    for (const task of tasks) {
      logger.info(`🔍 开始爬取: ${task.name}`);
      try {
        const data = await task.crawler.crawl();
        const outputPath = path.join(DATA_DIR, `${task.name.replace(/\s+/g, '_').toLowerCase()}.json`);
        await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf8');
        logger.info(`✅ ${task.name} 爬取完成，数据已保存到: ${outputPath}`);
      } catch (error) {
        logger.error(`❌ ${task.name} 爬取失败:`, error.message);
      }
    }
    
    logger.info('🎉 所有爬虫任务完成！');
  } catch (error) {
    logger.error('💥 爬虫主程序执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };