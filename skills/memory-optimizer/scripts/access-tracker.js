#!/usr/bin/env node

/**
 * 记忆访问追踪系统（启发式方法）
 *
 * 功能：基于启发式规则模拟真实的访问统计，更新 access_count 和 access_log
 *
 * 启发式规则：
 * 1. 基于类别权重：breakthrough > creation > task > general > operation
 * 2. 基于时间衰减：越新的记忆访问频率越高
 * 3. 基于内容质量：内容越长的记忆可能被更频繁访问
 * 4. 基于标签：protected 标签的记忆是高访问频率的记忆
 * 5. 随机扰动：加入一定随机性，模拟真实访问的波动
 *
 * 使用方法：
 * node skills/memory-optimizer/scripts/access-tracker.js
 */

const Database = require('better-sqlite3');
const path = require('path');

// 引入共享配置
const CONFIG = require('./config.js');
const { DB_CONFIG, ACCESS_TRACKER_CONFIG } = CONFIG;

const DB_PATH = DB_CONFIG.dbPath;

// 打开数据库
const db = new Database(DB_PATH);

console.log('============================================================');
console.log('  记忆访问追踪系统');
console.log('============================================================\n');

// 类别权重（从配置文件读取）
const CATEGORY_WEIGHTS = ACCESS_TRACKER_CONFIG.categoryAccessBase;

// 时间衰减因子（天数）
const TIME_DECAY_DAYS = 30;

// 随机扰动范围（从配置文件读取）
const RANDOM_NOISE = ACCESS_TRACKER_CONFIG.randomFluctuation;

// 获取当前时间
const now = new Date();

// 查询所有记忆
console.log('📊 查询所有记忆...');
const memories = db.prepare(`
  SELECT
    id,
    title,
    category,
    tags,
    created_at,
    updated_at,
    access_count,
    importance
  FROM metadata
  WHERE category != 'archived'
`).all();

console.log(`找到 ${memories.length} 条活跃记忆\n`);

// 计算每个记忆的启发式访问统计
console.log('📊 计算启发式访问统计...');
const updates = [];

for (const memory of memories) {
  // 1. 计算时间因子（越新的记忆访问频率越高）
  const createdAt = new Date(memory.created_at);
  const ageDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
  const timeFactor = Math.max(0, 1 - (ageDays / TIME_DECAY_DAYS));

  // 2. 获取类别权重（从配置文件读取）
  const categoryWeight = CATEGORY_WEIGHTS[memory.category] || 1.0;

  // 3. 检查是否有 protected 标签
  const tags = JSON.parse(memory.tags || '[]');
  const hasProtectedTag = tags.includes('protected');
  const protectedFactor = hasProtectedTag ? ACCESS_TRACKER_CONFIG.protectedTagWeight : 1.0;

  // 4. 计算内容长度因子（需要查询 content 表）
  const contentRow = db.prepare(`
    SELECT length(content) as content_length
    FROM content
    WHERE metadata_id = ?
  `).get(memory.id);

  const contentLength = contentRow ? contentRow.content_length : 0;
  const lengthFactor = Math.min(1.0, Math.log10(contentLength + 1) / 4); // 归一化到 0-1

  // 5. 基础访问次数（基于重要性）
  const baseAccessCount = (memory.importance || 1) * 5;

  // 6. 计算启发式访问次数
  let heuristicAccessCount = baseAccessCount
    * categoryWeight
    * (ACCESS_TRACKER_CONFIG.timeDecayWeight + (1 - ACCESS_TRACKER_CONFIG.timeDecayWeight) * timeFactor)  // 时间因子权重
    * protectedFactor
    * (1 - ACCESS_TRACKER_CONFIG.contentQualityWeight + ACCESS_TRACKER_CONFIG.contentQualityWeight * lengthFactor);  // 长度因子权重

  // 7. 加入随机扰动（±10%，从配置文件读取）
  const randomFactor = 1 + (Math.random() - 0.5) * 2 * RANDOM_NOISE;
  heuristicAccessCount = Math.floor(heuristicAccessCount * randomFactor);

  // 8. 确保访问次数至少为 1（对于重要记忆）
  if (hasProtectedTag || memory.category === 'breakthrough') {
    heuristicAccessCount = Math.max(heuristicAccessCount, 5);
  } else {
    heuristicAccessCount = Math.max(heuristicAccessCount, 1);
  }

  // 记录更新
  if (heuristicAccessCount !== memory.access_count) {
    updates.push({
      id: memory.id,
      title: memory.title,
      category: memory.category,
      old_access_count: memory.access_count,
      new_access_count: heuristicAccessCount,
      has_protected: hasProtectedTag
    });
  }
}

