#!/usr/bin/env node

/**
 * 记忆数据迁移脚本
 *
 * 功能：将现有的 Markdown 记忆迁移到 SQLite 数据库
 *
 * 使用方法：
 * node scripts/migrate-memories-to-db.js
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const DB_PATH = path.join(WORKSPACE_DIR, 'memory.db');
const MEMORY_FILE = path.join(WORKSPACE_DIR, 'MEMORY.md');
const MEMORY_DIR = path.join(WORKSPACE_DIR, 'memory');

// 打开数据库
const db = new Database(DB_PATH);

console.log('============================================================');
console.log('  记忆数据迁移');
console.log('============================================================\n');

// 准备 SQL 语句
const insertMetadata = db.prepare(`
  INSERT INTO metadata (title, category, tags, file_path, content_hash, importance)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertContent = db.prepare(`
  INSERT INTO content (metadata_id, content, summary, keywords)
  VALUES (?, ?, ?, ?)
`);

/**
 * 计算内容哈希
 */
function calculateHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * 提取标题
 */
function extractTitle(content, filePath) {
  const lines = content.split('\n');
  
  // 尝试从第一行提取标题
  if (lines[0].startsWith('# ')) {
    return lines[0].substring(2).trim();
  }
  
  // 使用文件名作为标题
  return path.basename(filePath, '.md');
}

/**
 * 推断分类
 */
function inferCategory(title, content) {
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  
  if (titleLower.includes('突破') || contentLower.includes('突破')) return 'breakthrough';
  if (titleLower.includes('创作') || contentLower.includes('创作')) return 'creation';
  if (titleLower.includes('运营') || contentLower.includes('运营')) return 'operation';
  if (titleLower.includes('任务') || contentLower.includes('任务')) return 'task';
  
  return 'general';
}

/**
 * 提取标签
 */
function extractTags(content) {
  const tags = [];
  
  // 提取常见的标签
  const tagPatterns = [
    /番茄小说/g,
    /浏览器自动化/g,
    /Playwright/g,
    /MCP/g,
    /记忆系统/g,
    /SQLite/g,
    /向量数据库/g,
    /数据迁移/g,
    /优化/g,
    /突破/g,
    /创作/g,
    /运营/g
  ];
  
  tagPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (!tags.includes(match)) {
          tags.push(match);
        }
      });
    }
  });
  
  return JSON.stringify(tags);
}

/**
 * 生成摘要
 */
function generateSummary(content, maxLength = 200) {
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  const summary = lines.slice(0, 3).join('\n').trim();
  
  if (summary.length > maxLength) {
    return summary.substring(0, maxLength) + '...';
  }
  
  return summary;
}

/**
 * 推断重要程度
 */
function inferImportance(title, content) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('重大') || titleLower.includes('突破')) return 5;
  if (titleLower.includes('重要') || titleLower.includes('高优先级')) return 4;
  if (titleLower.includes('待解决') || titleLower.includes('下一步')) return 3;
  
  return 2;
}

/**
 * 迁移单个文件
 */
function migrateFile(filePath, category = null) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const title = extractTitle(content, filePath);
    const inferredCategory = category || inferCategory(title, content);
    const tags = extractTags(content);
    const contentHash = calculateHash(content);
    const importance = inferImportance(title, content);
    
    // 检查是否已存在（通过 content_hash）
    const existing = db.prepare('SELECT id FROM metadata WHERE content_hash = ?').get(contentHash);
    if (existing) {
      console.log(`  ⏭ 跳过重复内容: ${title}`);
      return null;
    }
    
    // 开始事务
    const transaction = db.transaction(() => {
      // 插入 metadata
      const metadataResult = insertMetadata.run(
        title,
        inferredCategory,
        tags,
        filePath,
        contentHash,
        importance
      );
      
      const metadataId = metadataResult.lastInsertRowid;
      
      // 插入 content
      const summary = generateSummary(content);
      const keywords = tags; // 暂时使用相同的标签作为关键词
      
      insertContent.run(metadataId, content, summary, keywords);
      
      return metadataId;
    });
    
    const metadataId = transaction();
    console.log(`  ✅ 迁移成功: ${title} (ID: ${metadataId})`);
    return metadataId;
    
  } catch (error) {
    console.error(`  ❌ 迁移失败: ${filePath} - ${error.message}`);
    return null;
  }
}

// 统计信息
let totalMigrated = 0;
let totalSkipped = 0;

console.log('📋 迁移 MEMORY.md...');
const memoryId = migrateFile(MEMORY_FILE);
if (memoryId) {
  totalMigrated++;
} else {
  totalSkipped++;
}

console.log('\n📋 迁移 memory/ 目录下的文件...');

// 迁移 memory/ 目录下的文件
if (fs.existsSync(MEMORY_DIR)) {
  const files = fs.readdirSync(MEMORY_DIR)
    .filter(file => file.endsWith('.md') && file !== 'archive')
    .sort()
    .reverse(); // 按时间倒序，优先迁移最新的
  
  files.forEach(file => {
    const filePath = path.join(MEMORY_DIR, file);
    const metadataId = migrateFile(filePath);
    if (metadataId) {
      totalMigrated++;
    } else {
      totalSkipped++;
    }
  });
  
  // 迁移归档文件
  const archiveDir = path.join(MEMORY_DIR, 'archive');
  if (fs.existsSync(archiveDir)) {
    console.log('\n📋 迁移归档文件...');
    const archiveFiles = fs.readdirSync(archiveDir)
      .filter(file => file.endsWith('.md'))
      .sort()
      .reverse();
    
    archiveFiles.forEach(file => {
      const filePath = path.join(archiveDir, file);
      const metadataId = migrateFile(filePath, 'archived');
      if (metadataId) {
        totalMigrated++;
      } else {
        totalSkipped++;
      }
    });
  }
}

console.log('\n============================================================');
console.log('  迁移完成');
console.log('============================================================');
console.log(`总迁移数: ${totalMigrated}`);
console.log(`总跳过数: ${totalSkipped}`);

// 统计信息
const stats = db.prepare('SELECT category, COUNT(*) as count FROM metadata GROUP BY category').all();
console.log('\n按分类统计:');
stats.forEach(stat => {
  console.log(`  ${stat.category}: ${stat.count} 条`);
});

// 关闭数据库
db.close();
