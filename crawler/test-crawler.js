const axios = require('axios');
const fs = require('fs').promises;

// Simple test crawler using native JavaScript
async function testCrawl() {
  console.log('Starting intelligent crawl...');
  
  try {
    // Test Shanghai Education Commission
    const eduResponse = await axios.get('https://edu.sh.gov.cn/');
    console.log('✅ Successfully fetched Shanghai Education Commission');
    console.log('Title:', eduResponse.data.match(/<title>(.*?)<\/title>/)?.[1] || 'No title found');
    
    // Test Shanghai Education Examination Authority
    const examResponse = await axios.get('https://www.shmeea.edu.cn/');
    console.log('✅ Successfully fetched Shanghai Education Examination Authority');
    console.log('Status:', examResponse.status);
    
    // Extract links from main page
    const links = [];
    const linkRegex = /href=["']([^"']*)["']/g;
    let match;
    while ((match = linkRegex.exec(examResponse.data)) !== null) {
      if (match[1].startsWith('/page/') || match[1].includes('2026') || match[1].includes('zk')) {
        links.push(match[1]);
      }
    }
    
    console.log('Found relevant links:', links.slice(0, 10));
    
    // Save raw data for analysis
    await fs.writeFile('./data/raw_edu_page.html', eduResponse.data);
    await fs.writeFile('./data/raw_exam_page.html', examResponse.data);
    console.log('✅ Raw data saved for analysis');
    
  } catch (error) {
    console.error('Error during test crawl:', error.message);
  }
}

testCrawl();