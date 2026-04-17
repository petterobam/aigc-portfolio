#!/usr/bin/env node

/**
 * publish-zhihu-article.js
 *
 * 知乎专栏文章自动发布脚本
 *
 * 功能：
 *   1. 加载知乎 Cookie
 *   2. 登录知乎创作中心
 *   3. 创建新专栏文章
 *   4. 填充标题、内容、话题标签
 *   5. 发布文章
 *   6. 验证发布成功
 *
 * 使用方法：
 *   node scripts/publish/publish-zhihu-article.js <article-file>
 *
 * 参数：
 *   article-file: 文章文件路径（JSON 格式，包含标题、内容、标签等）
 *
 * 文章文件格式：
 *   {
 *     "title": "文章标题",
 *     "content": "文章内容（Markdown 格式）",
 *     "tags": ["标签1", "标签2", "标签3"],
 *     "coverImage": "封面图片 URL（可选）"
 *   }
 *
 * 依赖：
 *   - playwright
 *   - 已保存的知乎 Cookie（auth/zhihu-cookies-latest.json）
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const ZHIHU_AUTO_DIR = path.join(WORKSPACE_DIR, '知乎自动运营');
const AUTO_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统');
const AUTH_DIR = path.join(AUTO_DIR, 'auth');
const DATA_DIR = path.join(AUTO_DIR, 'data');

const CONFIG = {
  // Cookie 文件路径
  cookieFile: path.join(AUTH_DIR, 'zhihu-cookies-latest.json'),

  // 知乎页面 URL
  urls: {
    creator: 'https://www.zhihu.com/creator',
    articlePublish: 'https://zhuanlan.zhihu.com/write',
    myArticles: 'https://zhuanlan.zhihu.com/me'
  },

  // 发布数据目录
  dataDir: DATA_DIR,

  // 模拟真实用户行为的延迟（毫秒）
  delays: {
    typing: 50,      // 打字延迟
    action: 500,     // 点击、输入等操作延迟
    navigation: 2000  // 页面导航延迟
  }
};

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(DATA_DIR);
ensureDir(AUTH_DIR);

// ─── Cookie 管理 ───────────────────────────────────────────────────────────────

/**
 * 加载知乎 Cookie
 */
async function loadCookies(context) {
  if (!fs.existsSync(CONFIG.cookieFile)) {
    throw new Error(`Cookie 文件不存在: ${CONFIG.cookieFile}\n请先运行: node scripts/zhihu-login-save-cookies.js`);
  }

  try {
    const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));
    await context.addCookies(cookies);
    console.log(`✅ 已加载 ${cookies.length} 个知乎 Cookie`);

    // 检查关键 Cookie
    const hasDc0 = cookies.some(c => c.name === 'd_c0' && c.value);
    const hasZc0 = cookies.some(c => c.name === 'z_c0' && c.value);

    if (!hasDc0 && !hasZc0) {
      console.warn('⚠️  未检测到关键 Cookie（d_c0 / z_c0）');
      console.warn('   Cookie 可能已过期，请重新登录');
    }

    return cookies.length;
  } catch (error) {
    throw new Error(`加载 Cookie 失败: ${error.message}`);
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

// ─── 发布流程 ───────────────────────────────────────────────────────────────

/**
 * 检查登录状态
 */
async function checkLoginStatus(page) {
  console.log('\n📊 检查登录状态...');

  try {
    // 访问创作中心
    await page.goto(CONFIG.urls.creator, { waitUntil: 'networkidle' });
    await randomDelay(CONFIG.delays.navigation);

    // 检查是否跳转到登录页
    if (page.url().includes('signin')) {
      throw new Error('未登录，Cookie 可能已过期');
    }

    // 检查是否有创作权限
    const bodyText = await page.evaluate(() => document.body.innerText);

    if (bodyText.includes('登录') || bodyText.includes('注册')) {
      throw new Error('未登录');
    }

    console.log('✅ 已登录');

    return true;
  } catch (error) {
    console.error(`❌ 登录检查失败: ${error.message}`);
    throw error;
  }
}

/**
 * 创建新文章
 */
async function createArticle(page, articleData) {
  console.log('\n📝 创建新文章...');
  console.log(`   标题: ${articleData.title}`);
  console.log(`   标签: ${articleData.tags.join(', ')}`);

  try {
    // 访问文章发布页面
    console.log(`📄 导航到发布页面: ${CONFIG.urls.articlePublish}`);
    await page.goto(CONFIG.urls.articlePublish, { waitUntil: 'domcontentloaded' });
    await randomDelay(CONFIG.delays.navigation);

    // 等待页面加载
    await page.waitForSelector('.WriteEditorTitle, [placeholder="请输入标题..."]', { timeout: 10000 });
    await randomDelay(CONFIG.delays.action);

    // 输入标题
    console.log('⌨️  输入标题...');
    await humanType(page, '.WriteEditorTitle, [placeholder="请输入标题..."]', articleData.title);
    await randomDelay(CONFIG.delays.action);

    // 输入正文（如果有富文本编辑器）
    console.log('⌨️  输入正文...');
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
        console.log(`   找到编辑器: ${selector}`);
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
    }, articleData.content);

    await randomDelay(CONFIG.delays.action);

    // 添加话题标签
    if (articleData.tags && articleData.tags.length > 0) {
      console.log(`🏷️  添加话题标签: ${articleData.tags.join(', ')}`);

      for (const tag of articleData.tags) {
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

    console.log('✅ 文章内容填写完成');
    return true;

  } catch (error) {
    console.error(`❌ 创建文章失败: ${error.message}`);
    throw error;
  }
}

/**
 * 发布文章
 */
async function publishArticle(page) {
  console.log('\n🚀 发布文章...');

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
        console.log(`   找到发布按钮: ${selector}`);
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
    console.log('⌨️  点击发布按钮...');
    await publishButton.click();
    await randomDelay(CONFIG.delays.action);

    // 等待发布完成
    console.log('⏳ 等待发布完成...');

    // 检查是否跳转到文章详情页
    await page.waitForURL(/\/p\/\d+/, { timeout: 10000 });

    console.log('✅ 发布成功！');

    // 获取文章 URL
    const articleUrl = page.url();
    console.log(`   文章 URL: ${articleUrl}`);

    return articleUrl;

  } catch (error) {
    console.error(`❌ 发布失败: ${error.message}`);
    throw error;
  }
}

