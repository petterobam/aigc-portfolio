#!/usr/bin/env node

/**
 * 记忆系统数据库模式
 *
 * 功能：创建 SQLite 数据库表和索引
 *
 * 使用方法：
 * node scripts/memory-schema.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const DB_PATH = path.join(WORKSPACE_DIR, 'memory.db');

// 检查数据库是否已存在
const dbExists = fs.existsSync(DB_PATH);

// 创建或打开数据库
const db = new Database(DB_PATH);

console.log('============================================================');
console.log('  记忆系统数据库模式初始化');
console.log('============================================================\n');

if (dbExists) {
  console.log('✅ 数据库已存在:', DB_PATH);
} else {
  console.log('✅ 创建新数据库:', DB_PATH);
}

// 创建 metadata 表
console.log('\n📋 创建 metadata 表...');
db.exec(`
  CREATE TABLE IF NOT EXISTS metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_path TEXT,
    content_hash TEXT UNIQUE,
    importance INTEGER DEFAULT 1,
    access_count INTEGER DEFAULT 0
  )
`);

// 创建索引
console.log('📋 创建索引...');
db.exec(`CREATE INDEX IF NOT EXISTS idx_category ON metadata(category)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_created_at ON metadata(created_at)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_importance ON metadata(importance)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_content_hash ON metadata(content_hash)`);

console.log('✅ metadata 表创建完成');

// 创建 content 表
console.log('\n📋 创建 content 表...');
db.exec(`
  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metadata_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    keywords TEXT,
    FOREIGN KEY (metadata_id) REFERENCES metadata(id)
  )
`);

// 创建索引
console.log('📋 创建索引...');
db.exec(`CREATE INDEX IF NOT EXISTS idx_metadata_id ON content(metadata_id)`);

console.log('✅ content 表创建完成');

// 创建 access_log 表（记录访问日志）
console.log('\n📋 创建 access_log 表...');
db.exec(`
  CREATE TABLE IF NOT EXISTS access_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memory_id INTEGER NOT NULL,
    access_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    access_type TEXT NOT NULL,
    FOREIGN KEY (memory_id) REFERENCES metadata(id)
  )
`);

// 创建索引
console.log('📋 创建索引...');
db.exec(`CREATE INDEX IF NOT EXISTS idx_memory_id ON access_log(memory_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_access_at ON access_log(access_at)`);

console.log('✅ access_log 表创建完成');

// 创建 optimization_log 表（记录优化日志）
console.log('\n📋 创建 optimization_log 表...');
db.exec(`
  CREATE TABLE IF NOT EXISTS optimization_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    optimization_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    memories_processed INTEGER,
    memories_merged INTEGER,
    memories_archived INTEGER,
    memories_deleted INTEGER,
    report TEXT
  )
`);

console.log('✅ optimization_log 表创建完成');

// 查询表结构
console.log('\n============================================================');
console.log('  数据库表结构');
console.log('============================================================\n');

const tables = db.prepare(`
  SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
`).all();

console.log('表列表:');
tables.forEach(table => {
  console.log(`  - ${table.name}`);
  
  // 查询表结构
  const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
  console.log('    列:');
  columns.forEach(col => {
    console.log(`      ${col.name} (${col.type})${col.pk ? ' PRIMARY KEY' : ''}${col.notnull ? ' NOT NULL' : ''}`);
  });
});

// 查询索引
console.log('\n索引列表:');
const indexes = db.prepare(`
  SELECT name, tbl_name FROM sqlite_master WHERE type='index' ORDER BY name
`).all();

indexes.forEach(index => {
  console.log(`  - ${index.name} (表: ${index.tbl_name})`);
});

// 统计信息
console.log('\n============================================================');
console.log('  统计信息');
console.log('============================================================\n');

try {
  const metadataCount = db.prepare('SELECT COUNT(*) as count FROM metadata').get();
  console.log(`metadata 记录数: ${metadataCount.count}`);
  
  const contentCount = db.prepare('SELECT COUNT(*) as count FROM content').get();
  console.log(`content 记录数: ${contentCount.count}`);
  
  const accessLogCount = db.prepare('SELECT COUNT(*) as count FROM access_log').get();
  console.log(`access_log 记录数: ${accessLogCount.count}`);
} catch (error) {
  console.log('统计信息查询失败（表可能为空）');
}

console.log('\n============================================================');
console.log('  数据库初始化完成');
console.log('============================================================');

// 关闭数据库
db.close();
