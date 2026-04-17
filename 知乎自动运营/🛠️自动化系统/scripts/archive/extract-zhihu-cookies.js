#!/usr/bin/env node

/**
 * 知乎Cookie提取脚本
 *
 * 功能：
 * 1. 从已登录的浏览器中提取知乎Cookie
 * 2. 保存Cookie到本地文件
 * 3. 支持定时任务（cron或手动执行）
 *
 * 使用方法：
 *   node extract-zhihu-cookies.js
 *
 * 输出文件：
 *   知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-[timestamp].json
 *   知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-latest.json
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // 知乎相关URL（用于检测登录状态）
  zhihuUrls: [
    'https://www.zhihu.com',
    'https://zhuanlan.zhihu.com',
    'https://www.zhihu.com/people'
  ],
  
  // Cookie输出目录
  authDir: path.join(__dirname, '..', 'auth'),
  
  // 浏览器配置
  browserConfig: {
    headless: true,  // 无头模式
    slowMo: 0
  },
  
  // 使用Chrome的用户数据目录（需要用户手动设置）
  userDataDir: process.env.HOME + '/Library/Application Support/Google/Chrome'  // macOS默认路径
};

// ============================================================
// 工具函数
// ============================================================

function ensureAuthDir() {
  if (!fs.existsSync(CONFIG.authDir)) {
    fs.mkdirSync(CONFIG.authDir, { recursive: true });
    console.log(`✅ 创建认证目录: ${CONFIG.authDir}`);
  }
}

async function takeScreenshot(page, filename) {
  const screenshotDir = path.join(CONFIG.authDir, 'screenshots');
  
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const screenshotPath = path.join(screenshotDir, filename);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`   📸 截图已保存: ${screenshotPath}`);
  return screenshotPath;
}

function saveCookies(cookies, timestamp) {
  // 保存带时间戳的Cookie文件
  const timestampedFile = path.join(CONFIG.authDir, `zhihu-cookies-${timestamp}.json`);
  fs.writeFileSync(timestampedFile, JSON.stringify(cookies, null, 2));
  console.log(`✅ Cookie已保存: ${timestampedFile}`);
  
  // 保存latest.json（便于其他脚本使用）
  const latestFile = path.join(CONFIG.authDir, 'zhihu-cookies-latest.json');
  fs.writeFileSync(latestFile, JSON.stringify(cookies, null, 2));
  console.log(`✅ 最新Cookie已保存: ${latestFile}`);
  
  return { timestampedFile, latestFile };
}

// ============================================================
// Cookie提取（使用Chrome用户数据目录）
// ============================================================

async function extractCookiesFromUserDataDir() {
  if (!CONFIG.userDataDir) {
    console.warn('⚠️  未配置用户数据目录，跳过此方法');
    return null;
  }
  
  console.log('\n🔍 方法1: 从Chrome用户数据目录提取Cookie...');
  console.log(`   用户数据目录: ${CONFIG.userDataDir}`);
  
  try {
    // 使用用户数据目录启动浏览器
    const browser = await chromium.launchPersistentContext(CONFIG.userDataDir, {
      headless: false,
      channel: 'chrome'  // 使用Chrome浏览器
    });
    
    // 获取所有页面
    const pages = browser.pages();
    
    // 查找知乎页面
    let zhihuPage = null;
    for (const page of pages) {
      if (page.url().includes('zhihu.com')) {
        zhihuPage = page;
        break;
      }
    }
    
    // 如果没有知乎页面，创建一个
    if (!zhihuPage) {
      console.log('   📄 打开知乎首页...');
      zhihuPage = await browser.newPage();
      await zhihuPage.goto('https://www.zhihu.com', { waitUntil: 'networkidle' });
    } else {
      await zhihuPage.bringToFront();
    }
    
    // 等待页面加载
    await zhihuPage.waitForTimeout(2000);
    
    // 提取Cookie
    const cookies = await zhihuPage.context().cookies();
    
    // 过滤知乎相关的Cookie
    const zhihuCookies = cookies.filter(cookie => cookie.domain.includes('zhihu.com'));
    
    console.log(`   ✅ 成功提取 ${zhihuCookies.length} 个知乎Cookie`);
    
    // 检测登录状态
    const isLoggedIn = await zhihuPage.evaluate(() => {
      // 方法1: 检查页面是否包含用户信息
      const userNameElement = document.querySelector('.UserLink-link');
      if (userNameElement) {
        return {
          isLoggedIn: true,
          userName: userNameElement.textContent.trim()
        };
      }
      
      // 方法2: 检查是否有登录按钮
      const loginButton = document.querySelector('.SignFlow-submit');
      if (loginButton) {
        return { isLoggedIn: false, userName: null };
      }
      
      // 方法3: 检查URL是否包含用户ID
      if (window.location.pathname.includes('/people/')) {
        return {
          isLoggedIn: true,
          userName: window.location.pathname.split('/people/')[1]
        };
      }
      
      return { isLoggedIn: false, userName: null };
    });
    
    console.log(`   ${isLoggedIn.isLoggedIn ? '✅ 已登录' : '❌ 未登录'}`);
    if (isLoggedIn.isLoggedIn) {
      console.log(`   👤 用户名: ${isLoggedIn.userName}`);
    }
    
    // 截图
    await takeScreenshot(zhihuPage, `zhihu-login-check-${Date.now()}.png`);
    
    await browser.close();
    
    return {
      cookies: zhihuCookies,
      isLoggedIn: isLoggedIn.isLoggedIn,
      userName: isLoggedIn.userName
    };
    
  } catch (error) {
    console.error(`   ❌ 从用户数据目录提取Cookie失败: ${error.message}`);
    return null;
  }
}

// ============================================================
// Cookie提取（使用CDP连接已登录的浏览器）
// ============================================================

async function extractCookiesFromCDP() {
  console.log('\n🔍 方法2: 通过CDP连接已登录的浏览器...');
  console.log('   ℹ️  此方法需要手动配置CDP端点');
  console.log('   ℹ️  Chrome启动参数: --remote-debugging-port=9222');
  
  // 检查是否有CDP端点
  const cdpEndpoint = process.env.CHROME_CDP_ENDPOINT || 'http://localhost:9222';
  
  try {
    // 连接到CDP端点
    const browser = await chromium.connectOverCDP(cdpEndpoint);
    console.log('   ✅ 成功连接到CDP端点');
    
    // 获取所有上下文
    const contexts = browser.contexts();
    console.log(`   📋 找到 ${contexts.length} 个浏览器上下文`);
    
    // 查找所有包含知乎Cookie的上下文
    const allZhihuCookies = [];
    let zhihuContext = null;
    let isLoggedIn = false;
    let userName = null;
    
    for (let i = 0; i < contexts.length; i++) {
      const context = contexts[i];
      console.log(`   📋 检查上下文 ${i + 1}/${contexts.length}...`);
      
      try {
        const cookies = await context.cookies();
        const zhihuCookies = cookies.filter(cookie => cookie.domain.includes('zhihu.com'));
        
        if (zhihuCookies.length > 0) {
          console.log(`   ✅ 找到知乎Cookie (${zhihuCookies.length} 个)`);
          allZhihuCookies.push(...zhihuCookies);
          
          // 记录第一个包含知乎Cookie的上下文
          if (!zhihuContext) {
            zhihuContext = context;
          }
        }
      } catch (error) {
        console.log(`   ⚠️  无法获取上下文 ${i + 1} 的Cookie: ${error.message}`);
      }
    }
    
    if (allZhihuCookies.length === 0) {
      console.log('   ⚠️  未找到包含知乎Cookie的上下文');
      console.log('   💡 提示: 请在浏览器中访问知乎并登录');
      await browser.close();
      return null;
    }
    
    console.log(`   ✅ 共找到 ${allZhihuCookies.length} 个知乎Cookie`);
    
    // 如果找到了包含知乎Cookie的上下文，检测登录状态
    if (zhihuContext) {
      // 获取上下文中的所有页面
      const pages = zhihuContext.pages();
      
      // 查找知乎页面
      let zhihuPage = null;
      for (const page of pages) {
        if (page.url().includes('zhihu.com')) {
          zhihuPage = page;
          break;
        }
      }
      
      if (zhihuPage) {
        await zhihuPage.bringToFront();
        
        // 检测登录状态
        try {
          const loginStatus = await zhihuPage.evaluate(() => {
            const userNameElement = document.querySelector('.UserLink-link');
            if (userNameElement) {
              return {
                isLoggedIn: true,
                userName: userNameElement.textContent.trim()
              };
            }
            return { isLoggedIn: false, userName: null };
          });
          
          isLoggedIn = loginStatus.isLoggedIn;
          userName = loginStatus.userName;
          
          // 截图
          await takeScreenshot(zhihuPage, `zhihu-login-check-${Date.now()}.png`);
        } catch (error) {
          console.log(`   ⚠️  无法检测登录状态: ${error.message}`);
        }
      }
    }
    
    console.log(`   ${isLoggedIn ? '✅ 已登录' : '❌ 未登录'}`);
    if (isLoggedIn) {
      console.log(`   👤 用户名: ${userName}`);
    }
    
    await browser.close();
    
    return {
      cookies: allZhihuCookies,
      isLoggedIn,
      userName
    };
    
  } catch (error) {
    console.error(`   ❌ 通过CDP提取Cookie失败: ${error.message}`);
    console.log('   💡 提示: 请确保Chrome使用--remote-debugging-port=9222参数启动');
    return null;
  }
}

// ============================================================
// Cookie提取（使用Chrome DevTools Protocol）
// ============================================================

async function extractCookiesFromBrowser() {
  console.log('\n🔍 方法3: 使用Playwright自动登录并提取Cookie...');
  
  try {
    // 启动浏览器
    const browser = await chromium.launch(CONFIG.browserConfig);
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 访问知乎首页
    console.log('   📄 访问知乎首页...');
    await page.goto('https://www.zhihu.com', { waitUntil: 'networkidle' });
    
    // 等待页面加载
    await page.waitForTimeout(3000);
    
    // 检测登录状态
    const loginStatus = await page.evaluate(() => {
      const userNameElement = document.querySelector('.UserLink-link');
      const loginButton = document.querySelector('.SignFlow-submit');
      
      if (loginButton) {
        return {
          isLoggedIn: false,
          userName: null,
          hasLoginButton: true
        };
      }
      
      if (userNameElement) {
        return {
          isLoggedIn: true,
          userName: userNameElement.textContent.trim(),
          hasLoginButton: false
        };
      }
      
      return {
        isLoggedIn: false,
        userName: null,
        hasLoginButton: false
      };
    });
    
    console.log(`   ${loginStatus.isLoggedIn ? '✅ 已登录' : '❌ 未登录'}`);
    if (loginStatus.isLoggedIn) {
      console.log(`   👤 用户名: ${loginStatus.userName}`);
      
      // 提取Cookie
      const cookies = await context.cookies();
      const zhihuCookies = cookies.filter(cookie => cookie.domain.includes('zhihu.com'));
      
      console.log(`   ✅ 成功提取 ${zhihuCookies.length} 个知乎Cookie`);
      
      // 截图
      await takeScreenshot(page, `zhihu-login-check-${Date.now()}.png`);
      
      await browser.close();
      
      return {
        cookies: zhihuCookies,
        isLoggedIn: loginStatus.isLoggedIn,
        userName: loginStatus.userName
      };
    } else {
      console.log('   ⚠️  浏览器未登录，无法提取Cookie');
      console.log('   💡 提示: 请在浏览器中手动登录知乎，或使用方法1/方法2');
      
      // 截图
      await takeScreenshot(page, `zhihu-login-check-${Date.now()}.png`);
      
      await browser.close();
      return null;
    }
    
  } catch (error) {
    console.error(`   ❌ 使用Playwright提取Cookie失败: ${error.message}`);
    return null;
  }
}

// ============================================================
// 主流程
// ============================================================

async function main() {
  console.log('\n🚀 知乎Cookie提取脚本启动...');
  console.log(`📅 提取时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  
  // 确保认证目录存在
  ensureAuthDir();
  
  let result = null;
  
  // 尝试方法1: 从Chrome用户数据目录提取Cookie
  if (CONFIG.userDataDir) {
    result = await extractCookiesFromUserDataDir();
  }
  
  // 如果方法1失败，尝试方法2: 通过CDP连接已登录的浏览器
  if (!result) {
    result = await extractCookiesFromCDP();
  }
  
  // 如果方法2失败，尝试方法3: 使用Playwright自动登录并提取Cookie
  if (!result) {
    result = await extractCookiesFromBrowser();
  }
  
  // 检查结果
  if (result && result.isLoggedIn) {
    const timestamp = Date.now();
    const { timestampedFile, latestFile } = saveCookies(result.cookies, timestamp);
    
    console.log('\n✅ Cookie提取成功！');
    console.log(`📁 时间戳文件: ${timestampedFile}`);
    console.log(`📁 最新文件: ${latestFile}`);
    console.log(`👤 用户名: ${result.userName}`);
    console.log(`🍪 Cookie数量: ${result.cookies.length}`);
    
    // 创建Cookie信息文件
    const infoFile = path.join(CONFIG.authDir, `zhihu-cookies-info-${timestamp}.json`);
    const info = {
      timestamp,
      extractedAt: new Date().toISOString(),
      userName: result.userName,
      cookieCount: result.cookies.length,
      cookieFile: timestampedFile,
      latestFile: latestFile
    };
    fs.writeFileSync(infoFile, JSON.stringify(info, null, 2));
    console.log(`📁 信息文件: ${infoFile}`);
    
    process.exit(0);
  } else {
    console.log('\n❌ Cookie提取失败');
    console.log('💡 提示:');
    console.log('   1. 方法1: 配置Chrome用户数据目录路径（最推荐）');
    console.log('   2. 方法2: 使用CDP连接已登录的浏览器（需要--remote-debugging-port参数）');
    console.log('   3. 方法3: 在Playwright中手动登录知乎');
    
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
