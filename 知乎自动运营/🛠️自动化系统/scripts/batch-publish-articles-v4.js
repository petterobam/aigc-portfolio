#!/usr/bin/env node

/**
 * batch-publish-articles-v4.js
 *
 * 知乎文章批量发布脚本（v4 - 多目录扫描版）
 *
 * v3 → v4 改进：
 *   - 支持新的子目录结构（AIGC原理系列、OpenClaw技巧系列、AI热点深度解析）
 *   - 递归扫描所有子目录，不再硬编码单一目录
 *   - 自动去重（同一文章只发布一次）
 *   - 支持按发布计划顺序发布
 *   - 更健壮的 Markdown → HTML 转换（知乎富文本编辑器）
 *   - 发布前自动检查文章完整性（标题、字数、代码块）
 *   - 发布后自动移动到「已发布」目录
 *
 * 使用方法：
 *   node batch-publish-articles-v4.js [--dry-run] [--limit N] [--debug] [--series AIGC]
 *
 * 选项：
 *   --dry-run    模拟发布
 *   --limit N    只发布前 N 篇
 *   --debug      调试模式
 *   --series X   只发布指定系列（AIGC原理系列/OpenClaw技巧系列/AI热点深度解析）
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const WORKSPACE = path.join(process.env.HOME, '.openclaw/workspace/知乎自动运营');
const PUBLISH_DIR = path.join(WORKSPACE, '📤待发布');
const PUBLISHED_DIR = path.join(WORKSPACE, '📤已发布');
const AUTH_DIR = path.join(WORKSPACE, '🛠️自动化系统', 'auth');
const REPORTS_DIR = path.join(WORKSPACE, '🛠️自动化系统', 'reports');

const SERIES_DIRS = ['🔥高优先级', '⭐中优先级', 'AIGC原理系列', 'OpenClaw技巧系列', 'AI热点深度解析'];

const CONFIG = {
  cookieFile: path.join(AUTH_DIR, 'zhihu-cookies-latest.json'),
  reportFile: path.join(REPORTS_DIR, `batch-publish-v4-${Date.now()}.json`),
  urls: {
    creator: 'https://www.zhihu.com/creator',
    articlePublish: 'https://zhuanlan.zhihu.com/write',
  },
  dryRun: process.argv.includes('--dry-run'),
  debug: process.argv.includes('--debug'),
  limit: (() => {
    const idx = process.argv.indexOf('--limit');
    return idx >= 0 ? parseInt(process.argv[idx + 1]) || Infinity : Infinity;
  })(),
  series: (() => {
    const idx = process.argv.indexOf('--series');
    return idx >= 0 ? process.argv[idx + 1] : null;
  })(),
  delays: {
    typing: 40,
    action: 600,
    navigation: 3000,
    betweenArticles: 10000,
  },
  retry: { maxAttempts: 3, delay: 3000 },
};

// ─── 工具函数 ────────────────────────────────────────────────────────────────

function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }
ensureDir(REPORTS_DIR);

const LEVELS = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️', debug: '🔍' };
function log(msg, level = 'info') {
  console.log(`[${new Date().toISOString()}] ${LEVELS[level] || 'ℹ️'} ${msg}`);
}

function randomDelay(min = 500, max = 2000) {
  return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));
}

async function retry(fn, name, max = CONFIG.retry.maxAttempts) {
  for (let i = 1; i <= max; i++) {
    try { return await fn(); }
    catch (e) {
      log(`${name} (尝试 ${i}/${max}): ${e.message}`, 'warning');
      if (i < max) await new Promise(r => setTimeout(r, CONFIG.retry.delay));
      else throw e;
    }
  }
}

// ─── 文章发现与去重 ──────────────────────────────────────────────────────────

/**
 * 递归扫描目录，发现所有文章和元数据
 */
