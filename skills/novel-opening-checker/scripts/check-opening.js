#!/usr/bin/env node

/**
 * 小说开篇质量检查脚本
 *
 * 功能：
 * 1. 检查开篇必备元素（7个）
 * 2. 计算单句成段占比
 * 3. 分析5步开篇法的执行情况
 * 4. 提供开篇优化建议
 *
 * 使用方法：
 *   node scripts/check-opening.js <开篇章节文件路径>
 *
 * 示例：
 *   node scripts/check-opening.js content/chapter-1.md
 */

const fs = require('fs');
const path = require('path');

// 开篇必备元素检查清单
const OPENING_ELEMENTS = {
  hook: {
    name: '开篇钩子',
    description: '开篇第1-2行必须制造悬念',
    check: (text) => {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) return false;

      const firstTwoLines = lines.slice(0, 2).join(' ');
      const hookKeywords = [
        '诡异', '奇怪', '不对劲', '不正常', '不对',
        '口误', '剧本', '演戏', '监视', '监控',
        '不能', '禁止', '规则', '秘密', '真相',
        '?', '！', '...', '突然', '刹那'
      ];

      return hookKeywords.some(keyword => firstTwoLines.includes(keyword));
    }
  },
  atmosphere: {
    name: '诡异氛围',
    description: '通过细节描写营造诡异氛围',
    check: (text) => {
      const atmosphereKeywords = [
        '诡异', '阴森', '恐怖', '压抑', '寂静',
        '寒冷', '冰冷', '苍白', '惨白', '死寂',
        '僵硬', '机械', '整齐', '标准', '不自然',
        '奇怪', '不对劲', '不正常', '不对'
      ];

      return atmosphereKeywords.some(keyword => text.includes(keyword));
    }
  },
  foreshadowing: {
    name: '持续铺垫',
    description: '多个细节暗示诡异，不直接揭露',
    check: (text) => {
      // 检查是否有多处细节暗示
      const detailPatterns = [
        /嘴角.*上扬/,
        /动作.*整齐/,
        /表情.*相同/,
        /眼神.*盯/,
        /声音.*轻.*轻/,
        /窃窃私语/,
        /小声.*说/
      ];

      let matchCount = 0;
      for (const pattern of detailPatterns) {
        if (pattern.test(text)) {
          matchCount++;
        }
      }

      return matchCount >= 2;
    }
  },
  partialReveal: {
    name: '部分揭露',
    description: '在开篇中段揭露部分真相',
    check: (text) => {
      const revealKeywords = [
        '演戏', '剧本', '导演', '监控', '重置',
        '真相', '秘密', '发现', '原来', '竟然'
      ];

      return revealKeywords.some(keyword => text.includes(keyword));
    }
  },
  rules: {
    name: '规则恐怖',
    description: '使用"规则"制造恐怖氛围',
    check: (text) => {
      const rulePatterns = [
        /规则\d+/,
        /规则.*：/,
        /禁止/,
        /不能/,
        /不许/,
        /规则/
      ];

      return rulePatterns.some(pattern => pattern.test(text));
    }
  },
  twist: {
    name: '反转结尾',
    description: '结尾揭示主角特殊身份',
    check: (text) => {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 5) return false;

      const lastFiveLines = lines.slice(-5).join(' ');
      const twistKeywords = [
        '主角', '你是', '唯一', '特殊', '观众',
        '演员', '导演', '身份', '真实'
      ];

      return twistKeywords.some(keyword => lastFiveLines.includes(keyword));
    }
  },
  suspense: {
    name: '强烈悬念',
    description: '结尾留下强烈悬念，吸引读者看下一章',
    check: (text) => {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 3) return false;

      const lastThreeLines = lines.slice(-3).join(' ');
      const suspensePatterns = [
        /\?/,
        /\!/,
        /\.\.\./,
        /想知道/,
        /秘密/,
        /真相/,
        /为什么/,
        /到底/,
        /原来/
      ];

      return suspensePatterns.some(pattern => pattern.test(lastThreeLines));
    }
  }
};

// 5步开篇法检查
const FIVE_STEP_OPENING = {
  step1: {
    name: '第1步：开篇钩子',
    description: '开篇第1-2行必须制造悬念',
    check: (text) => {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) return false;

      const firstTwoLines = lines.slice(0, 2).join(' ');
      const hookKeywords = [
        '诡异', '奇怪', '不对劲', '不正常', '不对',
        '口误', '剧本', '演戏', '监视', '监控'
      ];

      return hookKeywords.some(keyword => firstTwoLines.includes(keyword));
    }
  },
  step2: {
    name: '第2步：持续铺垫',
    description: '多个细节暗示诡异，不直接揭露（前500字）',
    check: (text) => {
      const first500Chars = text.slice(0, 500);
      const detailPatterns = [
        /嘴角.*上扬/,
        /动作.*整齐/,
        /表情.*相同/,
        /眼神.*盯/
      ];

      let matchCount = 0;
      for (const pattern of detailPatterns) {
        if (pattern.test(first500Chars)) {
          matchCount++;
        }
      }

      return matchCount >= 2;
    }
  },
  step3: {
    name: '第3步：部分揭露',
    description: '偷听到对话，揭露部分真相（500-800字）',
    check: (text) => {
      if (text.length < 800) return false;
      const middlePart = text.slice(500, 800);

      const revealKeywords = [
        '演戏', '剧本', '导演', '监控', '重置'
      ];

      return revealKeywords.some(keyword => middlePart.includes(keyword));
    }
  },
  step4: {
    name: '第4步：规则恐怖',
    description: '通过"规则"制造恐怖氛围（800-1000字）',
    check: (text) => {
      if (text.length < 1000) return false;
      const middlePart = text.slice(800, 1000);

      const rulePatterns = [
        /规则\d+/,
        /规则.*：/,
        /禁止/,
        /不能/
      ];

      return rulePatterns.some(pattern => pattern.test(middlePart));
    }
  },
  step5: {
    name: '第5步：反转结尾',
    description: '揭示主角特殊身份',
    check: (text) => {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 5) return false;

      const lastFiveLines = lines.slice(-5).join(' ');
      const twistKeywords = [
        '主角', '你是', '唯一', '特殊'
      ];

      return twistKeywords.some(keyword => lastFiveLines.includes(keyword));
    }
  }
};