console.log(`计算完成，发现 ${updates.length} 条记忆需要更新\n`);

// 更新数据库
if (updates.length > 0) {
  console.log('📊 更新数据库...');
  const updateStmt = db.prepare(`
    UPDATE metadata
    SET access_count = ?,
        last_accessed = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const insertLogStmt = db.prepare(`
    INSERT INTO access_log (memory_id, access_at, access_type)
    VALUES (?, CURRENT_TIMESTAMP, 'heuristic')
  `);

  for (const update of updates) {
    // 更新 access_count
    updateStmt.run(update.new_access_count, update.id);

    // 插入一条启发式访问日志
    insertLogStmt.run(update.id);
  }

  console.log(`✅ 更新了 ${updates.length} 条记忆\n`);

  // 显示更新详情
  console.log('📊 更新详情:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ID  | 类别         | 标题                              | 旧值 | 新值');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const update of updates) {
    const category = update.category.padEnd(12);
    const title = update.title.substring(0, 30).padEnd(32);
    const oldCount = String(update.old_access_count).padStart(3);
    const newCount = String(update.new_access_count).padStart(3);
    const protectedMark = update.has_protected ? '🔒' : '  ';

    console.log(`${String(update.id).padEnd(3)} | ${category} | ${title} | ${oldCount} | ${newCount} ${protectedMark}`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
} else {
  console.log('✅ 所有记忆的访问统计已经是最新状态\n');
}

// 统计信息
console.log('\n============================================================');
console.log('  统计信息');
console.log('============================================================\n');

const stats = db.prepare(`
  SELECT
    category,
    COUNT(*) as count,
    AVG(access_count) as avg_access,
    MAX(access_count) as max_access
  FROM metadata
  WHERE category != 'archived'
  GROUP BY category
  ORDER BY avg_access DESC
`).all();

console.log('按类别的访问统计:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('类别         | 数量 | 平均访问次数 | 最大访问次数');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

for (const stat of stats) {
  const category = stat.category.padEnd(12);
  const count = String(stat.count).padStart(4);
  const avgAccess = stat.avg_access.toFixed(1).padStart(10);
  const maxAccess = String(stat.max_access).padStart(10);

  console.log(`${category} | ${count} | ${avgAccess} | ${maxAccess}`);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 查询 access_log 总数
const accessLogCount = db.prepare('SELECT COUNT(*) as count FROM access_log').get();
console.log(`\naccess_log 表记录数: ${accessLogCount.count}`);

// 查询 top 5 最常访问的记忆
console.log('\nTop 5 最常访问的记忆:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const topMemories = db.prepare(`
  SELECT
    id,
    title,
    category,
    access_count
  FROM metadata
  WHERE category != 'archived'
  ORDER BY access_count DESC
  LIMIT 5
`).all();

for (const memory of topMemories) {
  const title = memory.title.substring(0, 40).padEnd(42);
  const category = memory.category.padEnd(12);
  const count = String(memory.access_count).padStart(3);

  console.log(`${String(memory.id).padEnd(3)} | ${title} | ${category} | ${count}`);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n============================================================');
console.log('  访问追踪系统执行完成');
console.log('============================================================');

// 关闭数据库
db.close();
