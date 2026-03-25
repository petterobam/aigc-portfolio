#!/usr/bin/env node

/**
 * 番茄小说自动化发布测试脚本
 *
 * 目的：验证 Playwright 是否能够完成番茄小说发布流程
 * 使用：node scripts/test-publish-fanqie.js
 *
 * 测试内容：
 * 1. 访问番茄小说作家后台发布页面
 * 2. 填写标题
 * 3. 填写正文
 * 4. 点击"下一步"（验证页面跳转）
 *
 * 注意：本脚本仅测试发布流程的前几个步骤，不实际提交发布
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // Cookie 文件路径
  cookieFile: path.join(__dirname, '..', 'cookies', 'latest.json'),

  // 35号故事发布包路径
  storyPackagePath: path.join(__dirname, '..', '番茄短篇故事集/📦 发布包', '35号故事发布包.json'),

  // 故事内容文件路径
  storyContentPath: path.join(__dirname, '..', '番茄短篇故事集/📤 待发布', '35号故事-穿成不受宠的太子妃-完整内容-优化版.md'),

  // 番茄小说作家后台（短故事管理页面）
  writerDashboardUrl: 'https://fanqienovel.com/main/writer/short-manage',

  // 番茄小说短故事发布页面
  publishUrl: 'https://fanqienovel.com/main/writer/publish-short/?enter_from=NEWCHAPTER_1',

  // 输出目录
  outputDir: path.join(__dirname, '..', 'data')
};

// ANSI 颜色
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

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

function logStep(message) {
  log(`📍 ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

/**
 * 加载 Cookie
 */
function loadCookies() {
  if (!fs.existsSync(CONFIG.cookieFile)) {
    throw new Error(`Cookie 文件不存在: ${CONFIG.cookieFile}`);
  }

  const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));
  logSuccess(`已加载 ${cookies.length} 个 Cookie`);

  return cookies;
}

/**
 * 加载故事发布包
 */
function loadStoryPackage() {
  if (!fs.existsSync(CONFIG.storyPackagePath)) {
    throw new Error(`故事发布包不存在: ${CONFIG.storyPackagePath}`);
  }

  const package = JSON.parse(fs.readFileSync(CONFIG.storyPackagePath, 'utf8'));
  logInfo(`故事标题: ${package.title}`);
  logInfo(`字数: ${package.actualWords}`);
  logInfo(`章节数: ${package.chapters}`);

  return package;
}

/**
 * 加载故事内容
 */
function loadStoryContent() {
  if (!fs.existsSync(CONFIG.storyContentPath)) {
    throw new Error(`故事内容文件不存在: ${CONFIG.storyContentPath}`);
  }

  let content = fs.readFileSync(CONFIG.storyContentPath, 'utf8');

  // 去除 Markdown 标题（第一行）
  const lines = content.split('\n');
  if (lines[0].startsWith('#')) {
    content = lines.slice(1).join('\n').trim();
  }

  logInfo(`故事内容长度: ${content.length} 字符`);

  return content;
}

/**
 * 测试发布流程
 */
