#!/usr/bin/env node
/**
 * zhihu-login-save-cookies.js
 *
 * 打开浏览器，访问知乎，等待用户手动登录，然后保存 Cookie
 *
 * 使用方法：
 *   node scripts/zhihu-login-save-cookies.js [--headful]
 *
 * 参数：
 *   --headful: 显示浏览器窗口（默认）
 *   --headless: 无头模式（不显示窗口，用于已经登录的情况）
 *
 * 流程：
 *   1. 启动 Playwright 浏览器
 *   2. 访问知乎登录页面
 *   3. 等待用户手动登录（检测是否登录成功）
 *   4. 登录成功后自动保存 Cookie
 *   5. 关闭浏览器
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const ZHIHU_URL = 'https://www.zhihu.com';
const LOGIN_URL = 'https://www.zhihu.com/signin';
const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const COOKIES_DIR = path.join(WORKSPACE_DIR, 'cookies');
const COOKIE_FILE = path.join(COOKIES_DIR, 'zhihu-latest.json');

/**
 * 检查是否已登录知乎
 */
async function checkLoggedIn(page) {
  try {
    // 检查页面是否包含登录按钮（如果存在则未登录）
    const loginButton = await page.$('.SignFlowHomepage-button, .Button--primary');
    if (loginButton) {
      console.log('❌ 未登录（检测到登录按钮）');
      return false;
    }

    // 检查页面是否包含用户头像（如果存在则已登录）
    const avatar = await page.$('.Avatar, .AppHeader-profile');
    if (avatar) {
      console.log('✅ 已登录（检测到用户头像）');
      return true;
    }

    // 检查 Cookie 是否包含关键登录态
    const cookies = await page.context().cookies();
    const hasDc0 = cookies.some(c => c.name === 'd_c0' && c.value);
    const hasZc0 = cookies.some(c => c.name === 'z_c0' && c.value);

    if (hasDc0 && hasZc0) {
      console.log('✅ 已登录（检测到关键 Cookie）');
      return true;
    }

    console.log('❌ 未登录（未检测到登录态）');
    return false;
  } catch (error) {
    console.log('❌ 登录检查失败:', error.message);
    return false;
  }
}

/**
 * 保存 Cookie
 */
async function saveCookies(context) {
  try {
    const cookies = await context.cookies();
    const zhihuCookies = cookies.filter(c =>
      c.domain === 'zhihu.com' ||
      c.domain === '.zhihu.com'
    );

    console.log(`\n💾 正在保存 Cookie...`);
    console.log(`   共 ${zhihuCookies.length} 个知乎 Cookie`);

    // 检查关键 Cookie
    const criticalCookies = ['d_c0', 'z_c0'];
    const missingCookies = criticalCookies.filter(name =>
      !zhihuCookies.some(c => c.name === name && c.value)
    );

    if (missingCookies.length > 0) {
      console.warn(`⚠️  缺少关键 Cookie: ${missingCookies.join(', ')}`);
    } else {
      console.log(`✅ 关键 Cookie 检查通过`);
    }

    // 保存 Cookie
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const cookieFile = path.join(COOKIES_DIR, `zhihu-session-${timestamp}.json`);
    fs.writeFileSync(cookieFile, JSON.stringify(zhihuCookies, null, 2));

    // 同时保存到 zhihu-latest.json
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(zhihuCookies, null, 2));

    console.log(`\n✅ Cookie 已保存：`);
    console.log(`   ${cookieFile}`);
    console.log(`   ${COOKIE_FILE}`);

    return true;
  } catch (error) {
    console.error(`❌ 保存 Cookie 失败:`, error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('═'.repeat(60));
  console.log('  知乎登录助手');
  console.log('═'.repeat(60));
  console.log('');

  // 解析参数
  const args = process.argv.slice(2);
  const headless = args.includes('--headless');

  // 确保目录存在
  if (!fs.existsSync(COOKIES_DIR)) {
    fs.mkdirSync(COOKIES_DIR, { recursive: true });
  }

  // 启动浏览器
  console.log('🌐 正在启动浏览器...');
  const browser = await chromium.launch({
    headless: headless,
    channel: 'chrome', // 使用系统安装的 Chrome
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  console.log('✅ 浏览器已启动\n');

  try {
    // 访问知乎
    console.log(`📄 正在访问知乎：${ZHIHU_URL}`);
    await page.goto(ZHIHU_URL, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ 页面加载完成\n');

    // 检查登录状态
    const isLoggedIn = await checkLoggedIn(page);

    if (!isLoggedIn && !headless) {
      // 未登录，进入登录页面
      console.log('📄 正在跳转到登录页面...');
      await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
      console.log('✅ 已到达登录页面\n');

      console.log('═'.repeat(60));
      console.log('  ⏳ 请在浏览器中手动完成登录');
      console.log('═'.repeat(60));
      console.log('');
      console.log('💡 提示：');
      console.log('   1. 扫描二维码登录（推荐）');
      console.log('   2. 或使用手机号登录');
      console.log('   3. 登录成功后脚本会自动检测并保存 Cookie');
      console.log('');
      console.log('⏸️  等待登录中...\n');

      // 等待登录成功（最多等待 5 分钟）
      let loginAttempts = 0;
      const maxAttempts = 60; // 60 次，每次 5 秒 = 5 分钟

      while (loginAttempts < maxAttempts) {
        await page.waitForTimeout(5000); // 每 5 秒检查一次
        loginAttempts++;

        const nowLoggedIn = await checkLoggedIn(page);
        if (nowLoggedIn) {
          console.log('\n✅ 检测到登录成功！');
          break;
        }

        process.stdout.write(`   检查中... (${loginAttempts}/${maxAttempts})\r`);
      }

      console.log(''); // 换行

      // 最终检查
      const finalLoggedIn = await checkLoggedIn(page);
      if (!finalLoggedIn) {
        console.warn('\n⚠️  登录超时，未检测到登录成功');
        console.warn('   Cookie 可能无法正常使用');
      }
    } else if (!isLoggedIn && headless) {
      console.error('❌ 无头模式下检测到未登录');
      console.error('   请使用 --headful 参数手动登录');
      await browser.close();
      process.exit(1);
    }

    // 保存 Cookie
    console.log('');
    console.log('═'.repeat(60));
    console.log('  💾 保存 Cookie');
    console.log('═'.repeat(60));
    const saved = await saveCookies(context);

    if (saved) {
      console.log('\n✅ 完成！');
    } else {
      console.log('\n❌ 保存 Cookie 失败');
    }

  } catch (error) {
    console.error('\n❌ 发生错误:', error.message);
    console.error(error.stack);
  } finally {
    // 关闭浏览器
    console.log('\n🚪 正在关闭浏览器...');
    await browser.close();
    console.log('✅ 浏览器已关闭\n');
  }
}

// 运行主函数
main().catch(err => {
  console.error(err);
  process.exit(1);
});
