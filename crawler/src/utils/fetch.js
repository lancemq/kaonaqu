const axios = require('axios');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}) {
  const {
    timeout = 15000,
    retries = 2,
    delay = 1200,
    headers = {}
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await axios.get(url, {
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          ...headers
        }
      });
      return response.data;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

module.exports = {
  fetchWithRetry,
  sleep
};
