const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// 手动指定路径
const cookieFilePath = '/Users/oyjie/.openclaw/workspace/知乎自动运营/🛠️自动化系统/auth/latest.json';

console.log('🔍 手动检查知乎登录状态...');
console.log('📍 Cookie文件路径:', cookieFilePath);

if (!fs.existsSync(cookieFilePath)) {
    console.log('❌ 文件不存在');
    process.exit(1);
}

const cookies = JSON.parse(fs.readFileSync(cookieFilePath, 'utf-8'));
console.log('📍 已加载', cookies.length, '个Cookie');

// 启动浏览器
(async () => {
    console.log('📍 启动浏览器...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    
    await context.addCookies(cookies);
    console.log('✅ Cookie已加载');
    
    const page = await context.newPage();
    console.log('📍 访问知乎...');
    
    await page.goto('https://www.zhihu.com', { waitUntil: 'networkidle', timeout: 10000 });
    
    const title = await page.title();
    const url = page.url();
    
    console.log('📊 页面信息:');
    console.log('URL:', url);
    console.log('标题:', title);
    
    const isLoginPage = url.includes('signin') || url.includes('login');
    console.log('是否登录页:', isLoginPage);
    
    if (isLoginPage) {
        console.log('❌ 被重定向到登录页');
        const screenshotPath = '/Users/oyjie/.openclaw/workspace/data/zhihu-login-check-' + Date.now() + '.png';
        await page.screenshot({ path: screenshotPath });
        console.log('📸 截图保存至:', screenshotPath);
    } else {
        console.log('✅ 正常访问登录页');
        const screenshotPath = '/Users/oyjie/.openclaw/workspace/data/zhihu-login-check-' + Date.now() + '.png';
        await page.screenshot({ path: screenshotPath });
        console.log('📸 截图保存至:', screenshotPath);
    }
    
    await browser.close();
})();