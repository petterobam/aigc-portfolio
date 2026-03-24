#!/usr/bin/env node

/**
 * 数据库迁移脚本 - 添加 last_accessed 字段
 *
 * 功能：
 * 1. 添加 last_accessed 字段到 metadata 表
 * 2. 初始化 last_accessed 值（使用 updated_at 作为初始值）
 * 3. 更新 access-tracker.js，在更新访问统计时同时更新 last_accessed
 * 4. 更新 optimize.js，使用 last_accessed 而不是 updated_at
 *
 * 使用方法：
 * node scripts/migrate-last-accessed.js
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// 引入共享配置
const CONFIG = require('./config.js');
const { DB_CONFIG } = CONFIG;

const DB_PATH = DB_CONFIG.dbPath;

console.log('============================================================');
console.log('  数据库迁移 - 添加 last_accessed 字段');
console.log('============================================================\n');

// 打开数据库
const db = new Database(DB_PATH);

// 1. 检查字段是否已存在
console.log('📊 检查字段是否已存在...');
const tableInfo = db.prepare('PRAGMA table_info(metadata)').all();
const hasLastAccessed = tableInfo.some(col => col.name === 'last_accessed');

if (hasLastAccessed) {
  console.log('✅ last_accessed 字段已存在，跳过迁移\n');
  db.close();
  process.exit(0);
}

console.log('⚠️  last_accessed 字段不存在，开始迁移\n');

// 2. 添加字段
console.log('📝 添加 last_accessed 字段...');
db.prepare(`
  ALTER TABLE metadata
  ADD COLUMN last_accessed DATETIME
`).run();
console.log('✅ 字段添加成功\n');

// 3. 初始化字段值
console.log('📝 初始化 last_accessed 值（使用 updated_at 作为初始值）...');
const result = db.prepare(`
  UPDATE metadata
  SET last_accessed = updated_at
  WHERE last_accessed IS NULL
`).run();
console.log(`✅ 已更新 ${result.changes} 条记录\n`);

// 4. 验证
console.log('📊 验证迁移结果...');
const check = db.prepare(`
  SELECT
    COUNT(*) as total,
    COUNT(last_accessed) as with_last_accessed,
    AVG(julianday('now') - julianday(last_accessed)) as avg_days_since_access
  FROM metadata
  WHERE category != 'archived'
`).get();

console.log(`✅ 验证结果:`);
console.log(`   - 总活跃记忆数: ${check.total}`);
console.log(`   - 有 last_accessed 的记忆数: ${check.with_last_accessed}`);
console.log(`   - 平均天数（未访问）: ${check.avg_days_since_access.toFixed(2)} 天\n`);

// 5. 预览需要更新的脚本
console.log('📝 需要更新的脚本:');
console.log('   1. access-tracker.js - 在更新访问统计时同时更新 last_accessed');
console.log('   2. optimize.js - 使用 last_accessed 而不是 updated_at\n');

// 6. 备份原始脚本
console.log('📦 备份原始脚本...');
const backupDir = path.join(__dirname, '.backup');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const backupAccessTracker = path.join(backupDir, 'access-tracker.js.backup');
const backupOptimize = path.join(backupDir, 'optimize.js.backup');

if (fs.existsSync(backupAccessTracker)) {
  console.log('   ⚠️  access-tracker.js.backup 已存在，跳过备份');
} else {
  fs.copyFileSync(path.join(__dirname, 'access-tracker.js'), backupAccessTracker);
  console.log('   ✅ access-tracker.js 已备份');
}

if (fs.existsSync(backupOptimize)) {
  console.log('   ⚠️  optimize.js.backup 已存在，跳过备份');
} else {
  fs.copyFileSync(path.join(__dirname, 'optimize.js'), backupOptimize);
  console.log('   ✅ optimize.js 已备份');
}

console.log('');

// 7. 询问是否自动更新脚本
console.log('============================================================');
console.log('  迁移完成');
console.log('============================================================\n');
console.log('✅ 数据库迁移完成');
console.log('📝 下一步操作:\n');
console.log('   选项 1: 自动更新脚本（推荐）');
console.log('     node scripts/migrate-last-accessed.js --auto\n');
console.log('   选项 2: 手动更新脚本');
console.log('     1. 编辑 access-tracker.js，在更新 access_count 时同时更新 last_accessed');
console.log('     2. 编辑 optimize.js，使用 last_accessed 而不是 updated_at\n');
console.log('   选项 3: 回滚迁移');
console.log('     node scripts/migrate-last-accessed.js --rollback\n');

db.close();

// 检查命令行参数
const args = process.argv.slice(2);
if (args.includes('--auto')) {
  console.log('\n🤖 自动更新脚本...\n');

  // 更新 access-tracker.js
  const accessTrackerPath = path.join(__dirname, 'access-tracker.js');
  let accessTrackerContent = fs.readFileSync(accessTrackerPath, 'utf-8');

  // 查找并替换更新语句
  const accessTrackerOldPattern = /db\.prepare\(`\s*UPDATE metadata\s*SET access_count = \?\s*WHERE id = \?\s*`\)\.run\(heuristicAccessCount, memory\.id\);/;
  const accessTrackerNewSnippet = `db.prepare(\`
    UPDATE metadata
    SET access_count = ?,
        last_accessed = ?
    WHERE id = ?
  \`)\`.run(heuristicAccessCount, now, memory.id);`;

  if (accessTrackerOldPattern.test(accessTrackerContent)) {
    accessTrackerContent = accessTrackerContent.replace(
      accessTrackerOldPattern,
      accessTrackerNewSnippet
    );
    fs.writeFileSync(accessTrackerPath, accessTrackerContent, 'utf-8');
    console.log('✅ access-tracker.js 已更新');
  } else {
    console.log('⚠️  access-tracker.js 更新失败（未找到目标代码）');
  }

  // 更新 optimize.js
  const optimizePath = path.join(__dirname, 'optimize.js');
  let optimizeContent = fs.readFileSync(optimizePath, 'utf-8');

  // 替换 days_since_last_access 的计算
  const optimizeOldPattern = /row\.days_since_last_access = Math\.floor\(\(now - updatedAt\) \/ \(1000 \* 60 \* 60 \* 24\)\);/;
  const optimizeNewSnippet = `row.days_since_last_access = row.last_accessed
      ? Math.floor((now - new Date(row.last_accessed)) / (1000 * 60 * 60 * 24))
      : row.days_since_last_access;`;

  if (optimizeOldPattern.test(optimizeContent)) {
    optimizeContent = optimizeContent.replace(
      optimizeOldPattern,
      optimizeNewSnippet
    );
    fs.writeFileSync(optimizePath, optimizeContent, 'utf-8');
    console.log('✅ optimize.js 已更新');
  } else {
    console.log('⚠️  optimize.js 更新失败（未找到目标代码）');
  }

  // 更新 SQL 查询
  const sqlOldPattern = /SELECT\s+\*?\s+FROM\s+metadata\s+WHERE\s+category\s+!=\s+['"]archived['"]/;
  const sqlNewSnippet = `SELECT
      id,
      title,
      category,
      tags,
      created_at,
      updated_at,
      access_count,
      importance,
      last_accessed
    FROM metadata
    WHERE category != 'archived'`;

  if (sqlOldPattern.test(optimizeContent)) {
    optimizeContent = optimizeContent.replace(
      sqlOldPattern,
      sqlNewSnippet
    );
    fs.writeFileSync(optimizePath, optimizeContent, 'utf-8');
    console.log('✅ optimize.js SQL 查询已更新');
  } else {
    console.log('⚠️  optimize.js SQL 查询更新失败（未找到目标代码）');
  }

  console.log('\n✅ 所有脚本已更新\n');
  console.log('📝 验证步骤:');
  console.log('   1. 运行 access-tracker.js，验证 last_accessed 是否正确更新');
  console.log('   2. 运行 optimize.js，验证归档逻辑是否正确执行\n');
} else if (args.includes('--rollback')) {
  console.log('\n🔄 回滚迁移...\n');

  // 删除字段（SQLite 不支持 DROP COLUMN，需要重建表）
  console.log('⚠️  SQLite 不支持 DROP COLUMN，需要手动回滚');
  console.log('   1. 恢复备份文件:');
  console.log('      cp .backup/access-tracker.js.backup access-tracker.js');
  console.log('      cp .backup/optimize.js.backup optimize.js');
  console.log('   2. 手动删除 last_accessed 字段（需要重建表）\n');
  console.log('💡 建议：暂时保留 last_accessed 字段，评估效果后再决定是否回滚\n');
}

console.log('============================================================');
console.log('  完成');
console.log('============================================================');
