/**
 * 番茄小说数据抓取脚本 V2 - 使用 Chrome 用户数据 + 正确的选择器
 *
 * 改进点：
 * - 使用正确的选择器提取故事列表
 * - 支持多页抓取
 * - 提取更完整的数据字段
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// 使用专用的用户数据目录（避免与主 Chrome 冲突）
const USER_DATA_DIR = path.join(__dirname, '../data/chrome-user-data');

async function fetchStoryList(pageIndex = 1, maxPages = 3) {
  console.log('\n========================================');
  console.log('📚 番茄小说短故事管理页面抓取 V2');
  console.log('  使用 Chrome 用户数据 + 正确选择器');
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

    // 抓取所有页的数据
    const allStories = [];

    for (let page = pageIndex; page <= maxPages; page++) {
      console.log(`\n📊 步骤 3.${page}: 抓取第 ${page} 页数据...`);

      // 如果不是第一页，点击页码
      if (page > 1) {
        console.log(`   📍 点击第 ${page} 页...`);
        await page.click(`.arco-pagination-item[aria-label="第 ${page} 页"]`);
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

      console.log(`   ✅ 第 ${page} 页找到 ${stories.length} 个故事`);

      // 将页码信息添加到每个故事
      stories.forEach((story) => {
        story.page = page;
        allStories.push(story);
      });

      // 如果当前页故事数量少于10，说明已经是最后一页
      if (stories.length < 10) {
        console.log(`   📍 第 ${page} 页故事数量不足 10，已经是最后一页`);
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
