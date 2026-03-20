#!/usr/bin/env node

/**
 * Cookie 持久化测试脚本
 *
 * 功能：
 * 1. 加载最新的 Cookie 文件
 * 2. 访问需要登录的页面
 * 3. 验证 Cookie 是否有效
 * 4. 生成测试报告
 *
 * 使用方法：
 * node scripts/test-cookie-persistence.js
 *
 * 预期结果：
 * - Cookie 有效：直接访问目标页面，无需扫码
 * - Cookie 失效：显示登录页，需要重新运行 login-save-cookies.js
 */

const { chromium } = require('playwright');
const cookieManager = require('./cookie-manager.js');

// 配置
const config = {
  // 目标页面（需要登录才能访问）
  targetUrl: 'https://fanqienovel.com/main/writer/publish-short/?enter_from=NEWCHAPTER_1',

  // 数据保存目录
  dataDir: require('path').join(__dirname, '..', 'data'),
};

// 确保目录存在
if (!require('fs').existsSync(config.dataDir)) {
  require('fs').mkdirSync(config.dataDir, { recursive: true });
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('  Cookie 持久化测试');
  console.log('='.repeat(60));
  console.log('');

  let browser;
  let page;

  try {
    // 步骤1：打印 Cookie 状态
    console.log('📋 步骤 1: 检查 Cookie 状态\n');
    cookieManager.printCookieStatus();

    // 步骤2：启动浏览器
    console.log('🚀 步骤 2: 正在启动 Chrome 浏览器...\n');
    browser = await chromium.launch({
      headless: false, // 显示浏览器，方便观察
      viewport: { width: 1920, height: 1080 },
    });

    const context = browser.contexts()[0] || await browser.newContext();
    page = context.pages()[0] || await context.newPage();

    // 步骤3：加载 Cookie
    console.log('📦 步骤 3: 加载 Cookie...\n');
    const cookieFile = cookieManager.getLatestCookieFile();

    if (!cookieFile) {
      console.log('❌ 未找到 Cookie 文件');
      console.log('   请先运行: node scripts/login-save-cookies.js\n');
      process.exit(1);
    }

    const loadSuccess = await cookieManager.loadCookies(context, cookieFile);

    if (!loadSuccess) {
      console.log('❌ 加载 Cookie 失败');
      process.exit(1);
    }

    console.log('');

    // 步骤4：访问目标页面
    console.log(`📍 步骤 4: 访问目标页面...`);
    console.log(`   URL: ${config.targetUrl}\n`);

    await page.goto(config.targetUrl, { waitUntil: 'networkidle' });

    // 等待页面加载
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 步骤5：验证 Cookie 有效性
    console.log('🔍 步骤 5: 验证 Cookie 有效性...\n');

    const isValid = await cookieManager.isCookieValid(page);

    // 步骤6：生成测试报告
    console.log('📊 步骤 6: 生成测试报告...\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotFile = `${config.dataDir}/cookie-test-screenshot-${timestamp}.png`;
    const reportFile = `${config.dataDir}/cookie-test-report-${timestamp}.json`;

    // 保存截图
    await page.screenshot({ path: screenshotFile, fullPage: false });

    // 生成报告
    const report = {
      timestamp: new Date().toISOString(),
      targetUrl: config.targetUrl,
      cookieFile: cookieFile,
      cookieValid: isValid,
      pageInfo: {
        url: page.url(),
        title: await page.title(),
      },
      nextSteps: isValid ? [
        '✅ Cookie 有效，可以继续自动化操作',
        '✅ 无需重新登录',
        '💡 建议每周刷新一次 Cookie',
      ] : [
        '❌ Cookie 失效',
        '⚠️  需要重新登录',
        '💡 请运行: node scripts/login-save-cookies.js',
      ],
    };

    require('fs').writeFileSync(reportFile, JSON.stringify(report, null, 2));

    // 打印测试结果
    console.log('='.repeat(60));
    console.log('  测试结果');
    console.log('='.repeat(60));
    console.log('');

    if (isValid) {
      console.log('✅ Cookie 有效！\n');
      console.log('   当前页面:');
      console.log(`   URL: ${page.url()}`);
      console.log(`   标题: ${await page.title()}`);
      console.log('');
      console.log('✅ 可以正常使用自动化功能，无需重新登录\n');
    } else {
      console.log('❌ Cookie 失效\n');
      console.log('   检测到登录页面（二维码），说明 Cookie 已失效');
      console.log('');
      console.log('⚠️  下一步操作：');
      console.log('   1. 关闭当前浏览器窗口');
      console.log('   2. 运行: node scripts/login-save-cookies.js');
      console.log('   3. 扫码登录，生成新的 Cookie');
      console.log('   4. 重新运行本测试脚本验证\n');
    }

    console.log('📄 详细报告已保存:');
    console.log(`   截图: ${screenshotFile}`);
    console.log(`   报告: ${reportFile}\n`);

    console.log('='.repeat(60));
    console.log('  💡 提示：浏览器窗口不会自动关闭');
    console.log('     按 Ctrl+C 退出程序');
    console.log('='.repeat(60));
    console.log('');

    // 等待用户手动退出
    await new Promise(() => {}); // 永久等待

  } catch (error) {
    console.error(`\n❌ 测试失败: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // 不自动关闭，让用户检查
    // if (browser) {
    //   await browser.close();
    // }
  }
}

// 运行主函数
main();
