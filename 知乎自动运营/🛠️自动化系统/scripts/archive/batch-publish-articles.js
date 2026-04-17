#!/usr/bin/env node

/**
 * batch-publish-articles.js
 *
 * 知乎文章批量发布脚本
 *
 * 功能：
 *   1. 读取标准化元数据
 *   2. 加载对应的 Markdown 内容
 *   3. 批量发布到知乎（专栏文章或回答）
 *   4. 记录发布结果
 *
 * 使用方法：
 *   node scripts/batch-publish-articles.js [--dry-run] [--limit N]
 *
 * 选项：
 *   --dry-run: 只模拟发布，不实际发布
 *   --limit N: 只发布前 N 篇文章
 *
 * 依赖：
 *   - playwright
 *   - ../auth/zhihu-cookies-latest.json (知乎 Cookie)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const ZHIHU_AUTO_DIR = path.join(WORKSPACE_DIR, '知乎自动运营');
const PUBLISH_DIR = path.join(ZHIHU_AUTO_DIR, '📤待发布');
const HIGH_PRIORITY_DIR = path.join(PUBLISH_DIR, '🔥高优先级');
const AUTH_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统', 'auth');
const REPORTS_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统', 'reports');

const CONFIG = {
  // Cookie 文件路径
  cookieFile: path.join(AUTH_DIR, 'zhihu-cookies-latest.json'),

  // 报告输出路径
  reportFile: path.join(REPORTS_DIR, `batch-publish-${Date.now()}.json`),

  // 知乎 URL
  urls: {
    home: 'https://www.zhihu.com',
    articleWrite: 'https://www.zhihu.com/write',
    column: 'https://www.zhihu.com/column/',
  },

  // 发布选项
  dryRun: process.argv.includes('--dry-run'),
  limit: process.argv.includes('--limit') ? parseInt(process.argv[process.argv.indexOf('--limit') + 1]) : Infinity,
};

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(REPORTS_DIR);

// ─── 日志工具 ───────────────────────────────────────────────────────────────

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

// ─── Cookie 管理 ───────────────────────────────────────────────────────────────

/**
 * 加载知乎 Cookie
 */
function loadCookies() {
  // Dry-run 模式下不需要真实的 Cookie
  if (CONFIG.dryRun) {
    log('[DRY-RUN] 模拟模式，不需要加载真实 Cookie', 'info');
    return [];
  }

  if (!fs.existsSync(CONFIG.cookieFile)) {
    throw new Error(`Cookie 文件不存在: ${CONFIG.cookieFile}`);
  }

  try {
    const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));
    log(`已加载 ${cookies.length} 个 Cookie`, 'success');
    return cookies;
  } catch (error) {
    throw new Error(`Cookie 文件读取失败: ${error.message}`);
  }
}

// ─── 元数据管理 ───────────────────────────────────────────────────────────────

/**
 * 读取标准化元数据
 */
function readStandardizedMetadata() {
  const files = fs.readdirSync(HIGH_PRIORITY_DIR)
    .filter(file => file.endsWith('-standardized.json'));

  log(`找到 ${files.length} 个标准化元数据文件`, 'info');

  const articles = files.map(file => {
    const metadataPath = path.join(HIGH_PRIORITY_DIR, file);
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    // 找到对应的 Markdown 文件
    const baseName = file.replace('-standardized.json', '');
    const mdFiles = fs.readdirSync(HIGH_PRIORITY_DIR)
      .filter(f => f.startsWith(baseName) && f.endsWith('.md'));

    if (mdFiles.length === 0) {
      log(`找不到对应的 Markdown 文件: ${baseName}`, 'warning');
      return null;
    }

    return {
      metadata,
      metadataPath,
      mdPath: path.join(HIGH_PRIORITY_DIR, mdFiles[0]),
    };
  }).filter(Boolean);

  return articles;
}

// ─── 发布逻辑 ───────────────────────────────────────────────────────────────

/**
 * 发布单篇文章到知乎
 */
async function publishArticle(page, article) {
  const { metadata, mdPath } = article;

  log(`准备发布文章: ${metadata.title}`, 'info');

  try {
    if (metadata.type === '专栏文章') {
      await publishColumnArticle(page, article);
    } else if (metadata.type === '回答') {
      await publishAnswer(page, article);
    } else {
      throw new Error(`未知的内容类型: ${metadata.type}`);
    }

    log(`文章发布成功: ${metadata.title}`, 'success');
    return { success: true, title: metadata.title };
  } catch (error) {
    log(`文章发布失败: ${metadata.title}, 错误: ${error.message}`, 'error');
    return { success: false, title: metadata.title, error: error.message };
  }
}

