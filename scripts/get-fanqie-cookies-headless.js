#!/usr/bin/env node

/**
 * 番茄小说 Cookie 获取脚本 - Playwright（无头模式）
 *
 * 功能：
 * 1. 启动 Chrome 浏览器（无头模式）
 * 2. 导航到番茄小说
 * 3. 检查登录状态
 * 4. 获取 Cookie
 * 5. 保存 Cookie 到文件
 * 6. 生成 Cookie 获取报告
 *
 * 提示条件：
 * - 用户已在 Chrome 中登录番茄小说
 *
 * 使用方法：
 * node scripts/get-fanqie-cookies-headless.js
 *
 * 输出文件：
 * - cookies/fanqie-cookies-headless-YYYY-MM-DDTHH-mm-ss.json - Cookie 文件
 * - data/fanqie-cookie-report-headless-YYYY-MM-DDTHH-mm-ss.md - Cookie 获取报告
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// 配置
const FANQIE_URL = 'https://fanqienovel.com';
const COOKIES_DIR = path.join(process.env.HOME, '.openclaw/workspace/cookies');
const DATA_DIR = path.join(process.env.HOME, '.openclaw/workspace/data');

// 输出文件路径
const COOKIES_FILE = path.join(COOKIES_DIR, `fanqie-cookies-headless-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
const REPORT_FILE = path.join(DATA_DIR, `fanqie-cookie-report-headless-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);

/**
 * 检查登录状态
 * @param {Page} page - Playwright 页面对象
 * @returns {Promise<boolean>} - 是否已登录
 */
async function checkLoginStatus(page) {
  try {
    // 获取页面标题
    const title = await page.title();
    console.log(`   - 页面标题: ${title}`);

    // 检查页面 URL
    const url = page.url();
    console.log(`   - 页面 URL: ${url}`);

    // 检查是否有登录按钮（未登录状态）
    const loginButton = await page.$('text="登录"');
    const loginButtonAlt = await page.$('text="立即登录"');
    
    // 检查是否有用户头像或用户信息（已登录状态）
    const userAvatar = await page.$('.user-avatar');
    const userName = await page.$('.user-name');
    const userHeader = await page.$('[data-testid="user-avatar"]');
    
    // 如果有登录按钮，说明未登录
    if (loginButton || loginButtonAlt) {
      console.log('   - 检测到登录按钮（未登录）');
      return false;
    }
    
    // 如果有用户头像或用户信息，说明已登录
    if (userAvatar || userName || userHeader) {
      console.log('   - 检测到用户信息（已登录）');
      return true;
    }
    
    // 检查 URL 是否包含登录相关路径
    if (url.includes('/login') || url.includes('/auth')) {
      console.log('   - 检测到登录相关路径（未登录）');
      return false;
    }
    
    // 默认认为已登录
    console.log('   - 默认认为已登录');
    return true;
  } catch (error) {
    console.error('检查登录状态时出错:', error.message);
    return false;
  }
}

/**
 * 生成 Cookie 获取报告
 * @param {Array} cookies - Cookie 数组
 * @param {boolean} isLoggedIn - 是否已登录
 * @returns {string} - 报告内容
 */
function generateReport(cookies, isLoggedIn) {
  let report = `# 番茄小说 Cookie 获取报告 - Playwright（无头模式）\n\n`;
  report += `> **获取时间**: ${new Date().toLocaleString('zh-CN')}\n`;
  report += `> **Cookie 数量**: ${cookies.length}\n`;
  report += `> **登录状态**: ${isLoggedIn ? '✅ 已登录' : '❌ 未登录'}\n`;
  report += `> **Cookie 文件**: \`${COOKIES_FILE}\`\n\n`;

  report += `## 📊 Cookie 信息\n\n`;
  report += `| 域名 | 名称 | 值 | 过期时间 | HTTPOnly | Secure |\n`;
  report += `|-----|------|-----|----------|----------|--------|\n`;

  cookies.forEach(cookie => {
    const domain = cookie.domain || 'N/A';
    const name = cookie.name || 'N/A';
    const value = cookie.value ? cookie.value.substring(0, 50) + (cookie.value.length > 50 ? '...' : '') : 'N/A';
    const expires = cookie.expires ? new Date(cookie.expires * 1000).toLocaleString('zh-CN') : 'Session';
    const httpOnly = cookie.httpOnly ? '✅' : '❌';
    const secure = cookie.secure ? '✅' : '❌';

    report += `| ${domain} | ${name} | ${value} | ${expires} | ${httpOnly} | ${secure} |\n`;
  });

  report += `\n## 📝 使用说明\n\n`;
  report += `### 如何使用 Cookie\n\n`;
  report += `1. **Cookie 文件位置**: \`${COOKIES_FILE}\`\n`;
  report += `2. **Cookie 文件格式**: JSON 格式\n`;
  report += `3. **Cookie 文件用途**: 用于自动化发布和数据分析\n\n`;

  report += `### 下一步操作\n\n`;
  report += `1. **测试 Cookie 有效性**:\n`;
  report += `   - 将 Cookie 复制到 chrome-user-data 目录\n`;
  report += `   - 使用 Playwright 脚本测试 Cookie 有效性\n`;
  
  report += `2. **分析发布页面**:\n`;
  report += `   - 使用 Cookie 访问番茄小说发布页面\n`;
  report += `   - 分析页面结构（标题、简介、标签等）\n`;
  report += `   - 提取选择器信息\n\n`;

  report += `3. **开发自动发布脚本**:\n`;
  report += `   - 基于页面分析结果\n`;
  report += `   - 使用 Cookie 自动填充表单\n`;
  report += `   - 自动提交发布\n\n`;

  report += `### 注意事项\n\n`;
  report += `- ⚠️ Cookie 包含敏感信息，请妥善保管\n`;
  report += `- ⚠️ 不要将 Cookie 提交到代码仓库\n`;
  report += `- ⚠️ Cookie 过期后需要重新获取\n`;
  report += `- ⚠️ Cookie 仅用于自动化操作，请勿用于其他用途\n\n`;

  report += `## 🔧 脚本参数\n\n`;
  report += `- **无头模式**: 是（headless: true）\n`;
  report += `- **用户数据目录**: 不使用（避免与用户浏览器冲突）\n`;
  report += `- **Cookie 源**: Playwright 浏览器上下文\n\n`;

  report += `## 🔄 更新记录\n\n`;
  report += `| 版本 | 日期 | 更新内容 |\n`;
  report += `|------|------|----------|\n`;
  report += `| v1.0 | 2026-03-20 | 创建 Playwright 无头模式 Cookie 获取脚本 |\n\n`;

  report += `## 📞 技术支持\n\n`;
  report += `如有问题，请联系心跳时刻 - 番茄小说创作和运营\n\n`;

  return report;
}

