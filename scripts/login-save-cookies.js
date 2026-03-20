#!/usr/bin/env node

/**
 * 番茄小说登录脚本 - Cookie 持久化
 *
 * 功能：
 * 1. 启动 Chrome 浏览器（使用用户数据目录）
 * 2. 访问番茄小说登录页
 * 3. 等待用户扫码登录
 * 4. 登录成功后保存 Cookie 到文件
 * 5. 生成登录状态报告
 *
 * 使用方法：
 * node scripts/login-save-cookies.js
 *
 * 输出文件：
 * - cookies/fanqie-cookies-YYYY-MM-DDTHH-mm-ss.json - Cookie 文件
 * - data/login-screenshot-YYYY-MM-DDTHH-mm-ss.png - 登录成功截图
 * - data/login-report-YYYY-MM-DDTHH-mm-ss.json - 登录报告
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const config = {
  // 登录页面 URL
  loginUrl: 'https://fanqienovel.com/login',

  // Chrome 用户数据目录（保持登录状态）
  userDataDir: path.join(__dirname, '..', 'chrome-data'),

  // Cookie 保存目录
  cookieDir: path.join(__dirname, '..', 'cookies'),

  // 数据保存目录
  dataDir: path.join(__dirname, '..', 'data'),

  // 最大等待时间（秒）
  maxWaitSeconds: 120,

  // 检查间隔（毫秒）
  checkInterval: 1000,
};

// 确保目录存在
[config.cookieDir, config.dataDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ 创建目录: ${dir}`);
  }
});

/**
 * 检查登录状态
 * @param {Page} page
 * @returns {Promise<boolean>}
 */
async function checkLoginStatus(page) {
  try {
    // 检查是否显示登录页面（二维码）
    const hasQrCode = await page.locator('.slogin-qrcode-scan-page').count() > 0;

    // 检查是否已登录（查找用户头像或用户名）
    const hasUserInfo = await page.locator('.muye-header-user').count() > 0;

    // 如果没有显示登录页面且有用户信息，说明已登录
    return !hasQrCode && hasUserInfo;
  } catch (error) {
    console.log(`⚠️  检查登录状态时出错: ${error.message}`);
    return false;
  }
}

/**
 * 等待用户扫码登录
 * @param {Page} page
 * @returns {Promise<boolean>}
 */
async function waitForScanLogin(page) {
  const startTime = Date.now();

  console.log('\n⏳ 等待用户扫码登录...');
  console.log('   请使用番茄小说或番茄作家助手扫码登录\n');

  while (Date.now() - startTime < config.maxWaitSeconds * 1000) {
    const isLoggedIn = await checkLoginStatus(page);

    if (isLoggedIn) {
      console.log('\n✅ 登录成功！');
      return true;
    }

    // 每隔 5 秒打印一次等待时间
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    if (elapsedSeconds % 5 === 0 && elapsedSeconds > 0) {
      console.log(`   ⏱️  已等待 ${elapsedSeconds} 秒...`);
    }

    await new Promise(resolve => setTimeout(resolve, config.checkInterval));
  }

  console.log('\n❌ 等待超时，请手动完成登录后按回车继续');
  console.log('   提示：也可以关闭浏览器后重试\n');

  return false;
}

/**
 * 保存 Cookie
 * @param {BrowserContext} context
 * @returns {Promise<Object>}
 */
async function saveCookies(context) {
  // 获取所有 Cookie
  const cookies = await context.cookies();

  // 过滤关键 Cookie（fanqienovel.com 相关的）
  const importantCookies = cookies.filter(cookie => {
    return cookie.domain.includes('fanqienovel.com') ||
           cookie.name.includes('session') ||
           cookie.name.includes('token') ||
           cookie.name.includes('auth');
  });

  // 生成文件名
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const cookieFile = path.join(config.cookieDir, `fanqie-cookies-${timestamp}.json`);

  // 保存 Cookie
  fs.writeFileSync(cookieFile, JSON.stringify(importantCookies, null, 2));

  console.log(`\n✅ Cookie 已保存到: ${cookieFile}`);
  console.log(`   共保存 ${importantCookies.length} 个 Cookie（原始 ${cookies.length} 个）`);

  return {
    cookieFile,
    totalCookies: cookies.length,
    importantCookies: importantCookies.length,
  };
}

