#!/usr/bin/env node

/**
 * 历史报告分析脚本
 * 功能：读取并分析历史优化报告，识别记忆系统的长期趋势
 *
 * 用途：
 * 1. 对比多次优化报告，识别趋势
 * 2. 分析优化率变化、评分变化、记忆数量变化
 * 3. 生成趋势分析报告
 *
 * 作者：记忆优化器
 * 版本：v1.0.0
 */

const fs = require('fs');
const path = require('path');
const { DB_CONFIG } = require('./config.js');

// 配置
const REPORTS_DIR = path.join(__dirname, '..', 'reports');
const OUTPUT_DIR = path.join(__dirname, '..', 'logs');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'history-analysis.md');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 工具函数
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readReportFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    log(`⚠️  无法读取报告文件: ${filePath}`, 'yellow');
    log(`   错误: ${error.message}`, 'yellow');
    return null;
  }
}

function readAllReports() {
  try {
    const files = fs.readdirSync(REPORTS_DIR)
      .filter(f => f.endsWith('-report.json') && f !== 'README.md')
      .sort(); // 按文件名排序（时间顺序）

    const reports = [];
    for (const file of files) {
      const reportPath = path.join(REPORTS_DIR, file);
      const report = readReportFile(reportPath);
      if (report) {
        reports.push({
          file,
          path: reportPath,
          ...report
        });
      }
    }

    return reports;
  } catch (error) {
    log(`❌ 读取报告目录失败: ${error.message}`, 'red');
    return [];
  }
}

function analyzeTrend(data) {
  const trend = {
    direction: 'stable',
    change: 0,
    changePercent: 0
  };

  if (data.length < 2) {
    return trend;
  }

  const first = data[0];
  const last = data[data.length - 1];
  trend.change = last - first;

  if (first !== 0) {
    trend.changePercent = (trend.change / first) * 100;
  }

  if (Math.abs(trend.changePercent) < 1) {
    trend.direction = 'stable';
  } else if (trend.changePercent > 0) {
    trend.direction = 'increasing';
  } else {
    trend.direction = 'decreasing';
  }

  return trend;
}