/**
 * 主函数
 */
async function main() {
  console.log('============================================================');
  console.log('  番茄小说 Cookie 获取 - Playwright（无头模式）');
  console.log('============================================================\n');

  // 检查前提条件
  console.log('📋 前提条件检查\n');
  console.log('1. 确保已在 Chrome 中登录番茄小说');
  console.log('2. 确保已安装 Playwright：npm install playwright');
  console.log('3. 确保已安装 Chromium：npx playwright install chromium\n\n');

  // 检查目录是否存在
  if (!fs.existsSync(COOKIES_DIR)) {
    fs.mkdirSync(COOKIES_DIR, { recursive: true });
    console.log(`✅ 创建 Cookie 目录: ${COOKIES_DIR}`);
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`✅ 创建数据目录: ${DATA_DIR}`);
  }

  let browser;
  try {
    // 启动 Chrome 浏览器（无头模式）
    console.log('============================================================');
    console.log('  步骤1: 启动 Chrome 浏览器');
    console.log('============================================================\n');

    console.log('   - 启动模式: 无头（headless: true）');
    console.log('   - 调试端口: 无（不使用远程调试端口）');
    
    const context = await chromium.launchPersistentContext('', {
      headless: true, // 无头模式
      args: [
        '--no-sandbox', // 禁用沙箱（无头模式需要）
      ]
    });

    browser = context.browser();
    const page = await browser.newPage();
    console.log('✅ Chrome 浏览器已启动\n');

    // 导航到番茄小说
    console.log('============================================================');
    console.log('  步骤2: 导航到番茄小说');
    console.log('============================================================\n');

    await page.goto(FANQIE_URL, { waitUntil: 'networkidle' });
    console.log(`✅ 已导航到番茄小说: ${FANQIE_URL}\n`);

    // 等待页面加载
    await page.waitForTimeout(2000);
    console.log('✅ 等待页面加载完成\n');

    // 检查是否已登录
    console.log('============================================================');
    console.log('  步骤3: 检查登录状态');
    console.log('============================================================\n');

    const isLoggedIn = await checkLoginStatus(page);

    if (isLoggedIn) {
      console.log('✅ 检测到用户已登录番茄小说\n');
    } else {
      console.log('❌ 用户未登录');
      console.log('❌ Cookie 获取失败');
      console.log('❌ 请在 Chrome 中登录番茄小说后，重新运行此脚本');
      await browser.close();
      return;
    }

    // 获取 Cookie
    console.log('============================================================');
    console.log('  步骤4: 获取 Cookie');
    console.log('============================================================\n');

    const cookies = await context.cookies();
    console.log(`✅ 获取到 ${cookies.length} 个 Cookie\n`);

    // 保存 Cookie
    console.log('============================================================');
    console.log('  步骤5: 保存 Cookie');
    console.log('============================================================\n');

    fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2), 'utf-8');
    console.log(`✅ Cookie 已保存到: ${COOKIES_FILE}\n`);

    // 生成 Cookie 获取报告
    console.log('============================================================');
    console.log('  步骤6: 生成 Cookie 获取报告');
    console.log('============================================================\n');

    const report = generateReport(cookies, isLoggedIn);
    fs.writeFileSync(REPORT_FILE, report, 'utf-8');
    console.log(`✅ 报告已生成到: ${REPORT_FILE}\n`);

    // 关闭浏览器
    await browser.close();

    console.log('============================================================');
    console.log('  Cookie 获取完成');
    console.log('============================================================');
    console.log(`\nCookie 文件: ${COOKIES_FILE}`);
    console.log(`报告文件: ${REPORT_FILE}`);

  } catch (error) {
    console.error('❌ Cookie 获取失败:', error.message);
    console.error('\n请检查：');
    console.error('1. 是否已安装 Playwright：npm install playwright');
    console.error('2. 是否已安装 Chromium：npx playwright install chromium');
    console.error('3. 是否已在 Chrome 中登录番茄小说');
    console.error('4. 网络连接是否正常');
    
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// 执行
main();
