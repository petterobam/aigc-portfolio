#!/usr/bin/env node

/**
 * 知乎Cookie验证脚本
 *
 * 功能：
 * 1. 验证Cookie是否有效
 * 2. 获取用户信息
 * 3. 显示登录状态
 *
 * 使用方法：
 *   node verify-zhihu-cookies.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  cookieFile: path.join(__dirname, '..', 'auth', 'zhihu-cookies-latest.json'),
  browserConfig: {
    headless: true
  }
};

// ============================================================
// 工具函数
// ============================================================

function loadCookies() {
  if (!fs.existsSync(CONFIG.cookieFile)) {
    throw new Error(`Cookie文件不存在: ${CONFIG.cookieFile}`);
  }
  
  const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));
  console.log(`✅ 已加载 ${cookies.length} 个Cookie`);
  return cookies;
}

async function takeScreenshot(page, filename) {
  const screenshotDir = path.join(__dirname, '..', 'auth', 'screenshots');
  
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const screenshotPath = path.join(screenshotDir, filename);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`   📸 截图已保存: ${screenshotPath}`);
  return screenshotPath;
}

// ============================================================
// 验证Cookie
// ============================================================

async function verifyCookies() {
  console.log('\n🔍 验证Cookie...');
  
  try {
    // 启动浏览器
    const browser = await chromium.launch(CONFIG.browserConfig);
    const context = await browser.newContext();
    
    // 加载Cookie
    const cookies = loadCookies();
    await context.addCookies(cookies);
    
    // 创建页面
    const page = await context.newPage();
    
    // 访问知乎首页
    console.log('   📄 访问知乎首页...');
    await page.goto('https://www.zhihu.com', { waitUntil: 'networkidle' });
    
    // 等待页面加载
    await page.waitForTimeout(3000);
    
    // 检测登录状态
    console.log('   🔍 检测登录状态...');
    const loginStatus = await page.evaluate(() => {
      const result = {
        isLoggedIn: false,
        userName: null,
        userUrl: null,
        avatarUrl: null,
        pageTitle: document.title,
        pageUrl: window.location.href
      };
      
      // 方法1: 检查用户名元素
      const userNameElement = document.querySelector('.UserLink-link');
      if (userNameElement) {
        result.isLoggedIn = true;
        result.userName = userNameElement.textContent.trim();
        result.userUrl = userNameElement.href;
        
        // 获取头像
        const avatarElement = document.querySelector('.Avatar img');
        if (avatarElement) {
          result.avatarUrl = avatarElement.src;
        }
      }
      
      // 方法2: 检查是否有登录按钮
      const loginButton = document.querySelector('.SignFlow-submit');
      if (loginButton) {
        result.isLoggedIn = false;
      }
      
      // 方法3: 检查URL是否包含用户ID
      if (window.location.pathname.includes('/people/')) {
        result.isLoggedIn = true;
        result.userName = window.location.pathname.split('/people/')[1];
        result.userUrl = window.location.href;
      }
      
      return result;
    });
    
    console.log(`   ${loginStatus.isLoggedIn ? '✅ 已登录' : '❌ 未登录'}`);
    
    if (loginStatus.isLoggedIn) {
      console.log(`   👤 用户名: ${loginStatus.userName}`);
      if (loginStatus.userUrl) {
        console.log(`   🔗 用户主页: ${loginStatus.userUrl}`);
      }
      if (loginStatus.avatarUrl) {
        console.log(`   🖼️  头像URL: ${loginStatus.avatarUrl}`);
      }
      
      // 截图
      await takeScreenshot(page, `zhihu-verify-success-${Date.now()}.png`);
      
      await browser.close();
      
      return {
        success: true,
        isLoggedIn: true,
        userName: loginStatus.userName,
        userUrl: loginStatus.userUrl,
        avatarUrl: loginStatus.avatarUrl
      };
    } else {
      console.log('   ⚠️  Cookie无效或已过期');
      
      // 截图
      await takeScreenshot(page, `zhihu-verify-failed-${Date.now()}.png`);
      
      await browser.close();
      
      return {
        success: false,
        isLoggedIn: false,
        userName: null,
        reason: 'Cookie无效或已过期'
      };
    }
    
  } catch (error) {
    console.error(`   ❌ 验证Cookie失败: ${error.message}`);
    return {
      success: false,
      isLoggedIn: false,
      reason: error.message
    };
  }
}

// ============================================================
// 主流程
// ============================================================

async function main() {
  console.log('\n🚀 知乎Cookie验证脚本启动...');
  console.log(`📅 验证时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  
  const result = await verifyCookies();
  
  if (result.success && result.isLoggedIn) {
    console.log('\n✅ Cookie验证成功！');
    console.log(`👤 用户名: ${result.userName}`);
    console.log(`🔗 用户主页: ${result.userUrl}`);
    
    process.exit(0);
  } else {
    console.log('\n❌ Cookie验证失败');
    console.log(`💡 原因: ${result.reason}`);
    console.log('💡 提示:');
    console.log('   1. 请确保已手动导出知乎Cookie');
    console.log('   2. Cookie文件路径: ' + CONFIG.cookieFile);
    console.log('   3. 参考文档: docs/manual-cookie-export-guide.md');
    
    process.exit(1);
  }
}

// ============================================================
// 执行主流程
// ============================================================

main().catch(error => {
  console.error(`\n❌ 未捕获的错误: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
