/**
 * Cookie 管理辅助模块
 *
 * 功能：
 * 1. 加载最新的 Cookie 文件
 * 2. 将 Cookie 添加到浏览器上下文
 * 3. 检查 Cookie 有效性
 * 4. 管理 Cookie 文件列表
 *
 * 使用方法：
 * const cookieManager = require('./cookie-manager.js');
 * const cookieFile = await cookieManager.loadLatestCookies(context);
 *
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
  cookieDir: path.join(__dirname, '..', 'cookies'),
  dataDir: path.join(__dirname, '..', 'data'),
};

/**
 * 获取最新的 Cookie 文件
 * @returns {Promise<string|null>}
 */
function getLatestCookieFile() {
  try {
    // 读取 cookies 目录
    const files = fs.readdirSync(config.cookieDir);

    // 过滤出 JSON 文件
    const jsonFiles = files
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a)); // 按文件名降序排序（最新的在前面）

    if (jsonFiles.length === 0) {
      console.log('⚠️  未找到 Cookie 文件');
      return null;
    }

    // 返回最新的 Cookie 文件路径
    return path.join(config.cookieDir, jsonFiles[0]);
  } catch (error) {
    console.log(`⚠️  读取 Cookie 目录失败: ${error.message}`);
    return null;
  }
}

/**
 * 加载 Cookie 到浏览器上下文
 * @param {BrowserContext} context
 * @param {string} cookieFile
 * @returns {Promise<boolean>}
 */
async function loadCookies(context, cookieFile) {
  try {
    if (!cookieFile) {
      cookieFile = getLatestCookieFile();
      if (!cookieFile) {
        return false;
      }
    }

    // 读取 Cookie 文件
    const cookiesData = fs.readFileSync(cookieFile, 'utf8');
    const cookies = JSON.parse(cookiesData);

    // 添加 Cookie 到浏览器上下文
    await context.addCookies(cookies);

    console.log(`✅ Cookie 已加载: ${cookieFile}`);
    console.log(`   共加载 ${cookies.length} 个 Cookie`);

    return true;
  } catch (error) {
    console.log(`⚠️  加载 Cookie 失败: ${error.message}`);
    return false;
  }
}

/**
 * 检查 Cookie 是否有效
 * @param {Page} page
 * @returns {Promise<boolean>}
 */
async function isCookieValid(page) {
  try {
    // 检查是否显示登录页面（二维码）
    const hasQrCode = await page.locator('.slogin-qrcode-scan-page').count() > 0;

    // 检查是否已登录（查找用户头像或用户名）
    const hasUserInfo = await page.locator('.muye-header-user').count() > 0;

    // 如果没有显示登录页面且有用户信息，说明 Cookie 有效
    return !hasQrCode && hasUserInfo;
  } catch (error) {
    console.log(`⚠️  检查 Cookie 有效性时出错: ${error.message}`);
    return false;
  }
}

/**
 * 保存 Cookie 到文件
 * @param {BrowserContext} context
 * @returns {Promise<Object>}
 */
async function saveCookies(context) {
  try {
    // 获取所有 Cookie
    const cookies = await context.cookies();

    // 过滤关键 Cookie（fanqienovel.com 相关的）
    const importantCookies = cookies.filter(cookie => {
      return cookie.domain.includes('fanqienovel.com') ||
             cookie.name.includes('session') ||
             cookie.name.includes('token') ||
             cookie.name.includes('auth');
    });

    // 确保目录存在
    if (!fs.existsSync(config.cookieDir)) {
      fs.mkdirSync(config.cookieDir, { recursive: true });
    }

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const cookieFile = path.join(config.cookieDir, `fanqie-cookies-${timestamp}.json`);

    // 保存 Cookie
    fs.writeFileSync(cookieFile, JSON.stringify(importantCookies, null, 2));

    console.log(`✅ Cookie 已保存到: ${cookieFile}`);
    console.log(`   共保存 ${importantCookies.length} 个 Cookie（原始 ${cookies.length} 个）`);

    return {
      cookieFile,
      totalCookies: cookies.length,
      importantCookies: importantCookies.length,
    };
  } catch (error) {
    console.log(`⚠️  保存 Cookie 失败: ${error.message}`);
    return null;
  }
}

/**
 * 获取 Cookie 文件信息
 * @param {string} cookieFile
 * @returns {Promise<Object|null>}
 */
