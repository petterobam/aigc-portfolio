#!/usr/bin/env node

/**
 * 分析评分阈值影响 - 用于演示过度保守策略问题
 *
 * 此脚本模拟不同阈值下的优化行为，帮助诊断系统保守程度
 */

const fs = require("fs").promises;
const path = require("path");

// 配置
const config = {
  dbPath: "~/.openclaw/workspace/memory.db",
  thresholds: [0.2, 0.15, 0.1, 0.05], // 测试不同阈值
  reportFile:
    "~/.openclaw/workspace/skills/memory-optimizer/logs/threshold-analysis.md",
};

/**
 * 分析评分差异数据
 */
async function analyzeScoreDifferences() {
  try {
    // 读取优化日志获取评分差异数据
    const latestLog = await fs.readFile(
      "~/.openclaw/workspace/skills/memory-optimizer/logs/latest.md",
      "utf8",
    );

    // 解析评分差异数据
    const scoreMatches =
      latestLog.match(/diff:\s*([\d.]+),\s*threshold:\s*([\d.]+)/g) || [];
    const scoreDifferences = scoreMatches.map((match) => {
      const diff = parseFloat(match.match(/diff:\s*([\d.]+)/)[1]);
      return diff;
    });

    console.log("📊 评分差异分析:");
    console.log(`总记忆数: ${scoreDifferences.length}`);
    console.log(`\n📈 评分差异分布:`);

    // 统计不同阈值下的影响
    const stats = {
      total: scoreDifferences.length,
      above0_2: scoreDifferences.filter((d) => d >= 0.2).length,
      above0_15: scoreDifferences.filter((d) => d >= 0.15).length,
      above0_1: scoreDifferences.filter((d) => d >= 0.1).length,
      above0_05: scoreDifferences.filter((d) => d >= 0.05).length,
      maxDiff: Math.max(...scoreDifferences),
      minDiff: Math.min(...scoreDifferences),
      avgDiff:
        scoreDifferences.reduce((a, b) => a + b, 0) / scoreDifferences.length,
    };

    console.log(`\n🔍 阈值影响统计:`);
    console.log(
      `当前阈值 (0.2): ${stats.above0_2} 条记忆会更新 (${((stats.above0_2 / stats.total) * 100).toFixed(1)}%)`,
    );
    console.log(
      `建议阈值 (0.15): ${stats.above0_15} 条记忆会更新 (${((stats.above0_15 / stats.total) * 100).toFixed(1)}%)`,
    );
    console.log(
      `激进阈值 (0.1): ${stats.above0_1} 条记忆会更新 (${((stats.above0_1 / stats.total) * 100).toFixed(1)}%)`,
    );
    console.log(
      `激进阈值 (0.05): ${stats.above0_05} 条记忆会更新 (${((stats.above0_05 / stats.total) * 100).toFixed(1)}%)`,
    );

    // 生成详细分析报告
    const analysisReport = generateAnalysisReport(scoreDifferences, stats);

    // 保存报告
    await fs.writeFile(config.reportFile, analysisReport);
    console.log(`\n📄 详细报告已保存: ${config.reportFile}`);

    return {
      stats,
      analysisReport,
      recommendation: generateRecommendation(stats),
    };
  } catch (error) {
    console.error("❌ 分析失败:", error.message);
    return null;
  }
}

/**
 * 生成详细分析报告
 */
