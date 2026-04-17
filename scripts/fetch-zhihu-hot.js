#!/usr/bin/env node

/**
 * fetch-zhihu-hot.js
 *
 * 获取知乎热榜技术话题
 *
 * 使用方法：
 *   node scripts/fetch-zhihu-hot.js [--limit 30]
 *
 * 输出：
 *   data/zhihu-hot-<timestamp>.json   ← 热榜数据
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const DEFAULT_LIMIT = 30;
const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const DATA_DIR = path.join(WORKSPACE_DIR, '知乎自动运营', 'data');
const ZHIHU_HOT_URL = 'https://www.zhihu.com/hot';

// 确保输出目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 技术相关关键词
const TECH_KEYWORDS = [
  'AI', '人工智能', '大模型', 'GPT', 'Claude', 'LLM',
  '编程', '代码', '算法', '架构', '后端', '前端',
  'OpenClaw', 'AIGC', '机器学习', '深度学习',
  'Python', 'JavaScript', 'Java', 'Go', 'Rust',
  'Docker', 'Kubernetes', 'Linux', '服务器',
  'Transformer', 'Diffusion', 'RAG', 'Agent',
  '微调', '部署', '推理', '优化', '性能',
  '开源', '框架', '库', '工具', '自动化',
  'Web3', '区块链', '加密', '安全', '隐私'
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isTechRelated(title) {
  if (!title) return false;
  const lowerTitle = title.toLowerCase();
  return TECH_KEYWORDS.some(keyword => lowerTitle.includes(keyword.toLowerCase()));
}

async function main() {
  console.log('🚀 获取知乎热榜');
  console.log('📍 目标：', ZHIHU_HOT_URL);

  const args = process.argv.slice(2);
  const limitArg = args.find(arg => arg.startsWith('--limit'));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) || DEFAULT_LIMIT : DEFAULT_LIMIT;

  console.log('📊 限制数量：', limit);

  // 使用临时上下文（避免持久化上下文冲突）
  const browser = await chromium.launch({
    headless: true,  // 使用无头模式
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('\n📍 访问知乎热榜...');
    await page.goto(ZHIHU_HOT_URL, { waitUntil: 'networkidle' });
    await sleep(3000);

    // 获取热榜数据
    console.log('\n🔍 提取热榜条目...');

    // 先检查页面标题和 URL
    const pageTitle = await page.title();
    const pageUrl = page.url();
    console.log('   页面标题:', pageTitle);
    console.log('   页面 URL:', pageUrl);

    // 检查是否有登录提示
    const isLoginPage = await page.locator('.sign-flow-modal').count() > 0;
    if (isLoginPage) {
      console.log('   ⚠️  检测到登录页面，可能需要登录');
    }

    // 检查页面元素数量
    const hotItemCount = await page.locator('.HotItem').count();
    const hotListItemCount = await page.locator('.HotListItem').count();
    const hotListItemV2Count = await page.locator('[data-zop-feedlist]').count();

    console.log('   .HotItem 数量:', hotItemCount);
    console.log('   .HotListItem 数量:', hotListItemCount);
    console.log('   [data-zop-feedlist] 数量:', hotListItemV2Count);

    // 保存页面 HTML 用于调试
    const debugHtmlPath = path.join(DATA_DIR, `zhihu-hot-debug-${timestamp}.html`);
    const pageHtml = await page.content();
    fs.writeFileSync(debugHtmlPath, pageHtml);
    console.log('   💾 调试 HTML 已保存:', debugHtmlPath);

    // 尝试不同的选择器
    let listItems;
    if (hotItemCount > 0) {
      listItems = await page.locator('.HotItem').all();
      console.log('   ✓ 使用 .HotItem 选择器');
    } else if (hotListItemCount > 0) {
      listItems = await page.locator('.HotListItem').all();
      console.log('   ✓ 使用 .HotListItem 选择器');
    } else if (hotListItemV2Count > 0) {
      listItems = await page.locator('[data-zop-feedlist] > div').all();
      console.log('   ✓ 使用 [data-zop-feedlist] 选择器');
    } else {
      console.log('   ⚠️  未找到热榜元素，尝试通用方法...');
      // 尝试查找所有包含"热度"的链接
      const hotLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/question/"]'));
        return links.map(link => ({
          href: link.href,
          text: link.textContent?.trim().substring(0, 100)
        })).slice(0, 30);
      });
      console.log('   找到', hotLinks.length, '个问题链接');
      listItems = await page.locator('a[href*="/question/"]').all();
    }

    const hotItems = await page.evaluate(() => {
      const items = [];
      const listItems = document.querySelectorAll('.HotItem');

      listItems.forEach((item, index) => {
        try {
          const titleElement = item.querySelector('.HotItem-title');
          const linkElement = item.querySelector('.HotItem-title a');
          const metricsElement = item.querySelector('.HotItem-metrics');
          const excerptElement = item.querySelector('.HotItem-excerpt');

          if (!titleElement) return;

          const title = titleElement.textContent?.trim() || '';
          const link = linkElement?.href || '';
          const metricsText = metricsElement?.textContent?.trim() || '';
          const excerpt = excerptElement?.textContent?.trim() || '';

          // 解析热度数值
          let hotScore = 0;
          const match = metricsText.match(/(\d+(\.\d+)?)(万|千万)?热度/);
          if (match) {
            hotScore = parseFloat(match[1]);
            if (match[3] === '万') hotScore *= 10000;
            if (match[3] === '千万') hotScore *= 10000000;
          }

          items.push({
            rank: index + 1,
            title: title,
            link: link,
            excerpt: excerpt,
            hotScore: hotScore,
            metricsText: metricsText
          });
        } catch (error) {
          console.warn('解析热词条目失败:', error.message);
        }
      });

      return items;
    });

    console.log('   ✓ 提取到', hotItems.length, '条热榜');

    // 过滤技术相关内容
    const techItems = hotItems.filter(item => isTechRelated(item.title) || isTechRelated(item.excerpt));
    console.log('   ✓ 其中技术相关：', techItems.length, '条');

    // 限制数量
    const finalItems = hotItems.slice(0, limit);
    const finalTechItems = techItems.slice(0, limit);

    // 保存完整热榜
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFilePath = path.join(DATA_DIR, `zhihu-hot-${timestamp}.json`);
    const techOutputFilePath = path.join(DATA_DIR, `zhihu-hot-tech-${timestamp}.json`);

    fs.writeFileSync(outputFilePath, JSON.stringify({
      timestamp: new Date().toISOString(),
      total: finalItems.length,
      techRelated: finalTechItems.length,
      items: finalItems
    }, null, 2), 'utf-8');

    console.log('\n💾 已保存完整热榜：');
    console.log('   ', outputFilePath);

    // 保存技术相关热榜
    fs.writeFileSync(techOutputFilePath, JSON.stringify({
      timestamp: new Date().toISOString(),
      total: finalTechItems.length,
      items: finalTechItems
    }, null, 2), 'utf-8');

    console.log('💾 已保存技术热榜：');
    console.log('   ', techOutputFilePath);

    // 输出技术相关热榜摘要
    console.log('\n📊 技术相关热榜（前', Math.min(10, finalTechItems.length), '条）：');
    console.log('─'.repeat(80));
    finalTechItems.slice(0, 10).forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`);
      console.log(`   热度：${item.hotScore.toLocaleString()} | ${item.metricsText}`);
      console.log(`   链接：${item.link}`);
      if (item.excerpt) {
        console.log(`   摘要：${item.excerpt.substring(0, 100)}...`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await browser.close();
    console.log('\n✅ 完成');
  }
}

main().catch(console.error);
