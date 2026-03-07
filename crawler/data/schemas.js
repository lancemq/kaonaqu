const districtSchema = {
  required: ['id', 'name', 'description', 'schoolCount', 'policyCount', 'latestPolicyTitle'],
  properties: {
    id: 'string',
    name: 'string',
    description: 'string',
    schoolCount: 'number',
    policyCount: 'number',
    latestPolicyTitle: 'string'
  }
};

const schoolSchema = {
  required: ['id', 'name', 'districtId', 'districtName', 'schoolStage', 'schoolStageLabel', 'schoolType', 'schoolTypeLabel', 'source'],
  properties: {
    id: 'string',
    name: 'string',
    districtId: 'string',
    districtName: 'string',
    schoolStage: 'string',
    schoolStageLabel: 'string',
    schoolType: 'string',
    schoolTypeLabel: 'string',
    tier: 'string',
    address: 'string',
    phone: 'string',
    website: 'string',
    admissionNotes: 'string',
    features: 'string[]',
    tags: 'string[]',
    source: 'object',
    updatedAt: 'string|null'
  }
};

const policySchema = {
  required: ['id', 'title', 'districtId', 'districtName', 'year', 'summary', 'source'],
  properties: {
    id: 'string',
    title: 'string',
    districtId: 'string',
    districtName: 'string',
    year: 'number',
    summary: 'string',
    content: 'string',
    source: 'object',
    publishedAt: 'string|null',
    updatedAt: 'string|null'
  }
};

module.exports = {
  districtSchema,
  policySchema,
  schoolSchema
};
