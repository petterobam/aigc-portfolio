/**
 * 番茄小说短故事管理页面抓取脚本
 * 
 * 功能：
 * 1. 访问短故事管理页面
 * 2. 抓取已发布故事列表
 * 3. 保存故事清单和数据
 * 4. 自动更新 Cookie
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { loadCookies, saveCookies, checkLoginStatus } = require('./fanqie-cookie-helper');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

async function fetchStoryList() {
  console.log('\n========================================');
  console.log('📚 番茄小说短故事管理页面抓取');
  console.log('========================================\n');
  
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
    // 1. 加载 Cookie
    console.log('\n📦 步骤 1: 加载 Cookie');
    await loadCookies(context);
    
    // 2. 访问短故事管理页面
    console.log('\n📡 步骤 2: 访问短故事管理页面');
    await page.goto('https://fanqienovel.com/main/writer/short-manage', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    // 3. 检查登录状态
    console.log('\n🔍 步骤 3: 检查登录状态');
    const isLoggedIn = await checkLoginStatus(page);
    
    if (!isLoggedIn) {
      console.log('\n⚠️  需要登录！');
      console.log('请在浏览器中手动登录...');
      
      await page.waitForURL('**/writer/short-manage**', {
        timeout: 300000,
      });
      
      console.log('✅ 登录成功！');
      
      // 更新 Cookie
      console.log('\n💾 步骤 4: 更新 Cookie（登录后）');
      await saveCookies(context);
    } else {
      console.log('✅ 已登录状态');
    }
    
    // 4. 等待页面加载
    console.log('\n⏳ 步骤 5: 等待页面加载');
    await page.waitForTimeout(3000);
    
    // 5. 截图
    const screenshot = path.join(__dirname, `../data/short-manage-${timestamp}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    console.log('📸 截图已保存:', screenshot);
    
    // 6. 抓取故事列表
    console.log('\n📊 步骤 6: 抓取故事列表');
    const storyList = await page.evaluate(() => {
      const stories = [];
      
      // 查找故事列表
      const items = document.querySelectorAll('[class*="book-item"], [class*="story-item"], [class*="work-item"]');
      
      items.forEach((item, index) => {
        try {
          const title = item.querySelector('[class*="title"], [class*="name"], h3, h4')?.textContent.trim();
          const status = item.querySelector('[class*="status"]')?.textContent.trim();
          const category = item.querySelector('[class*="category"], [class*="type"]')?.textContent.trim();
          
          if (title) {
            stories.push({
              index: index + 1,
              title,
              status: status || '未知',
              category: category || '未知',
            });
          }
        } catch (e) {
          // 忽略错误
        }
      });
      
      return stories;
    });
    
    // 7. 保存故事列表
    const jsonPath = path.join(__dirname, `../data/story-list-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(storyList, null, 2), 'utf8');
    console.log('📊 故事列表已保存:', jsonPath);
    
    // 8. 显示结果
    if (storyList.length > 0) {
      console.log('\n✅ 找到', storyList.length, '个已发布故事:\n');
      storyList.forEach((story, index) => {
        console.log(`${index + 1}. ${story.title}`);
        console.log(`   状态: ${story.status}`);
        console.log(`   分类: ${story.category}\n`);
      });
      
      // 保存 CSV
      const csvPath = path.join(__dirname, `../data/story-list-${timestamp}.csv`);
      const csvContent = [
        '序号,标题,状态,分类',
        ...storyList.map((s, i) => `${i + 1},"${s.title}","${s.status}","${s.category}"`)
      ].join('\n');
      fs.writeFileSync(csvPath, '\ufeff' + csvContent, 'utf8');
      console.log('📊 CSV 已保存:', csvPath);
      
    } else {
      console.log('\n⚠️  未找到已发布故事');
      console.log('可能需要调整选择器或检查页面结构');
    }
    
    // 9. 保存页面 HTML
    const html = await page.content();
    const htmlPath = path.join(__dirname, `../data/short-manage-${timestamp}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('📄 页面 HTML 已保存:', htmlPath);
    
    // 10. 更新 Cookie ⭐
    console.log('\n💾 步骤 7: 更新 Cookie（任务完成后）');
    await saveCookies(context);
    
    console.log('\n✅ 抓取完成！');
    console.log('浏览器将在 5 秒后关闭...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);
    
    const errorLog = path.join(__dirname, `../data/error-${timestamp}.log`);
    fs.writeFileSync(errorLog, `${new Date().toISOString()}\n${error.stack}`, 'utf8');
    console.log('错误日志已保存:', errorLog);
  } finally {
    await browser.close();
  }
}

// 运行
fetchStoryList().catch(console.error);
