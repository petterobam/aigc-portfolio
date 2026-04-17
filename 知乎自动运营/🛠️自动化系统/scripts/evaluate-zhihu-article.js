#!/usr/bin/env node

/**
 * 知乎技术内容质量评估工具
 *
 * 功能：
 * - 评估知乎技术文章的质量
 * - 生成详细的评分报告
 * - 提供优化建议
 *
 * 使用方法：
 * - 评估单篇文章：node scripts/evaluate-zhihu-article.js 文章路径.md
 * - 评估目录下所有文章：node scripts/evaluate-zhihu-article.js 📤待发布/🔥高优先级/
 *
 * 作者：知乎技术分享与知识付费运营 AI
 * 创建时间：2026-03-29
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
};

/**
 * 评估标题质量
 */
function evaluateTitle(title) {
  const score = {
    length: 0,
    hasNumber: 0,
    valuePromise: 0,
    attractiveness: 0,
  };

  // 标题长度评分
  const length = title.length;
  if (length >= 10 && length <= 30) {
    score.length = 5;
  } else if (length > 30 && length <= 40) {
    score.length = 3;
  }

  // 包含数字评分
  const hasNumberPattern = /\d+/.test(title);
  if (hasNumberPattern) {
    score.hasNumber = 5;
  }

  // 价值承诺评分
  const valuePromises = ['入门', '实战', '指南', '技巧', '完全', '从零', '精通', '详解', '原理', '方法', '优化', '进阶'];
  const hasValuePromise = valuePromises.some(keyword => title.includes(keyword));
  if (hasValuePromise) {
    score.valuePromise = 5;
  } else if (title.includes('使用') || title.includes('教程')) {
    score.valuePromise = 3;
  }

  // 吸引力评分
  const attractionPatterns = [
    '终于', '原来', '竟然', '秘密', '背后', '真相', '揭秘',
    'vs', '对比', '区别', '如何', '为什么', '什么', '坑', '避坑',
    '分钟', '小时', '天', '步', '个', '篇', '种', '条', '道',
    '一篇讲透', '一篇读懂', '一篇搞定', '从...到...', '不是...而是...'
  ];
  const hasAttraction = attractionPatterns.some(pattern => title.includes(pattern));
  if (hasAttraction) {
    score.attractiveness = 5;
  } else if (title.includes('?') || title.includes('？')) {
    score.attractiveness = 3;
  }

  const totalScore = score.length + score.hasNumber + score.valuePromise + score.attractiveness;

  return {
    total: totalScore,
    max: 20,
    details: score,
  };
}

/**
 * 评估内容结构
 */
