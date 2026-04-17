#!/usr/bin/env node

/**
 * Cookie 自动监控脚本
 *
 * 功能：
 * 1. 检查 Cookie 有效性（通过访问番茄小说作家专区）
 * 2. 检查 Cookie 是否即将过期（提前预警）
 * 3. 记录监控历史（保存到 JSON 文件）
 * 4. 生成监控报告（JSON + Markdown）
 *
 * 使用方法：
 * node scripts/cookie-monitor.js
 *
 * 输出文件：
 * - data/cookie-monitor-history.json - 监控历史记录
 * - data/cookie-monitor-report-YYYY-MM-DDTHH-mm-ss.md - 本次监控报告
 *
 * 预警规则：
 * - 剩余天数 <= 3 天：⚠️ 即将过期
 * - 剩余天数 <= 0 天：❌ 已过期
 * - 剩余天数 > 3 天：✅ 有效
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const config = {
  // 番茄小说作家专区 URL
  fanqieUrl: 'https://fanqienovel.com/main/writer/short-manage',

  // Cookie 文件路径
  cookieFile: path.join(process.env.HOME, '.openclaw/workspace/cookies/latest.json'),

  // LocalStorage 文件路径
  localStorageFile: path.join(process.env.HOME, '.openclaw/workspace/cookies/localStorage.json'),

  // 数据保存目录
  dataDir: path.join(process.env.HOME, '.openclaw/workspace/data'),

  // 监控历史文件
  historyFile: path.join(process.env.HOME, '.openclaw/workspace/data/cookie-monitor-history.json'),

  // 预警天数（剩余天数低于此值时预警）
  warningDays: 3,

  // 关键 Cookie 名称
  sessionCookieNames: ['sessionid', 'sid_tt', 'uid_tt', 'odin_tt'],
};

// 确保目录存在
if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
  console.log(`✅ 创建目录: ${config.dataDir}`);
}

/**
 * 检查 Cookie 文件是否存在
 */
function checkCookieFileExists() {
  return fs.existsSync(config.cookieFile);
}

/**
 * 检查 LocalStorage 文件是否存在
 */
function checkLocalStorageFileExists() {
  return fs.existsSync(config.localStorageFile);
}

/**
 * 读取 Cookie 文件
 */
