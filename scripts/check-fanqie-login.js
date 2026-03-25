#!/usr/bin/env node

/**
 * 番茄小说登录状态检查脚本
 *
 * 功能：
 * 1. 检查浏览器是否已登录番茄小说作者账号
 * 2. 获取当前登录用户信息
 * 3. 检查是否有发布权限
 * 4. 生成检查报告
 *
 * 使用方法：
 *   node scripts/check-fanqie-login.js
 *
 * 依赖：
 *   - playwright (直接使用 Playwright API)
 *   - Chrome 浏览器（已登录番茄小说）
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // Cookie 文件路径
  cookieFile: path.join(__dirname, '..', 'cookies', 'latest.json'),

  // 数据目录
  dataDir: path.join(__dirname, '..', 'data'),

  // 检查页面
  checkUrls: {
    loginPage: 'https://fanqienovel.com/main/writer/login',
    shortManagePage: 'https://fanqienovel.com/main/writer/short-manage',
    writerDashboard: 'https://fanqienovel.com/main/writer'
  },

  // 登录状态标识
  loginIndicators: {
    // 已登录时的页面特征
    loggedIn: [
      '帅帅它爸',  // 用户名
      '作家专区',
      '工作台',
      '作品管理'
    ],

    // 未登录时的页面特征
    loggedOut: [
      '登录',
      '注册',
      '请先登录'
    ]
  }
};

// 确保数据目录存在
if (!fs.existsSync(CONFIG.dataDir)) {
  fs.mkdirSync(CONFIG.dataDir, { recursive: true });
}

/**
 * 加载 Cookie
 */
function loadCookies() {
  if (!fs.existsSync(CONFIG.cookieFile)) {
    throw new Error(`Cookie 文件不存在: ${CONFIG.cookieFile}`);
  }

  const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));
  console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);

  return cookies;
}

/**
 * 检查登录状态
 */
async function checkLoginStatus() {
  console.log('🔍 检查番茄小说登录状态...\n');

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
    await page.context().addCookies(cookies);

    // 检查短故事管理页面（最直接的验证）
    console.log(`📍 访问短故事管理页面: ${CONFIG.checkUrls.shortManagePage}`);
    await page.goto(CONFIG.checkUrls.shortManagePage, { waitUntil: 'domcontentloaded' });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 获取页面信息
    console.log('\n📊 页面信息：');
    console.log('─'.repeat(50));

    const pageInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyText: document.body.innerText.substring(0, 500)
      };
    });

    console.log(`URL: ${pageInfo.url}`);
    console.log(`标题: ${pageInfo.title}`);

    // 检查登录状态
    const loginStatus = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      // 检查是否包含已登录特征
      const loggedIn = bodyText.includes('帅帅它爸') ||
                     bodyText.includes('作家专区') ||
                     bodyText.includes('工作台') ||
                     bodyText.includes('作品管理');

      // 检查是否包含未登录特征
      const loggedOut = bodyText.includes('登录') && bodyText.includes('注册');

      return {
        loggedIn,
        loggedOut
      };
    });

    // 获取用户信息
    const userInfo = await page.evaluate(() => {
      const userInfo = {
        name: null,
        hasPublishPermission: false
      };

      const bodyText = document.body.innerText;

      // 提取用户名
      const nameMatch = bodyText.match(/帅帅它爸/);
      if (nameMatch) {
        userInfo.name = nameMatch[0];
      }

      // 检查是否有发布权限
      if (bodyText.includes('新建短故事') ||
          bodyText.includes('发布') ||
          bodyText.includes('发布短故事')) {
        userInfo.hasPublishPermission = true;
      }

      return userInfo;
    });

    // 打印检查结果
    console.log('\n📊 登录状态：');
    console.log('─'.repeat(50));

    if (loginStatus.loggedIn && !loginStatus.loggedOut) {
      console.log('✅ 已登录');
      console.log(`👤 用户名: ${userInfo.name || '未知'}`);
      console.log(`📝 发布权限: ${userInfo.hasPublishPermission ? '✅ 有' : '❌ 无'}`);
    } else if (loginStatus.loggedOut) {
      console.log('❌ 未登录');
      console.log('💡 建议：请先在浏览器中登录番茄小说作者账号');
    } else {
      console.log('⚠️ 登录状态不明');
      console.log(`URL: ${pageInfo.url}`);
      console.log(`页面标题: ${pageInfo.title}`);
    }

    console.log('\n' + '─'.repeat(50));

    // 截图
    const screenshotFile = path.join(CONFIG.dataDir, `check-fanqie-login-${Date.now()}.png`);
    await page.screenshot({ path: screenshotFile, fullPage: false });
    console.log(`\n📸 截图已保存: ${screenshotFile}`);

    // 保存检查报告
    const report = {
      timestamp: new Date().toISOString(),
      pageInfo: pageInfo,
      loginStatus: loginStatus,
      userInfo: userInfo,
      checkUrls: CONFIG.checkUrls
    };

    const reportFile = path.join(CONFIG.dataDir, `fanqie-login-check-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`\n📄 检查报告已保存: ${reportFile}`);
    console.log('\n✅ 检查完成！');

    // 返回状态码
    if (loginStatus.loggedIn && !loginStatus.loggedOut) {
      return { success: true, pageInfo, loginStatus, userInfo };
    } else {
      return { success: false, pageInfo, loginStatus, userInfo };
    }

  } catch (error) {
    console.error('\n❌ 检查失败:', error.message);
    console.error(error.stack);
    return { success: false, error: error.message };
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n📍 浏览器已关闭');
    }
  }
}

// 执行检查
checkLoginStatus()
  .then(result => {
    if (result.success) {
      process.exit(0); // 已登录
    } else {
      process.exit(1); // 未登录或失败
    }
  })
  .catch(error => {
    console.error('❌ 检查异常:', error);
    process.exit(2);
  });
