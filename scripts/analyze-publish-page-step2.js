#!/usr/bin/env node

/**
 * 分析发布流程第二页结构
 * 用于验证封面、标签、简介等字段
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  cookieFile: path.join(__dirname, '..', 'cookies', 'latest.json'),
  writerDashboardUrl: 'https://fanqienovel.com/main/writer/short-manage',
  publishUrl: 'https://fanqienovel.com/main/writer/publish-short/?enter_from=NEWCHAPTER_1',
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

async function analyzePublishPageStep2() {
  console.log('🚀 启动发布流程第二页分析...\n');

  let browser = null;

  try {
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    console.log('📍 启动浏览器...');
    browser = await chromium.launch({
      headless: false,
      slowMo: 200
    });

    const page = await browser.newPage();
    await page.context().addCookies(loadCookies());

    // 访问作家后台
    console.log('📍 访问作家后台...');
    await page.goto(CONFIG.writerDashboardUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 点击"新建短故事"按钮
    console.log('📍 点击"新建短故事"按钮...');
    const newStoryButton = page.locator('button:has-text("新建短故事")');
    await newStoryButton.click();
    await page.waitForTimeout(3000);

    // 直接访问发布页面
    console.log('📍 访问发布页面...');
    await page.goto(CONFIG.publishUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 填写测试数据
    console.log('📍 填写测试数据...');
    const title = '测试标题 - 自动化发布';
    const content = '这是测试正文内容。';

    const titleTextarea = page.locator('textarea.byte-textarea.serial-textarea');
    await titleTextarea.fill(title);

    const contentEditor = page.locator('div.ProseMirror.payNode-helper-content');
    await contentEditor.fill(content);
    await page.waitForTimeout(1000);

    // 点击"下一步"按钮（使用更精确的选择器）
    console.log('📍 点击"下一步"按钮...');
    const nextButton = page.locator('#app button:has-text("下一步").btn-primary-variant');
    await nextButton.click();

    // 等待页面更新（单页应用可能需要更长时间）
    console.log('⏳ 等待页面更新（10秒）...');
    await page.waitForTimeout(10000);

    console.log('\n📊 第二页页面分析：');
    console.log('─'.repeat(80));

    const pageInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyText: document.body.innerText.substring(0, 800)
      };
    });

    console.log(`URL: ${pageInfo.url}`);
    console.log(`标题: ${pageInfo.title}`);
    console.log(`页面文本（前800字）:\n${pageInfo.bodyText}\n`);

    // 查找所有输入字段
    console.log('─'.repeat(80));
    console.log('🔍 所有输入字段：\n');

    const inputs = await page.$$eval('input', inputs => {
      return inputs.map((input, index) => {
        return {
          index,
          type: input.type,
          name: input.name,
          id: input.id,
          className: input.className,
          placeholder: input.placeholder,
          ariaLabel: input.getAttribute('aria-label'),
          ariaDescribedby: input.getAttribute('aria-describedby')
        };
      });
    });

    inputs.forEach((input, i) => {
      console.log(`  ${i + 1}. type="${input.type}"`);
      console.log(`     name: ${input.name || 'N/A'}`);
      console.log(`     id: ${input.id || 'N/A'}`);
      console.log(`     className: ${input.className.substring(0, 100)}`);
      console.log(`     placeholder: ${input.placeholder || 'N/A'}`);
      console.log(`     ariaLabel: ${input.ariaLabel || 'N/A'}`);
      console.log('');
    });

    // 查找所有文本域
    console.log('─'.repeat(80));
    console.log('🔍 所有文本域：\n');

    const textareas = await page.$$eval('textarea', textareas => {
      return textareas.map((textarea, index) => {
        return {
          index,
          name: textarea.name,
          id: textarea.id,
          className: textarea.className,
          placeholder: textarea.placeholder,
          ariaLabel: textarea.getAttribute('aria-label')
        };
      });
    });

    textareas.forEach((textarea, i) => {
      console.log(`  ${i + 1}. className: ${textarea.className.substring(0, 100)}`);
      console.log(`     placeholder: ${textarea.placeholder || 'N/A'}`);
      console.log(`     ariaLabel: ${textarea.ariaLabel || 'N/A'}`);
      console.log('');
    });

    // 查找所有按钮
    console.log('─'.repeat(80));
    console.log('🔍 所有按钮：\n');

    const buttons = await page.$$eval('button', buttons => {
      return buttons.map((button, index) => {
        return {
          index,
          text: button.textContent.trim(),
          className: button.className,
          id: button.id,
          disabled: button.disabled
        };
      });
    });

    buttons.forEach((button, i) => {
      if (button.text) {
        console.log(`  ${i + 1}. "${button.text}"`);
        console.log(`     className: ${button.className.substring(0, 100)}`);
        console.log(`     disabled: ${button.disabled}`);
        console.log('');
      }
    });

    // 查找封面相关元素
    console.log('─'.repeat(80));
    console.log('🔍 封面相关元素：\n');

    const coverElements = await page.evaluate(() => {
      const results = [];

      // 查找文件上传输入框
      document.querySelectorAll('input[type="file"]').forEach((input, index) => {
        const accept = input.accept || '';
        const ariaLabel = input.getAttribute('aria-label') || '';
        const ariaDescribedby = input.getAttribute('aria-describedby') || '';

        results.push({
          index,
          type: 'file-input',
          accept,
          ariaLabel,
          ariaDescribedby,
          className: input.className
        });
      });

      // 查找包含"封面"的文本元素
      const allText = document.body.innerText;
      if (allText.includes('封面')) {
        results.push({
          type: 'has-cover-text',
          found: true
        });
      }

      return results;
    });

    coverElements.forEach((element, i) => {
      console.log(`  ${i + 1}. ${element.type}`);
      console.log(`     accept: ${element.accept || 'N/A'}`);
      console.log(`     ariaLabel: ${element.ariaLabel || 'N/A'}`);
      console.log(`     className: ${element.className || 'N/A'}`);
      console.log('');
    });

    // 截图
    const screenshotFile = path.join(CONFIG.outputDir, `publish-step2-analysis-${Date.now()}.png`);
    await page.screenshot({ path: screenshotFile, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotFile}`);

    // 保存分析结果
    const result = {
      timestamp: new Date().toISOString(),
      pageInfo,
      inputs,
      textareas,
      buttons: buttons.filter(b => b.text),
      coverElements
    };

    const resultFile = path.join(CONFIG.outputDir, `publish-step2-analysis-${Date.now()}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2), 'utf8');
    console.log(`\n📄 分析结果已保存: ${resultFile}`);

    console.log('\n✅ 分析完成！');

  } catch (error) {
    console.error('\n❌ 分析失败:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n📍 浏览器已关闭');
    }
  }
}

analyzePublishPageStep2()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ 分析异常:', error);
    process.exit(1);
  });
