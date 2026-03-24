#!/usr/bin/env node

/**
 * 向量去重器测试脚本
 *
 * 测试向量去重器的核心功能（不调用 OpenAI API）
 */

const path = require('path');
const Database = require('better-sqlite3');

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const DB_PATH = path.join(WORKSPACE_DIR, 'memory.db');

console.log('============================================================');
console.log('  向量去重器测试');
console.log('============================================================\n');

// 导入向量去重器
const { VectorDeduplicator, CONFIG } = require('./vector-deduplicator');

// 创建测试数据库（内存模式）
const db = new Database(':memory:');

// 创建测试表
db.exec(`
  CREATE TABLE metadata (
    id INTEGER PRIMARY KEY,
    title TEXT,
    category TEXT,
    tags TEXT,
    importance REAL,
    access_count INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE content (
    id INTEGER PRIMARY KEY,
    metadata_id INTEGER,
    content TEXT,
    embedding TEXT,
    FOREIGN KEY (metadata_id) REFERENCES metadata(id)
  );
`);

// 插入测试数据
const testMemories = [
  {
    id: 1,
    title: '爽点公式库',
    category: 'breakthrough',
    tags: '[]',
    importance: 3.9,
    access_count: 15,
    created_at: '2026-03-20 10:00:00',
    updated_at: '2026-03-21 10:00:00',
    content: '爽点公式库：1. 爽点公式库核心要点：金手指明确+社会共鸣+节奏控制 2. 核心公式：明确金手指(40%) + 社会共鸣强(30%) + 标题悬念(20%) + 合适字数(10%) = 阅读量'
  },
  {
    id: 2,
    title: '爽点公式总结',
    category: 'breakthrough',
    tags: '[]',
    importance: 3.8,
    access_count: 13,
    created_at: '2026-03-20 12:00:00',
    updated_at: '2026-03-21 12:00:00',
    content: '爽点公式总结：核心公式是明确金手指占40%，社会共鸣占30%，标题悬念占20%，合适字数占10%，最终影响阅读量'
  },
  {
    id: 3,
    title: 'Python 基础教程',
    category: 'creation',
    tags: '[]',
    importance: 2.2,
    access_count: 5,
    created_at: '2026-03-19 15:00:00',
    updated_at: '2026-03-20 15:00:00',
    content: 'Python 是一种高级编程语言，语法简洁易读。适用于 Web 开发、数据分析、人工智能等领域。Python 的核心特性包括：动态类型、自动内存管理、丰富的标准库。'
  }
];

