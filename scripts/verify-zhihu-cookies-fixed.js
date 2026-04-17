const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyZhihuLogin() {
    console.log('🔍 检查知乎登录状态...\n');

    // Cookie 文件路径 - 使用实际的路径
    const cookieFilePath = path.join(__dirname, '../知乎自动运营/🛅自动化系统/auth/latest.json');

    console.log('📍 Cookie文件路径:', cookieFilePath);

    // 检查 Cookie 文件是否存在
    if (!fs.existsSync(cookieFilePath)) {
        console.error('❌ Cookie 文件不存在:', cookieFilePath);
        return { success: false, reason: 'Cookie文件不存在' };
    }

    // 读取 Cookie
    const cookies = JSON.parse(fs.readFileSync(cookieFilePath, 'utf-8'));
    console.log(`📍 已加载 ${cookies.length} 个 Cookie\n`);

    // 启动浏览器
    console.log('📍 启动 Chromium 浏览器...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    // 加载 Cookie
    await context.addCookies(cookies);
    console.log('✅ Cookie 已加载\n');

    // 访问知乎首页
    console.log('📍 访问知乎首页: https://www.zhihu.com\n');
    const page = await context.newPage();

    try {
        await page.goto('https://www.zhihu.com', { waitUntil: 'networkidle', timeout: 10000 });

        // 检查页面信息
        const title = await page.title();
        const url = page.url();

        console.log('📊 页面信息：');
        console.log('──────────────────────────────────────────────────');
        console.log(`URL: ${url}`);
        console.log(`标题: ${title}\n`);

        // 检查是否被跳转到登录页
        const isLoginPage = url.includes('signin') || url.includes('login');
        const hasLoginButton = await page.$$('.Button.Button--primary').then(btns => btns.length > 0);

        console.log('📊 登录状态检查：');
        console.log('──────────────────────────────────────────────────');
        
        if (isLoginPage) {
            console.log('❌ 当前页面: 登录页');
            console.log('🔗 跳转原因: Cookie 无效或被服务器端失效\n');
            console.log('🔍 分析：');
            console.log('   - Cookie 文件存在且格式正确');
            console.log('   - 但用户被重定向到登录页面');
            console.log('   - 可能原因：');
            console.log('     1. 知乎反机器人检测拦截');
            console.log('     2. Cookie 已被服务器端失效');
            console.log('     3. 需要更高级的浏览器指纹技术\n');
            
            // 截图
            const screenshotPath = path.join(__dirname, '../data/zhihu-login-check-' + Date.now() + '.png');
            await page.screenshot({ path: screenshotPath });
            console.log(`📸 截图已保存: ${screenshotPath}\n`);
            
            await browser.close();
            return { 
                success: false, 
                reason: '知乎反机器人检测，Cookie有效但用户未登录',
                isLoginPage: true,
                title: title,
                url: url,
                screenshotPath: screenshotPath
            };
        } else if (hasLoginButton) {
            console.log('❌ 当前页面: 包含登录按钮');
            console.log('🔗 页面状态: 可能未完全登录\n');
            
            // 截图
            const screenshotPath = path.join(__dirname, '../data/zhihu-login-check-' + Date.now() + '.png');
            await page.screenshot({ path: screenshotPath });
            console.log(`📸 截图已保存: ${screenshotPath}\n`);
            
            await browser.close();
            return { 
                success: false, 
                reason: '页面包含登录按钮，可能登录不完整',
                isLoginPage: false,
                hasLoginButton: true,
                title: title,
                url: url,
                screenshotPath: screenshotPath
            };
        } else {
            console.log('✅ 当前页面: 已登录');
            console.log('🔗 页面状态: 正常访问\n');
            
            // 检查是否有用户信息
            try {
                const userInfo = await page.textContent('.ProfileHeader-name');
                console.log(`👤 用户信息: ${userInfo || '未找到用户名显示'}`);
            } catch (e) {
                console.log('👤 用户信息: 未在页面中找到');
            }
            
            // 截图
            const screenshotPath = path.join(__dirname, '../data/zhihu-login-check-' + Date.now() + '.png');
            await page.screenshot({ path: screenshotPath });
            console.log(`📸 截图已保存: ${screenshotPath}\n`);
            
            await browser.close();
            return { 
                success: true, 
                reason: '登录正常',
                isLoginPage: false,
                hasLoginButton: false,
                title: title,
                url: url,
                screenshotPath: screenshotPath
            };
        }
    } catch (error) {
        console.error('❌ 访问知乎首页时出错:', error.message);
        
        // 截图保存错误状态
        const screenshotPath = path.join(__dirname, '../data/zhihu-login-check-error-' + Date.now() + '.png');
        try {
            await page.screenshot({ path: screenshotPath });
            console.log(`📸 错误截图已保存: ${screenshotPath}\n`);
        } catch (screenshotError) {
            console.log('📸 截图保存失败:', screenshotError.message);
        }
        
        await browser.close();
        return { 
            success: false, 
            reason: '访问知乎首页失败: ' + error.message,
            error: error.message,
            title: '未知',
            url: '未知'
        };
    }
}

// 运行函数
verifyZhihuLogin().then(result => {
    console.log('\n📄 检查结果：');
    console.log('──────────────────────────────────────────────────');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n✅ 检查完成！');
}).catch(error => {
    console.error('❌ 检查失败:', error);
});