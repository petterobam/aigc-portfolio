#!/usr/bin/env node

/**
 * 知乎登录状态检查脚本
 *
 * 功能：
 * 1. 检查浏览器是否已登录知乎账号
 * 2. 获取当前登录用户信息
 * 3. 检查是否有创作权限
 * 4. 生成检查报告
 *
 * 使用方法：
 *   node 知乎自动运营/🛠️自动化系统/scripts/utils/check-zhihu-login.js
 *
 * 依赖：
 *   - playwright (直接使用 Playwright API)
 *   - Chrome 浏览器（已登录知乎）
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const ZHIHU_AUTO_DIR = path.join(WORKSPACE_DIR, '知乎自动运营');
const AUTO_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统');
const DATA_DIR = path.join(AUTO_DIR, 'data');
const AUTH_DIR = path.join(AUTO_DIR, 'auth');

const CONFIG = {
  // Cookie 文件路径
  cookieFile: path.join(AUTH_DIR, 'zhihu-cookies-latest.json'),

  // 数据目录
  dataDir: DATA_DIR,

  // 检查页面
  checkUrls: {
    home: 'https://www.zhihu.com',
    creator: 'https://www.zhihu.com/creator',
    settings: 'https://www.zhihu.com/settings'
  },

  // 登录状态标识
  loginIndicators: {
    // 已登录时的页面特征（常见）
    loggedIn: [
      '创作中心',
      '首页',
      '想法',
      '消息',
      '写回答',
      '专栏'
    ],

    // 未登录时的页面特征
    loggedOut: [
      '登录',
      '注册',
      '加入知乎'
    ]
  }
};

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(DATA_DIR);
ensureDir(AUTH_DIR);

// ─── Cookie 管理 ───────────────────────────────────────────────────────────────

/**
 * 加载 Cookie
 */
function loadCookies() {
  if (!fs.existsSync(CONFIG.cookieFile)) {
    console.warn(`⚠️  Cookie 文件不存在: ${CONFIG.cookieFile}`);
    return null;
  }

  try {
    const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));
    console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);
    return cookies;
  } catch (error) {
    console.error(`❌ 加载 Cookie 失败: ${error.message}`);
    return null;
  }
}

/**
 * 保存 Cookie
 */
function saveCookies(cookies) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(AUTH_DIR, `zhihu-cookies-${timestamp}.json`);

  fs.writeFileSync(file, JSON.stringify(cookies, null, 2), 'utf8');

  // 同时更新 latest.json
  fs.writeFileSync(CONFIG.cookieFile, JSON.stringify(cookies, null, 2), 'utf8');

  console.log(`💾 Cookie 已保存: ${file}`);
  console.log(`🔗 已更新: ${CONFIG.cookieFile}`);

  return file;
}

// ─── 登录状态检查 ─────────────────────────────────────────────────────────────

/**
 * 检查登录状态
 */
