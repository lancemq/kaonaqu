#!/usr/bin/env node
/**
 * 学校数据合并脚本
 * 
 * 将补充的学校信息合并到 data/schools.json
 */

const fs = require('fs').promises;
const path = require('path');
const { readJson, writeJson } = require('./utils/io');
const { RAW_DIR, ROOT_DATA_DIR } = require('./utils/paths');

/**
 * 合并学校信息
 */
async function mergeSchoolData() {
  const schoolsFile = path.join(ROOT_DATA_DIR, 'schools.json');
  const enrichmentFile = path.join(RAW_DIR, 'school-enrichment.json');

  // 读取数据
  const schools = await readJson(schoolsFile, []);
  const enrichmentData = await readJson(enrichmentFile, []);

  // 创建补充信息映射
  const enrichmentMap = new Map();
  for (const item of enrichmentData) {
    enrichmentMap.set(item.id, item);
  }

  console.log(`学校总数：${schools.length}`);
  console.log(`补充数据：${enrichmentData.length} 条`);

  let updatedCount = 0;
  let newWebsiteCount = 0;
  let newPhoneCount = 0;
  let newAddressCount = 0;

  // 合并数据
  const updatedSchools = schools.map(school => {
    const enrichment = enrichmentMap.get(school.id);
    if (!enrichment) {
      return school;
    }

    let updated = false;
    const updatedSchool = { ...school };

    // 更新官网
    if (!updatedSchool.website && enrichment.website) {
      updatedSchool.website = enrichment.website;
      newWebsiteCount++;
      updated = true;
    }

    // 更新电话
    if (!updatedSchool.phone && enrichment.phone) {
      updatedSchool.phone = enrichment.phone;
      newPhoneCount++;
      updated = true;
    }

    // 更新地址
    if (!updatedSchool.address && enrichment.address) {
      updatedSchool.address = enrichment.address;
      newAddressCount++;
      updated = true;
    }

    // 更新 features
    if (enrichment.admissionInfo && !updatedSchool.features?.some(f => f.includes('招生'))) {
      updatedSchool.features = updatedSchool.features || [];
      updatedSchool.features.push('已补充招生信息');
    }

    // 更新时间戳
    if (updated) {
      updatedSchool.updatedAt = new Date().toISOString();
      updatedSchool.profileDepth = school.profileDepth === 'foundation' ? 'detailed' : school.profileDepth;
      updatedCount++;
    }

    return updatedSchool;
  });

  // 写入更新后的数据
  await writeJson(schoolsFile, updatedSchools);

  console.log('\n=== 合并完成 ===');
  console.log(`更新学校：${updatedCount} 所`);
  console.log(`新官网：${newWebsiteCount} 个`);
  console.log(`新电话：${newPhoneCount} 个`);
  console.log(`新地址：${newAddressCount} 个`);

  return {
    total: schools.length,
    updated: updatedCount,
    newWebsites: newWebsiteCount,
    newPhones: newPhoneCount,
    newAddresses: newAddressCount,
  };
}

/**
 * 验证数据
 */
async function validateData() {
  const schools = await readJson(path.join(ROOT_DATA_DIR, 'schools.json'), []);

  const stats = {
    total: schools.length,
    withWebsite: schools.filter(s => s.website).length,
    withPhone: schools.filter(s => s.phone).length,
    withAddress: schools.filter(s => s.address).length,
    detailed: schools.filter(s => s.profileDepth === 'detailed').length,
    foundation: schools.filter(s => s.profileDepth === 'foundation').length,
  };

  const coverage = {
    website: ((stats.withWebsite / stats.total) * 100).toFixed(1) + '%',
    phone: ((stats.withPhone / stats.total) * 100).toFixed(1) + '%',
    address: ((stats.withAddress / stats.total) * 100).toFixed(1) + '%',
    detailed: ((stats.detailed / stats.total) * 100).toFixed(1) + '%',
  };

  console.log('\n=== 数据验证 ===');
  console.log(`学校总数：${stats.total}`);
  console.log(`有官网：${stats.withWebsite} 所 (${coverage.website})`);
  console.log(`有电话：${stats.withPhone} 所 (${coverage.phone})`);
  console.log(`有地址：${stats.withAddress} 所 (${coverage.address})`);
  console.log(`详细档案：${stats.detailed} 所 (${coverage.detailed})`);
  console.log(`基础档案：${stats.foundation} 所`);

  return { stats, coverage };
}

// 主函数
async function main() {
  console.log('=== 学校数据合并 ===\n');

  await mergeSchoolData();
  await validateData();
}

if (require.main === module) {
  main().catch(error => {
    console.error('合并失败：', error.message);
    process.exit(1);
  });
}

module.exports = { mergeSchoolData, validateData };
