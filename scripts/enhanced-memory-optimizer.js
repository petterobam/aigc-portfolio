#!/usr/bin/env node

/**
 * 增强版记忆优化器 V1.0
 *
 * 核心能力：
 * 1. 向量搜索（语义搜索） - 使用本地 Embedding 模型
 * 2. 混合搜索（关键词 + 语义） - 更精准的检索
 * 3. 自动记忆优化 - 去重、归档、评分、清理
 * 4. 零成本方案 - 无需付费 API
 *
 * 依赖：
 * - better-sqlite3
 * - chromadb (开源向量数据库）
 * - @xenova/transformers (本地 Embedding 模型)
 *
 * 使用方法：
 *   node scripts/enhanced-memory-optimizer.js [options]
 *
 * 选项：
 *   --vector-search "搜索内容"  # 向量搜索
 *   --hybrid-search "搜索内容"  # 混合搜索（关键词 + 语义）
 *   --optimize                   # 优化记忆（去重、归档、评分、清理）
 *   --stats                      # 查看统计信息
 *   --recent                     # 最近记忆
 *   --important                  # 重要记忆
 *   --category "分类"            # 按分类查询
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// ============================================================
// 配置
// ============================================================

const CONFIG = {
  workspaceDir: path.join(process.env.HOME, '.openclaw/workspace'),
  memoryDir: path.join(process.env.HOME, '.openclaw/workspace'),
  dbFile: path.join(process.env.HOME, '.openclaw/workspace/memory.db'),
  vectorDir: path.join(process.env.HOME, '.openclaw/workspace/memory/vectors'),
  logsDir: path.join(process.env.HOME, '.openclaw/workspace/memory/logs'),
  
  // Embedding 模型配置
  embeddingModel: 'Xenova/all-MiniLM-L6-v2', // 轻量级中文模型
  embeddingDimension: 384,
  
  // 搜索配置
  vectorSearchTopK: 10,
  hybridSearchTopK: 5,
  minSimilarityScore: 0.6,
  
  // 优化配置
  autoArchiveDays: 30,
  minImportance: 3,
  maxAccessCount: 100,
};

// ============================================================
// 工具函数
// ============================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function log(message) {
  console.log(`[${new Date().toLocaleString('zh-CN')}] ${message}`);
}

// ============================================================
// 向量搜索核心
// ============================================================

class VectorSearcher {
  constructor() {
    this.chromaDB = null;
    this.collection = null;
    this.embeddingModel = null;
  }
  
  /**
   * 初始化 ChromaDB 和 Embedding 模型
   */
  async initialize() {
    try {
      // 检查依赖是否安装
      const { ChromaClient } = require('chromadb');
      const { pipeline } = require('@xenova/transformers');
      
      // 初始化 ChromaDB
      this.chromaDB = new ChromaClient({
        path: CONFIG.vectorDir
      });
      
      // 获取或创建集合
      this.collection = await this.chromaDB.getOrCreateCollection({
        name: 'memories',
        metadata: { dimension: CONFIG.embeddingDimension }
      });
      
      // 初始化 Embedding 模型
      log('正在加载 Embedding 模型...');
      this.embeddingModel = await pipeline(
        'feature-extraction',
        CONFIG.embeddingModel
      );
      
      log('✅ 向量搜索系统初始化成功');
      return true;
      
    } catch (error) {
      log(`⚠️ 向量搜索系统初始化失败: ${error.message}`);
      log('💡 提示: 请安装依赖: npm install chromadb @xenova/transformers better-sqlite3');
      return false;
    }
  }
  
  /**
   * 生成文本向量
   */
  async generateEmbedding(text) {
    try {
      const output = await this.embeddingModel(text, {
        pooling: 'mean',
        normalize: true
      });
      
      return Array.from(output.data);
      
    } catch (error) {
      log(`⚠️ 生成向量失败: ${error.message}`);
      return null;
    }
  }
  
  /**
   * 添加记忆到向量数据库
   */
  async addMemory(memory) {
    try {
      const id = memory.id || Date.now().toString();
      const text = `${memory.title}\n${memory.content}`;
      const embedding = await this.generateEmbedding(text);
      
      if (!embedding) {
        return false;
      }
      
      await this.collection.add({
        ids: [id],
        embeddings: [embedding],
        metadatas: [{
          title: memory.title,
          category: memory.category,
          importance: memory.importance,
          created_at: memory.created_at,
          file_path: memory.file_path
        }],
        documents: [text]
      });
      
      log(`✅ 记忆已添加到向量数据库: ${memory.title}`);
      return true;
      
    } catch (error) {
      log(`⚠️ 添加记忆失败: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 向量搜索
   */
  async vectorSearch(query) {
    try {
      const embedding = await this.generateEmbedding(query);
      
      if (!embedding) {
        return [];
      }
      
      const results = await this.collection.query({
        queryEmbeddings: [embedding],
        nResults: CONFIG.vectorSearchTopK
      });
      
      return results.ids[0].map((id, index) => ({
        id,
        document: results.documents[0][index],
        metadata: results.metadatas[0][index],
        distance: results.distances[0][index]
      }));
      
    } catch (error) {
      log(`⚠️ 向量搜索失败: ${error.message}`);
      return [];
    }
  }
  
  /**
   * 混合搜索（关键词 + 语义）
   */
  async hybridSearch(query) {
    try {
      // 向量搜索
      const vectorResults = await this.vectorSearch(query);
      
      // 关键词搜索（从 SQLite）
      const keywordResults = await this.keywordSearch(query);
      
      // 合并结果（去重）
      const mergedResults = [];
      const seenIds = new Set();
      
      for (const result of vectorResults) {
        if (!seenIds.has(result.id)) {
          seenIds.add(result.id);
          mergedResults.push({
            ...result,
            score: 1 - result.distance, // 转换为相似度分数
            type: 'vector'
          });
        }
      }
      
      for (const result of keywordResults) {
        if (!seenIds.has(result.id)) {
          seenIds.add(result.id);
          mergedResults.push({
            ...result,
            score: result.relevance || 0.5,
            type: 'keyword'
          });
        }
      }
      
      // 按分数排序
      mergedResults.sort((a, b) => b.score - a.score);
      
      return mergedResults.slice(0, CONFIG.hybridSearchTopK);
      
    } catch (error) {
      log(`⚠️ 混合搜索失败: ${error.message}`);
      return [];
    }
  }
  
  /**
   * 关键词搜索（从 SQLite）
   */
  async keywordSearch(query) {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(CONFIG.dbFile);
      
      const stmt = db.prepare(`
        SELECT 
          m.id,
          m.title,
          m.category,
          m.importance,
          m.created_at,
          m.file_path,
          c.content,
          c.summary
        FROM metadata m
        JOIN content c ON m.id = c.metadata_id
        WHERE 
          m.title LIKE ? OR
          c.content LIKE ? OR
          c.summary LIKE ?
        ORDER BY m.importance DESC, m.created_at DESC
        LIMIT 10
      `);
      
      const keywords = [`%${query}%`, `%${query}%`, `%${query}%`];
      const results = stmt.all(...keywords);
      
      db.close();
      
      return results.map(row => ({
        id: row.id.toString(),
        title: row.title,
        category: row.category,
        importance: row.importance,
        created_at: row.created_at,
        file_path: row.file_path,
        document: `${row.title}\n${row.content}`,
        metadata: {
          title: row.title,
          category: row.category,
          importance: row.importance,
          created_at: row.created_at,
          file_path: row.file_path
        },
        relevance: row.importance / 5 // 基于重要度的相关性
      }));
      
    } catch (error) {
      log(`⚠️ 关键词搜索失败: ${error.message}`);
      return [];
    }
  }
  
  /**
   * 统计信息
   */
  async getStats() {
    try {
      const count = await this.collection.count();
      return {
        totalMemories: count
      };
      
    } catch (error) {
      log(`⚠️ 获取统计信息失败: ${error.message}`);
      return { totalMemories: 0 };
    }
  }
}

// ============================================================
// 记忆优化器
// ============================================================

class MemoryOptimizer {
  constructor() {
    this.vectorSearcher = new VectorSearcher();
  }
  
  /**
   * 初始化
   */
  async initialize() {
    const success = await this.vectorSearcher.initialize();
    return success;
  }
  
  /**
   * 优化记忆
   */
  async optimize() {
    log('🔧 开始优化记忆...');
    
    try {
      // 1. 去重
      log('   📋 步骤 1: 去重...');
      const dedupResult = await this.deduplicate();
      log(`      ✅ 合并了 ${dedupResult.merged} 个重复记忆`);
      
      // 2. 评分
      log('   📋 步骤 2: 评分...');
      const scoreResult = await this.score();
      log(`      ✅ 评分了 ${scoreResult.scored} 个记忆`);
      
      // 3. 归档
      log('   📋 步骤 3: 归档...');
      const archiveResult = await this.archive();
      log(`      ✅ 归档了 ${archiveResult.archived} 个记忆`);
      
      // 4. 清理
      log('   📋 步骤 4: 清理...');
      const cleanResult = await this.clean();
      log(`      ✅ 清理了 ${cleanResult.deleted} 个记忆`);
      
      // 5. 生成报告
      log('   📋 步骤 5: 生成报告...');
      await this.generateReport({
        dedup: dedupResult,
        score: scoreResult,
        archive: archiveResult,
        clean: cleanResult
      });
      
      log('✅ 记忆优化完成');
      
      return {
        success: true,
        merged: dedupResult.merged,
        scored: scoreResult.scored,
        archived: archiveResult.archived,
        deleted: cleanResult.deleted
      };
      
    } catch (error) {
      log(`❌ 记忆优化失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 去重
   */
  async deduplicate() {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(CONFIG.dbFile);
      
      // 查找重复内容
      const stmt = db.prepare(`
        SELECT 
          content_hash,
          COUNT(*) as count,
          GROUP_CONCAT(id) as ids
        FROM metadata
        WHERE content_hash IS NOT NULL
        GROUP BY content_hash
        HAVING count > 1
      `);
      
      const duplicates = stmt.all();
      let merged = 0;
      
      for (const dup of duplicates) {
        const ids = dup.ids.split(',').map(id => parseInt(id));
        
        // 保留最新的一个，删除其他的
        ids.sort((a, b) => b - a);
        const keepId = ids[0];
        const deleteIds = ids.slice(1);
        
        for (const deleteId of deleteIds) {
          db.prepare('DELETE FROM metadata WHERE id = ?').run(deleteId);
          db.prepare('DELETE FROM content WHERE metadata_id = ?').run(deleteId);
          merged++;
        }
        
        // 删除向量数据库中的重复
        // TODO: 实现
      }
      
      db.close();
      
      return { merged };
      
    } catch (error) {
      log(`⚠️ 去重失败: ${error.message}`);
      return { merged: 0 };
    }
  }
  
  /**
   * 评分
   */
  async score() {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(CONFIG.dbFile);
      
      // 查找未评分的记忆
      const stmt = db.prepare(`
        SELECT id, title, created_at
        FROM metadata
        WHERE importance IS NULL OR importance = 0
      `);
      
      const unscored = stmt.all();
      let scored = 0;
      
      for (const memory of unscored) {
        // 基于规则评分
        let importance = 3; // 默认中等
        
        // 规则1: 越新的记忆越重要
        const daysSinceCreation = (Date.now() - new Date(memory.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 7) {
          importance += 1;
        }
        
        // 规则2: 包含"突破"、"重要"等关键词
        if (memory.title.includes('突破') || memory.title.includes('重要')) {
          importance += 1;
        }
        
        // 限制在 1-5 之间
        importance = Math.max(1, Math.min(5, importance));
        
        // 更新评分
        db.prepare('UPDATE metadata SET importance = ? WHERE id = ?').run(importance, memory.id);
        scored++;
      }
      
      db.close();
      
      return { scored };
      
    } catch (error) {
      log(`⚠️ 评分失败: ${error.message}`);
      return { scored: 0 };
    }
  }
  
  /**
   * 归档
   */
  async archive() {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(CONFIG.dbFile);
      
      // 查找需要归档的记忆（30天前，重要度 < 3）
      const archiveDate = new Date();
      archiveDate.setDate(archiveDate.getDate() - CONFIG.autoArchiveDays);
      
      const stmt = db.prepare(`
        UPDATE metadata
        SET category = 'archived'
        WHERE 
          created_at < ? AND
          importance < ?
      `);
      
      const result = stmt.run(archiveDate.toISOString(), CONFIG.minImportance);
      
      db.close();
      
      return { archived: result.changes };
      
    } catch (error) {
      log(`⚠️ 归档失败: ${error.message}`);
      return { archived: 0 };
    }
  }
  
  /**
   * 清理
   */
  async clean() {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(CONFIG.dbFile);
      
      // 删除访问次数过多的低质量记忆
      const stmt = db.prepare(`
        DELETE FROM metadata
        WHERE 
          importance < 2 AND
          access_count > ?
      `);
      
      const result = stmt.run(CONFIG.maxAccessCount);
      
      db.close();
      
      return { deleted: result.changes };
      
    } catch (error) {
      log(`⚠️ 清理失败: ${error.message}`);
      return { deleted: 0 };
    }
  }
  
  /**
   * 生成报告
   */
  async generateReport(results) {
    try {
      ensureDir(CONFIG.logsDir);
      
      const reportFile = path.join(CONFIG.logsDir, `memory-optimization-${timestamp()}.md`);
      
      const report = `# 记忆优化报告

**优化时间**: ${new Date().toLocaleString('zh-CN')}

## 优化结果

- 合并了 ${results.dedup.merged} 个重复记忆
- 评分了 ${results.score.scored} 个记忆
- 归档了 ${results.archive.archived} 个记忆
- 清理了 ${results.clean.deleted} 个记忆

## 统计信息

### 向量搜索统计
- 总记忆数: ${await this.vectorSearcher.getStats().totalMemories}

### SQLite 数据库统计
- TODO: 实现

## 建议

- 定期运行优化（建议每周）
- 监控记忆数量增长
- 及时清理低质量记忆

---

**生成时间**: ${new Date().toLocaleString('zh-CN')}
`;
      
      fs.writeFileSync(reportFile, report, 'utf8');
      log(`✅ 报告已生成: ${reportFile}`);
      
    } catch (error) {
      log(`⚠️ 生成报告失败: ${error.message}`);
    }
  }
  
  /**
   * 获取统计信息
   */
  async getStats() {
    try {
      const vectorStats = await this.vectorSearcher.getStats();
      
      const Database = require('better-sqlite3');
      const db = new Database(CONFIG.dbFile);
      
      const totalMemories = db.prepare('SELECT COUNT(*) as count FROM metadata').get();
      const importantMemories = db.prepare('SELECT COUNT(*) as count FROM metadata WHERE importance >= 4').get();
      const archivedMemories = db.prepare('SELECT COUNT(*) as count FROM metadata WHERE category = "archived"').get();
      
      db.close();
      
      return {
        totalMemories: totalMemories.count,
        importantMemories: importantMemories.count,
        archivedMemories: archivedMemories.count,
        vectorMemories: vectorStats.totalMemories
      };
      
    } catch (error) {
      log(`⚠️ 获取统计信息失败: ${error.message}`);
      return { totalMemories: 0, importantMemories: 0, archivedMemories: 0, vectorMemories: 0 };
    }
  }
}

