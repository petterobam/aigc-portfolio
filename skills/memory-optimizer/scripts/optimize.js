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

// 引入共享配置
const CONFIG = require('./config.js');
const { DB_CONFIG, OPTIMIZE_CONFIG, REPORT_ARCHIVE_CONFIG } = CONFIG;

const DB_PATH = DB_CONFIG.dbPath;
const REPORT_PATH = path.join(DB_CONFIG.dataDir, 'memory-optimization-report.json');
const REPORTS_DIR = DB_CONFIG.reportsDir;

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
 *
 * 改进版评分算法（v2.1）：
 * 1. 引入 category 权重（从配置文件读取）
 * 2. 引入标题质量评分（从配置文件读取阈值）
 * 3. 引入关键词密度（爽点、公式、总结等）
 * 4. 优化内容质量权重（从配置文件读取分段配置）
 * 5. 降低对访问频率的依赖（在没有访问追踪时也能评分）
 * 6. 使用共享配置文件中的权重和阈值
 */
function calculateImportance(memory) {
  const weights = OPTIMIZE_CONFIG.scoreWeights;

  // 1. 访问频率（权重 0.25，降低以适应初始数据）
  const accessFrequency = memory.access_count / Math.max(1, memory.age_days);

  // 2. 时效性（权重 0.20）
  const recency = 1 / Math.max(1, memory.days_since_last_access);

  // 3. 内容质量（权重 0.25，使用配置中的分段）
  let contentQuality;
  const segments = OPTIMIZE_CONFIG.contentQualitySegments;
  for (const segment of segments) {
    if (memory.content_length < segment.maxLength) {
      contentQuality = segment.score;
      break;
    }
  }

  // 4. 标题质量（权重 0.15，使用配置中的阈值）
  const titleLength = memory.title ? memory.title.length : 0;
  const titleConfig = OPTIMIZE_CONFIG.titleQuality;
  let titleQuality;
  if (titleLength === 0) {
    titleQuality = titleConfig.noTitleScore;
  } else if (titleLength < titleConfig.idealMin) {
    titleQuality = titleConfig.tooShortScore;
  } else if (titleLength <= titleConfig.idealMax) {
    titleQuality = titleConfig.idealScore;
  } else {
    titleQuality = titleConfig.tooLongScore;
  }

  // 5. 关键词密度（权重 0.10，新增）
  const keywords = ['爽点', '公式', '总结', '洞察', '突破', '优化', '经验', '教训'];
  const contentLower = memory.content.toLowerCase();
  const keywordCount = keywords.filter(kw => contentLower.includes(kw)).length;
  const keywordDensity = Math.min(1, keywordCount * 0.3);  // 每个关键词 +0.3 分，最高 1

  // 6. 分类权重（从配置文件读取）
  const categoryWeights = OPTIMIZE_CONFIG.categoryWeights;
  const categoryWeight = categoryWeights[memory.category] || 1.0;

  // 综合评分
  const baseScore = (accessFrequency * weights.accessFrequency)
                  + (recency * weights.recency)
                  + (contentQuality * weights.contentQuality)
                  + (titleQuality * weights.titleQuality)
                  + (keywordDensity * weights.keywordDensity);

  // 应用分类权重
  const finalScore = baseScore * categoryWeight;

  // 归一化到 0-5 范围
  return Math.min(5, Math.max(0, finalScore));
}

/**
 * 获取所有记忆
 *
 * 修复版：改用更简单的时间差计算方式
 * julianday 可能在某些环境下计算不准确，改用应用层计算
 */
