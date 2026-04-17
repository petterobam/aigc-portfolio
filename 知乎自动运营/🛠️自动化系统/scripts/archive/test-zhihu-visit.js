#!/usr/bin/env node

/**
 * 知乎访问测试脚本
 * 简单测试 Playwright 是否能正常访问知乎页面
 */

const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../data/answer-data');

async function main() {
  console.log('========================================');
  console.log('  知乎访问测试');
  console.log('========================================\n');

  const browser = await playwright.chromium.launch({
    headless: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const url = 'https://www.zhihu.com/question/434962982/answer/1620538220';
    console.log(`📍 正在访问: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle' });

    console.log('✅ 页面加载成功');

    // 获取页面标题
    const title = await page.title();
    console.log(`📋 页面标题: ${title}`);

    // 获取页面 URL
    const currentUrl = page.url();
    console.log(`🔗 当前 URL: ${currentUrl}`);

    // 截图
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotFile = path.join(OUTPUT_DIR, `test-screenshot-${timestamp}.png`);
    await page.screenshot({ path: screenshotFile, fullPage: false });
    console.log(`📸 截图已保存: ${screenshotFile}`);

    // 简单提取一些数据
    const questionTitle = await page.$eval('.QuestionHeader-title', el => el.textContent).catch(() => null);
    if (questionTitle) {
      console.log(`📝 问题标题: ${questionTitle.trim()}`);
    }

    console.log('\n✅ 测试完成');

  } catch (error) {
    console.error('❌ 发生错误:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
