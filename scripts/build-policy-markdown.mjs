import fs from 'fs';
import path from 'path';
import {
  buildPolicyMarkdown,
  getPolicyContentRelativePath,
  validatePolicyMarkdownFiles,
  writePolicyMarkdownFiles
} from '../lib/policy-content-files.mjs';

const policiesPath = path.join(process.cwd(), 'data', 'policies.json');
const newsPath = path.join(process.cwd(), 'data', 'news.json');

const policies = JSON.parse(fs.readFileSync(policiesPath, 'utf8'));
const news = JSON.parse(fs.readFileSync(newsPath, 'utf8'));

const enriched = policies.map((item) => ({
  ...item,
  contentMd: buildPolicyMarkdown(item, news),
  contentFile: getPolicyContentRelativePath(item)
}));

writePolicyMarkdownFiles(enriched, news);
validatePolicyMarkdownFiles(enriched);

const stored = enriched.map(({ contentMd, content, ...item }) => item);
fs.writeFileSync(policiesPath, `${JSON.stringify(stored, null, 2)}\n`);

console.log(JSON.stringify({
  count: stored.length,
  withFiles: stored.filter((item) => item.contentFile).length
}, null, 2));
