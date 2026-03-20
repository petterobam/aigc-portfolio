#!/usr/bin/env node

/**
 * 记忆优化脚本
 *
 * 功能：
 * 1. 计算记忆重要性评分
 * 2. 识别重复记忆（内容哈希）
 * 3. 归档过期记忆
 * 4. 清理低质量记忆
 * 5. 生成优化报告
 *
 * 使用方法：
 * node skills/memory-optimizer/scripts/optimize.js
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const DB_PATH = path.join(WORKSPACE_DIR, 'memory.db');
const REPORT_PATH = path.join(WORKSPACE_DIR, 'data', 'memory-optimization-report.json');

// 配置
const CONFIG = {
  archiveAfterDays: 30,        // 归档超过 30 天的记忆
  minImportance: 2,            // 重要性低于 2 的记忆可能被归档
  minContentLength: 50,        // 内容少于 50 字符的记忆可能被删除
  protectedTag: 'protected',   // 带有此标签的记忆不会被优化
  deleteArchived: false        // 是否删除已归档的记忆
};

console.log('============================================================');
console.log('  记忆优化器');
console.log('============================================================\n');

const db = new Database(DB_PATH);

// 统计信息
const stats = {
  totalProcessed: 0,
  archived: 0,
  deleted: 0,
  protected: 0,
  lowQuality: 0,
  duplicate: 0,
  importanceUpdated: 0
};

/**
 * 计算重要性评分
 */
function calculateImportance(memory) {
  const accessFrequency = memory.access_count / Math.max(1, memory.age_days);
  const recency = 1 / Math.max(1, memory.days_since_last_access);
  const contentQuality = Math.min(1, memory.content_length / 1000);
  const referenceCount = memory.reference_count || 0;
  
  return (accessFrequency * 0.4)
       + (recency * 0.3)
       + (contentQuality * 0.2)
       + (referenceCount * 0.1);
}

/**
 * 获取所有记忆
 */
function getAllMemories() {
  return db.prepare(`
    SELECT 
      m.id, m.title, m.category, m.tags, m.importance, 
      m.access_count, m.created_at, m.updated_at,
      c.content,
      CAST((julianday('now') - julianday(m.created_at)) AS INTEGER) as age_days,
      CAST((julianday('now') - julianday(m.updated_at)) AS INTEGER) as days_since_last_access,
      LENGTH(c.content) as content_length
    FROM metadata m
    JOIN content c ON m.id = c.metadata_id
    WHERE m.category != 'archived'
    ORDER BY m.created_at DESC
  `).all();
}

/**
 * 识别重复记忆（内容哈希）
 */
function findDuplicates(memories) {
  const hashMap = new Map();
  const duplicates = [];
  
  memories.forEach(memory => {
    const hash = crypto.createHash('md5').update(memory.content).digest('hex');
    
    if (hashMap.has(hash)) {
      duplicates.push({
        original: hashMap.get(hash),
        duplicate: memory
      });
    } else {
      hashMap.set(hash, memory);
    }
  });
  
  return duplicates;
}

/**
 * 归档过期记忆
 */
function archiveOldMemories(memories) {
  memories.forEach(memory => {
    const daysSinceUpdate = memory.days_since_last_access;
    const importance = memory.importance;
    const tags = JSON.parse(memory.tags || '[]');
    
    // 检查是否受保护
    if (tags.includes(CONFIG.protectedTag)) {
      stats.protected++;
      return;
    }
    
    // 归档条件
    if (daysSinceUpdate > CONFIG.archiveAfterDays && importance < CONFIG.minImportance) {
      db.prepare(`
        UPDATE metadata 
        SET category = 'archived' 
        WHERE id = ?
      `).run(memory.id);
      
      stats.archived++;
      console.log(`  📦 归档: ${memory.title} (${daysSinceUpdate} 天未访问)`);
    }
  });
}

/**
 * 清理低质量记忆
 */
