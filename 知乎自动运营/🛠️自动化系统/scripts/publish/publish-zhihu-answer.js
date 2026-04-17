#!/usr/bin/env node

/**
 * publish-zhihu-answer.js
 *
 * 知乎回答自动发布脚本
 *
 * 功能：
 *   1. 加载知乎 Cookie
 *   2. 登录知乎
 *   3. 导航到问题页面
 *   4. 填充回答内容
 *   5. 发布回答
 *   6. 验证发布成功
 *
 * 使用方法：
 *   node scripts/publish/publish-zhihu-answer.js <answer-file>
 *
 * 参数：
 *   answer-file: 回答文件路径（JSON 格式，包含问题 ID、内容、标签等）
 *
 * 回答文件格式：
 *   {
 *     "questionId": "问题 ID 或 URL",
 *     "content": "回答内容（Markdown 格式）",
 *     "publishDelay": 2000  // 发布延迟（毫秒，可选）
 *   }
 *
 * 依赖：
 *   - playwright
 *   - 已保存的知乎 Cookie（auth/zhihu-cookies-latest.json）
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const ZHIHU_AUTO_DIR = path.join(WORKSPACE_DIR, '知乎自动运营');
const AUTO_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统');
const AUTH_DIR = path.join(AUTO_DIR, 'auth');
const DATA_DIR = path.join(AUTO_DIR, 'data');

const CONFIG = {
  // Cookie 文件路径
  cookieFile: path.join(AUTH_DIR, 'zhihu-cookies-latest.json'),

  // 知乎页面 URL
  urls: {
    home: 'https://www.zhihu.com',
    creator: 'https://www.zhihu.com/creator'
  },

  // 发布数据目录
  dataDir: DATA_DIR,

  // 模拟真实用户行为的延迟（毫秒）
  delays: {
    typing: 50,      // 打字延迟
    action: 500,     // 点击、输入等操作延迟
    navigation: 2000  // 页面导航延迟
  }
};

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(DATA_DIR);
ensureDir(AUTH_DIR);

// ─── Cookie 管理 ───────────────────────────────────────────────────────────────

/**
 * 加载知乎 Cookie
 */
async function loadCookies(context) {
  if (!fs.existsSync(CONFIG.cookieFile)) {
    throw new Error(`Cookie 文件不存在: ${CONFIG.cookieFile}\n请先运行: node scripts/utils/extract-zhihu-cookies.js`);
  }

  try {
    const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));
    await context.addCookies(cookies);
    console.log(`✅ 已加载 ${cookies.length} 个知乎 Cookie`);

    // 检查关键 Cookie
    const hasDc0 = cookies.some(c => c.name === 'd_c0' && c.value);
    const hasZc0 = cookies.some(c => c.name === 'z_c0' && c.value);

    if (!hasDc0 && !hasZc0) {
      console.warn('⚠️  未检测到关键 Cookie（d_c0 / z_c0）');
      console.warn('   Cookie 可能已过期，请重新登录');
    }

    return cookies.length;
  } catch (error) {
    throw new Error(`加载 Cookie 失败: ${error.message}`);
  }
}

// ─── 辅助函数 ───────────────────────────────────────────────────────────────

/**
 * 随机延迟（模拟真实用户行为）
 */
