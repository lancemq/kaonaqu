'use client';

import schoolsData from '../data/schools.json';

export interface SchoolRecord {
  id: string;
  name: string;
  districtId: string;
  districtName: string;
  schoolStage: 'junior' | 'senior_high' | 'complete';
  schoolStageLabel: string;
  schoolType: string;
  schoolTypeLabel: string;
  tier: string;
  address: string;
  phone: string;
  website: string;
  features: string[];
  tags: string[];
  group?: string;
  admissionRoutes?: Array<{
    high_school_id: string;
    high_school_name: string;
    type: string;
    confidence: string;
  }>;
  admissionCode?: string;
}

export interface RecommendationResult {
  school: SchoolRecord;
  reason: string;
  category: 'official_route' | 'tier_match' | 'group_continuation' | 'same_district';
  matchScore: number; // 0-100
}

// Flatten schools data for quick lookup
const SCHOOLS = schoolsData as SchoolRecord[];
const SCHOOLS_BY_ID = new Map<string, SchoolRecord>();
const JUNIOR_HIGHS = SCHOOLS.filter(s => s.schoolStage === 'junior' || s.schoolStage === 'complete');
const SENIOR_HIGHS = SCHOOLS.filter(s => s.schoolStage === 'senior_high' || s.schoolStage === 'complete');

SCHOOLS.forEach(s => SCHOOLS_BY_ID.set(s.id, s));

// Tier hierarchy mapping (from junior high tier to eligible high school tiers)
const TIER_HIERARCHY: Record<string, string[]> = {
  // Junior high tiers -> eligible high school tiers
  '公办初中': ['市实验性示范性高中', '八大分校', '四校分校', '八大', '四校', '一般高中', '公办完全中学'],
  '民办初中': ['市实验性示范性高中', '八大分校', '四校分校', '八大', '四校', '一般高中', '民办高中', '国际课程'],
  '公办完全中学': ['市实验性示范性高中', '八大分校', '四校分校', '八大', '四校', '一般高中', '公办完全中学'],
  '民办完全中学': ['市实验性示范性高中', '八大分校', '四校分校', '八大', '四校', '一般高中', '民办高中', '国际课程'],
};

// Tier prestige scores for ranking
const TIER_SCORES: Record<string, number> = {
  '四校': 100,
  '八大': 90,
  '市实验性示范性高中': 85,
  '四校分校': 80,
  '八大分校': 75,
  '一般高中': 60,
  '公办完全中学': 55,
  '民办高中': 50,
  '国际课程': 45,
  '公办初中': 0,
  '民办初中': 0,
  '民办完全中学': 0,
};

/**
 * Get eligible high school tiers based on junior high tier
 */
function getEligibleTiers(juniorTier: string): string[] {
  return TIER_HIERARCHY[juniorTier] || TIER_HIERARCHY['公办初中'];
}

/**
 * Build recommendations for a given junior high school
 */
export function buildRecommendations(
  juniorHighId: string,
  preferredDistrict?: string,
  targetTier?: string
): RecommendationResult[] {
  const juniorHigh = SCHOOLS_BY_ID.get(juniorHighId);
  if (!juniorHigh) return [];

  const results: RecommendationResult[] = [];
  const seenIds = new Set<string>();

  // 1. Official admission routes (highest priority)
  if (juniorHigh.admissionRoutes && juniorHigh.admissionRoutes.length > 0) {
    for (const route of juniorHigh.admissionRoutes) {
      if (seenIds.has(route.high_school_id)) continue;
      seenIds.add(route.high_school_id);
      
      const hs = SCHOOLS_BY_ID.get(route.high_school_id);
      if (!hs) continue;

      results.push({
        school: hs,
        reason: `官方对口路线 (${route.type})`,
        category: 'official_route',
        matchScore: 95,
      });
    }
  }

  // 2. Group continuation (same education group)
  if (juniorHigh.group) {
    for (const hs of SENIOR_HIGHS) {
      if (seenIds.has(hs.id)) continue;
      if (hs.group === juniorHigh.group) {
        seenIds.add(hs.id);
        results.push({
          school: hs,
          reason: `同属「${juniorHigh.group}」教育集团，内部升学通道`,
          category: 'group_continuation',
          matchScore: 80,
        });
      }
    }
  }

  // 3. Tier matching
  const eligibleTiers = getEligibleTiers(juniorHigh.tier);
  const targetTiers = targetTier ? [targetTier] : eligibleTiers;
  
  for (const hs of SENIOR_HIGHS) {
    if (seenIds.has(hs.id)) continue;
    if (targetTiers.includes(hs.tier)) {
      let score = TIER_SCORES[hs.tier] || 50;
      
      // Bonus for same district
      if (hs.districtId === juniorHigh.districtId) {
        score += 5;
      }
      
      results.push({
        school: hs,
        reason: `层级匹配：${hs.tier}，适合${juniorHigh.tier}毕业生`,
        category: 'tier_match',
        matchScore: Math.min(score, 90),
      });
    }
  }

  // 4. Same district schools (for geographic convenience)
  if (preferredDistrict === juniorHigh.districtId || !preferredDistrict) {
    for (const hs of SENIOR_HIGHS) {
      if (seenIds.has(hs.id)) continue;
      if (hs.districtId === juniorHigh.districtId) {
        seenIds.add(hs.id);
        results.push({
          school: hs,
          reason: `本区（${juniorHigh.districtName}）学校，就近入学便利`,
          category: 'same_district',
          matchScore: 50,
        });
      }
    }
  }

  // Sort by match score descending
  results.sort((a, b) => b.matchScore - a.matchScore);
  
  return results;
}

/**
 * Get all junior high schools for selector
 */
export function getAllJuniorHighs(): SchoolRecord[] {
  return JUNIOR_HIGHS.sort((a, b) => {
    if (a.districtName !== b.districtName) {
      return a.districtName.localeCompare(b.districtName, 'zh');
    }
    return a.name.localeCompare(b.name, 'zh');
  });
}

/**
 * Get all districts
 */
export function getAllDistricts(): { id: string; name: string }[] {
  const districtMap = new Map<string, string>();
  SCHOOLS.forEach(s => districtMap.set(s.districtId, s.districtName));
  return Array.from(districtMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh'));
}
