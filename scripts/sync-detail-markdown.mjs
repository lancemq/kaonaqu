import { createRequire } from 'module';
import { writePolicyMarkdownFiles, validatePolicyMarkdownFiles } from '../lib/policy-content-files.mjs';
import fs from 'fs';
import { buildSchoolMarkdown, getSchoolContentAbsolutePath, validateSchoolMarkdownFiles } from '../lib/school-content-files.mjs';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../shared/data-store');

const { policies, schools, news } = await loadDataStore();

writePolicyMarkdownFiles(policies, news);

for (const school of schools) {
  const filePath = getSchoolContentAbsolutePath(school);
  if (fs.existsSync(filePath)) {
    continue;
  }
  const markdown = buildSchoolMarkdown(school);
  fs.writeFileSync(filePath, `${markdown}\n`, 'utf8');
}

validatePolicyMarkdownFiles(policies);
validateSchoolMarkdownFiles(schools);

console.log(JSON.stringify({
  policies: policies.length,
  schools: schools.length
}, null, 2));
