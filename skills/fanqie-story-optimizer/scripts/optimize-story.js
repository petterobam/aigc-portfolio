#!/usr/bin/env node

/**
 * 番茄短篇故事优化助手 - 单个作品优化脚本
 *
 * 功能：为单个低表现作品生成完整的优化方案
 * 输出：优化报告（Markdown格式）
 */

const fs = require('fs');
const path = require('path');

// 工作区根目录
const workspaceRoot = path.join(__dirname, '..', '..', '..', '..');

// 成功公式权重
const SUCCESS_FORMULA = {
  goldenFinger: 0.4,  // 明确金手指 40%
  socialResonance: 0.3,  // 社会共鸣 30%
  titleSuspense: 0.2,  // 标题悬念 20%
  wordCount: 0.1  // 合适字数 10%
};

// 高表现题材数据
const HIGH_PERFORMANCE_GENRES = {
  '家庭矛盾': { avgReading: 11.3, recommendation: '⭐⭐⭐⭐⭐' },
  '重生复仇': { avgReading: 7.2, recommendation: '⭐⭐⭐⭐⭐' },
  '读心术': { avgReading: 6.5, recommendation: '⭐⭐⭐⭐⭐' },
  '灵异悬疑': { avgReading: 4.0, recommendation: '⭐⭐⭐' },
  '规则怪谈': { avgReading: 0.5, recommendation: '⚠️ 谨慎' },
  '末世求生': { avgReading: 0.7, recommendation: '⚠️ 谨慎' },
  '历史穿越': { avgReading: 0.3, recommendation: '❌ 避免' },
  '科幻': { avgReading: 0, recommendation: '❌ 避免' }
};

// 标题长度数据
const TITLE_LENGTH_STATS = {
  short: { max: 15, avgReading: 6.5 },
  medium: { max: 25, avgReading: 4.8 },
  long: { max: Infinity, avgReading: 3.2 }
};

// 读取数据文件
function loadStoriesData() {
  const dataDir = path.join(workspaceRoot, 'data');
  const files = fs.readdirSync(dataDir).filter(f => f.startsWith('all-stories-') && f.endsWith('.json'));

  if (files.length === 0) {
    console.error('❌ 未找到数据文件，请先运行 fanqie-data-fetcher 抓取数据');
    process.exit(1);
  }

  // 使用最新的数据文件
  files.sort().reverse();
  const latestFile = files[0];
  const filePath = path.join(dataDir, latestFile);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  console.log(`✅ 已加载数据文件：${latestFile}`);
  return data;
}

// 查找指定故事
function findStory(data, storyId) {
  return data.find(story =>
    story.id === storyId ||
    story.title === storyId ||
    story.id.toString() === storyId
  );
}

// 诊断金手指明确性
function diagnoseGoldenFinger(story) {
  const issues = [];
  const suggestions = [];

  // 检查标题是否提到金手指
  const goldenFingerKeywords = ['读心', '重生', '觉醒', '隐藏', '系统', '透视', '预知', '时间', '空间'];
  const hasGoldenFingerInTitle = goldenFingerKeywords.some(keyword => story.title.includes(keyword));

  if (!hasGoldenFingerInTitle) {
    issues.push('标题中没有明确提到金手指类型');
    suggestions.push('在标题中添加明确的金手指关键词（如：读心、重生、觉醒等）');
  }

  // 检查金手指明确性（假设有数据字段）
  if (story.goldenFingerClarity && story.goldenFingerClarity < 3) {
    issues.push(`金手指明确性评分：${story.goldenFingerClarity}/5，低于推荐值（≥4）`);
    suggestions.push('在开篇前500字明确金手指的觉醒和使用方式');
  }

  return {
    score: hasGoldenFingerInTitle ? 1 : 0,
    issues,
    suggestions
  };
}

// 诊断社会共鸣强度
function diagnoseSocialResonance(story) {
  const issues = [];
  const suggestions = [];

  // 检查题材是否属于高表现类型
  const genre = story.genre || '未知';
  const genreData = HIGH_PERFORMANCE_GENRES[genre];

  if (genreData && genreData.recommendation.includes('避免')) {
    issues.push(`题材"${genre}"属于低表现类型（平均${genreData.avgReading}阅读）`);
    suggestions.push(`建议改为高表现题材：家庭矛盾、重生复仇、读心术`);
  }

  // 检查是否有社会共鸣话题
  const resonanceTopics = ['家庭', '婚姻', '职场', '校园', '复仇', '逆袭'];
  const hasResonanceTopic = resonanceTopics.some(topic =>
    story.title.includes(topic) || (story.genre && story.genre.includes(topic))
  );

  if (!hasResonanceTopic) {
    issues.push('缺少强社会共鸣话题');
    suggestions.push('添加家庭矛盾、社会热点等共鸣元素');
  }

  return {
    score: hasResonanceTopic ? 1 : (genreData && genreData.avgReading >= 5 ? 0.8 : 0.5),
    issues,
    suggestions
  };
}

