#!/usr/bin/env node

/**
 * 番茄短篇故事优化助手 - 新作品质量检查脚本
 *
 * 功能：检查新故事是否符合成功公式
 * 输出：质量检查报告
 */

const fs = require('fs');
const path = require('path');

// 工作区根目录
const workspaceRoot = path.join(__dirname, '..', '..', '..', '..');

// 质量标准
const QUALITY_STANDARDS = {
  titleMaxLength: 15,
  titleWarningMax: 25,
  wordCountMin: 10000,
  wordCountMax: 15000,
  goldenFingerRequired: true,
  resonanceRequired: true,
  openingWordsBeforeGoldenFinger: 500,
  openingWordsBeforeFirstClimax: 1000
};

// 金手指关键词
const GOLDEN_FINGER_KEYWORDS = ['读心', '重生', '觉醒', '隐藏', '系统', '透视', '预知', '时间', '空间', '金手指'];

// 社会共鸣话题
const RESONANCE_TOPICS = ['家庭', '婚姻', '职场', '校园', '复仇', '逆袭', '婆媳', '相亲', '买房', '彩礼'];

// 高表现题材
const HIGH_PERFORMANCE_GENRES = ['家庭矛盾', '重生复仇', '读心术', '灵异悬疑'];

// 低表现题材
const LOW_PERFORMANCE_GENRES = ['科幻', '历史穿越', '规则怪谈', '末世求生'];

