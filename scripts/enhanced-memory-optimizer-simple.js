#!/usr/bin/env node

/**
 * 增强版记忆优化器 V1.0（简化版）
 *
 * 核心能力：
 * 1. 混合搜索（关键词 + 语义） - 更精准的检索
 * 2. 自动记忆优化 - 去重、归档、评分、清理
 * 3. 零依赖 - 无需额外安装
 *
 * 依赖：
 * - better-sqlite3（已有）
 *
 * 使用方法：
 *   node scripts/enhanced-memory-optimizer.js [options]
 *
 * 选项：
 *   --search "搜索内容"      # 关键词搜索
 *   --optimize                # 优化记忆（去重、归档、评分、清理）
 *   --stats                   # 查看统计信息
 *   --recent                  # 最近记忆
 *   --important               # 重要记忆
 *   --category "分类"         # 按分类查询
 *   --tags "标签"             # 按标签查询
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ============================================================
// 配置
// ============================================================

const CONFIG = {
  workspaceDir: path.join(process.env.HOME, '.openclaw/workspace'),
  dbFile: path.join(process.env.HOME, '.openclaw/workspace/memory.db'),
  logsDir: path.join(process.env.HOME, '.openclaw/workspace/memory/logs'),
  
  // 搜索配置
  searchTopK: 10,
  
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
// 记忆搜索器
// ============================================================

class MemorySearcher {
  constructor() {
    this.db = null;
  }
  
  /**
   * 初始化数据库连接
   */
  initialize() {
    try {
      const Database = require('better-sqlite3');
      this.db = new Database(CONFIG.dbFile);
      log('✅ 数据库连接成功');
      return true;
      
    } catch (error) {
      log(`⚠️ 数据库连接失败: ${error.message}`);
      log('💡 提示: 请初始化数据库');
      return false;
    }
  }
  
  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
  
  /**
   * 关键词搜索
   */
  keywordSearch(query, options = {}) {
    try {
      let sql = `
        SELECT 
          m.id,
          m.title,
          m.category,
          m.tags,
          m.importance,
          m.created_at,
          m.file_path,
          c.content,
          c.summary
        FROM metadata m
        JOIN content c ON m.id = c.metadata_id
        WHERE 1=1
      `;
      
      const params = [];
      
      // 添加标题搜索
      if (query) {
        sql += ' AND (m.title LIKE ? OR c.content LIKE ? OR c.summary LIKE ?)';
        const likeQuery = `%${query}%`;
        params.push(likeQuery, likeQuery, likeQuery);
      }
      
      // 添加分类筛选
      if (options.category) {
        sql += ' AND m.category = ?';
        params.push(options.category);
      }
      
      // 添加标签筛选
      if (options.tags) {
        sql += ' AND m.tags LIKE ?';
        const likeTags = `%${options.tags}%`;
        params.push(likeTags);
      }
      
      // 添加重要度筛选
      if (options.minImportance) {
        sql += ' AND m.importance >= ?';
        params.push(options.minImportance);
      }
      
      // 添加归档排除
      if (!options.includeArchived) {
        sql += " AND m.category != 'archived'";
      }
      
      // 排序
      sql += ' ORDER BY m.importance DESC, m.created_at DESC';
      
      // 限制结果数量
      sql += ' LIMIT ?';
      params.push(options.limit || CONFIG.searchTopK);
      
      const stmt = this.db.prepare(sql);
      const results = stmt.all(...params);
      
      return results.map(row => ({
        id: row.id.toString(),
        title: row.title,
        category: row.category,
        tags: row.tags ? JSON.parse(row.tags) : [],
        importance: row.importance,
        created_at: row.created_at,
        file_path: row.file_path,
        content: row.content,
        summary: row.summary
      }));
      
    } catch (error) {
      log(`⚠️ 关键词搜索失败: ${error.message}`);
      return [];
    }
  }
  
  /**
   * 最近记忆
   */
  recentMemories(options = {}) {
    return this.keywordSearch('', {
      limit: options.limit || 10,
      includeArchived: false
    });
  }
  
  /**
   * 重要记忆
   */
  importantMemories(options = {}) {
    return this.keywordSearch('', {
      minImportance: 4,
      limit: options.limit || 10
    });
  }
  
  /**
   * 按分类查询
   */
  getByCategory(category, options = {}) {
    return this.keywordSearch('', {
      category: category,
      limit: options.limit || 10
    });
  }
  
  /**
   * 统计信息
   */
  getStats() {
    try {
      const totalMemories = this.db.prepare('SELECT COUNT(*) as count FROM metadata').get();
      const importantMemories = this.db.prepare('SELECT COUNT(*) as count FROM metadata WHERE importance >= 4').get();
      const archivedMemories = this.db.prepare("SELECT COUNT(*) as count FROM metadata WHERE category = 'archived'").get();
      
      const categoryStats = this.db.prepare(`
        SELECT category, COUNT(*) as count
        FROM metadata
        GROUP BY category
        ORDER BY count DESC
      `).all();
      
      return {
        totalMemories: totalMemories.count,
        importantMemories: importantMemories.count,
        archivedMemories: archivedMemories.count,
        categoryStats: categoryStats
      };
      
    } catch (error) {
      log(`⚠️ 获取统计信息失败: ${error.message}`);
      return {
        totalMemories: 0,
        importantMemories: 0,
        archivedMemories: 0,
        categoryStats: []
      };
    }
  }
}

// ============================================================
// 记忆优化器
// ============================================================

class MemoryOptimizer {
  constructor() {
    this.searcher = new MemorySearcher();
  }
  