// 计算单句成段占比
function calculateSingleSentenceRatio(text) {
  const paragraphs = text.split('\n').filter(line => line.trim());

  if (paragraphs.length === 0) return 0;

  let singleSentenceCount = 0;
  for (const para of paragraphs) {
    // 移除段落两端的空白
    const trimmedPara = para.trim();

    // 统计句号、问号、感叹号的数量
    const sentenceEnders = (trimmedPara.match(/[。？！]/g) || []).length;

    // 如果段落中只有一个句子结束符号，则是单句成段
    if (sentenceEnders === 1 && trimmedPara.length > 0) {
      singleSentenceCount++;
    }
  }

  return (singleSentenceCount / paragraphs.length) * 100;
}

// 分析开篇质量
function analyzeOpening(text) {
  const results = {
    elements: {},
    fiveStepOpening: {},
    singleSentenceRatio: 0,
    suggestions: []
  };

  // 检查开篇必备元素
  for (const [key, element] of Object.entries(OPENING_ELEMENTS)) {
    results.elements[key] = {
      name: element.name,
      description: element.description,
      passed: element.check(text)
    };
  }

  // 检查5步开篇法
  for (const [key, step] of Object.entries(FIVE_STEP_OPENING)) {
    results.fiveStepOpening[key] = {
      name: step.name,
      description: step.description,
      passed: step.check(text)
    };
  }

  // 计算单句成段占比
  results.singleSentenceRatio = calculateSingleSentenceRatio(text);

  // 生成优化建议
  generateSuggestions(results);

  return results;
}

// 生成优化建议
function generateSuggestions(results) {
  const suggestions = [];

  // 开篇必备元素建议
  for (const [key, element] of Object.entries(results.elements)) {
    if (!element.passed) {
      suggestions.push(`❌ ${element.name}：${element.description}`);
    }
  }

  // 5步开篇法建议
  for (const [key, step] of Object.entries(results.fiveStepOpening)) {
    if (!step.passed) {
      suggestions.push(`⚠️ ${step.name}：${step.description}`);
    }
  }

  // 单句成段占比建议
  if (results.singleSentenceRatio < 30) {
    suggestions.push(`⚠️ 单句成段占比过低（${results.singleSentenceRatio.toFixed(1)}%），建议提高到30-50%`);
  } else if (results.singleSentenceRatio > 50) {
    suggestions.push(`⚠️ 单句成段占比过高（${results.singleSentenceRatio.toFixed(1)}%），建议降低到30-50%`);
  }

  results.suggestions = suggestions;
}

// 生成检查报告
function generateReport(filePath, results) {
  const report = [];

  report.push('# 开篇质量检查报告\n');
  report.push(`文件：${filePath}`);
  report.push(`检查时间：${new Date().toLocaleString()}\n`);

  // 开篇必备元素检查
  report.push('## 开篇必备元素检查\n');

  let passedCount = 0;
  for (const [key, element] of Object.entries(results.elements)) {
    const status = element.passed ? '✅' : '❌';
    report.push(`${status} ${element.name}：${element.description}`);
    if (element.passed) passedCount++;
  }

  report.push(`\n通过率：${passedCount}/${Object.keys(results.elements).length}\n`);

  // 5步开篇法检查
  report.push('## 5步开篇法检查\n');

  let stepPassedCount = 0;
  for (const [key, step] of Object.entries(results.fiveStepOpening)) {
    const status = step.passed ? '✅' : '⚠️';
    report.push(`${status} ${step.name}：${step.description}`);
    if (step.passed) stepPassedCount++;
  }

  report.push(`\n通过率：${stepPassedCount}/${Object.keys(results.fiveStepOpening).length}\n`);

  // 单句成段占比
  report.push('## 单句成段占比\n');
  report.push(`当前占比：${results.singleSentenceRatio.toFixed(1)}%`);
  report.push(`建议范围：30-50%\n`);

  if (results.singleSentenceRatio < 30) {
    report.push('⚠️ 占比过低，建议增加单句成段');
  } else if (results.singleSentenceRatio > 50) {
    report.push('⚠️ 占比过高，建议减少单句成段');
  } else {
    report.push('✅ 占比合适');
  }

  report.push('');

  // 优化建议
  report.push('## 优化建议\n');

  if (results.suggestions.length === 0) {
    report.push('✅ 开篇质量优秀，无需优化！');
  } else {
    for (const suggestion of results.suggestions) {
      report.push(suggestion);
    }
  }

  return report.join('\n');
}

// 主函数
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('使用方法：node scripts/check-opening.js <开篇章节文件路径>');
    console.error('示例：node scripts/check-opening.js content/chapter-1.md');
    process.exit(1);
  }

  const filePath = args[0];

  if (!fs.existsSync(filePath)) {
    console.error(`错误：文件不存在：${filePath}`);
    process.exit(1);
  }

  // 读取文件内容
  const text = fs.readFileSync(filePath, 'utf-8');

  // 分析开篇质量
  const results = analyzeOpening(text);

  // 生成报告
  const report = generateReport(filePath, results);

  // 输出报告
  console.log(report);
}

// 运行主函数
main();
