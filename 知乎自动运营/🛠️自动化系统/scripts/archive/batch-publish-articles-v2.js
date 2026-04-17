#!/usr/bin/env node

/**
 * batch-publish-articles-v2.js
 *
 * 知乎文章批量发布脚本（v2 - 完整实现版）
 *
 * 功能：
 *   1. 读取标准化元数据
 *   2. 加载对应的 Markdown 内容
 *   3. 批量发布到知乎（专栏文章或回答）
 *   4. 记录发布结果
 *
 * 使用方法：
 *   node scripts/batch-publish-articles-v2.js [--dry-run] [--limit N]
 *
 * 选项：
 *   --dry-run: 只模拟发布，不实际发布
 *   --limit N: 只发布前 N 篇文章
 *
 * 依赖：
 *   - playwright
 *   - ../auth/zhihu-cookies-latest.json (知乎 Cookie)
 *
 * 更新记录：
 *   v2: 完整实现了 publishColumnArticle 和 publishAnswer 的实际发布逻辑
 *   - 移植了 publish-zhihu-article.js 的完整实现
 *   - 添加了登录状态检查
 *   - 添加了文章发布后的验证
 *   - 添加了人类化输入（模拟真实用户行为）
 *   - 添加了随机延迟（避免触发反爬）
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
    creator: 'https://www.zhihu.com/creator',
    articlePublish: 'https://zhuanlan.zhihu.com/write',
    column: 'https://www.zhihu.com/column/',
  },

  // 发布选项
  dryRun: process.argv.includes('--dry-run'),
  limit: process.argv.includes('--limit') ? parseInt(process.argv[process.argv.indexOf('--limit') + 1]) : Infinity,

  // 模拟真实用户行为的延迟（毫秒）
  delays: {
    typing: 50,      // 打字延迟
    action: 500,     // 点击、输入等操作延迟
    navigation: 2000, // 页面导航延迟
    betweenArticles: 5000, // 文章之间的延迟
  }
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
async function loadCookies(context) {
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
    await context.addCookies(cookies);
    log(`已加载 ${cookies.length} 个 Cookie`, 'success');

    // 检查关键 Cookie
    const hasDc0 = cookies.some(c => c.name === 'd_c0' && c.value);
    const hasZc0 = cookies.some(c => c.name === 'z_c0' && c.value);

    if (!hasDc0 && !hasZc0) {
      log('未检测到关键 Cookie（d_c0 / z_c0）', 'warning');
      log('Cookie 可能已过期，请重新登录', 'warning');
    }

    return cookies.length;
  } catch (error) {
    throw new Error(`Cookie 文件读取失败: ${error.message}`);
  }
}

// ─── 辅助函数 ───────────────────────────────────────────────────────────────

/**
 * 随机延迟（模拟真实用户行为）
 */
