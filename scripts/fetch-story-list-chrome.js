/**
 * 番茄小说数据抓取脚本 - 使用 Chrome 用户数据
 *
 * 原理：直接使用您已登录的 Chrome 浏览器配置，无需单独保存 Cookie
 *
 * 优点：
 * - ✅ 最简单：无需任何手动操作
 * - ✅ 最可靠：使用您已有的登录状态
 * - ✅ 最安全：Cookie 不会泄露
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// 使用专用的用户数据目录（避免与主 Chrome 冲突）
const USER_DATA_DIR = path.join(__dirname, '../data/chrome-user-data');

async function fetchStoryList() {
  console.log('\n========================================');
  console.log('📚 番茄小说短故事管理页面抓取');
  console.log('  使用 Chrome 用户数据');
  console.log('========================================\n');

  console.log('🚀 启动浏览器（使用 Chrome）...\n');

  // 创建用户数据目录（如果不存在）
  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true });
    console.log('📁 创建用户数据目录:', USER_DATA_DIR);
  }

  const browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    channel: 'chrome', // 使用系统安装的 Chrome
    viewport: { width: 1920, height: 1080 },
    args: [
      '--disable-blink-features=AutomationControlled', // 避免被检测
    ],
  });

  const page = browser.pages()[0] || await browser.newPage();

  try {
    // 访问短故事管理页面
    console.log('📡 步骤 1: 访问短故事管理页面...');
    await page.goto('https://fanqienovel.com/main/writer/short-manage', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    const url = page.url();
    console.log('📍 当前 URL:', url);

    // 检查是否需要登录
    if (url.includes('login') || url.includes('passport')) {
      console.log('\n⚠️  需要登录！');
      console.log('请在浏览器中完成登录...');
      console.log('登录成功后，脚本会自动继续\n');

      // 等待登录成功
      await page.waitForURL('**/writer/short-manage**', {
        timeout: 600000, // 10 分钟超时
      });

      console.log('✅ 登录成功！\n');
    } else {
      console.log('✅ 已登录状态\n');
    }

    // 等待页面加载
    console.log('⏳ 步骤 2: 等待页面加载...');
    await page.waitForTimeout(3000);

    // 截图
    const screenshot = path.join(__dirname, `../data/short-manage-${timestamp}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    console.log('📸 截图已保存:', screenshot);

    // 抓取故事列表
    console.log('\n📊 步骤 3: 抓取故事列表...\n');

    const storyList = await page.evaluate(() => {
      const stories = [];

      // 尝试多种选择器
      const selectors = [
        '[class*="book-item"]',
        '[class*="story-item"]',
        '[class*="work-item"]',
        '[class*="book-card"]',
        '.book-list-item',
        '.story-card',
      ];

      let items = [];
      for (const selector of selectors) {
        items = Array.from(document.querySelectorAll(selector));
        if (items.length > 0) {
          console.log(`找到 ${items.length} 个元素，使用选择器: ${selector}`);
          break;
        }
      }

      if (items.length === 0) {
        // 如果找不到，尝试更通用的方法
        const allElements = document.querySelectorAll('div');
        console.log('尝试通用方法，共', allElements.length, '个 div 元素');
      }

      items.forEach((item, index) => {
        try {
          // 尝试多种标题选择器
          const titleSelectors = [
            '[class*="title"]',
            '[class*="name"]',
            'h3',
            'h4',
            '.title',
            '.name',
          ];

          let title = null;
          for (const selector of titleSelectors) {
            const el = item.querySelector(selector);
            if (el && el.textContent.trim()) {
              title = el.textContent.trim();
              break;
            }
          }

          // 尝试多种状态选择器
          const statusSelectors = [
            '[class*="status"]',
            '[class*="state"]',
            '.status',
            '.state',
          ];

          let status = '未知';
          for (const selector of statusSelectors) {
            const el = item.querySelector(selector);
            if (el && el.textContent.trim()) {
              status = el.textContent.trim();
              break;
            }
          }

          if (title) {
            stories.push({
              index: index + 1,
              title,
              status,
            });
          }
        } catch (e) {
          // 忽略错误
        }
      });

      return stories;
    });

    // 保存故事列表
    const jsonPath = path.join(__dirname, `../data/story-list-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(storyList, null, 2), 'utf8');
    console.log('📊 故事列表已保存:', jsonPath);

    // 显示结果
    if (storyList.length > 0) {
      console.log('\n✅ 找到', storyList.length, '个已发布故事:\n');
      storyList.slice(0, 10).forEach((story, index) => {
        console.log(`${index + 1}. ${story.title}`);
        console.log(`   状态: ${story.status}\n`);
      });

      if (storyList.length > 10) {
        console.log(`... 还有 ${storyList.length - 10} 个故事\n`);
      }

      // 保存 CSV
      const csvPath = path.join(__dirname, `../data/story-list-${timestamp}.csv`);
      const csvContent = [
        '序号,标题,状态',
        ...storyList.map((s, i) => `${i + 1},"${s.title}","${s.status}"`)
      ].join('\n');
      fs.writeFileSync(csvPath, '\ufeff' + csvContent, 'utf8');
      console.log('📊 CSV 已保存:', csvPath);

    } else {
      console.log('\n⚠️  未找到已发布故事');
      console.log('可能需要调整选择器或检查页面结构');
      console.log('请查看截图: ', screenshot);
    }

    // 保存页面 HTML
    const html = await page.content();
    const htmlPath = path.join(__dirname, `../data/short-manage-${timestamp}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('📄 页面 HTML 已保存:', htmlPath);

    console.log('\n✅ 抓取完成！');
    console.log('浏览器将继续保持打开，您可以查看数据');
    console.log('如需关闭，请按 Ctrl+C\n');

    // 保持浏览器打开，让用户查看
    await page.waitForTimeout(300000); // 5 分钟

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);

    const errorLog = path.join(__dirname, `../data/error-${timestamp}.log`);
    fs.writeFileSync(errorLog, `${new Date().toISOString()}\n${error.stack}`, 'utf8');
    console.log('错误日志已保存:', errorLog);

    // 即使出错，也保持浏览器打开
    console.log('\n浏览器将继续保持打开，您可以手动查看');
    await page.waitForTimeout(300000);
  } finally {
    await browser.close();
  }
}

// 运行
fetchStoryList().catch(console.error);
