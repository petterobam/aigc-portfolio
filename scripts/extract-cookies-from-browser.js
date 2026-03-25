#!/usr/bin/env node

/**
 * extract-cookies-from-browser.js
 *
 * 从已运行的 Chrome 浏览器提取 Cookie（通过 CDP 协议）
 *
 * 原理：
 *   Playwright MCP 工具（browser_navigate、browser_snapshot 等）连接的是用户
 *   已登录的 Chrome 实例。本脚本通过 connectOverCDP 直接 attach 到同一个 Chrome，
 *   提取真实 session cookie（包括 httpOnly），无需任何手动登录步骤。
 *
 * 使用前提：
 *   Chrome 需要以调试端口启动，或 Playwright MCP 已暴露 CDP 端口。
 *   启动方式（任选一种）：
 *     方式 A - 命令行启动 Chrome：
 *       /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
 *         --remote-debugging-port=9222 --no-first-run --no-default-browser-check
 *     方式 B - Playwright MCP 已在运行（默认端口 9222）
 *
 * 使用方法：
 *   node scripts/extract-cookies-from-browser.js [--port 9222] [--url http://localhost:9222]
 *
 * 输出：
 *   cookies/fanqie-live-session-<timestamp>.json   ← 番茄 cookie（含 httpOnly）
 *   cookies/latest.json                            ← 软链接/最新副本，供脚本直接引用
 *
 * 其他脚本加载方式：
 *   const { loadLatestCookies } = require('./scripts/extract-cookies-from-browser');
 *   await loadLatestCookies(browserContext);
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const DEFAULT_CDP_PORT = 9222;
const WORKSPACE_DIR    = path.join(process.env.HOME, '.openclaw/workspace');
const COOKIES_DIR      = path.join(WORKSPACE_DIR, 'cookies');
const LATEST_FILE      = path.join(COOKIES_DIR, 'latest.json');

/** 哪些域名的 cookie 属于番茄登录态 */
const FANQIE_DOMAINS = [
  'fanqienovel.com',
  '.fanqienovel.com',
  'bytedance.com',
  '.bytedance.com',
  'snssdk.com',
  '.snssdk.com',
  'xxbg.snssdk.com',
  'bytedance.larkoffice.com',
];

/** 登录态关键 cookie 名称（存在即认为已登录） */
const SESSION_COOKIE_NAMES = [
  'sessionid',
  'sid_tt',
  'uid_tt',
  'odin_tt',
];

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

/**
 * 检查 CDP 端口是否可达（HTTP /json/version）
 * @param {number} port
 * @returns {Promise<boolean>}
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
 * 尝试从 CDP /json/version 获取 webSocketDebuggerUrl
 * @param {number} port
 * @returns {Promise<string|null>}
 */
