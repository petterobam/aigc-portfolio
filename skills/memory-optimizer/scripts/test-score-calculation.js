#!/usr/bin/env node

/**
 * 测试评分计算和时效性衰减的影响
 */

const Database = require('better-sqlite3');

const DB_PATH = '~/.openclaw/workspace/memory.db';

// 配置（从 config.js 复制）
const OPTIMIZE_CONFIG = {
  scoreUpdateThreshold: 0.2,
  scoreWeights: {
    accessFrequency: 0.3,
    recency: 0.15,
    contentQuality: 0.25,
    titleQuality: 0.15,
    keywordDensity: 0.15
  },
  categoryWeights: {
    breakthrough: 1.5,
    creation: 1.2,
    general: 1,
    operation: 0.8,
    task: 0.9
  },
  titleQuality: {
    idealMin: 10,
    idealMax: 50,
    noTitleScore: 0,
    tooShortScore: 0.3,
    idealScore: 1,
    tooLongScore: 0.6
  },
  contentQualitySegments: [
    {
      maxLength: 200,
      score: 0.2,
      label: "太短"
    },
    {
      maxLength: 500,
      score: 0.5,
      label: "中等"
    },
    {
      maxLength: 1000,
      score: 0.7,
      label: "较长"
    },
    {
      maxLength: null,
      score: 1,
      label: "很长"
    }
  ]
};

const db = new Database(DB_PATH);

function calculateImportance(memory) {
  const weights = OPTIMIZE_CONFIG.scoreWeights;

  // 1. 访问频率（权重 0.3）
  const accessFrequency = memory.access_count / Math.max(1, memory.age_days);

  // 2. 时效性（权重 0.15）
  const recency = 1 / Math.max(1, memory.days_since_last_access);

  // 3. 内容质量（权重 0.25）
  let contentQuality;
  const segments = OPTIMIZE_CONFIG.contentQualitySegments;
  for (const segment of segments) {
    if (segment.maxLength === null || memory.content_length < segment.maxLength) {
      contentQuality = segment.score;
      break;
    }
  }

  // 确保找到匹配的 segment
  if (contentQuality === undefined) {
    contentQuality = 1.0; // 默认值
  }

  // 4. 标题质量（权重 0.15）
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

  // 5. 关键词密度（权重 0.15）
  const keywords = ['爽点', '公式', '总结', '洞察', '突破', '优化', '经验', '教训'];
  const contentLower = memory.content.toLowerCase();
  const keywordCount = keywords.filter(kw => contentLower.includes(kw)).length;
  const keywordDensity = Math.min(1, keywordCount * 0.3);

  // 6. 分类权重
  const categoryWeights = OPTIMIZE_CONFIG.categoryWeights;
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

function getAllMemories() {
  const rows = db.prepare(`
    SELECT
      m.id, m.title, m.category, m.tags, m.importance,
      m.access_count, m.created_at, m.updated_at, m.last_accessed,
      c.content,
      LENGTH(c.content) as content_length
    FROM metadata m
    JOIN content c ON m.id = c.metadata_id
    WHERE m.category != 'archived'
    ORDER BY m.created_at DESC
  `).all();

  const now = new Date();
  rows.forEach(row => {
    const createdAt = new Date(row.created_at);
    const updatedAt = new Date(row.updated_at);

    row.age_days = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    row.days_since_last_access = row.last_accessed
      ? Math.floor((now - new Date(row.last_accessed)) / (1000 * 60 * 60 * 24))
      : row.age_days;

    row.age_days = Math.max(0, row.age_days);
    row.days_since_last_access = Math.max(0, row.days_since_last_access);
  });

  return rows;
}

console.log('============================================================');
console.log('  评分计算和时效性衰减影响测试');
console.log('============================================================\n');

const memories = getAllMemories();

console.log(`找到 ${memories.length} 条记忆\n`);

console.log('当前评分计算结果：\n');
memories.forEach(memory => {
  const newImportance = calculateImportance(memory);
  const oldImportance = memory.importance;
  const importanceDiff = Math.abs(newImportance - oldImportance);

  const weights = OPTIMIZE_CONFIG.scoreWeights;
  const accessFrequency = memory.access_count / Math.max(1, memory.age_days);
  const recency = 1 / Math.max(1, memory.days_since_last_access);
  const recencyContribution = recency * weights.recency;

  console.log(`ID: ${memory.id}`);
  console.log(`  标题: ${memory.title}`);
  console.log(`  类别: ${memory.category}`);
  console.log(`  访问次数: ${memory.access_count}, 年龄: ${memory.age_days} 天, 最后访问: ${memory.days_since_last_access} 天`);
  console.log(`  内容长度: ${memory.content_length}, 标题长度: ${memory.title ? memory.title.length : 0}`);
  console.log(`  旧评分: ${oldImportance}, 新评分: ${newImportance.toFixed(2)}, 变化: ${importanceDiff.toFixed(2)}`);

  // 输出各维度的详细得分
  console.log(`  各维度得分:`);
  console.log(`    1. 访问频率: ${accessFrequency.toFixed(4)} × ${weights.accessFrequency} = ${(accessFrequency * weights.accessFrequency).toFixed(4)}`);
  console.log(`    2. 时效性: ${recency.toFixed(4)} × ${weights.recency} = ${(recency * weights.recency).toFixed(4)}`);
  console.log(`    3. 内容质量: ${contentQuality} × ${weights.contentQuality} = ${(contentQuality * weights.contentQuality).toFixed(4)}`);
  console.log(`    4. 标题质量: ${titleQuality} × ${weights.titleQuality} = ${(titleQuality * weights.titleQuality).toFixed(4)}`);
  console.log(`    5. 关键词密度: ${keywordDensity.toFixed(4)} × ${weights.keywordDensity} = ${(keywordDensity * weights.keywordDensity).toFixed(4)}`);
  console.log(`    基础评分: ${newImportance.toFixed(4)} / ${categoryWeight} = ${(newImportance / categoryWeight).toFixed(4)}`);
  console.log(`    分类权重: ${categoryWeight}`);
  console.log();

  // 只输出前 5 条
  if (memory.id >= 89) {
    break;
  }
});

console.log('============================================================');
console.log('  测试完成');
console.log('============================================================');