// 诊断标题质量
function diagnoseTitleQuality(story) {
  const issues = [];
  const suggestions = [];

  const titleLength = story.title.length;

  // 检查标题长度
  if (titleLength > 25) {
    issues.push(`标题过长（${titleLength}字），推荐≤15字`);
    suggestions.push('缩短标题，突出金手指和爽点');
  } else if (titleLength > 15) {
    issues.push(`标题长度一般（${titleLength}字），优化到≤15字可提升效果`);
    suggestions.push('考虑缩短标题');
  } else {
    // 标题长度合理，检查是否包含爽点
    const suspenseKeywords = ['复仇', '逆袭', '反击', '带走', '跪了', '完了', '全走了'];
    const hasSuspense = suspenseKeywords.some(keyword => story.title.includes(keyword));

    if (!hasSuspense)) {
      issues.push('标题缺少爽点或悬念');
      suggestions.push('在标题中添加爽点关键词（如：复仇、逆袭、反击等）');
    }
  }

  // 计算得分
  let score;
  if (titleLength <= 15) {
    score = 1;
  } else if (titleLength <= 25) {
    score = 0.7;
  } else {
    score = 0.4;
  }

  return {
    score,
    issues,
    suggestions
  };
}

// 诊断字数合理性
function diagnoseWordCount(story) {
  const issues = [];
  const suggestions = [];

  const wordCount = story.wordCount || 0;

  if (wordCount > 20000) {
    issues.push(`字数过多（${wordCount}字），>20k字有明显负面影响`);
    suggestions.push('压缩到10k-15k范围，删减冗长章节');
  } else if (wordCount >= 10000 && wordCount <= 15000) {
    // 最佳范围，无问题
  } else if (wordCount < 6000) {
    issues.push(`字数偏少（${wordCount}字），可能影响完读率`);
    suggestions.push('扩充到10k-15k范围，增加情节密度');
  }

  // 计算得分
  let score;
  if (wordCount >= 10000 && wordCount <= 15000) {
    score = 1;
  } else if (wordCount >= 6000 && wordCount <= 20000) {
    score = 0.8;
  } else {
    score = 0.5;
  }

  return {
    score,
    issues,
    suggestions
  };
}

// 生成备选新标题
function generateNewTitles(story) {
  const titles = [];

  // 尝试提取金手指类型
  let goldenFinger = '读心术'; // 默认
  if (story.title.includes('重生')) goldenFinger = '重生';
  if (story.title.includes('复仇')) goldenFinger = '重生+复仇';

  // 模板1：金手指 + 爽点
  titles.push({
    template: '金手指 + 爽点',
    title: `${goldenFinger}后，我反转了局面`,
    reason: '突出金手指类型，强调反转爽点'
  });

  // 模板2：共鸣 + 金手指
  titles.push({
    template: '共鸣 + 金手指',
    title: `被逼绝路后，我觉醒${goldenFinger}`,
    reason: '制造冲突共鸣，明确金手指'
  });

  // 模板3：冲突 + 金手指
  titles.push({
    template: '冲突 + 金手指',
    title: `${goldenFinger}：所有人都在演我`,
    reason: '强调冲突，金手指前置'
  });

  return titles;
}

// 生成开篇优化建议
function generateOpeningOptimization(story) {
  return {
    currentProblem: '开篇前500字缺少金手指觉醒，第一个爽点出现较晚（>1000字）',
    optimizationGoal: '金手指在≤100字出现，第一个爽点在≤400字出现',
    suggestions: [
      '直接在开头插入金手指觉醒场景',
      '使用"心声"提示符号：【心声内容】',
      '立即建立"外表vs内心"的对比',
      '快速让主角获得优势'
    ]
  };
}

