#!/usr/bin/env node

/**
 * 测试记忆 ID=1 的向量生成
 */

const Database = require('better-sqlite3');
const { OllamaDeduplicator } = require('./scripts/ollama-embeddings');

// 数据库路径
const DB_PATH = '~/.openclaw/workspace/data/memory.db';

// 主函数
async function main() {
  // 初始化数据库
  const db = new Database(DB_PATH, { readonly: true });

  // 初始化 Ollama 去重器
  const deduplicator = new OllamaDeduplicator(db);

  // 查询记忆 ID=1
  const memory = db.prepare(`
    SELECT m.id, m.title, c.content
    FROM metadata m
    JOIN content c ON m.id = c.metadata_id
    WHERE m.id = ?
  `).get(1);

  console.log('测试记忆 ID=1:');
  console.log('标题:', memory.title);
  console.log('内容长度:', memory.content.length, '字符');
  console.log('');

  try {
    console.log('开始生成向量...');
    const embedding = await deduplicator.generateEmbedding(1, memory.content);
    console.log('✅ 向量生成成功!');
    console.log('向量维度:', embedding.length);
  } catch (error) {
    console.error('❌ 向量生成失败:');
    console.error('错误信息:', error.message);
    console.error('错误堆栈:', error.stack);
  }

  db.close();
}

main().catch(console.error);
