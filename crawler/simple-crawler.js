const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// 中考相关关键词
const zhongkaoKeywords = [
  '中考', '初中学业水平考试', '中招', '初中毕业生', '高中招生',
  '学业水平考试', '中考政策', '招生政策', '录取分数线', '对口学校'
];

// 目标URL列表
const targetUrls = [
  'https://edu.sh.gov.cn/',
  'https://www.shmeea.edu.cn/',
  'https://www.shmeea.edu.cn/page/02000/index.html',
  'https://www.shmeea.edu.cn/page/01100/20241108/1923.html' // 中等学校招生办公室
];

async function crawlZhongkaoInfo() {
  console.log('Starting simple crawl for Shanghai Zhongkao information...');
  
  const results = [];
  
  for (const url of targetUrls) {
    try {
      console.log(`Fetching: ${url}`);
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const html = response.data;
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? titleMatch[1].trim() : 'No title';
      
      // 检查是否包含中考关键词
      const hasZhongkaoContent = zhongkaoKeywords.some(keyword => 
        html.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasZhongkaoContent) {
        console.log(`✅ Found relevant content at: ${url}`);
        results.push({
          url: url,
          title: title,
          hasZhongkaoContent: true,
          timestamp: new Date().toISOString()
        });
        
        // 保存原始HTML用于后续分析
        const filename = `raw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.html`;
        await fs.writeFile(
          path.join(__dirname, 'data', 'raw', filename),
          html,
          'utf8'
        );
      } else {
        console.log(`❌ No relevant content at: ${url}`);
      }
      
      // 避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
    }
  }
  
  // 保存结果
  await fs.writeFile(
    path.join(__dirname, 'data', 'zhongkao-links.json'),
    JSON.stringify(results, null, 2),
    'utf8'
  );
  
  console.log(`Crawl completed. Found ${results.length} relevant pages.`);
  return results;
}

// 创建数据目录
async function setupDirectories() {
  const dirs = ['data', 'data/raw'];
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

// 主函数
async function main() {
  await setupDirectories();
  await crawlZhongkaoInfo();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { crawlZhongkaoInfo };