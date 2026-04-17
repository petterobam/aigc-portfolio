#!/usr/bin/env node

/**
 * 番茄小说完整发布流程模拟脚本
 *
 * 目的：模拟完整的发布流程,验证"发布"按钮出现的条件
 *
 * 功能：
 * 1. 访问发布页面
 * 2. 填写标题
 * 3. 填写正文
 * 4. 点击"下一步"
 * 5. 观察按钮变化
 * 6. 选择分类
 * 7. 观察按钮变化
 * 8. 勾选发布协议
 * 9. 观察按钮变化
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

  // 番茄小说发布页面
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
  magenta: '\x1b[35m',
  bold: '\x1b[1m'
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

function logHighlight(message) {
  log(`★ ${message}`, colors.magenta);
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
  logInfo(`Cookie 文件: ${CONFIG.cookieFile}`);

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
 * 分析当前按钮
 */
async function analyzeButtons(page) {
  const buttons = await page.evaluate(() => {
    const buttons = [];

    const buttonElements = document.querySelectorAll('button');
    buttonElements.forEach((btn, index) => {
      const text = btn.textContent.trim();
      const isVisible = btn.offsetParent !== null;
      const isDisabled = btn.disabled;

      if (isVisible && !isDisabled && text.length < 20 && text.length > 0) {
        buttons.push({
          index: index,
          text: text,
          className: btn.className,
          id: btn.id,
          isDisabled: btn.disabled
        });
      }
    });

    return buttons;
  });

  return buttons;
}

/**
 * 主函数
 */