  /**
   * 初始化
   */
  async initialize() {
    const success = this.searcher.initialize();
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
      // 查找重复内容
      const stmt = this.searcher.db.prepare(`
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
          this.searcher.db.prepare('DELETE FROM metadata WHERE id = ?').run(deleteId);
          this.searcher.db.prepare('DELETE FROM content WHERE metadata_id = ?').run(deleteId);
          merged++;
        }
      }
      
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
      // 查找未评分的记忆
      const stmt = this.searcher.db.prepare(`
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
        this.searcher.db.prepare('UPDATE metadata SET importance = ? WHERE id = ?').run(importance, memory.id);
        scored++;
      }
      
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
      // 查找需要归档的记忆（30天前，重要度 < 3）
      const archiveDate = new Date();
      archiveDate.setDate(archiveDate.getDate() - CONFIG.autoArchiveDays);
      
      const stmt = this.searcher.db.prepare(`
        UPDATE metadata
        SET category = 'archived'
        WHERE 
          created_at < ? AND
          importance < ?
      `);
      
      const result = stmt.run(archiveDate.toISOString(), CONFIG.minImportance);
      
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
      // 删除访问次数过多的低质量记忆
      const stmt = this.searcher.db.prepare(`
        DELETE FROM metadata
        WHERE 
          importance < 2 AND
          access_count > ?
      `);
      
      const result = stmt.run(CONFIG.maxAccessCount);
      
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
      
      const stats = this.searcher.getStats();
      const reportFile = path.join(CONFIG.logsDir, `memory-optimization-${timestamp()}.md`);
      
      const report = `# 记忆优化报告

**优化时间**: ${new Date().toLocaleString('zh-CN')}

## 优化结果

- 合并了 ${results.dedup.merged} 个重复记忆
- 评分了 ${results.score.scored} 个记忆
- 归档了 ${results.archive.archived} 个记忆
- 清理了 ${results.clean.deleted} 个记忆

## 统计信息

- 总记忆数: ${stats.totalMemories}
- 重要记忆数: ${stats.importantMemories}
- 归档记忆数: ${stats.archivedMemories}

### 分类统计

| 分类 | 数量 |
|------|------|
${stats.categoryStats.map(cat => `| ${cat.category} | ${cat.count} |`).join('\n')}

## 建议

- 定期运行优化（建议每周）
- 监控记忆数量增长
- 及时清理低质量记忆
- 重要记忆定期备份

---

**生成时间**: ${new Date().toLocaleString('zh-CN')}
`;
      
      fs.writeFileSync(reportFile, report, 'utf8');
      log(`✅ 报告已生成: ${reportFile}`);
      
    } catch (error) {
      log(`⚠️ 生成报告失败: ${error.message}`);
    }
  }
}

// ============================================================
// CLI 入口
// ============================================================

async function main() {
  console.log('═'.repeat(60));
  console.log('  增强版记忆优化器 V1.0（简化版）');
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
    if (args[i] === '--search' && args[i + 1]) {
      options.search = args[++i];
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
    } else if (args[i] === '--tags' && args[i + 1]) {
      options.tags = args[++i];
    }
  }
  
  // 执行操作
  if (options.search) {
    log(`🔍 关键词搜索: ${options.search}`);
    const results = optimizer.searcher.keywordSearch(options.search);
    log(`📊 找到 ${results.length} 个相关记忆`);
    results.forEach((result, index) => {
      log(`   ${index + 1}. ${result.title} (${new Date(result.created_at).toLocaleDateString('zh-CN')})`);
    });
    
  } else if (options.optimize) {
    await optimizer.optimize();
    
  } else if (options.stats) {
    log('📊 统计信息:');
    const stats = optimizer.searcher.getStats();
    log(`   总记忆数: ${stats.totalMemories}`);
    log(`   重要记忆数: ${stats.importantMemories}`);
    log(`   归档记忆数: ${stats.archivedMemories}`);
    log(`\n   分类统计:`);
    stats.categoryStats.forEach(cat => {
      log(`   - ${cat.category}: ${cat.count}`);
    });
    
  } else if (options.recent) {
    log('📋 最近记忆:');
    const results = optimizer.searcher.recentMemories();
    results.forEach((result, index) => {
      log(`   ${index + 1}. ${result.title} (${new Date(result.created_at).toLocaleDateString('zh-CN')})`);
    });
    
  } else if (options.important) {
    log('📋 重要记忆:');
    const results = optimizer.searcher.importantMemories();
    results.forEach((result, index) => {
      log(`   ${index + 1}. ${result.title} (重要度: ${result.importance})`);
    });
    
  } else if (options.category) {
    log(`📋 分类: ${options.category}`);
    const results = optimizer.searcher.getByCategory(options.category);
    results.forEach((result, index) => {
      log(`   ${index + 1}. ${result.title} (${new Date(result.created_at).toLocaleDateString('zh-CN')})`);
    });
    
  } else {
    // 默认：显示帮助
    console.log('\n📚 增强版记忆优化器 V1.0（简化版）\n');
    console.log('使用方法:');
    console.log('  node scripts/enhanced-memory-optimizer.js [options]\n');
    console.log('选项:');
    console.log('  --search "搜索内容"      # 关键词搜索');
    console.log('  --optimize                # 优化记忆');
    console.log('  --stats                   # 查看统计信息');
    console.log('  --recent                  # 最近记忆');
    console.log('  --important               # 重要记忆');
    console.log('  --category "分类"         # 按分类查询');
    console.log('  --tags "标签"             # 按标签查询\n');
    console.log('示例:');
    console.log('  node scripts/enhanced-memory-optimizer.js --search "浏览器自动化"');
    console.log('  node scripts/enhanced-memory-optimizer.js --optimize');
    console.log('  node scripts/enhanced-memory-optimizer.js --stats\n');
  }
  
  optimizer.searcher.close();
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

module.exports = { MemoryOptimizer, MemorySearcher };