/**
 * 生成登录报告
 * @param {Object} data
 */
function generateLoginReport(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = path.join(config.dataDir, `login-report-${timestamp}.json`);

  const report = {
    timestamp: new Date().toISOString(),
    status: 'success',
    loginMethod: 'scan_qrcode',
    cookies: {
      file: data.cookieFile,
      total: data.totalCookies,
      important: data.importantCookies,
    },
    userAgent: data.userAgent,
    nextSteps: [
      '1. Cookie 已保存，可以用于后续自动化操作',
      '2. 建议每周重新登录一次以刷新 Cookie',
      '3. 如果 Cookie 失效，请重新运行本脚本',
    ],
  };

  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

  console.log(`\n✅ 登录报告已保存到: ${reportFile}`);
  console.log(`\n📋 下一步操作：`);
  report.nextSteps.forEach(step => console.log(`   ${step}`));
  console.log('');
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('  番茄小说登录脚本 - Cookie 持久化');
  console.log('='.repeat(60));
  console.log('');

  let browser;
  let page;

  try {
    // 启动浏览器
    console.log('🚀 正在启动 Chrome 浏览器...\n');

    browser = await chromium.launchPersistentContext(config.userDataDir, {
      headless: false,
      viewport: { width: 1920, height: 1080 },
    });

    page = browser.pages()[0] || await browser.newPage();

    // 访问登录页
    console.log(`📍 正在访问登录页: ${config.loginUrl}`);
    await page.goto(config.loginUrl, { waitUntil: 'networkidle' });
    console.log('✅ 页面加载完成\n');

    // 检查是否已经登录
    const isLoggedIn = await checkLoginStatus(page);

    if (isLoggedIn) {
      console.log('✅ 您已经登录过了！\n');
      console.log('⏳ 正在保存 Cookie...\n');
    } else {
      // 等待用户扫码登录
      await waitForScanLogin(page);
    }

    // 等待页面稳定
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 保存 Cookie
    const cookieData = await saveCookies(browser);

    // 截图保存
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotFile = path.join(config.dataDir, `login-screenshot-${timestamp}.png`);
    await page.screenshot({ path: screenshotFile, fullPage: false });
    console.log(`✅ 截图已保存到: ${screenshotFile}\n`);

    // 获取 User-Agent
    const userAgent = await page.evaluate(() => navigator.userAgent);

    // 生成登录报告
    generateLoginReport({
      cookieFile: cookieData.cookieFile,
      totalCookies: cookieData.totalCookies,
      importantCookies: cookieData.importantCookies,
      userAgent,
    });

    console.log('='.repeat(60));
    console.log('  ✅ 登录流程完成！');
    console.log('='.repeat(60));
    console.log('\n💡 提示：浏览器窗口不会自动关闭，方便您检查登录状态');
    console.log('   按 Ctrl+C 退出程序\n');

    // 等待用户手动退出
    await new Promise(() => {}); // 永久等待

  } catch (error) {
    console.error(`\n❌ 发生错误: ${error.message}`);
    console.error(error.stack);

    // 生成错误报告
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const errorReport = {
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message,
      stack: error.stack,
    };
    const errorReportFile = path.join(config.dataDir, `login-error-${timestamp}.json`);
    fs.writeFileSync(errorReportFile, JSON.stringify(errorReport, null, 2));
    console.log(`\n❌ 错误报告已保存到: ${errorReportFile}`);

    process.exit(1);
  } finally {
    if (browser) {
      // 不自动关闭，让用户检查
      // await browser.close();
    }
  }
}

// 运行主函数
main();
