#!/usr/bin/env node

/**
 * login-zhihu-save-cookies.js
 *
 * 打开知乎登录页面，手动登录后保存 Cookie
 *
 * 使用方法：
 *   node scripts/login-zhihu-save-cookies.js
 *
 * 流程：
 *   1. 启动 Chrome 浏览器
 *   2. 打开知乎登录页面
 *   3. 用户手动扫码或密码登录
 *   4. 按回车键确认登录成功
 *   5. 自动提取并保存 Cookie
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const WORKSPACE_DIR    = path.join(process.env.HOME, '.openclaw/workspace/知乎自动运营');
const AUTH_DIR         = path.join(WORKSPACE_DIR, '🛠️自动化系统/auth');
const COOKIE_FILE      = path.join(AUTH_DIR, 'cookies.json');
const SESSION_FILE     = path.join(AUTH_DIR, 'session.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  知乎登录与 Cookie 保存');
  console.log('═'.repeat(60));
  console.log('');

  // 启动浏览器
  console.log('🌐 正在启动 Chrome...');
  const browser = await chromium.launch({
    headless: false,  // 非无头模式，用户可以看到浏览器
    slowMo: 50,      // 减慢操作速度，便于观察
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  });

  const page = await context.newPage();

  // 导航到知乎登录页面
  console.log('📱 正在打开知乎登录页面...');
  await page.goto('https://www.zhihu.com/signin', {
    waitUntil: 'networkidle',
  });

  console.log('');
  console.log('✅ 浏览器已启动，请在浏览器中完成登录');
  console.log('');
  console.log('💡 提示：');
  console.log('   1. 可以使用扫码登录或密码登录');
  console.log('   2. 登录成功后，按 Enter 键继续');
  console.log('   3. 脚本将自动提取并保存 Cookie');
  console.log('');
  console.log('按 Enter 键继续（登录成功后）...');

  // 等待用户按回车键
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  console.log('');
  console.log('🔍 正在检查登录状态...');

  // 检查登录状态
  const isLoggedIn = await page.evaluate(() => {
    // 检查页面是否包含用户信息
    const userButton = document.querySelector('.AppHeader-profile');
    return userButton !== null;
  });

  if (!isLoggedIn) {
    console.warn('⚠️  未检测到登录状态，请确认是否登录成功');
    console.warn('   继续提取 Cookie（可能无效）...');
  } else {
    console.log('✅ 检测到登录状态');
  }

  // 提取 Cookie
  console.log('');
  console.log('📦 正在提取 Cookie...');
  const cookies = await context.cookies();
  const zhihuCookies = cookies.filter(cookie =>
    cookie.domain.includes('zhihu.com')
  );

  console.log(`✅ 提取到 ${zhihuCookies.length} 个知乎 Cookie`);

  // 显示关键 Cookie
  const keyCookies = ['z_c0', 'd_c0'];
  keyCookies.forEach(name => {
    const cookie = zhihuCookies.find(c => c.name === name);
    if (cookie) {
      const valuePreview = cookie.value ? `${cookie.value.substring(0, 20)}...` : '';
      console.log(`   ${name}: ${valuePreview}`);
    }
  });

  // 保存 Cookie
  ensureDir(AUTH_DIR);
  fs.writeFileSync(COOKIE_FILE, JSON.stringify(zhihuCookies, null, 2), 'utf8');
  console.log(`\n💾 Cookie 已保存到: ${COOKIE_FILE}`);

  // 保存 Session（持久化上下文）
  console.log('💾 正在保存 Session...');
  await context.storageState({ path: SESSION_FILE });
  console.log(`✅ Session 已保存到: ${SESSION_FILE}`);

  console.log('');
  console.log('═'.repeat(60));
  console.log('  ✅ 完成');
  console.log('═'.repeat(60));
  console.log('');
  console.log('📝 Cookie 信息：');
  console.log(`   文件位置: ${COOKIE_FILE}`);
  console.log(`   Cookie 数量: ${zhihuCookies.length}`);
  console.log(`   Session 文件: ${SESSION_FILE}`);
  console.log('');

  // 等待用户关闭浏览器
  console.log('💡 按 Enter 键关闭浏览器...');
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  await browser.close();
  console.log('✅ 浏览器已关闭');
}

main().catch(err => {
  console.error('❌ 发生错误:', err);
  console.error(err.stack);
  process.exit(1);
});
