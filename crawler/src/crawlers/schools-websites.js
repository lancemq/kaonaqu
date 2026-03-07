const path = require('path');
const { fetchWithRetry } = require('../utils/fetch');
const { extractArticle } = require('../utils/html');
const { readJson, writeJson } = require('../utils/io');

const ROOT_DATA_DIR = path.join(__dirname, '../../../data');
const RAW_DIR = path.join(__dirname, '../../data/raw');
const OUTPUT_FILE = path.join(RAW_DIR, 'school-websites.json');

async function crawlSchoolWebsites() {
  const schools = await readJson(path.join(ROOT_DATA_DIR, 'schools.json'), []);
  const existing = await readJson(OUTPUT_FILE, []);
  const results = [];

  for (const school of schools) {
    if (!school.website) {
      continue;
    }

    try {
      const html = await fetchWithRetry(school.website);
      const article = extractArticle(html, school.website, ['main', '.article', '.content', 'body']);
      results.push({
        name: school.name,
        district: school.districtName,
        address: school.address,
        phone: school.phone,
        website: school.website,
        admissionInfo: article.summary,
        source: '学校官网',
        sourceUrl: school.website,
        crawledAt: new Date().toISOString()
      });
    } catch (error) {
      const fallback = existing.find((item) => item.website === school.website);
      if (fallback) {
        results.push(fallback);
      }
    }
  }

  await writeJson(OUTPUT_FILE, results);
  return results;
}

if (require.main === module) {
  crawlSchoolWebsites()
    .then((items) => {
      console.log(`school-websites=${items.length}`);
    })
    .catch((error) => {
      console.error('crawl school websites failed:', error.message);
      process.exit(1);
    });
}

module.exports = crawlSchoolWebsites;