// 读取新故事文件
function readStoryFile(filePath) {
  const fullPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(workspaceRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ 文件不存在：${fullPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  return { content, path: fullPath };
}

// 提取故事信息
function extractStoryInfo(content) {
  const lines = content.split('\n');

  const story = {
    title: '',
    wordCount: content.length,
    goldenFingerWords: 0,
    resonanceWords: 0,
    firstGoldenFingerLine: -1,
    firstClimaxLine: -1,
    issues: [],
    warnings: [],
    passes: []
  };

  // 提取标题（假设第一行是标题，去除 # 标记）
  for (const line of lines) {
    if (line.trim() && !line.startsWith('#')) {
      story.title = line.trim();
      break;
    }
  }

  // 分析内容
  lines.forEach((line, index) => {
    // 检查金手指关键词
    if (story.firstGoldenFingerLine === -1) {
      for (const keyword of GOLDEN_FINGER_KEYWORDS) {
        if (line.includes(keyword)) {
          story.firstGoldenFingerLine = index + 1;
          break;
        }
      }
    }

    // 检查社会共鸣话题
    for (const topic of RESONANCE_TOPICS) {
      if (line.includes(topic)) {
        story.resonanceWords++;
      }
    }

    // 检查爽点（简化版）
    const climaxKeywords = ['复仇', '反击', '逆袭', '跪了', '完了', '反转', '带走'];
    if (story.firstClimaxLine === -1) {
      for (const keyword of climaxKeywords) {
        if (line.includes(keyword)) {
          story.firstClimaxLine = index + 1;
          break;
        }
      }
    }
  });

  return story;
}

// 验证标题质量
function validateTitleQuality(story) {
  const titleLength = story.title.length;

  if (titleLength === 0) {
    story.issues.push('❌ 未找到标题');
    return;
  }

  if (titleLength > QUALITY_STANDARDS.titleWarningMax) {
    story.issues.push(`❌ 标题过长（${titleLength}字），应≤25字`);
  } else if (titleLength > QUALITY_STANDARDS.titleMaxLength) {
    story.warnings.push(`⚠️ 标题长度一般（${titleLength}字），优化到≤15字效果更好`);
  } else {
    story.passes.push(`✅ 标题长度合适（${titleLength}字）`);
  }

  // 检查金手指
  const hasGoldenFingerInTitle = GOLDEN_FINGER_KEYWORDS.some(keyword =>
    story.title.includes(keyword)
  );

  if (hasGoldenFingerInTitle) {
    story.passes.push('✅ 标题包含明确金手指');
  } else {
    story.issues.push('❌ 标题缺少金手指关键词（读心、重生、觉醒等）');
  }

  // 检查爽点
  const climaxKeywords = ['复仇', '逆袭', '反击', '带走', '跪了', '完了'];
  const hasClimaxInTitle = climaxKeywords.some(keyword =>
    story.title.includes(keyword)
  );

  if (hasClimaxInTitle) {
    story.passes.push('✅ 标题包含爽点');
  } else {
    story.warnings.push('⚠️ 标题缺少爽点，建议添加（复仇、逆袭、反击等）');
  }
}

// 验证字数
function validateWordCount(story) {
  const wordCount = story.wordCount;

  if (wordCount < QUALITY_STANDARDS.wordCountMin) {
    story.issues.push(`❌ 字数不足（${wordCount}字），应≥10k字`);
  } else if (wordCount > QUALITY_STANDARDS.wordCountMax) {
    story.issues.push(`❌ 字数过多（${wordCount}字），应≤15k字`);
  } else {
    story.passes.push(`✅ 字数合适（${wordCount}字）`);
  }
}

// 验证金手指明确性
function validateGoldenFinger(story) {
  if (story.firstGoldenFingerLine === -1) {
    story.issues.push('❌ 未找到金手指觉醒场景');
  } else {
    // 简单估算（假设平均每行20字）
    const wordsBefore = story.firstGoldenFingerLine * 20;
    if (wordsBefore > QUALITY_STANDARDS.openingWordsBeforeGoldenFinger) {
      story.issues.push(`❌ 金手指觉醒过晚（约${wordsBefore}字），应在前500字内出现`);
    } else {
      story.passes.push(`✅ 金手指觉醒时机合适（约${wordsBefore}字）`);
    }
  }
}

// 验证社会共鸣
function validateSocialResonance(story) {
  if (story.resonanceWords === 0) {
    story.issues.push('❌ 缺少社会共鸣话题（家庭、婚姻、职场、复仇等）');
  } else if (story.resonanceWords < 3) {
    story.warnings.push(`⚠️ 社会共鸣话题较少（${story.resonanceWords}次），建议加强`);
  } else {
    story.passes.push(`✅ 包含社会共鸣话题（${story.resonanceWords}次）`);
  }
}

// 验证开篇节奏
function validateOpeningPacing(story) {
  if (story.firstClimaxLine === -1) {
    story.issues.push('❌ 未找到爽点/高潮场景');
  } else {
    const wordsBefore = story.firstClimaxLine * 20;
    if (wordsBefore > QUALITY_STANDARDS.openingWordsBeforeFirstClimax) {
      story.warnings.push(`⚠️ 第一个爽点出现较晚（约${wordsBefore}字），建议在1000字内`);
    } else {
      story.passes.push(`✅ 开篇节奏合适（第一个爽点约${wordsBefore}字）`);
    }
  }
}

// 生成质量检查报告
function generateQualityReport(story, filePath) {
  const totalIssues = story.issues.length;
  const totalWarnings = story.warnings.length;
  const totalPasses = story.passes.length;

  let qualityLevel;
  if (totalIssues === 0 && totalWarnings === 0) {
    qualityLevel = '⭐⭐⭐⭐⭐ 优秀';
  } else if (totalIssues === 0) {
    qualityLevel = '⭐⭐⭐⭐ 良好';
  } else if (totalIssues === 1) {
    qualityLevel = '⭐⭐⭐ 合格';
  } else {
    qualityLevel = '⭐⭐ 待改进';
  }

  const report = `# 番茄短篇故事质量检查报告

**文件**：${filePath}
**标题**：${story.title || '未找到'}
**字数**：${story.wordCount}

---

## 📊 质量评分

**评级**：${qualityLevel}

| 类别 | 数量 |
|------|------|
| ✅ 通过 | ${totalPasses} |
| ⚠️ 警告 | ${totalWarnings} |
| ❌ 问题 | ${totalIssues} |

---

## ✅ 通过项

${story.passes.map(p => p).join('\n')}

${story.warnings.length > 0 ? `
---

## ⚠️ 警告项

${story.warnings.map(w => w).join('\n')}
` : ''}

${story.issues.length > 0 ? `
---

## ❌ 问题项

${story.issues.map(i => i).join('\n')}
` : ''}

---

## 💡 优化建议

${totalIssues > 0 || totalWarnings > 0 ? `
1. **立即修复问题**：
${story.issues.map(i => `   - ${i.replace(/^[❌]\s*/, '')}`).join('\n')}

${totalWarnings > 0 ? `
2. **建议改进**：
${story.warnings.map(w => `   - ${w.replace(/^[⚠️]\s*/, '')}`).join('\n')}
` : ''}

3. **质量提升**：
   - 确保金手指在标题和开篇前500字明确体现
   - 加强社会共鸣话题（家庭矛盾、职场、复仇等）
   - 优化开篇节奏，第一个爽点在1000字内出现
   - 标题长度控制在15字以内
` : '✅ 质量优秀，符合成功公式！'}

---

## 📋 质量标准参考

| 检查项 | 标准 |
|--------|------|
| 标题长度 | ≤15字（最佳），≤25字（可接受） |
| 字数范围 | 10k-15k |
| 金手指明确 | 标题中包含金手指关键词 |
| 金手指觉醒 | 开篇前500字内出现 |
| 社会共鸣 | 包含家庭、婚姻、职场、复仇等话题 |
| 开篇节奏 | 第一个爽点在1000字内出现 |

---

## 🎯 预期效果

基于29个作品的数据验证：
- 优秀作品预期阅读量：**10+次**
- 良好作品预期阅读量：**5-10次**
- 合格作品预期阅读量：**3-5次**
- 待改进作品预期阅读量：**<3次**

---

**检查时间**：${new Date().toISOString().split('T')[0]}
`;

  return report;
}

// 主函数
async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('❌ 用法: node validate-new-story.js <story-file>');
    console.error('   示例: node validate-new-story.js stories/new-story.md');
    process.error('   示例: node validate-new-story.js "/path/to/story.txt"');
    process.exit(1);
  }

  console.log(`🔍 正在检查文件：${filePath}\n`);

  // 读取文件
  const { content, path: fullPath } = readStoryFile(filePath);

  // 提取信息
  const story = extractStoryInfo(content);

  console.log(`📊 标题：${story.title}`);
  console.log(`📊 字数：${story.wordCount}\n`);

  // 验证各项
  console.log('🔬 开始质量检查...\n');

  validateTitleQuality(story);
  validateWordCount(story);
  validateGoldenFinger(story);
  validateSocialResonance(story);
  validateOpeningPacing(story);

  // 生成报告
  const report = generateQualityReport(story, fullPath);

  // 输出报告
  console.log('='.repeat(60));
  console.log(report);
  console.log('='.repeat(60));

  // 保存报告
  const outputDir = path.join(workspaceRoot, '番茄短篇故事集', 'analysis');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const outputFile = path.join(outputDir, `quality-check-${timestamp}.md`);
  fs.writeFileSync(outputFile, report, 'utf-8');

  console.log(`\n✅ 质量检查报告已保存：${outputFile}`);

  // 退出码（有问题返回1）
  if (story.issues.length > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ 错误：', error.message);
  process.exit(1);
});
