#!/usr/bin/env node

/**
 * 测试 Playwright 文件保存功能
 */

const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../../data/answer-data');

async function main() {
  console.log('========================================');
  console.log('  Playwright 文件保存测试');
  console.log('========================================\n');

  console.log(`📁 输出目录: ${OUTPUT_DIR}`);

  // 确保目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log('✅ 创建输出目录');
  } else {
    console.log('✅ 输出目录已存在');
  }

  // 测试文件写入
  const testFile = path.join(OUTPUT_DIR, 'test-write.txt');
  fs.writeFileSync(testFile, '测试文件写入功能\n');
  console.log(`✅ 测试文件写入: ${testFile}`);

  // 启动 Playwright
  console.log('\n🚀 启动 Playwright...');
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 访问一个简单的页面
    console.log('📍 访问知乎...');
    await page.goto('https://www.zhihu.com', { waitUntil: 'domcontentloaded' });
    console.log('✅ 页面加载成功');

    // 测试截图
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotFile = path.join(OUTPUT_DIR, `test-playwright-${timestamp}.png`);
    await page.screenshot({ path: screenshotFile });
    console.log(`✅ 截图保存: ${screenshotFile}`);

    // 测试 evaluate
    const title = await page.evaluate(() => document.title);
    console.log(`📋 页面标题: ${title}`);

    // 测试保存 HTML
    const htmlFile = path.join(OUTPUT_DIR, `test-html-${timestamp}.html`);
    const htmlContent = await page.content();
    fs.writeFileSync(htmlFile, htmlContent);
    console.log(`✅ HTML 保存: ${htmlFile}`);

    // 测试保存 JSON
    const jsonFile = path.join(OUTPUT_DIR, `test-json-${timestamp}.json`);
    const jsonData = {
      timestamp: timestamp,
      title: title,
      url: page.url()
    };
    fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2));
    console.log(`✅ JSON 保存: ${jsonFile}`);

    console.log('\n✅ 所有测试通过！');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
