#!/usr/bin/env node

/**
 * 历史评分分析脚本
 *
 * 目的：分析历史报告中的评分变化，找出评分下降的原因
 */

const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, '..', 'reports');

console.log('============================================================');
console.log('  历史评分分析脚本');
console.log('============================================================\n');

// 读取所有历史报告
const reportFiles = fs.readdirSync(reportsDir)
  .filter(file => file.endsWith('-report.json'))
  .sort();

console.log(`找到 ${reportFiles.length} 个历史报告\n`);

// 分析每个报告的评分
const history = [];

reportFiles.forEach(file => {
  const filePath = path.join(reportsDir, file);
  const report = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const timestamp = report.timestamp;
  const importanceUpdated = report.stats.importanceUpdated || 0;
  const config = report.config;

  history.push({
    file,
    timestamp,
    importanceUpdated,
    config: {
      scoreUpdateThreshold: config.scoreUpdateThreshold,
      scoreWeights: config.scoreWeights,
      categoryWeights: config.categoryWeights,
      contentQualitySegments: config.contentQualitySegments,
      titleQuality: config.titleQuality
    }
  });
});

// 打印历史评分更新记录
console.log('='.repeat(100));
console.log('历史评分更新记录');
console.log('='.repeat(100));

let lastConfig = null;
let configChanged = false;

history.forEach((item, index) => {
  const date = new Date(item.timestamp);
  const formattedDate = date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  console.log(`\n[${index + 1}] ${item.file}`);
  console.log(`  时间: ${formattedDate}`);
  console.log(`  评分更新数: ${item.importanceUpdated}`);

  // 检查配置是否变化
  if (lastConfig) {
    const configChangedScoreWeights = JSON.stringify(item.config.scoreWeights) !== JSON.stringify(lastConfig.scoreWeights);
    const configChangedCategoryWeights = JSON.stringify(item.config.categoryWeights) !== JSON.stringify(lastConfig.categoryWeights);
    const configChangedThreshold = item.config.scoreUpdateThreshold !== lastConfig.scoreUpdateThreshold;

    if (configChangedScoreWeights || configChangedCategoryWeights || configChangedThreshold) {
      console.log(`  ⚠️  配置发生变化！`);
      if (configChangedScoreWeights) {
        console.log(`      scoreWeights: ${JSON.stringify(lastConfig.scoreWeights)} → ${JSON.stringify(item.config.scoreWeights)}`);
      }
      if (configChangedCategoryWeights) {
        console.log(`      categoryWeights: ${JSON.stringify(lastConfig.categoryWeights)} → ${JSON.stringify(item.config.categoryWeights)}`);
      }
      if (configChangedThreshold) {
        console.log(`      scoreUpdateThreshold: ${lastConfig.scoreUpdateThreshold} → ${item.config.scoreUpdateThreshold}`);
      }
      configChanged = true;
    }
  }

  lastConfig = item.config;
});

console.log('\n' + '='.repeat(100));
console.log('关键发现');
console.log('='.repeat(100));

if (configChanged) {
  console.log('\n✅ 发现配置变化！');
  console.log('   配置变化可能导致了评分更新。');
} else {
  console.log('\n✅ 配置没有变化。');
  console.log('   评分下降不是由配置变化引起的。');
}

// 查找评分更新的时间点
console.log('\n' + '='.repeat(100));
console.log('评分更新时间点');
console.log('='.repeat(100));

history.filter(item => item.importanceUpdated > 0).forEach((item, index) => {
  const date = new Date(item.timestamp);
  const formattedDate = date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  console.log(`\n${index + 1}. ${formattedDate}`);
  console.log(`   更新了 ${item.importanceUpdated} 条记忆的评分`);
  console.log(`   报告文件: ${item.file}`);
});

console.log('\n' + '='.repeat(100));
console.log('结论');
console.log('='.repeat(100));

const scoreUpdateItems = history.filter(item => item.importanceUpdated > 0);
if (scoreUpdateItems.length > 0) {
  console.log(`\n✅ 找到 ${scoreUpdateItems.length} 次评分更新。`);
  console.log('\n   最新的评分更新时间:');
  const latest = scoreUpdateItems[scoreUpdateItems.length - 1];
  const date = new Date(latest.timestamp);
  const formattedDate = date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  console.log(`   ${formattedDate} (${latest.file})`);
  console.log(`   更新了 ${latest.importanceUpdated} 条记忆的评分`);

  if (configChanged) {
    console.log('\n   可能的原因：');
    console.log('   1. 配置参数发生变化，导致评分重新计算');
    console.log('   2. 评分算法或权重调整');
    console.log('   3. 需要检查具体的配置变化内容');
  } else {
    console.log('\n   可能的原因：');
    console.log('   1. 记忆的 age_days 或 days_since_last_access 随时间变化');
    console.log('   2. 时效性权重（recency）导致评分随时间自然下降');
    console.log('   3. 访问频率权重（accessFrequency）随时间衰减');
  }
} else {
  console.log('\nℹ️  没有找到评分更新的记录。');
  console.log('   这可能说明：');
  console.log('   1. 所有报告都没有评分更新（不太可能）');
  console.log('   2. 报告中缺少 importanceUpdated 字段');
  console.log('   3. 需要检查报告数据结构');
}
