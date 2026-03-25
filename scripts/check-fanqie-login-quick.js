#!/usr/bin/env node

/**
 * 番茄小说登录状态快速检查脚本（轻量版）
 *
 * 功能：
 * 1. 快速验证 Cookie 是否有效
 * 2. 检查是否能访问番茄页面
 *
 * 使用方法：
 *   node scripts/check-fanqie-login-quick.js
 *
 * 依赖：
 *   - playwright (直接使用 Playwright API)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  cookieFile: path.join(__dirname, '..', 'cookies', 'latest.json'),
  checkUrl: 'https://fanqienovel.com/main/writer/short-manage'
};

async function quickCheck() {
  let browser = null;

  try {
    console.log('🔍 快速检查番茄小说登录状态...');

    // 读取 Cookie
    if (!fs.existsSync(CONFIG.cookieFile)) {
      console.log('❌ Cookie 文件不存在');
      return { success: false, error: 'Cookie file not found' };
    }

    const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));
    console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);

    // 启动浏览器（headless 模式，更轻量）
    console.log('📍 启动 Chromium 浏览器（headless）...');
    browser = await chromium.launch({
      headless: true
    });

    const context = await browser.newContext();
    await context.addCookies(cookies);

    const page = await context.newPage();

    // 设置超时时间（20 秒）
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(20000);

    console.log(`🌐 访问页面: ${CONFIG.checkUrl}`);

    try {
      const response = await page.goto(CONFIG.checkUrl, {
        waitUntil: 'domcontentloaded'
      });

      // 检查响应状态
      if (response && response.status() >= 400) {
        console.log(`❌ HTTP 错误: ${response.status()}`);
        return { success: false, error: `HTTP ${response.status()}` };
      }

      const pageInfo = {
        url: page.url(),
        title: await page.title()
      };

      // 检查 URL 是否跳转到登录页
      if (pageInfo.url.includes('/login')) {
        console.log('❌ Cookie 已失效（被重定向到登录页）');
        return { success: false, pageInfo, error: 'Redirected to login page' };
      }

      // 检查页面内容
      const bodyText = await page.evaluate(() => document.body.innerText);

      // 检查登录标识
      const loggedIn = bodyText.includes('帅帅它爸') ||
                       bodyText.includes('作家专区') ||
                       bodyText.includes('工作台');

      if (loggedIn) {
        console.log('✅ 登录状态正常');
        console.log(`   URL: ${pageInfo.url}`);
        console.log(`   标题: ${pageInfo.title}`);
        console.log(`   检测到登录标识`);

        return { success: true, pageInfo, loggedIn: true };
      } else {
        console.log('⚠️ 页面可访问，但未检测到登录标识');
        console.log(`   URL: ${pageInfo.url}`);
        console.log(`   标题: ${pageInfo.title}`);
        return { success: false, pageInfo, loggedIn: false, error: 'No login indicators found' };
      }

    } catch (error) {
      if (error.name === 'TimeoutError') {
        console.log('❌ 页面加载超时');
        return { success: false, error: 'Page load timeout' };
      } else {
        console.log(`❌ 访问失败: ${error.message}`);
        return { success: false, error: error.message };
      }
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    return { success: false, error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 执行检查
quickCheck()
  .then(result => {
    if (result.success) {
      console.log('\n✅ 快速检查通过');
      process.exit(0);
    } else {
      console.log('\n❌ 快速检查失败');
      console.log(`错误原因: ${result.error}`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ 检查异常:', error);
    process.exit(2);
  });