function cleanLowQualityMemories(memories) {
  if (!CONFIG.deleteArchived) return;
  
  memories.forEach(memory => {
    const contentLength = memory.content_length;
    const tags = JSON.parse(memory.tags || '[]');
    const importance = memory.importance;
    
    // 检查是否受保护
    if (tags.includes(CONFIG.protectedTag)) {
      return;
    }
    
    // 删除条件
    if (contentLength < CONFIG.minContentLength && importance < 1) {
      db.prepare(`DELETE FROM metadata WHERE id = ?`).run(memory.id);
      db.prepare(`DELETE FROM content WHERE metadata_id = ?`).run(memory.id);
      
      stats.deleted++;
      stats.lowQuality++;
      console.log(`  🗑️ 删除低质量: ${memory.title} (仅 ${contentLength} 字符)`);
    }
  });
}

/**
 * 更新重要性评分
 */
function updateImportance(memories) {
  memories.forEach(memory => {
    const newImportance = calculateImportance(memory);
    const oldImportance = memory.importance;
    
    // 只更新评分变化较大的
    if (Math.abs(newImportance - oldImportance) > 0.5) {
      db.prepare(`
        UPDATE metadata 
        SET importance = ? 
        WHERE id = ?
      `).run(Math.round(newImportance * 10) / 10, memory.id);
      
      stats.importanceUpdated++;
    }
  });
}

/**
 * 生成优化报告
 */
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    stats: stats,
    summary: {
      totalProcessed: stats.totalProcessed,
      archived: stats.archived,
      deleted: stats.deleted,
      protected: stats.protected,
      optimizationRate: ((stats.archived + stats.deleted) / stats.totalProcessed * 100).toFixed(2) + '%'
    },
    recommendations: []
  };
  
  // 生成建议
  if (stats.archived > 5) {
    report.recommendations.push({
      type: 'info',
      message: `归档了 ${stats.archived} 个过期记忆，建议定期检查是否需要恢复`
    });
  }
  
  if (stats.protected > 0) {
    report.recommendations.push({
      type: 'info',
      message: `${stats.protected} 个记忆受保护，未被优化`
    });
  }
  
  if (stats.lowQuality > 0) {
    report.recommendations.push({
      type: 'warning',
      message: `发现 ${stats.lowQuality} 个低质量记忆，建议检查内容质量`
    });
  }
  
  // 保存报告
  const reportDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  
  return report;
}

// 主流程
console.log('📊 扫描所有记忆...');
const memories = getAllMemories();
stats.totalProcessed = memories.length;
console.log(`找到 ${memories.length} 条记忆\n`);

console.log('🔍 识别重复记忆...');
const duplicates = findDuplicates(memories);
stats.duplicate = duplicates.length;
if (duplicates.length > 0) {
  console.log(`发现 ${duplicates.length} 个重复记忆`);
  duplicates.forEach(dup => {
    console.log(`  - "${dup.duplicate.title}" 与 "${dup.original.title}" 重复`);
  });
}
console.log('');

console.log('📊 更新重要性评分...');
updateImportance(memories);
console.log(`更新了 ${stats.importanceUpdated} 条记忆的评分\n`);

console.log('📦 归档过期记忆...');
archiveOldMemories(memories);
console.log(`归档了 ${stats.archived} 条记忆\n`);

console.log('🗑️ 清理低质量记忆...');
cleanLowQualityMemories(memories);
console.log(`删除了 ${stats.deleted} 条记忆\n`);

console.log('📄 生成优化报告...');
const report = generateReport();

console.log('\n============================================================');
console.log('  优化完成');
console.log('============================================================\n');

console.log('📊 优化统计：');
console.log(`  - 总处理数: ${stats.totalProcessed}`);
console.log(`  - 已归档: ${stats.archived}`);
console.log(`  - 已删除: ${stats.deleted}`);
console.log(`  - 受保护: ${stats.protected}`);
console.log(`  - 重复记忆: ${stats.duplicate}`);
console.log(`  - 评分更新: ${stats.importanceUpdated}`);
console.log(`  - 优化率: ${report.summary.optimizationRate}\n`);

console.log(`📄 报告已保存: ${REPORT_PATH}\n`);

if (report.recommendations.length > 0) {
  console.log('💡 建议：');
  report.recommendations.forEach(rec => {
    const emoji = rec.type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`  ${emoji} ${rec.message}`);
  });
}

db.close();