function getCdpWsUrl(port) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}/json/version`, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const info = JSON.parse(data);
          resolve(info.webSocketDebuggerUrl || null);
        } catch {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

// ─── Cookie 提取核心 ──────────────────────────────────────────────────────────

/**
 * 通过 connectOverCDP 连接已运行的 Chrome，提取番茄相关 cookie。
 * @param {number} port  CDP 调试端口，默认 9222
 * @returns {Promise<{cookies: Array, sessionValid: boolean, file: string}>}
 */
async function extractCookiesViaCDP(port = DEFAULT_CDP_PORT) {
  const cdpUrl = `http://localhost:${port}`;
  console.log(`\n🔌 连接 Chrome CDP: ${cdpUrl}`);

  let browser;
  try {
    browser = await chromium.connectOverCDP(cdpUrl);
  } catch (err) {
    throw new Error(
      `无法连接 CDP（端口 ${port}）：${err.message}\n` +
      `请确保 Chrome 已以调试端口启动，参见脚本顶部注释。`
    );
  }

  try {
    // 取第一个浏览器上下文（用户主 profile）
    const contexts = browser.contexts();
    if (contexts.length === 0) {
      throw new Error('CDP 连接成功，但未找到任何浏览器上下文（context）。');
    }
    const context = contexts[0];

    // 拉取全部 cookie，然后筛选番茄域名
    const allCookies = await context.cookies();
    console.log(`📦 Chrome 中共有 ${allCookies.length} 个 cookie`);

    const fanqieCookies = allCookies.filter(c =>
      FANQIE_DOMAINS.some(d => c.domain === d || c.domain.endsWith(d))
    );
    console.log(`🍅 筛选出番茄相关 cookie：${fanqieCookies.length} 个`);

    // 检查登录态
    const sessionValid = SESSION_COOKIE_NAMES.some(name =>
      fanqieCookies.some(c => c.name === name && c.value)
    );

    if (!sessionValid) {
      console.warn('⚠️  未检测到有效登录态 cookie（sessionid / sid_tt 等）');
      console.warn('   请确认 Chrome 中番茄小说已处于登录状态。');
    } else {
      const sid = fanqieCookies.find(c => SESSION_COOKIE_NAMES.includes(c.name));
      const exp = sid?.expires
        ? new Date(sid.expires * 1000).toLocaleString('zh-CN')
        : '未知';
      console.log(`✅ 登录态有效`);
      console.log(`   关键 cookie：${sid.name}，过期时间：${exp}`);
    }

    // 统计 httpOnly 数量（传统 document.cookie 无法获取这些）
    const httpOnlyCount = fanqieCookies.filter(c => c.httpOnly).length;
    console.log(`   httpOnly cookie：${httpOnlyCount} 个（含登录 token）`);
    console.log(`   普通 cookie：${fanqieCookies.length - httpOnlyCount} 个`);

    // 保存到文件
    ensureDir(COOKIES_DIR);
    const outFile = path.join(COOKIES_DIR, `fanqie-live-session-${timestamp()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(fanqieCookies, null, 2), 'utf8');
    console.log(`\n💾 已保存：${outFile}`);

    // 同时覆写 latest.json，方便其他脚本直接引用
    fs.writeFileSync(LATEST_FILE, JSON.stringify(fanqieCookies, null, 2), 'utf8');
    console.log(`🔗 已更新：${LATEST_FILE}`);

    return { cookies: fanqieCookies, sessionValid, file: outFile };

  } finally {
    // connectOverCDP 不应该关闭用户的 Chrome，只需断开连接
    await browser.close();
  }
}

// ─── 注入 cookie 到 Playwright context（供其他脚本 require 使用） ─────────────

/**
 * 将 latest.json 中的 cookie 注入到 Playwright BrowserContext。
 * 用法：在任意脚本的 launchPersistentContext 或 connectOverCDP 之后调用。
 *
 * @param {import('playwright').BrowserContext} context
 * @param {string} [cookieFile]  指定 cookie 文件，不传则使用 latest.json
 * @returns {Promise<number>} 注入的 cookie 数量
 */
async function loadLatestCookies(context, cookieFile) {
  const file = cookieFile || LATEST_FILE;
  if (!fs.existsSync(file)) {
    console.warn(`⚠️  Cookie 文件不存在：${file}`);
    console.warn('   请先运行：node scripts/extract-cookies-from-browser.js');
    return 0;
  }
  const cookies = JSON.parse(fs.readFileSync(file, 'utf8'));
  await context.addCookies(cookies);
  console.log(`✅ 已注入 ${cookies.length} 个 cookie（来自 ${path.basename(file)}）`);
  return cookies.length;
}

/**
 * 检查 latest.json 中的登录态 cookie 是否过期。
 * @returns {{ valid: boolean, expiresAt: Date|null, daysLeft: number }}
 */
function checkCookieExpiry() {
  if (!fs.existsSync(LATEST_FILE)) {
    return { valid: false, expiresAt: null, daysLeft: 0 };
  }
  const cookies = JSON.parse(fs.readFileSync(LATEST_FILE, 'utf8'));
  const sessionCookie = cookies.find(c => SESSION_COOKIE_NAMES.includes(c.name));
  if (!sessionCookie) {
    return { valid: false, expiresAt: null, daysLeft: 0 };
  }
  const expiresAt = sessionCookie.expires > 0
    ? new Date(sessionCookie.expires * 1000)
    : null;
  if (!expiresAt) {
    return { valid: true, expiresAt: null, daysLeft: Infinity }; // session cookie
  }
  const daysLeft = Math.floor((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
  return { valid: daysLeft > 0, expiresAt, daysLeft };
}

// ─── CLI 入口 ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  番茄小说 Cookie 提取器（CDP / 已有 Chrome 实例）');
  console.log('═'.repeat(60));

  // 解析命令行参数
  const args = process.argv.slice(2);
  let port = DEFAULT_CDP_PORT;
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--port' || args[i] === '-p') && args[i + 1]) {
      port = parseInt(args[++i], 10);
    }
  }

  // 检查 CDP 是否可达
  console.log(`\n🔍 检查 CDP 端口 ${port}...`);
  const available = await isCdpAvailable(port);
  if (!available) {
    console.error(`\n❌ CDP 端口 ${port} 不可达。`);
    console.error('\n📋 启动 Chrome 调试模式的方法：');
    console.error('');
    console.error('  方法 A（推荐）—— 命令行启动：');
    console.error('    /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\');
    console.error('      --remote-debugging-port=9222 \\');
    console.error('      --no-first-run --no-default-browser-check \\');
    console.error('      --profile-directory=Default');
    console.error('');
    console.error('  方法 B —— 给现有 Chrome 添加调试端口（需关闭后重新启动）：');
    console.error('    先完全退出 Chrome（Cmd+Q），然后用方法 A 启动。');
    console.error('');
    console.error('  方法 C —— 使用 Playwright persistent context 备选方案：');
    console.error('    node scripts/login-save-cookies.js');
    process.exit(1);
  }

  console.log(`✅ CDP 端口 ${port} 可达`);

  // 显示 Chrome 版本信息
  try {
    const wsUrl = await getCdpWsUrl(port);
    if (wsUrl) console.log(`   WebSocket URL: ${wsUrl}`);
  } catch { /* 非关键信息，忽略 */ }

  // 提取 cookie
  try {
    const result = await extractCookiesViaCDP(port);

    console.log('\n' + '═'.repeat(60));
    if (result.sessionValid) {
      console.log('  ✅ 提取完成，登录态有效');
    } else {
      console.log('  ⚠️  提取完成，但登录态可能无效');
    }
    console.log('═'.repeat(60));
    console.log(`\n  Cookie 数量：${result.cookies.length}`);
    console.log(`  保存位置  ：${result.file}`);
    console.log(`  快捷引用  ：${LATEST_FILE}`);

    // 检查有效期
    const expiry = checkCookieExpiry();
    if (expiry.expiresAt) {
      console.log(`  登录过期  ：${expiry.expiresAt.toLocaleString('zh-CN')}（剩余 ${expiry.daysLeft} 天）`);
      if (expiry.daysLeft < 3) {
        console.log('\n  ⚠️  Cookie 即将过期，建议重新提取。');
      }
    }

    console.log('\n  下一步操作：');
    console.log('    node scripts/fetch-story-list-chrome-v4.js   # 拉取故事列表');
    console.log('    node scripts/daily-data-monitor.js           # 每日数据监控');
    console.log('');

  } catch (err) {
    console.error(`\n❌ 提取失败：${err.message}`);
    process.exit(1);
  }
}

// 如果直接执行则运行 main；如果被 require 则只导出工具函数
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { extractCookiesViaCDP, loadLatestCookies, checkCookieExpiry };
