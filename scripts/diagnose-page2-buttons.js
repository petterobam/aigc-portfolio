#!/usr/bin/env node

/**
 * 番茄小说第二页按钮诊断脚本
 *
 * 目的：分析番茄小说发布流程第二页的按钮结构
 * 确认是否有"发布"按钮
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // Cookie 文件路径(使用最新版本)
  cookieFile: path.join(__dirname, '..', 'cookies', 'latest.json'),

  // 番茄小说发布页面
  publishUrl: 'https://fanqienovel.com/main/writer/publish-short/?enter_from=NEWCHAPTER_1',

  // 短故事管理页面
  manageUrl: 'https://fanqienovel.com/main/writer/short-manage',

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

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logStep(message) {
  log(`📍 ${message}`, colors.blue);
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
 * 分析页面按钮
 */
async function analyzeButtons(page) {
  logStep('分析页面按钮...');

  // 获取所有按钮元素
  const buttons = await page.evaluate(() => {
    const buttons = [];

    // 查找所有 button 元素
    const buttonElements = document.querySelectorAll('button');
    buttonElements.forEach((btn, index) => {
      buttons.push({
        type: 'button',
        index: index,
        text: btn.textContent.trim(),
        className: btn.className,
        id: btn.id,
        isVisible: btn.offsetParent !== null,
        isDisabled: btn.disabled,
        attributes: Array.from(btn.attributes).map(attr => ({
          name: attr.name,
          value: attr.value
        }))
      });
    });

    // 查找所有 a 元素(可能包含按钮样式的链接)
    const linkElements = document.querySelectorAll('a');
    linkElements.forEach((link, index) => {
      const text = link.textContent.trim();
      // 过滤掉空链接和导航链接
      if (text && text.length < 20 && link.offsetParent !== null) {
        buttons.push({
          type: 'link',
          index: index,
          text: text,
          href: link.href,
          className: link.className,
          id: link.id,
          isVisible: link.offsetParent !== null,
          attributes: Array.from(link.attributes).map(attr => ({
            name: attr.name,
            value: attr.value
          }))
        });
      }
    });

    return buttons;
  });

  // 过滤可见按钮
  const visibleButtons = buttons.filter(btn => btn.isVisible && !btn.isDisabled);

  logInfo(`找到 ${buttons.length} 个按钮元素`);
  logInfo(`其中 ${visibleButtons.length} 个可见且可用`);

  // 打印按钮列表
  log('\n' + '='.repeat(80));
  log('按钮列表:', colors.bold);
  log('='.repeat(80));

  visibleButtons.forEach((btn, index) => {
    log(`\n[${index}] ${btn.type.toUpperCase()} - "${btn.text}"`, colors.cyan);
    log(`    类名: ${btn.className || '(无)'}`);
    log(`    ID: ${btn.id || '(无)'}`);

    // 高亮"发布"相关按钮
    if (btn.text.includes('发布')) {
      log(`    ⭐⭐⭐ 发现"发布"按钮！`, colors.green);
    }
    if (btn.text.includes('下一步')) {
      log(`    ⭐⭐⭐ 发现"下一步"按钮！`, colors.green);
    }
    if (btn.text.includes('存草稿')) {
      log(`    ⭐ 发现"存草稿"按钮`, colors.yellow);
    }
  });

  log('\n' + '='.repeat(80));

  // 查找关键按钮
  const publishButton = visibleButtons.find(btn => btn.text.includes('发布'));
  const nextButton = visibleButtons.find(btn => btn.text.includes('下一步'));
  const draftButton = visibleButtons.find(btn => btn.text.includes('存草稿'));

  if (publishButton) {
    logSuccess(`✓ 找到"发布"按钮: "${publishButton.text}"`);
    log(`  类名: ${publishButton.className || '(无)'}`);
    log(`  ID: ${publishButton.id || '(无)'}`);
  } else {
    logWarning(`✗ 未找到"发布"按钮`);
  }

  if (nextButton) {
    logSuccess(`✓ 找到"下一步"按钮: "${nextButton.text}"`);
  } else {
    logInfo(`ℹ 未找到"下一步"按钮`);
  }

  if (draftButton) {
    logSuccess(`✓ 找到"存草稿"按钮: "${draftButton.text}"`);
  } else {
    logInfo(`ℹ 未找到"存草稿"按钮`);
  }

  log('\n');

  return {
    allButtons: buttons,
    visibleButtons: visibleButtons,
    publishButton: publishButton,
    nextButton: nextButton,
    draftButton: draftButton
  };
}

