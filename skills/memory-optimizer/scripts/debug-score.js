#!/usr/bin/env node

/**
 * 评分调试脚本
 * 用于检查评分计算的详细信息
 */

const Database = require('better-sqlite3');
const CONFIG = require('./config.js');
const { DB_CONFIG, OPTIMIZE_CONFIG } = CONFIG;

const DB_PATH = DB_CONFIG.dbPath;

const db = new Database(DB_PATH);

// 从 optimize.js 复制评分计算函数
function calculateImportance(memory) {
  const weights = OPTIMIZE_CONFIG.scoreWeights;

  // 1. 访问频率（权重 0.25，降低以适应初始数据）
  const accessFrequency = memory.access_count / Math.max(1, memory.age_days);

  // 2. 时效性（权重 0.20）
  const recency = 1 / Math.max(1, memory.days_since_last_access);

  // 3. 内容质量（权重 0.25，使用配置中的分段）
  let contentQuality;
  const segments = OPTIMIZE_CONFIG.contentQualitySegments;
  for (const segment of segments) {
    if (memory.content_length < segment.maxLength) {
      contentQuality = segment.score;
      break;
    }
  }

  // 4. 标题质量（权重 0.15，使用配置中的阈值）
  const titleLength = memory.title ? memory.title.length : 0;
  const titleConfig = OPTIMIZE_CONFIG.titleQuality;
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

  // 5. 关键词密度（权重 0.10，新增）
  const keywords = ['爽点', '公式', '总结', '洞察', '突破', '优化', '经验', '教训'];
  const contentLower = memory.content.toLowerCase();
  const keywordCount = keywords.filter(kw => contentLower.includes(kw)).length;
  const keywordDensity = Math.min(1, keywordCount * 0.3);  // 每个关键词 +0.3 分，最高 1

  // 6. 分类权重（从配置文件读取）
  const categoryWeights = OPTIMIZE_CONFIG.categoryWeights;
  const categoryWeight = categoryWeights[memory.category] || 1.0;

  // 计算综合评分（总分 5.0）
  const score = (
    Math.min(1, accessFrequency / 10) * weights.accessFrequency * 5 +
    recency * weights.recency * 5 +
    contentQuality * weights.contentQuality * 5 +
    titleQuality * weights.titleQuality * 5 +
    keywordDensity * weights.keywordDensity * 5
  ) * categoryWeight;

  return score;
}

// 查询所有记忆（JOIN content 表获取内容和内容长度）
const memories = db.prepare(`
  SELECT
    m.id, m.title, m.category, m.importance, m.access_count, m.tags,
    CAST(julianday('now') - julianday(m.created_at) AS INTEGER) AS age_days,
    CAST(julianday('now') - julianday(m.last_accessed) AS INTEGER) AS days_since_last_access,
    c.content,
    LENGTH(c.content) AS content_length
  FROM metadata m
  LEFT JOIN content c ON m.id = c.metadata_id
  WHERE m.category != 'archived'
  ORDER BY m.importance ASC
`).all();

console.log('评分调试信息');
console.log('=' .repeat(100));
console.log();
console.log('配置参数:');
console.log(`  scoreUpdateThreshold: ${OPTIMIZE_CONFIG.scoreUpdateThreshold}`);
console.log(`  archiveAfterDays: ${OPTIMIZE_CONFIG.archiveAfterDays}`);
console.log(`  minImportance: ${OPTIMIZE_CONFIG.minImportance}`);
console.log();
console.log('=' .repeat(100));
console.log();

memories.forEach(memory => {
  const newImportance = calculateImportance(memory);
  const oldImportance = memory.importance;
  const importanceDiff = Math.abs(newImportance - oldImportance);

  const willUpdate = importanceDiff > OPTIMIZE_CONFIG.scoreUpdateThreshold;

  console.log(`ID: ${memory.id}`);
  console.log(`  标题: ${memory.title}`);
  console.log(`  类别: ${memory.category}`);
  console.log(`  旧评分: ${oldImportance}`);
  console.log(`  新评分: ${newImportance.toFixed(2)}`);
  console.log(`  差异: ${importanceDiff.toFixed(2)} ${willUpdate ? '(更新)' : '(不更新)'}`);
  console.log(`  访问次数: ${memory.access_count}`);
  console.log(`  年龄: ${memory.age_days} 天`);
  console.log(`  未访问: ${memory.days_since_last_access} 天`);
  console.log(`  内容长度: ${memory.content_length}`);
  console.log();
});

db.close();
