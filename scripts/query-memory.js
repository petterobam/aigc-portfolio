#!/usr/bin/env node

/**
 * 记忆查询工具
 *
 * 功能：提供统一的记忆查询接口
 *
 * 使用方法：
 * node scripts/query-memory.js [options]
 *
 * 选项：
 * --search <query>      搜索记忆（关键词）
 * --category <cat>      按分类查询
 * --recent             查询最近记忆
 * --important          查询重要记忆
 * --stats              显示统计信息
 */

const Database = require('better-sqlite3');
const path = require('path');

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const DB_PATH = path.join(WORKSPACE_DIR, 'memory.db');

// 打开数据库
const db = new Database(DB_PATH);

// 解析命令行参数
const args = process.argv.slice(2);
const params = {};

args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    params[key] = value || true;
  }
});

/**
 * 关键词搜索
 */
function searchByKeyword(query) {
  console.log(`\n🔍 关键词搜索: "${query}"\n`);
  
  const results = db.prepare(`
    SELECT 
      m.id, m.title, m.category, m.tags, m.importance, m.created_at,
      c.summary
    FROM metadata m
    JOIN content c ON m.id = c.metadata_id
    WHERE m.title LIKE ? OR c.content LIKE ? OR m.tags LIKE ?
    ORDER BY m.importance DESC, m.created_at DESC
    LIMIT 20
  `).all(`%${query}%`, `%${query}%`, `%${query}%`);
  
  if (results.length === 0) {
    console.log('未找到匹配的记忆');
    return;
  }
  
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   分类: ${r.category} | 重要程度: ${r.importance}`);
    console.log(`   摘要: ${r.summary}`);
    console.log(`   创建时间: ${r.created_at}`);
    console.log('');
  });
  
  console.log(`共找到 ${results.length} 条记忆`);
}

/**
 * 按分类查询
 */
function searchByCategory(category) {
  console.log(`\n📂 分类查询: "${category}"\n`);
  
  const results = db.prepare(`
    SELECT 
      m.id, m.title, m.importance, m.created_at,
      c.summary
    FROM metadata m
    JOIN content c ON m.id = c.metadata_id
    WHERE m.category = ?
    ORDER BY m.created_at DESC
    LIMIT 20
  `).all(category);
  
  if (results.length === 0) {
    console.log('未找到该分类的记忆');
    return;
  }
  
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   重要程度: ${r.importance}`);
    console.log(`   摘要: ${r.summary}`);
    console.log(`   创建时间: ${r.created_at}`);
    console.log('');
  });
  
  console.log(`共找到 ${results.length} 条记忆`);
}

/**
 * 查询最近记忆
 */
function getRecentMemories() {
  console.log('\n⏰ 最近记忆\n');
  
  const results = db.prepare(`
    SELECT 
      m.id, m.title, m.category, m.importance, m.created_at,
      c.summary
    FROM metadata m
    JOIN content c ON m.id = c.metadata_id
    ORDER BY m.created_at DESC
    LIMIT 10
  `).all();
  
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   分类: ${r.category} | 重要程度: ${r.importance}`);
    console.log(`   摘要: ${r.summary}`);
    console.log(`   创建时间: ${r.created_at}`);
    console.log('');
  });
  
  console.log(`共显示 ${results.length} 条最近记忆`);
}

/**
 * 查询重要记忆
 */
function getImportantMemories() {
  console.log('\n⭐ 重要记忆\n');
  
  const results = db.prepare(`
    SELECT 
      m.id, m.title, m.category, m.importance, m.created_at,
      c.summary
    FROM metadata m
    JOIN content c ON m.id = c.metadata_id
    WHERE m.importance >= 4
    ORDER BY m.importance DESC, m.created_at DESC
    LIMIT 10
  `).all();
  
  if (results.length === 0) {
    console.log('未找到重要记忆');
    return;
  }
  
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   分类: ${r.category} | 重要程度: ${r.importance}`);
    console.log(`   摘要: ${r.summary}`);
    console.log(`   创建时间: ${r.created_at}`);
    console.log('');
  });
  
  console.log(`共显示 ${results.length} 条重要记忆`);
}

/**
 * 显示统计信息
 */
function showStats() {
  console.log('\n📊 记忆系统统计信息\n');
  
  // 总记忆数
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM metadata').get();
  console.log(`总记忆数: ${totalCount.count}`);
  
  // 按分类统计
  const categoryStats = db.prepare(`
    SELECT category, COUNT(*) as count 
    FROM metadata 
    GROUP BY category 
    ORDER BY count DESC
  `).all();
  
  console.log('\n按分类统计:');
  categoryStats.forEach(stat => {
    console.log(`  ${stat.category}: ${stat.count} 条`);
  });
  
  // 按重要程度统计
  const importanceStats = db.prepare(`
    SELECT importance, COUNT(*) as count 
    FROM metadata 
    GROUP BY importance 
    ORDER BY importance DESC
  `).all();
  
  console.log('\n按重要程度统计:');
  importanceStats.forEach(stat => {
    const stars = '⭐'.repeat(stat.importance);
    console.log(`  ${stars} (${stat.importance}): ${stat.count} 条`);
  });
  
  // 最近更新
  const recentUpdate = db.prepare(`
    SELECT title, updated_at 
    FROM metadata 
    ORDER BY updated_at DESC 
    LIMIT 1
  `).get();
  
  if (recentUpdate) {
    console.log(`\n最近更新: ${recentUpdate.title} (${recentUpdate.updated_at})`);
  }
  
  // 数据库大小
  const dbStats = require('fs').statSync(DB_PATH);
  console.log(`\n数据库大小: ${(dbStats.size / 1024).toFixed(2)} KB`);
}

// 主逻辑
console.log('============================================================');
console.log('  记忆查询工具');
console.log('============================================================');

if (params.search) {
  searchByKeyword(params.search);
} else if (params.category) {
  searchByCategory(params.category);
} else if (params.recent) {
  getRecentMemories();
} else if (params.important) {
  getImportantMemories();
} else if (params.stats) {
  showStats();
} else {
  console.log('\n使用方法:');
  console.log('  node scripts/query-memory.js --search <query>      关键词搜索');
  console.log('  node scripts/query-memory.js --category <cat>      按分类查询');
  console.log('  node scripts/query-memory.js --recent              最近记忆');
  console.log('  node scripts/query-memory.js --important           重要记忆');
  console.log('  node scripts/query-memory.js --stats               统计信息');
}

// 关闭数据库
db.close();
