#!/usr/bin/env node

/**
 * zhihu-login-persistent.js
 *
 * 知乎登录脚本（使用持久化上下文）
 *
 * 功能：
 *   1. 检查是否已有有效 Cookie
 *   2. 如果没有，打开浏览器显示知乎登录页面
 *   3. 等待用户手动完成登录
 *   4. 自动提取并保存 Cookie
 *
 * 使用方法：
 *   node scripts/zhihu-login-persistent.js
 *
 * 依赖：
 *   - playwright
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const ZHIHU_AUTO_DIR = path.join(WORKSPACE_DIR, '知乎自动运营');
const AUTO_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统');
const AUTH_DIR = path.join(AUTO_DIR, 'auth');
const BROWSER_DATA_DIR = path.join(AUTO_DIR, '.browser-data', 'zhihu');

const CONFIG = {
  // Cookie 文件路径
  cookieFile: path.join(AUTH_DIR, 'zhihu-cookies-latest.json'),

  // 持久化上下文路径
  persistentContextPath: path.join(BROWSER_DATA_DIR, 'context'),

  // 知乎 URL
  urls: {
    login: 'https://www.zhihu.com/signin',
    home: 'https://www.zhihu.com'
  },

  // 检查登录状态的间隔（毫秒）
  checkInterval: 2000,

  // 等待登录的最大时间（毫秒）
  maxWaitTime: 10 * 60 * 1000,  // 10 分钟
};

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(AUTH_DIR);
ensureDir(BROWSER_DATA_DIR);

// ─── Cookie 管理 ───────────────────────────────────────────────────────────────

/**
 * 检查 Cookie 文件是否存在且有效
 */
function checkCookieFile() {
  if (!fs.existsSync(CONFIG.cookieFile)) {
    return { valid: false, reason: 'Cookie 文件不存在' };
  }

  try {
    const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));

    if (!Array.isArray(cookies) || cookies.length === 0) {
      return { valid: false, reason: 'Cookie 数据为空' };
    }

    // 检查关键 Cookie
    const hasDc0 = cookies.some(c => c.name === 'd_c0' && c.value && c.value.length > 0);
    const hasZc0 = cookies.some(c => c.name === 'z_c0' && c.value && c.value.length > 0);

    if (!hasDc0 && !hasZc0) {
      return { valid: false, reason: '缺少关键 Cookie（d_c0 / z_c0）' };
    }

    return { valid: true, cookieCount: cookies.length };

  } catch (error) {
    return { valid: false, reason: `Cookie 文件读取失败: ${error.message}` };
  }
}

/**
 * 保存 Cookie 到文件
 */
function saveCookies(cookies) {
  fs.writeFileSync(CONFIG.cookieFile, JSON.stringify(cookies, null, 2));
  console.log(`✅ 已保存 ${cookies.length} 个 Cookie 到: ${CONFIG.cookieFile}`);

  // 检查关键 Cookie
  const hasDc0 = cookies.some(c => c.name === 'd_c0' && c.value);
  const hasZc0 = cookies.some(c => c.name === 'z_c0' && c.value);

  console.log(`   - d_c0: ${hasDc0 ? '✅' : '❌'}`);
  console.log(`   - z_c0: ${hasZc0 ? '✅' : '❌'}`);
}

// ─── 登录流程 ───────────────────────────────────────────────────────────────

/**
 * 检查是否已登录
 */
async function isLoggedIn(page) {
  try {
    await page.goto(CONFIG.urls.home, { waitUntil: 'networkidle' });

    // 检查是否跳转到登录页
    if (page.url().includes('signin')) {
      return false;
    }

    // 检查页面内容
    const bodyText = await page.evaluate(() => document.body.innerText);

    if (bodyText.includes('登录') || bodyText.includes('注册')) {
      return false;
    }

    return true;

  } catch (error) {
    console.error(`检查登录状态失败: ${error.message}`);
    return false;
  }
}

/**
 * 获取用户信息
 */
async function getUserInfo(page) {
  try {
    const userInfo = await page.evaluate(() => {
      const header = document.querySelector('.AppHeader-profileText, .ProfileHeader-name');
      const avatar = document.querySelector('.AppHeader-avatar img, .ProfileHeader-avatar img');

      return {
        username: header ? header.textContent.trim() : '未知',
        avatarUrl: avatar ? avatar.src : null
      };
    });

    return userInfo;

  } catch (error) {
    console.error(`获取用户信息失败: ${error.message}`);
    return { username: '未知', avatarUrl: null };
  }
}

/**
 * 执行登录流程
 */
