const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyZhihuLogin() {
    console.log('🔍 检查知乎登录状态...\n');

    // Cookie 文件路径
    const cookieFilePath = path.join(__dirname, '../知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-latest.json');

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

        // 检查是否有用户信息
        const userInfo = await page.evaluate(() => {
            const avatar = document.querySelector('.AppHeader-profile img');
            const username = document.querySelector('.AppHeader-profile');
            return {
                hasAvatar: !!avatar,
                hasProfile: !!username
            };
        });

        console.log('📊 登录状态：');
        console.log('──────────────────────────────────────────────────');

        const isLoggedIn = !isLoginPage && (userInfo.hasAvatar || userInfo.hasProfile);

        if (isLoggedIn) {
            console.log('✅ 已登录');
            console.log(`👤 有头像: ${userInfo.hasAvatar ? '是' : '否'}`);
            console.log(`👤 有个人中心: ${userInfo.hasProfile ? '是' : '否'}`);
        } else {
            console.log('❌ 未登录');
            console.log(`📍 当前在登录页: ${isLoginPage ? '是' : '否'}`);
        }

        console.log('──────────────────────────────────────────────────\n');

        // 截图
        const timestamp = Date.now();
        const screenshotPath = path.join(process.env.HOME, `.openclaw/workspace/data/zhihu-verify-${timestamp}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`📸 截图已保存: ${screenshotPath}\n`);

        // 保存检查报告
        const reportPath = path.join(process.env.HOME, `.openclaw/workspace/data/zhihu-verify-report-${timestamp}.json`);
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            isLoggedIn,
            isLoginPage,
            hasLoginButton,
            userInfo,
            url,
            title,
            screenshotPath
        }, null, 2));
        console.log(`📄 检查报告已保存: ${reportPath}\n`);

        await browser.close();

        console.log('✅ 检查完成！\n');

        return {
            success: isLoggedIn,
            isLoginPage,
            hasLoginButton,
            userInfo,
            url,
            title,
            screenshotPath,
            reportPath
        };

    } catch (error) {
        console.error('❌ 检查失败:', error.message);

        // 尝试截图以便调试
        try {
            const timestamp = Date.now();
            const screenshotPath = path.join(process.env.HOME, `.openclaw/workspace/data/zhihu-verify-error-${timestamp}.png`);
            await page.screenshot({ path: screenshotPath });
            console.log(`📸 错误截图已保存: ${screenshotPath}`);
        } catch (e) {}

        await browser.close();
        return { success: false, reason: error.message };
    }
}

// 执行检查
verifyZhihuLogin().then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
}).catch(error => {
    console.error('❌ 执行失败:', error);
    process.exit(1);
});