function generateReport(reports) {
  if (reports.length === 0) {
    return '# 历史报告分析\n\n没有找到任何历史报告。\n';
  }

  const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  let markdown = `# 历史报告分析\n\n`;
  markdown += `> 生成时间：${now}\n`;
  markdown += `> 分析报告数：${reports.length} 个\n\n`;

  markdown += `---\n\n`;

  // 1. 概览
  markdown += `## 📊 概览\n\n`;
  markdown += `| 指标 | 数值 |\n`;
  markdown += `|------|------|\n`;
  markdown += `| 分析报告数 | ${reports.length} |\n`;
  markdown += `| 时间范围 | ${reports[0].timestamp.split('T')[0]} → ${reports[reports.length-1].timestamp.split('T')[0]} |\n`;
  markdown += `| 总处理数 | ${reports.reduce((sum, r) => sum + (r.stats?.totalProcessed || 0), 0)} |\n`;
  markdown += `| 总归档数 | ${reports.reduce((sum, r) => sum + (r.stats?.archived || 0), 0)} |\n`;
  markdown += `| 总删除数 | ${reports.reduce((sum, r) => sum + (r.stats?.deleted || 0), 0)} |\n`;
  markdown += `| 平均优化率 | ${reports.length > 0 ? (reports.reduce((sum, r) => sum + parseFloat(r.summary?.optimizationRate || 0), 0) / reports.length).toFixed(2) + '%' : 'N/A'} |\n`;
  markdown += `\n`;

  // 2. 记忆数量趋势
  markdown += `## 📈 记忆数量趋势\n\n`;
  const totalProcessed = reports.map(r => r.stats?.totalProcessed || 0);
  const processedTrend = analyzeTrend(totalProcessed);

  markdown += `### 总处理数\n\n`;
  markdown += `| 时间 | 数量 |\n`;
  markdown += `|------|------|\n`;
  reports.forEach((r, i) => {
    const time = r.timestamp.split('T')[1].substring(0, 5);
    markdown += `| ${time} | ${r.stats?.totalProcessed || 0} |\n`;
  });
  markdown += `\n`;

  markdown += `**趋势分析**: ${processedTrend.direction === 'stable' ? '🟢 稳定' : processedTrend.direction === 'increasing' ? '📈 上升' : '📉 下降'} (变化: ${processedTrend.change}, ${processedTrend.changePercent.toFixed(2)}%)\n\n`;

  // 3. 优化活动趋势
  markdown += `## 🔧 优化活动趋势\n\n`;
  const archivedData = reports.map(r => r.stats?.archived || 0);
  const deletedData = reports.map(r => r.stats?.deleted || 0);
  const importanceUpdatedData = reports.map(r => r.stats?.importanceUpdated || 0);

  markdown += `### 归档活动\n\n`;
  markdown += `| 时间 | 归档数 |\n`;
  markdown += `|------|--------|\n`;
  reports.forEach((r, i) => {
    const time = r.timestamp.split('T')[1].substring(0, 5);
    markdown += `| ${time} | ${r.stats?.archived || 0} |\n`;
  });
  markdown += `\n`;
  markdown += `**总归档数**: ${archivedData.reduce((a, b) => a + b, 0)}\n\n`;

  markdown += `### 删除活动\n\n`;
  markdown += `| 时间 | 删除数 |\n`;
  markdown += `|------|--------|\n`;
  reports.forEach((r, i) => {
    const time = r.timestamp.split('T')[1].substring(0, 5);
    markdown += `| ${time} | ${r.stats?.deleted || 0} |\n`;
  });
  markdown += `\n`;
  markdown += `**总删除数**: ${deletedData.reduce((a, b) => a + b, 0)}\n\n`;

  markdown += `### 评分更新\n\n`;
  markdown += `| 时间 | 更新数 |\n`;
  markdown += `|------|--------|\n`;
  reports.forEach((r, i) => {
    const time = r.timestamp.split('T')[1].substring(0, 5);
    markdown += `| ${time} | ${r.stats?.importanceUpdated || 0} |\n`;
  });
  markdown += `\n`;
  markdown += `**总更新数**: ${importanceUpdatedData.reduce((a, b) => a + b, 0)}\n\n`;

  // 4. 优化率趋势
  markdown += `## 📊 优化率趋势\n\n`;
  const optimizationRates = reports.map(r => parseFloat(r.summary?.optimizationRate || 0));

  markdown += `| 时间 | 优化率 |\n`;
  markdown += `|------|--------|\n`;
  reports.forEach((r, i) => {
    const time = r.timestamp.split('T')[1].substring(0, 5);
    markdown += `| ${time} | ${r.summary?.optimizationRate || '0.00%'} |\n`;
  });
  markdown += `\n`;

  const avgOptimizationRate = optimizationRates.reduce((a, b) => a + b, 0) / optimizationRates.length;
  markdown += `**平均优化率**: ${avgOptimizationRate.toFixed(2)}%\n\n`;

  // 5. 系统健康评估
  markdown += `## 🏥 系统健康评估\n\n`;

  // 评估维度
  const healthChecks = [];

  // 检查1：记忆库是否稳定
  const isStable = processedTrend.direction === 'stable' || processedTrend.direction === 'decreasing';
  healthChecks.push({
    name: '记忆库稳定性',
    status: isStable ? '✅ 良好' : '⚠️ 需要关注',
    detail: processedTrend.direction === 'stable' ? '记忆数量保持稳定' : `记忆数量${processedTrend.direction === 'increasing' ? '在增长' : '在减少'} (${processedTrend.changePercent.toFixed(2)}%)`
  });

  // 检查2：优化活动是否合理
  const totalArchived = archivedData.reduce((a, b) => a + b, 0);
  const totalDeleted = deletedData.reduce((a, b) => a + b, 0);
  const isActivityReasonable = totalArchived < reports.length && totalDeleted < reports.length;
  healthChecks.push({
    name: '优化活动合理性',
    status: isActivityReasonable ? '✅ 良好' : '⚠️ 需要关注',
    detail: `归档 ${totalArchived} 次，删除 ${totalDeleted} 次`
  });

  // 检查3：评分系统是否生效
  const totalUpdated = importanceUpdatedData.reduce((a, b) => a + b, 0);
  const isScoringWorking = totalUpdated > 0;
  healthChecks.push({
    name: '评分系统有效性',
    status: isScoringWorking ? '✅ 良好' : '⚠️ 需要关注',
    detail: `评分更新 ${totalUpdated} 次`
  });

  markdown += `| 检查项 | 状态 | 说明 |\n`;
  markdown += `|--------|------|------|\n`;
  healthChecks.forEach(check => {
    markdown += `| ${check.name} | ${check.status} | ${check.detail} |\n`;
  });
  markdown += `\n`;

  // 6. 关键洞察
  markdown += `## 💡 关键洞察\n\n`;

  const insights = [];

  // 洞察1：记忆库是否健康
  if (isStable) {
    insights.push('✅ 记忆库数量稳定，说明记忆质量较好，没有大量垃圾数据');
  } else {
    insights.push(`⚠️ 记忆库数量${processedTrend.direction === 'increasing' ? '在快速增长' : '在减少'}，建议检查记忆质量和归档策略`);
  }

  // 洞察2：评分系统是否有效
  if (isScoringWorking) {
    insights.push('✅ 评分系统正常工作，能够识别需要优化的记忆');
  } else {
    insights.push('⚠️ 评分系统可能存在问题，建议检查评分参数和算法');
  }

  // 洞察3：优化活动是否合理
  if (totalArchived === 0 && totalDeleted === 0) {
    insights.push('ℹ️ 近期没有归档或删除操作，说明记忆库质量良好或归档策略过于保守');
  } else {
    insights.push(`ℹ️ 归档 ${totalArchived} 次，删除 ${totalDeleted} 次，优化活动处于合理范围`);
  }

  // 洞察4：向量去重配置
  const hasOpenAIKey = reports[0]?.config?.openaiApiKey && reports[0]?.config?.openaiApiKey !== '';
  if (!hasOpenAIKey) {
    insights.push('⚠️ 向量去重未配置 OPENAI_API_KEY，无法识别语义重复记忆');
  } else {
    insights.push('✅ 向量去重已配置，可以识别语义重复记忆');
  }

  markdown += insights.map(i => `- ${i}`).join('\n');
  markdown += `\n\n`;

  // 7. 建议
  markdown += `## 🎯 建议\n\n`;

  const suggestions = [];

  if (!hasOpenAIKey) {
    suggestions.push('1. **配置 OPENAI_API_KEY**：启用向量去重功能，识别语义重复记忆');
  }

  if (totalArchived === 0 && totalDeleted === 0) {
    suggestions.push('2. **检查归档策略**：如果记忆库中确实有需要归档的记忆，调整归档参数（如 archiveAfterDays）');
  }

  if (!isScoringWorking) {
    suggestions.push('3. **检查评分系统**：验证评分算法是否正确生成差异化评分');
  }

  suggestions.push('4. **继续观察**：持续收集优化数据，定期生成趋势分析报告');

  markdown += suggestions.map(s => `- ${s}`).join('\n');
  markdown += `\n\n`;

  // 8. 报告列表
  markdown += `## 📋 报告列表\n\n`;
  markdown += `| # | 时间 | 文件 | 处理数 | 归档 | 删除 | 优化率 |\n`;
  markdown += `|---|------|------|--------|------|------|--------|\n`;
  reports.forEach((r, i) => {
    const time = r.timestamp.replace('T', ' ').substring(0, 16);
    markdown += `| ${i + 1} | ${time} | ${r.file} | ${r.stats?.totalProcessed || 0} | ${r.stats?.archived || 0} | ${r.stats?.deleted || 0} | ${r.summary?.optimizationRate || '0.00%'} |\n`;
  });
  markdown += `\n`;

  markdown += `---\n\n`;
  markdown += `**生成者**: 历史报告分析脚本 v1.0.0\n`;
  markdown += `**维护者**: 心跳时刻 - 记忆优化器\n`;

  return markdown;
}