/**
 * 分析页面表单
 */
async function analyzeForms(page) {
  logStep('分析页面表单...');

  const forms = await page.evaluate(() => {
    const forms = [];

    // 查找所有 input 元素
    const inputs = document.querySelectorAll('input');
    inputs.forEach((input, index) => {
      forms.push({
        type: 'input',
        index: index,
        inputType: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        value: input.value,
        className: input.className,
        isVisible: input.offsetParent !== null
      });
    });

    // 查找所有 textarea 元素
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach((textarea, index) => {
      forms.push({
        type: 'textarea',
        index: index,
        name: textarea.name,
        id: textarea.id,
        placeholder: textarea.placeholder,
        value: textarea.value,
        className: textarea.className,
        isVisible: textarea.offsetParent !== null
      });
    });

    // 查找所有 select 元素
    const selects = document.querySelectorAll('select');
    selects.forEach((select, index) => {
      forms.push({
        type: 'select',
        index: index,
        name: select.name,
        id: select.id,
        className: select.className,
        isVisible: select.offsetParent !== null,
        options: Array.from(select.options).map(opt => ({
          value: opt.value,
          text: opt.text
        }))
      });
    });

    // 查找所有 checkbox 元素
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox, index) => {
      forms.push({
        type: 'checkbox',
        index: index,
        name: checkbox.name,
        id: checkbox.id,
        className: checkbox.className,
        isChecked: checkbox.checked,
        isVisible: checkbox.offsetParent !== null
      });
    });

    return forms;
  });

  // 过滤可见表单元素
  const visibleForms = forms.filter(form => form.isVisible);

  logInfo(`找到 ${forms.length} 个表单元素`);
  logInfo(`其中 ${visibleForms.length} 个可见`);

  // 打印关键表单元素
  const checkboxes = visibleForms.filter(form => form.type === 'checkbox');
  const selects = visibleForms.filter(form => form.type === 'select');

  if (checkboxes.length > 0) {
    log(`\n复选框 (${checkboxes.length} 个):`, colors.cyan);
    checkboxes.forEach((cb, index) => {
      log(`  [${index}] ${cb.name || cb.id || '(无名)'} - 已勾选: ${cb.isChecked}`);
    });
  }

  if (selects.length > 0) {
    log(`\n下拉框 (${selects.length} 个):`, colors.cyan);
    selects.forEach((sel, index) => {
      log(`  [${index}] ${sel.name || sel.id || '(无名)'}`);
      if (sel.options && sel.options.length > 0) {
        log(`    选项数: ${sel.options.length}`);
        log(`    当前值: ${sel.value || '(未选择)'}`);
      }
    });
  }

  log('\n');

  return {
    allForms: forms,
    visibleForms: visibleForms,
    checkboxes: checkboxes,
    selects: selects
  };
}

/**
 * 获取页面状态
 */
async function getPageState(page) {
  const state = await page.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      bodyText: document.body.innerText.substring(0, 500)
    };
  });

  return state;
}

/**
 * 主函数
 */