function generateAnalysisReport(differences, stats) {
  const time = new Date().toISOString();

  let report = `# 评分阈值影响分析报告\n\n`;
  report += `**分析时间**: ${time}\n`;
  report += `**数据来源**: memory-optimizer 最新执行日志\n\n`;

  report += `## 📊 基础统计\n\n`;
  report += `- 总记忆数: ${stats.total}\n`;
  report += `- 最大评分差异: ${stats.maxDiff.toFixed(3)}\n`;
  report += `- 最小评分差异: ${stats.minDiff.toFixed(3)}\n`;
  report += `- 平均评分差异: ${stats.avgDiff.toFixed(3)}\n\n`;

  report += `## 🎯 阈值影响对比\n\n`;
  report += `| 阈值值 | 会更新记忆数 | 更新率 | 影响评估 |\n`;
  report += `|--------|-------------|--------|----------|\n`;
  report += `| 0.20 | ${stats.above0_2} | ${((stats.above0_2 / stats.total) * 100).toFixed(1)}% | **当前设置 (过度保守)** |\n`;
  report += `| 0.15 | ${stats.above0_15} | ${((stats.above0_15 / stats.total) * 100).toFixed(1)}% | **推荐设置 (平衡)** |\n`;
  report += `| 0.10 | ${stats.above0_1} | ${((stats.above0_1 / stats.total) * 100).toFixed(1)}% | **激进设置 (风险较高)** |\n`;
  report += `| 0.05 | ${stats.above0_05} | ${((stats.above0_05 / stats.total) * 100).toFixed(1)}% | **激进设置 (风险很高)** |\n\n`;

  report += `## 🚨 关键发现\n\n`;

  if (stats.above0_15 > 0) {
    const improvement = (
      ((stats.above0_15 - stats.above0_2) / stats.total) *
      100
    ).toFixed(1);
    report += `✅ **阈值优化机会**: 降至 0.15 可增加 ${stats.above0_15 - stats.above0_2} 条记忆更新 (${improvement}%)\n`;
  }

  if (stats.above0_2 === 0 && stats.total > 0) {
    report += `⚠️ **过度保守确认**: 当前阈值下 0% 优化率，系统失去自清理能力\n`;
  }

  // 找出接近阈值的记忆
  const nearThreshold = differences
    .filter((d) => d >= 0.15 && d < 0.2)
    .sort((a, b) => b - a);

  if (nearThreshold.length > 0) {
    report += `🎯 **接近阈值的记忆**: ${nearThreshold.length} 条记忆差异在 0.15-0.2 之间\n`;
    report += `- 最高值: ${nearThreshold[0].toFixed(3)}\n`;
    report += `- 接近程度: ${((nearThreshold[0] / 0.2) * 100).toFixed(1)}% 达到当前阈值\n\n`;
  }

  report += `## 💡 建议\n\n`;
  report += generateRecommendation(stats);

  return report;
}

/**
 * 生成建议
 */
function generateRecommendation(stats) {
  let recommendations = [];

  if (stats.above0_2 === 0 && stats.total > 0) {
    recommendations.push("🚨 **立即行动**: 系统处于过度保守状态，必须调整阈值");
  }

  if (stats.above0_15 > 0) {
    recommendations.push(
      "⚡ **推荐方案**: 将阈值从 0.2 降至 0.15，平衡敏感度与稳定性",
    );
  }

  if (stats.above0_1 > stats.above0_15 * 2) {
    recommendations.push("⚠️ **警告**: 降至 0.1 可能过于激进，建议先测试 0.15");
  }

  recommendations.push(
    "🔍 **监控建议**: 调整后观察 3-5 次执行，确保无异常删除",
  );
  recommendations.push("🛡️ **安全保障**: 保持 protected 记忆保护机制不变");

  return recommendations.join("\n");
}

/**
 * 主函数
 */
async function main() {
  console.log("🔍 开始评分阈值影响分析...\n");

  const result = await analyzeScoreDifferences();

  if (result) {
    console.log("\n✅ 分析完成！");
    console.log("\n📋 核心发现:");
    console.log(
      `- 当前阈值 0.2 导致 ${result.stats.above0_2}/${result.stats.total} 记忆更新 (${((result.stats.above0_2 / result.stats.total) * 100).toFixed(1)}%)`,
    );
    console.log(
      `- 推荐阈值 0.15 可导致 ${result.stats.above0_15}/${result.stats.total} 记忆更新 (${((result.stats.above0_15 / result.stats.total) * 100).toFixed(1)}%)`,
    );

    if (result.recommendation) {
      console.log("\n💡 主要建议:");
      console.log(result.recommendation);
    }
  }
}

// 执行分析
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzeScoreDifferences, generateAnalysisReport };
