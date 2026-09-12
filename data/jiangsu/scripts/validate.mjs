#!/usr/bin/env node
// 校验脚本：node scripts/validate.mjs [city]（在 data/jiangsu 目录下运行；不传 city 跑全部）
// 1) 逐校跑 school.schema.json 的手写 draft-07 子集校验 + lib/schema.mjs 的词表/一致性校验
// 2) 跨文件一致性：slug 全市唯一、districtName 在 districts.json 内、_index.json 与实际文件一致
// 退出码非 0 表示有错。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSchool, CITY_SLUGS } from './lib/schema.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const CITIES_DIR = path.join(ROOT, 'cities');

// ---------- JSON Schema (draft-07 子集) 校验 ----------
// 覆盖 school.schema.json 用到的关键字：type/required/properties/additionalProperties/
// enum/pattern/minLength/maxLengtH/items/default(忽略)。
function schemaValidate(value, schema, at, errors, root = schema) {
  if (!schema) return;
  if (schema.$ref) {
    // 本 schema 无 $ref，防御性报错
    errors.push(`${at}: 不支持 $ref`);
    return;
  }
  if (schema.enum) {
    if (!schema.enum.includes(value)) errors.push(`${at}: 值 ${JSON.stringify(value)} 不在 enum [${schema.enum.join('|')}] 内`);
    return;
  }
  const types = Array.isArray(schema.type) ? schema.type : (schema.type ? [schema.type] : []);
  if (types.length) {
    const ok = types.some((t) => {
      switch (t) {
        case 'object': return value && typeof value === 'object' && !Array.isArray(value);
        case 'array': return Array.isArray(value);
        case 'string': return typeof value === 'string';
        case 'integer': return Number.isInteger(value);
        case 'number': return typeof value === 'number';
        case 'boolean': return typeof value === 'boolean';
        case 'null': return value === null;
        default: return false;
      }
    });
    if (!ok) {
      errors.push(`${at}: 类型应为 ${types.join('|')}，实际 ${Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value}`);
      return;
    }
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${at}: 长度 < minLength ${schema.minLength}`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${at}: 长度 > maxLength ${schema.maxLength}`);
    if (schema.pattern) {
      const re = new RegExp(schema.pattern, 'u');
      if (!re.test(value)) errors.push(`${at}: 不匹配 pattern ${schema.pattern}`);
    }
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required || []) {
      if (!(key in value)) errors.push(`${at}.${key}: required 缺失`);
    }
    const props = schema.properties || {};
    for (const [key, sub] of Object.entries(props)) {
      if (key in value) schemaValidate(value[key], sub, `${at}.${key}`, errors, root);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in props)) errors.push(`${at}.${key}: additionalProperties 不允许`);
      }
    }
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, i) => schemaValidate(item, schema.items, `${at}[${i}]`, errors, root));
  }
}

// ---------- IO 工具 ----------
function readJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw);
}

function listCitySlugs() {
  return fs.readdirSync(CITIES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => CITY_SLUGS.includes(name))
    .sort((a, b) => CITY_SLUGS.indexOf(a) - CITY_SLUGS.indexOf(b));
}

function loadSchoolFiles(cityDir) {
  const out = [];
  for (const stage of ['senior', 'junior']) {
    const stageDir = path.join(cityDir, 'schools', stage);
    if (!fs.existsSync(stageDir)) continue;
    for (const f of fs.readdirSync(stageDir).sort()) {
      if (!f.endsWith('.json') || f.startsWith('_')) continue;
      out.push({ stage, file: path.join(stageDir, f) });
    }
  }
  return out;
}

