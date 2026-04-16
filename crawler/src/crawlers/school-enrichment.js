#!/usr/bin/env node
/**
 * 学校详情补充爬虫
 * 
 * 功能：
 * 1. 通过百度搜索获取学校官网、电话、地址
 * 2. 通过学校官网深度抓取招生信息
 * 3. 合并数据并输出
 */

const path = require('path');
const cheerio = require('cheerio');
const { fetchWithRetry, sleep } = require('../utils/fetch');
const { readJson, writeJson } = require('../utils/io');
const { RAW_DIR, ROOT_DATA_DIR } = require('../utils/paths');

const OUTPUT_FILE = path.join(RAW_DIR, 'school-enrichment.json');

// 搜索引擎配置（百度反爬严重，使用 Bing 和 360 作为备选）
const SEARCH_ENGINES = [
  {
    name: 'Bing',
    url: 'https://www.bing.com/search',
    params: (q) => ({ q, count: 5 }),
    resultSelector: 'li.b_algo',
    titleSelector: 'h2',
    linkSelector: 'h2 a',
    abstractSelector: '.b_caption p, .b_lineclamp2',
  },
  {
    name: '360 搜索',
    url: 'https://www.so.com/s',
    params: (q) => ({ q }),
    resultSelector: '.res-list',
    titleSelector: 'h3',
    linkSelector: 'h3 a',
    abstractSelector: '.cont, .abstract, p',
  },
];

// 请求头
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

/**
 * 搜索学校信息（支持多搜索引擎）
 */
async function searchSchoolInfo(schoolName, districtName) {
  const queries = [
    `${schoolName} 官网`,
    `${schoolName} 官方网站`,
    `${schoolName} 电话`,
  ];

  const results = [];

  for (const engine of SEARCH_ENGINES) {
    console.log(`\n🔍 使用 ${engine.name} 搜索`);

    for (const query of queries) {
      try {
        console.log(`  → 搜索："${query}"`);
        const html = await fetchWithRetry(engine.url, {
          params: engine.params(query),
          timeout: 10000,
          headers: HEADERS,
        });

        console.log(`  ✓ 搜索成功，响应长度：${html.length} 字符`);

        const $ = cheerio.load(html);
        const items = [];

        // 解析搜索结果
        $(engine.resultSelector).each((_, el) => {
          const title = $(el).find(engine.titleSelector).first().text().trim();
          const link = $(el).find(engine.linkSelector).first().attr('href') || '';
          const abstract = $(el).find(engine.abstractSelector).first().text().trim();
          
          if (title && title.length > 5) {
            items.push({ title, link, abstract: abstract.slice(0, 200) });
          }
        });

        console.log(`  📊 提取到 ${items.length} 条结果`);
        
        if (items.length > 0) {
          results.push({ query, engine: engine.name, items });
        }

        await sleep(2000 + Math.random() * 1500); // 随机延迟
      } catch (error) {
        console.error(`  ✗ 搜索失败 [${query}]: ${error.message}`);
      }
    }
  }

  return results;
}

/**
 * 从搜索结果提取信息 (优化版)
 */