function getAllMemories() {
  const rows = db.prepare(`
    SELECT
      m.id, m.title, m.category, m.tags, m.importance,
      m.access_count, m.created_at, m.updated_at, m.last_accessed,
      c.content,
      LENGTH(c.content) as content_length
    FROM metadata m
    JOIN content c ON m.id = c.metadata_id
    WHERE m.category != 'archived'
    ORDER BY m.created_at DESC
  `).all();

  // 在应用层计算天数（更可靠）
  const now = new Date();
  rows.forEach(row => {
    const createdAt = new Date(row.created_at);
    const updatedAt = new Date(row.updated_at);

    // 计算天数（毫秒差 / (1000 * 60 * 60 * 24)）
    row.age_days = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    row.days_since_last_access = row.last_accessed
      ? Math.floor((now - new Date(row.last_accessed)) / (1000 * 60 * 60 * 24))
      : row.days_since_last_access;

    // 确保最小值为 0
    row.age_days = Math.max(0, row.age_days);
    row.days_since_last_access = Math.max(0, row.days_since_last_access);
  });

  return rows;
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
    // 使用 combined_days 作为归档时间基准
    // combined_days = max(age_days, days_since_last_access)
    // 原因：
    // 1. 访问追踪系统会定期更新 last_accessed，导致归档逻辑永远不会触发（如果只用 last_accessed）
    // 2. 数据库恢复后 created_at 被更新，导致归档逻辑失效（如果只用 age_days）
    // 3. 使用 max(age_days, days_since_last_access) 可以兼顾两种情况
    const age_days = memory.age_days;
    const days_since_last_access = memory.days_since_last_access;
    const combined_days = Math.max(age_days, days_since_last_access);

    const importance = memory.importance;
    const tags = JSON.parse(memory.tags || '[]');

    // 检查是否受保护
    if (tags.includes(OPTIMIZE_CONFIG.protectedTag)) {
      stats.protected++;
      return;
    }

    // 归档条件：超过阈值（年龄或最后访问）且重要性评分低
    if (combined_days > OPTIMIZE_CONFIG.archiveAfterDays && importance < OPTIMIZE_CONFIG.minImportance) {
      db.prepare(`
        UPDATE metadata
        SET category = 'archived'
        WHERE id = ?
      `).run(memory.id);

      stats.archived++;
      const reason = age_days >= days_since_last_access ? '年龄' : '最后访问';
      console.log(`  📦 归档: ${memory.title} (${reason} ${combined_days} 天, 评分 ${importance.toFixed(2)})`);
    }
  });
}

/**
 * 清理低质量记忆
 */