async function checkLoginStatus() {
  console.log('═'.repeat(60));
  console.log('  知乎登录状态检查');
  console.log('═'.repeat(60));

  let browser = null;
  const result = {
    timestamp: new Date().toISOString(),
    pageInfo: null,
    loginStatus: null,
    userInfo: null,
    cookies: null,
    success: false
  };

  try {
    // 启动浏览器
    console.log('\n📍 启动 Chromium 浏览器...');
    browser = await chromium.launch({
      headless: false,  // 显示浏览器窗口，便于调试
      slowMo: 100  // 减慢操作速度
    });

    // 创建上下文和页面
    console.log('📍 创建上下文和页面...');
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    // 尝试加载 Cookie
    console.log('📍 尝试加载 Cookie...');
    const cookies = loadCookies();
    if (cookies && cookies.length > 0) {
      await context.addCookies(cookies);
      result.cookies = { loaded: true, count: cookies.length };
    } else {
      console.warn('⚠️  未加载 Cookie，将作为未登录状态访问');
      result.cookies = { loaded: false, count: 0 };
    }

    // 访问知乎首页
    console.log(`\n📍 访问知乎首页: ${CONFIG.checkUrls.home}`);
    await page.goto(CONFIG.checkUrls.home, { waitUntil: 'domcontentloaded' });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 获取页面信息
    console.log('\n📊 页面信息：');
    console.log('─'.repeat(50));

    const pageInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyText: document.body.innerText.substring(0, 1000)
      };
    });

    result.pageInfo = pageInfo;

    console.log(`URL: ${pageInfo.url}`);
    console.log(`标题: ${pageInfo.title}`);

    // 检查登录状态
    console.log('\n📊 登录状态检查：');
    console.log('─'.repeat(50));

    const loginStatus = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      // 检查是否包含已登录特征
      const loggedInIndicators = [
        '创作中心',
        '首页',
        '写回答',
        '专栏'
      ];

      const loggedIn = loggedInIndicators.some(indicator => bodyText.includes(indicator));

      // 检查是否包含未登录特征
      const loggedOut = bodyText.includes('登录') && bodyText.includes('注册');

      return {
        loggedIn,
        loggedOut,
        bodyLength: bodyText.length
      };
    });

    result.loginStatus = loginStatus;

    if (loginStatus.loggedIn && !loginStatus.loggedOut) {
      console.log('✅ 已登录');
    } else if (loginStatus.loggedOut) {
      console.log('❌ 未登录');
    } else {
      console.log('⚠️ 登录状态不明');
    }

    // 获取用户信息
    console.log('\n👤 用户信息：');
    console.log('─'.repeat(50));

    const userInfo = await page.evaluate(() => {
      const info = {
        name: null,
        hasPublishPermission: false,
        followerCount: 0,
        answerCount: 0
      };

      const bodyText = document.body.innerText;

      // 尝试提取用户名（从页面中查找用户信息）
      const nameMatch = bodyText.match(/([^\s]+)\s*(的关注|的回答|的专栏)/);
      if (nameMatch && nameMatch[1]) {
        info.name = nameMatch[1].trim();
      }

      // 检查是否有创作权限
      if (bodyText.includes('创作中心') || bodyText.includes('写回答')) {
        info.hasPublishPermission = true;
      }

      // 尝试提取粉丝数（简化版）
      const followerMatch = bodyText.match(/关注者?\s*(\d+)/);
      if (followerMatch) {
        info.followerCount = parseInt(followerMatch[1], 10);
      }

      return info;
    });

    result.userInfo = userInfo;

    console.log(`用户名: ${userInfo.name || '未知'}`);
    console.log(`创作权限: ${userInfo.hasPublishPermission ? '✅ 有' : '❌ 无'}`);
    console.log(`粉丝数: ${userInfo.followerCount || 0}`);

    console.log('\n' + '═'.repeat(60));

    // 截图
    const screenshotFile = path.join(DATA_DIR, `zhihu-login-check-${Date.now()}.png`);
    await page.screenshot({ path: screenshotFile, fullPage: false });
    console.log(`\n📸 截图已保存: ${screenshotFile}`);

    result.screenshot = screenshotFile;

    // 如果已登录，提取并保存 Cookie
    if (loginStatus.loggedIn && !loginStatus.loggedOut) {
      console.log('\n🍪 提取并保存 Cookie...');
      const extractedCookies = await context.cookies();
      const zhihuCookies = extractedCookies.filter(c =>
        c.domain.includes('zhihu.com')
      );

      if (zhihuCookies.length > 0) {
        const savedFile = saveCookies(zhihuCookies);
        result.cookiesExtracted = {
          count: zhihuCookies.length,
          file: savedFile
        };
        console.log(`✅ 已保存 ${zhihuCookies.length} 个知乎 Cookie`);
      }
    }

    // 保存检查报告
    const reportFile = path.join(DATA_DIR, `zhihu-login-check-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(result, null, 2));

    console.log(`\n📄 检查报告已保存: ${reportFile}`);

    console.log('\n' + '═'.repeat(60));
    if (loginStatus.loggedIn && !loginStatus.loggedOut) {
      console.log('  ✅ 检查完成，登录态有效');
      result.success = true;
    } else {
      console.log('  ⚠️ 检查完成，登录态无效或未登录');
      result.success = false;
    }
    console.log('═'.repeat(60) + '\n');

    return result;

  } catch (error) {
    console.error('\n❌ 检查失败:', error.message);
    console.error(error.stack);
    result.error = error.message;
    result.success = false;

    // 保存错误报告
    const errorReportFile = path.join(DATA_DIR, `zhihu-login-check-error-${Date.now()}.json`);
    fs.writeFileSync(errorReportFile, JSON.stringify(result, null, 2));
    console.log(`\n📄 错误报告已保存: ${errorReportFile}`);

    return result;
  } finally {
    if (browser) {
      await browser.close();
      console.log('📍 浏览器已关闭\n');
    }
  }
}

// ─── CLI 入口 ─────────────────────────────────────────────────────────────────

async function main() {
  const result = await checkLoginStatus();

  // 返回状态码
  if (result.success) {
    process.exit(0); // 已登录
  } else {
    process.exit(1); // 未登录或失败
  }
}

// 如果直接执行则运行 main；如果被 require 则只导出函数
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 检查异常:', error);
    process.exit(2);
  });
}

module.exports = { checkLoginStatus };
