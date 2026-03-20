#!/usr/bin/env node

/**
 * 发布包生成脚本
 *
 * 功能:
 * 1. 扫描故事目录,识别高完成度故事
 * 2. 提取标题、正文、章节、字数等关键信息
 * 3. 生成符合番茄小说发布平台要求的JSON格式发布包
 *
 * 使用方法:
 *   node scripts/generate-publish-packages.js
 *
 * 输出:
 *   - 发布包文件: ~/.openclaw/workspace/发布包/{story_id}_{story_name}_publish.json
 *   - 生成报告: ~/.openclaw/workspace/data/publish-packages-report-{timestamp}.md
 */

const fs = require('fs');
const path = require('path');

// 配置
const STORIES_ROOT = path.join(process.env.HOME, '.openclaw/workspace', '番茄短篇故事集', 'stories', '归档故事集');
const OUTPUT_DIR = path.join(process.env.HOME, '.openclaw/workspace', '发布包');
const REPORT_DIR = path.join(process.env.HOME, '.openclaw/workspace', 'data');

// 高优先级故事列表(基于完成度)
const HIGH_PRIORITY_STORIES = [
  { id: '12', name: '地铁末班车的生存游戏', dir: '12_规则诡异_地铁末班车的生存游戏' },
  { id: '39', name: '午夜电梯，全死光了', dir: '39_灵异悬疑_午夜电梯' },
  { id: '34c', name: '重生之我被逼顶替学籍', dir: '34c_婚姻复仇_凤凰男表面老实_我重生后揭开他的真面目' },
  { id: '34b', name: '婆媳大战', dir: '34b_婚姻家庭_婆媳大战' }
];

/**
 * 读取 tasks.md 文件,提取故事元数据
 */
function readStoryMetadata(storyDir) {
  const tasksPath = path.join(STORIES_ROOT, storyDir, 'tasks.md');

  if (!fs.existsSync(tasksPath)) {
    console.log(`⚠️  未找到 tasks.md: ${tasksPath}`);
    return null;
  }

  const content = fs.readFileSync(tasksPath, 'utf-8');

  // 提取元数据
  const metadata = {
    name: '',
    totalChapters: 0,
    targetWordCount: 0,
    actualWordCount: 0,
    status: '',
    chapters: []
  };

  // 提取故事名称
  const nameMatch = content.match(/-?\*?\*?\**故事名称[：:]\s*(.+?)[\r\n]/);
  if (nameMatch) {
    metadata.name = nameMatch[1].trim();
  }

  // 提取总章数
  const chaptersMatch = content.match(/总章数[：:]\s*(\d+)/);
  if (chaptersMatch) {
    metadata.totalChapters = parseInt(chaptersMatch[1]);
  }

  // 提取目标字数
  const wordCountMatch = content.match(/目标字数[：:]\s*([^\r\n]+)/);
  if (wordCountMatch) {
    metadata.targetWordCount = wordCountMatch[1];
  }

  // 提取实际字数
  const actualWordCountMatch = content.match(/实际字数[：:]\s*([^\r\n]+)/);
  if (actualWordCountMatch) {
    metadata.actualWordCount = actualWordCountMatch[1];
  } else {
    // 尝试从"已完成字数"提取
    const completedWordCountMatch = content.match(/已完成字数[：:]\s*([^\r\n]+)/);
    if (completedWordCountMatch) {
      metadata.actualWordCount = completedWordCountMatch[1];
    }
  }

  // 提取状态
  const statusMatch = content.match(/状态[：:]\s*([^\r\n]+)/);
  if (statusMatch) {
    metadata.status = statusMatch[1].trim();
  }

  // 提取章节完成情况 - 支持多种格式
  const chapterFormats = [
    // 格式1: - [x] **T001** - 第1章：错过的末班车（1000字）✅ 已完成 (中文括号)
    /-\s*\[x\]\s*\*\*T(\d+)\*\*\s*-\s*第(\d+)章[：:]\s*(.+?)\s*（(\d+)字）/g,
    // 格式2: - [x] **T001** - 第1章：错过的末班车(1000字) ✅ 已完成 (英文括号)
    /-\s*\[x\]\s*\*\*T(\d+)\*\*\s*-\s*第(\d+)章[：:]\s*(.+?)\s*\((\d+)字\)/g,
    // 格式3: - [x] **T001** - 第1章：错过的末班车 （约1056字）
    /-\s*\[x\]\s*\*\*T(\d+)\*\*\s*-\s*第(\d+)章[：:]\s*(.+?)\s*（约(\d+)字）/g,
    // 格式4: - [x] **T001** - 第1章：错过的末班车 (约1056字)
    /-\s*\[x\]\s*\*\*T(\d+)\*\*\s*-\s*第(\d+)章[：:]\s*(.+?)\s*\(约(\d+)字\)/g,
    // 格式5: - [x] **T001** - 第1章：错过的末班车 ✅ **1056字**
    /-\s*\[x\]\s*\*\*T(\d+)\*\*\s*-\s*第(\d+)章[：:]\s*(.+?)\s*\*\*(\d+)字\*\*/g
  ];

  for (const regex of chapterFormats) {
    let match;
    regex.lastIndex = 0; // 重置正则表达式
    while ((match = regex.exec(content)) !== null) {
      // 避免重复添加
      const exists = metadata.chapters.find(ch => ch.chapterNumber === parseInt(match[2]));
      if (!exists) {
        metadata.chapters.push({
          taskId: match[1],
          chapterNumber: parseInt(match[2]),
          title: match[3].trim(),
          wordCount: parseInt(match[4]),
          completed: true
        });
      }
    }
  }

  // 如果tasks.md中没有总章数,使用实际完成的章节数
  if (metadata.totalChapters === 0 && metadata.chapters.length > 0) {
    metadata.totalChapters = metadata.chapters.length;
  }

  return metadata;
}

