/**
 * 优化后的番茄小说数据抓取脚本
 *
 * 改进点：
 * - 使用 cookies/latest.json 方式，与 check-fanqie-login.js 保持一致
 * - 在抓取完成后立即关闭浏览器，而不是等待5分钟
 * - 优化等待时间，加快抓取速度
 * - 改进错误处理
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// 配置
const CONFIG = {
  // Cookie 文件路径
  cookieFile: path.join(__dirname, '..', 'cookies', 'latest.json'),
};

/**
 * 加载 Cookie
 */
function loadCookies() {
  if (!fs.existsSync(CONFIG.cookieFile)) {
    throw new Error(`Cookie 文件不存在: ${CONFIG.cookieFile}`);
  }

  const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));
  console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);

  return cookies;
}

async function fetchStoryList(pageIndex = 1, maxPages = 3) {
  console.log('\n========================================');
  console.log('📚 番茄小说短故事管理页面抓取 V5');
  console.log('  使用 cookies/latest.json 方式');
  console.log('  优化版本：立即关闭浏览器');
  console.log('========================================\n');

  console.log('🚀 启动浏览器（使用 Chrome）...\n');

  // 启动浏览器
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome', // 使用系统安装的 Chrome
    viewport: { width: 1920, height: 1080 },
    args: [
      '--disable-blink-features=AutomationControlled', // 避免被检测
    ],
  });

  // 创建页面
  const page = await browser.newPage();

  try {
    // 加载 Cookie
    console.log('📍 加载 Cookie...');
    const cookies = loadCookies();
    await page.context().addCookies(cookies);

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
      console.log('Cookie 可能已失效，请运行 cookie-manager.js 提取最新 Cookie');
      console.log('或者使用浏览器手动登录后重新提取 Cookie\n');

      await browser.close();
      return;
    } else {
      console.log('✅ 已登录状态\n');
    }

    // 等待页面加载
    console.log('⏳ 步骤 2: 等待页面加载...');
    await page.waitForTimeout(3000);

    // 抓取所有页的数据
    const allStories = [];

    for (let currentPage = pageIndex; currentPage <= maxPages; currentPage++) {
      console.log(`\n📊 步骤 3.${currentPage}: 抓取第 ${currentPage} 页数据...`);

      // 如果不是第一页，点击页码
      if (currentPage > 1) {
        console.log(`   📍 点击第 ${currentPage} 页...`);
        await page.click(`.arco-pagination-item[aria-label="第 ${currentPage} 页"]`);
        await page.waitForTimeout(2000);
      }

      // 抓取当前页的故事列表
      const stories = await page.evaluate(() => {
        const storyItems = document.querySelectorAll('.short-article-table-item');
        const stories = [];

        storyItems.forEach((item, index) => {
          try {
            // 提取标题
            const titleEl = item.querySelector('.article-item-title');
            const title = titleEl ? titleEl.textContent.trim() : '';

            // 提取预览链接 ID
            const previewLink = item.querySelector('a[href*="/main/writer/preview-short/"]');
            const previewId = previewLink ? previewLink.getAttribute('href').match(/preview-short\/(\d+)/)?.[1] : '';

            // 提取阅读量
            const readEl = item.querySelector('.article-item-read');
            const read = readEl ? readEl.textContent.trim() : '0';

            // 提取字数
            const numberEl = item.querySelector('.article-item-number');
            const number = numberEl ? numberEl.textContent.trim() : '0';

            // 提取发布时间
            const timeEl = item.querySelector('.article-item-time');
            const time = timeEl ? timeEl.textContent.trim() : '';

            // 提取签约状态
            const signEl = item.querySelector('.short-item-sign-tag');
            const sign = signEl ? signEl.textContent.trim() : '';

            if (title) {
              stories.push({
                index: index + 1,
                title,
                previewId,
                read: parseInt(read) || 0,
                number: parseInt(number) || 0,
                time,
                sign,
              });
            }
          } catch (e) {
            // 忽略错误
          }
        });

        return stories;
      });

      console.log(`   ✅ 第 ${currentPage} 页找到 ${stories.length} 个故事`);

      // 将页码信息添加到每个故事
      stories.forEach((story) => {
        story.page = currentPage;
        allStories.push(story);
      });

      // 如果当前页故事数量少于10，说明已经是最后一页
      if (stories.length < 10) {
        console.log(`   📍 第 ${currentPage} 页故事数量不足 10，已经是最后一页`);
        break;
      }
    }

    // 保存所有故事列表
    const jsonPath = path.join(__dirname, `../data/story-list-all-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(allStories, null, 2), 'utf8');
    console.log('\n📊 所有故事列表已保存:', jsonPath);

    // 显示结果
    if (allStories.length > 0) {
      console.log('\n✅ 总共找到', allStories.length, '个已发布故事:\n');

      // 按页分组显示
      const pages = {};
      allStories.forEach((story) => {
        if (!pages[story.page]) {
          pages[story.page] = [];
        }
        pages[story.page].push(story);
      });

      Object.keys(pages).forEach((page) => {
        console.log(`第 ${page} 页：`);
        pages[page].forEach((story) => {
          console.log(`  ${story.index}. ${story.title}`);
          console.log(`     阅读量: ${story.read}, 字数: ${story.number}`);
          console.log(`     发布时间: ${story.time}, 签约状态: ${story.sign}`);
        });
        console.log('');
      });

      // 保存 CSV
      const csvPath = path.join(__dirname, `../data/story-list-all-${timestamp}.csv`);
      const csvContent = [
        '页码,序号,标题,阅读量,字数,发布时间,签约状态,预览ID',
        ...allStories.map((s) =>
          `${s.page},${s.index},"${s.title}",${s.read},${s.number},"${s.time}","${s.sign}","${s.previewId}"`
        ),
      ].join('\n');
      fs.writeFileSync(csvPath, '\ufeff' + csvContent, 'utf8');
      console.log('📊 CSV 已保存:', csvPath);

      // 生成统计信息
      const totalReads = allStories.reduce((sum, s) => sum + s.read, 0);
      const avgReads = (totalReads / allStories.length).toFixed(2);
      const signedCount = allStories.filter((s) => s.sign === '已签约').length;
      const signRate = ((signedCount / allStories.length) * 100).toFixed(2);

      console.log('\n========================================');
      console.log('📈 数据统计：');
      console.log('========================================');
      console.log(`总故事数: ${allStories.length}`);
      console.log(`总阅读量: ${totalReads}`);
      console.log(`平均阅读量: ${avgReads}`);
      console.log(`已签约数量: ${signedCount} (${signRate}%)`);

    } else {
      console.log('\n⚠️  未找到已发布故事');
    }

    // 截图（第一页）
    const screenshot = path.join(__dirname, `../data/short-manage-${timestamp}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    console.log('\n📸 截图已保存:', screenshot);

    // 保存页面 HTML（第一页）
    const html = await page.content();
    const htmlPath = path.join(__dirname, `../data/short-manage-${timestamp}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('📄 页面 HTML 已保存:', htmlPath);

    console.log('\n✅ 抓取完成！');

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);

    const errorLog = path.join(__dirname, `../data/error-${timestamp}.log`);
    fs.writeFileSync(errorLog, `${new Date().toISOString()}\n${error.stack}`, 'utf8');
    console.log('错误日志已保存:', errorLog);

  } finally {
    // 立即关闭浏览器（不等待）
    console.log('\n🔒 关闭浏览器...\n');
    await browser.close();
    console.log('✅ 浏览器已关闭');
  }
}

// 运行
fetchStoryList().catch(console.error);
