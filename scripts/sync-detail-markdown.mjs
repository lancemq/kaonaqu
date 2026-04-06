import { createRequire } from 'module';
import { writePolicyMarkdownFiles, validatePolicyMarkdownFiles } from '../lib/policy-content-files.mjs';
import { writeSchoolMarkdownFiles, validateSchoolMarkdownFiles } from '../lib/school-content-files.mjs';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../shared/data-store');

const { policies, schools, news } = await loadDataStore();

writePolicyMarkdownFiles(policies, news);
writeSchoolMarkdownFiles(schools);

validatePolicyMarkdownFiles(policies);
validateSchoolMarkdownFiles(schools);

console.log(JSON.stringify({
  policies: policies.length,
  schools: schools.length
}, null, 2));
