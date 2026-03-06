/**
 * 数据处理和清洗工具
 * 负责数据标准化、去重、验证等操作
 */

const fs = require('fs').promises;
const path = require('path');

class DataProcessor {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
  }

  /**
   * 标准化学校数据
   * @param {Array} schools - 原始学校数据
   * @returns {Array} - 标准化后的学校数据
   */
  standardizeSchools(schools) {
    return schools.map(school => ({
      id: school.id || this.generateId(school.name),
      name: this.cleanString(school.name),
      district: this.cleanString(school.district),
      address: this.cleanString(school.address),
      phone: this.cleanPhone(school.phone),
      website: this.cleanUrl(school.website),
      type: school.type || '普通中学',
      level: school.level || '初中',
      enrollment: school.enrollment || null,
      description: this.cleanString(school.description),
      features: Array.isArray(school.features) ? school.features : [],
      coordinates: school.coordinates || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  /**
   * 标准化招生政策数据
   * @param {Array} policies - 原始政策数据
   * @returns {Array} - 标准化后的政策数据
   */
  standardizePolicies(policies) {
    return policies.map(policy => ({
      id: policy.id || this.generateId(policy.title),
      title: this.cleanString(policy.title),
      district: this.cleanString(policy.district),
      year: policy.year || 2026,
      content: this.cleanString(policy.content),
      sourceUrl: this.cleanUrl(policy.sourceUrl),
      publishDate: policy.publishDate || new Date().toISOString(),
      categories: Array.isArray(policy.categories) ? policy.categories : ['中考政策'],
      tags: Array.isArray(policy.tags) ? policy.tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  /**
   * 数据去重
   * @param {Array} data - 数据数组
   * @param {string} key - 去重字段
   * @returns {Array} - 去重后的数据
   */
  removeDuplicates(data, key = 'id') {
    const seen = new Set();
    return data.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  /**
   * 数据验证
   * @param {Array} data - 数据数组
   * @param {Function} validator - 验证函数
   * @returns {Object} - 验证结果
   */
  validateData(data, validator) {
    const valid = [];
    const invalid = [];
    
    data.forEach(item => {
      if (validator(item)) {
        valid.push(item);
      } else {
        invalid.push(item);
      }
    });
    
    return { valid, invalid };
  }

  /**
   * 保存数据到文件
   * @param {Array} data - 数据
   * @param {string} filename - 文件名
   */
  async saveData(data, filename) {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      const filePath = path.join(this.dataDir, filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`✅ 数据已保存到: ${filePath}`);
    } catch (error) {
      console.error(`❌ 保存数据失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 清理字符串
   * @param {string} str - 输入字符串
   * @returns {string} - 清理后的字符串
   */
  cleanString(str) {
    if (!str) return '';
    return str
      .toString()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\r\n\t]/g, ' ');
  }

  /**
   * 清理电话号码
   * @param {string} phone - 电话号码
   * @returns {string} - 清理后的电话号码
   */
  cleanPhone(phone) {
    if (!phone) return '';
    return phone.toString().replace(/[^\d\-+]/g, '');
  }

  /**
   * 清理URL
   * @param {string} url - URL
   * @returns {string} - 清理后的URL
   */
  cleanUrl(url) {
    if (!url) return '';
    try {
      return new URL(url).href;
    } catch {
      return url.trim();
    }
  }

  /**
   * 生成唯一ID
   * @param {string} name - 名称
   * @returns {string} - 唯一ID
   */
  generateId(name) {
    return name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').substring(0, 50);
  }
}

module.exports = DataProcessor;