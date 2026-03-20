/**
 * 番茄小说短故事数据抓取脚本 - 改进版
 * 
 * 功能：
 * 1. 自动加载 Cookie（无需重复登录）
 * 2. 访问"数据中心" - "短故事数据"页面
 * 3. 切换到"作品数据"标签
 * 4. 抓取所有作品列表
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIE_FILE = path.join(__dirname, '../data/fanqie-cookies.json');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

async function fetchShortStoryData() {
  console.log('🚀 启动浏览器...');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 200, // 更慢，方便观察
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  
  const page = await context.newPage();
  
  try {
    // 加载 Cookie
    if (fs.existsSync(COOKIE_FILE)) {
      console.log('🍪 加载已保存的 Cookie...');
      const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf8'));
      await context.addCookies(cookies);
      console.log('✅ Cookie 加载成功！');
    }
    
    // 访问短故事数据页面
    console.log('📡 访问"短故事数据"页面...');
    await page.goto('https://fanqienovel.com/main/writer/short-data?tab=1', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    // 检查是否需要登录
    const currentUrl = page.url();
    console.log('📍 当前 URL:', currentUrl);
    
    if (currentUrl.includes('login') || currentUrl.includes('passport')) {
      console.log('⚠️  需要登录！');
      console.log('请在浏览器中手动登录...');
      
      await page.waitForURL('**/writer/short-data**', {
        timeout: 300000,
      });
      
      console.log('✅ 登录成功！');
      
      // 保存 Cookie
      console.log('💾 保存 Cookie...');
      const cookies = await context.cookies();
      fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2), 'utf8');
      console.log('✅ Cookie 已保存！');
    } else {
      console.log('✅ 已登录状态');
    }
    
    // 等待页面加载
    console.log('⏳ 等待页面加载...');
    await page.waitForTimeout(5000);
    
    // 截图
    const screenshot1 = path.join(__dirname, `../data/fanqie-data-page-${timestamp}.png`);
    await page.screenshot({ path: screenshot1, fullPage: true });
    console.log('📸 截图已保存:', screenshot1);
    
    // 尝试点击"作品数据"标签
    console.log('🖱️  尝试点击"作品数据"标签...');
    try {
      // 等待标签加载
      await page.waitForSelector('text=作品数据', { timeout: 10000 });
      
      const workDataTab = await page.locator('text=作品数据').first();
      await workDataTab.click();
      console.log('✅ 已点击"作品数据"标签');
      
      // 等待数据加载
      await page.waitForTimeout(3000);
      
      // 再次截图
      const screenshot2 = path.join(__dirname, `../data/fanqie-work-data-${timestamp}.png`);
      await page.screenshot({ path: screenshot2, fullPage: true });
      console.log('📸 作品数据截图已保存:', screenshot2);
      
    } catch (error) {
      console.log('⚠️  无法点击"作品数据"标签:', error.message);
      console.log('可能已经在作品数据页面或页面结构不同');
    }
    
    // 抓取页面内容
    console.log('📄 保存页面内容...');
    const html = await page.content();
    const htmlPath = path.join(__dirname, `../data/fanqie-page-${timestamp}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('📄 页面内容已保存:', htmlPath);
    
    // 尝试抓取作品列表
    console.log('📊 尝试提取作品列表...');
    const workList = await page.evaluate(() => {
      const works = [];
      
      // 方法1：查找作品选择区域
      const bookSelect = document.querySelector('.book-select, [class*="book-select"]');
      if (bookSelect) {
        const name = bookSelect.querySelector('[class*="title"], [class*="name"]')?.textContent.trim();
        const status = bookSelect.querySelector('[class*="status"], [class*="body"]')?.textContent.trim();
        if (name) {
          works.push({ name, status: status || '未知', source: 'book-select' });
        }
      }
      
      // 方法2：查找所有作品卡片
      const cards = document.querySelectorAll('[class*="book-card"], [class*="work-item"], [class*="story-card"]');
      cards.forEach(card => {
        const name = card.querySelector('[class*="title"], [class*="name"], h3, h4')?.textContent.trim();
        if (name) {
          works.push({ name, status: '未知', source: 'card' });
        }
      });
      
      // 方法3：查找表格
      const tables = document.querySelectorAll('table');
      tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length > 0) {
            const name = cells[0]?.textContent.trim();
            if (name) {
              works.push({ name, status: cells[1]?.textContent.trim() || '未知', source: 'table' });
            }
          }
        });
      });
      
      return works;
    });
    
    // 保存作品列表
    const jsonPath = path.join(__dirname, `../data/fanqie-works-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(workList, null, 2), 'utf8');
    console.log('📊 作品列表已保存:', jsonPath);
    
    // 打印结果
    if (workList.length > 0) {
      console.log('\n✅ 找到', workList.length, '个作品:');
      workList.forEach((work, index) => {
        console.log(`${index + 1}. ${work.name} (${work.status}) - 来源: ${work.source}`);
      });
      
      // 保存为 CSV
      const csvPath = path.join(__dirname, `../data/fanqie-works-${timestamp}.csv`);
      const csvContent = [
        '序号,作品名称,状态,来源',
        ...workList.map((w, i) => `${i + 1},"${w.name}","${w.status}","${w.source}"`)
      ].join('\n');
      fs.writeFileSync(csvPath, '\ufeff' + csvContent, 'utf8');
      console.log('📊 CSV 已保存:', csvPath);
    } else {
      console.log('\n⚠️  未找到任何作品');
      console.log('请查看截图和 HTML 文件，手动分析');
    }
    
    console.log('\n✅ 抓取完成！');
    console.log('浏览器将在 15 秒后关闭...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    
    const errorLogPath = path.join(__dirname, '../data/fanqie-error.log');
    fs.writeFileSync(errorLogPath, `${new Date().toISOString()}\n${error.message}\n${error.stack}`, 'utf8');
    console.log('错误日志已保存:', errorLogPath);
  } finally {
    await browser.close();
  }
}

// 运行
fetchShortStoryData().catch(console.error);
