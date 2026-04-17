#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const COOKIE_FILE = path.join(__dirname, '../auth/zhihu-cookies-latest.json');

async function verifyZhihuLogin() {
  console.log('🔍 验证知乎登录状态...\n');

  // 读取 Cookie
  if (!fs.existsSync(COOKIE_FILE)) {
    console.log('❌ Cookie 文件不存在');
    console.log('   请运行登录脚本重新登录:');
    console.log('   node ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/scripts/zhihu-auto-operations.js login\n');
    process.exit(1);
  }

  const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf8'));
  console.log(`✅ Cookie 文件存在 (${cookies.length} 个 Cookie)\n`);

  // 启动浏览器验证
  const browser = await chromium.launch({
    headless: true
  });

  try {
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const page = await context.newPage();

    console.log('🌐 访问知乎首页...\n');

    await page.goto('https://www.zhihu.com', {
      waitUntil: 'networkidle'
    });

    // 等待页面加载
    await page.waitForTimeout(2000);

    // 检查是否登录
    const isLoggedIn = await page.evaluate(() => {
      // 检查页面是否包含登录按钮（未登录状态）
      const loginButton = document.querySelector('.SignFlowModal');
      const signInButton = document.querySelector('.sign-in-button');
      const userAvatar = document.querySelector('.AppHeader-profile');
      const userName = document.querySelector('.AppHeader-profile .Popover-content');

      return !loginButton && !signInButton && (userAvatar || userName);
    });

    if (isLoggedIn) {
      console.log('✅ 登录状态：已登录\n');

      // 获取用户名
      try {
        const userName = await page.evaluate(() => {
          const profileElement = document.querySelector('.AppHeader-profile');
          return profileElement ? profileElement.getAttribute('aria-label') : '未知用户';
        });
        console.log(`👤 用户名: ${userName}\n`);
      } catch (err) {
        console.log('👤 用户名: 无法获取\n');
      }

      await browser.close();
      process.exit(0);
    } else {
      console.log('❌ 登录状态：未登录（Cookie 可能已过期）\n');
      console.log('📝 请运行登录脚本重新登录:');
      console.log('   node ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/scripts/zhihu-auto-operations.js login\n');

      await browser.close();
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ 验证失败:', error.message, '\n');

    if (error.message.includes('重定向到安全验证页面') || error.message.includes('302')) {
      console.log('🔐 知乎安全验证页面重定向\n');
      console.log('📝 Cookie 可能已过期，请重新登录:');
      console.log('   node ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/scripts/zhihu-auto-operations.js login\n');
    }

    await browser.close();
    process.exit(1);
  }
}

verifyZhihuLogin().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
