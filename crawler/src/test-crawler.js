#!/usr/bin/env node

/**
 * 测试爬虫 - 验证基本功能
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

async function testBasicCrawl() {
  console.log('🧪 开始测试基础爬虫功能...');
  
  try {
    // 测试访问一个可靠的网站
    const response = await axios.get('https://httpbin.org/json', {
      timeout: 5000
    });
    
    console.log('✅ HTTP请求测试成功');
    console.log('Response status:', response.status);
    
    // 测试文件写入
    const testData = {
      test: 'success',
      timestamp: new Date().toISOString()
    };
    
    const outputDir = path.join(__dirname, '../data/raw');
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(
      path.join(outputDir, 'test-data.json'),
      JSON.stringify(testData, null, 2)
    );
    
    console.log('✅ 文件写入测试成功');
    console.log('✅ 基础爬虫框架验证通过!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 执行测试
testBasicCrawl();