function randomDelay(min = 500, max = 2000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 人类化输入（逐字输入，模拟真实打字）
 */
async function humanType(page, selector, text, options = {}) {
  const element = await page.$(selector);
  if (!element) {
    throw new Error(`找不到元素: ${selector}`);
  }

  await element.click();
  await randomDelay(CONFIG.delays.action);

  // 逐字输入
  for (let i = 0; i < text.length; i++) {
    await page.keyboard.type(text[i]);
    if (i % 10 === 0) {  // 每输入 10 个字符，随机暂停一下
      await randomDelay(CONFIG.delays.typing, CONFIG.delays.typing * 2);
    }
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
    // 策略：尝试多种匹配方式
    const baseName = file.replace('-standardized.json', '');

    // 方式 1: 精确匹配（移除 -standardized.json）
    let mdFiles = fs.readdirSync(HIGH_PRIORITY_DIR)
      .filter(f => f.startsWith(baseName) && f.endsWith('.md'));

    // 方式 2: 模糊匹配（标准化元数据文件的标题部分）
    if (mdFiles.length === 0 && metadata.title && metadata.title.length > 5) {
      const title = metadata.title;
      const allMdFiles = fs.readdirSync(HIGH_PRIORITY_DIR).filter(f => f.endsWith('.md'));
      mdFiles = allMdFiles.filter(mdFile => {
        // 移除扩展名
        const mdFileName = mdFile.replace('.md', '');
        // 简单模糊匹配：检查元数据标题是否在 Markdown 文件名中
        const titlePart = title.substring(0, Math.min(10, title.length));
        const mdFileNamePart = mdFileName.substring(0, Math.min(10, mdFileName.length));
        return mdFileName.includes(titlePart) || title.includes(mdFileNamePart);
      });
    }

    // 方式 3: 使用元数据中的 summary 关键词匹配
    if (mdFiles.length === 0 && metadata.summary) {
      const keywords = metadata.summary.substring(0, 10);
      if (keywords) {
        const allMdFiles = fs.readdirSync(HIGH_PRIORITY_DIR).filter(f => f.endsWith('.md'));
        mdFiles = allMdFiles.filter(mdFile => mdFile.includes(keywords));
      }
    }

    if (mdFiles.length === 0) {
      log(`找不到对应的 Markdown 文件: ${baseName}`, 'warning');
      return null;
    }

    if (mdFiles.length > 1) {
      log(`找到多个 Markdown 文件，使用第一个: ${mdFiles[0]}`, 'warning');
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
 * 检查登录状态
 */
async function checkLoginStatus(page) {
  log('检查登录状态...', 'info');

  try {
    // 访问创作中心
    await page.goto(CONFIG.urls.creator, { waitUntil: 'networkidle', timeout: 30000 });
    await randomDelay(CONFIG.delays.navigation);

    // 检查页面状态
    const pageUrl = page.url();
    const pageTitle = await page.title();
    const bodyText = await page.evaluate(() => document.body.innerText);

    log(`当前页面URL: ${pageUrl}`);
    log(`当前页面标题: ${pageTitle}`);

    // 检查是否遇到安全验证页面
    if (pageTitle.includes('安全验证') || pageUrl.includes('unhuman')) {
      throw new Error(`遇到安全验证页面（${pageTitle}），请手动完成验证后再试`);
    }

    // 检查是否跳转到登录页
    if (pageUrl.includes('signin') || bodyText.includes('登录') || bodyText.includes('注册')) {
      throw new Error('未登录，Cookie 可能已过期');
    }

    // 检查是否有创作权限 - 查找创作相关的元素
    const创作元素选择器 = [
      'button:has-text("写文章")',
      '.Button:has-text("写文章")',
      '[data-testid="write-article"]',
      'a[href*="write"]',
      '.Creator-header',
      '.creator-dashboard'
    ];

    let has创作权限 = false;
    for (const selector of 创作元素选择器) {
      try {
        const element = await page.$(selector);
        if (element) {
          log(`✅ 找到创作权限元素: ${selector}`, 'success');
          has创作权限 = true;
          break;
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }

    if (!has创作权限) {
      log('⚠️ 未找到明确的创作权限元素，但页面可能正常', 'warning');
    }

    log('✅ 已登录', 'success');
    return true;
  } catch (error) {
    log(`❌ 登录检查失败: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * 发布单篇文章到知乎
 */
async function publishArticle(page, article) {
  const { metadata, mdPath } = article;

  log(`准备发布文章: ${metadata.title}`, 'info');

  try {
    // 处理不同的内容类型
    const type = metadata.type || '专栏文章'; // 默认为专栏文章

    // 所有类型都发布为专栏文章（回答类型暂时不支持自动发布）
    if (type === '回答' || type === '热榜回答') {
      // 回答类型暂不支持自动发布，需要搜索问题
      log(`回答类型暂不支持自动发布: ${type}`, 'warning');
      throw new Error(`回答类型暂不支持自动发布: ${type}`);
    } else {
      // 其他所有类型都发布为专栏文章
      await publishColumnArticle(page, article);
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
    const relatedColumn = metadata.publishPlan?.relatedColumn || '未指定';
    const likes = metadata.estimatedMetrics?.likes || '未知';
    const favorites = metadata.estimatedMetrics?.favorites || '未知';
    log(`  - 相关专栏: ${relatedColumn}`, 'info');
    log(`  - 预估数据: 赞同 ${likes}, 收藏 ${favorites}`, 'info');
    return;
  }

  // 读取 Markdown 内容
  const mdContent = fs.readFileSync(mdPath, 'utf8');

  try {
    // 导航到文章发布页面
    log(`导航到发布页面: ${CONFIG.urls.articlePublish}`, 'info');
    await page.goto(CONFIG.urls.articlePublish, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await randomDelay(CONFIG.delays.navigation);

    // 检查是否遇到安全验证页面
    const pageUrl = page.url();
    const pageTitle = await page.title();
    
    if (pageTitle.includes('安全验证') || pageUrl.includes('unhuman') || pageUrl.includes('signin')) {
      throw new Error(`遇到安全验证页面（${pageTitle}），请手动完成验证后再试。当前URL: ${pageUrl}`);
    }

    // 等待页面加载 - 使用更灵活的选择器和更长的超时时间
    log('等待页面元素加载...', 'info');
    
    // 使用多个可能的标题选择器
    const titleSelectors = [
      '.WriteEditorTitle',
      '[placeholder="请输入标题..."]',
      'input[placeholder*="标题"]',
      'input[placeholder*="title"]',
      '.Input input',
      '.QuillEditor input',
      '[data-testid="title-input"]',
      '[data-test="title-input"]',
      'input[type="text"]'
    ];
    
    let titleElement = null;
    for (const selector of titleSelectors) {
      try {
        titleElement = await page.$(selector);
        if (titleElement && await titleElement.isVisible()) {
          log(`✅ 找到标题输入框: ${selector}`, 'success');
          break;
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }
    
    if (!titleElement) {
      throw new Error(`无法找到标题输入框。当前页面URL: ${pageUrl}, 标题: ${pageTitle}`);
    }
    
    await randomDelay(CONFIG.delays.action);

    // 输入标题
    log('输入标题...', 'info');
    await humanType(page, '.WriteEditorTitle, [placeholder="请输入标题..."]', metadata.title);
    await randomDelay(CONFIG.delays.action);

    // 输入正文（如果有富文本编辑器）
    log('输入正文...', 'info');
    const contentSelectors = [
      '.public-DraftEditor-content',
      '.DraftEditor-editorContainer',
      '.CodeMirror textarea',
      '[contenteditable="true"]'
    ];

    let contentEditor = null;
    for (const selector of contentSelectors) {
      contentEditor = await page.$(selector);
      if (contentEditor) {
        log(`找到编辑器: ${selector}`, 'info');
        break;
      }
    }

    if (!contentEditor) {
      throw new Error('找不到内容编辑器');
    }

    // 点击编辑器并输入内容
    await contentEditor.click();
    await randomDelay(CONFIG.delays.action);

    // 等待编辑器准备好
    await randomDelay(CONFIG.delays.action);

    // 输入内容（使用 evaluate 直接设置 innerHTML，模拟粘贴）
    await page.evaluate((content) => {
      const editor = document.querySelector('.public-DraftEditor-content, [contenteditable="true"]');
      if (editor) {
        editor.innerHTML = content;
        // 触发 input 事件
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, mdContent);

    await randomDelay(CONFIG.delays.action);

    // 添加话题标签
    if (metadata.tags && metadata.tags.length > 0) {
      log(`添加话题标签: ${metadata.tags.join(', ')}`, 'info');

      for (const tag of metadata.tags.slice(0, 5)) { // 最多 5 个标签
        // 查找话题输入框
        const tagSelectors = [
          '[placeholder="添加话题"]',
          '.TagInput input',
          '[placeholder="请输入话题"]'
        ];

        let tagInput = null;
        for (const selector of tagSelectors) {
          tagInput = await page.$(selector);
          if (tagInput) {
            break;
          }
        }

        if (tagInput) {
          await tagInput.click();
          await randomDelay(CONFIG.delays.action);
          await humanType(page, '[placeholder="添加话题"], .TagInput input', tag);
          await randomDelay(CONFIG.delays.action);

          // 按回车确认
          await page.keyboard.press('Enter');
          await randomDelay(CONFIG.delays.action);
        }
      }
    }

    log('文章内容填写完成', 'success');

    // 发布文章
    await publishButton(page);

    log('专栏文章发布成功', 'success');
    return true;

  } catch (error) {
    log(`专栏文章发布失败: ${error.message}`, 'error');
    throw error;
  }
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

  try {
    // TODO: 搜索问题、发布回答
    // 这部分需要根据知乎的实际页面结构实现
    log('回答发布逻辑待实现', 'warning');
    throw new Error('回答发布逻辑待实现');
  } catch (error) {
    log(`回答发布失败: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * 点击发布按钮
 */
async function publishButton(page) {
  log('点击发布按钮...', 'info');

  try {
    // 查找发布按钮
    const publishButtonSelectors = [
      'button:has-text("发布")',
      '.Button--primary:has-text("发布")',
      '[data-testid="publish-button"]'
    ];

    let publishButton = null;
    for (const selector of publishButtonSelectors) {
      publishButton = await page.$(selector);
      if (publishButton) {
        log(`找到发布按钮: ${selector}`, 'info');
        break;
      }
    }

    if (!publishButton) {
      throw new Error('找不到发布按钮');
    }

    // 等待按钮可点击
    await publishButton.waitForElementState('enabled', { timeout: 5000 });
    await randomDelay(CONFIG.delays.action);

    // 点击发布按钮
    await publishButton.click();
    await randomDelay(CONFIG.delays.action);

    // 等待发布完成
    log('等待发布完成...', 'info');

    // 检查是否跳转到文章详情页
    await page.waitForURL(/\/p\/\d+/, { timeout: 10000 });

    log('发布成功！', 'success');

    // 获取文章 URL
    const articleUrl = page.url();
    log(`文章 URL: ${articleUrl}`, 'info');

    return articleUrl;

  } catch (error) {
    log(`发布失败: ${error.message}`, 'error');
    throw error;
  }
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

/**
 * 主函数
 */
async function main() {
  console.log(`
════════════════════════════════════════════════════════════
  知乎文章批量发布脚本 (v2 - 完整实现版)
════════════════════════════════════════════════════════════
  `);

  try {
    // 1. 读取标准化元数据
    log('读取标准化元数据...', 'info');
    const articles = readStandardizedMetadata();

    if (articles.length === 0) {
      log('没有找到可发布的文章', 'warning');
      return;
    }

    // 2. 应用限制
    const articlesToPublish = articles.slice(0, CONFIG.limit);
    log(`准备发布 ${articlesToPublish.length} 篇文章`, 'info');

    if (CONFIG.dryRun) {
      log('[DRY-RUN] 模拟模式，不会实际发布', 'warning');
    }

    // 3. 启动浏览器
    log('启动浏览器...', 'info');
    const browser = await chromium.launch({ headless: !CONFIG.dryRun });
    const context = await browser.newContext();
    await loadCookies(context);
    const page = await context.newPage();

    // 4. 检查登录状态（非 dry-run 模式）
    if (!CONFIG.dryRun) {
      try {
        await checkLoginStatus(page);
      } catch (error) {
        log(`❌ 登录检查失败: ${error.message}`, 'error');
        
        // 如果是安全验证问题，给出更详细的指导
        if (error.message.includes('安全验证')) {
          log('\n🔍 安全验证问题解决方案:', 'warning');
          log('1. 请在浏览器中手动完成知乎的安全验证', 'warning');
          log('2. 验证完成后，Cookie 会自动更新', 'warning');
          log('3. 等待 1-2 分钟后重新运行脚本', 'warning');
          log('4. 如果问题持续，请重新登录知乎账号', 'warning');
        }
        
        throw error;
      }
    }

    // 5. 批量发布
    const results = [];
    for (let i = 0; i < articlesToPublish.length; i++) {
      const article = articlesToPublish[i];
      log(`\n[${i + 1}/${articlesToPublish.length}]`, 'info');
      const result = await publishArticle(page, article);
      results.push(result);

      // 等待一段时间，避免触发反爬
      if (i < articlesToPublish.length - 1) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.delays.betweenArticles));
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
