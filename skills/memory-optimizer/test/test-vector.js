#!/usr/bin/env node

/**
 * 向量生成调试脚本
 */

const Database = require('better-sqlite3');
const db = new Database('~/.openclaw/workspace/data/memory.db');

// 引入 OllamaEmbeddings
const OllamaEmbeddings = require('./scripts/ollama-embeddings');

const ollama = new OllamaEmbeddings(db, {
  model: 'gemma:2b',
  apiUrl: 'http://localhost:11434/api/embeddings',
  similarityThreshold: 0.98
});

async function test() {
  console.log('🔍 测试向量生成...\n');

  // 获取第一条记忆
  const memory = db.prepare(`
    SELECT m.id, m.title, c.content, c.summary
    FROM metadata m
    JOIN content c ON m.id = c.metadata_id
    WHERE m.category != 'archived'
    LIMIT 1
  `).get();

  console.log(`📝 测试记忆: ${memory.title} (ID: ${memory.id})`);
  console.log(`   内容长度: ${memory.content.length} 字符`);
  console.log(`   摘要长度: ${memory.summary ? memory.summary.length : 0} 字符\n`);

  // 检查数据库中是否有向量
  const stored = db.prepare(`
    SELECT c.embedding, m.embedding_version
    FROM content c
    JOIN metadata m ON c.metadata_id = m.id
    WHERE c.metadata_id = ?
  `).get(memory.id);

  console.log(`📊 数据库中的向量:`);
  console.log(`   embedding: ${stored.embedding ? `${stored.embedding.substring(0, 100)}...` : 'NULL'}`);
  console.log(`   embedding_version: ${stored.embedding_version || 'NULL'}\n`);

  // 测试 checkEmbeddingUpdateNeeded
  console.log(`🔍 检查是否需要更新向量...`);
  const checkResult = ollama.checkEmbeddingUpdateNeeded(memory.id, memory.content);
  console.log(`   needsUpdate: ${checkResult.needsUpdate}`);
  console.log(`   storedVersion: ${checkResult.storedVersion}`);
  console.log(`   hasStoredEmbedding: ${!!checkResult.storedEmbedding}\n`);

  // 生成向量
  if (checkResult.needsUpdate) {
    console.log(`🔄 生成新向量...`);
    try {
      const embedding = await ollama.generateEmbeddingForMemory(memory);
      console.log(`✅ 向量生成成功 (维度: ${embedding.length})\n`);

      // 再次检查数据库
      const storedAfter = db.prepare(`
        SELECT c.embedding, m.embedding_version
        FROM content c
        JOIN metadata m ON c.metadata_id = m.id
        WHERE c.metadata_id = ?
      `).get(memory.id);

      console.log(`📊 保存后的向量:`);
      console.log(`   embedding: ${storedAfter.embedding ? `${storedAfter.embedding.substring(0, 100)}...` : 'NULL'}`);
      console.log(`   embedding_version: ${storedAfter.embedding_version || 'NULL'}\n`);
    } catch (error) {
      console.error(`❌ 向量生成失败:`, error.message);
      console.error(`   堆栈:`, error.stack);
    }
  } else {
    console.log(`ℹ️  向量已存在，无需重新生成\n`);
  }

  db.close();
}

test().catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
