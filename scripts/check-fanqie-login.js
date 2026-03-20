#!/usr/bin/env node

/**
 * 番茄小说登录状态检查脚本
 *
 * 功能：
 * 1. 检查浏览器是否已登录番茄小说作者账号
 * 2. 获取当前登录用户信息
 * 3. 检查是否有发布权限
 * 4. 生成检查报告
 *
 * 使用方法：
 *   node scripts/check-fanqie-login.js
 *
 * 依赖：
 *   - mcporter (已配置 playwright MCP)
 *   - Chrome 浏览器（已登录番茄小说）
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // 数据目录
  dataDir: path.join(__dirname, '..', 'data'),

  // 检查页面
  checkUrls: {
    loginPage: 'https://fanqienovel.com/main/writer/login',
    shortManagePage: 'https://fanqienovel.com/main/writer/short-manage',
    writerDashboard: 'https://fanqienovel.com/main/writer'
  },

  // 登录状态标识
  loginIndicators: {
    // 已登录时的页面特征
    loggedIn: [
      '帅帅它爸',  // 用户名
      '作家专区',
      '工作台',
      '作品管理'
    ],

    // 未登录时的页面特征
    loggedOut: [
      '登录',
      '注册',
      '请先登录'
    ]
  }
};

// 确保数据目录存在
if (!fs.existsSync(CONFIG.dataDir)) {
  fs.mkdirSync(CONFIG.dataDir, { recursive: true });
}

/**
 * 执行 mcporter 命令
 */
async function executeMcporter(code) {
  return new Promise((resolve, reject) => {
    const args = ['call', 'playwright.browser_run_code', `code=${code}`];
    const mcporter = spawn('mcporter', args);

    let stdout = '';
    let stderr = '';

    mcporter.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    mcporter.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    mcporter.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          resolve(stdout);
        }
      } else {
        reject(new Error(`mcporter exited with code ${code}: ${stderr}`));
      }
    });
  });
}

/**
 * 检查登录状态
 */
async function checkLoginStatus() {
  console.log('🔍 检查番茄小说登录状态...\n');

  try {
    // 检查短故事管理页面（最直接的验证）
    console.log('📍 访问短故事管理页面...');

    const checkCode = `
async (page) => {
  // 导航到短故事管理页面
  await page.goto('${CONFIG.checkUrls.shortManagePage}', { waitUntil: 'domcontentloaded' });

  // 等待页面加载
  await page.waitForTimeout(3000);

  // 获取页面信息
  const pageInfo = await page.evaluate(() => {
    return {
      url: page.url(),
      title: document.title,
      bodyText: document.body.innerText.substring(0, 500)
    };
  });

  // 检查登录状态
  const isLoggedIn = await page.evaluate(() => {
    // 检查是否包含已登录特征
    const bodyText = document.body.innerText;

    const loggedIn = bodyText.includes('帅帅它爸') ||
                   bodyText.includes('作家专区') ||
                   bodyText.includes('工作台') ||
                   bodyText.includes('作品管理');

    // 检查是否包含未登录特征
    const loggedOut = bodyText.includes('登录') && bodyText.includes('注册');

    return {
      loggedIn,
      loggedOut,
      userName: bodyText.match(/帅帅它爸/) ? '帅帅它爸' : null
    };
  });

  // 获取用户信息
  const userInfo = await page.evaluate(() => {
    const userInfo = {
      name: null,
      hasPublishPermission: false
    };

    const bodyText = document.body.innerText;

    // 提取用户名
    const nameMatch = bodyText.match(/帅帅它爸/);
    if (nameMatch) {
      userInfo.name = nameMatch[0];
    }

    // 检查是否有发布权限
    if (bodyText.includes('新建短故事') ||
        bodyText.includes('发布') ||
        bodyText.includes('发布短故事')) {
      userInfo.hasPublishPermission = true;
    }

    return userInfo;
  });

  return {
    pageInfo,
    loginStatus: isLoggedIn,
    userInfo
  };
}`;

    const result = await executeMcporter(checkCode);

    // 解析结果
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (e) {
      console.error('❌ 无法解析 mcporter 结果');
      console.error('原始结果:', result);
      process.exit(1);
    }

    // 打印检查结果
    console.log('✅ 检查完成！\n');

    console.log('📊 登录状态：');
    console.log('─'.repeat(50));

    if (parsedResult.loginStatus.loggedIn && !parsedResult.loginStatus.loggedOut) {
      console.log('✅ 已登录');
      console.log(`👤 用户名: ${parsedResult.userInfo.name || '未知'}`);
      console.log(`📝 发布权限: ${parsedResult.userInfo.hasPublishPermission ? '✅ 有' : '❌ 无'}`);
    } else if (parsedResult.loginStatus.loggedOut) {
      console.log('❌ 未登录');
      console.log('💡 建议：请先在浏览器中登录番茄小说作者账号');
    } else {
      console.log('⚠️ 登录状态不明');
      console.log(`URL: ${parsedResult.pageInfo.url}`);
      console.log(`页面标题: ${parsedResult.pageInfo.title}`);
    }

    console.log('\n' + '─'.repeat(50));

    // 保存检查报告
    const report = {
      timestamp: new Date().toISOString(),
      pageInfo: parsedResult.pageInfo,
      loginStatus: parsedResult.loginStatus,
      userInfo: parsedResult.userInfo,
      checkUrls: CONFIG.checkUrls
    };

    const reportFile = path.join(CONFIG.dataDir, `fanqie-login-check-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`\n📄 检查报告已保存: ${reportFile}`);

    // 返回状态码
    if (parsedResult.loginStatus.loggedIn && !parsedResult.loginStatus.loggedOut) {
      process.exit(0); // 已登录
    } else {
      process.exit(1); // 未登录
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    process.exit(2);
  }
}

// 执行检查
checkLoginStatus();