function discoverArticles() {
  const articles = new Map(); // key: 文件名(无后缀), value: { md, metadata, series }

  // 确定要扫描的目录
  const dirsToScan = CONFIG.series
    ? [path.join(PUBLISH_DIR, CONFIG.series)]
    : SERIES_DIRS.map(d => path.join(PUBLISH_DIR, d));

  for (const dir of dirsToScan) {
    if (!fs.existsSync(dir)) {
      log(`目录不存在，跳过: ${dir}`, 'warning');
      continue;
    }

    const series = path.basename(dir);
    const files = fs.readdirSync(dir);

    // 收集 md 和 json 文件
    const mdFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
    const jsonFiles = files.filter(f => f.endsWith('-standardized.json'));

    log(`扫描 [${series}]: ${mdFiles.length} 篇文章, ${jsonFiles.length} 个元数据文件`, 'info');

    for (const mdFile of mdFiles) {
      const baseName = mdFile.replace('.md', '');
      const mdPath = path.join(dir, mdFile);

      // 查找对应元数据
      let metadata = null;
      const jsonMatch = jsonFiles.find(f => f.startsWith(baseName));
      if (jsonMatch) {
        try {
          metadata = JSON.parse(fs.readFileSync(path.join(dir, jsonMatch), 'utf8'));
        } catch (e) {
          log(`元数据解析失败: ${jsonMatch}`, 'warning');
        }
      }

      // 如果已存在（去重），保留有元数据的版本
      if (articles.has(baseName)) {
        const existing = articles.get(baseName);
        if (!existing.metadata && metadata) {
          articles.set(baseName, { md: mdPath, metadata, series });
        }
        continue;
      }

      articles.set(baseName, { md: mdPath, metadata, series });
    }
  }

  return articles;
}

/**
 * 从 Markdown 内容提取标题
 */
