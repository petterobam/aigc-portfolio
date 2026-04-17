#!/usr/bin/env node

/**
 * zhihu-cookie-auto-extractor.js
 *
 * 知乎 Cookie 自动提取器（智能检测）
 *
 * 功能：
 *   1. 自动检测已登录的 Chrome 浏览器
 *   2. 提取知乎 Cookie
 *   3. 保存到正确的位置
 *   4. 验证 Cookie 有效性
 *
 * 智能检测策略：
 *   - 尝试通过 Playwright MCP 检测已登录的浏览器
 *   - 如果没有，尝试打开知乎登录页面等待用户登录
 *   - 提供手动提取 Cookie 的指南
 *
 * 使用方法：
 *   node scripts/zhihu-cookie-auto-extractor.js
 *
 * 依赖：
 *   - playwright
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const ZHIHU_AUTO_DIR = path.join(WORKSPACE_DIR, '知乎自动运营');
const AUTO_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统');
const AUTH_DIR = path.join(AUTO_DIR, 'auth');

const CONFIG = {
  // Cookie 文件路径
  cookieFile: path.join(AUTH_DIR, 'zhihu-cookies-latest.json'),

  // CDP 端口范围（尝试检测）
  cdpPorts: [9222, 9223, 9224, 9225, 9226],

  // 知乎 URL
  urls: {
    login: 'https://www.zhihu.com/signin',
    home: 'https://www.zhihu.com'
  }
};

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(AUTH_DIR);

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

// ─── CDP 检测 ─────────────────────────────────────────────────────────────────

/**
 * 检查 CDP 端口是否可达
 */