/**
 * 发布专栏文章
 */
async function publishColumnArticle(page, article) {
  const { metadata, mdPath } = article;

  if (CONFIG.dryRun) {
    log(`[DRY-RUN] 模拟发布专栏文章: ${metadata.title}`, 'info');
    log(`  - 相关专栏: ${metadata.publishPlan.relatedColumn}`, 'info');
    log(`  - 预估数据: 赞同 ${metadata.estimatedMetrics.likes}, 收藏 ${metadata.estimatedMetrics.favorites}`, 'info');
    return;
  }

  // 读取 Markdown 内容
  const mdContent = fs.readFileSync(mdPath, 'utf8');

  // 导航到专栏文章编辑页面
  await page.goto(CONFIG.urls.articleWrite, { waitUntil: 'networkidle' });

  // TODO: 填写标题、内容、选择专栏、发布
  // 这部分需要根据知乎的实际页面结构实现

  log(`专栏文章发布逻辑待实现`, 'warning');
}

/**
 * 发布回答
 */
async function publishAnswer(page, article) {
  const { metadata, mdPath } = article;

  if (CONFIG.dryRun) {
    log(`[DRY-RUN] 模拟发布回答: ${metadata.title}`, 'info');
    log(`  - 要回答的问题: ${metadata.publishPlan.questionToAnswer}`, 'info');
    log(`  - 相关专栏: ${metadata.publishPlan.relatedColumn}`, 'info');
    log(`  - 预估数据: 赞同 ${metadata.estimatedMetrics.likes}, 收藏 ${metadata.estimatedMetrics.favorites}`, 'info');
    return;
  }

  // 读取 Markdown 内容
  const mdContent = fs.readFileSync(mdPath, 'utf8');

  // TODO: 搜索问题、发布回答
  // 这部分需要根据知乎的实际页面结构实现

  log(`回答发布逻辑待实现`, 'warning');
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

/**
 * 主函数
 */
async function main() {
  console.log(`
════════════════════════════════════════════════════════════
  知乎文章批量发布脚本
════════════════════════════════════════════════════════════
  `);

  try {
    // 1. 加载 Cookie
    log('加载 Cookie...', 'info');
    const cookies = loadCookies();

    // 2. 读取标准化元数据
    log('读取标准化元数据...', 'info');
    const articles = readStandardizedMetadata();

    if (articles.length === 0) {
      log('没有找到可发布的文章', 'warning');
      return;
    }

    // 3. 应用限制
    const articlesToPublish = articles.slice(0, CONFIG.limit);
    log(`准备发布 ${articlesToPublish.length} 篇文章`, 'info');

    if (CONFIG.dryRun) {
      log('[DRY-RUN] 模拟模式，不会实际发布', 'warning');
    }

    // 4. 启动浏览器
    log('启动浏览器...', 'info');
    const browser = await chromium.launch({ headless: !CONFIG.dryRun });
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const page = await context.newPage();

    // 5. 批量发布
    const results = [];
    for (let i = 0; i < articlesToPublish.length; i++) {
      const article = articlesToPublish[i];
      log(`\n[${i + 1}/${articlesToPublish.length}]`, 'info');
      const result = await publishArticle(page, article);
      results.push(result);

      // 等待一段时间，避免触发反爬
      if (i < articlesToPublish.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // 6. 关闭浏览器
    await browser.close();

    // 7. 输出报告
    const report = {
      timestamp: new Date().toISOString(),
      dryRun: CONFIG.dryRun,
      total: articlesToPublish.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };

    fs.writeFileSync(CONFIG.reportFile, JSON.stringify(report, null, 2));
    log(`报告已保存: ${CONFIG.reportFile}`, 'success');

    // 8. 输出摘要
    console.log(`
════════════════════════════════════════════════════════════
  发布摘要
════════════════════════════════════════════════════════════
  总数: ${report.total}
  成功: ${report.success}
  失败: ${report.failed}
════════════════════════════════════════════════════════════
    `);

  } catch (error) {
    log(`执行失败: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  log(`未捕获的错误: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
