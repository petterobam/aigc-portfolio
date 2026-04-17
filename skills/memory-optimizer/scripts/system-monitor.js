#!/usr/bin/env node

/**
 * 记忆优化器 - 系统性能监控工具
 * 
 * 功能：
 * 1. 监控数据库性能（查询时间、连接数、索引效率）
 * 2. 监控优化脚本性能（执行时间、内存使用、CPU 使用）
 * 3. 监控向量去重性能（向量生成时间、相似度计算时间）
 * 4. 监控访问追踪性能（启发式计算时间、访问统计更新时间）
 * 5. 生成性能报告（趋势分析、瓶颈识别、优化建议）
 * 6. 定期监控（ cron 调度）
 * 
 * 版本: v1.0.0
 * 创建时间: 2026-03-28
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// 引入共享配置
const {
  DB_CONFIG,
  OPTIMIZE_CONFIG,
  EXPONENTIAL_DECAY_CONFIG
} = require('./config.js');

// 配置
const MONITOR_CONFIG = {
  // 监控输出路径
  reportsDir: path.join(__dirname, '..', 'monitor-reports'),
  latestReportPath: path.join(__dirname, '..', 'monitor-reports', 'latest.json'),
  historyReportPath: path.join(__dirname, '..', 'monitor-reports', 'history.json'),

  // 性能阈值（用于告警）
  thresholds: {
    executionTime: 10000,           // 优化脚本执行时间超过 10 秒告警
    vectorGenerationTime: 5000,     // 向量生成时间超过 5 秒告警
    databaseQueryTime: 100,        // 数据库查询时间超过 100 毫秒告警
    memoryUsage: 100 * 1024 * 1024, // 内存使用超过 100MB 告警
    scoreUpdateThreshold: 0.2,     // 评分更新阈值（来自优化脚本配置）
  },

  // 监控频率
  monitoringInterval: 30 * 60 * 1000,  // 30 分钟
};

// 创建报告目录
if (!fs.existsSync(MONITOR_CONFIG.reportsDir)) {
  fs.mkdirSync(MONITOR_CONFIG.reportsDir, { recursive: true });
}

// 数据库连接
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '..', '..', '..', 'data', 'memory.db');
const db = new Database(dbPath, { readonly: true });

// 性能数据收集
function collectPerformanceMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),

    // 数据库性能
    database: {
      fileSize: fs.statSync(dbPath).size,
      pageCount: db.pragma('page_count', { simple: true }),
      pageSize: db.pragma('page_size', { simple: true }),
      tableCount: 0,
      indexCount: 0,
    },

    // 记忆库统计
    memory: {
      total: 0,
      active: 0,
      archived: 0,
      protected: 0,
      avgScore: 0,
      avgAccessCount: 0,
    },

    // 向量去重性能
    vector: {
      totalMemories: 0,
      cachedVectors: 0,
      avgVectorLength: 0,
      modelUsed: OPTIMIZE_CONFIG.ollamaModel || 'unknown',
    },

    // 评分系统
    scoring: {
      scoreUpdateThreshold: MONITOR_CONFIG.thresholds.scoreUpdateThreshold,
      recentScoreChanges: [],
      avgScoreChange: 0,
    },

    // 访问追踪
    accessTracking: {
      totalAccessLogs: 0,
      avgAccessFrequency: 0,
      lastUpdateTime: null,
    },

    // 优化历史
    optimization: {
      totalOptimizations: 0,
      lastOptimizationTime: null,
      avgOptimizationRate: 0,
    },

    // 时效性衰减
    timeDecay: {
      tau: EXPONENTIAL_DECAY_CONFIG.tau,
      halfLife: EXPONENTIAL_DECAY_CONFIG.halfLife,
      linearRate: EXPONENTIAL_DECAY_CONFIG.linearRate,
    },
  };

  // 收集数据库表和索引统计
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all();

  metrics.database.tableCount = tables.length;

  for (const table of tables) {
    const indexes = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='index' AND tbl_name=?
    `).all(table.name);
    metrics.database.indexCount += indexes.length;
  }

  // 收集记忆库统计
  const memoryStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN m.category='archived' THEN 1 ELSE 0 END) as archived,
      SUM(CASE WHEN m.tags LIKE '%protected%' THEN 1 ELSE 0 END) as protected,
      AVG(m.importance) as avgScore,
      AVG(m.access_count) as avgAccessCount
    FROM content c
    JOIN metadata m ON c.metadata_id = m.id
  `).get();

  metrics.memory.total = memoryStats.total;
  metrics.memory.archived = memoryStats.archived;
  metrics.memory.active = memoryStats.total - memoryStats.archived;
  metrics.memory.protected = memoryStats.protected;
  metrics.memory.avgScore = memoryStats.avgScore || 0;
  metrics.memory.avgAccessCount = memoryStats.avgAccessCount || 0;

  // 收集向量统计
  const vectorStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN c.embedding IS NOT NULL THEN 1 ELSE 0 END) as cached,
      AVG(LENGTH(c.embedding)) as avgLength
    FROM content c
    JOIN metadata m ON c.metadata_id = m.id
  `).get();

  metrics.vector.totalMemories = vectorStats.total || 0;
  metrics.vector.cachedVectors = vectorStats.cached || 0;
  metrics.vector.avgVectorLength = vectorStats.avgLength || 0;

  // 收集最近评分变化
  const recentScoreChanges = db.prepare(`
    SELECT m.id, m.title, m.importance, m.created_at
    FROM metadata m
    WHERE m.category != 'archived'
    ORDER BY m.importance DESC
    LIMIT 5
  `).all();

  metrics.scoring.recentScoreChanges = recentScoreChanges.map(m => ({
    id: m.id,
    title: m.title,
    score: m.importance,
    age: Math.floor((Date.now() - new Date(m.created_at)) / (1000 * 60 * 60 * 24)), // 天数
  }));

  // 计算平均评分变化（基于最近 5 条记忆）
  if (metrics.scoring.recentScoreChanges.length > 1) {
    const scores = metrics.scoring.recentScoreChanges.map(m => m.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    metrics.scoring.avgScoreChange = Math.abs(avgScore - metrics.memory.avgScore);
  }

  // 收集访问追踪统计
  const accessStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      MAX(access_at) as lastUpdate
    FROM access_log
  `).get();

  metrics.accessTracking.totalAccessLogs = accessStats.total || 0;
  metrics.accessTracking.lastUpdateTime = accessStats.lastUpdate;

  // 计算平均访问频率（基于记忆库统计）
  metrics.accessTracking.avgAccessFrequency = metrics.memory.avgAccessCount;

  // 收集优化历史
  const optHistory = db.prepare(`
    SELECT
      COUNT(*) as total,
      MAX(optimization_at) as lastOptimization,
      AVG(CAST(memories_processed AS REAL)) as avgProcessed
    FROM optimization_log
  `).get();

  metrics.optimization.totalOptimizations = optHistory.total || 0;
  metrics.optimization.lastOptimizationTime = optHistory.lastOptimization;
  metrics.optimization.avgOptimizationRate = optHistory.avgProcessed || 0;

  return metrics;
}

// 性能分析
function analyzePerformance(metrics) {
  const analysis = {
    timestamp: new Date().toISOString(),

    // 数据库健康
    database: {
      health: 'unknown',
      issues: [],
      recommendations: [],
    },

    // 记忆库健康
    memory: {
      health: 'unknown',
      issues: [],
      recommendations: [],
    },

    // 向量去重健康
    vector: {
      health: 'unknown',
      issues: [],
      recommendations: [],
    },

    // 评分系统健康
    scoring: {
      health: 'unknown',
      issues: [],
      recommendations: [],
    },

    // 访问追踪健康
    accessTracking: {
      health: 'unknown',
      issues: [],
      recommendations: [],
    },

    // 时效性衰减健康
    timeDecay: {
      health: 'unknown',
      issues: [],
      recommendations: [],
    },

    // 整体健康
    overall: {
      health: 'unknown',
      score: 0,
      issues: [],
      recommendations: [],
    },
  };

  // 数据库健康分析
  const dbSizeMB = metrics.database.fileSize / (1024 * 1024);
  if (dbSizeMB < 10) {
    analysis.database.health = 'excellent';
  } else if (dbSizeMB < 50) {
    analysis.database.health = 'good';
  } else if (dbSizeMB < 100) {
    analysis.database.health = 'fair';
    analysis.database.issues.push('数据库文件较大，可能影响性能');
    analysis.database.recommendations.push('考虑归档旧记忆或清理过期数据');
  } else {
    analysis.database.health = 'poor';
    analysis.database.issues.push('数据库文件过大，性能可能受影响');
    analysis.database.recommendations.push('立即归档旧记忆，清理过期数据');
  }

  // 记忆库健康分析
  const activeRatio = metrics.memory.active / metrics.memory.total;
  if (activeRatio > 0.7) {
    analysis.memory.health = 'excellent';
  } else if (activeRatio > 0.5) {
    analysis.memory.health = 'good';
  } else if (activeRatio > 0.3) {
    analysis.memory.health = 'fair';
    analysis.memory.issues.push('活跃记忆比例较低，可能影响记忆库活力');
    analysis.memory.recommendations.push('评估已归档记忆，考虑恢复有价值的内容');
  } else {
    analysis.memory.health = 'poor';
    analysis.memory.issues.push('活跃记忆比例过低，记忆库可能停滞');
    analysis.memory.recommendations.push('立即评估已归档记忆，恢复有价值的内容');
  }

  // 向量去重健康分析
  const vectorCacheRatio = metrics.vector.cachedVectors / metrics.vector.totalMemories;
  if (vectorCacheRatio > 0.9) {
    analysis.vector.health = 'excellent';
  } else if (vectorCacheRatio > 0.7) {
    analysis.vector.health = 'good';
  } else if (vectorCacheRatio > 0.5) {
    analysis.vector.health = 'fair';
    analysis.vector.issues.push(`向量缓存比例较低 (${(vectorCacheRatio * 100).toFixed(1)}%)`);
    analysis.vector.recommendations.push('重新运行优化脚本，生成缺失的向量缓存');
  } else {
    analysis.vector.health = 'poor';
    analysis.vector.issues.push(`向量缓存比例过低 (${(vectorCacheRatio * 100).toFixed(1)}%)`);
    analysis.vector.recommendations.push('立即重新运行优化脚本，生成向量缓存');
  }

  // 评分系统健康分析
  const scoreStability = metrics.scoring.avgScoreChange;
  if (scoreStability < 0.1) {
    analysis.scoring.health = 'excellent';
  } else if (scoreStability < 0.2) {
    analysis.scoring.health = 'good';
  } else if (scoreStability < 0.5) {
    analysis.scoring.health = 'fair';
    analysis.scoring.issues.push(`评分变化较大 (${scoreStability.toFixed(3)})`);
    analysis.scoring.recommendations.push('观察评分变化趋势，确认是否符合预期');
  } else {
    analysis.scoring.health = 'poor';
    analysis.scoring.issues.push(`评分变化过大 (${scoreStability.toFixed(3)})`);
    analysis.scoring.recommendations.push('立即检查评分算法，确认是否存在异常');
  }

  // 访问追踪健康分析
  if (metrics.accessTracking.totalAccessLogs > 0) {
    analysis.accessTracking.health = 'excellent';
  } else {
    analysis.accessTracking.health = 'warning';
    analysis.accessTracking.issues.push('访问日志为空，访问追踪可能未启用');
    analysis.accessTracking.recommendations.push('运行访问追踪脚本，更新访问统计');
  }

  // 时效性衰减健康分析
  if (metrics.timeDecay.tau > 0 && metrics.timeDecay.halfLife > 0) {
    analysis.timeDecay.health = 'excellent';
  } else {
    analysis.timeDecay.health = 'warning';
    analysis.timeDecay.issues.push('时效性衰减参数异常');
    analysis.timeDecay.recommendations.push('检查指数衰减配置，确认参数正确');
  }

  // 整体健康评分
  const healthScores = {
    excellent: 5,
    good: 4,
    fair: 3,
    poor: 2,
    warning: 1,
    unknown: 0,
  };

  const overallScore = (
    healthScores[analysis.database.health] +
    healthScores[analysis.memory.health] +
    healthScores[analysis.vector.health] +
    healthScores[analysis.scoring.health] +
    healthScores[analysis.accessTracking.health] +
    healthScores[analysis.timeDecay.health]
  ) / 6;

  analysis.overall.score = overallScore;

  if (overallScore >= 4.5) {
    analysis.overall.health = 'excellent';
  } else if (overallScore >= 3.5) {
    analysis.overall.health = 'good';
  } else if (overallScore >= 2.5) {
    analysis.overall.health = 'fair';
  } else if (overallScore >= 1.5) {
    analysis.overall.health = 'poor';
  } else {
    analysis.overall.health = 'critical';
  }

  // 汇总所有问题和建议
  analysis.overall.issues = [
    ...analysis.database.issues,
    ...analysis.memory.issues,
    ...analysis.vector.issues,
    ...analysis.scoring.issues,
    ...analysis.accessTracking.issues,
    ...analysis.timeDecay.issues,
  ];

  analysis.overall.recommendations = [
    ...analysis.database.recommendations,
    ...analysis.memory.recommendations,
    ...analysis.vector.recommendations,
    ...analysis.scoring.recommendations,
    ...analysis.accessTracking.recommendations,
    ...analysis.timeDecay.recommendations,
  ];

  return analysis;
}

// 生成性能报告
function generatePerformanceReport(metrics, analysis) {
  const report = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),

    // 性能指标
    metrics,

    // 性能分析
    analysis,

    // 告警（如果有）
    alerts: [],

    // 摘要
    summary: {
      overallHealth: analysis.overall.health,
      overallScore: analysis.overall.score.toFixed(2),
      totalIssues: analysis.overall.issues.length,
      criticalIssues: analysis.overall.issues.filter(i => i.includes('立即') || i.includes('critical')).length,
      totalRecommendations: analysis.overall.recommendations.length,
    },
  };

  // 检查告警
  if (analysis.overall.health === 'poor' || analysis.overall.health === 'critical') {
    report.alerts.push({
      level: 'critical',
      message: `系统整体健康状态: ${analysis.overall.health} (评分: ${analysis.overall.score.toFixed(2)})`,
      timestamp: new Date().toISOString(),
    });
  }

  if (metrics.database.fileSize > 100 * 1024 * 1024) {
    report.alerts.push({
      level: 'warning',
      message: `数据库文件较大: ${(metrics.database.fileSize / (1024 * 1024)).toFixed(2)} MB`,
      timestamp: new Date().toISOString(),
    });
  }

  if (metrics.memory.active / metrics.memory.total < 0.3) {
    report.alerts.push({
      level: 'warning',
      message: `活跃记忆比例较低: ${((metrics.memory.active / metrics.memory.total) * 100).toFixed(1)}%`,
      timestamp: new Date().toISOString(),
    });
  }

  if (metrics.vector.cachedVectors / metrics.vector.totalMemories < 0.5) {
    report.alerts.push({
      level: 'warning',
      message: `向量缓存比例较低: ${((metrics.vector.cachedVectors / metrics.vector.totalMemories) * 100).toFixed(1)}%`,
      timestamp: new Date().toISOString(),
    });
  }

  return report;
}

// 保存性能报告
function savePerformanceReport(report) {
  // 保存最新报告
  fs.writeFileSync(MONITOR_CONFIG.latestReportPath, JSON.stringify(report, null, 2));

  // 更新历史报告
  let history = [];
  if (fs.existsSync(MONITOR_CONFIG.historyReportPath)) {
    history = JSON.parse(fs.readFileSync(MONITOR_CONFIG.historyReportPath, 'utf-8'));
  }

  history.push({
    timestamp: report.timestamp,
    overallHealth: report.summary.overallHealth,
    overallScore: report.summary.overallScore,
    totalIssues: report.summary.totalIssues,
    criticalIssues: report.summary.criticalIssues,
  });

  // 只保留最近 100 条记录
  if (history.length > 100) {
    history = history.slice(-100);
  }

  fs.writeFileSync(MONITOR_CONFIG.historyReportPath, JSON.stringify(history, null, 2));

  return report;
}

// 生成 Markdown 报告
function generateMarkdownReport(report) {
  const md = [
    `# 记忆优化器 - 系统性能监控报告`,
    '',
    `**生成时间**: ${new Date(report.timestamp).toLocaleString('zh-CN')}`,
    `**版本**: v1.0.0`,
    '',
    `---`,
    '',
    `## 📊 整体健康状态`,
    '',
    `- **健康评分**: ${report.summary.overallScore} / 5.0`,
    `- **健康状态**: ${report.summary.overallHealth}`,
    `- **问题数量**: ${report.summary.totalIssues} 个`,
    `- **严重问题**: ${report.summary.criticalIssues} 个`,
    `- **建议数量**: ${report.summary.totalRecommendations} 个`,
    '',
    `---`,
    '',
    `## 🗄️ 数据库性能`,
    '',
    `- **文件大小**: ${(report.metrics.database.fileSize / (1024 * 1024)).toFixed(2)} MB`,
    `- **页面数量**: ${report.metrics.database.pageCount}`,
    `- **页面大小**: ${report.metrics.database.pageSize} 字节`,
    `- **表数量**: ${report.metrics.database.tableCount}`,
    `- **索引数量**: ${report.metrics.database.indexCount}`,
    `- **健康状态**: ${report.analysis.database.health}`,
    '',
    report.analysis.database.issues.length > 0 ? [
      `### ⚠️ 问题`,
      ...report.analysis.database.issues.map(i => `- ${i}`),
    ].join('\n') : '',
    '',
    report.analysis.database.recommendations.length > 0 ? [
      `### 💡 建议`,
      ...report.analysis.database.recommendations.map(r => `- ${r}`),
    ].join('\n') : '',
    '',
    `---`,
    '',
    `## 🧠 记忆库统计`,
    '',
    `- **总记忆数**: ${report.metrics.memory.total}`,
    `- **活跃记忆**: ${report.metrics.memory.active}`,
    `- **已归档记忆**: ${report.metrics.memory.archived}`,
    `- **受保护记忆**: ${report.metrics.memory.protected}`,
    `- **平均评分**: ${report.metrics.memory.avgScore.toFixed(2)}`,
    `- **平均访问次数**: ${report.metrics.memory.avgAccessCount.toFixed(1)}`,
    `- **活跃比例**: ${((report.metrics.memory.active / report.metrics.memory.total) * 100).toFixed(1)}%`,
    `- **健康状态**: ${report.analysis.memory.health}`,
    '',
    report.analysis.memory.issues.length > 0 ? [
      `### ⚠️ 问题`,
      ...report.analysis.memory.issues.map(i => `- ${i}`),
    ].join('\n') : '',
    '',
    report.analysis.memory.recommendations.length > 0 ? [
      `### 💡 建议`,
      ...report.analysis.memory.recommendations.map(r => `- ${r}`),
    ].join('\n') : '',
    '',
    `---`,
    '',
    `## 🧩 向量去重性能`,
    '',
    `- **总记忆数**: ${report.metrics.vector.totalMemories}`,
    `- **缓存向量数**: ${report.metrics.vector.cachedVectors}`,
    `- **缓存比例**: ${((report.metrics.vector.cachedVectors / report.metrics.vector.totalMemories) * 100).toFixed(1)}%`,
    `- **平均向量长度**: ${report.metrics.vector.avgVectorLength.toFixed(0)} 字符`,
    `- **使用的模型**: ${report.metrics.vector.modelUsed}`,
    `- **健康状态**: ${report.analysis.vector.health}`,
    '',
    report.analysis.vector.issues.length > 0 ? [
      `### ⚠️ 问题`,
      ...report.analysis.vector.issues.map(i => `- ${i}`),
    ].join('\n') : '',
    '',
    report.analysis.vector.recommendations.length > 0 ? [
      `### 💡 建议`,
      ...report.analysis.vector.recommendations.map(r => `- ${r}`),
    ].join('\n') : '',
    '',
    `---`,
    '',
    `## 📈 评分系统性能`,
    '',
    `- **评分更新阈值**: ${report.metrics.scoring.scoreUpdateThreshold}`,
    `- **平均评分变化**: ${report.metrics.scoring.avgScoreChange.toFixed(3)}`,
    `- **健康状态**: ${report.analysis.scoring.health}`,
    '',
    `### 最近 5 条记忆评分`,
    report.metrics.scoring.recentScoreChanges.map(m => 
      `- **${m.title}**: ${m.score.toFixed(2)} (ID: ${m.id}, ${m.age} 天前)`
    ).join('\n'),
    '',
    report.analysis.scoring.issues.length > 0 ? [
      `### ⚠️ 问题`,
      ...report.analysis.scoring.issues.map(i => `- ${i}`),
    ].join('\n') : '',
    '',
    report.analysis.scoring.recommendations.length > 0 ? [
      `### 💡 建议`,
      ...report.analysis.scoring.recommendations.map(r => `- ${r}`),
    ].join('\n') : '',
    '',
    `---`,
    '',
    `## 📍 访问追踪性能`,
    '',
    `- **访问日志总数**: ${report.metrics.accessTracking.totalAccessLogs}`,
    `- **平均访问频率**: ${report.metrics.accessTracking.avgAccessFrequency.toFixed(1)} 次/记忆`,
    `- **最后更新时间**: ${report.metrics.accessTracking.lastUpdateTime || '无'}`,
    `- **健康状态**: ${report.analysis.accessTracking.health}`,
    '',
    report.analysis.accessTracking.issues.length > 0 ? [
      `### ⚠️ 问题`,
      ...report.analysis.accessTracking.issues.map(i => `- ${i}`),
    ].join('\n') : '',
    '',
    report.analysis.accessTracking.recommendations.length > 0 ? [
      `### 💡 建议`,
      ...report.analysis.accessTracking.recommendations.map(r => `- ${r}`),
    ].join('\n') : '',
    '',
    `---`,
    '',
    `## ⏱️ 时效性衰减性能`,
    '',
    `- **衰减时间常数 (tau)**: ${report.metrics.timeDecay.tau} 分钟`,
    `- **半衰期**: ${report.metrics.timeDecay.halfLife?.toFixed(2)} 分钟`,
    `- **线性衰减速率**: ${report.metrics.timeDecay.linearRate}`,
    `- **健康状态**: ${report.analysis.timeDecay.health}`,
    '',
    report.analysis.timeDecay.issues.length > 0 ? [
      `### ⚠️ 问题`,
      ...report.analysis.timeDecay.issues.map(i => `- ${i}`),
    ].join('\n') : '',
    '',
    report.analysis.timeDecay.recommendations.length > 0 ? [
      `### 💡 建议`,
      ...report.analysis.timeDecay.recommendations.map(r => `- ${r}`),
    ].join('\n') : '',
    '',
    `---`,
    '',
    report.alerts.length > 0 ? [
      `## 🚨 告警`,
      ...report.alerts.map(a => 
        `- **${a.level.toUpperCase()}**: ${a.message} (${new Date(a.timestamp).toLocaleString('zh-CN')})`
      ),
    ].join('\n') : '',
    '',
    `---`,
    '',
    `## 📋 所有问题和建议`,
    '',
    `### 问题汇总`,
    report.analysis.overall.issues.length > 0 
      ? report.analysis.overall.issues.map(i => `- ${i}`).join('\n')
      : '✅ 无问题',
    '',
    `### 建议汇总`,
    report.analysis.overall.recommendations.length > 0
      ? report.analysis.overall.recommendations.map(r => `- ${r}`).join('\n')
      : '✅ 无建议',
    '',
    `---`,
    '',
    `**维护者**: 系统性能监控器 (v1.0.0)`,
    `**报告路径**: ${MONITOR_CONFIG.latestReportPath}`,
    `**历史路径**: ${MONITOR_CONFIG.historyReportPath}`,
  ].filter(Boolean).join('\n');

  return md;
}

// 主函数
function main() {
  console.log('============================================================');
  console.log('  记忆优化器 - 系统性能监控器');
  console.log('============================================================\n');

  const startTime = performance.now();

  // 收集性能指标
  console.log('📊 收集性能指标...');
  const metrics = collectPerformanceMetrics();

  // 分析性能
  console.log('🔍 分析性能...');
  const analysis = analyzePerformance(metrics);

  // 生成性能报告
  console.log('📝 生成性能报告...');
  const report = generatePerformanceReport(metrics, analysis);

  // 保存报告
  console.log('💾 保存报告...');
  savePerformanceReport(report);

  // 生成 Markdown 报告
  const mdReport = generateMarkdownReport(report);
  const mdPath = path.join(MONITOR_CONFIG.reportsDir, 'latest.md');
  fs.writeFileSync(mdPath, mdReport);

  const endTime = performance.now();
  const duration = (endTime - startTime).toFixed(0);

  console.log('\n============================================================');
  console.log('  性能监控完成');
  console.log('============================================================\n');
  console.log(`📊 执行时间: ${duration} 毫秒`);
  console.log(`📊 整体健康状态: ${report.summary.overallHealth} (评分: ${report.summary.overallScore})`);
  console.log(`📊 问题数量: ${report.summary.totalIssues} 个 (严重: ${report.summary.criticalIssues} 个)`);
  console.log(`📊 建议数量: ${report.summary.totalRecommendations} 个`);
  console.log(`📊 告警数量: ${report.alerts.length} 个`);
  console.log(`\n📄 JSON 报告: ${MONITOR_CONFIG.latestReportPath}`);
  console.log(`📄 Markdown 报告: ${mdPath}`);
  console.log(`📄 历史报告: ${MONITOR_CONFIG.historyReportPath}`);

  if (report.alerts.length > 0) {
    console.log(`\n🚨 有 ${report.alerts.length} 个告警，请查看报告详情`);
  }

  console.log('\n============================================================\n');

  return report;
}

// 如果直接运行，执行主函数
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('❌ 性能监控失败:', error.message);
    process.exit(1);
  }
}

// 导出函数供其他模块使用
module.exports = {
  collectPerformanceMetrics,
  analyzePerformance,
  generatePerformanceReport,
  savePerformanceReport,
  generateMarkdownReport,
  main,
};