function extractInfoFromSearch(searchResults, schoolName) {
  const info = {
    website: '',
    phone: '',
    address: '',
    sourceUrls: [],
  };

  // 过滤非学校官网域名
  const blockedHosts = [
    'baidu.com', 'bing.com', 'so.com', 'sogou.com',
    'zhihu.com', 'sohu.com', '163.com', 'qq.com',
    'toutiao.com', 'douyin.com', 'bilibili.com', 'xhslink.com',
    'sina.com.cn', 'weibo.com', '360.cn', 'baike.baidu.com',
    'baike.so.com'
  ];

  // 电话正则优化
  // 1. 严格匹配 021-xxxxxxxx (带分隔符或空格)
  const strictPhoneRegex = /021[-\s]?\d{8}/g;
  // 2. 带上下文关键词匹配
  const contextPhoneRegex = /(?:电话 | 招生办 | 教务处 | 校办 | 联系方式 | 咨询电话)[：:：]?\s*(021[-\s]?\d{8})/g;

  for (const result of searchResults) {
    for (const item of result.items) {
      const text = `${item.title} ${item.abstract}`;
      let link = item.link || '';

      // 清理链接 (移除 Bing 追踪参数等)
      if (link.includes('bing.com/ck/')) {
        try {
          const urlObj = new URL(link);
          const uParam = urlObj.searchParams.get('u');
          if (uParam) link = decodeURIComponent(uParam);
        } catch (e) {}
      }

      // 1. 提取官网
      if (!info.website && link && link.length < 150) {
        let isSchoolSite = false;
        try {
          const urlObj = new URL(link);
          const hostname = urlObj.hostname.toLowerCase();

          // 黑名单过滤
          const isBlocked = blockedHosts.some(host => hostname.endsWith(host) || hostname.includes(host));
          if (isBlocked) continue;

          // 白名单特征
          const hasEdu = hostname.endsWith('.edu.cn');
          const hasSchoolKeyword = hostname.includes('school') || hostname.includes('edu');
          const isReliable = hostname.includes('shanghai.gov.cn'); // 政府官网

          // 核心判断：edu.cn 必须是官网，其他需谨慎
          if (hasEdu) {
            isSchoolSite = true;
          } else if (hasSchoolKeyword) {
            // 包含 school/edu 但不一定是 edu.cn，需要进一步判断（此处简化处理，优先收录）
            // 但如果链接里包含 schoolName 的拼音/汉字更好，这里难做，先收录
            isSchoolSite = true;
          } else if (isReliable) {
             // 政府官网也可以作为权威信息源，虽然不一定是学校官网，但信息准
             // 这里暂时不作为 school.website 存入，而是作为 sourceUrl
          }
        } catch (e) {}

        if (isSchoolSite) {
          info.website = link;
        }
      }

      // 2. 提取电话 (优先带上下文的，再找独立的 021 号码)
      if (!info.phone) {
        let match;
        
        // 尝试提取带关键词的
        while ((match = contextPhoneRegex.exec(text)) !== null) {
          let phone = match[1].replace(/[\s-]/g, '');
          if (phone.length === 11 && !phone.startsWith('021110') && !phone.startsWith('021120')) {
            info.phone = phone;
            break;
          }
        }

        // 没找到，尝试提取独立的 021 号码
        if (!info.phone) {
          while ((match = strictPhoneRegex.exec(text)) !== null) {
            let phone = match[0].replace(/[\s-]/g, '');
            if (phone.length === 11 && !phone.startsWith('021110') && !phone.startsWith('021120')) {
              // 额外检查：号码不应包含在长数字串中
              const context = text.substring(Math.max(0, match.index - 1), match.index + match[0].length + 1);
              if (!/^\d/.test(context) && !/\d$/.test(context)) { // 前后不是数字
                 info.phone = phone;
                 break;
              }
            }
          }
        }
      }

      // 3. 提取地址
      if (!info.address) {
        // 匹配 "地址：xxx" 格式
        const addrMatch = text.match(/(?:地址 | 学校地址 | 校区地址)[：:：]\s*([^\n\r,，。]{5,60})/);
        if (addrMatch) {
          // 排除包含 "到这去" "导航" 等按钮文本
          const addr = addrMatch[1].trim();
          if (!addr.includes('到这去') && !addr.includes('导航') && !addr.includes('地图')) {
            info.address = addr.slice(0, 80);
          }
        }
      }

      // 收集来源
      if (link && link.length < 150) {
         info.sourceUrls.push(link);
      }
    }
  }

  return info;
}

/**
 * 深度抓取学校官网
 */
async function crawlSchoolWebsite(websiteUrl, schoolName) {
  try {
    const html = await fetchWithRetry(websiteUrl, {
      timeout: 15000,
      headers: HEADERS,
    });

    const $ = cheerio.load(html);
    const info = {
      title: $('title').text().trim(),
      phone: '',
      address: '',
      admissionInfo: '',
    };

    // 提取电话
    const bodyText = $('body').text();
    const phonePatterns = [
      /电话[：:]\s*(\d{3,4}[-]?\d{7,8})/,
      /联系方式[：:]\s*(\d{3,4}[-]?\d{7,8})/,
      /招生办[：:]\s*(\d{3,4}[-]?\d{7,8})/,
      /Tel[：:]\s*(\d{3,4}[-]?\d{7,8})/i,
      /(\d{3,4}[-]?\d{7,8})/,
    ];

    for (const pattern of phonePatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        info.phone = match[1];
        break;
      }
    }

    // 提取地址
    const addressPatterns = [
      /地址[：:]\s*([^\n\r,，。]+)/,
      /学校地址[：:]\s*([^\n\r,，。]+)/,
      /([省市]市[^\s,，]+[路街道号巷弄])/
    ];

    for (const pattern of addressPatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        info.address = match[1].trim().slice(0, 100);
        break;
      }
    }

    // 提取招生信息
    const admissionSelectors = [
      'a[href*="admission"]',
      'a[href*="zhaosheng"]',
      'a[href*="zhao_sheng"]',
      '.admission',
      '.zhaosheng',
      '[class*="招生"]',
    ];

    for (const selector of admissionSelectors) {
      const element = $(selector).first();
      if (element.length) {
        info.admissionInfo = element.text().trim().slice(0, 200);
        break;
      }
    }

    // 如果没有找到招生信息，尝试从 meta 提取
    if (!info.admissionInfo) {
      info.admissionInfo = $('meta[name="description"]').attr('content') || '';
    }

    return info;
  } catch (error) {
    console.error(`官网抓取失败 [${websiteUrl}]: ${error.message}`);
    return null;
  }
}