// 生成优化报告
function generateOptimizationReport(story, diagnosis) {
  const report = `# 番茄短篇故事优化方案

**原标题**：${story.title}
**阅读量**：${story.reading || 0}
**字数**：${story.wordCount || 0}
**题材**：${story.genre || '未知'}
**发布时间**：${story.publishTime || '未知'}

---

## 📊 问题诊断

### 1. 金手指明确性（权重40%）
**得分**：${diagnosis.goldenFinger.score * 100}%

**问题**：
${diagnosis.goldenFinger.issues.map(issue => `- ❌ ${issue}`).join('\n')}

**建议**：
${diagnosis.goldenFinger.suggestions.map(s => `- ✅ ${s}`).join('\n')}

### 2. 社会共鸣强度（权重30%）
**得分**：${diagnosis.socialResonance.score * 100}%

**问题**：
${diagnosis.socialResonance.issues.map(issue => `- ❌ ${issue}`).join('\n')}

**建议**：
${diagnosis.socialResonance.suggestions.map(s => `- ✅ ${s}`).join('\n')}

### 3. 标题质量（权重20%）
**得分**：${diagnosis.titleQuality.score * 100}%

**问题**：
${diagnosis.titleQuality.issues.map(issue => `- ❌ ${issue}`).join('\n')}

**建议**：
${diagnosis.titleQuality.suggestions.map(s => `- ✅ ${s}`).join('\n')}

### 4. 字数合理性（权重10%）
**得分**：${diagnosis.wordCount.score * 100}%

**问题**：
${diagnosis.wordCount.issues.map(issue => `- ❌ ${issue}`).join('\n')}

**建议**：
${diagnosis.wordCount.suggestions.map(s => `- ✅ ${s}`).join('\n')}

---

## 🎯 优化方案

### 标题优化（3个备选）

${diagnosis.newTitles.map((t, i) => `
#### 方案${i + 1}：${t.template}
\`\`\`
${t.title}
\`\`\`
- 理由：${t.reason}
`).join('\n')}

### 开篇优化

**当前问题**：${diagnosis.openingOptimization.currentProblem}

**优化目标**：${diagnosis.openingOptimization.optimizationGoal}

**具体建议**：
${diagnosis.openingOptimization.suggestions.map(s => `- ✅ ${s}`).join('\n')}

---

## 📊 预期效果

### 优化前
- 阅读量：${story.reading || 0}
- 金手指明确性：${diagnosis.goldenFinger.score * 100}%
- 社会共鸣：${diagnosis.socialResonance.score * 100}%
- 标题质量：${diagnosis.titleQuality.score * 100}%

### 优化后（预测）
- 阅读量：**${Math.round(5 + diagnosis.goldenFinger.score * 5 + diagnosis.socialResonance.score * 3)}-10次**
- 金手指明确性：100%
- 社会共鸣：100%
- 标题质量：100%

**预期提升**：${story.reading === 0 ? '从0阅读起步，预计提升到5-10阅读' : `从${story.reading}阅读提升到${Math.round(story.reading * 2)}-10阅读`}

---

## 💡 优化原理

基于29个已发布故事的数据分析：
- 明确金手指作品平均阅读：6.5次
- 不明确金手指作品平均阅读：1.5次
- 社会共鸣强的作品平均阅读：11.3次
- 标题≤15字的作品平均阅读：6.5次

---

**报告生成时间**：${new Date().toISOString().split('T')[0]}
**数据来源**：番茄小说作家后台（29个故事）
`;

  return report;
}

// 主函数
async function main() {
  const storyId = process.argv[2];

  if (!storyId) {
    console.error('❌ 用法: node optimize-story.js <story-id|story-title>');
    console.error('   示例: node optimize-story.js "职场整顿：既然老板想白嫖..."');
    console.error('   示例: node optimize-story.js 12345');
    process.exit(1);
  }

  console.log(`🔍 正在查找故事：${storyId}...`);

  // 加载数据
  const data = loadStoriesData();

  // 查找故事
  const story = findStory(data, storyId);

  if (!story) {
    console.error(`❌ 未找到故事：${storyId}`);
    console.log('💡 可用故事列表：');
    data.slice(0, 10).forEach((s, i) => {
      console.log(`  ${i + 1}. [${s.id}] ${s.title} (${s.reading || 0}阅读)`);
    });
    if (data.length > 10) {
      console.log(`  ... 还有 ${data.length - 10} 个故事`);
    }
    process.exit(1);
  }

  console.log(`✅ 找到故事：${story.title} (${story.reading || 0}阅读)`);
  console.log(`🔬 正在分析...`);

  // 诊断
  const diagnosis = {
    goldenFinger: diagnoseGoldenFinger(story),
    socialResonance: diagnoseSocialResonance(story),
    titleQuality: diagnoseTitleQuality(story),
    wordCount: diagnoseWordCount(story),
    newTitles: generateNewTitles(story),
    openingOptimization: generateOpeningOptimization(story)
  };

  // 生成报告
  const report = generateOptimizationReport(story, diagnosis);

  // 输出报告
  console.log('\n' + '='.repeat(60));
  console.log(report);
  console.log('='.repeat(60));

  // 保存报告
  const outputDir = path.join(workspaceRoot, '番茄短篇故事集', 'analysis');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const outputFile = path.join(outputDir, `optimization-${story.id || 'unknown'}-${timestamp}.md`);
  fs.writeFileSync(outputFile, report, 'utf-8');

  console.log(`\n✅ 优化报告已保存：${outputFile}`);
}

main().catch(error => {
  console.error('❌ 错误：', error.message);
  process.exit(1);
});
