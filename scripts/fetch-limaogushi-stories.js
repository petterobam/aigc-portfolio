/**
 * 抓取狸猫故事网民间故事榜单
 * 用途：学习优秀短故事的开篇套路和情节元素
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 输出目录
const OUTPUT_DIR = path.join(__dirname, '..', '番茄短篇故事集', 'analysis');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'limaogushi-stories.json');

// 目标 URL
const TARGET_URL = 'https://www.limaogushi.com/rank/minjian';

/**
 * 等待指定毫秒
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 抓取故事列表
 */
async function fetchStories() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  console.log(`正在访问: ${TARGET_URL}`);
  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });

  // 等待页面加载
  await sleep(3000);

  // 尝试多个选择器
  const selectors = [
    'div.story-item',
    'div.list-item',
    'li.story',
    'article',
    'div.story-list > div',
    'div.rank-list > div',
    'ul li',
    'div.content-item'
  ];

  let stories = [];

  for (const selector of selectors) {
    console.log(`尝试选择器: ${selector}`);
    const elements = await page.locator(selector).all();

    if (elements.length > 0) {
      console.log(`找到 ${elements.length} 个元素，使用选择器: ${selector}`);

      for (const element of elements) {
        try {
          const title = await element.locator('a, h3, h2, h4, .title, .name').first().textContent().catch(() => '');
          const link = await element.locator('a').first().getAttribute('href').catch(() => '');
          const author = await element.locator('.author, .writer').first().textContent().catch(() => '');
          const desc = await element.locator('.desc, .intro, .summary, p').first().textContent().catch(() => '');
          const views = await element.locator('.views, .read, .num, .count').first().textContent().catch(() => '');

          // 清理文本
          const cleanTitle = title ? title.trim().replace(/\s+/g, ' ') : '';
          const cleanAuthor = author ? author.trim().replace(/\s+/g, ' ') : '';
          const cleanDesc = desc ? desc.trim().replace(/\s+/g, ' ').substring(0, 200) : '';
          const cleanViews = views ? views.trim().replace(/\s+/g, ' ') : '';

          if (cleanTitle) {
            stories.push({
              title: cleanTitle,
              link: link ? (link.startsWith('http') ? link : `https://www.limaogushi.com${link}`) : '',
              author: cleanAuthor,
              description: cleanDesc,
              views: cleanViews,
              source: 'limaogushi',
              category: '民间故事',
              fetchedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          // 忽略单个元素的错误
        }
      }

      if (stories.length > 0) {
        break;
      }
    }
  }

  // 如果还是没有找到，尝试获取所有链接
  if (stories.length === 0) {
    console.log('未找到故事元素，尝试获取所有链接...');
    const links = await page.locator('a[href]').all();
    console.log(`找到 ${links.length} 个链接`);

    for (const link of links) {
      try {
        const text = await link.textContent();
        const href = await link.getAttribute('href');

        if (text && href && text.length > 2 && text.length < 50 && href.includes('/story/')) {
          stories.push({
            title: text.trim(),
            link: href.startsWith('http') ? href : `https://www.limaogushi.com${href}`,
            author: '',
            description: '',
            views: '',
            source: 'limaogushi',
            category: '民间故事',
            fetchedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        // 忽略错误
      }
    }
  }

  await browser.close();

  return stories;
}

/**
 * 保存结果到文件
 */
function saveStories(stories) {
  // 确保输出目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 保存为 JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stories, null, 2), 'utf-8');
  console.log(`\n结果已保存到: ${OUTPUT_FILE}`);

  // 保存为 Markdown 报告
  const reportPath = path.join(OUTPUT_DIR, 'limaogushi-stories-report.md');
  const reportContent = generateReport(stories);
  fs.writeFileSync(reportPath, reportContent, 'utf-8');
  console.log(`报告已保存到: ${reportPath}`);
}

/**
 * 生成 Markdown 报告
 */
function generateReport(stories) {
  const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  let content = `# 狸猫故事网民间故事榜单分析\n\n`;
  content += `**抓取时间**: ${timestamp}\n`;
  content += `**数据来源**: ${TARGET_URL}\n`;
  content += `**故事数量**: ${stories.length}\n\n`;

  content += `## 故事列表\n\n`;

  stories.forEach((story, index) => {
    content += `### ${index + 1}. ${story.title}\n\n`;
    if (story.author) content += `- **作者**: ${story.author}\n`;
    if (story.views) content += `- **阅读量**: ${story.views}\n`;
    if (story.link) content += `- **链接**: [查看原文](${story.link})\n`;
    if (story.description) content += `- **简介**: ${story.description}\n`;
    content += `\n`;
  });

  return content;
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 狸猫故事网民间故事榜单抓取 ===\n');

  try {
    const stories = await fetchStories();

    if (stories.length === 0) {
      console.log('\n⚠️ 未找到故事，可能是页面结构发生变化');
    } else {
      console.log(`\n✅ 成功抓取 ${stories.length} 个故事`);

      saveStories(stories);

      console.log('\n=== 抓取完成 ===');
    }
  } catch (error) {
    console.error('\n❌ 抓取失败:', error.message);
    process.exit(1);
  }
}

// 运行
main();
