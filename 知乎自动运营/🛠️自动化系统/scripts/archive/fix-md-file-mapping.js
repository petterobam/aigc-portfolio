#!/usr/bin/env node

/**
 * fix-md-file-mapping.js
 *
 * 修复 Markdown 文件映射问题
 *
 * 问题：标准化元数据文件名和实际 Markdown 文件名不匹配
 * 解决方案：创建符号链接或复制文件，使文件名匹配
 */

'use strict';

const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const ZHIHU_AUTO_DIR = path.join(WORKSPACE_DIR, '知乎自动运营');
const HIGH_PRIORITY_DIR = path.join(ZHIHU_AUTO_DIR, '📤待发布', '🔥高优先级');
const ARTICLE_DRAFT_DIR = path.join(ZHIHU_AUTO_DIR, '✍️文章草稿');

// 文件映射：标准化元数据文件名 -> 实际 Markdown 文件路径
const FILE_MAPPING = {
  'MoE架构-GPT4秘密武器-standardized.json': 'MoE架构-GPT4的秘密武器-稀疏激活与路由设计.md',
  'OpenClaw-ACP原理深度解析-standardized.json': 'OpenClaw-ACP-原理深度解析-从零理解Agent控制协议.md',
  '位置编码-Sinusoidal到RoPE-standardized.json': '位置编码从Sinusoidal到RoPE-一篇文章讲透.md',
  '后端开发-CI-CD自动化-standardized.json': '后端开发-用OpenClaw自动化CI-CD效率提升10倍.md',
  '大模型推理加速-standardized.json': null, // 需要从其他地方查找
  '大模型部署-从云端到边缘设备-standardized.json': '大模型部署-从云端到边缘设备.md',
  '用OpenClaw300天效率翻倍技巧-standardized.json': '用OpenClaw300天我总结出10个让效率翻倍的技巧.md',
  'OpenClaw加Claude3-构建你的专属AI编程助手-standardized.json': 'OpenClaw加Claude3-构建你的专属AI编程助手.md',
  'OpenClaw多模型协同-GPT4加Claude3加DeepSeek组拳出击-standardized.json': 'OpenClaw多模型协同-GPT4加Claude3加DeepSeek组拳出击.md',
  'OpenClaw进阶-从零开发自定义Skill-含完整代码-standardized.json': 'OpenClaw进阶-从零开发自定义Skill-含完整代码.md',
  '别再手动写周报了-我用OpenClaw自动生成周报-领导都说好-standardized.json': '别再手动写周报了-我用OpenClaw自动生成周报-领导都说好.md',
};

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
  }[level] || 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function findMdFile(targetName, searchDirs) {
  // 在多个目录中查找 Markdown 文件
  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) {
      continue;
    }

    const mdFiles = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

    // 尝试精确匹配
    const exactMatch = mdFiles.find(f => f === targetName);
    if (exactMatch) {
      return path.join(dir, exactMatch);
    }

    // 尝试模糊匹配
    const fuzzyMatch = mdFiles.find(f => f.includes(targetName.substring(0, 10)));
    if (fuzzyMatch) {
      return path.join(dir, fuzzyMatch);
    }
  }

  return null;
}

function main() {
  console.log(`
════════════════════════════════════════════════════════════
  修复 Markdown 文件映射问题
════════════════════════════════════════════════════════════
  `);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const [metadataFile, mdFileName] of Object.entries(FILE_MAPPING)) {
    const metadataPath = path.join(HIGH_PRIORITY_DIR, metadataFile);

    // 检查元数据文件是否存在
    if (!fs.existsSync(metadataPath)) {
      log(`元数据文件不存在: ${metadataFile}`, 'warning');
      continue;
    }

    // 如果没有映射，尝试自动查找
    if (!mdFileName) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      const title = metadata.title;

      if (!title) {
        log(`元数据中没有标题: ${metadataFile}`, 'warning');
        continue;
      }

      // 从标题生成可能的文件名
      const possibleMdName = `${title}.md`;
      const foundMdPath = findMdFile(possibleMdName, [HIGH_PRIORITY_DIR, ARTICLE_DRAFT_DIR]);

      if (foundMdPath) {
        log(`找到文件: ${possibleMdName} -> ${foundMdPath}`, 'info');
        // 复制文件到高优先级目录
        const targetPath = path.join(HIGH_PRIORITY_DIR, possibleMdName);
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(foundMdPath, targetPath);
          log(`复制文件: ${foundMdPath} -> ${targetPath}`, 'success');
          successCount++;
        } else {
          log(`文件已存在: ${targetPath}`, 'info');
          skipCount++;
        }
      } else {
        log(`找不到文件: ${possibleMdName}`, 'error');
        errorCount++;
      }
      continue;
    }

    // 有明确映射的情况
    const targetMdPath = path.join(HIGH_PRIORITY_DIR, mdFileName);

    // 检查目标文件是否已存在
    if (fs.existsSync(targetMdPath)) {
      log(`目标文件已存在: ${mdFileName}`, 'info');
      skipCount++;
      continue;
    }

    // 在高优先级目录中查找
    let sourceMdPath = path.join(HIGH_PRIORITY_DIR, mdFileName);
    if (!fs.existsSync(sourceMdPath)) {
      // 在文章草稿目录中查找
      sourceMdPath = path.join(ARTICLE_DRAFT_DIR, mdFileName);
    }

    if (!fs.existsSync(sourceMdPath)) {
      log(`找不到源文件: ${mdFileName}`, 'error');
      errorCount++;
      continue;
    }

    // 复制文件
    fs.copyFileSync(sourceMdPath, targetMdPath);
    log(`复制文件: ${sourceMdPath} -> ${targetMdPath}`, 'success');
    successCount++;
  }

  console.log(`
════════════════════════════════════════════════════════════
  修复摘要
════════════════════════════════════════════════════════════
  成功: ${successCount}
  跳过: ${skipCount}
  失败: ${errorCount}
════════════════════════════════════════════════════════════
    `);
}

main();