function readCookieFile() {
  if (!checkCookieFileExists()) {
    return null;
  }
  try {
    const content = fs.readFileSync(config.cookieFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ 读取 Cookie 文件失败: ${error.message}`);
    return null;
  }
}

/**
 * 检查 Cookie 过期时间
 */
function checkCookieExpiry(cookies) {
  if (!cookies || cookies.length === 0) {
    return {
      valid: false,
      expiresAt: null,
      daysLeft: -999,
      message: 'Cookie 文件为空或不存在',
    };
  }

  // 查找 session Cookie
  const sessionCookie = cookies.find(c =>
    config.sessionCookieNames.includes(c.name) && c.value
  );

  if (!sessionCookie) {
    return {
      valid: false,
      expiresAt: null,
      daysLeft: -999,
      message: '未找到关键 Cookie (sessionid, sid_tt 等)',
    };
  }

  // 检查过期时间
  const expiresAt = sessionCookie.expires > 0
    ? new Date(sessionCookie.expires * 1000)
    : null;

  if (!expiresAt) {
    // session cookie（没有过期时间）
    return {
      valid: true,
      expiresAt: null,
      daysLeft: Infinity,
      message: 'Session Cookie（长期有效）',
    };
  }

  const now = Date.now();
  const daysLeft = Math.floor((expiresAt.getTime() - now) / (1000 * 60 * 60 * 24));

  const valid = daysLeft > 0;
  const level = daysLeft <= 0 ? '❌ 已过期' : daysLeft <= config.warningDays ? '⚠️ 即将过期' : '✅ 有效';
  const message = `${level}，过期时间：${expiresAt.toLocaleString('zh-CN')}，剩余 ${daysLeft} 天`;

  return {
    valid,
    expiresAt,
    daysLeft,
    message,
  };
}

/**
 * 检查 Cookie 是否有效（通过访问番茄小说作家专区）
 */
async function checkCookieValidity() {
  let browser;
  let page;

  try {
    console.log('🔍 正在检查 Cookie 有效性...\n');

    // 读取 Cookie
    const cookies = readCookieFile();
    if (!cookies) {
      return {
        valid: false,
        message: 'Cookie 文件不存在或读取失败',
        error: 'COOKIE_FILE_MISSING',
      };
    }

    // 检查过期时间
    const expiry = checkCookieExpiry(cookies);
    if (!expiry.valid) {
      return {
        valid: false,
        message: expiry.message,
        error: 'COOKIE_EXPIRED',
        daysLeft: expiry.daysLeft,
      };
    }

    // 启动浏览器
    console.log('🚀 正在启动浏览器...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    // 注入 Cookie
    await context.addCookies(cookies);
    console.log('✅ Cookie 已注入\n');

    // 创建页面
    page = await context.newPage();

    // 访问番茄小说作家专区
    console.log(`📍 正在访问: ${config.fanqieUrl}`);
    const response = await page.goto(config.fanqieUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log(`✅ 页面加载完成，状态码: ${response.status()}\n`);

    // 检查是否被重定向到登录页面
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('login') || currentUrl.includes('auth');

    if (isLoginPage) {
      return {
        valid: false,
        message: '被重定向到登录页面，Cookie 已失效',
        error: 'REDIRECT_TO_LOGIN',
        currentUrl,
        daysLeft: expiry.daysLeft,
      };
    }

    // 检查页面是否有用户信息
    const hasUserInfo = await page.locator('.muye-header-user').count() > 0;
    const hasContent = await page.locator('.short-manage-container').count() > 0;

    if (!hasUserInfo && !hasContent) {
      return {
        valid: false,
        message: '页面缺少用户信息，Cookie 可能已失效',
        error: 'NO_USER_INFO',
        currentUrl,
        daysLeft: expiry.daysLeft,
      };
    }

    return {
      valid: true,
      message: 'Cookie 有效，已成功登录',
      currentUrl,
      daysLeft: expiry.daysLeft,
      expiresAt: expiry.expiresAt,
    };

  } catch (error) {
    return {
      valid: false,
      message: `检查失败: ${error.message}`,
      error: 'CHECK_FAILED',
      errorDetail: error.stack,
    };
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

/**
 * 读取监控历史
 */
function readHistory() {
  if (!fs.existsSync(config.historyFile)) {
    return [];
  }
  try {
    const content = fs.readFileSync(config.historyFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ 读取监控历史失败: ${error.message}`);
    return [];
  }
}

/**
 * 保存监控历史
 */
function saveHistory(history) {
  try {
    fs.writeFileSync(config.historyFile, JSON.stringify(history, null, 2), 'utf8');
    console.log(`✅ 监控历史已保存: ${config.historyFile}\n`);
  } catch (error) {
    console.error(`❌ 保存监控历史失败: ${error.message}`);
  }
}

/**
 * 生成监控报告（Markdown）
 */
