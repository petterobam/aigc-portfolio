#!/usr/bin/env node

/**
 * content-quality-evaluator.js
 *
 * 知乎技术内容质量评估工具
 *
 * 功能：
 *   1. 对文章内容进行多维度质量评估
 *   2. 提供量化评分（0-100分）
 *   3. 生成详细的质量报告和优化建议
 *   4. 批量评估多篇内容
 *
 * 使用方法：
 *   # 评估单篇文章
 *   node scripts/eval/content-quality-evaluator.js <article-file>
 *
 *   # 批量评估（指定目录）
 *   node scripts/eval/content-quality-evaluator.js --batch <directory>
 *
 *   # 评估并生成报告
 *   node scripts/eval/content-quality-evaluator.js --report <article-file>
 *
 * 依赖：
 *   - 无额外依赖（仅使用 Node.js 标准库）
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const CONFIG = {
  // 评估维度和权重
  dimensions: {
    // 核心价值（40%）
    depth: { weight: 0.15, name: '内容深度', description: '是否有深度见解，不只是表面教程' },
    practicality: { weight: 0.15, name: '实用性', description: '是否可以直接应用，解决问题' },
    uniqueness: { weight: 0.10, name: '独特性', description: '是否有独特视角或原创见解' },

    // 内容结构（25%）
    clarity: { weight: 0.10, name: '清晰度', description: '逻辑是否清晰，结构是否合理' },
    completeness: { weight: 0.10, name: '完整性', description: '是否覆盖关键知识点' },
    readability: { weight: 0.05, name: '可读性', description: '文字是否流畅，表达是否清晰' },

    // 互动要素（20%）
    title: { weight: 0.08, name: '标题质量', description: '标题是否吸引人，命中搜索意图' },
    opening: { weight: 0.06, name: '开篇吸引力', description: '前100字是否有足够吸引力' },
    callToAction: { weight: 0.06, name: '互动引导', description: '是否有提问或引导关注' },

    // 技术规范（15%）
    code: { weight: 0.05, name: '代码质量', description: '是否有代码示例，是否正确' },
    formatting: { weight: 0.05, name: '格式规范', description: '排版是否规范，是否有图' },
    length: { weight: 0.05, name: '篇幅适中', description: '字数是否合适（800-3000字）' }
  },

  // 评分标准
  scoring: {
    excellent: 85,    // 优秀
    good: 70,         // 良好
    acceptable: 55,   // 及格
    poor: 40          // 较差
  },

  // 字数建议
  wordCount: {
    min: 800,
    max: 3000,
    ideal: [1500, 2500]
  }
};

// ─── 工具函数 ────────────────────────────────────────────────────────────────

/**
 * 统计字数
 */