function cleanLowQualityMemories(memories) {
  if (!OPTIMIZE_CONFIG.deleteArchived) return;

  memories.forEach(memory => {
    const contentLength = memory.content_length;
    const tags = JSON.parse(memory.tags || '[]');
    const importance = memory.importance;

    // 检查是否受保护
    if (tags.includes(OPTIMIZE_CONFIG.protectedTag)) {
      return;
    }

    // 删除条件
    if (contentLength < OPTIMIZE_CONFIG.minContentLength && importance < 1) {
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
    const importanceDiff = Math.abs(newImportance - oldImportance);

    // 只更新评分变化超过阈值的（使用配置中的阈值）
    if (importanceDiff > OPTIMIZE_CONFIG.scoreUpdateThreshold) {
      db.prepare(`
        UPDATE metadata
        SET importance = ?
        WHERE id = ?
      `).run(Math.round(newImportance * 10) / 10, memory.id);

      stats.importanceUpdated++;

      // 记录评分变化（用于调试）
      if (stats.importanceUpdated <= 5) {  // 只记录前 5 个
        console.log(`  📊 ${memory.title}: ${oldImportance} → ${newImportance.toFixed(2)} (diff: ${importanceDiff.toFixed(2)})`);
      }
    }
  });

  if (stats.importanceUpdated > 5) {
    console.log(`  📊 ... 共更新 ${stats.importanceUpdated} 条记忆的评分`);
  }
}

/**
 * 生成优化报告
 */
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    config: OPTIMIZE_CONFIG,
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

/**
 * 归档优化报告
 * 将报告复制到 reports/ 目录，文件名包含时间戳
 * 自动清理超过 4 周的报告（使用共享配置）
 */
function archiveReport(report) {
  const now = new Date();
  const timestamp = now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + '-' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  const archivedReportPath = path.join(REPORTS_DIR, `${timestamp}-report.json`);

  try {
    // 确保 reports/ 目录存在
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    // 复制报告到 reports/ 目录
    fs.copyFileSync(REPORT_PATH, archivedReportPath);
    console.log(`📦 报告已归档: ${archivedReportPath}`);

    // 清理超过 4 周的报告（使用共享配置）
    const retentionMs = REPORT_ARCHIVE_CONFIG.retentionWeeks * 7 * 24 * 60 * 60 * 1000;
    const fourWeeksAgo = now.getTime() - retentionMs;
    const reportFiles = fs.readdirSync(REPORTS_DIR)
      .filter(file => file.endsWith('-report.json'))
      .map(file => {
        const filePath = path.join(REPORTS_DIR, file);
        const stats = fs.statSync(filePath);
        return { file, path: filePath, mtime: stats.mtime.getTime() };
      })
      .sort((a, b) => b.mtime - a.mtime); // 按修改时间降序排列

    let deletedCount = 0;
    reportFiles.forEach(({ file, path, mtime }) => {
      if (mtime < fourWeeksAgo && file !== path.basename(archivedReportPath)) {
        fs.unlinkSync(path);
        console.log(`🗑️  删除过期报告: ${file}`);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      console.log(`🧹 清理了 ${deletedCount} 个过期报告`);
    }

    // 更新历史报告索引（reports/README.md）
    updateReportIndex(report, timestamp);

  } catch (error) {
    console.error('❌ 报告归档失败:', error.message);
  }
}

/**
 * 更新历史报告索引
 * 在 reports/README.md 中添加新的报告记录
 */
function updateReportIndex(report, timestamp) {
  const readmePath = path.join(REPORTS_DIR, 'README.md');

  try {
    let readmeContent = '';
    if (fs.existsSync(readmePath)) {
      readmeContent = fs.readFileSync(readmePath, 'utf8');
    }

    // 查找历史报告索引表格的起始位置
    const headerLine = '| 编号 | 执行时间 | 总记忆数 | 归档数 | 删除数 | 优化率 | 文件名 |';
    const separatorLine = '|------|---------|---------|-------|-------|-------|-------|';

    if (readmeContent.includes(headerLine)) {
      // 找到表格的结束位置（下一个 ## 标题或文件结尾）
      const headerIndex = readmeContent.indexOf(headerLine);
      const tableStartIndex = readmeContent.indexOf('\n|', headerIndex) + 1; // 跳过分隔符

      // 查找表格的结束位置
      let tableEndIndex = readmeContent.indexOf('\n\n##', headerIndex);
      if (tableEndIndex === -1) {
        tableEndIndex = readmeContent.indexOf('\n---', headerIndex);
        if (tableEndIndex === -1) {
          tableEndIndex = readmeContent.length;
        }
      }

      // 提取表格内容
      const beforeTable = readmeContent.slice(0, tableStartIndex);
      const afterTable = readmeContent.slice(tableEndIndex);

      let tableContent = readmeContent.slice(tableStartIndex, tableEndIndex);

      // 找到最大编号
      let nextNumber = 1;
      if (!tableContent.includes('初始化，尚未运行')) {
        // 解析现有表格行，找到最大编号
        const lines = tableContent.split('\n').filter(line => line.trim().startsWith('|'));
        lines.forEach(line => {
          const match = line.match(/^\|\s*(\d+)\s*\|/);
          if (match) {
            const num = parseInt(match[1]);
            if (!isNaN(num) && num >= nextNumber) {
              nextNumber = num + 1;
            }
          }
        });
      }

      // 构建新的表格行（编号、执行时间、总记忆数、归档数、删除数、优化率、文件名）
      const newTableRow = `| ${nextNumber} | ${report.timestamp} | ${report.stats.totalProcessed} | ${report.stats.archived} | ${report.stats.deleted} | ${report.summary.optimizationRate} | ${timestamp}-report.json |\n`;

      // 查找"初始化，尚未运行"行，如果存在则替换
      if (tableContent.includes('初始化，尚未运行')) {
        tableContent = tableContent.replace(/\| — \| 初始化，尚未运行 \|[^\n]*\n/, newTableRow);
      } else {
        // 否则在表头后插入新行
        tableContent = newTableRow + tableContent;
      }

      // 重新组合内容
      const newContent = beforeTable + tableContent + afterTable;
      fs.writeFileSync(readmePath, newContent, 'utf8');
    } else {
      console.log('⚠️  未找到历史报告索引表格，跳过更新');
    }

    console.log('📝 历史报告索引已更新');
  } catch (error) {
    console.error('❌ 更新历史报告索引失败:', error.message);
  }
}

// 主流程（支持异步）
async function main() {
  console.log('📊 扫描所有记忆...');
  const memories = getAllMemories();
  stats.totalProcessed = memories.length;
  console.log(`找到 ${memories.length} 条记忆\n`);

  console.log('🔍 识别重复记忆（内容哈希）...');
  const duplicates = findDuplicates(memories);
  stats.duplicate = duplicates.length;
  if (duplicates.length > 0) {
    console.log(`发现 ${duplicates.length} 个重复记忆`);
    duplicates.forEach(dup => {
      console.log(`  - "${dup.duplicate.title}" 与 "${dup.original.title}" 重复`);
    });
  }
  console.log('');

  // 向量去重（v2.0.0：支持 Ollama 和 OpenAI 双方案）
  if (OPTIMIZE_CONFIG.enableVectorDedup) {
    try {
      if (OPTIMIZE_CONFIG.ollamaEnabled) {
        // 优先使用 Ollama（本地向量生成，零成本）
        console.log('🧠 识别语义重复记忆（Ollama 向量相似度）...');
        const OllamaEmbeddings = require('./ollama-embeddings');
        const ollamaDeduplicator = new OllamaEmbeddings(db, {
          model: OPTIMIZE_CONFIG.ollamaModel,
          apiUrl: OPTIMIZE_CONFIG.ollamaApiUrl
        });
        const vectorDuplicates = await ollamaDeduplicator.findDuplicates(memories);

        stats.vectorDuplicate = vectorDuplicates.length;

        if (vectorDuplicates.length > 0) {
          console.log(`发现 ${vectorDuplicates.length} 组语义重复记忆`);
          vectorDuplicates.forEach(dup => {
            console.log(`  - [${dup.memoryA.id}] "${dup.memoryA.title}" 与 [${dup.memoryB.id}] "${dup.memoryB.title}" 相似度: ${(dup.similarity * 100).toFixed(2)}%`);
          });
        }
        console.log('');

        // 保存向量到数据库（可选）
        if (OPTIMIZE_CONFIG.vectorSaveToDB) {
          const allMemoriesWithEmbeddings = await ollamaDeduplicator.generateEmbeddingsBatch(memories);
          ollamaDeduplicator.saveEmbeddingsBatch(allMemoriesWithEmbeddings);
        }
      } else if (OPTIMIZE_CONFIG.openaiApiKey) {
        // 降级使用 OpenAI（需要 API Key）
        console.log('🧠 识别语义重复记忆（OpenAI 向量相似度）...');
        const { VectorDeduplicator } = require('./vector-deduplicator');
        const vectorDeduplicator = new VectorDeduplicator(db, OPTIMIZE_CONFIG.openaiApiKey);
        const vectorDuplicates = await vectorDeduplicator.findDuplicates(memories);

        stats.vectorDuplicate = vectorDuplicates.length;

        if (vectorDuplicates.length > 0) {
          console.log(`发现 ${vectorDuplicates.length} 组语义重复记忆`);
          vectorDuplicates.forEach(dup => {
            console.log(`  - "${dup.original.title}" 有 ${dup.duplicateCount} 条相似记忆`);
            dup.similar.forEach(sim => {
              console.log(`    └─ 相似度 ${sim.similarity.toFixed(4)}: "${sim.title}"`);
            });
          });
        }
        console.log('');

        // 保存向量到数据库（可选）
        if (OPTIMIZE_CONFIG.vectorSaveToDB) {
          const allMemoriesWithEmbeddings = await vectorDeduplicator.generateEmbeddingsBatch(memories);
          vectorDeduplicator.saveEmbeddingsBatch(allMemoriesWithEmbeddings);
        }
      } else {
        console.log('⚠️  向量去重已启用，但未配置 Ollama 或 OpenAI API Key，跳过向量去重\n');
        console.log('💡 提示：');
        console.log('  - 方案 1（推荐）：确保 Ollama 正在运行（`ollama serve`）');
        console.log('  - 方案 2：配置 OPENAI_API_KEY 环境变量\n');
      }
    } catch (error) {
      console.error('❌ 向量去重失败:', error.message);
      console.log('');
    }
  }

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

  console.log('📦 归档优化报告...');
  archiveReport(report);

  console.log('\n============================================================');
  console.log('  优化完成');
  console.log('============================================================\n');

  console.log('📊 优化统计：');
  console.log(`  - 总处理数: ${stats.totalProcessed}`);
  console.log(`  - 已归档: ${stats.archived}`);
  console.log(`  - 已删除: ${stats.deleted}`);
  console.log(`  - 受保护: ${stats.protected}`);
  console.log(`  - 重复记忆（哈希）: ${stats.duplicate}`);
  console.log(`  - 语义重复（向量）: ${stats.vectorDuplicate || 0}`);
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
}

// 启动主流程
main().catch(error => {
  console.error('❌ 执行失败:', error);
  process.exit(1);
});
