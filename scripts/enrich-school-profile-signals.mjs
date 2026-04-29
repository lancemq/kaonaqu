import fs from 'fs';
import path from 'path';
import { enrichSchoolProfiles } from '../lib/school-profile-enrichment.mjs';

const schoolsPath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));
const { schools: enriched, stats } = enrichSchoolProfiles(schools);

fs.writeFileSync(schoolsPath, `${JSON.stringify(enriched, null, 2)}\n`);

console.log(`school profile signals enriched: ${JSON.stringify(stats)}`);
