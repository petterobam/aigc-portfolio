#!/usr/bin/env node

/**
 * debug-zhihu-hot.js
 *
 * 调试知乎热榜页面结构
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const DATA_DIR = path.join(WORKSPACE_DIR, '知乎自动运营', 'data');
const ZHIHU_HOT_URL = 'https://www.zhihu.com/hot';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function main() {
  console.log('🔍 调试知乎热榜页面结构');
  console.log('📍 目标：', ZHIHU_HOT_URL);

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('\n📍 访问知乎热榜...');
    await page.goto(ZHIHU_HOT_URL, { waitUntil: 'networkidle' });

    // 获取页面基本信息
    const pageTitle = await page.title();
    const pageUrl = page.url();

    console.log('\n📊 页面基本信息:');
    console.log('   标题:', pageTitle);
    console.log('   URL:', pageUrl);

    // 检查各种热榜相关的选择器
    console.log('\n🔍 检查页面元素:');

    const selectors = [
      '.HotItem',
      '.HotListItem',
      '[data-zop-feedlist]',
      '.HotList-item',
      '.HotItem-title',
      '.HotItem-metrics'
    ];

    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      console.log('   ', selector.padEnd(30), ':', count);
    }

    // 保存页面 HTML
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const htmlPath = path.join(DATA_DIR, `zhihu-hot-debug-${timestamp}.html`);
    const html = await page.content();
    fs.writeFileSync(htmlPath, html);

    console.log('\n💾 页面 HTML 已保存:');
    console.log('   ', htmlPath);

    // 尝试查找问题链接
    const questionLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/question/"]'));
      return links.slice(0, 20).map(link => ({
        href: link.href,
        text: link.textContent?.trim().substring(0, 80)
      }));
    });

    console.log('\n📝 找到的问题链接（前20个）:');
    questionLinks.forEach((link, index) => {
      console.log(`   ${index + 1}. ${link.text}`);
      console.log(`      ${link.href}`);
    });

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('\n✅ 完成');
  }
}

main().catch(console.error);