/**
 * 读取章节内容
 */
function readChapterContent(storyDir, chapterNumber) {
  const chapterPath = path.join(STORIES_ROOT, storyDir, 'content', `chapter-${String(chapterNumber).padStart(3, '0')}.md`);

  if (!fs.existsSync(chapterPath)) {
    console.log(`⚠️  未找到章节文件: ${chapterPath}`);
    return '';
  }

  return fs.readFileSync(chapterPath, 'utf-8');
}

/**
 * 读取 full_story.md 文件
 */
function readFullStory(storyDir) {
  const fullPath = path.join(STORIES_ROOT, storyDir, 'full_story.md');

  if (!fs.existsSync(fullPath)) {
    return '';
  }

  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * 生成发布包
 */
function generatePublishPackage(story) {
  const storyPath = path.join(STORIES_ROOT, story.dir);

  // 读取元数据
  const metadata = readStoryMetadata(story.dir);
  if (!metadata) {
    return null;
  }

  // 计算总字数
  const totalWordCount = metadata.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  // 读取完整故事
  const fullStory = readFullStory(story.dir);

  // 生成发布包
  const publishPackage = {
    // 基本信息
    storyId: story.id,
    storyName: metadata.name || story.name,
    storyDir: story.dir,

    // 状态信息
    status: metadata.status,
    completionRate: `${(metadata.chapters.length / metadata.totalChapters * 100).toFixed(1)}%`,

    // 统计信息
    totalChapters: metadata.totalChapters,
    completedChapters: metadata.chapters.length,
    totalWordCount: totalWordCount,
    averageWordCount: metadata.chapters.length > 0 ? Math.round(totalWordCount / metadata.chapters.length) : 0,

    // 内容
    title: metadata.name || story.name,
    content: fullStory,

    // 章节列表
    chapters: metadata.chapters.map(ch => ({
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      wordCount: ch.wordCount,
      content: readChapterContent(story.dir, ch.chapterNumber)
    })),

    // 元数据
    metadata: {
      targetWordCount: metadata.targetWordCount,
      actualWordCount: metadata.actualWordCount,
      createdAt: new Date().toISOString()
    },

    // 标签(根据题材推断)
    tags: inferTags(metadata.name || story.name)
  };

  return publishPackage;
}

/**
 * 根据故事名称推断标签
 */
function inferTags(storyName) {
  const tags = [];

  const nameLower = storyName.toLowerCase();

  // 题材标签
  if (nameLower.includes('重生')) tags.push('重生', '复仇');
  if (nameLower.includes('读心') || nameLower.includes('心声')) tags.push('读心');
  if (nameLower.includes('穿越') || nameLower.includes('大秦') || nameLower.includes('崇祯')) tags.push('穿越');
  if (nameLower.includes('灵异') || nameLower.includes('鬼') || nameLower.includes('凶宅')) tags.push('灵异', '悬疑');
  if (nameLower.includes('规则') || nameLower.includes('电梯') || nameLower.includes('地铁')) tags.push('规则怪谈');
  if (nameLower.includes('职场') || nameLower.includes('老板') || nameLower.includes('领导')) tags.push('职场', '逆袭');
  if (nameLower.includes('婆媳') || nameLower.includes('婚姻') || nameLower.includes('凤凰男')) tags.push('婆媳', '婚姻');
  if (nameLower.includes('断亲') || nameLower.includes('养父母') || nameLower.includes('亲生父母')) tags.push('断亲', '复仇');
  if (nameLower.includes('末世') || nameLower.includes('病毒')) tags.push('末世', '求生');

  // 如果没有推断出标签,使用默认标签
  if (tags.length === 0) {
    tags.push('短篇小说', '原创');
  }

  // 限制标签数量(番茄小说平台通常要求3-5个标签)
  return tags.slice(0, 5);
}

/**
 * 保存发布包
 */
function savePublishPackage(package) {
  // 创建输出目录
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 生成文件名
  const fileName = `${package.storyId}_${package.storyName.replace(/[^\w\u4e00-\u9fa5]/g, '_')}_publish.json`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  // 保存文件
  fs.writeFileSync(filePath, JSON.stringify(package, null, 2), 'utf-8');

  return filePath;
}

/**
 * 生成报告
 */
function generateReport(packages) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(REPORT_DIR, `publish-packages-report-${timestamp}.md`);

  let report = `# 发布包生成报告\n\n`;
  report += `**生成时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
  report += `**生成数量**: ${packages.length} 个\n\n`;

  report += `## 📦 发布包列表\n\n`;

  packages.forEach(pkg => {
    report += `### ${pkg.storyId}. ${pkg.storyName}\n\n`;
    report += `- **目录**: \`${pkg.storyDir}\`\n`;
    report += `- **状态**: ${pkg.status}\n`;
    report += `- **完成度**: ${pkg.completionRate} (${pkg.completedChapters}/${pkg.totalChapters}章)\n`;
    report += `- **总字数**: ${pkg.totalWordCount} 字\n`;
    report += `- **平均字数**: ${pkg.averageWordCount} 字/章\n`;
    report += `- **标签**: ${pkg.tags.join(', ')}\n\n`;
  });

  report += `## 📊 统计信息\n\n`;
  report += `- **总故事数**: ${packages.length}\n`;
  report += `- **总字数**: ${packages.reduce((sum, pkg) => sum + pkg.totalWordCount, 0).toLocaleString()} 字\n`;
  report += `- **总章节数**: ${packages.reduce((sum, pkg) => sum + pkg.completedChapters, 0)} 章\n`;
  report += `- **平均字数**: ${Math.round(packages.reduce((sum, pkg) => sum + pkg.totalWordCount, 0) / packages.length)} 字/故事\n\n`;

  report += `## 📂 文件位置\n\n`;
  report += `发布包目录: \`${OUTPUT_DIR}\`\n\n`;
  report += `报告文件: \`${reportPath}\`\n\n`;

  fs.writeFileSync(reportPath, report, 'utf-8');

  return reportPath;
}

/**
 * 主函数
 */
function main() {
  console.log('============================================================');
  console.log('  发布包生成脚本');
  console.log('============================================================\n');

  const packages = [];

  for (const story of HIGH_PRIORITY_STORIES) {
    console.log(`📦 正在处理: ${story.id} - ${story.name}`);

    const pkg = generatePublishPackage(story);
    if (pkg) {
      const filePath = savePublishPackage(pkg);
      packages.push(pkg);

      console.log(`✅ 发布包已生成: ${filePath}`);
      console.log(`   - 完成度: ${pkg.completionRate}`);
      console.log(`   - 字数: ${pkg.totalWordCount} 字\n`);
    } else {
      console.log(`❌ 生成失败: ${story.name}\n`);
    }
  }

  if (packages.length > 0) {
    const reportPath = generateReport(packages);
    console.log(`============================================================`);
    console.log(`✅ 生成完成! 共生成 ${packages.length} 个发布包`);
    console.log(`📄 报告文件: ${reportPath}`);
    console.log(`📂 发布包目录: ${OUTPUT_DIR}`);
    console.log(`============================================================`);
  } else {
    console.log(`❌ 未能生成任何发布包`);
    process.exit(1);
  }
}

// 执行
main();
