const path = require('path');
const { readJson, writeJson } = require('../utils/io');
const { RAW_DIR } = require('../utils/paths');

const OUTPUT_FILE = path.join(RAW_DIR, 'official-schools.json');

async function crawlOfficialSchools() {
  const existing = await readJson(OUTPUT_FILE, []);
  await writeJson(OUTPUT_FILE, existing);
  return existing;
}

if (require.main === module) {
  crawlOfficialSchools()
    .then((items) => {
      console.log(`official-schools=${items.length}`);
    })
    .catch((error) => {
      console.error('crawl official schools failed:', error.message);
      process.exit(1);
    });
}

module.exports = crawlOfficialSchools;
