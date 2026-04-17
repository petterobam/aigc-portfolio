#!/usr/bin/env node

/**
 * 添加记忆到 SQLite 数据库
 *
 * 使用方法：
 * node add-memory.js --title="标题" --category="分类" --content="内容"
 */

const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

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
 * 提取标签
 */
function extractTags(content) {
  const tags = [];

  // 提取常见的标签
  const tagPatterns = [
    /知乎/g,
    /技术运营/g,
    /OpenClaw/g,
    /文章创作/g,
    /复盘总结/g,
    /知识付费/g,
    /变现路径/g,
    /效率提升/g,
    /自动化/g,
    /技巧/g
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
 * 添加记忆
 */
function addMemory(title, category, content) {
  try {
    const tags = extractTags(content);
    const contentHash = calculateHash(content);
    const importance = null; // 让优化脚本自动计算评分

    // 检查是否已存在（通过 content_hash）
    const existing = db.prepare('SELECT id FROM metadata WHERE content_hash = ?').get(contentHash);
    if (existing) {
      console.log('⏭ 记忆已存在，跳过');
      return null;
    }

    // 生成摘要
    const summary = generateSummary(content);

    // 开始事务
    const transaction = db.transaction(() => {
      // 插入 metadata
      const metadataResult = insertMetadata.run(
        title,
        category,
        tags,
        null, // file_path
        contentHash,
        importance
      );

      const metadataId = metadataResult.lastInsertRowid;

      // 插入 content
      const keywords = tags;

      insertContent.run(metadataId, content, summary, keywords);

      return metadataId;
    });

    const metadataId = transaction();
    console.log(`✅ 记忆添加成功 (ID: ${metadataId})`);
    console.log(`   标题: ${title}`);
    console.log(`   分类: ${category}`);
    console.log(`   摘要: ${summary}`);

    return metadataId;

  } catch (error) {
    console.error(`❌ 添加失败: ${error.message}`);
    return null;
  }
}

// 检查参数
if (!params.title || !params.category || !params.content) {
  console.log('用法: node add-memory.js --title="标题" --category="分类" --content="内容"');
  console.log('');
  console.log('分类选项: breakthrough, creation, operation, task, general, archived');
  process.exit(1);
}

// 添加记忆
addMemory(params.title, params.category, params.content);

// 关闭数据库
db.close();
