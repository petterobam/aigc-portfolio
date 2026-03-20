/**
 * 番茄小说所有页面数据抓取
 *
 * 一次性抓取短故事管理页面的所有数据（支持分页）
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const USER_DATA_DIR = path.join(__dirname, '../data/chrome-user-data');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

async function fetchAllPages() {
  console.log('\n========================================');
  console.log('📚 番茄小说全页面数据抓取');
  console.log('========================================\n');

  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true });
  }

  const browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    channel: 'chrome',
    viewport: { width: 1920, height: 1080 },
  });

  const page = browser.pages()[0] || await browser.newPage();

  try {
    console.log('📡 访问短故事管理页面...');
    await page.goto('https://fanqienovel.com/main/writer/short-manage', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    const url = page.url();
    if (url.includes('login') || url.includes('passport')) {
      console.log('⚠️  需要登录！请在浏览器中完成登录...');
      await page.waitForURL('**/writer/short-manage**', { timeout: 600000 });
      console.log('✅ 登录成功！\n');
    }

    await page.waitForTimeout(3000);

    // 获取总页数
    console.log('📊 检测总页数...');
    const pageNumbers = await page.$$eval('.arco-pagination-item', items => {
      return items
        .map(item => parseInt(item.textContent.trim()))
        .filter(num => !isNaN(num));
    });
    
    const totalPages = Math.max(...pageNumbers) || 1;
    console.log(`📄 检测到 ${totalPages} 页数据\n`);

    const allStories = [];

    // 抓取每一页
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      console.log(`\n🔄 正在抓取第 ${pageNum}/${totalPages} 页...`);

      if (pageNum > 1) {
        // 点击页码
        await page.click(`.arco-pagination-item >> text="${pageNum}"`);
        await page.waitForTimeout(2000);
      }

      // 抓取当前页数据
      const stories = await page.evaluate(() => {
        const list = [];
        
        // 从 HTML 中提取数据
        const html = document.documentElement.outerHTML;
        
        // 使用正则表达式提取
        const titleRegex = /class="article-item-title[^"]*"[^>]*>([^<]+)</g;
        const statusRegex = /class="short-item-sign-tag"[^>]*>([^<]+)</g;
        const readRegex = /class="article-item-read"[^>]*>([^<]+)</g;
        const wordRegex = /class="article-item-number"[^>]*>([^<]+)</g;
        const timeRegex = /class="article-item-time"[^>]*>([^<]+)</g;

        const extract = (regex) => {
          const results = [];
          let match;
          while ((match = regex.exec(html)) !== null) {
            results.push(match[1].trim());
          }
          return results;
        };

        const titles = extract(titleRegex);
        const statuses = extract(statusRegex);
        const reads = extract(readRegex);
        const words = extract(wordRegex);
        const times = extract(timeRegex);

        for (let i = 0; i < titles.length; i++) {
          list.push({
            title: titles[i] || '未知',
            status: statuses[i] || '未知',
            reads: reads[i] || '0',
            words: words[i] || '0',
            time: times[i] || '未知',
          });
        }

        return list;
      });

      console.log(`   找到 ${stories.length} 个故事`);
      
      // 添加页码信息
      stories.forEach(s => s.page = pageNum);
      allStories.push(...stories);
    }

    // 保存所有数据
    const jsonPath = path.join(__dirname, `../data/all-stories-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(allStories, null, 2), 'utf8');
    console.log(`\n✅ 所有数据已保存: ${jsonPath}`);

    // 保存 CSV
    const csvPath = path.join(__dirname, `../data/all-stories-${timestamp}.csv`);
    const csvContent = [
      '页码,标题,状态,阅读量,字数,发布时间',
      ...allStories.map((s, i) => 
        `${s.page},"${s.title}","${s.status}","${s.reads}","${s.words}","${s.time}"`
      )
    ].join('\n');
    fs.writeFileSync(csvPath, '\ufeff' + csvContent, 'utf8');
    console.log(`📊 CSV 已保存: ${csvPath}`);

    // 统计信息
    console.log('\n========================================');
    console.log('📊 数据统计');
    console.log('========================================');
    console.log(`总页数: ${totalPages}`);
    console.log(`总故事数: ${allStories.length}`);
    console.log(`已签约: ${allStories.filter(s => s.status === '已签约').length}`);
    console.log(`平均字数: ${Math.round(allStories.reduce((sum, s) => sum + parseInt(s.words), 0) / allStories.length)}`);
    console.log(`总阅读量: ${allStories.reduce((sum, s) => sum + parseInt(s.reads), 0)}`);

    // 截图
    const screenshot = path.join(__dirname, `../data/all-stories-${timestamp}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    console.log(`\n📸 截图: ${screenshot}`);

    console.log('\n✅ 全部完成！');
    console.log('浏览器将在 5 秒后关闭...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    const errorLog = path.join(__dirname, `../data/error-${timestamp}.log`);
    fs.writeFileSync(errorLog, `${new Date().toISOString()}\n${error.stack}`, 'utf8');
    console.log('错误日志:', errorLog);
  } finally {
    await browser.close();
  }
}

fetchAllPages().catch(console.error);
