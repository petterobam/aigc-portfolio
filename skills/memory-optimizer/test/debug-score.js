const sqlite3 = require('better-sqlite3');
const config = require('./scripts/config.js');
const { DB_CONFIG, OPTIMIZE_CONFIG } = config;

const db = sqlite3(DB_CONFIG.dbPath);

// 获取记忆
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

// 计算天数
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

// 测试评分计算（只测试 ID 16）
const memory = rows.find(r => r.id === 16);

console.log('='.repeat(80));
console.log('评分计算调试 - 记忆 ID 16');
console.log('='.repeat(80));
console.log('\n记忆基本信息:');
console.log('  ID:', memory.id);
console.log('  标题:', memory.title);
console.log('  分类:', memory.category);
console.log('  原始评分:', memory.importance);
console.log('  访问次数:', memory.access_count, typeof memory.access_count);
console.log('  年龄（天）:', memory.age_days, typeof memory.age_days);
console.log('  距离上次访问（天）:', memory.days_since_last_access, typeof memory.days_since_last_access);
console.log('  内容长度:', memory.content_length, typeof memory.content_length);

console.log('\n评分权重:');
console.log('  访问频率权重:', OPTIMIZE_CONFIG.scoreWeights.accessFrequency);
console.log('  时效性权重:', OPTIMIZE_CONFIG.scoreWeights.recency);
console.log('  内容质量权重:', OPTIMIZE_CONFIG.scoreWeights.contentQuality);
console.log('  标题质量权重:', OPTIMIZE_CONFIG.scoreWeights.titleQuality);
console.log('  关键词密度权重:', OPTIMIZE_CONFIG.scoreWeights.keywordDensity);

console.log('\n1. 访问频率计算:');
const accessFrequency = memory.access_count / Math.max(1, memory.age_days);
console.log('  公式: access_count / Math.max(1, age_days)');
console.log('  计算: ' + memory.access_count + ' / ' + Math.max(1, memory.age_days) + ' = ' + accessFrequency);
console.log('  结果:', accessFrequency, typeof accessFrequency);

console.log('\n2. 时效性计算:');
const recency = 1 / Math.max(1, memory.days_since_last_access);
console.log('  公式: 1 / Math.max(1, days_since_last_access)');
console.log('  计算: 1 / ' + Math.max(1, memory.days_since_last_access) + ' = ' + recency);
console.log('  结果:', recency, typeof recency);

console.log('\n3. 内容质量计算:');
let contentQuality;
const segments = OPTIMIZE_CONFIG.contentQualitySegments;
console.log('  分段配置:');
for (const segment of segments) {
  const match = memory.content_length < segment.maxLength;
  console.log('    maxLength:', segment.maxLength, 'score:', segment.score, '=>', memory.content_length, '<', segment.maxLength, '=', match);
  if (match) {
    contentQuality = segment.score;
    console.log('      匹配！contentQuality =', contentQuality);
    break;
  }
}
console.log('  最终 contentQuality:', contentQuality, typeof contentQuality);

console.log('\n4. 标题质量计算:');
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
console.log('  标题长度:', titleLength);
console.log('  结果:', titleQuality, typeof titleQuality);

console.log('\n5. 关键词密度计算:');
const keywords = ['爽点', '公式', '总结', '洞察', '突破', '优化', '经验', '教训'];
const contentLower = memory.content.toLowerCase();
const keywordCount = keywords.filter(kw => contentLower.includes(kw)).length;
const keywordDensity = Math.min(1, keywordCount * 0.3);
console.log('  关键词:', keywords);
console.log('  匹配数量:', keywordCount);
console.log('  密度:', keywordDensity, typeof keywordDensity);

console.log('\n6. 分类权重:');
const categoryWeights = OPTIMIZE_CONFIG.categoryWeights;
const categoryWeight = categoryWeights[memory.category] || 1.0;
console.log('  分类:', memory.category);
console.log('  权重:', categoryWeight, typeof categoryWeight);

console.log('\n综合评分计算:');
const weights = OPTIMIZE_CONFIG.scoreWeights;
const baseScore = (accessFrequency * weights.accessFrequency)
                + (recency * weights.recency)
                + (contentQuality * weights.contentQuality)
                + (titleQuality * weights.titleQuality)
                + (keywordDensity * weights.keywordDensity);
console.log('  baseScore = (accessFrequency * weights.accessFrequency)');
console.log('           + (recency * weights.recency)');
console.log('           + (contentQuality * weights.contentQuality)');
console.log('           + (titleQuality * weights.titleQuality)');
console.log('           + (keywordDensity * weights.keywordDensity)');
console.log('  baseScore = (' + accessFrequency + ' * ' + weights.accessFrequency + ')');
console.log('           + (' + recency + ' * ' + weights.recency + ')');
console.log('           + (' + contentQuality + ' * ' + weights.contentQuality + ')');
console.log('           + (' + titleQuality + ' * ' + weights.titleQuality + ')');
console.log('           + (' + keywordDensity + ' * ' + weights.keywordDensity + ')');
console.log('  baseScore = ' + (accessFrequency * weights.accessFrequency));
console.log('           + ' + (recency * weights.recency));
console.log('           + ' + (contentQuality * weights.contentQuality));
console.log('           + ' + (titleQuality * weights.titleQuality));
console.log('           + ' + (keywordDensity * weights.keywordDensity));
console.log('  baseScore = ' + baseScore, typeof baseScore);

console.log('\n最终评分:');
const finalScore = baseScore * categoryWeight;
console.log('  finalScore = baseScore * categoryWeight');
console.log('  finalScore = ' + baseScore + ' * ' + categoryWeight);
console.log('  finalScore = ' + finalScore, typeof finalScore);

console.log('\n归一化到 0-5 范围:');
const normalizedScore = Math.min(5, Math.max(0, finalScore));
console.log('  normalizedScore = Math.min(5, Math.max(0, finalScore))');
console.log('  normalizedScore = ' + normalizedScore, typeof normalizedScore);

console.log('\n' + '='.repeat(80));
console.log('对比 ID 1 的记忆（正常工作的记忆）');
console.log('='.repeat(80));
const memory1 = rows.find(r => r.id === 1);
console.log('\n记忆 ID 1 基本信息:');
console.log('  ID:', memory1.id);
console.log('  标题:', memory1.title);
console.log('  原始评分:', memory1.importance);
console.log('  访问次数:', memory1.access_count);

const accessFrequency1 = memory1.access_count / Math.max(1, memory1.age_days);
const recency1 = 1 / Math.max(1, memory1.days_since_last_access);
let contentQuality1;
for (const segment of segments) {
  if (memory1.content_length < segment.maxLength) {
    contentQuality1 = segment.score;
    break;
  }
}
const baseScore1 = (accessFrequency1 * weights.accessFrequency)
                 + (recency1 * weights.recency)
                 + (contentQuality1 * weights.contentQuality)
                 + (titleQuality * weights.titleQuality)
                 + (keywordDensity * weights.keywordDensity);
const finalScore1 = baseScore1 * categoryWeight;
const normalizedScore1 = Math.min(5, Math.max(0, finalScore1));

console.log('\n记忆 ID 1 评分计算:');
console.log('  accessFrequency:', accessFrequency1);
console.log('  recency:', recency1);
console.log('  contentQuality:', contentQuality1);
console.log('  baseScore:', baseScore1);
console.log('  finalScore:', finalScore1);
console.log('  normalizedScore:', normalizedScore1);

db.close();
