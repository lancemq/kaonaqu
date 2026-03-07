const EducationForumsCrawler = require('./education-forums');

async function crawlCommunityFallback() {
  const crawler = new EducationForumsCrawler();
  await crawler.initialize();
  const schools = await crawler.crawlSchoolInfo();
  const discussions = await crawler.crawlAdmissionDiscussions();
  return { schools, discussions };
}

if (require.main === module) {
  crawlCommunityFallback()
    .then((result) => {
      console.log(`fallback-schools=${result.schools.length}, fallback-discussions=${result.discussions.length}`);
    })
    .catch((error) => {
      console.error('crawl community fallback failed:', error.message);
      process.exit(1);
    });
}

module.exports = crawlCommunityFallback;