// ============================================================
// CLI 入口
// ============================================================

async function main() {
  console.log('═'.repeat(60));
  console.log('  增强版记忆优化器 V1.0');
  console.log('═'.repeat(60));
  
  const optimizer = new MemoryOptimizer();
  const success = await optimizer.initialize();
  
  if (!success) {
    log('❌ 初始化失败');
    process.exit(1);
  }
  
  const args = process.argv.slice(2);
  const options = {};
  
  // 解析选项
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--vector-search' && args[i + 1]) {
      options.vectorSearch = args[++i];
    } else if (args[i] === '--hybrid-search' && args[i + 1]) {
      options.hybridSearch = args[++i];
    } else if (args[i] === '--optimize') {
      options.optimize = true;
    } else if (args[i] === '--stats') {
      options.stats = true;
    } else if (args[i] === '--recent') {
      options.recent = true;
    } else if (args[i] === '--important') {
      options.important = true;
    } else if (args[i] === '--category' && args[i + 1]) {
      options.category = args[++i];
    }
  }
  
  // 执行操作
  if (options.vectorSearch) {
    log(`🔍 向量搜索: ${options.vectorSearch}`);
    const results = await optimizer.vectorSearcher.vectorSearch(options.vectorSearch);
    log(`📊 找到 ${results.length} 个相关记忆`);
    results.forEach((result, index) => {
      log(`   ${index + 1}. ${result.metadata.title} (相似度: ${(1 - result.distance).toFixed(2)})`);
    });
    
  } else if (options.hybridSearch) {
    log(`🔍 混合搜索: ${options.hybridSearch}`);
    const results = await optimizer.vectorSearcher.hybridSearch(options.hybridSearch);
    log(`📊 找到 ${results.length} 个相关记忆`);
    results.forEach((result, index) => {
      log(`   ${index + 1}. [${result.type}] ${result.metadata.title} (分数: ${result.score.toFixed(2)})`);
    });
    
  } else if (options.optimize) {
    await optimizer.optimize();
    
  } else if (options.stats) {
    log('📊 统计信息:');
    const stats = await optimizer.getStats();
    log(`   总记忆数: ${stats.totalMemories}`);
    log(`   重要记忆数: ${stats.importantMemories}`);
    log(`   归档记忆数: ${stats.archivedMemories}`);
    log(`   向量记忆数: ${stats.vectorMemories}`);
    
  } else if (options.recent) {
    log('📋 最近记忆:');
    const results = await optimizer.vectorSearcher.keywordSearch('');
    results.slice(0, 10).forEach((result, index) => {
      log(`   ${index + 1}. ${result.title} (${new Date(result.created_at).toLocaleDateString('zh-CN')})`);
    });
    
  } else if (options.important) {
    log('📋 重要记忆:');
    const Database = require('better-sqlite3');
    const db = new Database(CONFIG.dbFile);
    
    const stmt = db.prepare(`
      SELECT title, importance, created_at
      FROM metadata
      WHERE importance >= 4
      ORDER BY importance DESC, created_at DESC
      LIMIT 10
    `);
    
    const results = stmt.all();
    results.forEach((result, index) => {
      log(`   ${index + 1}. ${result.title} (重要度: ${result.importance})`);
    });
    
    db.close();
    
  } else if (options.category) {
    log(`📋 分类: ${options.category}`);
    const Database = require('better-sqlite3');
    const db = new Database(CONFIG.dbFile);
    
    const stmt = db.prepare(`
      SELECT title, created_at
      FROM metadata
      WHERE category = ?
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    const results = stmt.all(options.category);
    results.forEach((result, index) => {
      log(`   ${index + 1}. ${result.title} (${new Date(result.created_at).toLocaleDateString('zh-CN')})`);
    });
    
    db.close();
    
  } else {
    // 默认：显示帮助
    console.log('\n📚 增强版记忆优化器 V1.0\n');
    console.log('使用方法:');
    console.log('  node scripts/enhanced-memory-optimizer.js [options]\n');
    console.log('选项:');
    console.log('  --vector-search "搜索内容"    # 向量搜索');
    console.log('  --hybrid-search "搜索内容"    # 混合搜索（关键词 + 语义）');
    console.log('  --optimize                    # 优化记忆');
    console.log('  --stats                       # 查看统计信息');
    console.log('  --recent                      # 最近记忆');
    console.log('  --important                   # 重要记忆');
    console.log('  --category "分类"             # 按分类查询\n');
    console.log('示例:');
    console.log('  node scripts/enhanced-memory-optimizer.js --hybrid-search "浏览器自动化"');
    console.log('  node scripts/enhanced-memory-optimizer.js --optimize');
    console.log('  node scripts/enhanced-memory-optimizer.js --stats\n');
  }
}

// ============================================================
// 执行主流程
// ============================================================

if (require.main === module) {
  main().catch(error => {
    console.error(`\n❌ 未捕获的错误: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { MemoryOptimizer, VectorSearcher };