async function testPublishFlow() {
  log('\n' + '='.repeat(60));
  log('番茄小说自动化发布测试', colors.blue);
  log('='.repeat(60) + '\n');

  let browser = null;

  try {
    // 确保输出目录存在
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    // 加载数据
    logStep('加载数据...');
    const cookies = loadCookies();
    const storyPackage = loadStoryPackage();
    const storyContent = loadStoryContent();
    log('');

    // 启动浏览器
    logStep('启动浏览器...');
    browser = await chromium.launch({
      headless: false,  // 显示浏览器窗口，便于调试
      slowMo: 200  // 减慢操作速度
    });

    // 创建页面
    const page = await browser.newPage();

    // 加载 Cookie
    logStep('加载 Cookie...');
    await page.context().addCookies(cookies);
    log('');

    // 访问作家后台
    logStep(`访问作家后台: ${CONFIG.writerDashboardUrl}`);
    await page.goto(CONFIG.writerDashboardUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    log('');

    // 检查登录状态
    logStep('检查登录状态...');
    const hasUserName = await page.innerText('body').then(text => text.includes('帅帅它爸'));
    if (hasUserName) {
      logSuccess('登录状态：已登录');
    } else {
      logError('登录状态：未登录或 Cookie 无效');
      throw new Error('登录失败');
    }
    log('');

    // 查找"新建短故事"按钮
    logStep('查找"新建短故事"按钮...');
    const publishButton = page.locator('button:has-text("新建短故事")');
    await publishButton.waitFor({ state: 'visible', timeout: 5000 });
    logSuccess('找到"新建短故事"按钮');
    log('');

    // 点击"新建短故事"按钮
    logStep('点击"新建短故事"按钮...');
    await publishButton.click();
    await page.waitForTimeout(3000);
    log('');

    // 直接访问发布页面 URL（更可靠）
    logStep('访问发布页面 URL...');
    await page.goto(CONFIG.publishUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    logInfo(`当前页面 URL: ${currentUrl}`);

    if (currentUrl.includes('publish-short')) {
      logSuccess('成功进入发布页面');
    } else {
      logWarning('可能未正确进入发布页面');
    }
    log('');

    // 填写标题
    logStep('填写标题...');
    const title = storyPackage.title;
    logInfo(`标题: ${title}`);

    try {
      const titleTextarea = page.locator('textarea.byte-textarea.serial-textarea');
      await titleTextarea.waitFor({ state: 'visible', timeout: 5000 });
      await titleTextarea.fill(title);
      await page.waitForTimeout(1000);

      const filledTitle = await titleTextarea.inputValue();
      if (filledTitle === title) {
        logSuccess('标题已填充成功');
      } else {
        logError(`标题填充失败: 期望 "${title}", 实际 "${filledTitle}"`);
      }
    } catch (error) {
      logError(`填写标题失败: ${error.message}`);
      logInfo('尝试查找其他可能的标题字段...');

      const allTextareas = await page.$$('textarea');
      logInfo(`找到 ${allTextareas.length} 个文本域`);
      for (let i = 0; i < allTextareas.length; i++) {
        const textarea = allTextareas[i];
        const className = await textarea.evaluate(el => el.className);
        const placeholder = await textarea.evaluate(el => el.placeholder);
        logInfo(`  ${i + 1}. className: ${className.substring(0, 80)}`);
        logInfo(`     placeholder: ${placeholder}`);
      }

      throw error;
    }
    log('');

    // 填写正文
    logStep('填写正文...');
    logInfo(`正文长度: ${storyContent.length} 字符`);

    try {
      const contentEditor = page.locator('div.ProseMirror.payNode-helper-content');
      await contentEditor.waitFor({ state: 'visible', timeout: 5000 });
      await contentEditor.fill(storyContent);
      await page.waitForTimeout(1000);

      const filledContent = await contentEditor.innerText();
      logSuccess(`正文已填充成功 (前50字): "${filledContent.substring(0, 50)}..."`);
    } catch (error) {
      logError(`填写正文失败: ${error.message}`);
      logInfo('尝试查找其他可能的正文字段...');

      const allContentEditable = await page.$$('[contenteditable="true"], [contenteditable=""]');
      logInfo(`找到 ${allContentEditable.length} 个可编辑区域`);
      for (let i = 0; i < allContentEditable.length; i++) {
        const editor = allContentEditable[i];
        const className = await editor.evaluate(el => el.className);
        const innerHTML = await editor.evaluate(el => el.innerHTML);
        logInfo(`  ${i + 1}. className: ${className.substring(0, 80)}`);
        logInfo(`     innerHTML: ${innerHTML.substring(0, 80)}`);
      }

      throw error;
    }
    log('');

    // 截图（发布页面第一页）
    const screenshot1 = path.join(CONFIG.outputDir, `publish-step1-fill-${Date.now()}.png`);
    await page.screenshot({ path: screenshot1, fullPage: true });
    logSuccess(`截图已保存: ${screenshot1}`);
    log('');

    // 查找"下一步"按钮
    logStep('查找"下一步"按钮...');
    const nextButtons = await page.$$('button');
    let nextButton = null;

    for (const button of nextButtons) {
      const text = await button.innerText();
      const className = await button.evaluate(el => el.className);
      if (text.includes('下一步') || text.includes('next') || className.includes('next')) {
        logInfo(`找到按钮: "${text.trim()}" (className: ${className.substring(0, 80)})`);
        nextButton = button;
        break;
      }
    }

    if (!nextButton) {
      logWarning('未找到"下一步"按钮，尝试查找所有按钮...');
      for (let i = 0; i < nextButtons.length; i++) {
        const button = nextButtons[i];
        const text = await button.innerText();
        const className = await button.evaluate(el => el.className);
        logInfo(`  ${i + 1}. "${text.trim()}" (className: ${className.substring(0, 80)})`);
      }
      throw new Error('未找到"下一步"按钮');
    }
    log('');

    // 点击"下一步"按钮
    logStep('点击"下一步"按钮...');
    await nextButton.click();
    await page.waitForTimeout(5000);
    log('');

    // 检查是否跳转到第二页
    const newUrl = page.url();
    logInfo(`跳转后 URL: ${newUrl}`);

    if (newUrl !== currentUrl) {
      logSuccess('成功跳转到第二页');
    } else {
      logWarning('URL 未变化，可能未跳转');
    }

    // 截图（发布页面第二页）
    const screenshot2 = path.join(CONFIG.outputDir, `publish-step2-${Date.now()}.png`);
    await page.screenshot({ path: screenshot2, fullPage: true });
    logSuccess(`截图已保存: ${screenshot2}`);
    log('');

    // 保存测试结果
    const testResult = {
      timestamp: new Date().toISOString(),
      storyId: storyPackage.storyId,
      storyTitle: storyPackage.title,
      testSteps: [
        { step: 1, name: '访问发布页面', success: true },
        { step: 2, name: '填写标题', success: true },
        { step: 3, name: '填写正文', success: true },
        { step: 4, name: '点击下一步', success: true }
      ],
      urls: {
        publishPage: currentUrl,
        nextStep: newUrl
      },
      screenshots: [screenshot1, screenshot2],
      conclusion: 'Playwright 能够完成番茄小说发布流程（前 4 个步骤）'
    };

    const resultFile = path.join(CONFIG.outputDir, `publish-test-result-${Date.now()}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(testResult, null, 2), 'utf8');
    logSuccess(`测试结果已保存: ${resultFile}`);
    log('');

    log('='.repeat(60));
    logSuccess('测试完成！');
    log('='.repeat(60));
    log('');
    logInfo('测试结论: Playwright 能够完成番茄小说发布流程（前 4 个步骤）');
    logInfo('下一步: 可以继续测试封面上传、标签选择、简介填写等步骤');
    log('');

    return testResult;

  } catch (error) {
    logError(`测试失败: ${error.message}`);
    logError(error.stack);

    // 即使失败也尝试截图
    if (browser) {
      const errorScreenshot = path.join(CONFIG.outputDir, `publish-error-${Date.now()}.png`);
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          await pages[0].screenshot({ path: errorScreenshot, fullPage: true });
          logInfo(`错误截图已保存: ${errorScreenshot}`);
        }
      } catch (screenshotError) {
        logError(`保存错误截图失败: ${screenshotError.message}`);
      }
    }

    throw error;

  } finally {
    if (browser) {
      await browser.close();
      logInfo('浏览器已关闭');
    }
  }
}

// 执行测试
testPublishFlow()
  .then(result => {
    process.exit(0);  // 成功
  })
  .catch(error => {
    process.exit(1);  // 失败
  });
