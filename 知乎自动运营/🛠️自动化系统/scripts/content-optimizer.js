#!/usr/bin/env node

/**
 * 知乎技术内容质量优化工具
 *
 * 功能：
 * 1. 分析现有文章的质量评分
 * 2. 提供具体的优化建议
 * 3. 生成优化后的内容结构
 * 4. 批量优化多篇文章
 *
 * 使用方法：
 *   node content-optimizer.js [article-path] [--all]
 *   --all: 优化所有待发布文章
 *   --save: 保存优化后的内容
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  contentDir: path.join(__dirname, '..', '..', '📤待发布'),
  logDir: path.join(__dirname, '..', '..', '📝工作日志'),
  backupDir: path.join(__dirname, '..', '..', '📤待发布', '🔄优化备份'),
  qualityThresholds: {
    excellent: 28,  // 优秀 >= 28
    good: 25,       // 良好 >= 25
    pass: 22       // 及格 >= 22
  }
};

// 优化策略配置
const OPTIMIZATION_STRATEGIES = {
  readability: {
    priority: 1,
    actions: [
      "添加分层目录导航",
      "创建快速阅读指南", 
      "标注难度等级和阅读时间",
      "设计章节间过渡语"
    ]
  },
  interaction: {
    priority: 2,
    actions: [
      "具体化互动提问",
      "添加投票选择模块",
      "设计思考题挑战",
      "创建实战讨论区"
    ]
  },
  visualization: {
    priority: 3,
    actions: [
      "补充核心概念图表",
      "添加代码执行可视化",
      "创建在线demo链接",
      "制作对比分析图表"
    ]
  },
  practical: {
    priority: 4,
    actions: [
      "扩展实战场景案例",
      "创建代码包下载",
      "设计工具化模板",
      "添加性能优化指南"
    ]
  }
};

// ============================================================
// 工具函数
// ============================================================

/**
 * 读取文章内容
 */
function readArticle(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    console.log(`❌ 无法读取文件: ${filePath}`);
    return null;
  }
}

/**
 * 分析文章结构
 */
function analyzeStructure(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 检测章节标题
    if (line.startsWith('# ') && !inCodeBlock) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.substring(2),
        level: 1,
        startLine: i,
        codeBlocks: [],
        wordCount: 0
      };
    } else if (line.startsWith('## ') && !inCodeBlock) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.substring(3),
        level: 2,
        startLine: i,
        codeBlocks: [],
        wordCount: 0
      };
    } else if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (currentSection) {
        currentSection.codeBlocks.push({
          startLine: i,
          endLine: i,
          language: line.substring(3)
        });
      }
    } else if (currentSection && !inCodeBlock) {
      currentSection.wordCount += line.length;
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return {
    totalSections: sections.length,
    sectionDistribution: sections.reduce((acc, section) => {
      acc[section.level] = (acc[section.level] || 0) + 1;
      return acc;
    }, {}),
    codeBlocks: sections.reduce((total, section) => total + section.codeBlocks.length, 0),
    totalWords: sections.reduce((total, section) => total + section.wordCount, 0)
  };
}

/**
 * 评估文章质量
 */
function assessQuality(articlePath, structure) {
  // 基础评分标准
  let scores = {
    technicalDepth: 25,
    practicalValue: 25,
    readability: 25,
    collectionValue: 25,
    interaction: 20,
    titleAttraction: 20
  };

  // 结构分析影响评分
  const structureFactors = analyzeStructureQuality(structure);
  scores.readability += structureFactors.readabilityScore;

  // 检查代码质量
  const codeQuality = assessCodeQuality(articlePath);
  scores.technicalDepth += codeQuality.codeScore;
  scores.practicalValue += codeQuality.practicalScore;

  // 检查互动元素
  const interactionQuality = assessInteractionQuality(articlePath);
  scores.interaction += interactionQuality.interactionScore;

  // 检查标题吸引力
  const titleScore = assessTitleQuality(articlePath);
  scores.titleAttraction += titleScore.titleScore;

  // 计算总分
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const maxScore = 150; // 基础总分

  return {
    scores: scores,
    totalScore: totalScore,
    maxScore: maxScore,
    percentage: Math.round((totalScore / maxScore) * 100),
    rating: getRating(totalScore, maxScore),
    strengths: identifyStrengths(scores),
    weaknesses: identifyWeaknesses(scores)
  };
}

