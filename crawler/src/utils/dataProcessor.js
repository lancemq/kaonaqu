const fs = require('fs').promises;
const path = require('path');
const {
  normalizePolicy,
  normalizeSchool
} = require('../../../shared/data-schema');

class DataProcessor {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data/processed');
  }

  standardizeSchools(schools) {
    return schools.map((school) => normalizeSchool(school));
  }

  standardizePolicies(policies) {
    return policies.map((policy, index) => normalizePolicy(policy, index));
  }

  removeDuplicates(data, key = 'id') {
    const seen = new Set();
    return data.filter((item) => {
      if (seen.has(item[key])) {
        return false;
      }
      seen.add(item[key]);
      return true;
    });
  }

  validateData(data, validator) {
    const valid = [];
    const invalid = [];

    data.forEach((item) => {
      if (validator(item)) {
        valid.push(item);
      } else {
        invalid.push(item);
      }
    });

    return { valid, invalid };
  }

  async saveData(data, filename) {
    await fs.mkdir(this.dataDir, { recursive: true });
    const filePath = path.join(this.dataDir, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return filePath;
  }
}

module.exports = DataProcessor;
