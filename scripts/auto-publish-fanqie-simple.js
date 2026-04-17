#!/usr/bin/env node

/**
 * 番茄小说自动发布脚本（简化版）
 *
 * 目的：为 35号故事（今晚 20:30 发布）提供自动化发布能力
 *
 * 功能：
 * 1. 访问作家后台，创建新短故事
 * 2. 填写标题和正文
 * 3. 点击"下一步"进入设置页面
 * 4. 设置作品分类
 * 5. 点击"发布"完成发布
 *
 * 注意：
 * - 封面设置暂不处理（需要人工辅助）
 * - 试读比例暂不处理
 * - 发布协议默认勾选
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // Cookie 文件路径
  cookieFile: path.join(__dirname, '..', 'cookies', 'latest.json'),

  // 39号故事发布包路径
  storyPackagePath: path.join(__dirname, '..', '番茄短篇故事集/📦 发布包', '39号故事发布包.json'),

  // 故事内容文件路径
  storyContentPath: path.join(__dirname, '..', '番茄短篇故事集/stories/归档故事集/39_灵异悬疑_午夜电梯/content/full_story.md'),

  // 番茄小说作家后台
  writerDashboardUrl: 'https://fanqienovel.com/main/writer/short-manage',

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
 * 自动发布
 */
async function autoPublish() {
  log('\n' + '='.repeat(60));
  log('番茄小说自动发布脚本（简化版）', colors.blue);
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
      headless: false,  // 显示浏览器窗口，便于调试和确认
      slowMo: 300      // 减慢操作速度
    });

    const page = await browser.newPage();

    // 加载 Cookie
    logStep('加载 Cookie...');
    await page.context().addCookies(cookies);
    log('');

    // 访问作家后台
    logStep('访问作家后台...');
    await page.goto(CONFIG.writerDashboardUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 检查登录状态
    const hasUserName = await page.innerText('body').then(text => text.includes('帅帅它爸'));
    if (!hasUserName) {
      logError('登录状态：未登录或 Cookie 无效');
      throw new Error('登录失败');
    }
    logSuccess('登录状态：已登录');
    log('');

    // 点击"新建短故事"按钮
    logStep('点击"新建短故事"按钮...');
    const newStoryButton = page.locator('button:has-text("新建短故事")');
    await newStoryButton.click();
    await page.waitForTimeout(3000);
    log('');

    // 访问发布页面
    logStep('访问发布页面...');
    await page.goto('https://fanqienovel.com/main/writer/publish-short/?enter_from=NEWCHAPTER_1', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    log('');

    // 填写标题
    logStep('填写标题...');
    const title = storyPackage.optimizedTitle || storyPackage.title;
    logInfo(`标题: ${title}`);

    const titleTextarea = page.locator('textarea.byte-textarea.serial-textarea');
    await titleTextarea.fill(title);
    await page.waitForTimeout(1000);
    logSuccess('标题已填写');
    log('');

    // 填写正文
    logStep('填写正文...');
    logInfo(`正文长度: ${storyContent.length} 字符`);

    const contentEditor = page.locator('div.ProseMirror.payNode-helper-content');
    await contentEditor.fill(storyContent);
    await page.waitForTimeout(1000);
    logSuccess('正文已填写');
    log('');

    // 截图（第一页）
    const screenshot1 = path.join(CONFIG.outputDir, `publish-page1-${Date.now()}.png`);
    await page.screenshot({ path: screenshot1, fullPage: true });
    logSuccess(`截图已保存: ${screenshot1}`);
    log('');

    // 点击"下一步"按钮
    logStep('点击"下一步"按钮（进入设置页面）...');
    const nextButton1 = page.locator('#app button:has-text("下一步").btn-primary-variant');
    await nextButton1.click();

    // 等待页面更新
    logInfo('等待页面更新（10秒）...');
    await page.waitForTimeout(10000);
    logSuccess('已进入设置页面');
    log('');

    // 查找并设置作品分类
    logStep('查找作品分类...');
    logWarning('⚠️  作品分类需要人工确认和设置');
    logWarning('⚠️  建议手动选择"古代言情"或"穿越"分类');
    log('');

    // 勾选发布协议
    logStep('勾选发布协议...');
    try {
      const agreeCheckbox = page.locator('input[type="checkbox"]');
      const isChecked = await agreeCheckbox.isChecked();

      if (!isChecked) {
        await agreeCheckbox.check();
        await page.waitForTimeout(1000);
        logSuccess('发布协议已勾选');
      } else {
        logInfo('发布协议已勾选');
      }
    } catch (error) {
      logWarning(`勾选发布协议失败: ${error.message}`);
    }
    log('');

    // 截图（设置页面）
    const screenshot2 = path.join(CONFIG.outputDir, `publish-page2-${Date.now()}.png`);
    await page.screenshot({ path: screenshot2, fullPage: true });
    logSuccess(`截图已保存: ${screenshot2}`);
    log('');

    // 等待用户确认发布
    log('='.repeat(60), colors.yellow);
    log('⚠️  请手动完成以下步骤：', colors.yellow);
    log('='.repeat(60), colors.yellow);
    log('');
    log('1. 设置作品分类（建议选择"古代言情"或"穿越"）', colors.yellow);
    log('2. （可选）上传封面图片', colors.yellow);
    log('3. 确认发布协议已勾选', colors.yellow);
    log('4. 点击"发布"按钮完成发布', colors.yellow);
    log('');
    log('脚本已完成自动化步骤，浏览器窗口已打开。', colors.cyan);
    log('请手动完成剩余步骤后关闭浏览器。', colors.cyan);
    log('');

    // 保存发布结果
    const publishResult = {
      timestamp: new Date().toISOString(),
      storyId: storyPackage.storyId,
      storyTitle: storyPackage.optimizedTitle || storyPackage.title,
      automatedSteps: [
        '访问作家后台',
        '点击"新建短故事"按钮',
        '访问发布页面',
        '填写标题',
        '填写正文',
        '点击"下一步"进入设置页面',
        '勾选发布协议'
      ],
      manualSteps: [
        '设置作品分类',
        '（可选）上传封面',
        '点击"发布"按钮'
      ],
      screenshots: [screenshot1, screenshot2],
      status: '部分自动化（需人工完成剩余步骤）'
    };

    const resultFile = path.join(CONFIG.outputDir, `publish-result-${Date.now()}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(publishResult, null, 2), 'utf8');
    logSuccess(`发布结果已保存: ${resultFile}`);
    log('');

    log('='.repeat(60));
    logSuccess('自动化脚本执行完成！');
    log('='.repeat(60));
    log('');
    logInfo('状态：部分自动化（需人工完成剩余步骤）');
    logInfo('下一步：手动完成作品分类设置和发布');
    log('');

    // 保持浏览器窗口打开，等待用户手动操作
    logInfo('浏览器窗口将保持打开状态...');
    logInfo('手动完成剩余步骤后，按 Ctrl+C 关闭脚本。');
    log('');

    // 等待用户手动操作（无限等待，直到用户手动关闭）
    await new Promise(() => {});

  } catch (error) {
    logError(`发布失败: ${error.message}`);
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
    // 不自动关闭浏览器，等待用户手动操作
    logInfo('保持浏览器窗口打开...');
  }
}

// 执行发布
autoPublish()
  .then(result => {
    process.exit(0);  // 成功
  })
  .catch(error => {
    process.exit(1);  // 失败
  });
