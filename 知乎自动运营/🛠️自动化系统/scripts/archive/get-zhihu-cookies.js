#!/usr/bin/env node

/**
 * 知乎 Cookie 提取器
 *
 * 从已登录的 Chrome 浏览器提取知乎 Cookie
 * 使用 Chrome DevTools Protocol (CDP) 连接到正在运行的 Chrome
 *
 * 使用方法：
 * node get-zhihu-cookies.js
 *
 * 前提条件：
 * 1. Chrome 浏览器必须正在运行且已登录知乎
 * 2. 需要以调试模式启动 Chrome：
 *    macOS: /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
 *    Linux: google-chrome --remote-debugging-port=9222
 */

const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');

// Cookie 文件路径
const COOKIE_FILE = path.join(__dirname, '../../auth/cookies.json');
const ZHIHU_DOMAIN = '.zhihu.com';

/**
 * 从浏览器提取 Cookie
 */
async function extractCookies() {
  console.log('========================================');
  console.log('  知乎 Cookie 提取器');
  console.log('========================================\n');

  try {
    // 连接到 Chrome
    console.log('🔌 正在连接 Chrome (端口 9222)...');
    const client = await CDP({ port: 9222 });
    const { Network, Page, Runtime } = client;

    // 启用 Network 域
    await Network.enable();
    await Page.enable();

    console.log('✅ 已连接到 Chrome\n');

    // 获取所有 Cookie
    console.log('📦 正在提取 Cookie...');
    const cookies = await Network.getAllCookies();

    // 过滤出知乎相关的 Cookie
    const zhihuCookies = cookies.filter(cookie =>
      cookie.domain.includes(ZHIHU_DOMAIN)
    );

    console.log(`✅ 找到 ${zhihuCookies.length} 个知乎 Cookie\n`);

    // 显示 Cookie 列表（隐藏敏感信息）
    console.log('📋 Cookie 列表：\n');
    zhihuCookies.forEach((cookie, index) => {
      const maskedValue = cookie.value ? `${cookie.value.substring(0, 10)}...` : '';
      console.log(`${index + 1}. ${cookie.name}: ${maskedValue}`);
      console.log(`   域名: ${cookie.domain}`);
      console.log(`   路径: ${cookie.path}`);
      console.log(`   过期: ${cookie.expires ? new Date(cookie.expires * 1000).toLocaleString('zh-CN') : '会话 Cookie'}`);
      console.log(`   Secure: ${cookie.secure}, HttpOnly: ${cookie.httpOnly}\n`);
    });

    // 检查关键 Cookie 是否存在
    const criticalCookies = ['d_c0', 'z_c0'];
    const missingCookies = criticalCookies.filter(name => !zhihuCookies.find(c => c.name === name));

    if (missingCookies.length > 0) {
      console.log(`⚠️  警告: 缺少关键 Cookie: ${missingCookies.join(', ')}`);
      console.log('⚠️  这可能意味着未登录或登录已失效\n');
    } else {
      console.log('✅ 关键 Cookie 检查通过\n');
    }

    // 保存 Cookie 到文件
    console.log('💾 正在保存 Cookie...');
    const cookieDir = path.dirname(COOKIE_FILE);
    if (!fs.existsSync(cookieDir)) {
      fs.mkdirSync(cookieDir, { recursive: true });
    }

    // 格式化 Cookie 供 Playwright 使用
    const playwrightCookies = zhihuCookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain,
      path: cookie.path,
      expires: cookie.expires || -1,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite
    }));

    fs.writeFileSync(COOKIE_FILE, JSON.stringify(playwrightCookies, null, 2));

    console.log(`✅ Cookie 已保存到: ${COOKIE_FILE}`);
    console.log(`📊 共保存 ${playwrightCookies.length} 个 Cookie\n`);

    // 关闭连接
    await client.close();

    console.log('✅ 提取完成');
    console.log('💡 提示: Cookie 有效期通常为 30 天，建议定期刷新\n');

    return true;

  } catch (error) {
    if (error.message.includes('connect ECONNREFUSED')) {
      console.error('❌ 无法连接到 Chrome');
      console.error('');
      console.error('💡 请确保 Chrome 以调试模式运行：');
      console.error('');
      console.error('  macOS:');
      console.error('  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222');
      console.error('');
      console.error('  Linux:');
      console.error('  google-chrome --remote-debugging-port=9222');
    } else {
      console.error('❌ 提取 Cookie 失败:', error.message);
      console.error(error.stack);
    }
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  const success = await extractCookies();
  process.exit(success ? 0 : 1);
}

// 运行主函数
main().catch(console.error);
