#!/usr/bin/env node

/**
 * 番茄小说发布内容预处理脚本
 *
 * 功能：
 * 1. 读取故事目录下的所有章节文件
 * 2. 解析 tasks.md 获取元数据
 * 3. 合并章节内容
 * 4. 生成适合自动发布的数据结构
 *
 * 使用方法：
 *   node scripts/prepare-publish-content.js <故事序号>
 *
 * 示例：
 *   node scripts/prepare-publish-content.js 12
 */

const fs = require('fs');
const path = require('path');

// 配置
const BASE_DIR = path.join(__dirname, '..');
const STORIES_DIR = path.join(BASE_DIR, '番茄短篇故事集/stories/归档故事集');
const OUTPUT_DIR = path.join(BASE_DIR, '番茄短篇故事集/发布包');

// ANSI 颜色
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// 日志工具
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.cyan);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

/**
 * 解析 tasks.md 获取元数据
 */
function parseTasksMetadata(tasksPath) {
  logInfo(`解析元数据: ${tasksPath}`);

  const content = fs.readFileSync(tasksPath, 'utf8');

  const metadata = {
    storyName: '',
    targetWordCount: 0,
    totalChapters: 0,
    chapterTitles: {},
    completedChapters: [],
    totalCompletedChapters: 0,
  };

  // 提取故事名称
  const nameMatch = content.match(/故事名称：(.+)/);
  if (nameMatch) {
    metadata.storyName = nameMatch[1].trim();
  }

  // 提取目标字数
  const wordCountMatch = content.match(/目标字数：([\d,]+)字/);
  if (wordCountMatch) {
    metadata.targetWordCount = parseInt(wordCountMatch[1].replace(/,/g, ''), 10);
  }

  // 提取总章数
  const chaptersMatch = content.match(/总章数：(\d+)章/);
  if (chaptersMatch) {
    metadata.totalChapters = parseInt(chaptersMatch[1], 10);
  }

  // 提取章节标题和完成状态
  const chapterRegex = /- \[([ x])\] \*\*T(\d+)\*\* - (?:第(\d+)章：)?([^(]+)\((\d+)字\)(?: ✅)?/g;
  let match;
  while ((match = chapterRegex.exec(content)) !== null) {
    const completed = match[1] === 'x';
    const taskId = match[2];
    const chapterNum = match[3] || taskId;
    const chapterTitle = match[4].trim();
    const wordCount = parseInt(match[5], 10);

    metadata.chapterTitles[taskId] = {
      chapterNum,
      title: chapterTitle,
      wordCount,
      completed,
    };

    if (completed) {
      metadata.completedChapters.push({
        taskId,
        chapterNum,
        title: chapterTitle,
        wordCount,
      });
    }
  }

  metadata.totalCompletedChapters = metadata.completedChapters.length;

  logSuccess(`解析完成: ${metadata.storyName}`);
  logInfo(`  - 总章数: ${metadata.totalChapters}`);
  logInfo(`  - 已完成: ${metadata.totalCompletedChapters} 章`);

  return metadata;
}

/**
 * 读取章节内容
 */
function readChapterContent(chapterPath) {
  const content = fs.readFileSync(chapterPath, 'utf8');

  // 提取标题（第一行）
  const lines = content.split('\n');
  const titleMatch = lines[0].match(/^#+\s*(.+)$/);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // 提取正文内容（从第二行开始）
  let body = lines.slice(1).join('\n').trim();

  // 去除 Markdown 格式标记
  body = body
    .replace(/#{2,6}\s+/g, '') // 去除二级到六级标题标记
    .replace(/\*\*(.+?)\*\*/g, '$1') // 去除加粗
    .replace(/\*(.+?)\*/g, '$1') // 去除斜体
    .replace(/`(.+?)`/g, '$1') // 去除代码标记
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 去除链接，保留文本
    .replace(/^>\s+/gm, ''); // 去除引用标记

  return {
    title,
    body,
    originalContent: content,
  };
}

/**
 * 合并所有章节
 */
function mergeChapters(storyDir, metadata) {
  logInfo('读取章节内容...');

  const contentDir = path.join(storyDir, 'content');
  const chapters = [];

  // 读取所有 chapter-XXX.md 文件
  const files = fs.readdirSync(contentDir)
    .filter(file => file.match(/^chapter-\d+\.md$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0], 10);
      const numB = parseInt(b.match(/\d+/)[0], 10);
      return numA - numB;
    });

  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const { title, body, originalContent } = readChapterContent(filePath);

    chapters.push({
      file,
      title,
      body,
      originalContent,
      wordCount: body.length,
    });
  }

  logSuccess(`读取完成: ${chapters.length} 章`);

  return chapters;
}

