#!/usr/bin/env node

/**
 * 测试评分计算
 */

const Database = require('better-sqlite3');
const CONFIG = require('./scripts/config.js');
const { DB_CONFIG } = CONFIG;

const DB_PATH = DB_CONFIG.dbPath;
const db = new Database(DB_PATH);

function calculateImportance(memory) {
  const weights = CONFIG.OPTIMIZE_CONFIG.scoreWeights;

  // 1. 访问频率（权重 0.30）
  const accessFrequency = memory.access_count / Math.max(1, memory.age_days);

  // 2. 时效性（权重 0.15）
  const recency = memory.days_since_last_access
    ? 1 / Math.max(1, memory.days_since_last_access)
    : 1 / Math.max(1, memory.age_days);

  // 3. 内容质量（权重 0.25）
  let contentQuality;
  const segments = CONFIG.OPTIMIZE_CONFIG.contentQualitySegments;
  for (const segment of segments) {
    if (memory.content_length < segment.maxLength) {
      contentQuality = segment.score;
      break;
    }
  }

  // 4. 标题质量（权重 0.15）
  const titleLength = memory.title ? memory.title.length : 0;
  const titleConfig = CONFIG.OPTIMIZE_CONFIG.titleQuality;
  let titleQuality;
  if (titleLength === 0) {
    titleQuality = titleConfig.noTitleScore;
  } else if (titleLength < titleConfig.idealMin) {
    titleQuality = titleConfig.tooShortScore;
  } else if (titleLength <= titleConfig.idealMax) {
    titleQuality = titleConfig.idealScore;
  } else {
    titleQuality = titleConfig.tooLongScore;
  }

  // 5. 关键词密度（权重 0.15）
  const keywords = ['爽点', '公式', '总结', '洞察', '突破', '优化', '经验', '教训'];
  const contentLower = memory.content.toLowerCase();
  const keywordCount = keywords.filter(kw => contentLower.includes(kw)).length;
  const keywordDensity = Math.min(1, keywordCount * 0.3);

  // 6. 分类权重
  const categoryWeights = CONFIG.OPTIMIZE_CONFIG.categoryWeights;
  const categoryWeight = categoryWeights[memory.category] || 1.0;

  // 综合评分
  const baseScore = (accessFrequency * weights.accessFrequency)
                  + (recency * weights.recency)
                  + (contentQuality * weights.contentQuality)
                  + (titleQuality * weights.titleQuality)
                  + (keywordDensity * weights.keywordDensity);

  // 应用分类权重
  const finalScore = baseScore * categoryWeight;

  // 归一化到 0-5 范围
  return Math.min(5, Math.max(0, finalScore));
}

console.log('============================================================');
console.log('  评分计算测试');
console.log('============================================================\n');

const rows = db.prepare(`
  SELECT
    m.id, m.title, m.category, m.importance,
    m.access_count, m.created_at, m.updated_at,
    c.content,
    LENGTH(c.content) as content_length
  FROM metadata m
  JOIN content c ON m.id = c.metadata_id
  WHERE m.category = 'creation'
  ORDER BY m.id
`).all();

const now = new Date();
rows.forEach(row => {
  const createdAt = new Date(row.created_at);

  row.age_days = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
  row.days_since_last_access = row.age_days; // 使用 age_days 作为近似值
  row.age_days = Math.max(0, row.age_days);
  row.days_since_last_access = Math.max(0, row.days_since_last_access);

  const calculatedScore = calculateImportance(row);
  const diff = Math.abs(calculatedScore - row.importance);

  console.log(`ID ${row.id}: ${row.title}`);
  console.log(`  当前评分: ${row.importance}`);
  console.log(`  计算评分: ${calculatedScore.toFixed(2)}`);
  console.log(`  差异: ${diff.toFixed(2)}`);
  console.log(`  访问次数: ${row.access_count}`);
  console.log(`  天数: ${row.age_days}`);
  console.log(`  内容长度: ${row.content_length}`);
  console.log();
});

db.close();