/**
 * 分析结构质量
 */
function analyzeStructureQuality(structure) {
  let score = 0;
  let feedback = [];

  // 章节分布合理性
  if (structure.sectionDistribution[1] >= 3 && structure.sectionDistribution[1] <= 8) {
    score += 5;
    feedback.push("章节结构合理");
  } else {
    feedback.push("章节分布需要优化");
  }

  // 代码块数量
  if (structure.codeBlocks >= 5) {
    score += 5;
    feedback.push("代码示例丰富");
  } else if (structure.codeBlocks >= 2) {
    score += 2;
    feedback.push("代码示例适中");
  }

  // 字数合理性
  if (structure.totalWords >= 5000 && structure.totalWords <= 30000) {
    score += 3;
    feedback.push("字数在合理范围");
  } else if (structure.totalWords > 30000) {
    feedback.push("篇幅过长，建议分层阅读");
  }

  return {
    readabilityScore: score,
    feedback: feedback
  };
}

/**
 * 评估代码质量
 */
function assessCodeQuality(articlePath) {
  const content = readArticle(articlePath);
  let codeScore = 0;
  let practicalScore = 0;

  // 检查代码完整性
  const codeBlocks = (content.match(/```/g) || []).length / 2;
  if (codeBlocks >= 5) {
    codeScore += 8;
    practicalScore += 7;
  } else if (codeBlocks >= 2) {
    codeScore += 4;
    practicalScore += 4;
  }

  // 检查代码注释
  const hasComments = content.includes('//') || content.includes('#');
  if (hasComments) {
    codeScore += 2;
    practicalScore += 3;
  }

  // 检查可运行性
  const hasImports = content.includes('import') || content.includes('require');
  if (hasImports) {
    practicalScore += 3;
  }

  return {
    codeScore: codeScore,
    practicalScore: practicalScore
  };
}

/**
 * 评估互动质量
 */
function assessInteractionQuality(articlePath) {
  const content = readArticle(articlePath);
  let interactionScore = 0;

  // 检查提问
  const questions = (content.match(/[？?]/g) || []).length;
  if (questions >= 5) {
    interactionScore += 8;
  } else if (questions >= 2) {
    interactionScore += 4;
  }

  // 检查思考引导
  const thinkingTriggers = ['你觉得', '为什么', '如何', '如果你'];
  thinkingTriggers.forEach(trigger => {
    if (content.includes(trigger)) {
      interactionScore += 2;
    }
  });

  return {
    interactionScore: interactionScore
  };
}

/**
 * 评估标题质量
 */
function assessTitleQuality(articlePath) {
  const content = readArticle(articlePath);
  const titleMatch = content.match(/^# (.+)$/m);
  let titleScore = 0;

  if (titleMatch) {
    const title = titleMatch[1];
    
    // 检查技术关键词
    const techKeywords = ['原理', '解析', '深度', '实战', '指南', '教程'];
    techKeywords.forEach(keyword => {
      if (title.includes(keyword)) {
        titleScore += 3;
      }
    });

    // 检查承诺性词汇
    const promiseWords = ['完全', '完整', '详解', '深度', '实战'];
    promiseWords.forEach(word => {
      if (title.includes(word)) {
        titleScore += 2;
      }
    });

    // 检查长度
    if (title.length >= 15 && title.length <= 50) {
      titleScore += 3;
    }
  }

  return {
    titleScore: titleScore
  };
}

/**
 * 获取评级
 */
function getRating(score, maxScore) {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return '优秀';
  if (percentage >= 80) return '良好';
  if (percentage >= 70) return '合格';
  if (percentage >= 60) return '及格';
  return '需改进';
}

/**
 * 识别优势
 */
function identifyStrengths(scores) {
  const strengths = [];
  Object.entries(scores).forEach(([key, score]) => {
    if (score >= 18) {
      const strengthMap = {
        technicalDepth: '技术深度强',
        practicalValue: '实用价值高', 
        readability: '可读性好',
        collectionValue: '收藏价值高',
        interaction: '互动设计好',
        titleAttraction: '标题吸引人'
      };
      strengths.push(strengthMap[key] || key);
    }
  });
  return strengths;
}

/**
 * 识别弱点
 */
function identifyWeaknesses(scores) {
  const weaknesses = [];
  Object.entries(scores).forEach(([key, score]) => {
    if (score < 15) {
      const weaknessMap = {
        technicalDepth: '技术深度不足',
        practicalValue: '实用性待提升',
        readability: '可读性需优化', 
        collectionValue: '收藏价值不高',
        interaction: '互动设计不足',
        titleAttraction: '标题吸引力待提升'
      };
      weaknesses.push(weaknessMap[key] || key);
    }
  });
  return weaknesses;
}

/**
 * 生成优化建议
 */
function generateOptimizationSuggestions(quality, structure) {
  const suggestions = [];

  // 根据评分生成针对性建议
  if (quality.scores.readability < 20) {
    suggestions.push({
      category: 'readability',
      priority: 1,
      suggestions: [
        "添加分层目录导航",
        "创建快速阅读指南",
        "标注难度等级和预计阅读时间",
        "优化章节过渡和逻辑 flow"
      ]
    });
  }

  if (quality.scores.interaction < 15) {
    suggestions.push({
      category: 'interaction',
      priority: 2,
      suggestions: [
        "具体化互动提问",
        "添加投票选择模块",
        "设计思考题和挑战",
        "创建评论区互动引导"
      ]
    });
  }

  if (quality.scores.practicalValue < 20) {
    suggestions.push({
      category: 'practical',
      priority: 3,
      suggestions: [
        "扩展实战场景案例",
        "创建代码包下载链接",
        "添加工具化模板",
        "提供性能优化指南"
      ]
    });
  }

  // 通用建议
  suggestions.push({
    category: 'general',
    priority: 4,
    suggestions: [
      "补充核心概念可视化图表",
      "添加在线demo链接",
      "优化代码注释和示例",
      "增强内容的可分享性"
    ]
  });

  return suggestions;
}

/**
 * 生成优化后的内容结构
 */
function generateOptimizedStructure(originalPath, quality, suggestions) {
  const structure = {
    originalPath: originalPath,
    quality: quality,
    optimizations: suggestions,
    plannedImprovements: [],
    estimatedTime: 0
  };

  // 计算预估优化时间
  suggestions.forEach(suggestion => {
    const timeMap = {
      readability: 60,      // 1小时
      interaction: 45,     // 45分钟
      practical: 90,       // 1.5小时
      visualization: 75,   // 1.25小时
      general: 60         // 1小时
    };
    
    if (timeMap[suggestion.category]) {
      structure.estimatedTime += timeMap[suggestion.category];
    }
  });

  // 计算预期质量提升
  const expectedImprovement = calculateExpectedImprovement(suggestions);
  structure.expectedImprovement = expectedImprovement;

  return structure;
}

/**
 * 计算预期质量提升
 */
function calculateExpectedImprovement(suggestions) {
  let totalImprovement = 0;
  const improvementMap = {
    readability: 3,
    interaction: 4,
    practical: 3,
    visualization: 2,
    general: 2
  };

  suggestions.forEach(suggestion => {
    if (improvementMap[suggestion.category]) {
      totalImprovement += improvementMap[suggestion.category];
    }
  });

  return totalImprovement;
}

/**
 * 获取待发布文章列表
 */
function getPendingArticles() {
  const pendingDir = CONFIG.contentDir;
  const articles = [];

  try {
    // 递归搜索所有子目录
    function searchDirectory(dir) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isFile() && file.endsWith('.md')) {
          // 排除质量报告文件和元数据文件
          if (!file.includes('quality-report') && !file.includes('-metadata') && !file.includes('report')) {
            articles.push({
              name: file,
              path: filePath,
              priority: getArticlePriority(file)
            });
          }
        } else if (stat.isDirectory()) {
          searchDirectory(filePath); // 递归搜索子目录
        }
      });
    }
    
    searchDirectory(pendingDir);
  } catch (error) {
    console.log(`❌ 无法读取待发布目录: ${error.message}`);
  }

  return articles.sort((a, b) => b.priority - a.priority);
}

/**
 * 获取文章优先级
 */
function getArticlePriority(filename) {
  if (filename.includes('🔥高优先级')) return 10;
  if (filename.includes('Transformer') || filename.includes('OpenClaw')) return 9;
  if (filename.includes('AIGC') || filename.includes('原理')) return 8;
  if (filename.includes('实战') || filename.includes('教程')) return 7;
  return 5;
}

/**
 * 保存优化报告
 */
function saveOptimizationReport(optimizationData, filename) {
  const reportPath = path.join(CONFIG.logDir, `${filename}-optimization-report.md`);
  
  try {
    const report = `# ${filename} 质量优化报告

**评估时间**: ${new Date().toLocaleString()}
**当前质量**: ${optimizationData.quality.percentage}% (${optimizationData.quality.rating})
**预估提升**: +${optimizationData.expectedImprovement}分
**预计耗时**: ${optimizationData.estimatedTime}分钟

## 📊 当前质量评分

| 维度 | 得分 | 满分 | 评级 |
|------|------|------|------|
| ${Object.entries(optimizationData.quality.scores).map(([key, score]) => {
  const names = {
    technicalDepth: '技术深度',
    practicalValue: '实用价值',
    readability: '可读性',
    collectionValue: '收藏价值',
    interaction: '互动引导',
    titleAttraction: '标题吸引力'
  };
  return `${names[key] || key} | ${score} | 25 | ${score >= 20 ? '优秀' : score >= 15 ? '良好' : '需改进'}`;
}).join('\n')}

## 🔍 分析结果

### 优势 (${optimizationData.quality.strengths.join(', ')})
### 待改进 (${optimizationData.quality.weaknesses.join(', ')})

## 🎯 优化建议

${optimizationData.optimizations.map(opt => `
### ${opt.category} (优先级: ${opt.priority})
${opt.suggestions.map(s => `- ${s}`).join('\n')}
`).join('\n')}

## 📈 预期效果

**优化后预期质量**: ${optimizationData.quality.percentage + optimizationData.expectedImprovement}%
**提升幅度**: +${optimizationData.expectedImprovement}分

---

*由内容质量优化工具自动生成*
`;

    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`✅ 优化报告已保存: ${reportPath}`);
  } catch (error) {
    console.log(`❌ 保存报告失败: ${error.message}`);
  }
}

// ============================================================
// 主函数
// ============================================================

/**
 * 主执行函数
 */
function main() {
  console.log('🚀 开始知乎技术内容质量优化分析...');
  
  // 获取待发布文章
  const articles = getPendingArticles();
  
  if (articles.length === 0) {
    console.log('❌ 没有找到待发布文章');
    return;
  }

  console.log(`📚 找到 ${articles.length} 篇待发布文章`);
  
  const optimizationResults = [];
  
  // 优化前5篇文章
  const topArticles = articles.slice(0, 5);
  
  topArticles.forEach((article, index) => {
    console.log(`\n📝 正在分析文章 ${index + 1}/${topArticles.length}: ${article.name}`);
    
    // 读取文章内容
    const content = readArticle(article.path);
    if (!content) return;
    
    // 分析结构
    const structure = analyzeStructure(content);
    
    // 评估质量
    const quality = assessQuality(article.path, structure);
    
    // 生成优化建议
    const suggestions = generateOptimizationSuggestions(quality, structure);
    
    // 生成优化结构
    const optimization = generateOptimizedStructure(article.path, quality, suggestions);
    
    // 保存报告
    const reportName = article.name.replace('.md', '');
    saveOptimizationReport(optimization, reportName);
    
    optimizationResults.push({
      article: article,
      optimization: optimization
    });
    
    console.log(`✅ 分析完成: ${quality.percentage}% (${quality.rating})`);
    console.log(`📈 预期提升: +${optimization.expectedImprovement}分`);
    console.log(`⏱️ 预计耗时: ${optimization.estimatedTime}分钟`);
  });
  
  // 生成总结报告
  generateSummaryReport(optimizationResults);
}

/**
 * 生成总结报告
 */
function generateSummaryReport(results) {
  const summaryPath = path.join(CONFIG.logDir, `content-optimization-summary-${Date.now()}.md`);
  
  const summary = `# 知乎技术内容质量优化总结报告

**生成时间**: ${new Date().toLocaleString()}
**分析文章数**: ${results.length}

## 📊 整体分析结果

### 质量分布
${results.map(r => {
  const quality = r.optimization.quality;
  return `- ${r.article.name}: ${quality.percentage}% (${quality.rating})`;
}).join('\n')}

### 优先级排序
${results.sort((a, b) => a.optimization.quality.percentage - b.optimization.quality.percentage)
  .map(r => {
    const quality = r.optimization.quality;
    const priority = quality.percentage < 70 ? '🔥 高优先级' : quality.percentage < 85 ? '📊 中等优先级' : '✅ 低优先级';
    return `${priority} | ${r.article.name} | ${quality.percentage}%`;
  }).join('\n')}

## 🎯 优化重点

### 急需优化 (${results.filter(r => r.optimization.quality.percentage < 70).length}篇)
${results.filter(r => r.optimization.quality.percentage < 70)
  .map(r => `- ${r.article.name}: ${r.optimization.quality.percentage}% → 预期 ${r.optimization.quality.percentage + r.optimization.expectedImprovement}%`)
  .join('\n')}

### 良好水平 (${results.filter(r => r.optimization.quality.percentage >= 70 && r.optimization.quality.percentage < 85).length}篇)
${results.filter(r => r.optimization.quality.percentage >= 70 && r.optimization.quality.percentage < 85)
  .map(r => `- ${r.article.name}: ${r.optimization.quality.percentage}% → 预期 ${r.optimization.quality.percentage + r.optimization.expectedImprovement}%`)
  .join('\n')}

### 优秀水平 (${results.filter(r => r.optimization.quality.percentage >= 85).length}篇)
${results.filter(r => r.optimization.quality.percentage >= 85)
  .map(r => `- ${r.article.name}: ${r.optimization.quality.percentage}% → 预期 ${r.optimization.quality.percentage + r.optimization.expectedImprovement}%`)
  .join('\n')}

## 📈 预期总体提升

### 平均质量提升
- 当前平均质量: ${Math.round(results.reduce((sum, r) => sum + r.optimization.quality.percentage, 0) / results.length)}%
- 预期平均质量: ${Math.round(results.reduce((sum, r) => sum + r.optimization.quality.percentage + r.optimization.expectedImprovement, 0) / results.length)}%
- 总体提升: +${Math.round(results.reduce((sum, r) => sum + r.optimization.expectedImprovement, 0) / results.length)}分

### 总体优化时间
- 预计总耗时: ${results.reduce((sum, r) => sum + r.optimization.estimatedTime, 0)}分钟 (${Math.round(results.reduce((sum, r) => sum + r.optimization.estimatedTime, 0) / 60)}小时)

## 🎯 推荐优化顺序

1. **第一优先级**: ${results.filter(r => r.optimization.quality.percentage < 70)[0]?.article.name || '无'}
2. **第二优先级**: ${results.filter(r => r.optimization.quality.percentage < 70)[1]?.article.name || '无'}  
3. **第三优先级**: ${results.filter(r => r.optimization.quality.percentage < 70)[2]?.article.name || '无'}

## 💡 优化建议

### 短期目标 (1-2周)
- 重点优化质量低于70%的文章
- 建立标准化的优化流程
- 创建可复用的模板和组件

### 中期目标 (1个月)
- 将所有文章质量提升至85%以上
- 建立质量监控和预警机制
- 开发自动优化工具

### 长期目标 (3个月)
- 打造知乎技术内容标杆账号
- 建立系统化的内容生产体系
- 实现完全自动化的内容优化流程

---

*基于内容质量优化工具自动生成*
`;

  try {
    fs.writeFileSync(summaryPath, summary, 'utf8');
    console.log(`\n📊 总体优化报告已保存: ${summaryPath}`);
    
    console.log('\n🎉 优化分析完成！');
    console.log('📈 主要发现:');
    console.log(`- 当前平均质量: ${Math.round(results.reduce((sum, r) => sum + r.optimization.quality.percentage, 0) / results.length)}%`);
    console.log(`- 预期可提升至: ${Math.round(results.reduce((sum, r) => sum + r.optimization.quality.percentage + r.optimization.expectedImprovement, 0) / results.length)}%`);
    console.log(`- 总优化耗时: ${results.reduce((sum, r) => sum + r.optimization.estimatedTime, 0)}分钟`);
    
  } catch (error) {
    console.log(`❌ 保存总结报告失败: ${error.message}`);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  assessQuality,
  generateOptimizationSuggestions,
  generateOptimizedStructure
};