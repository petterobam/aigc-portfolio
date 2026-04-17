#!/usr/bin/env node

/**
 * 调试 arXiv 页面结构
 * 检查选择器是否正确
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function debugArxiv() {
  console.log('启动浏览器...');
  const browser = await chromium.launch({
    headless: false // 显示浏览器，方便观察
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('访问 arXiv AI 论文列表...');
  await page.goto('https://arxiv.org/list/cs.AI/recent', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  // 等待页面加载
  console.log('等待页面加载...');
  await page.waitForTimeout(5000);

  // 检查页面标题
  const title = await page.title();
  console.log('页面标题:', title);

  // 检查页面 URL
  console.log('当前 URL:', page.url());

  // 尝试不同的选择器
  console.log('\n=== 测试选择器 ===\n');

  // 测试1: .list-identifier
  console.log('测试1: .list-identifier');
  const listIdentifier = await page.$$eval('.list-identifier', elements => {
    return elements.map(el => {
      const titleEl = el.querySelector('.list-title');
      const authorsEl = el.querySelector('.list-authors');
      return {
        hasTitle: !!titleEl,
        hasAuthors: !!authorsEl,
        title: titleEl ? titleEl.textContent.substring(0, 100) : null,
        authors: authorsEl ? authorsEl.textContent.substring(0, 100) : null
      };
    }).slice(0, 3);
  });
  console.log('结果:', JSON.stringify(listIdentifier, null, 2));

  // 测试2: dt (定义列表项)
  console.log('\n测试2: dt');
  const dtElements = await page.$$eval('dt', elements => {
    return elements.map(el => ({
      text: el.textContent.substring(0, 100),
      links: Array.from(el.querySelectorAll('a')).map(a => a.href)
    })).slice(0, 3);
  });
  console.log('结果:', JSON.stringify(dtElements, null, 2));

  // 测试3: dd (定义列表描述)
  console.log('\n测试3: dd');
  const ddElements = await page.$$eval('dd', elements => {
    return elements.map(el => {
      const titleEl = el.querySelector('.list-title');
      const authorsEl = el.querySelector('.list-authors');
      return {
        text: el.textContent.substring(0, 200),
        hasTitle: !!titleEl,
        hasAuthors: !!authorsEl,
        title: titleEl ? titleEl.textContent.substring(0, 100) : null
      };
    }).slice(0, 3);
  });
  console.log('结果:', JSON.stringify(ddElements, null, 2));

  // 截图保存
  const screenshotPath = path.join(__dirname, '../data/arxiv-debug.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`\n截图已保存: ${screenshotPath}`);

  // 保存页面 HTML
  const htmlPath = path.join(__dirname, '../data/arxiv-debug.html');
  const html = await page.content();
  await fs.writeFile(htmlPath, html, 'utf-8');
  console.log(`HTML已保存: ${htmlPath}`);

  // 等待一段时间观察页面
  console.log('\n等待 10 秒观察页面...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('浏览器已关闭');
}

debugArxiv().catch(console.error);
