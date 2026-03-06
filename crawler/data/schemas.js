// 数据模式定义
const schoolSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    district: { type: 'string' },
    address: { type: 'string' },
    phone: { type: 'string' },
    website: { type: 'string' },
    type: { type: 'string' }, // 重点中学、普通中学、职业学校等
    level: { type: 'string' }, // 市重点、区重点、普通
    features: { type: 'array', items: { type: 'string' } },
    admissionScore: { type: 'number' },
    enrollmentPlan: { type: 'object' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' }
  },
  required: ['id', 'name', 'district']
};

const policySchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    district: { type: 'string' },
    year: { type: 'number' },
    content: { type: 'string' },
    sourceUrl: { type: 'string' },
    publishDate: { type: 'string' },
    effectiveDate: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' }
  },
  required: ['id', 'title', 'year', 'content']
};

const districtSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    educationBureau: { type: 'string' },
    website: { type: 'string' },
    contact: { type: 'string' },
    schoolCount: { type: 'number' },
    keySchools: { type: 'array', items: { type: 'string' } },
    admissionPolicy: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' }
  },
  required: ['id', 'name']
};

module.exports = {
  schoolSchema,
  policySchema,
  districtSchema
};