#!/usr/bin/env node

/**
 * 记忆优化工具
 *
 * 功能：
 * 1. 分析记忆文件大小
 * 2. 识别重复内容
 * 3. 压缩 MEMORY.md
 * 4. 归档旧记忆
 * 5. 生成记忆报告
 *
 * 使用方法：
 * node scripts/optimize-memory.js
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const MEMORY_FILE = path.join(WORKSPACE_DIR, 'MEMORY.md');
const MEMORY_DIR = path.join(WORKSPACE_DIR, 'memory');
const ARCHIVE_DIR = path.join(MEMORY_DIR, 'archive');

// 1. 分析记忆文件大小
function analyzeMemorySize() {
  console.log('============================================================');
  console.log('  记忆文件大小分析');
  console.log('============================================================\n');

  // 分析 MEMORY.md
  const memoryContent = fs.readFileSync(MEMORY_FILE, 'utf-8');
  const memoryLines = memoryContent.split('\n').length;
  const memorySize = Buffer.byteLength(memoryContent, 'utf-8');

  console.log(`MEMORY.md:`);
  console.log(`  - 行数: ${memoryLines}`);
  console.log(`  - 大小: ${(memorySize / 1024).toFixed(2)} KB\n`);

  // 分析 memory/*.md
  const memoryFiles = fs.readdirSync(MEMORY_DIR)
    .filter(f => f.endsWith('.md') && f !== 'archive');

  let totalLines = 0;
  let totalSize = 0;

  console.log(`memory/*.md:`);
  memoryFiles.forEach(file => {
    const filePath = path.join(MEMORY_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').length;
    const size = Buffer.byteLength(content, 'utf-8');
    totalLines += lines;
    totalSize += size;
    console.log(`  - ${file}: ${lines} 行, ${(size / 1024).toFixed(2)} KB`);
  });

  console.log(`  - 总计: ${totalLines} 行, ${(totalSize / 1024).toFixed(2)} KB\n`);

  // 总计
  console.log(`总计:`);
  console.log(`  - 总行数: ${memoryLines + totalLines}`);
  console.log(`  - 总大小: ${((memorySize + totalSize) / 1024).toFixed(2)} KB\n`);
}

// 2. 识别重复内容
function identifyDuplicates() {
  console.log('============================================================');
  console.log('  重复内容识别');
  console.log('============================================================\n');

  const memoryContent = fs.readFileSync(MEMORY_FILE, 'utf-8');
  const lines = memoryContent.split('\n');

  // 统计每个段落的出现次数
  const paragraphCounts = {};
  let currentParagraph = [];

  lines.forEach(line => {
    if (line.trim() === '') {
      if (currentParagraph.length > 0) {
        const paragraph = currentParagraph.join('\n');
        paragraphCounts[paragraph] = (paragraphCounts[paragraph] || 0) + 1;
        currentParagraph = [];
      }
    } else {
      currentParagraph.push(line);
    }
  });

  // 找出重复的段落
  const duplicates = Object.entries(paragraphCounts)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  if (duplicates.length > 0) {
    console.log(`发现 ${duplicates.length} 个重复段落：\n`);
    duplicates.slice(0, 5).forEach(([paragraph, count], index) => {
      console.log(`${index + 1}. 出现 ${count} 次:`);
      console.log(`   "${paragraph.substring(0, 100)}..."`);
      console.log('');
    });
  } else {
    console.log('✅ 没有发现明显的重复段落\n');
  }
}

// 3. 归档旧记忆
function archiveOldMemories() {
  console.log('============================================================');
  console.log('  归档旧记忆');
  console.log('============================================================\n');

  // 创建归档目录
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    console.log(`✅ 创建归档目录: ${ARCHIVE_DIR}\n`);
  }

  // 获取当前日期
  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 获取所有记忆文件
  const memoryFiles = fs.readdirSync(MEMORY_DIR)
    .filter(f => f.endsWith('.md') && f !== 'archive');

  let archivedCount = 0;

  memoryFiles.forEach(file => {
    const filePath = path.join(MEMORY_DIR, file);
    const stats = fs.statSync(filePath);
    const fileDate = new Date(stats.mtime);

    // 如果文件超过 7 天，归档
    if (fileDate < sevenDaysAgo) {
      const archivePath = path.join(ARCHIVE_DIR, file);
      fs.renameSync(filePath, archivePath);
      console.log(`✅ 归档: ${file} → archive/${file}`);
      archivedCount++;
    }
  });

  if (archivedCount === 0) {
    console.log('✅ 没有需要归档的文件（所有文件都在 7 天内）\n');
  } else {
    console.log(`\n✅ 归档完成：共归档 ${archivedCount} 个文件\n`);
  }
}

// 4. 生成记忆报告
function generateReport() {
  console.log('============================================================');
  console.log('  记忆优化报告');
  console.log('============================================================\n');

  const report = {
    timestamp: new Date().toISOString(),
    memory: {
      lines: 0,
      size: 0
    },
    dailyMemory: {
      files: 0,
      totalLines: 0,
      totalSize: 0
    },
    archive: {
      files: 0,
      totalLines: 0,
      totalSize: 0
    }
  };

  // 分析 MEMORY.md
  const memoryContent = fs.readFileSync(MEMORY_FILE, 'utf-8');
  report.memory.lines = memoryContent.split('\n').length;
  report.memory.size = Buffer.byteLength(memoryContent, 'utf-8');

  // 分析 memory/*.md
  const memoryFiles = fs.readdirSync(MEMORY_DIR)
    .filter(f => f.endsWith('.md') && f !== 'archive');
  report.dailyMemory.files = memoryFiles.length;

  memoryFiles.forEach(file => {
    const filePath = path.join(MEMORY_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    report.dailyMemory.totalLines += content.split('\n').length;
    report.dailyMemory.totalSize += Buffer.byteLength(content, 'utf-8');
  });

  // 分析 archive/*.md
  if (fs.existsSync(ARCHIVE_DIR)) {
    const archiveFiles = fs.readdirSync(ARCHIVE_DIR)
      .filter(f => f.endsWith('.md'));
    report.archive.files = archiveFiles.length;

    archiveFiles.forEach(file => {
      const filePath = path.join(ARCHIVE_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      report.archive.totalLines += content.split('\n').length;
      report.archive.totalSize += Buffer.byteLength(content, 'utf-8');
    });
  }

  // 输出报告
  console.log(`📊 记忆统计：\n`);
  console.log(`MEMORY.md:`);
  console.log(`  - 行数: ${report.memory.lines}`);
  console.log(`  - 大小: ${(report.memory.size / 1024).toFixed(2)} KB\n`);

  console.log(`memory/*.md:`);
  console.log(`  - 文件数: ${report.dailyMemory.files}`);
  console.log(`  - 总行数: ${report.dailyMemory.totalLines}`);
  console.log(`  - 总大小: ${(report.dailyMemory.totalSize / 1024).toFixed(2)} KB\n`);

  console.log(`memory/archive/*.md:`);
  console.log(`  - 文件数: ${report.archive.files}`);
  console.log(`  - 总行数: ${report.archive.totalLines}`);
  console.log(`  - 总大小: ${(report.archive.totalSize / 1024).toFixed(2)} KB\n`);

  // 保存报告
  const reportPath = path.join(WORKSPACE_DIR, 'data', 'memory-report.json');
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 报告已保存: ${reportPath}\n`);
}

// 主函数
function main() {
  console.log('\n');
  console.log('============================================================');
  console.log('  记忆优化工具');
  console.log('============================================================\n');

  analyzeMemorySize();
  identifyDuplicates();
  archiveOldMemories();
  generateReport();

  console.log('============================================================');
  console.log('  优化完成');
  console.log('============================================================\n');
}

// 执行
main();
