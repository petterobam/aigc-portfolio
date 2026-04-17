#!/usr/bin/env node

/**
 * test-zhihu-hot-v2.js
 *
 * 测试访问知乎热榜页面（不需要登录） - 改进版
 * 添加更多调试信息和选择器尝试
 *
 * 使用方法：
 *   node scripts/test-zhihu-hot-v2.js
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
  console.log('  测试访问知乎热榜 v2');
  console.log('═'.repeat(60));
  console.log('');

  // 启动浏览器
  console.log('🌐 正在启动 Chrome...');
  const browser = await chromium.launch({
    headless: true,
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

    // 等待页面完全加载
    await page.waitForTimeout(3000);

    // 保存页面 HTML
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const htmlFile = path.join(DATA_DIR, `hot-page-${timestamp}.html`);
    const pageHtml = await page.content();
    fs.writeFileSync(htmlFile, pageHtml, 'utf8');
    console.log(`💾 页面 HTML 已保存到: ${htmlFile}`);
    console.log('');

    // 尝试不同的选择器
    console.log('🔍 正在测试选择器...');
    console.log('');

    // 选择器 1: .HotItem
    const selector1 = '.HotItem';
    const count1 = await page.locator(selector1).count();
    console.log(`选择器 "${selector1}": ${count1} 个元素`);

    // 选择器 2: [data-zop-feedlist]
    const selector2 = '[data-zop-feedlist]';
    const count2 = await page.locator(selector2).count();
    console.log(`选择器 "${selector2}": ${count2} 个元素`);

    // 选择器 3: .HotList-item
    const selector3 = '.HotList-item';
    const count3 = await page.locator(selector3).count();
    console.log(`选择器 "${selector3}": ${count3} 个元素`);

    // 选择器 4: .List-item
    const selector4 = '.List-item';
    const count4 = await page.locator(selector4).count();
    console.log(`选择器 "${selector4}": ${count4} 个元素`);

    console.log('');

    // 尝试找到实际的选择器
    let hotData = [];
    let workingSelector = '';

    if (count1 > 0) {
      workingSelector = selector1;
      console.log(`✅ 使用选择器: ${selector1}`);
    } else if (count3 > 0) {
      workingSelector = selector3;
      console.log(`✅ 使用选择器: ${selector3}`);
    } else if (count4 > 0) {
      workingSelector = selector4;
      console.log(`✅ 使用选择器: ${selector4}`);
    } else {
      console.warn('⚠️  未找到匹配的选择器，尝试其他方法...');

      // 尝试查找所有链接
      const links = await page.locator('a[href*="/question/"]').all();
      console.log(`   找到 ${links.length} 个问题链接`);

      // 提取前 10 个链接
      for (let i = 0; i < Math.min(10, links.length); i++) {
        const link = links[i];
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        if (text && href) {
          hotData.push({
            rank: i + 1,
            title: text.trim(),
            url: href.startsWith('http') ? href : `https://www.zhihu.com${href}`,
            excerpt: '',
            metrics: '',
          });
        }
      }
    }

    if (workingSelector && !hotData.length) {
      // 使用找到的选择器提取数据
      hotData = await page.evaluate((selector) => {
        const items = [];
        const elements = document.querySelectorAll(selector);

        elements.forEach((item, index) => {
          if (index >= 50) return; // 最多提取 50 个

          const titleEl = item.querySelector('.HotItem-title') ||
                         item.querySelector('.ContentItem-title') ||
                         item.querySelector('h2') ||
                         item.querySelector('h3');
          const linkEl = item.querySelector('a');
          const excerptEl = item.querySelector('.HotItem-excerpt') ||
                            item.querySelector('.RichContent-inner') ||
                            item.querySelector('.RichContent');
          const metricsEl = item.querySelector('.HotItem-metrics') ||
                            item.querySelector('.ContentItem-actions');

          let title = '';
          if (titleEl) {
            title = titleEl.textContent.trim();
          } else if (linkEl) {
            title = linkEl.textContent.trim();
          }

          let url = '';
          if (linkEl) {
            url = linkEl.href;
          }

          let excerpt = '';
          if (excerptEl) {
            excerpt = excerptEl.textContent.trim();
          }

          let metrics = '';
          if (metricsEl) {
            metrics = metricsEl.textContent.trim();
          }

          if (title) {
            items.push({
              rank: index + 1,
              title: title,
              url: url,
              excerpt: excerpt,
              metrics: metrics,
            });
          }
        });

        return items;
      }, workingSelector);
    }

    console.log(`✅ 提取到 ${hotData.length} 个热榜话题`);
    console.log('');

    // 显示热榜话题
    if (hotData.length > 0) {
      console.log('📋 热榜前 10：');
      console.log('');
      hotData.slice(0, 10).forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        if (item.url) {
          console.log(`   ${item.url}`);
        }
        if (item.metrics) {
          console.log(`   ${item.metrics}`);
        }
        if (item.excerpt) {
          console.log(`   摘要: ${item.excerpt.substring(0, 100)}...`);
        }
        console.log('');
      });

      // 保存数据
      ensureDir(DATA_DIR);
      const outputFile = path.join(DATA_DIR, `hot-topics-${timestamp}.json`);

      fs.writeFileSync(outputFile, JSON.stringify(hotData, null, 2), 'utf8');
      fs.writeFileSync(HOT_DATA_FILE, JSON.stringify(hotData, null, 2), 'utf8');

      console.log(`💾 数据已保存到: ${outputFile}`);
      console.log(`💾 最新副本已保存到: ${HOT_DATA_FILE}`);

      // 截图
      const screenshotFile = path.join(DATA_DIR, `hot-topics-${timestamp}.png`);
      await page.screenshot({ path: screenshotFile, fullPage: true });
      console.log(`📸 截图已保存到: ${screenshotFile}`);
    } else {
      console.warn('⚠️  未能提取到热榜数据');
      console.warn('');
      console.warn('💡 可能的原因：');
      console.warn('   1. 知乎页面结构发生变化');
      console.warn('   2. 需要登录才能查看热榜');
      console.warn('   3. 页面加载未完成');
      console.warn('');
      console.warn('💡 下一步：');
      console.warn('   1. 查看 HTML 文件了解页面结构');
      console.warn('   2. 更新选择器');
      console.warn('   3. 尝试登录后提取');
    }

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
