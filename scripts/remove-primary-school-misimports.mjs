import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const schoolsPath = path.join(ROOT, 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));

const shouldRemove = (school) => /小学(?:（|$)/.test(String(school.name || ''));
const removed = schools.filter(shouldRemove);
const kept = schools.filter((school) => !shouldRemove(school));

for (const school of removed) {
  if (!school.contentFile) continue;
  const contentPath = path.join(ROOT, school.contentFile);
  if (fs.existsSync(contentPath)) {
    fs.unlinkSync(contentPath);
  }
}

fs.writeFileSync(schoolsPath, `${JSON.stringify(kept, null, 2)}\n`);

console.log(`removed=${removed.length}`);
for (const school of removed) {
  console.log(`${school.id} | ${school.name}`);
}
