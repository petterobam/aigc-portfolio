#!/usr/bin/env node

/**
 * 向量持久化数据库迁移脚本 (v1.0.0)
 *
 * 功能：
 * 1. 在 content 表中添加 embedding 字段
 * 2. 在 metadata 表中添加 embedding_version 字段
 * 3. 创建索引优化查询性能
 *
 * 使用方法：
 * node migrate-embedding-persistence.js
 */

const Database = require('better-sqlite3');
const path = require('path');

// 数据库路径（使用共享配置）
const CONFIG = require('./config.js');
const DB_PATH = CONFIG.DB_CONFIG.dbPath;

console.log('============================================================');
console.log('  向量持久化数据库迁移');
console.log('============================================================');

// 打开数据库
const db = new Database(DB_PATH);
console.log(`📊 数据库: ${DB_PATH}`);

// 开始事务
const migrate = db.transaction(() => {
  console.log('\n📋 迁移步骤：');

  // 步骤 1：检查 content 表是否有 embedding 字段
  console.log('\n步骤 1: 检查 content 表结构...');
  const contentColumns = db.prepare('PRAGMA table_info(content)').all();
  const hasEmbedding = contentColumns.some(col => col.name === 'embedding');

  if (hasEmbedding) {
    console.log('  ✅ content.embedding 字段已存在，跳过');
  } else {
    console.log('  📝 添加 content.embedding 字段...');
    db.prepare(`
      ALTER TABLE content ADD COLUMN embedding TEXT
    `).run();
    console.log('  ✅ content.embedding 字段已添加');
  }

  // 步骤 2：检查 metadata 表是否有 embedding_version 字段
  console.log('\n步骤 2: 检查 metadata 表结构...');
  const metadataColumns = db.prepare('PRAGMA table_info(metadata)').all();
  const hasEmbeddingVersion = metadataColumns.some(col => col.name === 'embedding_version');

  if (hasEmbeddingVersion) {
    console.log('  ✅ metadata.embedding_version 字段已存在，跳过');
  } else {
    console.log('  📝 添加 metadata.embedding_version 字段...');
    db.prepare(`
      ALTER TABLE metadata ADD COLUMN embedding_version TEXT
    `).run();
    console.log('  ✅ metadata.embedding_version 字段已添加');
  }

  // 步骤 3：创建索引
  console.log('\n步骤 3: 创建索引...');

  try {
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_content_embedding ON content(embedding)
    `).run();
    console.log('  ✅ 索引 idx_content_embedding 已创建');
  } catch (error) {
    console.log(`  ⚠️  索引 idx_content_embedding 创建失败: ${error.message}`);
  }

  try {
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_metadata_embedding_version ON metadata(embedding_version)
    `).run();
    console.log('  ✅ 索引 idx_metadata_embedding_version 已创建');
  } catch (error) {
    console.log(`  ⚠️  索引 idx_metadata_embedding_version 创建失败: ${error.message}`);
  }

  // 步骤 4：验证表结构
  console.log('\n步骤 4: 验证表结构...');

  const finalContentColumns = db.prepare('PRAGMA table_info(content)').all();
  const finalHasEmbedding = finalContentColumns.some(col => col.name === 'embedding');
  console.log(`  content.embedding 字段: ${finalHasEmbedding ? '✅ 存在' : '❌ 不存在'}`);

  const finalMetadataColumns = db.prepare('PRAGMA table_info(metadata)').all();
  const finalHasEmbeddingVersion = finalMetadataColumns.some(col => col.name === 'embedding_version');
  console.log(`  metadata.embedding_version 字段: ${finalHasEmbeddingVersion ? '✅ 存在' : '❌ 不存在'}`);

  // 步骤 5：统计当前向量状态
  console.log('\n步骤 5: 统计当前向量状态...');

  const totalMemories = db.prepare('SELECT COUNT(*) as count FROM content').get();
  const withEmbeddings = db.prepare('SELECT COUNT(*) as count FROM content WHERE embedding IS NOT NULL').get();
  const withVersion = db.prepare('SELECT COUNT(*) as count FROM metadata WHERE embedding_version IS NOT NULL').get();

  console.log(`  总记忆数: ${totalMemories.count}`);
  console.log(`  已存储向量: ${withEmbeddings.count}`);
  console.log(`  已标记版本: ${withVersion.count}`);

  return {
    contentEmbeddingAdded: !hasEmbedding,
    metadataEmbeddingVersionAdded: !hasEmbeddingVersion,
    totalMemories: totalMemories.count,
    withEmbeddings: withEmbeddings.count,
    withVersion: withVersion.count
  };
});

// 执行迁移
try {
  const result = migrate();
  console.log('\n============================================================');
  console.log('  ✅ 迁移完成');
  console.log('============================================================');
  console.log(`\n📊 迁移结果：`);
  console.log(`  - content.embedding 字段: ${result.contentEmbeddingAdded ? '✅ 已添加' : '已存在'}`);
  console.log(`  - metadata.embedding_version 字段: ${result.metadataEmbeddingVersionAdded ? '✅ 已添加' : '已存在'}`);
  console.log(`  - 总记忆数: ${result.totalMemories}`);
  console.log(`  - 已存储向量: ${result.withEmbeddings}`);
  console.log(`  - 已标记版本: ${result.withVersion}`);
  console.log(`\n💡 下一步：`);
  console.log(`  1. 运行优化脚本，生成向量并存储到数据库`);
  console.log(`  2. 验证向量持久化功能是否生效`);
  console.log(`  3. 运行 vector-deduplicator.js，测试智能生成逻辑`);
  console.log(`\n============================================================\n`);
} catch (error) {
  console.error('\n❌ 迁移失败:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  db.close();
}