function countWords(text) {
  // 移除 Markdown 语法标记
  const cleanText = text
    .replace(/```[\s\S]*?```/g, '')     // 代码块
    .replace(/`[^`]+`/g, '')             // 行内代码
    .replace(/!\[.*?\]\(.*?\)/g, '')     // 图片
    .replace(/\[.*?\]\(.*?\)/g, '')      // 链接
    .replace(/^#+\s+/gm, '')             // 标题
    .replace(/^\*+\s+/gm, '')            // 列表标记
    .replace(/^\d+\.\s+/gm, '')          // 数字列表
    .replace(/^>\s+/gm, '')              // 引用
    .replace(/[*_~`#\-|]+/g, '')         // Markdown 符号
    .replace(/\s+/g, ' ')                // 合并空白字符
    .trim();

  // 中文字符 + 英文单词
  const chineseChars = (cleanText.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (cleanText.match(/[a-zA-Z]+/g) || []).length;

  return chineseChars + englishWords;
}

/**
 * 检查代码块
 */
function checkCodeBlocks(text) {
  const codeBlocks = text.match(/```[\s\S]*?```/g) || [];

  return {
    count: codeBlocks.length,
    hasCode: codeBlocks.length > 0,
    examples: codeBlocks.slice(0, 3)
  };
}

/**
 * 检查图片
 */
function checkImages(text) {
  const images = text.match(/!\[.*?\]\(.*?\)/g) || [];

  return {
    count: images.length,
    hasImages: images.length > 0,
    examples: images.slice(0, 3)
  };
}

/**
 * 检查标题层级
 */
function checkHeadings(text) {
  const headings = text.match(/^#+\s+.+$/gm) || [];

  const levels = {};
  headings.forEach(h => {
    const level = (h.match(/^#+/) || [''])[0].length;
    levels[level] = (levels[level] || 0) + 1;
  });

  return {
    total: headings.length,
    levels,
    hasStructure: Object.keys(levels).length >= 2
  };
}

/**
 * 分析开篇前100字
 */
function analyzeOpening(text) {
  // 提取开篇（移除标题后）
  const opening = text
    .replace(/^#+\s+.+$/gm, '')      // 移除标题
    .replace(/```[\s\S]*?```/g, '')  // 移除代码块
    .trim()
    .substring(0, 200);              // 前200字符（约100字）

  const wordCount = countWords(opening);

  // 检查开篇特征
  const hasHook = /问题|痛点|为什么|如何|怎么|终于|原来|你知道吗|注意|警告/i.test(opening);
  const hasQuestion = /[?？]/.test(opening);
  const hasNumber = /\d+/.test(opening);
  const hasStory = /我|我们|曾经|后来/.test(opening);

  return {
    text: opening,
    wordCount,
    features: {
      hasHook,
      hasQuestion,
      hasNumber,
      hasStory
    },
    quality: (hasHook ? 25 : 0) + (hasQuestion ? 25 : 0) + (hasNumber ? 25 : 0) + (hasStory ? 25 : 0)
  };
}

/**
 * 检查互动引导
 */
function checkCallToAction(text) {
  const patterns = [
    /欢迎.*?评论/i,
    /你觉得/i,
    /你在.*?方面/i,
    /关注.*?专栏/i,
    /点赞.*?收藏/i,
    /留言.*?讨论/i
  ];

  const matches = patterns.filter(p => p.test(text));

  return {
    hasCallToAction: matches.length > 0,
    patterns: matches.length,
    examples: matches.length > 0 ? '包含互动引导' : '缺少互动引导'
  };
}

/**
 * 提取标题
 */
function extractTitle(text) {
  const match = text.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * 分析标题质量
 */
function analyzeTitle(title) {
  if (!title) {
    return { quality: 0, feedback: '缺少标题' };
  }

  const length = title.length;
  const wordCount = countWords(title);

  // 标题特征
  const hasNumber = /\d+/.test(title);  // 数字
  const hasQuestion = /[?？]/.test(title);  // 疑问
  const hasHowTo = /如何|怎么|怎样/i.test(title);  // 如何类
  const hasBenefit = /技巧|秘诀|方法|指南|教程|实战|解析|深度/i.test(title);  // 利益点
  const hasTime = /\d+\s*(分钟|天|周|月|年)/i.test(title);  // 时间承诺
  const hasEmotion = /终于|原来|原来如此|太|太|超|强/i.test(title);  // 情感词

  // 评分
  let score = 0;
  const features = [];

  if (length >= 10 && length <= 50) score += 20;
  if (hasNumber) { score += 20; features.push('数字量化'); }
  if (hasQuestion) { score += 15; features.push('疑问式'); }
  if (hasHowTo) { score += 15; features.push('如何类'); }
  if (hasBenefit) { score += 15; features.push('利益点'); }
  if (hasTime) { score += 10; features.push('时间承诺'); }
  if (hasEmotion) { score += 5; features.push('情感共鸣'); }

  return {
    title,
    length,
    wordCount,
    features,
    quality: Math.min(score, 100),
    feedback: features.length > 0 ? `包含${features.join('、')}特征` : '标题特征不明显'
  };
}

// ─── 评估维度 ─────────────────────────────────────────────────────────────

/**
 * 评估内容深度
 */
function evaluateDepth(text, wordCount) {
  // 深度特征
  const hasExamples = /例如|比如|举例/i.test(text);
  const hasAnalysis = /分析|原因|为什么|原理|机制/i.test(text);
  const hasCode = /```[\s\S]*?```/.test(text);
  const hasData = /\d+.*?%|\d+.*?倍|\d+.*?次/i.test(text);
  const hasDeepThinking = /深入|底层|本质|核心|根本/i.test(text);

  let score = 0;

  // 字数基础分
  if (wordCount >= 2000) score += 30;
  else if (wordCount >= 1500) score += 25;
  else if (wordCount >= 1000) score += 20;
  else if (wordCount >= 800) score += 15;
  else score += 10;

  // 深度特征加分
  if (hasExamples) score += 15;
  if (hasAnalysis) score += 20;
  if (hasCode) score += 15;
  if (hasData) score += 10;
  if (hasDeepThinking) score += 10;

  return {
    score: Math.min(score, 100),
    feedback: [
      wordCount >= 1500 ? '字数充足' : '建议增加字数',
      hasExamples ? '包含实例说明' : '建议增加实例',
      hasAnalysis ? '包含分析内容' : '建议增加深入分析',
      hasCode ? '包含代码示例' : '建议增加代码示例',
      hasData ? '包含数据支撑' : '建议增加数据'
    ].filter(f => !f.includes('建议'))
  };
}

/**
 * 评估实用性
 */
function evaluatePracticality(text) {
  // 实用性特征
  const hasSteps = /^\d+\./gm.test(text) || /^\s*[-*]\s*/gm.test(text);  // 步骤或列表
  const hasTutorial = /步骤|教程|指南|方法|如何|怎么/i.test(text);  // 教程类
  const hasTools = /工具|软件|库|框架|平台/i.test(text);  // 工具类
  const hasCodeSnippet = /```[\s\S]*?```/.test(text);  // 代码片段
  const hasActionable = /可以|能够|实现|完成/i.test(text);  // 可操作性

  let score = 0;

  if (hasSteps) score += 25;
  if (hasTutorial) score += 20;
  if (hasTools) score += 15;
  if (hasCodeSnippet) score += 25;
  if (hasActionable) score += 15;

  return {
    score: Math.min(score, 100),
    feedback: [
      hasSteps ? '包含操作步骤' : '建议增加步骤说明',
      hasTutorial ? '具有教程性质' : '',
      hasTools ? '包含工具介绍' : '',
      hasCodeSnippet ? '提供代码示例' : '建议提供代码示例',
      hasActionable ? '可操作性强的语言' : ''
    ].filter(f => f.length > 0)
  };
}

/**
 * 评估独特性
 */
function evaluateUniqueness(text) {
  // 独特性特征（基于内容分析）
  const hasPersonalExperience = /我.*?了|我们.*?了|曾经|后来|我发现/i.test(text);  // 个人经验
  const hasUniqueView = /但是|然而|其实|事实上|相反地|有意思的是/i.test(text);  // 独特观点
  const hasOriginalResearch = /研究|调研|测试|实验|分析数据/i.test(text);  // 原创研究
  const hasComparison = /对比|比较|vs|优缺点/i.test(text);  // 对比分析
  const hasSynthesis = /总结|整合|汇总|梳理/i.test(text);  // 综合整理

  let score = 0;

  if (hasPersonalExperience) score += 25;
  if (hasUniqueView) score += 30;
  if (hasOriginalResearch) score += 25;
  if (hasComparison) score += 10;
  if (hasSynthesis) score += 10;

  return {
    score: Math.min(score, 100),
    feedback: [
      hasPersonalExperience ? '包含个人经验' : '建议增加个人经验分享',
      hasUniqueView ? '有独特观点' : '建议提出独特观点',
      hasOriginalResearch ? '包含原创研究' : '',
      hasComparison ? '有对比分析' : '',
      hasSynthesis ? '有综合整理' : ''
    ].filter(f => f.length > 0)
  };
}

/**
 * 评估清晰度
 */
function evaluateClarity(text) {
  // 清晰度特征
  const headings = text.match(/^#+\s+.+$/gm) || [];
  const hasStructure = headings.length >= 3;  // 有至少3个标题
  const hasIntroduction = /前言|介绍|背景|开篇/i.test(text);
  const hasConclusion = /总结|结语|最后|综上/i.test(text);
  const hasTransition = /接下来|然后|此外|另外|最后|首先|其次/i.test(text);  // 过渡词

  let score = 0;

  if (hasStructure) score += 35;
  if (hasIntroduction) score += 20;
  if (hasConclusion) score += 20;
  if (hasTransition) score += 25;

  return {
    score: Math.min(score, 100),
    feedback: [
      hasStructure ? '结构清晰（多级标题）' : '建议增加标题分层',
      hasIntroduction ? '有开篇介绍' : '建议增加开篇',
      hasConclusion ? '有总结收尾' : '建议增加总结',
      hasTransition ? '有过渡衔接' : '建议增加过渡词'
    ].filter(f => !f.includes('建议'))
  };
}

/**
 * 评估完整性
 */
function evaluateCompleteness(text, wordCount) {
  // 完整性特征
  const hasBasics = /基础|基本|入门|概述|简介/i.test(text);
  const hasAdvanced = /进阶|高级|深入|深度/i.test(text);
  const hasPractice = /实践|实战|案例|示例/i.test(text);
  const hasResources = /资源|工具|链接|参考/i.test(text);

  let score = 0;

  // 字数基础分
  if (wordCount >= 2000) score += 20;
  else if (wordCount >= 1500) score += 15;
  else if (wordCount >= 1000) score += 10;
  else score += 5;

  if (hasBasics) score += 20;
  if (hasAdvanced) score += 20;
  if (hasPractice) score += 25;
  if (hasResources) score += 15;

  return {
    score: Math.min(score, 100),
    feedback: [
      hasBasics ? '包含基础知识' : '建议补充基础内容',
      hasAdvanced ? '包含进阶内容' : '',
      hasPractice ? '包含实践案例' : '建议增加实战案例',
      hasResources ? '提供资源链接' : '建议提供相关资源'
    ].filter(f => f.length > 0)
  };
}

/**
 * 评估可读性
 */
function evaluateReadability(text) {
  // 可读性特征
  const avgSentenceLength = text.split(/[。！？\n]/).reduce((sum, s) => sum + s.length, 0) / text.split(/[。！？\n]/).length;
  const shortSentences = text.split(/[。！？\n]/).filter(s => s.length < 50).length;
  const totalSentences = text.split(/[。！？\n]/).length;

  let score = 0;

  // 句子长度
  if (avgSentenceLength < 30) score += 40;
  else if (avgSentenceLength < 50) score += 30;
  else if (avgSentenceLength < 80) score += 20;
  else score += 10;

  // 短句比例
  const shortSentenceRatio = shortSentences / totalSentences;
  if (shortSentenceRatio > 0.5) score += 30;
  else if (shortSentenceRatio > 0.3) score += 20;
  else score += 10;

  // 段落长度
  const paragraphs = text.split(/\n\n+/);
  const shortParagraphs = paragraphs.filter(p => p.length < 300).length;
  const shortParagraphRatio = shortParagraphs / paragraphs.length;
  if (shortParagraphRatio > 0.6) score += 30;
  else if (shortParagraphRatio > 0.4) score += 20;
  else score += 10;

  return {
    score: Math.min(score, 100),
    feedback: [
      avgSentenceLength < 50 ? '句子长度适中' : '建议缩短句子',
      shortSentenceRatio > 0.4 ? '短句比例合理' : '建议增加短句',
      shortParagraphRatio > 0.5 ? '段落长度适中' : '建议缩短段落'
    ].filter(f => !f.includes('建议'))
  };
}

/**
 * 评估格式规范
 */
function evaluateFormatting(text) {
  const codeBlocks = checkCodeBlocks(text);
  const images = checkImages(text);
  const headings = checkHeadings(text);

  let score = 0;

  // 代码块
  if (codeBlocks.count >= 1) score += 30;
  if (codeBlocks.count >= 3) score += 10;

  // 图片
  if (images.count >= 1) score += 25;
  if (images.count >= 3) score += 10;

  // 标题
  if (headings.total >= 3) score += 20;
  if (headings.hasStructure) score += 5;

  return {
    score: Math.min(score, 100),
    feedback: [
      codeBlocks.count > 0 ? `包含 ${codeBlocks.count} 个代码块` : '建议增加代码示例',
      images.count > 0 ? `包含 ${images.count} 张图片` : '建议增加图表',
      headings.total >= 3 ? `包含 ${headings.total} 个标题` : '建议增加标题分层'
    ].filter(f => !f.includes('建议'))
  };
}

/**
 * 评估篇幅
 */
function evaluateLength(wordCount) {
  const { min, max, ideal } = CONFIG.wordCount;
  let score = 0;
  let feedback = '';

  if (wordCount < min) {
    score = 40;
    feedback = `字数偏少（${wordCount}字），建议增加至${min}字以上`;
  } else if (wordCount > max) {
    score = 70;
    feedback = `字数偏多（${wordCount}字），建议控制在${max}字以内`;
  } else if (wordCount >= ideal[0] && wordCount <= ideal[1]) {
    score = 100;
    feedback = `字数理想（${wordCount}字）`;
  } else {
    score = 85;
    feedback = `字数适中（${wordCount}字）`;
  }

  return { score, feedback, wordCount };
}

// ─── 主评估函数 ─────────────────────────────────────────────────────────────

/**
 * 评估文章质量
 */
function evaluateArticle(content) {
  // 基础分析
  const wordCount = countWords(content);
  const title = extractTitle(content);
  const opening = analyzeOpening(content);
  const callToAction = checkCallToAction(content);
  const titleAnalysis = analyzeTitle(title);

  // 维度评估
  const dimensions = {
    depth: evaluateDepth(content, wordCount),
    practicality: evaluatePracticality(content),
    uniqueness: evaluateUniqueness(content),
    clarity: evaluateClarity(content),
    completeness: evaluateCompleteness(content, wordCount),
    readability: evaluateReadability(content),
    title: titleAnalysis,
    opening: { score: opening.quality, quality: opening.quality, feedback: opening.features },
    callToAction: { score: callToAction.hasCallToAction ? 100 : 0, hasCallToAction: callToAction.hasCallToAction },
    code: { score: checkCodeBlocks(content).hasCode ? 100 : 0, hasCode: checkCodeBlocks(content).hasCode },
    formatting: evaluateFormatting(content),
    length: evaluateLength(wordCount)
  };

  // 计算总分
  let totalScore = 0;
  const weightedScores = [];

  for (const [key, config] of Object.entries(CONFIG.dimensions)) {
    const dimension = dimensions[key];
    if (!dimension) continue;

    // 兼容不同的 score 字段名
    const score = dimension.score !== undefined ? dimension.score :
                  dimension.quality !== undefined ? dimension.quality : 0;

    const weightedScore = score * config.weight;
    totalScore += weightedScore;

    weightedScores.push({
      key,
      name: config.name,
      weight: config.weight,
      score: score,
      weightedScore: weightedScore.toFixed(2),
      description: config.description
    });
  }

  totalScore = Math.round(totalScore);

  // 评级
  let grade;
  if (totalScore >= CONFIG.scoring.excellent) grade = '优秀';
  else if (totalScore >= CONFIG.scoring.good) grade = '良好';
  else if (totalScore >= CONFIG.scoring.acceptable) grade = '及格';
  else grade = '较差';

  return {
    totalScore,
    grade,
    dimensions,
    weightedScores,
    basics: {
      wordCount,
      title,
      codeBlockCount: checkCodeBlocks(content).count,
      imageCount: checkImages(content).count,
      headingCount: checkHeadings(content).total
    }
  };
}

/**
 * 生成优化建议
 */
function generateRecommendations(evaluation) {
  const recommendations = [];

  const { dimensions, totalScore } = evaluation;

  // 基于得分较低的维度生成建议
  const lowScoreDimensions = evaluation.weightedScores
    .filter(d => d.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  lowScoreDimensions.forEach(d => {
    const dim = dimensions[d.key];
    if (dim.feedback) {
      const feedbackText = Array.isArray(dim.feedback) ? dim.feedback.join('；') : dim.feedback;
      recommendations.push(`【${d.name}】${feedbackText}`);
    }
  });

  // 特殊建议
  if (evaluation.basics.codeBlockCount === 0) {
    recommendations.push('【代码质量】建议增加代码示例，技术内容必须有代码');
  }

  if (evaluation.basics.imageCount === 0) {
    recommendations.push('【格式规范】建议增加图表或流程图，提升视觉效果');
  }

  if (evaluation.basics.headingCount < 3) {
    recommendations.push('【清晰度】建议增加标题分层，提升文章结构');
  }

  if (!dimensions.callToAction.hasCallToAction) {
    recommendations.push('【互动引导】建议在结尾增加提问或引导关注');
  }

  if (dimensions.opening.quality < 50) {
    recommendations.push('【开篇吸引力】建议优化前100字，增加悬念或痛点');
  }

  return recommendations;
}

/**
 * 生成评估报告
 */
function generateReport(evaluation, articlePath) {
  const lines = [];

  lines.push('═'.repeat(70));
  lines.push('  知乎技术内容质量评估报告');
  lines.push('═'.repeat(70));
  lines.push('');
  lines.push(`📄 文章: ${articlePath}`);
  lines.push(`📊 总分: ${evaluation.totalScore} / 100`);
  lines.push(`🏆 评级: ${evaluation.grade}`);
  lines.push('');

  // 基础信息
  lines.push('┌─────────────────────────────────────────────────────────────┐');
  lines.push('│ 📋 基础信息                                                    │');
  lines.push('└─────────────────────────────────────────────────────────────┘');
  lines.push(`   字数: ${evaluation.basics.wordCount} 字`);
  lines.push(`   标题: ${evaluation.basics.title || '(无标题)'}`);
  lines.push(`   代码块: ${evaluation.basics.codeBlockCount} 个`);
  lines.push(`   图片: ${evaluation.basics.imageCount} 张`);
  lines.push(`   标题层级: ${evaluation.basics.headingCount} 个`);
  lines.push('');

  // 维度评分
  lines.push('┌─────────────────────────────────────────────────────────────┐');
  lines.push('│ 📊 维度评分                                                    │');
  lines.push('└─────────────────────────────────────────────────────────────┘');

  evaluation.weightedScores.forEach(d => {
    const bar = '█'.repeat(Math.floor(d.score / 10));
    const empty = '░'.repeat(10 - Math.floor(d.score / 10));
    lines.push(`   ${d.name.padEnd(12)} [${bar}${empty}] ${d.score} (权重${d.weight * 100}%)`);
  });

  lines.push('');

  // 优化建议
  const recommendations = generateRecommendations(evaluation);

  if (recommendations.length > 0) {
    lines.push('┌─────────────────────────────────────────────────────────────┐');
    lines.push('│ 💡 优化建议                                                    │');
    lines.push('└─────────────────────────────────────────────────────────────┘');

    recommendations.forEach((rec, i) => {
      lines.push(`   ${i + 1}. ${rec}`);
    });

    lines.push('');
  } else {
    lines.push('✅ 文章质量优秀，暂无优化建议！');
    lines.push('');
  }

  // 详细维度分析
  lines.push('┌─────────────────────────────────────────────────────────────┐');
  lines.push('│ 🔍 详细分析                                                    │');
  lines.push('└─────────────────────────────────────────────────────────────┘');

  evaluation.weightedScores.forEach(d => {
    const dim = evaluation.dimensions[d.key];
    lines.push(`\n【${d.name}】${d.score}分`);
    if (dim.feedback) {
      const feedbackList = Array.isArray(dim.feedback) ? dim.feedback : [dim.feedback];
      feedbackList.forEach(f => {
        if (f && typeof f === 'string') {
          lines.push(`  • ${f}`);
        }
      });
    }
  });

  lines.push('');
  lines.push('═'.repeat(70));
  lines.push('');

  return lines.join('\n');
}

// ─── 主函数 ────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('使用方法:');
    console.log('  node scripts/eval/content-quality-evaluator.js <article-file>');
    console.log('  node scripts/eval/content-quality-evaluator.js --batch <directory>');
    console.log('  node scripts/eval/content-quality-evaluator.js --report <article-file>');
    process.exit(1);
  }

  const isBatch = args[0] === '--batch';
  const isReport = args[0] === '--report';

  if (isBatch) {
    const directory = args[1];
    if (!directory) {
      console.error('错误: 请指定目录');
      process.exit(1);
    }

    // 批量评估
    const files = fs.readdirSync(directory).filter(f => f.endsWith('.md'));

    console.log(`\n批量评估 ${files.length} 个文件...\n`);

    const results = [];

    for (const file of files) {
      const filePath = path.join(directory, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const evaluation = evaluateArticle(content);

      results.push({ file, ...evaluation });

      console.log(`✅ ${file}: ${evaluation.totalScore}分 (${evaluation.grade})`);
    }

    console.log('\n' + '═'.repeat(70));
    console.log('  批量评估汇总');
    console.log('═'.repeat(70));

    const avgScore = Math.round(results.reduce((sum, r) => sum + r.totalScore, 0) / results.length);
    console.log(`\n平均分: ${avgScore}`);
    console.log(`\n排序:`);

    results.sort((a, b) => b.totalScore - a.totalScore).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.file}: ${r.totalScore}分 (${r.grade})`);
    });

    console.log('');

  } else if (isReport) {
    const articleFile = args[1];
    if (!articleFile) {
      console.error('错误: 请指定文章文件');
      process.exit(1);
    }

    const content = fs.readFileSync(articleFile, 'utf8');
    const evaluation = evaluateArticle(content);
    const report = generateReport(evaluation, articleFile);

    console.log(report);

    // 保存报告
    const reportFile = articleFile.replace('.md', '-quality-report.md');
    fs.writeFileSync(reportFile, report);
    console.log(`📄 报告已保存到: ${reportFile}`);

  } else {
    // 评估单个文件
    const articleFile = args[0];
    const content = fs.readFileSync(articleFile, 'utf8');
    const evaluation = evaluateArticle(content);

    console.log(`\n📊 ${path.basename(articleFile)}: ${evaluation.totalScore}分 (${evaluation.grade})\n`);

    console.log('维度评分:');
    evaluation.weightedScores.forEach(d => {
      const bar = '█'.repeat(Math.floor(d.score / 10));
      const empty = '░'.repeat(10 - Math.floor(d.score / 10));
      console.log(`  ${d.name.padEnd(12)} [${bar}${empty}] ${d.score}`);
    });

    const recommendations = generateRecommendations(evaluation);
    if (recommendations.length > 0) {
      console.log('\n💡 优化建议:');
      recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

    console.log('');
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { evaluateArticle, generateReport };
