#!/usr/bin/env node

/**
 * 测试脚本：重新计算已归档记忆的评分
 *
 * 用途：测试权重调整对已归档记忆评分的影响
 */

const Database = require('better-sqlite3');
const path = require('path');

// 引入共享配置
const CONFIG = require('./config.js');
const { DB_CONFIG, OPTIMIZE_CONFIG } = CONFIG;

const DB_PATH = DB_CONFIG.dbPath;

// 打开数据库
const db = new Database(DB_PATH);

console.log('============================================================');
console.log('  测试已归档记忆评分');
console.log('============================================================\n');

/**
 * 计算重要性评分
 */
function calculateImportance(memory) {
  const weights = OPTIMIZE_CONFIG.scoreWeights;

  // 1. 访问频率（权重 0.30，已调整）
  const accessFrequency = memory.access_count / Math.max(1, memory.age_days);

  // 2. 时效性（权重 0.15，已调整）
  const recency = 1 / Math.max(1, memory.days_since_last_access);

  // 3. 内容质量（权重 0.25）
  let contentQuality;
  const segments = OPTIMIZE_CONFIG.contentQualitySegments;
  for (const segment of segments) {
    if (memory.content_length < segment.maxLength) {
      contentQuality = segment.score;
      break;
    }
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

// 查询已归档记忆
console.log('📊 查询已归档记忆...\n');

const now = new Date();

const rows = db.prepare(`
  SELECT
    m.id, m.title, m.category, m.importance,
    m.access_count, m.created_at, m.updated_at, m.last_accessed,
    c.content,
    LENGTH(c.content) as content_length
  FROM metadata m
  JOIN content c ON m.id = c.metadata_id
  WHERE m.category = 'archived'
    AND m.importance >= 1.0
  ORDER BY m.importance DESC
`).all();

// 在应用层计算天数
rows.forEach(row => {
  const createdAt = new Date(row.created_at);

  row.age_days = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
  row.days_since_last_access = row.last_accessed
    ? Math.floor((now - new Date(row.last_accessed)) / (1000 * 60 * 60 * 24))
    : row.age_days;

  row.age_days = Math.max(0, row.age_days);
  row.days_since_last_access = Math.max(0, row.days_since_last_access);

  // 计算新评分
  row.new_importance = calculateImportance(row);
  row.importance_diff = row.new_importance - row.importance;
});

// 显示结果
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('ID  | 标题                    | 旧评分 | 新评分 | 变化  | 访问次数 | 内容长度');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

for (const row of rows) {
  const id = String(row.id).padEnd(3);
  const title = row.title.substring(0, 20).padEnd(22);
  const oldScore = String(row.importance.toFixed(2)).padStart(6);
  const newScore = String(row.new_importance.toFixed(2)).padStart(6);
  const diff = (row.importance_diff >= 0 ? '+' : '') + row.importance_diff.toFixed(2);
  const diffStr = diff.padStart(6);
  const accessCount = String(row.access_count).padStart(7);
  const contentLength = String(row.content_length).padStart(8);

  console.log(`${id} | ${title} | ${oldScore} | ${newScore} | ${diffStr} | ${accessCount} | ${contentLength}`);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 统计
const avgOldScore = rows.reduce((sum, r) => sum + r.importance, 0) / rows.length;
const avgNewScore = rows.reduce((sum, r) => sum + r.new_importance, 0) / rows.length;

console.log(`\n📊 统计信息：`);
console.log(`   平均评分（旧）: ${avgOldScore.toFixed(2)}`);
console.log(`   平均评分（新）: ${avgNewScore.toFixed(2)}`);
console.log(`   平均变化: ${(avgNewScore - avgOldScore).toFixed(2)}`);

// 显示详细计算
console.log(`\n📊 详细计算示例（第一条记忆）：`);
const firstRow = rows[0];
const weights = OPTIMIZE_CONFIG.scoreWeights;

console.log(`   记忆: ${firstRow.title}`);
console.log(`   访问次数: ${firstRow.access_count}`);
console.log(`   天数: ${firstRow.age_days}`);
console.log(`   内容长度: ${firstRow.content_length}`);
console.log(`   标题长度: ${firstRow.title.length}`);
console.log('');
console.log(`   评分组件：`);
console.log(`   - 访问频率: ${firstRow.access_count} / ${firstRow.age_days} = ${(firstRow.access_count / Math.max(1, firstRow.age_days)).toFixed(3)} × ${weights.accessFrequency} = ${(firstRow.access_count / Math.max(1, firstRow.age_days) * weights.accessFrequency).toFixed(3)}`);
console.log(`   - 时效性: 1 / ${firstRow.days_since_last_access} = ${(1 / Math.max(1, firstRow.days_since_last_access)).toFixed(3)} × ${weights.recency} = ${(1 / Math.max(1, firstRow.days_since_last_access) * weights.recency).toFixed(3)}`);

let contentQuality;
const segments = OPTIMIZE_CONFIG.contentQualitySegments;
for (const segment of segments) {
  if (firstRow.content_length < segment.maxLength) {
    contentQuality = segment.score;
    break;
  }
}
console.log(`   - 内容质量: ${contentQuality} × ${weights.contentQuality} = ${(contentQuality * weights.contentQuality).toFixed(3)}`);

const titleLength = firstRow.title.length;
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
console.log(`   - 标题质量: ${titleQuality} × ${weights.titleQuality} = ${(titleQuality * weights.titleQuality).toFixed(3)}`);

const keywords = ['爽点', '公式', '总结', '洞察', '突破', '优化', '经验', '教训'];
const contentLower = firstRow.content.toLowerCase();
const keywordCount = keywords.filter(kw => contentLower.includes(kw)).length;
const keywordDensity = Math.min(1, keywordCount * 0.3);
console.log(`   - 关键词密度: ${keywordDensity} × ${weights.keywordDensity} = ${(keywordDensity * weights.keywordDensity).toFixed(3)}`);

const baseScore = (firstRow.access_count / Math.max(1, firstRow.age_days) * weights.accessFrequency)
                + (1 / Math.max(1, firstRow.days_since_last_access) * weights.recency)
                + (contentQuality * weights.contentQuality)
                + (titleQuality * weights.titleQuality)
                + (keywordDensity * weights.keywordDensity);

console.log(`   - 基础评分: ${baseScore.toFixed(3)}`);

const categoryWeights = OPTIMIZE_CONFIG.categoryWeights;
const categoryWeight = categoryWeights[firstRow.category] || 1.0;
console.log(`   - 分类权重: ${categoryWeight}`);
console.log(`   - 最终评分: ${baseScore.toFixed(3)} × ${categoryWeight} = ${(baseScore * categoryWeight).toFixed(3)} → ${(Math.min(5, Math.max(0, baseScore * categoryWeight))).toFixed(2)}`);

// 关闭数据库
db.close();

console.log('\n============================================================');
console.log('  测试完成');
console.log('============================================================');