/**
 * 生成发布包数据结构
 */
function generatePublishPackage(storyDir, storyId, metadata, chapters) {
  logInfo('生成发布包数据结构...');

  // 计算总字数
  const totalWordCount = chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);

  // 生成简介（从第一章提取前 200 字）
  const intro = chapters.length > 0
    ? chapters[0].body.substring(0, 200) + (chapters[0].body.length > 200 ? '...' : '')
    : '';

  // 生成标签（从目录名提取类型）
  const dirName = path.basename(storyDir);
  const typeMatch = dirName.match(/^\d+_(.+?)_/);
  const tags = typeMatch ? [typeMatch[1]] : [];

  // 生成完整的小说内容（所有章节合并）
  const fullContent = chapters.map(chapter => {
    const separator = '\n\n---\n\n';
    return `${chapter.title}${separator}${chapter.body}`;
  }).join('\n\n---\n\n');

  const publishPackage = {
    metadata: {
      storyId,
      storyName: metadata.storyName,
      type: tags[0] || '小说',
      targetWordCount: metadata.targetWordCount,
      actualWordCount: totalWordCount,
      totalChapters: metadata.totalChapters,
      completedChapters: metadata.totalCompletedChapters,
      createdAt: new Date().toISOString(),
    },
    content: {
      title: metadata.storyName,
      intro,
      tags,
      fullContent,
      chapters: chapters.map((chapter, index) => ({
        chapterNum: index + 1,
        title: chapter.title,
        content: chapter.body,
        wordCount: chapter.wordCount,
      })),
    },
    stats: {
      totalWordCount,
      avgChapterWordCount: totalWordCount / chapters.length,
      completionRate: (metadata.totalCompletedChapters / metadata.totalChapters) * 100,
    },
  };

  logSuccess('生成完成');
  logInfo(`  - 标题: ${publishPackage.content.title}`);
  logInfo(`  - 总字数: ${totalWordCount}`);
  logInfo(`  - 章节数: ${chapters.length}`);
  logInfo(`  - 完成度: ${publishPackage.stats.completionRate.toFixed(1)}%`);

  return publishPackage;
}

/**
 * 保存发布包
 */
function savePublishPackage(storyId, publishPackage) {
  // 确保输出目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 生成文件名
  const fileName = `${storyId}_${publishPackage.content.title.replace(/\s+/g, '_')}_publish.json`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  // 保存 JSON 文件
  fs.writeFileSync(filePath, JSON.stringify(publishPackage, null, 2), 'utf8');

  logSuccess(`发布包已保存: ${filePath}`);

  return filePath;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    logError('用法: node scripts/prepare-publish-content.js <故事序号>');
    logInfo('示例: node scripts/prepare-publish-content.js 12');
    process.exit(1);
  }

  const storyId = args[0];

  log('');
  log('='.repeat(60), colors.blue);
  log('番茄小说发布内容预处理脚本', colors.blue);
  log('='.repeat(60), colors.blue);
  log('');

  // 查找故事目录
  const storyDirs = fs.readdirSync(STORIES_DIR)
    .filter(dir => dir.startsWith(`${storyId}_`));

  if (storyDirs.length === 0) {
    logError(`未找到故事目录: ${storyId}`);
    process.exit(1);
  }

  if (storyDirs.length > 1) {
    logWarning(`找到多个匹配目录，使用第一个: ${storyDirs[0]}`);
  }

  const storyDir = path.join(STORIES_DIR, storyDirs[0]);
  logInfo(`故事目录: ${storyDir}`);

  // 解析元数据
  const tasksPath = path.join(storyDir, 'tasks.md');
  if (!fs.existsSync(tasksPath)) {
    logError(`未找到 tasks.md: ${tasksPath}`);
    process.exit(1);
  }

  const metadata = parseTasksMetadata(tasksPath);

  // 读取章节内容
  const chapters = mergeChapters(storyDir, metadata);

  // 生成发布包
  const publishPackage = generatePublishPackage(storyDir, storyId, metadata, chapters);

  // 保存发布包
  const filePath = savePublishPackage(storyId, publishPackage);

  log('');
  log('='.repeat(60), colors.green);
  logSuccess('预处理完成！');
  log('='.repeat(60), colors.green);
  log('');
  logInfo('发布包文件路径:');
  log(filePath, colors.cyan);
  log('');
}

// 运行主函数
main();
