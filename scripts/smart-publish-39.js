#!/usr/bin/env node

/**
 * 39号故事智能发布脚本
 *
 * 目的：使用智能查找算法完成39号故事的发布
 *
 * 功能：
 * 1. 访问番茄小说发布页面
 * 2. 自动加载 Cookie
 * 3. 智能查找并填写标题
 * 4. 智能查找并填写正文
 * 5. 智能查找并点击"下一步"按钮
 * 6. 智能查找并设置作品分类
 * 7. 智能查找并勾选发布协议
 * 8. 智能查找并点击"发布"按钮
 *
 * 特点：
 * - 使用智能查找算法，不依赖固定选择器
 * - 提供详细的操作日志
 * - 提供截图功能，便于调试
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
 * 智能查找元素
 * 通过文本内容、选择器、属性等多种方式查找元素
 */
async function smartFind(page, options) {
  const { text, selectors, attributes, timeout = 5000 } = options;

  // 方法1：通过文本内容查找
  if (text) {
    try {
      const locator = page.getByText(text, { exact: false });
      await locator.first().waitFor({ timeout });
      return locator.first();
    } catch (error) {
      // 继续尝试其他方法
    }
  }

  // 方法2：通过选择器查找
  if (selectors && selectors.length > 0) {
    for (const selector of selectors) {
      try {
        const locator = page.locator(selector).first();
        await locator.waitFor({ timeout: 1000 });
        return locator;
      } catch (error) {
        // 尝试下一个选择器
      }
    }
  }

  // 方法3：通过属性查找
  if (attributes) {
    try {
      const attrString = Object.entries(attributes)
        .map(([key, value]) => `[${key}="${value}"]`)
        .join('');
      const locator = page.locator(attrString).first();
      await locator.waitFor({ timeout });
      return locator;
    } catch (error) {
      // 继续尝试其他方法
    }
  }

  return null;
}

/**
 * 智能填写输入框
 */
async function smartFill(page, options) {
  const { text, selectors, value, timeout = 5000 } = options;

  const locator = await smartFind(page, { text, selectors, timeout });
  if (!locator) {
    return false;
  }

  try {
    await locator.fill(value);
    return true;
  } catch (error) {
    logWarning(`填写失败: ${error.message}`);
    return false;
  }
}

/**
 * 智能点击按钮
 */
async function smartClick(page, options) {
  const { text, selectors, attributes, timeout = 5000 } = options;

  const locator = await smartFind(page, { text, selectors, attributes, timeout });
  if (!locator) {
    return false;
  }

  try {
    await locator.click();
    return true;
  } catch (error) {
    logWarning(`点击失败: ${error.message}`);
    return false;
  }
}

/**
 * 智能查找并勾选复选框
 */
async function smartCheck(page, options) {
  const { text, selectors, attributes, timeout = 5000 } = options;

  const locator = await smartFind(page, { text, selectors, attributes, timeout });
  if (!locator) {
    return false;
  }

  try {
    const isChecked = await locator.isChecked();
    if (!isChecked) {
      await locator.check();
    }
    return true;
  } catch (error) {
    logWarning(`勾选失败: ${error.message}`);
    return false;
  }
}

/**
 * 智能选择下拉框选项
 */
async function smartSelect(page, options) {
  const { triggerText, triggerSelectors, optionText, timeout = 5000 } = options;

  // 点击下拉框
  const triggerLocator = await smartFind(page, { text: triggerText, selectors: triggerSelectors, timeout });
  if (!triggerLocator) {
    return false;
  }

  try {
    await triggerLocator.click();
    await page.waitForTimeout(1000);

    // 查找并点击选项
    const optionLocator = await smartFind(page, { text: optionText, timeout });
    if (!optionLocator) {
      return false;
    }

    await optionLocator.click();
    await page.waitForTimeout(1000);
    return true;
  } catch (error) {
    logWarning(`选择失败: ${error.message}`);
    return false;
  }
}

/**
 * 自动发布
 */