async function performLogin() {
  console.log('═'.repeat(60));
  console.log('  知乎登录脚本');
  console.log('═'.repeat(60));
  console.log('');

  let browser;
  let context;
  let page;

  try {
    // 使用持久化上下文启动浏览器
    console.log('🌐 启动浏览器（持久化上下文）...');
    console.log(`   持久化路径: ${CONFIG.persistentContextPath}`);

    browser = await chromium.launch({
      headless: false,  // 显示浏览器窗口
      slowMo: 0
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    page = await context.newPage();

    // 导航到知乎登录页
    console.log(`\n📄 导航到知乎登录页: ${CONFIG.urls.login}`);
    await page.goto(CONFIG.urls.login, { waitUntil: 'networkidle' });

    console.log('\n' + '═'.repeat(60));
    console.log('  请在浏览器中完成登录');
    console.log('═'.repeat(60));
    console.log('');
    console.log('📝 说明:');
    console.log('   1. 使用扫码登录或手机号登录');
    console.log('   2. 完成登录后，脚本会自动检测并保存 Cookie');
    console.log('   3. Cookie 保存后，脚本会自动关闭浏览器');
    console.log('');
    console.log('⏱️  等待登录中...（最多等待 10 分钟）');
    console.log('');

    // 定期检查登录状态
    const startTime = Date.now();
    let loginAttempts = 0;

    while (Date.now() - startTime < CONFIG.maxWaitTime) {
      await page.waitForTimeout(CONFIG.checkInterval);
      loginAttempts++;

      // 检查是否已登录
      const loggedIn = await isLoggedIn(page);

      if (loggedIn) {
        console.log('\n✅ 检测到登录成功！');

        // 获取用户信息
        const userInfo = await getUserInfo(page);
        console.log(`   用户名: ${userInfo.username}`);
        if (userInfo.avatarUrl) {
          console.log(`   头像: ${userInfo.avatarUrl}`);
        }

        // 提取 Cookie
        console.log('\n🍪 提取 Cookie...');
        const cookies = await context.cookies();
        console.log(`   提取到 ${cookies.length} 个 Cookie`);

        // 保存 Cookie
        saveCookies(cookies);

        // 保存持久化上下文状态
        console.log('\n💾 保存持久化上下文状态...');
        await context.storageState({ path: CONFIG.persistentContextPath });
        console.log(`   状态已保存到: ${CONFIG.persistentContextPath}`);

        return { success: true, userInfo, cookieCount: cookies.length };
      }

      // 每 30 秒显示一次进度
      if (loginAttempts % 15 === 0) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.floor((CONFIG.maxWaitTime - (Date.now() - startTime)) / 1000);
        console.log(`   ⏱️  已等待 ${elapsed} 秒，剩余 ${remaining} 秒...`);
      }
    }

    // 超时
    console.log('\n❌ 登录超时');
    console.log('   请检查网络连接或重新运行脚本');

    return { success: false, error: '登录超时' };

  } catch (error) {
    console.error(`\n❌ 登录失败: ${error.message}`);
    return { success: false, error: error.message };

  } finally {
    // 关闭浏览器
    if (browser) {
      console.log('\n🚪 正在关闭浏览器...');
      await browser.close();
      console.log('✅ 浏览器已关闭');
    }
  }
}

// ─── 主函数 ────────────────────────────────────────────────────────────────

async function main() {
  console.log('');

  // 检查 Cookie 文件
  console.log('🔍 检查 Cookie 文件...');
  const cookieCheck = checkCookieFile();

  if (cookieCheck.valid) {
    console.log(`✅ Cookie 文件有效`);
    console.log(`   Cookie 数量: ${cookieCheck.cookieCount}`);
    console.log(`   Cookie 文件: ${CONFIG.cookieFile}`);
    console.log('');
    console.log('如果需要重新登录，请删除 Cookie 文件后重新运行脚本：');
    console.log(`  rm ${CONFIG.cookieFile}`);
    console.log('');
    return { success: true, message: 'Cookie 已存在且有效', skipLogin: true };
  }

  console.log(`⚠️  ${cookieCheck.reason}`);
  console.log('');

  // 执行登录流程
  const result = await performLogin();

  if (result.success) {
    console.log('\n' + '═'.repeat(60));
    console.log('  ✅ 登录完成！');
    console.log('═'.repeat(60));
    console.log('');
    console.log(`用户: ${result.userInfo.username}`);
    console.log(`Cookie 数量: ${result.cookieCount}`);
    console.log(`Cookie 文件: ${CONFIG.cookieFile}`);
    console.log('');
    console.log('现在可以使用自动化脚本发布文章了：');
    console.log('  node scripts/publish/publish-zhihu-article.js <article-file>');
    console.log('');
  } else {
    console.log('\n' + '═'.repeat(60));
    console.log('  ❌ 登录失败');
    console.log('═'.repeat(60));
    console.log('');
    console.log('错误:', result.error);
    console.log('');

    process.exit(1);
  }

  return result;
}

// 运行主函数
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { main, checkCookieFile };