function getCookieInfo(cookieFile) {
  try {
    if (!cookieFile) {
      cookieFile = getLatestCookieFile();
      if (!cookieFile) {
        return null;
      }
    }

    // 读取 Cookie 文件
    const cookiesData = fs.readFileSync(cookieFile, 'utf8');
    const cookies = JSON.parse(cookiesData);

    // 提取 Cookie 创建时间（从文件名解析）
    const fileName = path.basename(cookieFile);
    const timeMatch = fileName.match(/fanqie-cookies-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
    const creationTime = timeMatch ? timeMatch[1].replace(/-/g, ':') : 'unknown';

    // 计算 Cookie 文件年龄（天）
    const cookieDate = new Date(creationTime);
    const now = new Date();
    const ageInDays = Math.floor((now - cookieDate) / (1000 * 60 * 60 * 24));

    return {
      cookieFile,
      fileName,
      creationTime,
      ageInDays,
      totalCookies: cookies.length,
      domains: [...new Set(cookies.map(c => c.domain))],
      names: cookies.map(c => c.name),
    };
  } catch (error) {
    console.log(`⚠️  获取 Cookie 信息失败: ${error.message}`);
    return null;
  }
}

/**
 * 列出所有 Cookie 文件
 * @returns {Promise<Array>}
 */
function listCookieFiles() {
  try {
    // 读取 cookies 目录
    const files = fs.readdirSync(config.cookieDir);

    // 过滤出 JSON 文件并按时间排序
    const jsonFiles = files
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a));

    // 获取每个文件的详细信息
    const cookieFiles = jsonFiles.map(file => {
      const filePath = path.join(config.cookieDir, file);
      const info = getCookieInfo(filePath);
      return info;
    }).filter(info => info !== null);

    return cookieFiles;
  } catch (error) {
    console.log(`⚠️  列出 Cookie 文件失败: ${error.message}`);
    return [];
  }
}

/**
 * 清理过期的 Cookie 文件（保留最新的 N 个）
 * @param {number} keepCount - 保留的文件数量
 * @returns {Promise<number>}
 */
function cleanupOldCookieFiles(keepCount = 5) {
  try {
    const cookieFiles = listCookieFiles();

    if (cookieFiles.length <= keepCount) {
      console.log(`✅ Cookie 文件数量正常（${cookieFiles.length} 个），无需清理`);
      return 0;
    }

    // 删除多余的文件
    let deletedCount = 0;
    for (let i = keepCount; i < cookieFiles.length; i++) {
      const filePath = cookieFiles[i].cookieFile;
      fs.unlinkSync(filePath);
      deletedCount++;
      console.log(`🗑️  已删除: ${filePath}`);
    }

    console.log(`✅ 清理完成，删除了 ${deletedCount} 个过期的 Cookie 文件`);
    return deletedCount;
  } catch (error) {
    console.log(`⚠️  清理过期 Cookie 文件失败: ${error.message}`);
    return 0;
  }
}

/**
 * 打印 Cookie 状态摘要
 */
function printCookieStatus() {
  console.log('\n' + '='.repeat(60));
  console.log('  Cookie 状态摘要');
  console.log('='.repeat(60));

  const cookieFiles = listCookieFiles();

  if (cookieFiles.length === 0) {
    console.log('\n❌ 未找到任何 Cookie 文件');
    console.log('   请运行 `node scripts/login-save-cookies.js` 生成 Cookie\n');
    return;
  }

  console.log(`\n📁 共找到 ${cookieFiles.length} 个 Cookie 文件\n`);

  // 显示最新的 Cookie 信息
  const latest = cookieFiles[0];
  console.log('📌 最新的 Cookie 文件:');
  console.log(`   文件名: ${latest.fileName}`);
  console.log(`   创建时间: ${latest.creationTime}`);
  console.log(`   文件年龄: ${latest.ageInDays} 天`);
  console.log(`   Cookie 数量: ${latest.totalCookies}`);
  console.log(`   涉及域名: ${latest.domains.join(', ')}`);

  if (latest.ageInDays > 7) {
    console.log(`   ⚠️  警告: Cookie 文件已超过 7 天，可能即将失效`);
  }

  console.log('');

  // 显示 Cookie 文件列表
  console.log('📋 Cookie 文件列表:');
  cookieFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file.fileName} (${file.ageInDays} 天前)`);
  });

  console.log('\n' + '='.repeat(60) + '\n');
}

module.exports = {
  getLatestCookieFile,
  loadCookies,
  isCookieValid,
  saveCookies,
  getCookieInfo,
  listCookieFiles,
  cleanupOldCookieFiles,
  printCookieStatus,
};
