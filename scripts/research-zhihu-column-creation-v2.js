/**
 * 知乎专栏创建流程研究脚本 v2
 * 目的：研究知乎专栏的创建流程、定价机制、功能限制
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 配置
const COOKIE_FILE = path.join(os.homedir(), '.openclaw/workspace/知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-latest.json');
const OUTPUT_DIR = path.join(os.homedir(), '.openclaw/workspace/知乎自动运营/🛠️自动化系统/reports');

// 加载 Cookie
async function loadCookies() {
  try {
    const cookieData = fs.readFileSync(COOKIE_FILE, 'utf8');
    const cookies = JSON.parse(cookieData);
    return cookies;
  } catch (error) {
    console.error('❌ 加载 Cookie 失败:', error.message);
    return [];
  }
}

async function main() {
  console.log('🌐 启动浏览器...');
  
  // 使用临时用户数据目录
  const browser = await chromium.launch({
    headless: false,
    viewport: { width: 1920, height: 1080 },
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  try {
    // 加载并设置 Cookie
    console.log('🍪 加载知乎 Cookie...');
    const cookies = await loadCookies();
    await context.addCookies(cookies);
    console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);
    
    // 测试多个专栏相关 URL
    const urls = [
      'https://zhuanlan.zhihu.com/',
      'https://zhuanlan.zhihu.com/create',
      'https://zhuanlan.zhihu.com/manage',
      'https://www.zhihu.com/columns',
    ];
    
    const page = await context.newPage();
    
    for (const url of urls) {
      console.log(`\n📖 访问 ${url}...`);
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);
        
        const pageInfo = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            // 查找创建专栏按钮
            createButton: (() => {
              const buttons = Array.from(document.querySelectorAll('button, a'));
              for (const btn of buttons) {
                const text = btn.textContent.trim();
                if (text.includes('创建') || text.includes('新建') || text.includes('写专栏') || text.includes('发布')) {
                  return {
                    text: text,
                    visible: btn.offsetParent !== null,
                  };
                }
              }
              return null;
            })(),
            // 查找现有专栏列表
            existingColumns: Array.from(document.querySelectorAll('.ColumnCard, .ColumnItem, [class*="column"], .ContentItem-title, .List-item')).slice(0, 10).map(el => ({
              title: el.querySelector('h2, h3, .title, [class*="title"], [class*="Title"]')?.textContent.trim() || '',
              url: el.querySelector('a')?.href || '',
            })).filter(col => col.title),
            // 提取页面文本内容
            pageText: document.body.innerText.slice(0, 800),
          };
        });
        
        console.log(`📋 页面信息 - ${url}:`, JSON.stringify(pageInfo, null, 2));
        
        // 如果有创建按钮或现有专栏，保存截图
        if (pageInfo.createButton || pageInfo.existingColumns.length > 0) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const screenshotPath = path.join(OUTPUT_DIR, `zhihu-column-${path.basename(url)}-${timestamp}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`📸 截图已保存: ${screenshotPath}`);
          
          // 保存页面信息
          const reportPath = path.join(OUTPUT_DIR, `zhihu-column-${path.basename(url)}-${timestamp}.json`);
          fs.writeFileSync(reportPath, JSON.stringify(pageInfo, null, 2), 'utf8');
          console.log(`📄 报告已保存: ${reportPath}`);
        }
        
      } catch (error) {
        console.error(`❌ 访问 ${url} 失败:`, error.message);
      }
    }
    
    // 保持浏览器打开30秒供观察
    console.log('\n⏳ 浏览器将保持打开30秒供观察...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ 发生错误:', error.message);
    console.error('堆栈:', error.stack);
  } finally {
    await browser.close();
    console.log('✅ 浏览器已关闭');
  }
}

main();