// 主函数
function main() {
  log('============================================================', 'bright');
  log('  历史报告分析脚本 v1.0.0', 'bright');
  log('============================================================\n', 'bright');

  // 1. 读取所有历史报告
  log('📂 读取历史报告...', 'cyan');
  const reports = readAllReports();

  if (reports.length === 0) {
    log('⚠️  没有找到任何历史报告', 'yellow');
    log(`   报告目录: ${REPORTS_DIR}`, 'yellow');
    return;
  }

  log(`✅ 找到 ${reports.length} 个历史报告\n`, 'green');

  // 2. 生成分析报告
  log('📊 生成分析报告...', 'cyan');
  const markdown = generateReport(reports);

  // 3. 保存报告
  try {
    fs.writeFileSync(OUTPUT_FILE, markdown, 'utf-8');
    log(`✅ 分析报告已保存: ${OUTPUT_FILE}\n`, 'green');
  } catch (error) {
    log(`❌ 保存报告失败: ${error.message}`, 'red');
    return;
  }

  // 4. 显示摘要
  log('============================================================', 'bright');
  log('  分析完成', 'bright');
  log('============================================================\n', 'bright');

  log('📊 分析摘要：', 'bright');
  log(`  - 报告数量: ${reports.length} 个`);
  log(`  - 时间范围: ${reports[0].timestamp.split('T')[0]} → ${reports[reports.length-1].timestamp.split('T')[0]}`);
  log(`  - 总处理数: ${reports.reduce((sum, r) => sum + (r.stats?.totalProcessed || 0), 0)}`);
  log(`  - 总归档数: ${reports.reduce((sum, r) => sum + (r.stats?.archived || 0), 0)}`);
  log(`  - 总删除数: ${reports.reduce((sum, r) => sum + (r.stats?.deleted || 0), 0)}`);
  log(`  - 平均优化率: ${(reports.reduce((sum, r) => sum + parseFloat(r.summary?.optimizationRate || 0), 0) / reports.length).toFixed(2)}%`);

  log('\n💡 关键洞察：', 'bright');

  const hasOpenAIKey = reports[0]?.config?.openaiApiKey && reports[0]?.config?.openaiApiKey !== '';
  if (!hasOpenAIKey) {
    log('  ⚠️  向量去重未配置 OPENAI_API_KEY', 'yellow');
  } else {
    log('  ✅ 向量去重已配置', 'green');
  }

  const totalArchived = reports.reduce((sum, r) => sum + (r.stats?.archived || 0), 0);
  const totalDeleted = reports.reduce((sum, r) => sum + (r.stats?.deleted || 0), 0);
  if (totalArchived === 0 && totalDeleted === 0) {
    log('  ℹ️  近期没有归档或删除操作', 'cyan');
  } else {
    log(`  ℹ️  归档 ${totalArchived} 次，删除 ${totalDeleted} 次`, 'cyan');
  }

  log('\n📝 详细报告: logs/history-analysis.md\n', 'cyan');
}

// 运行
main();