function evaluateStructure(content) {
  const score = {
    headings: 0,
    introConclusion: 0,
    paragraphLength: 0,
    imageCount: 0,
  };

  // 章节层级评分
  const hasH1 = /^#\s/m.test(content);
  const hasH2 = /^##\s/m.test(content);
  const hasH3 = /^###\s/m.test(content);

  if (hasH1 && hasH2) {
    score.headings = 10;
  } else if (hasH1) {
    score.headings = 5;
  }

  // 开场总结评分
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  const first200Chars = lines.slice(0, 5).join('').substring(0, 200);
  const last200Chars = lines.slice(-5).join('').substring(lines.slice(-5).join('').length - 200);

  const introKeywords = ['痛点', '问题', '挑战', '10分钟', '5分钟', '30分钟', '今天', '终于', '原来', '我', '你'];
  const conclusionKeywords = ['总结', '下一步', '建议', '关注', '专栏', '评论', '点赞', '收藏', '欢迎', '交流'];

  const hasIntro = introKeywords.some(keyword => first200Chars.includes(keyword));
  const hasConclusion = conclusionKeywords.some(keyword => last200Chars.includes(keyword));

  if (hasIntro && hasConclusion) {
    score.introConclusion = 10;
  } else if (hasIntro || hasConclusion) {
    score.introConclusion = 5;
  }

  // 段落长度评分
  const paragraphs = content.split(/\n\n+/).map(p => p.trim()).filter(p => p);
  const avgParagraphLength = paragraphs.length > 0
    ? paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length
    : 0;

  if (avgParagraphLength >= 50 && avgParagraphLength <= 150) {
    score.paragraphLength = 5;
  } else if (avgParagraphLength > 150 && avgParagraphLength <= 250) {
    score.paragraphLength = 3;
  }

  // 图文配比评分
  const codeBlocks = (content.match(/```/g) || []).length / 2;
  const images = (content.match(/!\[/g) || []).length;
  const totalImages = codeBlocks + images;

  if (totalImages >= 4) {
    score.imageCount = 5;
  } else if (totalImages >= 2) {
    score.imageCount = 3;
  }

  const totalScore = score.headings + score.introConclusion + score.paragraphLength + score.imageCount;

  return {
    total: totalScore,
    max: 30,
    details: score,
    avgParagraphLength,
    totalImages,
  };
}

/**
 * 评估技术深度
 */
function evaluateDepth(content) {
  const score = {
    principle: 0,
    code: 0,
    comparison: 0,
    caseStudy: 0,
  };

  // 原理讲解评分
  const principleKeywords = ['原理', '机制', '为什么', '原因', '背景', '核心', '本质', '概念', '思想'];
  const principleCount = principleKeywords.reduce((count, keyword) => {
    const regex = new RegExp(keyword, 'gi');
    return count + (content.match(regex) || []).length;
  }, 0);

  if (principleCount >= 3) {
    score.principle = 10;
  } else if (principleCount >= 1) {
    score.principle = 5;
  }

  // 代码示例评分
  const hasCodeBlock = /```[\s\S]*?```/.test(content);
  const codeBlockCount = (content.match(/```[\s\S]*?```/g) || []).length;

  if (hasCodeBlock && codeBlockCount >= 3) {
    score.code = 10;
  } else if (hasCodeBlock && codeBlockCount >= 1) {
    score.code = 5;
  }

  // 对比分析评分
  const comparisonKeywords = ['对比', '区别', 'vs', 'VS', '差异', '优缺点', '优势', '劣势', '相比', '比'];
  const hasComparison = comparisonKeywords.some(keyword => content.includes(keyword));

  if (hasComparison) {
    score.comparison = 3;
  }

  // 实际案例评分
  const caseStudyKeywords = ['案例', '实例', '例子', '实际', '真实', '应用', '场景', '实战'];
  const hasCaseStudy = caseStudyKeywords.some(keyword => content.includes(keyword));

  if (hasCaseStudy) {
    score.caseStudy = 2;
  }

  const totalScore = score.principle + score.code + score.comparison + score.caseStudy;

  return {
    total: totalScore,
    max: 25,
    details: score,
  };
}

/**
 * 评估实用性
 */
function evaluatePracticality(content) {
  const score = {
    copyable: 0,
    pitfalls: 0,
    value: 0,
  };

  // 可复制内容评分
  const copyableIndicators = ['```', '```json', '```javascript', '```python', '```bash', '```yaml', '```toml', '```ini'];
  const hasCopyable = copyableIndicators.some(indicator => content.includes(indicator));

  if (hasCopyable) {
    score.copyable = 5;
  } else if (content.includes('`')) {
    score.copyable = 3;
  }

  // 避坑指南评分
  const pitfallsKeywords = ['坑', '问题', '错误', '注意', '避免', '警告', '提醒', '常见问题', 'FAQ'];
  const pitfallsCount = pitfallsKeywords.reduce((count, keyword) => {
    const regex = new RegExp(keyword, 'gi');
    return count + (content.match(regex) || []).length;
  }, 0);

  if (pitfallsCount >= 5) {
    score.pitfalls = 5;
  } else if (pitfallsCount >= 2) {
    score.pitfalls = 3;
  }

  // 实际价值评分
  const valueKeywords = ['效率', '提升', '节省', '自动化', '解决问题', '优化', '改进', '实用', '有用', '价值'];
  const valueCount = valueKeywords.reduce((count, keyword) => {
    const regex = new RegExp(keyword, 'gi');
    return count + (content.match(regex) || []).length;
  }, 0);

  if (valueCount >= 3) {
    score.value = 5;
  } else if (valueCount >= 1) {
    score.value = 3;
  }

  const totalScore = score.copyable + score.pitfalls + score.value;

  return {
    total: totalScore,
    max: 15,
    details: score,
  };
}

/**
 * 评估互动性
 */
function evaluateInteractivity(content) {
  const score = {
    comment: 0,
    follow: 0,
    likeSave: 0,
  };

  // 引导评论评分
  const commentKeywords = ['评论', '留言', '分享', '交流', '讨论', '说说'];
  const hasCommentGuide = commentKeywords.some(keyword => content.includes(keyword));

  if (hasCommentGuide) {
    score.comment = 4;
  }

  // 引导关注评分
  const followKeywords = ['关注', '专栏', '账号', '订阅'];
  const hasFollowGuide = followKeywords.some(keyword => content.includes(keyword));

  if (hasFollowGuide) {
    score.follow = 3;
  }

  // 引导点赞/收藏评分
  const likeSaveKeywords = ['点赞', '收藏', '赞', '有用', '支持'];
  const hasLikeSaveGuide = likeSaveKeywords.some(keyword => content.includes(keyword));

  if (hasLikeSaveGuide) {
    score.likeSave = 3;
  }

  const totalScore = score.comment + score.follow + score.likeSave;

  return {
    total: totalScore,
    max: 10,
    details: score,
  };
}

/**
 * 评估文章质量
 */
function evaluateArticle(markdownContent) {
  const result = {
    title: null,
    totalScore: 0,
    maxScore: 100,
    grade: null,
    details: {},
    suggestions: [],
    optimizedScore: 100,
  };

  // 提取标题
  const titleMatch = markdownContent.match(/^#\s+(.+)$/m);
  result.title = titleMatch ? titleMatch[1] : '无标题';

  // 评估各个维度
  result.details.title = evaluateTitle(result.title);
  result.details.structure = evaluateStructure(markdownContent);
  result.details.depth = evaluateDepth(markdownContent);
  result.details.practicality = evaluatePracticality(markdownContent);
  result.details.interactivity = evaluateInteractivity(markdownContent);

  // 计算总分
  result.totalScore = result.details.title.total
    + result.details.structure.total
    + result.details.depth.total
    + result.details.practicality.total
    + result.details.interactivity.total;

  // 确定等级
  if (result.totalScore >= 90) {
    result.grade = '爆文';
  } else if (result.totalScore >= 85) {
    result.grade = '优秀';
  } else if (result.totalScore >= 75) {
    result.grade = '良好';
  } else if (result.totalScore >= 70) {
    result.grade = '及格';
  } else if (result.totalScore >= 60) {
    result.grade = '待优化';
  } else {
    result.grade = '不合格';
  }

  // 生成优化建议
  if (result.details.title.total < 20) {
    if (result.details.title.details.length < 5) {
      result.suggestions.push('建议调整标题长度到10-30字（当前' + result.title.length + '字）');
      result.optimizedScore -= (5 - result.details.title.details.length);
    }
    if (result.details.title.details.hasNumber < 5) {
      result.suggestions.push('建议在标题中加入具体数字（10个、5步、30分钟等）');
      result.optimizedScore -= 5;
    }
    if (result.details.title.details.valuePromise < 5) {
      result.suggestions.push('建议在标题中明确承诺价值（入门、实战、指南、技巧等）');
      result.optimizedScore -= (5 - result.details.title.details.valuePromise);
    }
    if (result.details.title.details.attractiveness < 5) {
      result.suggestions.push('建议增加标题吸引力（使用对比、反常识、问题等技巧）');
      result.optimizedScore -= (5 - result.details.title.details.attractiveness);
    }
  }

  if (result.details.structure.details.headings < 10) {
    result.suggestions.push('建议增加章节层级，使用一级、二级标题');
    result.optimizedScore -= (10 - result.details.structure.details.headings);
  }

  if (result.details.structure.details.introConclusion < 10) {
    result.suggestions.push('建议添加开场（痛点+效果承诺）和总结段落');
    result.optimizedScore -= (10 - result.details.structure.details.introConclusion);
  }

  if (result.details.structure.details.imageCount < 5) {
    result.suggestions.push('建议增加配图（代码块、架构图、截图等，至少4张）');
    result.optimizedScore -= (5 - result.details.structure.details.imageCount);
  }

  if (result.details.depth.details.principle < 10) {
    result.suggestions.push('建议增加原理讲解，不要只罗列步骤');
    result.optimizedScore -= (10 - result.details.depth.details.principle);
  }

  if (result.details.depth.details.code < 10) {
    result.suggestions.push('建议提供完整可运行的代码示例');
    result.optimizedScore -= (10 - result.details.depth.details.code);
  }

  if (result.details.depth.details.comparison < 3) {
    result.suggestions.push('建议增加对比分析（与其他技术/工具的对比）');
    result.optimizedScore -= 3;
  }

  if (result.details.depth.details.caseStudy < 2) {
    result.suggestions.push('建议增加真实的应用案例');
    result.optimizedScore -= 2;
  }

  if (result.details.practicality.details.pitfalls < 5) {
    result.suggestions.push('建议增加避坑指南（常见问题和解决方案）');
    result.optimizedScore -= (5 - result.details.practicality.details.pitfalls);
  }

  if (result.details.interactivity.details.comment < 4) {
    result.suggestions.push('建议在结尾添加引导评论（"评论区留言"、"分享你的经验"）');
    result.optimizedScore -= 4;
  }

  if (result.details.interactivity.details.follow < 3) {
    result.suggestions.push('建议在结尾添加引导关注（"关注专栏"、"关注账号"）');
    result.optimizedScore -= 3;
  }

  if (result.details.interactivity.details.likeSave < 3) {
    result.suggestions.push('建议在结尾添加引导点赞/收藏（"点个赞"、"收藏备用"）');
    result.optimizedScore -= 3;
  }

  // 优化后预计得分 = 100 - 扣分
  result.optimizedScore = Math.max(result.totalScore, 100 - (100 - result.totalScore - (result.optimizedScore - result.totalScore)));

  return result;
}

/**
 * 打印评估报告
 */
function printReport(result) {
  console.log('\n' + '═'.repeat(60));
  console.log(colors.cyan('📊 知乎技术内容质量评估报告'));
  console.log('═'.repeat(60));
  console.log(colors.yellow('📝 文章标题：') + result.title);
  console.log(colors.blue('📈 总评分：') + result.totalScore + '/' + result.maxScore);
  console.log(colors.magenta('🎯 质量等级：') + getGradeColor(result.grade)(result.grade));
  console.log('─'.repeat(60));

  // 详细评分
  console.log('\n' + colors.cyan('📐 详细评分：') + '\n');

  console.log(colors.yellow('1. 标题质量（20%）') + `  ${result.details.title.total}/${result.details.title.max}`);
  console.log(`   - 标题长度: ${result.details.title.details.length}/5`);
  console.log(`   - 包含数字: ${result.details.title.details.hasNumber}/5`);
  console.log(`   - 价值承诺: ${result.details.title.details.valuePromise}/5`);
  console.log(`   - 吸引力: ${result.details.title.details.attractiveness}/5`);

  console.log(colors.yellow('\n2. 内容结构（30%）') + `  ${result.details.structure.total}/${result.details.structure.max}`);
  console.log(`   - 章节层级: ${result.details.structure.details.headings}/10`);
  console.log(`   - 开场总结: ${result.details.structure.details.introConclusion}/10`);
  console.log(`   - 段落长度: ${result.details.structure.details.paragraphLength}/5 (平均 ${result.details.structure.avgParagraphLength.toFixed(0)} 字)`);
  console.log(`   - 图文配比: ${result.details.structure.details.imageCount}/5 (共 ${result.details.structure.totalImages} 张图/代码块)`);

  console.log(colors.yellow('\n3. 技术深度（25%）') + `  ${result.details.depth.total}/${result.details.depth.max}`);
  console.log(`   - 原理讲解: ${result.details.depth.details.principle}/10`);
  console.log(`   - 代码示例: ${result.details.depth.details.code}/10`);
  console.log(`   - 对比分析: ${result.details.depth.details.comparison}/3`);
  console.log(`   - 实际案例: ${result.details.depth.details.caseStudy}/2`);

  console.log(colors.yellow('\n4. 实用性（15%）') + `  ${result.details.practicality.total}/${result.details.practicality.max}`);
  console.log(`   - 可复制内容: ${result.details.practicality.details.copyable}/5`);
  console.log(`   - 避坑指南: ${result.details.practicality.details.pitfalls}/5`);
  console.log(`   - 实际价值: ${result.details.practicality.details.value}/5`);

  console.log(colors.yellow('\n5. 互动性（10%）') + `  ${result.details.interactivity.total}/${result.details.interactivity.max}`);
  console.log(`   - 引导评论: ${result.details.interactivity.details.comment}/4`);
  console.log(`   - 引导关注: ${result.details.interactivity.details.follow}/3`);
  console.log(`   - 引导点赞/收藏: ${result.details.interactivity.details.likeSave}/3`);

  // 优化建议
  if (result.suggestions.length > 0) {
    console.log('\n' + colors.cyan('💡 优化建议：') + '\n');
    result.suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion}`);
    });
    console.log(`\n   ${colors.green('✨ 优化后预计得分：')} ${result.optimizedScore}/${result.maxScore}`);
  } else {
    console.log('\n' + colors.green('✅ 文章质量优秀，无需优化！'));
  }

  console.log('\n' + '═'.repeat(60) + '\n');
}

/**
 * 获取等级颜色
 */
function getGradeColor(grade) {
  switch (grade) {
    case '爆文':
      return colors.red;
    case '优秀':
      return colors.green;
    case '良好':
      return colors.blue;
    case '及格':
      return colors.yellow;
    case '待优化':
      return colors.magenta;
    default:
      return colors.red;
  }
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(colors.red('错误：请提供文件路径或目录路径'));
    console.log(colors.yellow('使用方法：'));
    console.log('  - 评估单篇文章：node scripts/evaluate-zhihu-article.js 文章路径.md');
    console.log('  - 评估目录下所有文章：node scripts/evaluate-zhihu-article.js 📤待发布/🔥高优先级/');
    process.exit(1);
  }

  const targetPath = args[0];
  const absolutePath = path.resolve(targetPath);

  // 检查路径是否存在
  if (!fs.existsSync(absolutePath)) {
    console.log(colors.red(`错误：路径不存在：${absolutePath}`));
    process.exit(1);
  }

  // 判断是文件还是目录
  const stats = fs.statSync(absolutePath);

  if (stats.isFile()) {
    // 评估单篇文章
    console.log(colors.cyan(`📄 评估文章：${absolutePath}`));

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const result = evaluateArticle(content);
    printReport(result);

    // 保存评估报告
    const reportPath = absolutePath.replace(/\.md$/, '-evaluation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(colors.green(`✅ 评估报告已保存到：${reportPath}`));

  } else if (stats.isDirectory()) {
    // 评估目录下所有 Markdown 文件
    console.log(colors.cyan(`📁 评估目录：${absolutePath}`));

    const files = fs.readdirSync(absolutePath);
    const markdownFiles = files.filter(file => file.endsWith('.md'));

    if (markdownFiles.length === 0) {
      console.log(colors.yellow('⚠️  目录下没有找到 Markdown 文件'));
      process.exit(0);
    }

    console.log(colors.cyan(`找到 ${markdownFiles.length} 个 Markdown 文件\n`));

    let totalScore = 0;
    let excellentCount = 0;
    let goodCount = 0;
    let passCount = 0;
    let needOptimizeCount = 0;
    let failCount = 0;

    markdownFiles.forEach((file, index) => {
      const filePath = path.join(absolutePath, file);
      console.log(colors.yellow(`[${index + 1}/${markdownFiles.length}] 评估：${file}`));

      const content = fs.readFileSync(filePath, 'utf-8');
      const result = evaluateArticle(content);
      printReport(result);

      // 统计
      totalScore += result.totalScore;
      if (result.grade === '爆文' || result.grade === '优秀') {
        excellentCount++;
      } else if (result.grade === '良好') {
        goodCount++;
      } else if (result.grade === '及格') {
        passCount++;
      } else if (result.grade === '待优化') {
        needOptimizeCount++;
      } else {
        failCount++;
      }

      // 保存评估报告
      const reportPath = filePath.replace(/\.md$/, '-evaluation-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf-8');
      console.log(colors.green(`✅ 评估报告已保存到：${reportPath}\n`));
    });

    // 汇总统计
    console.log('═'.repeat(60));
    console.log(colors.cyan('📊 汇总统计'));
    console.log('═'.repeat(60));
    console.log(colors.yellow('📁 文章数量：') + markdownFiles.length);
    console.log(colors.green('✅ 爆文/优秀：') + excellentCount);
    console.log(colors.blue('📈 良好：') + goodCount);
    console.log(colors.yellow('⚠️  及格：') + passCount);
    console.log(colors.magenta('🔧 待优化：') + needOptimizeCount);
    console.log(colors.red('❌ 不合格：') + failCount);
    console.log(colors.cyan('📊 平均得分：') + (totalScore / markdownFiles.length).toFixed(2) + '/100');
    console.log('═'.repeat(60) + '\n');

  } else {
    console.log(colors.red('错误：路径既不是文件也不是目录'));
    process.exit(1);
  }
}

// 运行主函数
main();