async function main() {
  log('\n' + '='.repeat(80));
  log('番茄小说第二页按钮诊断脚本', colors.bold);
  log('='.repeat(80) + '\n');

  let browser = null;
  const results = {};

  try {
    // 确保输出目录存在
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    // 加载 Cookie
    logStep('加载 Cookie...');
    const cookies = loadCookies();
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

    // 检查登录状态
    const pageText = await page.innerText('body');
    const isLoggedIn = pageText.includes('帅帅它爸');

    if (isLoggedIn) {
      logSuccess('登录状态：已登录');
    } else {
      logWarning('登录状态：未知或未登录');
      logWarning('将继续分析，但可能无法访问受保护页面');
    }

    log('');

    // 保存第一页截图
    const screenshot1 = path.join(CONFIG.outputDir, `diagnose-page1-${Date.now()}.png`);
    await page.screenshot({ path: screenshot1, fullPage: true });
    logInfo(`第一页截图已保存: ${screenshot1}`);

    // 获取第一页状态
    results.page1 = await getPageState(page);
    logInfo(`第一页 URL: ${results.page1.url}`);
    logInfo(`第一页标题: ${results.page1.title}`);
    log('');

    // 分析第一页按钮
    logStep('分析第一页按钮...');
    const page1Buttons = await analyzeButtons(page);
    results.page1Buttons = page1Buttons;

    // 点击"下一步"按钮
    if (page1Buttons.nextButton) {
      logStep('点击"下一步"按钮...');
      await page.click('button:has-text("下一步")');
      await page.waitForTimeout(5000);

      // 保存第二页截图
      const screenshot2 = path.join(CONFIG.outputDir, `diagnose-page2-${Date.now()}.png`);
      await page.screenshot({ path: screenshot2, fullPage: true });
      logInfo(`第二页截图已保存: ${screenshot2}`);

      // 获取第二页状态
      results.page2 = await getPageState(page);
      logInfo(`第二页 URL: ${results.page2.url}`);
      logInfo(`第二页标题: ${results.page2.title}`);
      log('');

      // 分析第二页按钮
      logStep('分析第二页按钮...');
      const page2Buttons = await analyzeButtons(page);
      results.page2Buttons = page2Buttons;

      // 分析第二页表单
      const page2Forms = await analyzeForms(page);
      results.page2Forms = page2Forms;

      // 核心发现
      log('\n' + '='.repeat(80));
      log('核心发现:', colors.bold);
      log('='.repeat(80) + '\n');

      if (page2Buttons.publishButton) {
        logSuccess(`✓✓✓ 第二页有"发布"按钮！`, colors.green);
        log(`  按钮文本: "${page2Buttons.publishButton.text}"`);
        log(`  类名: ${page2Buttons.publishButton.className || '(无)'}`);
        log(`  ID: ${page2Buttons.publishButton.id || '(无)'}`);
      } else {
        logError(`✗✗✗ 第二页没有"发布"按钮！`, colors.red);
        log(`  可能的发布方式:`, colors.yellow);
        log(`    - 第一页有"发布"按钮`);
        log(`    - 需要在第一页完成所有设置后点击"发布"`);
        log(`    - 发布流程只有一步`);
      }

      log('');

    } else {
      logError('未找到"下一步"按钮，无法进入第二页');
    }

    // 保存诊断结果
    const resultFile = path.join(CONFIG.outputDir, `diagnose-page2-result-${Date.now()}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(results, null, 2), 'utf8');
    logSuccess(`诊断结果已保存: ${resultFile}`);

    log('\n' + '='.repeat(80));
    log('诊断完成', colors.bold);
    log('='.repeat(80) + '\n');

    logInfo('浏览器窗口将保持打开状态，请手动检查页面结构。');
    logInfo('检查完成后，按 Ctrl+C 关闭脚本。');
    log('');

    // 保持浏览器窗口打开
    await new Promise(() => {});

  } catch (error) {
    logError(`诊断失败: ${error.message}`);
    logError(error.stack);

    // 保存错误截图
    if (browser) {
      const errorScreenshot = path.join(CONFIG.outputDir, `diagnose-error-${Date.now()}.png`);
      try {
        const context = browser.contexts()[0];
        if (context) {
          const pages = context.pages();
          if (pages.length > 0) {
            await pages[0].screenshot({ path: errorScreenshot, fullPage: true });
            logInfo(`错误截图已保存: ${errorScreenshot}`);
          }
        }
      } catch (screenshotError) {
        logError(`保存错误截图失败: ${screenshotError.message}`);
      }
    }

    process.exit(1);

  } finally {
    // 不自动关闭浏览器
    logInfo('保持浏览器窗口打开...');
  }
}

// 执行诊断
main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    process.exit(1);
  });
