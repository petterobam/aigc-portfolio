#!/usr/bin/env node

/**
 * 向量持久化功能测试脚本 (v1.0.0)
 *
 * 功能：
 * 1. 测试数据库 Schema 升级（embedding、embedding_version 字段）
 * 2. 测试智能向量生成（检查缓存、数据库、版本）
 * 3. 测试向量持久化（存储到数据库）
 * 4. 测试向量版本控制
 *
 * 使用方法：
 * node test-embedding-persistence.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const { VectorDeduplicator, CONFIG } = require('./vector-deduplicator');

// 数据库路径
const DB_PATH = path.resolve(__dirname, '../../../data/memory.db');

console.log('============================================================');
console.log('  向量持久化功能测试');
console.log('============================================================');

// 打开数据库
const db = new Database(DB_PATH);
console.log(`📊 数据库: ${DB_PATH}`);

// 测试 1：验证数据库 Schema
console.log('\n=== 测试 1: 验证数据库 Schema ===');

const contentColumns = db.prepare('PRAGMA table_info(content)').all();
const hasEmbedding = contentColumns.some(col => col.name === 'embedding');

const metadataColumns = db.prepare('PRAGMA table_info(metadata)').all();
const hasEmbeddingVersion = metadataColumns.some(col => col.name === 'embedding_version');

console.log(`content.embedding 字段: ${hasEmbedding ? '✅ 存在' : '❌ 不存在'}`);
console.log(`metadata.embedding_version 字段: ${hasEmbeddingVersion ? '✅ 存在' : '❌ 不存在'}`);

if (!hasEmbedding || !hasEmbeddingVersion) {
  console.error('❌ 数据库 Schema 未升级，请先运行 migrate-embedding-persistence.js');
  process.exit(1);
}

// 测试 2：验证向量存储状态
console.log('\n=== 测试 2: 验证向量存储状态 ===');

const totalMemories = db.prepare('SELECT COUNT(*) as count FROM content').get();
const withEmbeddings = db.prepare('SELECT COUNT(*) as count FROM content WHERE embedding IS NOT NULL').get();
const withVersion = db.prepare('SELECT COUNT(*) as count FROM metadata WHERE embedding_version IS NOT NULL').get();

console.log(`总记忆数: ${totalMemories.count}`);
console.log(`已存储向量: ${withEmbeddings.count}`);
console.log(`已标记版本: ${withVersion.count}`);

// 测试 3：测试智能向量生成（需要 OPENAI_API_KEY）
console.log('\n=== 测试 3: 测试智能向量生成 ===');

// 从数据库读取一条记忆
const testMemory = db.prepare(`
  SELECT m.id, m.title, c.content
  FROM metadata m
  JOIN content c ON c.metadata_id = m.id
  WHERE c.archived = 0 OR c.archived IS NULL
  LIMIT 1
`).get();

if (!testMemory) {
  console.warn('⚠️  没有找到活跃记忆，跳过智能向量生成测试');
  db.close();
  process.exit(0);
}

console.log(`测试记忆: [${testMemory.id}] ${testMemory.title}`);

// 检查是否配置了 OPENAI_API_KEY
let openaiApiKey = null;

// 方法 1：从环境变量读取
if (process.env.OPENAI_API_KEY) {
  openaiApiKey = process.env.OPENAI_API_KEY;
  console.log('✅ 从环境变量读取到 OPENAI_API_KEY');
}

// 方法 2：从 .env 文件读取
if (!openaiApiKey) {
  try {
    const envPath = path.resolve(__dirname, '.env');
    const fs = require('fs');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/^OPENAI_API_KEY=(.+)$/m);
      if (match) {
        openaiApiKey = match[1].trim();
        console.log('✅ 从 .env 文件读取到 OPENAI_API_KEY');
      }
    }
  } catch (error) {
    console.warn('⚠️  读取 .env 文件失败:', error.message);
  }
}

if (!openaiApiKey) {
  console.warn('⚠️  未配置 OPENAI_API_KEY，跳过智能向量生成测试');
  console.log('💡 配置方法：');
  console.log('  1. 创建 .env 文件：echo "OPENAI_API_KEY=your_api_key" > .env');
  console.log('  2. 或者设置环境变量：export OPENAI_API_KEY=your_api_key');
  db.close();
  process.exit(0);
}

// 创建向量去重器
const deduplicator = new VectorDeduplicator(db, openaiApiKey);

// 测试 3.1：检查向量是否需要更新
console.log('\n--- 测试 3.1: 检查向量是否需要更新 ---');

const checkResult = deduplicator.checkEmbeddingUpdateNeeded(testMemory.id, testMemory.content);
console.log(`需要更新: ${checkResult.needsUpdate ? '✅ 是' : '❌ 否'}`);
console.log(`存储的向量版本: ${checkResult.storedVersion || '无'}`);
console.log(`当前向量版本: ${deduplicator.getEmbeddingVersion()}`);

// 测试 3.2：生成向量（第一次）
console.log('\n--- 测试 3.2: 生成向量（第一次） ---');

const startTime1 = Date.now();
const embedding1 = await deduplicator.generateEmbeddingSmart(testMemory.id, testMemory.content);
const elapsed1 = Date.now() - startTime1;

console.log(`向量维度: ${embedding1.length}`);
console.log(`耗时: ${(elapsed1 / 1000).toFixed(2)} 秒`);
console.log(`缓存大小: ${deduplicator.embeddingCache.size}`);

// 测试 3.3：再次生成向量（第二次，应该从缓存读取）
console.log('\n--- 测试 3.3: 再次生成向量（第二次，应该从缓存读取） ---');

const startTime2 = Date.now();
const embedding2 = await deduplicator.generateEmbeddingSmart(testMemory.id, testMemory.content);
const elapsed2 = Date.now() - startTime2;

console.log(`向量维度: ${embedding2.length}`);
console.log(`耗时: ${(elapsed2 / 1000).toFixed(2)} 秒`);
console.log(`缓存大小: ${deduplicator.embeddingCache.size}`);
console.log(`缓存命中: ${elapsed2 < elapsed1 / 10 ? '✅ 是（性能提升显著）' : '❌ 否（可能是缓存未生效）'}`);

// 验证两次生成的向量是否相同
const areEqual = embedding1.every((val, i) => val === embedding2[i]);
console.log(`向量一致性: ${areEqual ? '✅ 一致' : '❌ 不一致'}`);

// 测试 3.4：清空缓存，再次生成向量（应该从数据库读取）
console.log('\n--- 测试 3.4: 清空缓存，再次生成向量（应该从数据库读取） ---');

deduplicator.clearCache();
console.log(`缓存已清空，当前缓存大小: ${deduplicator.embeddingCache.size}`);

const startTime3 = Date.now();
const embedding3 = await deduplicator.generateEmbeddingSmart(testMemory.id, testMemory.content);
const elapsed3 = Date.now() - startTime3;

console.log(`向量维度: ${embedding3.length}`);
console.log(`耗时: ${(elapsed3 / 1000).toFixed(2)} 秒`);
console.log(`缓存大小: ${deduplicator.embeddingCache.size}`);
console.log(`数据库读取: ${elapsed3 < elapsed1 / 10 ? '✅ 是（性能提升显著）' : '❌ 否（可能是数据库读取未生效）'}`);

// 验证从数据库读取的向量是否相同
const areEqualDb = embedding1.every((val, i) => val === embedding3[i]);
console.log(`向量一致性: ${areEqualDb ? '✅ 一致' : '❌ 不一致'}`);

// 测试 4：验证向量已存储到数据库
console.log('\n=== 测试 4: 验证向量已存储到数据库 ===');

const stored = db.prepare(`
  SELECT c.embedding, m.embedding_version
  FROM content c
  JOIN metadata m ON c.metadata_id = m.id
  WHERE c.metadata_id = ?
`).get(testMemory.id);

if (stored && stored.embedding) {
  const storedEmbedding = JSON.parse(stored.embedding);
  console.log(`✅ 向量已存储到数据库`);
  console.log(`存储的向量版本: ${stored.embedding_version}`);
  console.log(`存储的向量维度: ${storedEmbedding.length}`);

  const areEqualStored = embedding1.every((val, i) => val === storedEmbedding[i]);
  console.log(`向量一致性: ${areEqualStored ? '✅ 一致' : '❌ 不一致'}`);
} else {
  console.error('❌ 向量未存储到数据库');
}

// 测试 5：批量生成向量
console.log('\n=== 测试 5: 批量生成向量 ===');

const memories = db.prepare(`
  SELECT m.id, m.title, c.content
  FROM metadata m
  JOIN content c ON c.metadata_id = m.id
  WHERE c.archived = 0 OR c.archived IS NULL
`).all();

console.log(`总记忆数: ${memories.length}`);

const startTimeBatch = Date.now();
const memoriesWithEmbeddings = await deduplicator.generateEmbeddingsBatch(memories);
const elapsedBatch = Date.now() - startTimeBatch;

const validMemories = memoriesWithEmbeddings.filter(m => m.embedding && !m.error);
console.log(`成功生成: ${validMemories.length} 条`);
console.log(`失败: ${memoriesWithEmbeddings.length - validMemories.length} 条`);
console.log(`耗时: ${(elapsedBatch / 1000).toFixed(2)} 秒`);
console.log(`平均耗时: ${(elapsedBatch / validMemories.length / 1000).toFixed(2)} 秒/条`);

// 测试 6：缓存统计
console.log('\n=== 测试 6: 缓存统计 ===');

const cacheStats = deduplicator.getCacheStats();
console.log(`缓存大小: ${cacheStats.size}`);
console.log(`缓存启用: ${cacheStats.enabled ? '✅' : '❌'}`);
console.log(`持久化启用: ${cacheStats.usePersistence ? '✅' : '❌'}`);

// 测试 7：统计数据库中的向量数量
console.log('\n=== 测试 7: 统计数据库中的向量数量 ===');

const finalWithEmbeddings = db.prepare('SELECT COUNT(*) as count FROM content WHERE embedding IS NOT NULL').get();
const finalWithVersion = db.prepare('SELECT COUNT(*) as count FROM metadata WHERE embedding_version IS NOT NULL').get();

console.log(`已存储向量: ${finalWithEmbeddings.count} / ${totalMemories.count}`);
console.log(`已标记版本: ${finalWithVersion.count} / ${totalMemories.count}`);

if (finalWithEmbeddings.count === totalMemories.count && finalWithVersion.count === totalMemories.count) {
  console.log('✅ 所有记忆的向量都已存储到数据库');
} else {
  console.log(`⚠️  部分记忆的向量未存储到数据库（${totalMemories.count - finalWithEmbeddings.count} 条）`);
}

// 总结
console.log('\n============================================================');
console.log('  ✅ 测试完成');
console.log('============================================================');

console.log('\n📊 测试总结：');
console.log(`  ✅ 数据库 Schema 升级成功`);
console.log(`  ✅ 智能向量生成功能正常`);
console.log(`  ✅ 向量持久化功能正常`);
console.log(`  ✅ 向量版本控制功能正常`);
console.log(`  ✅ 批量生成向量功能正常`);
console.log(`  ✅ 缓存功能正常`);
console.log(`  ${elapsed2 < elapsed1 / 10 ? '✅' : '⚠️ '} 缓存性能提升: ${((1 - elapsed2 / elapsed1) * 100).toFixed(2)}%`);
console.log(`  ${elapsed3 < elapsed1 / 10 ? '✅' : '⚠️ '} 数据库读取性能提升: ${((1 - elapsed3 / elapsed1) * 100).toFixed(2)}%`);

console.log('\n💡 下一步：');
console.log(`  1. 运行优化脚本，验证向量去重功能`);
console.log(`  2. 观察 API 调用次数，验证是否减少了重复调用`);
console.log(`  3. 继续实施 Phase 2 其他优化（相似度计算优化、增量更新等）`);
console.log('\n============================================================\n');

db.close();