function randomDelay(min = 500, max = 2000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 人类化输入（逐字输入，模拟真实打字）
 */
async function humanType(page, selector, text, options = {}) {
  const element = await page.$(selector);
  if (!element) {
    throw new Error(`找不到元素: ${selector}`);
  }

  await element.click();
  await randomDelay(CONFIG.delays.action);

  // 逐字输入
  for (let i = 0; i < text.length; i++) {
    await page.keyboard.type(text[i]);
    if (i % 10 === 0) {  // 每输入 10 个字符，随机暂停一下
      await randomDelay(CONFIG.delays.typing, CONFIG.delays.typing * 2);
    }
  }
}

/**
 * 提取问题 ID
 */
function extractQuestionId(questionInput) {
  // 如果输入已经是完整的 URL，提取问题 ID
  if (questionInput.includes('zhihu.com/question/')) {
    const match = questionInput.match(/question\/(\d+)/);
    if (match) {
      return match[1];
    }
  }

  // 如果输入已经是数字，直接返回
  if (/^\d+$/.test(questionInput)) {
    return questionInput;
  }

  // 否则抛出错误
  throw new Error(`无效的问题 ID 或 URL: ${questionInput}`);
}

// ─── 发布流程 ───────────────────────────────────────────────────────────────

/**
 * 检查登录状态
 */
async function checkLoginStatus(page) {
  console.log('\n📊 检查登录状态...');

  try {
    // 访问知乎首页
    await page.goto(CONFIG.urls.home, { waitUntil: 'networkidle' });
    await randomDelay(CONFIG.delays.navigation);

    // 检查是否跳转到登录页
    if (page.url().includes('signin')) {
      throw new Error('未登录，Cookie 可能已过期');
    }

    // 检查页面内容
    const bodyText = await page.evaluate(() => document.body.innerText);

    if (bodyText.includes('登录') || bodyText.includes('注册')) {
      throw new Error('未登录');
    }

    console.log('✅ 已登录');

    return true;
  } catch (error) {
    console.error(`❌ 登录检查失败: ${error.message}`);
    throw error;
  }
}

/**
 * 创建回答
 */
async function createAnswer(page, answerData) {
  console.log('\n📝 创建回答...');
  console.log(`   问题 ID: ${answerData.questionId}`);

  try {
    // 构建问题 URL
    const questionUrl = `https://www.zhihu.com/question/${answerData.questionId}`;

    // 访问问题页面
    console.log(`📄 导航到问题页面: ${questionUrl}`);
    await page.goto(questionUrl, { waitUntil: 'domcontentloaded' });
    await randomDelay(CONFIG.delays.navigation);

    // 等待问题页面加载
    await page.waitForLoadState('domcontentloaded');
    await randomDelay(CONFIG.delays.action);

    // 滚动到底部，找到回答输入框
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await randomDelay(CONFIG.delays.action);

    // 查找回答输入框
    const answerInputSelectors = [
      '[placeholder="写下你的回答..."]',
      '[contenteditable="true"]',
      '.Public-DraftEditor-content',
      '.DraftEditor-editorContainer .public-DraftEditor-content'
    ];

    let answerInput = null;
    let usedSelector = null;

    for (const selector of answerInputSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        answerInput = await page.$(selector);
        if (answerInput) {
          console.log(`   找到回答输入框: ${selector}`);
          usedSelector = selector;
          break;
        }
      } catch (e) {
        // 继续尝试下一个选择器
        continue;
      }
    }

    if (!answerInput) {
      // 如果找不到输入框，可能是需要点击"写回答"按钮
      console.log('   未找到回答输入框，尝试点击"写回答"按钮...');

      const writeAnswerButtonSelectors = [
        'button:has-text("写回答")',
        '.QuestionHeader-actions button',
        'a:has-text("写回答")'
      ];

      for (const selector of writeAnswerButtonSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            console.log(`   找到"写回答"按钮: ${selector}`);
            await button.click();
            await randomDelay(CONFIG.delays.action);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // 重新查找输入框
      await randomDelay(CONFIG.delays.action);

      for (const selector of answerInputSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          answerInput = await page.$(selector);
          if (answerInput) {
            console.log(`   找到回答输入框: ${selector}`);
            usedSelector = selector;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!answerInput) {
        throw new Error('找不到回答输入框，请检查页面结构或手动测试');
      }
    }

    // 点击回答输入框
    await answerInput.click();
    await randomDelay(CONFIG.delays.action);

    // 输入回答内容
    console.log('⌨️  输入回答内容...');
    console.log(`   内容长度: ${answerData.content.length} 字符`);

    // 使用 evaluate 直接设置 innerHTML，模拟粘贴
    await page.evaluate((content) => {
      const editor = document.querySelector('.public-DraftEditor-content, [contenteditable="true"]');
      if (editor) {
        editor.innerHTML = content;
        // 触发 input 事件
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        // 触发 change 事件
        editor.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, answerData.content);

    await randomDelay(CONFIG.delays.action);

    // 滚动一下，确保内容加载完整
    await page.evaluate(() => window.scrollBy(0, 500));
    await randomDelay(CONFIG.delays.action);

    console.log('✅ 回答内容填写完成');
    return true;

  } catch (error) {
    console.error(`❌ 创建回答失败: ${error.message}`);
    throw error;
  }
}

/**
 * 发布回答
 */
async function publishAnswer(page, publishDelay) {
  console.log('\n🚀 发布回答...');

  try {
    // 如果设置了发布延迟，等待一下
    if (publishDelay && publishDelay > 0) {
      console.log(`⏳ 等待 ${publishDelay}ms 后发布...`);
      await new Promise(resolve => setTimeout(resolve, publishDelay));
    }

    // 查找发布按钮
    const publishButtonSelectors = [
      'button:has-text("发布回答")',
      'button:has-text("发布")',
      '.Button--primary:has-text("发布回答")',
      '.Button--primary:has-text("发布")',
      '[data-testid="publish-button"]',
      '.PublishButton'
    ];

    let publishButton = null;
    let usedSelector = null;

    for (const selector of publishButtonSelectors) {
      try {
        publishButton = await page.$(selector);
        if (publishButton) {
          console.log(`   找到发布按钮: ${selector}`);
          usedSelector = selector;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!publishButton) {
      throw new Error('找不到发布按钮');
    }

    // 等待按钮可点击
    await publishButton.waitForElementState('enabled', { timeout: 10000 });
    await randomDelay(CONFIG.delays.action);

    // 点击发布按钮
    console.log('⌨️  点击发布按钮...');
    await publishButton.click();
    await randomDelay(CONFIG.delays.action);

    // 等待发布完成
    console.log('⏳ 等待发布完成...');

    // 等待页面 URL 变化或页面刷新
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // 检查是否成功发布（URL 包含 /answer/）
    await page.waitForURL(/\/answer\//, { timeout: 10000 });

    console.log('✅ 发布成功！');

    // 获取回答 URL
    const answerUrl = page.url();
    console.log(`   回答 URL: ${answerUrl}`);

    return answerUrl;

  } catch (error) {
    console.error(`❌ 发布失败: ${error.message}`);
    throw error;
  }
}

/**
 * 验证发布结果
 */
async function verifyPublish(page, answerUrl) {
  console.log('\n🔍 验证发布结果...');

  try {
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    await randomDelay(CONFIG.delays.navigation);

    // 检查页面标题
    const pageTitle = await page.title();
    console.log(`   页面标题: ${pageTitle}`);

    // 检查是否是回答详情页
    if (answerUrl.includes('/answer/')) {
      console.log('✅ 验证通过：已成功跳转到回答详情页');

      // 提取回答 ID
      const answerId = answerUrl.split('/answer/')[1];
      console.log(`   回答 ID: ${answerId}`);

      return {
        success: true,
        answerUrl,
        answerId
      };
    } else {
      throw new Error('未跳转到回答详情页');
    }

  } catch (error) {
    console.error(`❌ 验证失败: ${error.message}`);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('═'.repeat(60));
  console.log('  知乎回答自动发布脚本');
  console.log('═'.repeat(60));
  console.log('');

  // 解析命令行参数
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ 缺少回答文件参数');
    console.error('\n使用方法:');
    console.error('  node scripts/publish/publish-zhihu-answer.js <answer-file>');
    console.error('\n示例:');
    console.error('  node scripts/publish/publish-zhihu-answer.js answer.json');
    console.error('\n回答文件格式:');
    console.error('  {');
    console.error('    "questionId": "123456",');
    console.error('    "content": "回答内容（Markdown 格式）",');
    console.error('    "publishDelay": 2000  // 可选');
    console.error('  }');
    process.exit(1);
  }

  const answerFile = args[0];

  // 读取回答文件
  if (!fs.existsSync(answerFile)) {
    console.error(`❌ 回答文件不存在: ${answerFile}`);
    process.exit(1);
  }

  let answerData;
  try {
    answerData = JSON.parse(fs.readFileSync(answerFile, 'utf8'));
    console.log(`📄 已加载回答文件: ${answerFile}`);
    console.log(`   问题 ID: ${answerData.questionId}`);
  } catch (error) {
    console.error(`❌ 读取回答文件失败: ${error.message}`);
    process.exit(1);
  }

  // 验证回答数据
  if (!answerData.questionId || !answerData.content) {
    console.error('❌ 回答数据缺少必需字段（questionId、content）');
    process.exit(1);
  }

  // 提取问题 ID
  const questionId = extractQuestionId(answerData.questionId);
  answerData.questionId = questionId;

  let browser;
  let result = {
    timestamp: new Date().toISOString(),
    answerFile,
    answerData: {
      questionId: answerData.questionId,
      contentLength: answerData.content.length
    },
    success: false,
    answerUrl: null,
    answerId: null,
    error: null
  };

  try {
    // 启动浏览器
    console.log('\n🌐 启动浏览器...');
    browser = await chromium.launch({
      headless: false,  // 显示浏览器窗口，便于调试
      slowMo: 50        // 减慢操作速度
    });

    // 创建上下文
    console.log('📍 创建浏览器上下文...');
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // 加载 Cookie
    await loadCookies(context);

    // 检查登录状态
    await checkLoginStatus(page);

    // 创建回答
    await createAnswer(page, answerData);

    // 截图（发布前）
    const screenshotFile1 = path.join(DATA_DIR, `answer-before-${Date.now()}.png`);
    await page.screenshot({ path: screenshotFile1, fullPage: true });
    console.log(`\n📸 发布前截图: ${screenshotFile1}`);

    // 发布回答
    const publishDelay = answerData.publishDelay || 0;
    const answerUrl = await publishAnswer(page, publishDelay);

    // 验证发布结果
    const verifyResult = await verifyPublish(page, answerUrl);

    // 截图（发布后）
    const screenshotFile2 = path.join(DATA_DIR, `answer-after-${Date.now()}.png`);
    await page.screenshot({ path: screenshotFile2, fullPage: true });
    console.log(`📸 发布后截图: ${screenshotFile2}`);

    // 更新结果
    result.success = true;
    result.answerUrl = answerUrl;
    result.answerId = verifyResult.answerId;
    result.screenshots = [screenshotFile1, screenshotFile2];

    console.log('\n' + '═'.repeat(60));
    console.log('  ✅ 发布完成！');
    console.log('═'.repeat(60));
    console.log(`\n  问题 ID: ${answerData.questionId}`);
    console.log(`  回答 URL: ${answerUrl}`);
    console.log(`  回答 ID: ${verifyResult.answerId}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ 发布失败:', error.message);
    console.error(error.stack);

    result.error = error.message;

    // 保存错误截图
    if (browser) {
      const pages = await browser.pages();
      if (pages.length > 0) {
        const errorScreenshot = path.join(DATA_DIR, `answer-error-${Date.now()}.png`);
        await pages[0].screenshot({ path: errorScreenshot, fullPage: true });
        console.log(`\n📸 错误截图: ${errorScreenshot}`);
        result.errorScreenshot = errorScreenshot;
      }
    }
  } finally {
    // 保存发布记录
    const recordFile = path.join(DATA_DIR, `answer-record-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(recordFile, JSON.stringify(result, null, 2));
    console.log(`\n📄 发布记录: ${recordFile}`);

    // 关闭浏览器
    if (browser) {
      console.log('\n🚪 正在关闭浏览器...');
      await browser.close();
      console.log('✅ 浏览器已关闭\n');
    }
  }

  // 返回状态码
  process.exit(result.success ? 0 : 1);
}

// 运行主函数
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { main };
