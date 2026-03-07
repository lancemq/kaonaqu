const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8'));
}

function loadData() {
  return {
    districts: readJson('districts.json'),
    schools: readJson('schools.json'),
    policies: readJson('policies.json'),
    news: readJson('news.json')
  };
}

function filterSchools(schools, districtId) {
  return districtId && districtId !== 'all'
    ? schools.filter((school) => school.districtId === districtId)
    : schools;
}

function filterPolicies(policies, districtId) {
  return districtId && districtId !== 'all'
    ? policies.filter((policy) => policy.districtId === 'all' || policy.districtId === districtId)
    : policies;
}

function searchSchools(schools, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return schools;
  }

  return schools.filter((school) => {
    const haystack = [
      school.name,
      school.districtName,
      school.schoolTypeLabel,
      school.address,
      school.admissionNotes,
      ...(school.features || []),
      ...(school.tags || [])
    ].join(' ').toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

module.exports = {
  loadData,
  filterSchools,
  filterPolicies,
  searchSchools
};
