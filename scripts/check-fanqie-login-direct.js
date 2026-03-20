#!/usr/bin/env node

/**
 * 番茄小说登录状态检查脚本（直接使用 Playwright）
 *
 * 功能：
 * 1. 检查浏览器是否已登录番茄小说作者账号
 * 2. 获取当前登录用户信息
 * 3. 检查是否有发布权限
 * 4. 生成检查报告
 *
 * 使用方法：
 *   node scripts/check-fanqie-login-direct.js
 *
 * 依赖：
 *   - playwright
 *   - Chrome 浏览器（已登录番茄小说）
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // 数据目录
  dataDir: path.join(__dirname, '..', 'data'),

  // 检查页面
  checkUrls: {
    shortManagePage: 'https://fanqienovel.com/main/writer/short-manage',
    writerDashboard: 'https://fanqienovel.com/main/writer'
  },

  // 用户数据目录（使用 Chrome 用户数据）
  userDataDir: path.join(__dirname, '..', 'data', 'chrome-user-data'),

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
      '注册'
    ]
  }
};

// 确保数据目录存在
if (!fs.existsSync(CONFIG.dataDir)) {
  fs.mkdirSync(CONFIG.dataDir, { recursive: true });
}

/**
 * 检查登录状态
 */
async function checkLoginStatus() {
  console.log('🔍 检查番茄小说登录状态...\n');

  let browser;
  try {
    // 启动浏览器（使用 Chrome 用户数据）
    console.log('🚀 启动浏览器（使用 Chrome 用户数据）...');
    browser = await chromium.launchPersistentContext(CONFIG.userDataDir, {
      headless: false,  // 显示浏览器窗口
      channel: 'chrome'  // 使用 Chrome
    });

    const page = browser.pages()[0] || await browser.newPage();

    // 访问短故事管理页面
    console.log('📍 访问短故事管理页面...');

    try {
      await page.goto(CONFIG.checkUrls.shortManagePage, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
    } catch (error) {
      console.error('❌ 页面加载失败:', error.message);

      // 尝试访问作家首页
      console.log('📍 尝试访问作家首页...');
      await page.goto(CONFIG.checkUrls.writerDashboard, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
    }

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 获取页面信息
    const pageInfo = {
      url: page.url(),
      title: await page.title(),
      bodyText: await page.evaluate(() => document.body.innerText.substring(0, 1000))
    };

    console.log('📊 页面信息：');
    console.log('─'.repeat(50));
    console.log(`URL: ${pageInfo.url}`);
    console.log(`标题: ${pageInfo.title}`);
    console.log('─'.repeat(50));

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
        loggedOut,
        userName: bodyText.match(/帅帅它爸/) ? '帅帅它爸' : null
      };
    });

    // 获取用户信息
    const userInfo = await page.evaluate(() => {
      const userInfo = {
        name: null,
        hasPublishPermission: false,
        hasManagePermission: false
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

      // 检查是否有管理权限
      if (bodyText.includes('短故事管理') ||
          bodyText.includes('作品管理')) {
        userInfo.hasManagePermission = true;
      }

      return userInfo;
    });

    // 打印检查结果
    console.log('\n✅ 检查完成！\n');

    console.log('📊 登录状态：');
    console.log('─'.repeat(50));

    if (loginStatus.loggedIn && !loginStatus.loggedOut) {
      console.log('✅ 已登录');
      console.log(`👤 用户名: ${userInfo.name || '未知'}`);
      console.log(`📝 发布权限: ${userInfo.hasPublishPermission ? '✅ 有' : '❌ 无'}`);
      console.log(`📊 管理权限: ${userInfo.hasManagePermission ? '✅ 有' : '❌ 无'}`);
      console.log('\n✅ 可以使用浏览器自动化发布！');
    } else if (loginStatus.loggedOut) {
      console.log('❌ 未登录');
      console.log('💡 建议：请先在浏览器中登录番茄小说作者账号');
      console.log('💡 登录地址：https://fanqienovel.com/main/writer/login');
    } else {
      console.log('⚠️ 登录状态不明');
      console.log(`URL: ${pageInfo.url}`);
      console.log(`页面标题: ${pageInfo.title}`);
    }

    console.log('\n' + '─'.repeat(50));

    // 截图
    const screenshotFile = path.join(CONFIG.dataDir, `fanqie-login-check-${new Date().toISOString().replace(/[:.]/g, '-')}.png`);
    await page.screenshot({ path: screenshotFile, fullPage: true });
    console.log(`\n📸 截图已保存: ${screenshotFile}`);

    // 保存检查报告
    const report = {
      timestamp: new Date().toISOString(),
      pageInfo: pageInfo,
      loginStatus: loginStatus,
      userInfo: userInfo,
      checkUrls: CONFIG.checkUrls,
      screenshot: screenshotFile
    };

    const reportFile = path.join(CONFIG.dataDir, `fanqie-login-check-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`📄 检查报告已保存: ${reportFile}`);

    // 返回状态码
    if (loginStatus.loggedIn && !loginStatus.loggedOut) {
      process.exit(0); // 已登录
    } else {
      process.exit(1); // 未登录
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    console.error(error.stack);
    process.exit(2);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 执行检查
checkLoginStatus();