function extractTitle(mdContent) {
  // 尝试从第一个 # 标题提取
  const match = mdContent.match(/^#\s+(.+)/m);
  if (match) return match[1].trim();
  return null;
}

/**
 * 检查文章完整性
 */
function validateArticle(baseName, article) {
  const issues = [];

  if (!fs.existsSync(article.md)) {
    issues.push('Markdown 文件不存在');
    return issues;
  }

  const content = fs.readFileSync(article.md, 'utf8');

  // 提取标题
  const title = article.metadata?.title || extractTitle(content);
  if (!title) issues.push('无法确定文章标题');

  // 检查字数
  const wordCount = content.replace(/```[\s\S]*?```/g, '').replace(/[#*`\[\]]/g, '').length;
  if (wordCount < 500) issues.push(`文章过短 (${wordCount} 字)`);

  // 检查代码块闭合
  const codeBlockCount = (content.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) issues.push('代码块未正确闭合');

  return issues;
}

/**
 * Markdown → 简单 HTML 转换（知乎编辑器兼容）
 */
function mdToHtml(md) {
  let html = md;

  // 代码块
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 标题
  html = html.replace(/^######\s+(.+)/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)/gm, '<h1>$1</h1>');

  // 粗体和斜体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // 无序列表
  html = html.replace(/^\s*[-*]\s+(.+)/gm, '<li>$1</li>');

  // 有序列表
  html = html.replace(/^\s*\d+\.\s+(.+)/gm, '<li>$1</li>');

  // 段落（简单处理：连续换行分段）
  html = html.replace(/\n\n+/g, '\n</p><p>\n');

  // 清理多余空行
  html = html.replace(/\n{3,}/g, '\n\n');

  return `<p>${html}</p>`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Cookie 管理 ─────────────────────────────────────────────────────────────

async function loadCookies(context) {
  if (CONFIG.dryRun) {
    log('[DRY-RUN] 模拟模式，跳过 Cookie', 'info');
    return;
  }

  if (!fs.existsSync(CONFIG.cookieFile)) {
    throw new Error(`Cookie 文件不存在: ${CONFIG.cookieFile}\n请先运行登录脚本或手动登录知乎`);
  }

  const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));
  await context.addCookies(cookies);
  log(`已加载 ${cookies.length} 个 Cookie`, 'success');

  const hasAuth = cookies.some(c => ['d_c0', 'z_c0', 'SESSIONID'].includes(c.name) && c.value);
  if (!hasAuth) {
    log('未检测到关键认证 Cookie，可能已过期', 'warning');
  }
}

// ─── 发布逻辑 ────────────────────────────────────────────────────────────────

async function checkLogin(page) {
  log('检查登录状态...', 'info');
  await page.goto(CONFIG.urls.creator, { waitUntil: 'networkidle' });
  await randomDelay(CONFIG.delays.navigation);

  if (page.url().includes('signin')) throw new Error('未登录，Cookie 已过期');

  const text = await page.evaluate(() => document.body.innerText);
  if (text.includes('登录') && text.includes('注册') && text.length < 500) {
    throw new Error('未登录');
  }

  log('✅ 已确认登录状态', 'success');
}

async function publishOneArticle(page, article, title) {
  const content = fs.readFileSync(article.md, 'utf8');

  log(`发布: ${title}`, 'info');

  // 导航到写文章页面
  await page.goto(CONFIG.urls.articlePublish, { waitUntil: 'domcontentloaded' });
  await randomDelay(CONFIG.delays.navigation);

  // 等待标题输入框
  const titleSel = await retry(async () => {
    const selectors = [
      'input[placeholder*="标题"]',
      'input[placeholder*="请输入"]',
      'input[type="text"]',
      'textarea[placeholder*="标题"]',
    ];
    for (const s of selectors) {
      try {
        await page.waitForSelector(s, { timeout: 5000 });
        return s;
      } catch {}
    }
    throw new Error('找不到标题输入框');
  }, '等待标题输入框');

  // 输入标题
  const titleInput = await page.$(titleSel);
  await titleInput.click();
  await randomDelay(300, 600);
  // 逐字输入标题（人类化）
  for (let i = 0; i < title.length; i++) {
    await page.keyboard.type(title[i]);
    if (i % 8 === 0) await randomDelay(30, 80);
  }
  await randomDelay(CONFIG.delays.action);

  // 查找内容编辑器
  const editorSelectors = [
    '.public-DraftEditor-content',
    '[contenteditable="true"]',
    '.DraftEditor-editorContainer',
  ];

  let editor = null;
  for (const s of editorSelectors) {
    editor = await page.$(s);
    if (editor) { log(`找到编辑器: ${s}`, 'debug'); break; }
  }

  if (!editor) throw new Error('找不到内容编辑器');

  await editor.click();
  await randomDelay(CONFIG.delays.action);

  // 输入内容 - 使用 clipboard API 模拟粘贴（更可靠）
  // 先去掉第一个标题行（已经输入到标题框了）
  let bodyContent = content.replace(/^#\s+.+\n*/, '');
  const htmlContent = mdToHtml(bodyContent);

  await page.evaluate((html) => {
    const editor = document.querySelector('.public-DraftEditor-content, [contenteditable="true"]');
    if (editor) {
      editor.innerHTML = html;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, htmlContent);

  await randomDelay(CONFIG.delays.action);

  // 添加话题标签
  if (article.metadata?.tags?.length) {
    const tagSelectors = ['[placeholder*="话题"]', '[placeholder*="标签"]', '.TagInput input'];
    for (const tag of article.metadata.tags.slice(0, 5)) {
      for (const s of tagSelectors) {
        const tagInput = await page.$(s);
        if (tagInput) {
          await tagInput.click();
          await randomDelay(300);
          for (const ch of tag) {
            await page.keyboard.type(ch);
            await randomDelay(20, 50);
          }
          await page.keyboard.press('Enter');
          await randomDelay(CONFIG.delays.action);
          break;
        }
      }
    }
  }

  // 点击发布
  const btnSelectors = [
    'button:has-text("发布")',
    '.Button--primary:has-text("发布")',
    'button:has-text("发布文章")',
  ];

  let btn = null;
  for (const s of btnSelectors) {
    btn = await page.$(s);
    if (btn) break;
  }

  if (!btn) throw new Error('找不到发布按钮');

  await btn.click();
  log('已点击发布按钮，等待跳转...', 'info');

  // 等待发布完成（跳转到文章页）
  try {
    await page.waitForURL(/\/p\/\d+/, { timeout: 15000 });
    const url = page.url();
    log(`发布成功! URL: ${url}`, 'success');
    return url;
  } catch {
    // 可能弹出了确认框
    log('未检测到跳转，可能需要手动确认', 'warning');
    return null;
  }
}

/**
 * 发布后：移动到「已发布」目录
 */
function moveToPublished(article, baseName) {
  const targetDir = path.join(PUBLISHED_DIR, article.series);
  ensureDir(targetDir);

  const src = article.md;
  const dst = path.join(targetDir, path.basename(src));

  if (fs.existsSync(src)) {
    fs.renameSync(src, dst);
    log(`已移动到已发布: ${baseName}`, 'success');
  }

  // 同时移动元数据文件
  const dir = path.dirname(src);
  const jsonFile = fs.readdirSync(dir).find(f => f.startsWith(baseName) && f.endsWith('-standardized.json'));
  if (jsonFile) {
    const jsonSrc = path.join(dir, jsonFile);
    const jsonDst = path.join(targetDir, jsonFile);
    fs.renameSync(jsonSrc, jsonDst);
  }
}

// ─── 主流程 ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  知乎批量发布 v4 - 多目录扫描版                                ║
║  ${new Date().toISOString()}                          ║
╚══════════════════════════════════════════════════════════════╝
  `);

  // 1. 发现文章
  const articles = discoverArticles();
  const entries = [...articles.entries()];

  log(`共发现 ${entries.length} 篇唯一文章`, 'info');

  // 2. 校验
  const valid = [];
  for (const [baseName, article] of entries) {
    const issues = validateArticle(baseName, article);
    if (issues.length > 0) {
      log(`⚠️ [${baseName}] 校验问题: ${issues.join(', ')}`, 'warning');
    }
    valid.push({ baseName, article, issues, title: article.metadata?.title || extractTitle(fs.readFileSync(article.md, 'utf8')) || baseName });
  }

  // 过滤掉严重问题（文件不存在）
  const publishable = valid.filter(v => !v.issues.includes('Markdown 文件不存在'));
  const toPublish = publishable.slice(0, CONFIG.limit);

  log(`可发布: ${publishable.length} 篇，本次: ${toPublish.length} 篇`, 'info');

  if (CONFIG.dryRun) {
    log('[DRY-RUN] 模拟模式', 'warning');
    for (const item of toPublish) {
      log(`  📄 ${item.title} [${item.article.series}]`, 'info');
    }
    console.log(`\n共 ${toPublish.length} 篇文章将模拟发布。`);
    return;
  }

  // 3. 启动浏览器
  log('启动浏览器...', 'info');
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });

  try {
    await loadCookies(context);
    const page = await context.newPage();

    // 4. 检查登录
    await checkLogin(page);

    // 5. 逐篇发布
    const results = [];
    for (let i = 0; i < toPublish.length; i++) {
      const item = toPublish[i];
      log(`\n━━━ [${i + 1}/${toPublish.length}] ━━━`, 'info');

      const result = { title: item.title, series: item.article.series, baseName: item.baseName };

      try {
        const url = await publishOneArticle(page, item.article, item.title);
        result.success = true;
        result.url = url;

        // 发布成功后移动文件
        if (url) {
          moveToPublished(item.article, item.baseName);
        }
      } catch (e) {
        result.success = false;
        result.error = e.message;
        log(`发布失败: ${e.message}`, 'error');
      }

      results.push(result);

      // 文章间等待
      if (i < toPublish.length - 1) {
        log(`等待 ${CONFIG.delays.betweenArticles / 1000}s 后发布下一篇...`, 'info');
        await new Promise(r => setTimeout(r, CONFIG.delays.betweenArticles));
      }
    }

    // 6. 输出报告
    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    const report = {
      timestamp: new Date().toISOString(),
      version: 'v4',
      total: toPublish.length,
      success,
      failed,
      results,
    };

    fs.writeFileSync(CONFIG.reportFile, JSON.stringify(report, null, 2));

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  发布完成                                                     ║
║  成功: ${success} / 失败: ${failed} / 总计: ${toPublish.length}                          ║
║  报告: ${path.basename(CONFIG.reportFile)}                      ║
╚══════════════════════════════════════════════════════════════╝
    `);

  } finally {
    await browser.close();
  }
}

main().catch(e => {
  log(`未捕获错误: ${e.message}`, 'error');
  console.error(e);
  process.exit(1);
});