/**
 * 验证发布结果
 */
async function verifyPublish(page, articleUrl) {
  console.log('\n🔍 验证发布结果...');

  try {
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    await randomDelay(CONFIG.delays.navigation);

    // 检查页面标题
    const pageTitle = await page.title();
    console.log(`   页面标题: ${pageTitle}`);

    // 检查是否是文章详情页
    if (articleUrl.includes('/p/')) {
      console.log('✅ 验证通过：已成功跳转到文章详情页');

      // 提取文章 ID
      const articleId = articleUrl.split('/p/')[1];
      console.log(`   文章 ID: ${articleId}`);

      return {
        success: true,
        articleUrl,
        articleId
      };
    } else {
      throw new Error('未跳转到文章详情页');
    }

  } catch (error) {
    console.error(`❌ 验证失败: ${error.message}`);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('═'.repeat(60));
  console.log('  知乎文章自动发布脚本');
  console.log('═'.repeat(60));
  console.log('');

  // 解析命令行参数
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ 缺少文章文件参数');
    console.error('\n使用方法:');
    console.error('  node scripts/publish/publish-zhihu-article.js <article-file>');
    console.error('\n示例:');
    console.error('  node scripts/publish/publish-zhihu-article.js article.json');
    process.exit(1);
  }

  const articleFile = args[0];

  // 读取文章文件
  if (!fs.existsSync(articleFile)) {
    console.error(`❌ 文章文件不存在: ${articleFile}`);
    process.exit(1);
  }

  let articleData;
  try {
    articleData = JSON.parse(fs.readFileSync(articleFile, 'utf8'));
    console.log(`📄 已加载文章文件: ${articleFile}`);
    console.log(`   标题: ${articleData.title}`);
  } catch (error) {
    console.error(`❌ 读取文章文件失败: ${error.message}`);
    process.exit(1);
  }

  // 验证文章数据
  if (!articleData.title || !articleData.content) {
    console.error('❌ 文章数据缺少必需字段（title、content）');
    process.exit(1);
  }

  let browser;
  let result = {
    timestamp: new Date().toISOString(),
    articleFile,
    articleData: {
      title: articleData.title,
      tags: articleData.tags || []
    },
    success: false,
    articleUrl: null,
    articleId: null,
    error: null
  };

  try {
    // 启动浏览器
    console.log('\n🌐 启动浏览器...');
    browser = await chromium.launch({
      headless: false,  // 显示浏览器窗口，便于调试
      slowMo: 50        // 减慢操作速度
    });

    // 创建上下文
    console.log('📍 创建浏览器上下文...');
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // 加载 Cookie
    await loadCookies(context);

    // 检查登录状态
    await checkLoginStatus(page);

    // 创建文章
    await createArticle(page, articleData);

    // 截图（发布前）
    const screenshotFile1 = path.join(DATA_DIR, `publish-before-${Date.now()}.png`);
    await page.screenshot({ path: screenshotFile1, fullPage: true });
    console.log(`\n📸 发布前截图: ${screenshotFile1}`);

    // 发布文章
    const articleUrl = await publishArticle(page);

    // 验证发布结果
    const verifyResult = await verifyPublish(page, articleUrl);

    // 截图（发布后）
    const screenshotFile2 = path.join(DATA_DIR, `publish-after-${Date.now()}.png`);
    await page.screenshot({ path: screenshotFile2, fullPage: true });
    console.log(`📸 发布后截图: ${screenshotFile2}`);

    // 更新结果
    result.success = true;
    result.articleUrl = articleUrl;
    result.articleId = verifyResult.articleId;
    result.screenshots = [screenshotFile1, screenshotFile2];

    console.log('\n' + '═'.repeat(60));
    console.log('  ✅ 发布完成！');
    console.log('═'.repeat(60));
    console.log(`\n  文章标题: ${articleData.title}`);
    console.log(`  文章 URL: ${articleUrl}`);
    console.log(`  文章 ID: ${verifyResult.articleId}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ 发布失败:', error.message);
    console.error(error.stack);

    result.error = error.message;

    // 保存错误截图
    if (browser) {
      const pages = await browser.pages();
      if (pages.length > 0) {
        const errorScreenshot = path.join(DATA_DIR, `publish-error-${Date.now()}.png`);
        await pages[0].screenshot({ path: errorScreenshot, fullPage: true });
        console.log(`\n📸 错误截图: ${errorScreenshot}`);
        result.errorScreenshot = errorScreenshot;
      }
    }
  } finally {
    // 保存发布记录
    const recordFile = path.join(DATA_DIR, `publish-record-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(recordFile, JSON.stringify(result, null, 2));
    console.log(`\n📄 发布记录: ${recordFile}`);

    // 关闭浏览器
    if (browser) {
      console.log('\n🚪 正在关闭浏览器...');
      await browser.close();
      console.log('✅ 浏览器已关闭\n');
    }
  }

  // 返回状态码
  process.exit(result.success ? 0 : 1);
}

// 运行主函数
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { main };
