const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/memory.db');

const db = new sqlite3.Database(DB_PATH);

// 查询所有活跃记忆
db.all('SELECT id, category, title, importance_score, access_count, last_accessed, created_at FROM memories WHERE archived = 0 ORDER BY importance_score ASC', [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    process.exit(1);
  }

  console.log('=== 归档策略分析 ===\n');
  console.log('配置参数:');
  console.log('  - archiveAfterDays: 14（超过 14 天未访问则归档）');
  console.log('  - minImportance: 1.2（重要性低于 1.2 才会被归档）');
  console.log('  - 归档条件: combined_days >= 14 AND importance_score < 1.2');
  console.log('  - combined_days = max(age_days, days_since_last_access)\n');

  console.log('活跃记忆归档风险评估（按评分从低到高，风险从高到低）：');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const now = new Date();

  rows.forEach((row, i) => {
    const createdAt = new Date(row.created_at);
    const lastAccessed = row.last_accessed ? new Date(row.last_accessed) : null;

    const ageDays = Math.round((now - createdAt) / (1000 * 60 * 60 * 24));
    const daysSinceAccess = lastAccessed ? Math.round((now - lastAccessed) / (1000 * 60 * 60 * 24)) : ageDays;
    const combinedDays = Math.max(ageDays, daysSinceAccess);

    // 评估归档风险
    const meetsTimeThreshold = combinedDays >= 14;
    const meetsScoreThreshold = row.importance_score < 1.2;
    const shouldArchive = meetsTimeThreshold && meetsScoreThreshold;

    console.log(`${i+1}. [${row.category}] ${row.title}`);
    console.log(`   评分: ${row.importance_score.toFixed(2)} | 访问: ${row.access_count}次`);
    console.log(`   生成至今: ${ageDays}天 | 距上次访问: ${daysSinceAccess}天 | combined_days: ${combinedDays}天`);
    console.log(`   时间阈值: ${meetsTimeThreshold ? '✅ 达标' : '❌ 未达标'} (>=14天)`);
    console.log(`   评分阈值: ${meetsScoreThreshold ? '✅ 达标' : '❌ 未达标'} (<1.2)`);
    console.log(`   归档风险: ${shouldArchive ? '🚨 高（应该被归档）' : meetsTimeThreshold ? '⚠️ 中（达标时间但评分高）' : '✅ 低（未达标）'}`);
    console.log('');
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('归档策略评估:');

  // 统计分析
  const shouldArchiveCount = rows.filter(r => {
    const ageDays = Math.round((now - new Date(r.created_at)) / (1000 * 60 * 60 * 24));
    const lastAccessed = r.last_accessed ? new Date(r.last_accessed) : null;
    const daysSinceAccess = lastAccessed ? Math.round((now - lastAccessed) / (1000 * 60 * 60 * 24)) : ageDays;
    const combinedDays = Math.max(ageDays, daysSinceAccess);
    return combinedDays >= 14 && r.importance_score < 1.2;
  }).length;

  const meetsTimeOnly = rows.filter(r => {
    const ageDays = Math.round((now - new Date(r.created_at)) / (1000 * 60 * 60 * 24));
    const lastAccessed = r.last_accessed ? new Date(r.last_accessed) : null;
    const daysSinceAccess = lastAccessed ? Math.round((now - lastAccessed) / (1000 * 60 * 60 * 24)) : ageDays;
    const combinedDays = Math.max(ageDays, daysSinceAccess);
    return combinedDays >= 14 && r.importance_score >= 1.2;
  }).length;

  const scoreTooLow = rows.filter(r => r.importance_score < 1.2).length;
  const maxScore = Math.max(...rows.map(r => r.importance_score));
  const minScore = Math.min(...rows.map(r => r.importance_score));

  console.log(`  - 应该归档的记忆: ${shouldArchiveCount} 条`);
  console.log(`  - 仅达到时间阈值（但评分高）: ${meetsTimeOnly} 条`);
  console.log(`  - 评分低于 1.2 的记忆: ${scoreTooLow} 条`);
  console.log(`  - 评分范围: ${minScore.toFixed(2)} - ${maxScore.toFixed(2)}`);

  // 归档策略建议
  console.log('\n归档策略建议:');
  if (shouldArchiveCount === 0) {
    console.log('  ✅ 归档策略合理：没有记忆应该被归档');
    if (meetsTimeOnly > 0) {
      console.log('  💡 建议：这些记忆虽然达到时间阈值，但评分较高（>=1.2），说明重要性较高，不予归档是合理的');
    }
  } else {
    console.log(`  🚨 发现问题：有 ${shouldArchiveCount} 条记忆应该被归档，但没有被归档`);
    console.log('  💡 建议：检查归档逻辑是否正常工作');
  }

  if (scoreTooLow === 0) {
    console.log('  ✅ 评分系统正常：没有记忆评分低于 1.2');
  } else {
    console.log(`  ⚠️ 评分系统问题：有 ${scoreTooLow} 条记忆评分低于 1.2，可能需要调整评分权重`);
  }

  db.close();
});
