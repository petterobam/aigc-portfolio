#!/usr/bin/env node

/**
 * publish-zhihu-article-simple.js
 *
 * 知乎文章发布脚本（简化版）
 *
 * 功能：
 *   - 使用已有的 Cookie 文件发布文章
 *   - 自动填充标题、正文、标签
 *   - 自动点击发布按钮
 *
 * 使用方法：
 *   node scripts/publish-zhihu-article-simple.js <article-file>
 *
 * 依赖：
 *   - playwright
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const ZHIHU_AUTO_DIR = path.join(WORKSPACE_DIR, '知乎自动运营');
const AUTO_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统');

const CONFIG = {
  // Cookie 文件路径
  cookieFile: path.join(AUTO_DIR, 'auth', 'latest.json'),

  // 知乎 URL
  urls: {
    home: 'https://www.zhihu.com',
    articlePublish: 'https://zhuanlan.zhihu.com/write'
  },

  // 延迟设置（模拟真实用户行为）
  delays: {
    typing: 50,      // 打字延迟
    action: 500,     // 点击、输入等操作延迟
    navigation: 2000  // 页面导航延迟
  }
};

// ─── 辅助函数 ───────────────────────────────────────────────────────────────

/**
 * 随机延迟
 */
function randomDelay(min = 500, max = 2000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 人类化输入
 */
async function humanType(page, selector, text) {
  const element = await page.$(selector);
  if (!element) {
    throw new Error(`找不到元素: ${selector}`);
  }

  await element.click();
  await randomDelay(CONFIG.delays.action);

  // 逐字输入
  for (let i = 0; i < text.length; i++) {
    await page.keyboard.type(text[i]);
    if (i % 10 === 0) {
      await randomDelay(CONFIG.delays.typing, CONFIG.delays.typing * 2);
    }
  }
}

/**
 * 加载 Cookie
 */
async function loadCookies(page, cookieFile) {
  if (!fs.existsSync(cookieFile)) {
    throw new Error(`Cookie 文件不存在: ${cookieFile}`);
  }

  const cookies = JSON.parse(fs.readFileSync(cookieFile, 'utf8'));
  await page.context().addCookies(cookies);
  console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);
}

/**
 * 检查登录状态
 */
async function checkLoginStatus(page) {
  await page.goto(CONFIG.urls.home, { waitUntil: 'networkidle' });

  // 检查是否跳转到登录页
  if (page.url().includes('signin')) {
    return false;
  }

  // 检查页面标题（登录成功后，标题会包含消息数量）
  const title = await page.title();
  const isLoggedIn = title.includes('首页') || title.includes('知乎') && !title.includes('登录');

  return isLoggedIn;
}

// ─── 主函数 ────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  知乎文章发布脚本（简化版）');
  console.log('═'.repeat(60));

  // 获取文章文件路径
  const articleFile = process.argv[2];
  if (!articleFile) {
    console.error('\n❌ 错误：请指定文章文件');
    console.error('\n使用方法:');
    console.error('  node scripts/publish-zhihu-article-simple.js <article-file>');
    process.exit(1);
  }

  // 读取文章文件
  if (!fs.existsSync(articleFile)) {
    console.error(`\n❌ 文章文件不存在: ${articleFile}`);
    process.exit(1);
  }

  let articleData;
  try {
    articleData = JSON.parse(fs.readFileSync(articleFile, 'utf8'));
    console.log(`\n📄 已加载文章文件: ${articleFile}`);
    console.log(`   标题: ${articleData.title}`);
  } catch (error) {
    console.error(`\n❌ 读取文章文件失败: ${error.message}`);
    process.exit(1);
  }

  // 验证文章数据
  if (!articleData.title || !articleData.content) {
    console.error('\n❌ 文章数据缺少必需字段（title、content）');
    process.exit(1);
  }

  let browser;
  let context;
  let page;

  try {
    // 启动浏览器
    console.log('\n🌐 启动浏览器...');
    browser = await chromium.launch({ headless: false });

    // 创建上下文
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();

    // 加载 Cookie
    console.log('\n🍪 加载 Cookie...');
    await loadCookies(page, CONFIG.cookieFile);

    // 检查登录状态
    console.log('\n📊 检查登录状态...');
    const isLoggedIn = await checkLoginStatus(page);

    if (!isLoggedIn) {
      console.error('\n❌ 登录状态无效');
      console.error('   Cookie 可能已过期，请重新提取');
      console.error('   参考: 🛠️自动化系统/docs/zhihu-cookie-extraction-guide.md');
      process.exit(1);
    }

    console.log('✅ 登录状态有效');

    // 访问文章发布页面
    console.log(`\n📄 导航到发布页面: ${CONFIG.urls.articlePublish}`);
    await page.goto(CONFIG.urls.articlePublish, { waitUntil: 'domcontentloaded' });
    await randomDelay(CONFIG.delays.navigation);

    // 等待页面加载
    console.log('⏳ 等待页面元素加载...');
    await page.waitForSelector('input[placeholder*="标题"], [placeholder*="请输入"]', { timeout: 15000 });
    await randomDelay(CONFIG.delays.action);

    // 输入标题
    console.log('\n⌨️  输入标题...');
    await humanType(page, 'input[placeholder*="标题"], [placeholder*="请输入"]', articleData.title);
    await randomDelay(CONFIG.delays.action);

    // 输入正文
    console.log('⌨️  输入正文...');

    // 使用 evaluate 直接设置 innerHTML，模拟粘贴
    await page.evaluate((content) => {
      const editor = document.querySelector('.public-DraftEditor-content, [contenteditable="true"]');
      if (editor) {
        editor.innerHTML = content;
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, articleData.content);

    await randomDelay(CONFIG.delays.action);

    // 添加话题标签
    if (articleData.tags && articleData.tags.length > 0) {
      console.log(`\n🏷️  添加话题标签: ${articleData.tags.join(', ')}`);

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

    console.log('\n✅ 文章内容填写完成');

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
        console.log(`\n🎯 找到发布按钮`);
        break;
      }
    }

    if (!publishButton) {
      console.error('\n❌ 找不到发布按钮');
      process.exit(1);
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
    try {
      await page.waitForURL(/\/p\/\d+/, { timeout: 10000 });
      console.log('✅ 文章发布成功！');

      const articleUrl = page.url();
      console.log(`   文章链接: ${articleUrl}`);

      // 截图保存
      const screenshotPath = path.join(AUTO_DIR, 'reports', `published-${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   截图保存: ${screenshotPath}`);

      console.log('\n' + '═'.repeat(60));
      console.log('  ✅ 发布完成！');
      console.log('═'.repeat(60));
      console.log('');
      console.log(`文章链接: ${articleUrl}`);
      console.log('');

    } catch (error) {
      console.error('\n❌ 发布可能失败');
      console.error('   请检查页面是否显示错误信息');
    }

    // 保持浏览器打开 10 秒，让用户看到结果
    console.log('🔍 浏览器将在 10 秒后关闭...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error(`\n❌ 发布失败: ${error.message}`);
    process.exit(1);

  } finally {
    if (browser) {
      console.log('\n🚪 正在关闭浏览器...');
      await browser.close();
      console.log('✅ 浏览器已关闭\n');
    }
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
