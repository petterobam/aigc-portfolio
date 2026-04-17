#!/usr/bin/env node
/**
 * fetch-zhihu-hot-topics.js
 *
 * 采集知乎热榜话题
 *
 * 功能：
 *   1. 尝试加载 Cookie（如果有）
 *   2. 访问知乎热榜
 *   3. 提取热门话题列表
 *   4. 保存到 JSON 文件
 *
 * 使用方法：
 *   node scripts/fetch-zhihu-hot-topics.js [--cookie-file cookies/zhihu-latest.json]
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const ZHIHU_HOT_URL = 'https://www.zhihu.com/hot';
const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const DATA_DIR = path.join(WORKSPACE_DIR, '知乎自动运营', 'data');
const OUTPUT_DIR = path.join(DATA_DIR, 'hot-topics');

/**
 * 加载 Cookie
 */
async function loadCookies(context, cookieFile) {
  if (!cookieFile || !fs.existsSync(cookieFile)) {
    console.log('⚠️  Cookie 文件不存在，将使用无 Cookie 访问');
    return false;
  }

  try {
    const cookies = JSON.parse(fs.readFileSync(cookieFile, 'utf8'));
    await context.addCookies(cookies);
    console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);

    // 检查关键 Cookie
    const hasDc0 = cookies.some(c => c.name === 'd_c0' && c.value);
    const hasZc0 = cookies.some(c => c.name === 'z_c0' && c.value);

    if (hasDc0 && hasZc0) {
      console.log('✅ 关键 Cookie 检查通过');
      return true;
    } else {
      console.warn('⚠️  缺少关键 Cookie (d_c0, z_c0)');
      return false;
    }
  } catch (error) {
    console.error('❌ 加载 Cookie 失败:', error.message);
    return false;
  }
}

/**
 * 提取热榜话题
 */
async function extractHotTopics(page) {
  try {
    console.log('📊 正在提取热榜话题...');

    // 等待热榜列表加载
    await page.waitForSelector('.HotItem, [data-zhe-list]', { timeout: 10000 });

    // 提取话题列表
    const topics = await page.evaluate(() => {
      const items = document.querySelectorAll('.HotItem');

      return Array.from(items).slice(0, 50).map((item, index) => {
        const titleElement = item.querySelector('.HotItem-title, h2');
        const linkElement = item.querySelector('a');
        const excerptElement = item.querySelector('.HotItem-excerpt, .HotItem-content');
        const metricsElement = item.querySelector('.HotItem-metrics');
        const badgeElement = item.querySelector('.HotItem-badge');

        return {
          rank: index + 1,
          title: titleElement?.textContent?.trim() || '',
          url: linkElement?.href || '',
          excerpt: excerptElement?.textContent?.trim() || '',
          metrics: metricsElement?.textContent?.trim() || '',
          badge: badgeElement?.textContent?.trim() || '',
        };
      });
    });

    console.log(`✅ 提取了 ${topics.length} 个话题`);
    return topics;
  } catch (error) {
    console.error('❌ 提取话题失败:', error.message);

    // 尝试另一种选择器
    console.log('🔄 尝试备用选择器...');
    try {
      await page.waitForTimeout(2000);

      const topics = await page.evaluate(() => {
        const items = document.querySelectorAll('[data-zhe-list] > div, .List-item');

        return Array.from(items).slice(0, 50).map((item, index) => {
          const titleElement = item.querySelector('h2, .ContentItem-title, a');
          const linkElement = item.querySelector('a');
          const excerptElement = item.querySelector('.ContentItem-excerpt, .RichContent');

          return {
            rank: index + 1,
            title: titleElement?.textContent?.trim() || '',
            url: linkElement?.href || '',
            excerpt: excerptElement?.textContent?.trim() || '',
            metrics: '',
            badge: '',
          };
        });
      });

      console.log(`✅ 备用选择器提取了 ${topics.length} 个话题`);
      return topics;
    } catch (error2) {
      console.error('❌ 备用选择器也失败:', error2.message);
      return [];
    }
  }
}

/**
 * 保存话题数据
 */
function saveTopics(topics) {
  try {
    // 确保输出目录存在
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `zhihu-hot-topics-${timestamp}.json`;
    const filepath = path.join(OUTPUT_DIR, filename);

    // 保存数据
    fs.writeFileSync(filepath, JSON.stringify(topics, null, 2));

    console.log(`\n💾 已保存：${filepath}`);
    console.log(`   共 ${topics.length} 个话题`);

    return filepath;
  } catch (error) {
    console.error('❌ 保存失败:', error.message);
    return null;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('═'.repeat(60));
  console.log('  知乎热榜采集器');
  console.log('═'.repeat(60));
  console.log('');

  // 解析参数
  const args = process.argv.slice(2);
  let cookieFile = null;
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--cookie-file' || args[i] === '-c') && args[i + 1]) {
      cookieFile = args[++i];
    }
  }

  // 默认 Cookie 文件
  if (!cookieFile) {
    cookieFile = path.join(WORKSPACE_DIR, 'cookies', 'zhihu-latest.json');
  }

  let browser;
  let page;

  try {
    // 启动浏览器
    console.log('🌐 正在启动浏览器...');
    browser = await chromium.launch({
      headless: true, // 无头模式
      channel: 'chrome',
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    page = await context.newPage();
    console.log('✅ 浏览器已启动\n');

    // 加载 Cookie
    const cookieLoaded = await loadCookies(context, cookieFile);
    if (!cookieLoaded) {
      console.log('⚠️  无 Cookie 或 Cookie 失效，可能会受到访问限制\n');
    }

    // 访问知乎热榜
    console.log(`📄 正在访问知乎热榜：${ZHIHU_HOT_URL}`);
    await page.goto(ZHIHU_HOT_URL, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ 页面加载完成\n');

    // 检查是否被重定向到登录页
    const currentUrl = page.url();
    if (currentUrl.includes('signin') || currentUrl.includes('login')) {
      console.error('❌ 被重定向到登录页');
      console.error('   知乎对未登录用户有访问限制');
      console.error(`   请配置 Cookie：${cookieFile}`);
      console.error('');
      console.error('💡 配置方法：');
      console.error('   1. 在 Chrome 中登录知乎');
      console.error('   2. 运行：node scripts/extract-zhihu-cookies-playwright.js');
      console.error('   3. 重新运行此脚本');
      await browser.close();
      process.exit(1);
    }

    // 提取话题
    const topics = await extractHotTopics(page);

    if (topics.length === 0) {
      console.error('❌ 未能提取到任何话题');
      console.error('   可能的原因：');
      console.error('   - 页面结构变化');
      console.error('   - Cookie 失效');
      console.error('   - 访问限制');
      await browser.close();
      process.exit(1);
    }

    // 保存数据
    const savedFile = saveTopics(topics);

    if (savedFile) {
      console.log('\n✅ 采集完成！');

      // 显示前 5 个话题
      console.log('\n📋 前 5 个热门话题：');
      topics.slice(0, 5).forEach((topic, index) => {
        console.log(`\n${index + 1}. ${topic.title}`);
        if (topic.excerpt) {
          console.log(`   ${topic.excerpt.substring(0, 50)}...`);
        }
        if (topic.metrics) {
          console.log(`   ${topic.metrics}`);
        }
      });
    } else {
      console.error('\n❌ 保存失败');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ 发生错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // 关闭浏览器
    if (browser) {
      await browser.close();
      console.log('\n✅ 浏览器已关闭');
    }
  }
}

// 运行主函数
main().catch(err => {
  console.error(err);
  process.exit(1);
});
