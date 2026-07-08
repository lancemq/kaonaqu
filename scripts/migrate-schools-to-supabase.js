#!/usr/bin/env node
/**
 * 迁移脚本：将本地 schools.json + content/schools/*.md 迁移到 Supabase
 *
 * Markdown 按 ## 标题拆成 section 列写入 schools 表（不再单独写 school_contents）
 *
 * 用法：
 *   node scripts/migrate-schools-to-supabase.js           # 正式执行
 *   node scripts/migrate-schools-to-supabase.js --dry-run  # 预演
 */

require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const {
  getServiceClient,
  isSupabaseConfigured,
  SCHOOLS_TABLE
} = require('../shared/supabase-client');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const BATCH_SIZE = 50;

// 固定 section 标题 → 列名映射
const SECTION_MAP = {
  '学校概览': 'overview_md',
  '基础信息': 'basics_md',
  '关注重点': 'highlights_md',
  '招生与路径': 'admission_md',
  '培养方向': 'directions_md',
  '适合谁': 'suitable_md',
  '阅读提示': 'tips_md',
  '公开信息入口': 'sources_md',
  '官方对口查询': 'assigned_area_md',
  '历史沿革（公开资料）': 'history_md',
  '办学特色（公开资料）': 'features_md',
  '课程与培养路径解读': 'curriculum_md'
};

/**
 * 解析 Markdown，按 ## 标题拆成 section
 * @returns {{ sections: Object<string,string>, extra: Array<{title,body}> }}
 */
