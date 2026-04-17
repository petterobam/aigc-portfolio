#!/usr/bin/env node

/**
 * 分析作品分类和发布协议的UI结构
 * 目的是找到正确的选择器和交互方式
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  cookieFile: path.join(__dirname, '..', 'cookies', 'latest.json'),
  publishUrl: 'https://fanqienovel.com/main/writer/publish-short/?enter_from=NEWCHAPTER_1',
  storyContentPath: path.join(__dirname, '..', '番茄短篇故事集/stories/归档故事集/39_灵异悬疑_午夜电梯/content/full_story.md'),
  outputDir: path.join(__dirname, '..', 'data')
};

function log(message, color = '\x1b[0m') {
  console.log(`${color}${message}\x1b[0m`);
}

function loadCookies() {
  const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));
  console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);
  return cookies;
}

function loadStoryContent() {
  let content = fs.readFileSync(CONFIG.storyContentPath, 'utf8');
  const lines = content.split('\n');
  if (lines[0].startsWith('#')) {
    content = lines.slice(1).join('\n').trim();
  }
  console.log(`✅ 故事内容长度: ${content.length} 字符`);
  return content;
}

async function analyzeCategoryAndAgreement() {
  log('🚀 开始分析作品分类和发布协议的UI结构...\n', '\x1b[36m');

  let browser = null;

  try {
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    log('📍 启动浏览器...\n', '\x1b[36m');
    browser = await chromium.launch({
      headless: false,
      slowMo: 200
    });

    const page = await browser.newPage();
    await page.context().addCookies(loadCookies());

    // 访问发布页面
    log('📍 访问发布页面...\n', '\x1b[36m');
    await page.goto(CONFIG.publishUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 填写测试数据
    log('📍 填写测试数据...\n', '\x1b[36m');
    const title = '午夜电梯，全死光了';
    const content = loadStoryContent();

    const titleTextarea = page.locator('textarea.byte-textarea.serial-textarea');
    await titleTextarea.fill(title);

    const contentEditor = page.locator('div.ProseMirror.payNode-helper-content');
    await contentEditor.fill(content);
    await page.waitForTimeout(1000);

    // 点击"下一步"按钮
    log('📍 点击"下一步"按钮...\n', '\x1b[36m');
    const nextButton = page.locator('#app button:has-text("下一步").btn-primary-variant');
    await nextButton.click();

    // 等待页面更新
    log('⏳ 等待页面更新（10秒）...\n', '\x1b[36m');
    await page.waitForTimeout(10000);

    // 分析作品分类
    log('─'.repeat(80), '\x1b[36m');
    log('🔍 作品分类分析：\n', '\x1b[36m');

    const categoryInfo = await page.evaluate(() => {
      const results = {};

      // 查找包含"分类"的元素
      const categoryText = Array.from(document.querySelectorAll('*')).filter(el =>
        el.textContent && el.textContent.includes('分类')
      );

      results.categoryTextCount = categoryText.length;
      results.categoryElements = categoryText.slice(0, 5).map(el => ({
        tagName: el.tagName,
        className: el.className,
        textContent: el.textContent.substring(0, 100)
      }));

      // 查找所有下拉选择框
      const selects = Array.from(document.querySelectorAll('select'));
      results.selects = selects.map((select, index) => ({
        index,
        name: select.name,
        id: select.id,
        className: select.className,
        ariaLabel: select.getAttribute('aria-label'),
        optionCount: select.options.length,
        firstOption: select.options[0]?.text
      }));

      // 查找所有可点击的分类元素
      const clickableCategories = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return style.cursor === 'pointer' && el.textContent && el.textContent.includes('分类');
      });

      results.clickableCategories = clickableCategories.slice(0, 5).map(el => ({
        tagName: el.tagName,
        className: el.className,
        textContent: el.textContent.substring(0, 100)
      }));

      // 查找所有包含"灵异"、"悬疑"等关键词的元素
      const genreElements = Array.from(document.querySelectorAll('*')).filter(el =>
        el.textContent && (el.textContent.includes('灵异') || el.textContent.includes('悬疑'))
      );

      results.genreElements = genreElements.slice(0, 5).map(el => ({
        tagName: el.tagName,
        className: el.className,
        textContent: el.textContent.substring(0, 100)
      }));

      return results;
    });

    console.log(JSON.stringify(categoryInfo, null, 2));

    // 分析发布协议
    log('\n─'.repeat(80), '\x1b[36m');
    log('🔍 发布协议分析：\n', '\x1b[36m');

    const agreementInfo = await page.evaluate(() => {
      const results = {};

      // 查找包含"协议"的元素
      const agreementText = Array.from(document.querySelectorAll('*')).filter(el =>
        el.textContent && el.textContent.includes('协议')
      );

      results.agreementTextCount = agreementText.length;
      results.agreementElements = agreementText.slice(0, 10).map(el => ({
        tagName: el.tagName,
        className: el.className,
        textContent: el.textContent.substring(0, 100)
      }));

      // 查找所有 checkbox 和 radio button
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));

      results.checkboxes = checkboxes.map((checkbox, index) => ({
        index,
        name: checkbox.name,
        id: checkbox.id,
        className: checkbox.className,
        ariaLabel: checkbox.getAttribute('aria-label'),
        checked: checkbox.checked
      }));

      results.radios = radios.map((radio, index) => ({
        index,
        name: radio.name,
        id: radio.id,
        className: radio.className,
        ariaLabel: radio.getAttribute('aria-label'),
        checked: radio.checked
      }));

      // 查找所有可点击的协议元素（可能是自定义组件）
      const clickableAgreements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return style.cursor === 'pointer' && el.textContent && el.textContent.includes('协议');
      });

      results.clickableAgreements = clickableAgreements.slice(0, 10).map(el => ({
        tagName: el.tagName,
        className: el.className,
        textContent: el.textContent.substring(0, 100)
      }));

      return results;
    });

    console.log(JSON.stringify(agreementInfo, null, 2));

    // 截图
    const screenshotFile = path.join(CONFIG.outputDir, `category-agreement-analysis-${Date.now()}.png`);
    await page.screenshot({ path: screenshotFile, fullPage: true });
    log(`\n📸 截图已保存: ${screenshotFile}\n`, '\x1b[36m');

    // 保存分析结果
    const result = {
      timestamp: new Date().toISOString(),
      categoryInfo,
      agreementInfo
    };

    const resultFile = path.join(CONFIG.outputDir, `category-agreement-analysis-${Date.now()}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2), 'utf8');
    log(`📄 分析结果已保存: ${resultFile}\n`, '\x1b[36m');

    log('✅ 分析完成！\n', '\x1b[32m');

  } catch (error) {
    log('\n❌ 分析失败: ' + error.message + '\n', '\x1b[31m');
    console.error(error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      log('\n📍 浏览器已关闭\n', '\x1b[36m');
    }
  }
}

analyzeCategoryAndAgreement()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ 分析异常:', error);
    process.exit(1);
  });