async function autoPublish() {
  log('\n' + '='.repeat(60));
  log('39号故事智能发布脚本', colors.blue);
  log('='.repeat(60) + '\n');

  let browser = null;
  const screenshots = [];

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
      slowMo: 500
    });

    const page = await browser.newPage();

    // 加载 Cookie
    logStep('加载 Cookie...');
    await page.context().addCookies(cookies);
    log('');

    // 访问发布页面
    logStep('访问发布页面...');
    await page.goto(CONFIG.publishUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    // 检查登录状态（多种方式）
    let isLoggedIn = false;

    // 方式1：检查用户名
    try {
      const hasUserName = await page.innerText('body').then(text => text.includes('帅帅它爸'));
      if (hasUserName) {
        isLoggedIn = true;
        logSuccess('登录状态：已登录（通过用户名验证）');
      }
    } catch (error) {
      // 继续尝试其他方式
    }

    // 方式2：检查页面标题
    if (!isLoggedIn) {
      try {
        const pageTitle = await page.title();
        if (pageTitle.includes('作家') || pageTitle.includes('发布')) {
          isLoggedIn = true;
          logSuccess('登录状态：已登录（通过页面标题验证）');
        }
      } catch (error) {
        // 继续尝试其他方式
      }
    }

    // 方式3：检查是否有发布表单
    if (!isLoggedIn) {
      try {
        const hasForm = await page.locator('textarea, input, div[contenteditable]').count() > 0;
        if (hasForm) {
          isLoggedIn = true;
          logSuccess('登录状态：已登录（通过表单验证）');
        }
      } catch (error) {
        // 继续尝试其他方式
      }
    }

    if (!isLoggedIn) {
      logError('登录状态：未登录或 Cookie 无效');
      logWarning('将继续尝试发布，但可能会失败');
      // 不抛出异常，继续尝试发布
    }
    log('');

    // 步骤1：填写标题
    logStep('步骤1：填写标题...');
    const title = storyPackage.optimizedTitle || storyPackage.title;
    logInfo(`标题: ${title}`);

    const titleFilled = await smartFill(page, {
      selectors: [
        'textarea.byte-textarea.serial-textarea',
        'textarea[placeholder*="标题"]',
        'input[placeholder*="标题"]'
      ],
      value: title,
      timeout: 5000
    });

    if (titleFilled) {
      logSuccess('标题已填写');
    } else {
      logError('标题填写失败');
    }
    await page.waitForTimeout(1000);
    log('');

    // 截图
    const screenshot1 = path.join(CONFIG.outputDir, `smart-publish-39-step1-${Date.now()}.png`);
    await page.screenshot({ path: screenshot1, fullPage: true });
    screenshots.push(screenshot1);
    logInfo(`截图已保存: ${screenshot1}\n`);

    // 步骤2：填写正文
    logStep('步骤2：填写正文...');
    logInfo(`正文长度: ${storyContent.length} 字符`);

    const contentFilled = await smartFill(page, {
      selectors: [
        'div.ProseMirror.payNode-helper-content',
        'div[contenteditable="true"]',
        'textarea[placeholder*="正文"]'
      ],
      value: storyContent,
      timeout: 5000
    });

    if (contentFilled) {
      logSuccess('正文已填写');
    } else {
      logError('正文填写失败');
    }
    await page.waitForTimeout(1000);
    log('');

    // 截图
    const screenshot2 = path.join(CONFIG.outputDir, `smart-publish-39-step2-${Date.now()}.png`);
    await page.screenshot({ path: screenshot2, fullPage: true });
    screenshots.push(screenshot2);
    logInfo(`截图已保存: ${screenshot2}\n`);

    // 步骤3：点击"下一步"按钮
    logStep('步骤3：点击"下一步"按钮...');

    const nextClicked = await smartClick(page, {
      text: '下一步',
      selectors: [
        'button:has-text("下一步")',
        '#app button:has-text("下一步").btn-primary-variant',
        '.btn-primary-variant:has-text("下一步")'
      ],
      timeout: 5000
    });

    if (nextClicked) {
      logSuccess('"下一步"按钮已点击');
    } else {
      logError('"下一步"按钮点击失败');
    }
    await page.waitForTimeout(5000);
    log('');

    // 截图
    const screenshot3 = path.join(CONFIG.outputDir, `smart-publish-39-step3-${Date.now()}.png`);
    await page.screenshot({ path: screenshot3, fullPage: true });
    screenshots.push(screenshot3);
    logInfo(`截图已保存: ${screenshot3}\n`);

    // 步骤4：设置作品分类
    logStep('步骤4：设置作品分类...');
    logInfo('建议选择: 灵异悬疑');

    // 尝试多种方式设置分类
    let categorySet = false;

    // 方式1：通过点击分类按钮
    if (!categorySet) {
      const categoryClicked = await smartClick(page, {
        text: '分类',
        selectors: [
          'button:has-text("分类")',
          '.category-selector',
          '[data-testid="category"]'
        ],
        timeout: 3000
      });

      if (categoryClicked) {
        await page.waitForTimeout(1000);
        const optionClicked = await smartClick(page, {
          text: '灵异悬疑',
          selectors: [
            'li:has-text("灵异悬疑")',
            'div:has-text("灵异悬疑")',
            '[value*="灵异"]'
          ],
          timeout: 3000
        });

        if (optionClicked) {
          categorySet = true;
          logSuccess('作品分类已设置: 灵异悬疑');
        }
      }
    }

    // 方式2：通过下拉框选择
    if (!categorySet) {
      const categorySelected = await smartSelect(page, {
        triggerText: '分类',
        triggerSelectors: [
          'select[name="category"]',
          '.category-select',
          '[data-testid="category-select"]'
        ],
        optionText: '灵异悬疑',
        timeout: 3000
      });

      if (categorySelected) {
        categorySet = true;
        logSuccess('作品分类已设置: 灵异悬疑');
      }
    }

    if (!categorySet) {
      logWarning('作品分类设置失败，请手动设置');
    }
    await page.waitForTimeout(1000);
    log('');

    // 截图
    const screenshot4 = path.join(CONFIG.outputDir, `smart-publish-39-step4-${Date.now()}.png`);
    await page.screenshot({ path: screenshot4, fullPage: true });
    screenshots.push(screenshot4);
    logInfo(`截图已保存: ${screenshot4}\n`);

    // 步骤5：勾选发布协议
    logStep('步骤5：勾选发布协议...');

    // 尝试多种方式勾选协议
    let agreementChecked = false;

    // 方式1：通过文本查找
    if (!agreementChecked) {
      agreementChecked = await smartCheck(page, {
        text: '发布协议',
        selectors: [
          'input[type="checkbox"]',
          '.agreement-checkbox',
          '[data-testid="agreement"]'
        ],
        timeout: 3000
      });
    }

    // 方式2：通过属性查找
    if (!agreementChecked) {
      agreementChecked = await smartCheck(page, {
        selectors: [
          'input[type="checkbox"][value*="agree"]',
          'input[type="checkbox"][name*="agree"]',
          'input[type="checkbox"].agreement'
        ],
        timeout: 3000
      });
    }

    if (agreementChecked) {
      logSuccess('发布协议已勾选');
    } else {
      logWarning('发布协议勾选失败，请手动勾选');
    }
    await page.waitForTimeout(1000);
    log('');

    // 截图
    const screenshot5 = path.join(CONFIG.outputDir, `smart-publish-39-step5-${Date.now()}.png`);
    await page.screenshot({ path: screenshot5, fullPage: true });
    screenshots.push(screenshot5);
    logInfo(`截图已保存: ${screenshot5}\n`);

    // 步骤6：点击"发布"按钮
    logStep('步骤6：点击"发布"按钮...');

    const publishClicked = await smartClick(page, {
      text: '发布',
      selectors: [
        'button:has-text("发布")',
        '#app button:has-text("发布").btn-primary',
        '.btn-primary:has-text("发布")'
      ],
      timeout: 5000
    });

    if (publishClicked) {
      logSuccess('"发布"按钮已点击');
    } else {
      logError('"发布"按钮点击失败');
    }
    await page.waitForTimeout(5000);
    log('');

    // 检查发布结果
    const pageText = await page.innerText('body');
    const isPublished = pageText.includes('发布成功') || pageText.includes('已发布');

    if (isPublished) {
      logSuccess('发布成功！');
    } else {
      logWarning('发布状态未知，请手动确认');
    }

    // 截图
    const screenshot6 = path.join(CONFIG.outputDir, `smart-publish-39-step6-${Date.now()}.png`);
    await page.screenshot({ path: screenshot6, fullPage: true });
    screenshots.push(screenshot6);
    logInfo(`截图已保存: ${screenshot6}\n`);

    // 保存发布结果
    const publishResult = {
      timestamp: new Date().toISOString(),
      storyId: storyPackage.storyId,
      storyTitle: storyPackage.optimizedTitle || storyPackage.title,
      steps: {
        title: titleFilled,
        content: contentFilled,
        next: nextClicked,
        category: categorySet,
        agreement: agreementChecked,
        publish: publishClicked,
        isPublished: isPublished
      },
      screenshots: screenshots,
      status: isPublished ? '发布成功' : '发布状态未知'
    };

    const resultFile = path.join(CONFIG.outputDir, `smart-publish-39-result-${Date.now()}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(publishResult, null, 2), 'utf8');
    logSuccess(`发布结果已保存: ${resultFile}`);
    log('');

    log('='.repeat(60));
    logHighlight(isPublished ? '✓ 发布成功！' : '⚠ 发布状态未知，请手动确认');
    log('='.repeat(60));
    log('');

    if (!isPublished) {
      log('请手动完成以下步骤：', colors.yellow);
      log('1. 设置作品分类（如果未设置）', colors.yellow);
      log('2. 勾选发布协议（如果未勾选）', colors.yellow);
      log('3. 点击"发布"按钮（如果未点击）', colors.yellow);
      log('');
    }

    // 保持浏览器窗口打开
    logInfo('浏览器窗口将保持打开状态...');
    logInfo('确认发布完成后，按 Ctrl+C 关闭脚本。');
    log('');

    await new Promise(() => {});

  } catch (error) {
    logError(`发布失败: ${error.message}`);
    logError(error.stack);

    // 尝试保存错误截图
    if (browser) {
      const errorScreenshot = path.join(CONFIG.outputDir, `smart-publish-39-error-${Date.now()}.png`);
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
    // 不自动关闭浏览器
    logInfo('保持浏览器窗口打开...');
  }
}

// 执行发布
autoPublish()
  .then(result => {
    process.exit(0);
  })
  .catch(error => {
    process.exit(1);
  });