function parseMarkdownSections(markdown) {
  const lines = String(markdown || '').split('\n');
  const sections = {};
  const extra = [];
  let currentTitle = null;
  let currentBody = [];

  const flush = () => {
    if (!currentTitle) return;
    const col = SECTION_MAP[currentTitle];
    const body = currentBody.join('\n').trim();
    if (col) {
      sections[col] = body;
    } else if (body) {
      extra.push({ title: currentTitle, body });
    }
  };

  for (const line of lines) {
    if (line.startsWith('## ')) {
      flush();
      currentTitle = line.slice(3).trim();
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  flush();

  return { sections, extra };
}

function generateSlug(name, districtName) {
  const a = String(districtName || '').trim();
  const b = String(name || '').trim();
  return `${a}-${b}`;
}

function cleanTierTag(text) {
  if (!text) return '';
  return text.replace(/^(?:\*\*梯队标签：\*\*[^\n]*\n\s*)?该校(?:属于|是)[^\n]*\n\s*/u, '');
}

function schoolToRow(school, oldIdToSlug) {
  const contentPath = school.contentFile
    ? path.join(process.cwd(), school.contentFile)
    : path.join(process.cwd(), 'content', 'schools', `${school.id}.md`);
  let overview = '';
  try {
    const markdown = fs.readFileSync(contentPath, 'utf8');
    overview = parseMarkdownSections(markdown).sections.overview_md || '';
  } catch {
    // 文件不存在时 overview 为空
  }

  const relatedSchools = (school.related_schools || []).map(
    (oldId) => (oldIdToSlug && oldIdToSlug.get(oldId)) || oldId
  );

  return {
    slug: generateSlug(school.name, school.districtName),
    name: school.name,
    district_name: school.districtName,
    school_stage_label: school.schoolStageLabel || '',
    school_property_label: school.schoolPropertyLabel || '',
    tier: school.tier || '',
    "group": school.group || '',
    address: school.address || '',
    phone: school.phone || '',
    website: school.website || '',
    founding_year: school.foundingYear || null,
    is_boarding: !!school.isBoarding,
    is_international: !!school.isInternational,
    image: school.image || '',
    description: cleanTierTag(overview || school.description || ''),
    achievements: school.achievements || '',
    admission_notes: school.admissionNotes || '',
    admission_info: {
      code: school.admissionCode || '',
      methods: school.admissionMethods || [],
      routes: school.admissionRoutes || []
    },
    profile_depth: school.profileDepth || 'foundation',
    features: school.features || [],
    related_schools: relatedSchools
  };
}

async function migrateSchools(schools, oldIdToSlug) {
  const client = getServiceClient();
  let successCount = 0;
  let errorCount = 0;

  // 先清空表（无 slug 列无法 upsert，改为全量替换）
  if (!isDryRun) {
    const { error: delError } = await client.from(SCHOOLS_TABLE).delete().neq('id', 0);
    if (delError) {
      console.error('清空表失败:', delError.message);
      return { successCount: 0, errorCount: schools.length };
    }
  }

  for (let i = 0; i < schools.length; i += BATCH_SIZE) {
    const batch = schools.slice(i, i + BATCH_SIZE);
    const rows = batch.map((s) => schoolToRow(s, oldIdToSlug));

    if (isDryRun) {
      console.log(`[dry-run] 学校批次 ${Math.floor(i / BATCH_SIZE) + 1}: ${rows.length} 条`);
      successCount += rows.length;
      continue;
    }

    const { error } = await client
      .from(SCHOOLS_TABLE)
      .insert(rows);

    if (error) {
      console.error(`学校批次 ${Math.floor(i / BATCH_SIZE) + 1} 失败:`, error.message);
      errorCount += rows.length;
    } else {
      successCount += rows.length;
      console.log(`学校批次 ${Math.floor(i / BATCH_SIZE) + 1}: ${rows.length} 条写入成功`);
    }
  }

  return { successCount, errorCount };
}

async function verifyMigration(schools) {
  const client = getServiceClient();

  const { count, error: countError } = await client
    .from(SCHOOLS_TABLE)
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('验证失败:', countError.message);
    return;
  }

  console.log('\n=== 验证 ===');
  console.log(`本地学校数: ${schools.length}`);
  console.log(`Supabase 学校数: ${count}`);
  console.log(count === schools.length ? '✓ 数量一致' : '✗ 数量不一致');

  // 抽样校验 description 列
  const samples = [schools[0], schools[Math.floor(schools.length / 2)], schools[schools.length - 1]];
  for (const sample of samples) {
    const { data, error } = await client
      .from(SCHOOLS_TABLE)
      .select('name, slug, description, school_property_label, tier')
      .eq('name', sample.name)
      .limit(1)
      .single();

    if (error) {
      console.error(`抽样验证失败 [${sample.id}]:`, error.message);
      continue;
    }

    const nameMatch = data.name === sample.name;
    const descOk = (data.description || '').length > 0;
    console.log(`抽样 [${sample.id}]: slug=${data.slug} name=${nameMatch ? '✓' : '✗'} description=${descOk ? '✓' : '空'} type=${data.school_property_label} tier=${data.tier}`);
  }
}

async function main() {
  console.log(`\n=== 学校数据迁移到 Supabase ${isDryRun ? '(dry-run)' : ''} ===\n`);

  if (!isSupabaseConfigured()) {
    console.error('Supabase 未配置，请检查环境变量');
    process.exit(1);
  }

  const schoolsPath = path.join(process.cwd(), 'data', 'schools.json');
  const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));
  const arr = Array.isArray(schools) ? schools : schools.schools;
  console.log(`本地学校数据: ${arr.length} 条`);

  // 构建 旧 id → 新 slug 映射（related_schools 引用转换用）
  const oldIdToSlug = new Map();
  for (const s of arr) {
    oldIdToSlug.set(s.id, generateSlug(s.name, s.districtName));
  }

  // 迁移学校数据
  console.log('\n--- 迁移学校数据 ---');
  const result = await migrateSchools(arr, oldIdToSlug);
  console.log(`学校数据: ${result.successCount} 成功, ${result.errorCount} 失败`);

  if (!isDryRun) {
    await verifyMigration(arr);
  }

  console.log('\n=== 迁移完成 ===\n');
}

main().catch((err) => {
  console.error('迁移失败:', err);
  process.exit(1);
});
