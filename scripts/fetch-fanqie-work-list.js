/**
 * 番茄小说作品管理列表抓取脚本
 * 
 * 功能：
 * 1. 自动加载 Cookie（无需重复登录）
 * 2. 访问"作品管理" - "短故事"页面
 * 3. 抓取所有已发布的作品列表
 * 4. 保存作品名称、状态、日期等信息
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIE_FILE = path.join(__dirname, '../data/fanqie-cookies.json');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

async function fetchWorkList() {
  console.log('🚀 启动浏览器...');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
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
    
    // 访问作品管理页面
    console.log('📡 访问作品管理页面...');
    await page.goto('https://fanqienovel.com/main/writer/short-manage', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    // 检查是否需要登录
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      console.log('⚠️  需要登录！');
      console.log('请在浏览器中手动登录...');
      
      await page.waitForURL('**/writer/short-manage**', {
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
    console.log('⏳ 等待作品列表加载...');
    await page.waitForTimeout(3000);
    
    // 截图
    const screenshotPath = path.join(__dirname, `../data/fanqie-work-list-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('📸 截图已保存:', screenshotPath);
    
    // 抓取作品列表
    console.log('📊 抓取作品列表...');
    
    const workList = await page.evaluate(() => {
      const works = [];
      
      // 尝试多种选择器
      // 方法1：查找作品卡片
      const cards = document.querySelectorAll('[class*="book-card"], [class*="work-card"], [class*="story-item"]');
      
      if (cards.length > 0) {
        cards.forEach(card => {
          const name = card.querySelector('[class*="title"], [class*="name"], h3, h4')?.textContent.trim();
          const status = card.querySelector('[class*="status"]')?.textContent.trim();
          const date = card.querySelector('[class*="date"], [class*="time"]')?.textContent.trim();
          
          if (name) {
            works.push({ name, status: status || '', date: date || '' });
          }
        });
      }
      
      // 方法2：查找表格
      if (works.length === 0) {
        const rows = document.querySelectorAll('table tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length > 0) {
            const name = cells[0]?.textContent.trim();
            const status = cells[1]?.textContent.trim();
            const date = cells[2]?.textContent.trim();
            
            if (name) {
              works.push({ name, status: status || '', date: date || '' });
            }
          }
        });
      }
      
      // 方法3：查找列表项
      if (works.length === 0) {
        const items = document.querySelectorAll('[class*="list"] > [class*="item"]');
        items.forEach(item => {
          const name = item.textContent.trim();
          if (name && name.length > 0 && name.length < 100) {
            works.push({ name, status: '', date: '' });
          }
        });
      }
      
      return works;
    });
    
    // 保存数据
    const jsonPath = path.join(__dirname, `../data/fanqie-work-list-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(workList, null, 2), 'utf8');
    console.log('📊 作品列表已保存:', jsonPath);
    
    // 转换为 CSV
    if (workList.length > 0) {
      const csvPath = path.join(__dirname, `../data/fanqie-work-list-${timestamp}.csv`);
      const csvContent = [
        '作品名称,状态,发布日期',
        ...workList.map(w => `"${w.name}","${w.status}","${w.date}"`)
      ].join('\n');
      fs.writeFileSync(csvPath, '\ufeff' + csvContent, 'utf8');
      console.log('📊 CSV 已保存:', csvPath);
      
      // 打印统计
      console.log('\n📈 统计信息:');
      console.log('找到', workList.length, '个作品');
      
      if (workList.length > 0) {
        console.log('\n作品列表:');
        workList.forEach((work, index) => {
          console.log(`${index + 1}. ${work.name} (${work.status}) - ${work.date}`);
        });
      }
    } else {
      console.log('\n⚠️  未找到作品列表');
      console.log('请查看截图文件，手动分析页面结构');
      
      // 保存 HTML
      const html = await page.content();
      const htmlPath = path.join(__dirname, `../data/fanqie-work-list-${timestamp}.html`);
      fs.writeFileSync(htmlPath, html, 'utf8');
      console.log('📄 HTML 已保存:', htmlPath);
    }
    
    console.log('\n✅ 抓取完成！');
    console.log('浏览器将在 10 秒后关闭...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    
    const errorLogPath = path.join(__dirname, '../data/fanqie-error.log');
    fs.writeFileSync(errorLogPath, `${new Date().toISOString()}\n${error.message}\n${error.stack}`, 'utf8');
    console.log('错误日志已保存:', errorLogPath);
  } finally {
    await browser.close();
  }
}

// 运行
fetchWorkList().catch(console.error);
