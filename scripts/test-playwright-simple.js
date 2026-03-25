#!/usr/bin/env node

/**
 * 简单的 playwright 测试脚本
 * 用于测试 playwright MCP 服务是否可用
 */

const { chromium } = require('playwright');
const path = require('path');

// 配置
const CONFIG = {
  // Cookie 文件路径
  cookieFile: path.join(__dirname, '..', 'cookies', 'latest.json'),

  // 测试 URL
  testUrl: 'https://fanqienovel.com/main/writer/short-manage'
};

/**
 * 加载 Cookie
 */
function loadCookies() {
  const fs = require('fs');

  if (!fs.existsSync(CONFIG.cookieFile)) {
    throw new Error(`Cookie 文件不存在: ${CONFIG.cookieFile}`);
  }

  const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));
  console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);

  return cookies;
}

/**
 * 测试 playwright
 */
async function testPlaywright() {
  console.log('🚀 启动 Playwright 测试...\n');

  let browser = null;

  try {
    // 启动浏览器
    console.log('📍 启动 Chromium 浏览器...');
    browser = await chromium.launch({
      headless: false,  // 显示浏览器窗口，便于调试
      slowMo: 100  // 减慢操作速度
    });

    // 创建页面
    console.log('📍 创建新页面...');
    const page = await browser.newPage();

    // 加载 Cookie
    console.log('📍 加载 Cookie...');
    const cookies = loadCookies();

    // 设置 Cookie
    await page.context().addCookies(cookies);

    // 访问测试页面
    console.log(`📍 访问测试页面: ${CONFIG.testUrl}`);
    await page.goto(CONFIG.testUrl, { waitUntil: 'domcontentloaded' });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 获取页面信息
    console.log('\n📊 页面信息：');
    console.log('─'.repeat(50));

    const pageInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasUserName: document.body.innerText.includes('帅帅它爸'),
        hasWriterDashboard: document.body.innerText.includes('作家专区'),
        hasWorkBench: document.body.innerText.includes('工作台')
      };
    });

    console.log(`URL: ${pageInfo.url}`);
    console.log(`标题: ${pageInfo.title}`);
    console.log(`是否包含用户名: ${pageInfo.hasUserName ? '✅' : '❌'}`);
    console.log(`是否包含作家专区: ${pageInfo.hasWriterDashboard ? '✅' : '❌'}`);
    console.log(`是否包含工作台: ${pageInfo.hasWorkBench ? '✅' : '❌'}`);

    // 检查登录状态
    if (pageInfo.hasUserName) {
      console.log('\n✅ 登录状态：已登录');
    } else {
      console.log('\n❌ 登录状态：未登录或 Cookie 无效');
    }

    console.log('\n' + '─'.repeat(50));

    // 截图
    const screenshotFile = path.join(__dirname, '..', 'data', `test-playwright-${Date.now()}.png`);
    await page.screenshot({ path: screenshotFile, fullPage: false });
    console.log(`\n📸 截图已保存: ${screenshotFile}`);

    console.log('\n✅ 测试完成！');

    return pageInfo;

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n📍 浏览器已关闭');
    }
  }
}

// 执行测试
testPlaywright()
  .then(result => {
    if (result.hasUserName) {
      process.exit(0);  // 成功
    } else {
      process.exit(1);  // Cookie 无效
    }
  })
  .catch(error => {
    console.error('❌ 测试异常:', error);
    process.exit(2);
  });
