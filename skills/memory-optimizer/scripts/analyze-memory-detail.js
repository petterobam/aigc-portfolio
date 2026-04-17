const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/memory.db');

const db = new sqlite3.Database(DB_PATH);

// 查询所有记忆（包括已归档）
db.all('SELECT id, category, title, importance_score, access_count, last_accessed, created_at, tags, archived FROM memories ORDER BY importance_score DESC', [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    process.exit(1);
  }

  console.log('=== 记忆库详细分析 ===\n');

  // 分组统计
  const active = rows.filter(r => !r.archived);
  const archived = rows.filter(r => r.archived);

  console.log('活跃记忆（重要性评分从高到低）：');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  active.forEach((row, i) => {
    const daysSinceAccess = row.last_accessed ? Math.round((Date.now() - new Date(row.last_accessed)) / (1000 * 60 * 60 * 24)) : 'N/A';
    const ageDays = Math.round((Date.now() - new Date(row.created_at)) / (1000 * 60 * 60 * 24));
    console.log(`${i+1}. [${row.category}] ${row.title}`);
    console.log(`   评分: ${row.importance_score.toFixed(2)} | 访问: ${row.access_count}次 | 距上次访问: ${daysSinceAccess}天 | 生成至今: ${ageDays}天`);
    console.log(`   标签: ${row.tags || '无'} | ID: ${row.id}`);
    console.log('');
  });

  console.log('\n已归档记忆（按评分从高到低）：');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  archived.forEach((row, i) => {
    const daysSinceAccess = row.last_accessed ? Math.round((Date.now() - new Date(row.last_accessed)) / (1000 * 60 * 60 * 24)) : 'N/A';
    const ageDays = Math.round((Date.now() - new Date(row.created_at)) / (1000 * 60 * 60 * 24));
    console.log(`${i+1}. [${row.category}] ${row.title}`);
    console.log(`   评分: ${row.importance_score.toFixed(2)} | 访问: ${row.access_count}次 | 距上次访问: ${daysSinceAccess}天 | 生成至今: ${ageDays}天`);
    console.log(`   标签: ${row.tags || '无'} | ID: ${row.id}`);
    console.log('');
  });

  db.close();
});
