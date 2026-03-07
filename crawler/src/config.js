const path = require('path');

const config = {
  request: {
    timeout: 15000,
    retries: 2,
    delay: 1200,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  registryFile: path.join(__dirname, 'sources/registry.json'),
  output: {
    dataDir: './data',
    format: 'json',
    encoding: 'utf8'
  },
  logging: {
    level: 'info',
    file: './logs/crawler.log',
    console: true
  },
  antiCrawl: {
    rotateUserAgents: true,
    randomDelays: true,
    maxConcurrentRequests: 3,
    respectRobotsTxt: true
  }
};

module.exports = config;