/**
 * 批量补充学校信息
 */
async function enrichSchools(schools, options = {}) {
  const {
    limit = 100,
    startIndex = 0,
    dryRun = false,
    skipHasWebsite = true,
    skipHasPhone = true,
  } = options;

  const existing = await readJson(OUTPUT_FILE, []);
  const existingMap = new Map(existing.map(item => [item.id, item]));

  // 筛选需要补充的学校
  let candidates = schools.filter(school => {
    if (skipHasWebsite && school.website) return false;
    if (skipHasPhone && school.phone) return false;
    return true;
  });

  if (limit > 0) {
    candidates = candidates.slice(startIndex, startIndex + limit);
  }

  console.log(`开始补充 ${candidates.length} 所学校的信息...`);

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < candidates.length; i++) {
    const school = candidates[i];
    console.log(`[${i + 1}/${candidates.length}] 处理：${school.name}`);

    try {
      let enrichedInfo = {
        id: school.id,
        name: school.name,
        district: school.districtName,
        website: school.website || '',
        phone: school.phone || '',
        address: school.address || '',
        enrichedAt: new Date().toISOString(),
        source: 'search_enrichment',
      };

      // 如果没有官网，通过搜索获取
      if (!school.website) {
        console.log(`  → 搜索学校信息...`);
        const searchResults = await searchSchoolInfo(school.name, school.districtName);
        const extracted = extractInfoFromSearch(searchResults, school.name);

        if (extracted.website) {
          enrichedInfo.website = extracted.website;
        }
        if (extracted.phone) {
          enrichedInfo.phone = extracted.phone;
        }

        await sleep(2000 + Math.random() * 1500); // 搜索后延迟
      }

      // 如果有官网，深度抓取
      if (enrichedInfo.website && !enrichedInfo.phone) {
        console.log(`  → 抓取官网信息...`);
        const websiteInfo = await crawlSchoolWebsite(enrichedInfo.website, school.name);
        
        if (websiteInfo) {
          if (!enrichedInfo.phone && websiteInfo.phone) {
            enrichedInfo.phone = websiteInfo.phone;
          }
          if (!enrichedInfo.address && websiteInfo.address) {
            enrichedInfo.address = websiteInfo.address;
          }
          if (websiteInfo.admissionInfo) {
            enrichedInfo.admissionInfo = websiteInfo.admissionInfo;
          }
        }

        await sleep(1500 + Math.random() * 1000); // 官网抓取后延迟
      }

      // 统计成功
      if (enrichedInfo.website || enrichedInfo.phone || enrichedInfo.address) {
        successCount++;
      } else {
        errorCount++;
      }

      results.push(enrichedInfo);

      // 保存到现有映射
      existingMap.set(school.id, enrichedInfo);

    } catch (error) {
      console.error(`  ✗ 失败：${error.message}`);
      errorCount++;
    }
  }

  // 合并结果
  const allResults = Array.from(existingMap.values());

  if (!dryRun) {
    await writeJson(OUTPUT_FILE, allResults);
  }

  console.log(`\n补充完成！`);
  console.log(`成功：${successCount} 所`);
  console.log(`失败：${errorCount} 所`);
  console.log(`总计：${allResults.length} 所`);

  return {
    total: allResults.length,
    success: successCount,
    errors: errorCount,
    sample: results.slice(0, 5),
  };
}

/**
 * 主函数
 */
async function main() {
  const schools = await readJson(path.join(ROOT_DATA_DIR, 'schools.json'), []);
  
  const options = {
    limit: process.env.ENRICH_LIMIT ? parseInt(process.env.ENRICH_LIMIT, 10) : 50,
    startIndex: process.env.ENRICH_START ? parseInt(process.env.ENRICH_START, 10) : 0,
    dryRun: process.argv.includes('--dry-run'),
    skipHasWebsite: !process.argv.includes('--force-website'),
    skipHasPhone: !process.argv.includes('--force-phone'),
  };

  console.log('=== 学校详情补充爬虫 ===');
  console.log(`学校总数：${schools.length}`);
  console.log(`本次处理：${options.limit} 所`);
  console.log(`起始位置：${options.startIndex}`);
  console.log(`Dry Run：${options.dryRun}`);
  console.log('');

  const result = await enrichSchools(schools, options);
  
  if (options.dryRun) {
    console.log('\n[DRY RUN] 未写入文件');
    console.log('示例结果：');
    console.log(JSON.stringify(result.sample, null, 2));
  }

  return result;
}

// 模块导出
if (require.main === module) {
  main()
    .then((result) => {
      console.log('\n最终结果：');
      console.log(JSON.stringify({
        total: result.total,
        success: result.success,
        errors: result.errors,
      }, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('补充失败：', error.message);
      process.exit(1);
    });
}

module.exports = { enrichSchools, searchSchoolInfo, crawlSchoolWebsite };