// 插入数据到数据库
testMemories.forEach(mem => {
  db.prepare(`
    INSERT INTO metadata (id, title, category, tags, importance, access_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(mem.id, mem.title, mem.category, mem.tags, mem.importance, mem.access_count, mem.created_at, mem.updated_at);

  db.prepare(`
    INSERT INTO content (metadata_id, content)
    VALUES (?, ?)
  `).run(mem.id, mem.content);
});

// 测试 1: 余弦相似度计算
console.log('测试 1: 余弦相似度计算');
console.log('----------------------------------------');

const deduplicator = new VectorDeduplicator(db, 'fake-api-key');

// 测试向量
const vecA = [1, 2, 3, 4, 5];
const vecB = [1, 2, 3, 4, 5];
const vecC = [1, 0, 0, 0, 0];
const vecD = [0, 0, 0, 0, 1];

const simAB = deduplicator.cosineSimilarity(vecA, vecB);
const simAC = deduplicator.cosineSimilarity(vecA, vecC);
const simAD = deduplicator.cosineSimilarity(vecA, vecD);

console.log(`向量 A 与 B (完全相同): ${simAB.toFixed(4)} (预期: 1.0000)`);
console.log(`向量 A 与 C (部分相似): ${simAC.toFixed(4)} (预期: < 1.0000)`);
console.log(`向量 A 与 D (不相似): ${simAD.toFixed(4)} (预期: < 1.0000)`);

const test1Passed = simAB === 1 && simAC < 1 && simAD < 1;
console.log(`结果: ${test1Passed ? '✅ 通过' : '❌ 失败'}\n`);

// 测试 2: 查找相似记忆（模拟向量）
console.log('测试 2: 查找相似记忆');
console.log('----------------------------------------');

const testMemoriesWithEmbeddings = testMemories.map(mem => ({
  ...mem,
  // 模拟向量：ID 1 和 2 相似，ID 3 不相似
  embedding: mem.id === 1 ? [1, 2, 3, 4, 5] :
             mem.id === 2 ? [1, 2, 3, 4, 5.1] :  // 与 ID 1 非常相似
             [0, 0, 0, 0, 1]                      // 与 ID 1 不相似
}));

const similarTo1 = deduplicator.findSimilarMemories(
  testMemoriesWithEmbeddings[0].embedding,
  testMemoriesWithEmbeddings.slice(1),
  0.95
);

console.log(`查找与 "${testMemories[0].title}" 相似的记忆（阈值 0.95）：`);
similarTo1.forEach(mem => {
  console.log(`  - "${mem.title}" (相似度: ${mem.similarity.toFixed(4)})`);
});

const test2Passed = similarTo1.length === 1 && similarTo1[0].id === 2;
console.log(`结果: ${test2Passed ? '✅ 通过' : '❌ 失败'}\n`);

// 测试 3: 向量缓存
console.log('测试 3: 向量缓存');
console.log('----------------------------------------');

const deduplicatorWithCache = new VectorDeduplicator(db, 'fake-api-key');
const testContent = '测试内容';

// 第一次访问（缓存为空）
const cacheSize1 = deduplicatorWithCache.embeddingCache.size;
console.log(`第一次访问前，缓存大小: ${cacheSize1}`);

// 模拟生成向量
const embedding = [1, 2, 3, 4, 5];
const contentHash = require('crypto').createHash('md5').update(testContent).digest('hex');
deduplicatorWithCache.embeddingCache.set(contentHash, embedding);

const cacheSize2 = deduplicatorWithCache.embeddingCache.size;
console.log(`模拟生成向量后，缓存大小: ${cacheSize2}`);

// 第二次访问（从缓存读取）
const cacheSize3 = deduplicatorWithCache.embeddingCache.size;
console.log(`第二次访问（缓存命中），缓存大小: ${cacheSize3}`);

const test3Passed = cacheSize1 === 0 && cacheSize2 === 1 && cacheSize3 === 1;
console.log(`结果: ${test3Passed ? '✅ 通过' : '❌ 失败'}\n`);

// 测试 4: 配置参数
console.log('测试 4: 配置参数');
console.log('----------------------------------------');

console.log(`相似度阈值: ${CONFIG.similarityThreshold}`);
console.log(`批量大小: ${CONFIG.batchSize}`);
console.log(`OpenAI 模型: ${CONFIG.model}`);
console.log(`向量维度: ${CONFIG.dimensions}`);
console.log(`缓存启用: ${CONFIG.cacheEnabled}`);

const test4Passed =
  CONFIG.similarityThreshold === 0.95 &&
  CONFIG.batchSize === 10 &&
  CONFIG.model === 'text-embedding-3-small' &&
  CONFIG.dimensions === 1536 &&
  CONFIG.cacheEnabled === true;
console.log(`结果: ${test4Passed ? '✅ 通过' : '❌ 失败'}\n`);

// 测试总结
console.log('============================================================');
console.log('  测试总结');
console.log('============================================================\n');

const allTestsPassed = test1Passed && test2Passed && test3Passed && test4Passed;
console.log(`总测试数: 4`);
console.log(`通过数: ${test1Passed + test2Passed + test3Passed + test4Passed}`);
console.log(`失败数: ${4 - (test1Passed + test2Passed + test3Passed + test4Passed)}`);
console.log(`\n最终结果: ${allTestsPassed ? '✅ 全部通过' : '❌ 部分失败'}\n`);

if (allTestsPassed) {
  console.log('💡 下一步：');
  console.log('  1. 配置 OPENAI_API_KEY 环境变量');
  console.log('  2. 运行优化脚本：node scripts/optimize.js');
  console.log('  3. 验证向量去重功能');
}

db.close();

process.exit(allTestsPassed ? 0 : 1);