async function main() {
  log('\n' + '='.repeat(80));
  log('番茄小说完整发布流程模拟脚本', colors.bold);
  log('='.repeat(80) + '\n');

  let browser = null;
  const snapshots = [];

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
      headless: false,
      slowMo: 1000
    });

    const page = await browser.newPage();

    // 加载 Cookie
    logStep('加载 Cookie 到浏览器...');
    await page.context().addCookies(cookies);
    logSuccess('Cookie 已加载');
    log('');

    // 访问发布页面
    logStep('访问发布页面...');
    await page.goto(CONFIG.publishUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // 初始按钮分析
    logStep('分析初始按钮...');
    let buttons = await analyzeButtons(page);
    logInfo(`找到 ${buttons.length} 个可见按钮`);
    buttons.forEach((btn, index) => {
      log(`  [${index}] "${btn.text}"`, colors.cyan);
    });
    log('');

    // 步骤1: 填写标题
    logStep('步骤1: 填写标题...');
    const title = storyPackage.optimizedTitle || storyPackage.title;
    logInfo(`标题: ${title}`);

    try {
      await page.fill('textarea.byte-textarea.serial-textarea', title);
      logSuccess('标题已填写');
      await page.waitForTimeout(2000);

      // 按钮分析
      buttons = await analyzeButtons(page);
      logInfo(`填写标题后按钮数量: ${buttons.length}`);
      buttons.forEach((btn, index) => {
        log(`  [${index}] "${btn.text}"`, colors.cyan);
      });
    } catch (error) {
      logError(`填写标题失败: ${error.message}`);
    }
    log('');

    // 步骤2: 填写正文
    logStep('步骤2: 填写正文...');
    logInfo(`正文长度: ${storyContent.length} 字符`);

    try {
      await page.fill('div.ProseMirror.payNode-helper-content', storyContent);
      logSuccess('正文已填写');
      await page.waitForTimeout(2000);

      // 按钮分析
      buttons = await analyzeButtons(page);
      logInfo(`填写正文后按钮数量: ${buttons.length}`);
      buttons.forEach((btn, index) => {
        log(`  [${index}] "${btn.text}"`, colors.cyan);
      });
    } catch (error) {
      logError(`填写正文失败: ${error.message}`);
    }
    log('');

    // 步骤3: 点击"下一步"
    logStep('步骤3: 点击"下一步"...');

    try {
      await page.click('button:has-text("下一步")');
      logSuccess('"下一步"已点击');
      await page.waitForTimeout(5000);

      // 按钮分析
      buttons = await analyzeButtons(page);
      logInfo(`点击"下一步"后按钮数量: ${buttons.length}`);
      buttons.forEach((btn, index) => {
        log(`  [${index}] "${btn.text}"`, colors.cyan);
      });
    } catch (error) {
      logError(`点击"下一步"失败: ${error.message}`);
    }
    log('');

    // 步骤4: 选择分类
    logStep('步骤4: 尝试选择分类...');
    logInfo('目标分类: 灵异悬疑');

    try {
      // 尝试点击分类选择器
      await page.click('请选择作品分类');
      await page.waitForTimeout(2000);

      // 查找并点击"灵异悬疑"
      const options = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements
          .filter(el => el.textContent === '灵异悬疑' && el.offsetParent !== null)
          .map(el => el.tagName + (el.className ? '.' + el.className : ''));
      });

      if (options.length > 0) {
        logSuccess(`找到 ${options.length} 个"灵异悬疑"选项`);
        await page.click('灵异悬疑');
        logSuccess('分类已选择');
        await page.waitForTimeout(2000);

        // 按钮分析
        buttons = await analyzeButtons(page);
        logInfo(`选择分类后按钮数量: ${buttons.length}`);
        buttons.forEach((btn, index) => {
          log(`  [${index}] "${btn.text}"`, colors.cyan);
        });
      } else {
        logWarning('未找到"灵异悬疑"选项');
      }
    } catch (error) {
      logError(`选择分类失败: ${error.message}`);
    }
    log('');

    // 步骤5: 勾选发布协议
    logStep('步骤5: 勾选发布协议...');

    try {
      // 查找发布协议复选框
      const checkbox = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('input[type="checkbox"]'));
        return elements
          .filter(el => el.offsetParent !== null)
          .map(el => ({
            checked: el.checked,
            parentText: el.parentElement ? el.parentElement.textContent : ''
          }));
      });

      if (checkbox.length > 0) {
        logInfo(`找到 ${checkbox.length} 个复选框`);
        checkbox.forEach((cb, index) => {
          log(`  [${index}] 已勾选: ${cb.checked}, 父元素文本: "${cb.parentText.substring(0, 50)}..."`, colors.cyan);
        });

        // 尝试勾选第一个复选框
        await page.check('input[type="checkbox"]:not(:checked)');
        logSuccess('发布协议已勾选');
        await page.waitForTimeout(2000);

        // 按钮分析
        buttons = await analyzeButtons(page);
        logInfo(`勾选协议后按钮数量: ${buttons.length}`);
        buttons.forEach((btn, index) => {
          log(`  [${index}] "${btn.text}"`, colors.cyan);
        });
      } else {
        logWarning('未找到复选框');
      }
    } catch (error) {
      logError(`勾选发布协议失败: ${error.message}`);
    }
    log('');

    // 最终检查
    logStep('最终检查...');
    buttons = await analyzeButtons(page);
    logInfo(`最终按钮数量: ${buttons.length}`);

    const publishButton = buttons.find(btn => btn.text.includes('发布'));
    if (publishButton) {
      logSuccess(`✓✓✓ 找到"发布"按钮: "${publishButton.text}"`, colors.green);
      log(`  类名: ${publishButton.className || '(无)'}`);
      log(`  ID: ${publishButton.id || '(无)'}`);
    } else {
      logWarning(`✗✗✗ 仍未找到"发布"按钮`, colors.red);
      log(`  可能的原因:`, colors.yellow);
      log(`    1. 需要完成其他设置(如封面上传)`, colors.yellow);
      log(`    2. 有隐藏的发布按钮`, colors.yellow);
      log(`    3. 发布流程不是这样的`, colors.yellow);
    }

    // 保存截图
    const screenshot = path.join(CONFIG.outputDir, `simulate-publish-${Date.now()}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    logInfo(`最终截图已保存: ${screenshot}`);

    log('\n' + '='.repeat(80));
    log('模拟完成', colors.bold);
    log('='.repeat(80) + '\n');

    logInfo('浏览器窗口将保持打开状态，请手动检查页面结构。');
    logInfo('检查完成后，按 Ctrl+C 关闭脚本。');
    log('');

    // 保持浏览器窗口打开
    await new Promise(() => {});

  } catch (error) {
    logError(`模拟失败: ${error.message}`);
    logError(error.stack);

    process.exit(1);

  } finally {
    logInfo('保持浏览器窗口打开...');
  }
}

// 执行模拟
main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    process.exit(1);
  });
