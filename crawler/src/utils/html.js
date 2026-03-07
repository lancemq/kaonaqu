const cheerio = require('cheerio');

function cleanText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const matched = text.match(pattern);
    if (matched) {
      return matched[1] || matched[0];
    }
  }
  return '';
}

function collectLinks(html, baseUrl, selectors = ['a']) {
  const $ = cheerio.load(html);
  const seen = new Set();
  const results = [];

  selectors.forEach((selector) => {
    $(selector).each((_, element) => {
      const href = $(element).attr('href');
      const title = cleanText($(element).text());
      if (!href || !title) {
        return;
      }

      let absoluteUrl = href;
      try {
        absoluteUrl = new URL(href, baseUrl).href;
      } catch {
        return;
      }

      if (seen.has(absoluteUrl)) {
        return;
      }
      seen.add(absoluteUrl);

      const contextText = cleanText($(element).parent().text() || $(element).closest('li, article, div, tr').text());
      const publishedAt = firstMatch(contextText, [
        /(\d{4}-\d{2}-\d{2})/,
        /(\d{4}\.\d{2}\.\d{2})/,
        /(\d{4}\/\d{2}\/\d{2})/
      ]).replace(/\./g, '-').replace(/\//g, '-');

      results.push({
        title,
        url: absoluteUrl,
        publishedAt: publishedAt || null
      });
    });
  });

  return results;
}

function extractArticle(html, url, detailSelectors = ['main', '.article', '.content', 'body']) {
  const $ = cheerio.load(html);
  const title = cleanText($('h1').first().text()) || cleanText($('title').text());
  const bodyText = detailSelectors
    .map((selector) => cleanText($(selector).first().text()))
    .find(Boolean) || cleanText($.root().text());
  const publishedAt = firstMatch(bodyText, [
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{4}\.\d{2}\.\d{2})/,
    /(\d{4}\/\d{2}\/\d{2})/
  ]).replace(/\./g, '-').replace(/\//g, '-');

  const summary = cleanText(bodyText).slice(0, 160);

  return {
    title,
    url,
    publishedAt: publishedAt || null,
    summary,
    content: bodyText
  };
}

module.exports = {
  cleanText,
  collectLinks,
  extractArticle
};