function generateReport(result, history) {
  const timestamp = new Date();
  const reportFile = path.join(config.dataDir, `cookie-monitor-report-${timestamp.toISOString().replace(/[:.]/g, '-')}.md`);

  const report = `# Cookie 监控报告

**生成时间**: ${timestamp.toLocaleString('zh-CN')}
**监控结果**: ${result.valid ? '✅ 有效' : '❌ 失效'}
**剩余天数**: ${result.daysLeft !== undefined ? result.daysLeft : '未知'}

---

## 监控结果

### 有效性检查

- **状态**: ${result.valid ? '✅ 有效' : '❌ 失效'}
- **消息**: ${result.message}
${result.currentUrl ? `- **当前URL**: ${result.currentUrl}` : ''}
${result.expiresAt ? `- **过期时间**: ${result.expiresAt.toLocaleString('zh-CN')}` : ''}
${result.daysLeft !== undefined ? `- **剩余天数**: ${result.daysLeft} 天` : ''}

### Cookie 文件状态

- **文件存在**: ${checkCookieFileExists() ? '✅' : '❌'}
- **Cookie 数量**: ${readCookieFile()?.length || 0}

### LocalStorage 文件状态

- **文件存在**: ${checkLocalStorageFileExists() ? '✅' : '❌'}

---

## 建议

${result.valid ? `
✅ Cookie 有效，无需更新。

**下次检查建议**: ${result.daysLeft > 7 ? '7 天后' : result.daysLeft > 3 ? '3 天后' : '1 天后'}
` : `
❌ Cookie 失效，需要更新。

**更新方法**: 参考 [Cookie更新指引](https://github.com/your-repo/docs/Cookie更新指引.md)

1. 运行自动登录脚本:
   \`\`\`bash
   cd ~/.openclaw/workspace
   node scripts/login-save-cookies.js
   \`\`\`

2. 或使用 CDP 提取脚本:
   \`\`\`bash
   cd ~/.openclaw/workspace
   node scripts/extract-cookies-from-browser.js
   \`\`\`
`}

---

## 监控历史

| 时间 | 状态 | 剩余天数 | 消息 |
|------|------|----------|------|
${history.slice(-5).map(h => `| ${h.timestamp.replace('T', ' ')} | ${h.valid ? '✅' : '❌'} | ${h.daysLeft || '-'} | ${h.message} |`).join('\n')}

---

**维护者**: 心跳时刻 - 番茄小说创作和运营
**脚本版本**: v1.0.0
`;

  fs.writeFileSync(reportFile, report, 'utf8');
  console.log(`✅ 监控报告已保存: ${reportFile}\n`);

  return reportFile;
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('  Cookie 自动监控脚本');
  console.log('='.repeat(60));
  console.log('');

  const timestamp = new Date().toISOString();

  // 检查 Cookie 文件
  const cookieFileExists = checkCookieFileExists();
  if (!cookieFileExists) {
    console.error('❌ Cookie 文件不存在: ' + config.cookieFile);
    process.exit(1);
  }

  console.log(`✅ Cookie 文件存在: ${config.cookieFile}\n`);

  // 检查 Cookie 过期时间
  const cookies = readCookieFile();
  const expiry = checkCookieExpiry(cookies);
  console.log(`📊 Cookie 状态: ${expiry.message}\n`);

  // 检查 Cookie 有效性（通过访问番茄小说作家专区）
  const result = await checkCookieValidity();
  console.log(`🎯 检查结果: ${result.valid ? '✅ 有效' : '❌ 失效'}`);
  console.log(`📝 消息: ${result.message}\n`);

  // 读取历史
  const history = readHistory();

  // 添加本次监控结果到历史
  history.push({
    timestamp,
    valid: result.valid,
    message: result.message,
    daysLeft: result.daysLeft,
    error: result.error,
  });

  // 只保留最近 100 条记录
  if (history.length > 100) {
    history.splice(0, history.length - 100);
  }

  // 保存历史
  saveHistory(history);

  // 生成监控报告
  const reportFile = generateReport(result, history);

  // 显示总结
  console.log('='.repeat(60));
  console.log('  监控完成！');
  console.log('='.repeat(60));
  console.log('');
  console.log(`📊 Cookie 状态: ${result.valid ? '✅ 有效' : '❌ 失效'}`);
  console.log(`📊 剩余天数: ${result.daysLeft !== undefined ? result.daysLeft + ' 天' : '未知'}`);
  console.log(`📁 监控报告: ${reportFile}`);
  console.log(`📁 监控历史: ${config.historyFile}`);
  console.log('');

  // 返回结果（供其他脚本调用）
  return {
    success: true,
    valid: result.valid,
    daysLeft: result.daysLeft,
    reportFile,
    historyFile: config.historyFile,
  };
}

// 运行主函数
main().then(result => {
  if (!result.valid) {
    console.log('⚠️  Cookie 已失效，建议更新\n');
    process.exit(1);
  } else {
    console.log('✅ Cookie 有效，一切正常\n');
    process.exit(0);
  }
}).catch(error => {
  console.error(`\n❌ 发生错误: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