// ---------- 单市校验 ----------
function validateCity(city) {
  const errors = [];
  const warnings = [];
  const cityDir = path.join(CITIES_DIR, city);

  const cityJsonPath = path.join(cityDir, 'city.json');
  if (!fs.existsSync(cityJsonPath)) {
    errors.push(`${city}/city.json: 缺失`);
    return { city, errors, warnings, count: 0 };
  }
  let cityJson;
  try {
    cityJson = readJson(cityJsonPath);
  } catch (e) {
    errors.push(`${city}/city.json: JSON 解析失败 ${e.message}`);
    return { city, errors, warnings, count: 0 };
  }
  if (cityJson.slug !== city) errors.push(`${city}/city.json: slug 应为 "${city}"`);
  if (!cityJson.officialSourceName) errors.push(`${city}/city.json: officialSourceName 缺失`);
  if (cityJson.collectionStatus === 'not_started' || cityJson.collectionStatus === 'reference') {
    // 占位市（not_started）与参照市（reference，权威数据在 DB）：只做结构检查
    if (!fs.existsSync(path.join(cityDir, 'schools'))) {
      errors.push(`${city}/schools/: 目录缺失`);
    }
    return { city, errors, warnings, count: 0 };
  }

  // 完整市：districts.json + 区目录一致性
  let districtIds = [];
  let districtNames = [];
  const districtsPath = path.join(cityDir, 'districts.json');
  if (fs.existsSync(districtsPath)) {
    const d = readJson(districtsPath);
    const catalog = d.districtCatalog || d || [];
    districtIds = catalog.map((x) => x.id);
    districtNames = catalog.map((x) => x.name);
    const cityCatalog = (cityJson.districtCatalog || []).map((x) => x.id);
    if (JSON.stringify(districtIds) !== JSON.stringify(cityCatalog)) {
      errors.push(`${city}: districts.json 与 city.json.districtCatalog 的区目录不一致`);
    }
  } else {
    errors.push(`${city}/districts.json: 缺失`);
  }

  // 逐校校验
  const schema = readJson(path.join(ROOT, 'school.schema.json'));
  const files = loadSchoolFiles(cityDir);
  const slugs = new Set();
  const indexActual = { senior: [], junior: [] };
  let passed = 0;

  for (const { stage, file } of files) {
    const rel = path.relative(ROOT, file);
    let obj;
    try {
      obj = readJson(file);
    } catch (e) {
      errors.push(`${rel}: JSON 解析失败 ${e.message}`);
      continue;
    }
    const schemaErrs = [];
    schemaValidate(obj, schema, rel, schemaErrs);
    errors.push(...schemaErrs);
    const issues = validateSchool(obj, { citySlug: city, districtIds, districtNames })
      .map((issue) => `${rel}: ${issue}`);
    errors.push(...issues);

    if (obj.slug) {
      if (slugs.has(obj.slug)) errors.push(`${rel}: slug "${obj.slug}" 与其他学校重复`);
      slugs.add(obj.slug);
    }
    // stage 目录归属：senior=高中/完全中学，junior=初中
    if (stage === 'senior' && obj.schoolStageLabel === '初中') errors.push(`${rel}: 初中不应放在 senior/ 目录`);
    if (stage === 'junior' && obj.schoolStageLabel !== '初中') errors.push(`${rel}: 非 初中 学段不应放在 junior/ 目录`);

    indexActual[stage].push({
      slug: obj.slug,
      name: obj.name,
      district: obj.districtName,
      stage: obj.schoolStageLabel,
      level: obj.schoolKeyLevel,
      property: obj.schoolPropertyLabel,
      star: (Array.isArray(obj.features) ? obj.features.find((f) => f.includes('星级普通高中')) || '' : '')
    });
    if (!schemaErrs.length && !issues.length) passed += 1;
    if (obj.infoVerified === false) warnings.push(`${rel}: infoVerified=false（未人工核实）`);
  }

  // _index.json 与实际文件一致
  for (const stage of ['senior', 'junior']) {
    const indexPath = path.join(cityDir, 'schools', stage, '_index.json');
    if (fs.existsSync(indexPath)) {
      let idx;
      try {
        idx = readJson(indexPath);
      } catch (e) {
        errors.push(`cities/${city}/schools/${stage}/_index.json: JSON 解析失败 ${e.message}`);
        idx = null;
      }
      if (idx) {
        const listed = (idx.schools || idx).map((s) => s.slug).filter(Boolean);
        const actual = indexActual[stage].map((s) => s.slug);
        for (const slug of actual) if (!listed.includes(slug)) errors.push(`cities/${city}/schools/${stage}/_index.json: 缺少 ${slug}`);
        for (const slug of listed) if (!actual.includes(slug)) errors.push(`cities/${city}/schools/${stage}/_index.json: 多出 ${slug}（无对应文件）`);
      }
    }
  }

  // 全市 _index.json（若存在）与全部文件一致
  const cityIndexPath = path.join(cityDir, 'schools', '_index.json');
  if (fs.existsSync(cityIndexPath)) {
    try {
      const idx = readJson(cityIndexPath);
      const listed = (idx.schools || idx).map((s) => s.slug).filter(Boolean);
      const actual = [...indexActual.senior, ...indexActual.junior].map((s) => s.slug);
      for (const slug of actual) if (!listed.includes(slug)) errors.push(`cities/${city}/schools/_index.json: 缺少 ${slug}`);
      for (const slug of listed) if (!actual.includes(slug)) errors.push(`cities/${city}/schools/_index.json: 多出 ${slug}`);
    } catch (e) {
      errors.push(`cities/${city}/schools/_index.json: JSON 解析失败 ${e.message}`);
    }
  }

  return { city, errors, warnings, count: files.length, passed };
}

// ---------- main ----------
const argCity = process.argv[2];
if (argCity && !CITY_SLUGS.includes(argCity)) {
  console.error(`未知市 slug: ${argCity}（合法值：${CITY_SLUGS.join(', ')}）`);
  process.exit(2);
}
const cities = argCity ? [argCity] : listCitySlugs();
if (!cities.length) {
  console.error('cities/ 下未发现任何市目录');
  process.exit(2);
}

let totalErrors = 0;
let totalSchools = 0;
for (const city of cities) {
  const r = validateCity(city);
  totalErrors += r.errors.length;
  totalSchools += r.count;
  const tag = r.errors.length ? '❌' : '✅';
  console.log(`${tag} ${city}: ${r.count} 所学校，${r.errors.length} 错误，${r.warnings.length} 提示`);
  for (const e of r.errors) console.log(`   ❌ ${e}`);
  if (process.env.VERBOSE) for (const w of r.warnings) console.log(`   ⚠️  ${w}`);
}

console.log('');
if (totalErrors) {
  console.log(`共 ${cities.length} 市 / ${totalSchools} 校：❌ ${totalErrors} 个错误`);
  process.exit(1);
} else {
  console.log(`共 ${cities.length} 市 / ${totalSchools} 校：✅ 全部通过（详细未核实提示可 VERBOSE=1 查看）`);
}
