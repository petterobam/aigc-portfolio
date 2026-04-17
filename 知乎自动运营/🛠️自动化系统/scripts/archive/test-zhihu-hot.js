#!/usr/bin/env node

/**
 * test-zhihu-hot.js
 *
 * 测试访问知乎热榜页面（不需要登录）
 *
 * 使用方法：
 *   node scripts/test-zhihu-hot.js
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const WORKSPACE_DIR    = path.join(process.env.HOME, '.openclaw/workspace/知乎自动运营');
const DATA_DIR         = path.join(WORKSPACE_DIR, '🛠️自动化系统/data');
const HOT_DATA_FILE    = path.join(DATA_DIR, 'hot-topics-test.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  测试访问知乎热榜');
  console.log('═'.repeat(60));
  console.log('');

  // 启动浏览器
  console.log('🌐 正在启动 Chrome...');
  const browser = await chromium.launch({
    headless: true,  // 无头模式
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  });

  const page = await context.newPage();

  try {
    // 导航到知乎热榜
    console.log('🔥 正在访问知乎热榜...');
    await page.goto('https://www.zhihu.com/hot', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('✅ 页面加载成功');
    console.log('');

    // 提取热榜数据
    console.log('📊 正在提取热榜数据...');
    const hotData = await page.evaluate(() => {
      const items = [];
      const hotList = document.querySelectorAll('.HotItem');

      hotList.forEach((item, index) => {
        const titleEl = item.querySelector('.HotItem-title');
        const linkEl = item.querySelector('a');
        const excerptEl = item.querySelector('.HotItem-excerpt');
        const metricsEl = item.querySelector('.HotItem-metrics');

        items.push({
          rank: index + 1,
          title: titleEl ? titleEl.textContent.trim() : '',
          url: linkEl ? linkEl.href : '',
          excerpt: excerptEl ? excerptEl.textContent.trim() : '',
          metrics: metricsEl ? metricsEl.textContent.trim() : '',
        });
      });

      return items;
    });

    console.log(`✅ 提取到 ${hotData.length} 个热榜话题`);

    // 显示前 10 个热榜话题
    console.log('');
    console.log('📋 热榜前 10：');
    console.log('');
    hotData.slice(0, 10).forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`);
      console.log(`   ${item.metrics}`);
      if (item.excerpt) {
        console.log(`   摘要: ${item.excerpt.substring(0, 100)}...`);
      }
      console.log('');
    });

    // 保存数据
    ensureDir(DATA_DIR);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(DATA_DIR, `hot-topics-${timestamp}.json`);

    fs.writeFileSync(outputFile, JSON.stringify(hotData, null, 2), 'utf8');
    fs.writeFileSync(HOT_DATA_FILE, JSON.stringify(hotData, null, 2), 'utf8');

    console.log(`💾 数据已保存到: ${outputFile}`);
    console.log(`💾 最新副本已保存到: ${HOT_DATA_FILE}`);

    // 截图
    const screenshotFile = path.join(DATA_DIR, `hot-topics-${timestamp}.png`);
    await page.screenshot({ path: screenshotFile, fullPage: true });
    console.log(`📸 截图已保存到: ${screenshotFile}`);

  } catch (error) {
    console.error('❌ 发生错误:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('');
    console.log('✅ 测试完成');
  }
}

main().catch(err => {
  console.error('❌ 发生错误:', err);
  console.error(err.stack);
  process.exit(1);
});