function isCdpAvailable(port) {
  return new Promise(resolve => {
    const req = http.get(`http://localhost:${port}/json/version`, res => {
      resolve(res.statusCode === 200);
      res.resume();
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

/**
 * 查找可用的 CDP 端口
 */
async function findAvailableCdpPort() {
  console.log('🔍 正在检测 CDP 端口...');

  for (const port of CONFIG.cdpPorts) {
    const available = await isCdpAvailable(port);
    if (available) {
      console.log(`   ✅ 找到可用的 CDP 端口: ${port}`);
      return port;
    }
  }

  console.log('   ❌ 未找到可用的 CDP 端口');
  return null;
}

/**
 * 通过 CDP 提取 Cookie
 */
async function extractCookiesViaCDP(port) {
  const cdpUrl = `http://localhost:${port}`;
  console.log(`\n🔌 连接 Chrome CDP: ${cdpUrl}`);

  let browser;
  try {
    browser = await chromium.connectOverCDP(cdpUrl);

    const contexts = browser.contexts();
    if (contexts.length === 0) {
      throw new Error('未找到浏览器上下文');
    }

    const context = contexts[0];
    const cookies = await context.cookies();

    // 过滤知乎 Cookie
    const zhihuCookies = cookies.filter(c =>
      c.domain.includes('zhihu.com')
    );

    // 检查关键 Cookie
    const hasDc0 = zhihuCookies.some(c => c.name === 'd_c0' && c.value);
    const hasZc0 = zhihuCookies.some(c => c.name === 'z_c0' && c.value);

    if (!hasDc0 && !hasZc0) {
      throw new Error('Cookie 中未找到 d_c0 或 z_c0，可能未登录知乎');
    }

    console.log(`\n✅ 成功提取到 ${zhihuCookies.length} 个知乎 Cookie`);
    console.log(`   - d_c0: ${hasDc0 ? '✅' : '❌'}`);
    console.log(`   - z_c0: ${hasZc0 ? '✅' : '❌'}`);

    await browser.close();
    return zhihuCookies;

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

// ─── 手动登录流程 ─────────────────────────────────────────────────────────────

/**
 * 执行手动登录流程
 */
async function performManualLogin() {
  console.log('\n' + '═'.repeat(60));
  console.log('  手动登录流程');
  console.log('═'.repeat(60));
  console.log('');

  let browser;
  let context;
  let page;

  try {
    console.log('🌐 启动浏览器...');
    browser = await chromium.launch({
      headless: false,  // 显示浏览器窗口
      slowMo: 50
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    page = await context.newPage();

    // 导航到知乎登录页
    console.log(`📄 导航到知乎登录页: ${CONFIG.urls.login}`);
    await page.goto(CONFIG.urls.login, { waitUntil: 'networkidle' });

    console.log('\n' + '═'.repeat(60));
    console.log('  请在浏览器中完成登录');
    console.log('═'.repeat(60));
    console.log('');
    console.log('💡 提示:');
    console.log('   1. 使用扫码登录或手机号登录');
    console.log('   2. 完成登录后，按 Ctrl+C 退出脚本');
    console.log('   3. 脚本会自动检测登录状态并提取 Cookie');
    console.log('');
    console.log('⏱️  等待登录中...（按 Ctrl+C 退出）');
    console.log('');

    // 定期检查登录状态
    const checkInterval = 2000;  // 2 秒检查一次
    const startTime = Date.now();
    let checkCount = 0;

    while (true) {
      await page.waitForTimeout(checkInterval);
      checkCount++;

      // 检查是否已登录
      try {
        const isLoggedIn = await page.evaluate(() => {
          const header = document.querySelector('.AppHeader-profileText, .AppHeader-avatar');
          return header !== null;
        });

        if (isLoggedIn) {
          console.log('\n✅ 检测到登录成功！');

          // 提取 Cookie
          console.log('🍪 提取 Cookie...');
          const cookies = await context.cookies();

          // 过滤知乎 Cookie
          const zhihuCookies = cookies.filter(c =>
            c.domain.includes('zhihu.com')
          );

          console.log(`   提取到 ${zhihuCookies.length} 个 Cookie`);

          return zhihuCookies;
        }

        // 每 30 秒显示一次进度
        if (checkCount % 15 === 0) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          console.log(`   ⏱️  已等待 ${elapsed} 秒...`);
        }

      } catch (error) {
        // 检查时出错，继续重试
        console.warn(`   ⚠️  检查登录状态失败: ${error.message}`);
      }
    }

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

// ─── 主函数 ────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('═'.repeat(60));
  console.log('  知乎 Cookie 自动提取器');
  console.log('═'.repeat(60));
  console.log('');

  // 检查 Cookie 文件
  console.log('🔍 检查 Cookie 文件...');
  const cookieCheck = checkCookieFile();

  if (cookieCheck.valid) {
    console.log(`✅ Cookie 文件有效`);
    console.log(`   Cookie 数量: ${cookieCheck.cookieCount}`);
    console.log(`   Cookie 文件: ${CONFIG.cookieFile}`);
    console.log('');
    console.log('如果需要重新提取 Cookie，请删除 Cookie 文件后重新运行脚本：');
    console.log(`  rm ${CONFIG.cookieFile}`);
    console.log('');
    return { success: true, message: 'Cookie 已存在且有效', skipLogin: true };
  }

  console.log(`⚠️  ${cookieCheck.reason}`);
  console.log('');

  // 尝试通过 CDP 提取 Cookie
  const cdpPort = await findAvailableCdpPort();

  if (cdpPort) {
    try {
      console.log('\n📦 尝试通过 CDP 提取 Cookie...');
      const cookies = await extractCookiesViaCDP(cdpPort);

      saveCookies(cookies);

      console.log('\n' + '═'.repeat(60));
      console.log('  ✅ Cookie 提取成功！');
      console.log('═'.repeat(60));
      console.log('');
      console.log(`Cookie 文件: ${CONFIG.cookieFile}`);
      console.log(`Cookie 数量: ${cookies.length}`);
      console.log('');
      console.log('现在可以使用自动化脚本发布文章了：');
      console.log('  node scripts/publish/publish-zhihu-article.js <article-file>');
      console.log('');

      return { success: true, method: 'CDP', cookieCount: cookies.length };

    } catch (error) {
      console.log(`\n⚠️  CDP 提取失败: ${error.message}`);
      console.log('   尝试手动登录流程...');
    }
  }

  // 手动登录流程
  try {
    const cookies = await performManualLogin();

    saveCookies(cookies);

    console.log('\n' + '═'.repeat(60));
    console.log('  ✅ Cookie 提取成功！');
    console.log('═'.repeat(60));
    console.log('');
    console.log(`Cookie 文件: ${CONFIG.cookieFile}`);
    console.log(`Cookie 数量: ${cookies.length}`);
    console.log('');
    console.log('现在可以使用自动化脚本发布文章了：');
    console.log('  node scripts/publish/publish-zhihu-article.js <article-file>');
    console.log('');

    return { success: true, method: 'manual', cookieCount: cookies.length };

  } catch (error) {
    console.log('\n' + '═'.repeat(60));
    console.log('  ❌ Cookie 提取失败');
    console.log('═'.repeat(60));
    console.log('');
    console.log('错误:', error.message);
    console.log('');
    console.log('💡 建议：');
    console.log('   1. 确保 Chrome 浏览器已启动并已登录知乎');
    console.log('   2. 检查网络连接是否正常');
    console.log('   3. 参考手动提取 Cookie 的指南：');
    console.log(`      ${AUTO_DIR}/docs/manual-cookie-export-guide.md`);
    console.log('');

    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { main, checkCookieFile };
