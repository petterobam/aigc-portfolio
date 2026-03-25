#!/usr/bin/env node

/**
 * 番茄小说浏览器长连接服务
 *
 * 核心功能：
 * 1. 保持浏览器长连接
 * 2. 提供 HTTP API 供外部调用
 * 3. 自动登录和 session 管理
 * 4. 番茄小说平台专用操作
 */

const { chromium } = require('playwright');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// 配置
const CONFIG = {
  // 浏览器配置
  USER_DATA_DIR: path.join(__dirname, '../data/chrome-user-data'),
  HEADLESS: false,  // 显示浏览器

  // 服务配置
  PORT: 3001,
  HOST: '127.0.0.1',

  // 番茄小说配置
  FANQIE_BASE_URL: 'https://fanqienovel.com',
  LOGIN_URL: 'https://fanqienovel.com/main/writer/short-manage',

  // 超时配置
  NAVIGATION_TIMEOUT: 30000,
  WAIT_TIMEOUT: 10000,
};

// 全局变量
let browser = null;
let context = null;
let page = null;
let isLoggedIn = false;

// Express 应用
const app = express();
app.use(cors());
app.use(express.json());

/**
 * 初始化浏览器
 */
async function initBrowser() {
  console.log('🚀 启动浏览器...');

  try {
    // 启动浏览器（持久化上下文）
    browser = await chromium.launchPersistentContext(CONFIG.USER_DATA_DIR, {
      headless: CONFIG.HEADLESS,
      channel: 'chrome',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
      ],
    });

    // 获取或创建页面
    const pages = browser.pages();
    if (pages.length > 0) {
      page = pages[0];
    } else {
      page = await browser.newPage();
    }

    console.log('✅ 浏览器启动成功');
    return true;
  } catch (error) {
    console.error('❌ 浏览器启动失败:', error.message);
    return false;
  }
}

/**
 * 检查登录状态
 */
async function checkLogin() {
  if (!page) return false;

  try {
    // 访问登录页面
    await page.goto(CONFIG.LOGIN_URL, {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.NAVIGATION_TIMEOUT,
    });

    // 等待页面加载
    await page.waitForTimeout(2000);

    // 检查是否登录
    const isLoggedIn = await page.evaluate(() => {
      return document.body.innerText.includes('帅帅它爸');
    });

    return isLoggedIn;
  } catch (error) {
    console.error('检查登录状态失败:', error.message);
    return false;
  }
}

/**
 * 导航到指定 URL
 */
async function navigate(url) {
  if (!page) {
    return { success: false, error: '浏览器未初始化' };
  }

  try {
    // 检查页面是否仍然有效
    if (page.isClosed()) {
      console.log('⚠️ 页面已关闭，重新创建页面');
      const pages = browser.pages();
      if (pages.length > 0) {
        page = pages[0];
      } else {
        page = await browser.newPage();
      }
    }

    console.log(`🌐 导航到: ${url}`);
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.NAVIGATION_TIMEOUT,
    });

    await page.waitForTimeout(2000);

    return {
      success: true,
      url: page.url(),
      title: await page.title(),
    };
  } catch (error) {
    console.error('导航失败:', error.message);
    // 如果浏览器关闭了，尝试重新创建
    if (error.message.includes('has been closed')) {
      console.log('🔄 浏览器已关闭，尝试重新创建...');
      await initBrowser();
      return await navigate(url);  // 重试
    }
    return { success: false, error: error.message };
  }
}

/**
 * 执行 JavaScript 代码
 */
async function executeScript(code) {
  if (!page) {
    return { success: false, error: '浏览器未初始化' };
  }

  try {
    const result = await page.evaluate(code);
    return { success: true, result };
  } catch (error) {
    console.error('执行脚本失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 点击元素
 */
async function click(selector) {
  if (!page) {
    return { success: false, error: '浏览器未初始化' };
  }

  try {
    console.log(`🖱️ 点击元素: ${selector}`);
    await page.click(selector, { timeout: CONFIG.WAIT_TIMEOUT });
    await page.waitForTimeout(1000);
    return { success: true };
  } catch (error) {
    console.error('点击失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 输入文字
 */
async function typeText(selector, text) {
  if (!page) {
    return { success: false, error: '浏览器未初始化' };
  }

  try {
    console.log(`⌨️ 输入文字到 ${selector}: ${text}`);
    await page.fill(selector, text);
    return { success: true };
  } catch (error) {
    console.error('输入失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 等待元素
 */
async function waitFor(selector, timeout = CONFIG.WAIT_TIMEOUT) {
  if (!page) {
    return { success: false, error: '浏览器未初始化' };
  }

  try {
    await page.waitForSelector(selector, { timeout });
    return { success: true };
  } catch (error) {
    console.error('等待元素失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 截图
 */
async function screenshot() {
  if (!page) {
    return { success: false, error: '浏览器未初始化' };
  }

  try {
    const buffer = await page.screenshot({ fullPage: true });
    return { success: true, image: buffer.toString('base64') };
  } catch (error) {
    console.error('截图失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 获取页面内容
 */
async function getContent() {
  if (!page) {
    return { success: false, error: '浏览器未初始化' };
  }

  try {
    const content = await page.content();
    const title = await page.title();
    const url = page.url();

    return {
      success: true,
      title,
      url,
      content,
    };
  } catch (error) {
    console.error('获取页面内容失败:', error.message);
    return { success: false, error: error.message };
  }
}

// ===== API 路由 =====

/**
 * GET /status
 * 获取服务状态
 */
app.get('/status', async (req, res) => {
  const status = {
    server: 'running',
    browser: browser ? 'connected' : 'disconnected',
    page: page ? 'active' : 'inactive',
    isLoggedIn,
    url: page ? page.url() : null,
  };
  res.json(status);
});

/**
 * GET /login
 * 检查登录状态
 */
app.get('/login', async (req, res) => {
  const loggedIn = await checkLogin();
  isLoggedIn = loggedIn;
  res.json({ success: true, isLoggedIn });
});

/**
 * POST /navigate
 * 导航到指定 URL
 */
app.post('/navigate', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: '缺少 URL 参数' });
  }

  const result = await navigate(url);
  res.json(result);
});

/**
 * POST /execute
 * 执行 JavaScript 代码
 */
app.post('/execute', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: '缺少 code 参数' });
  }

  const result = await executeScript(code);
  res.json(result);
});

/**
 * POST /click
 * 点击元素
 */
app.post('/click', async (req, res) => {
  const { selector } = req.body;
  if (!selector) {
    return res.status(400).json({ success: false, error: '缺少 selector 参数' });
  }

  const result = await click(selector);
  res.json(result);
});

/**
 * POST /type
 * 输入文字
 */
app.post('/type', async (req, res) => {
  const { selector, text } = req.body;
  if (!selector || text === undefined) {
    return res.status(400).json({ success: false, error: '缺少 selector 或 text 参数' });
  }

  const result = await typeText(selector, text);
  res.json(result);
});

/**
 * POST /wait
 * 等待元素
 */
app.post('/wait', async (req, res) => {
  const { selector, timeout } = req.body;
  if (!selector) {
    return res.status(400).json({ success: false, error: '缺少 selector 参数' });
  }

  const result = await waitFor(selector, timeout);
  res.json(result);
});

/**
 * GET /screenshot
 * 截图
 */
app.get('/screenshot', async (req, res) => {
  const result = await screenshot();
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

/**
 * GET /content
 * 获取页面内容
 */
app.get('/content', async (req, res) => {
  const result = await getContent();
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ===== 番茄小说专用 API =====

/**
 * GET /fanqie/stories
 * 获取番茄小说短故事列表
 */
app.get('/fanqie/stories', async (req, res) => {
  // 先导航到短故事管理页面
  const navResult = await navigate(CONFIG.LOGIN_URL);
  if (!navResult.success) {
    return res.status(500).json(navResult);
  }

  // 等待页面加载
  await page.waitForTimeout(3000);

  // 提取故事数据
  const code = `
    () => {
      const items = [];
      document.querySelectorAll('.article-item').forEach((item, index) => {
        const title = item.querySelector('.article-item-title')?.textContent?.trim() || '';
        const read = item.querySelector('.article-item-read')?.textContent?.trim() || '0';
        const number = item.querySelector('.article-item-number')?.textContent?.trim() || '0';
        const time = item.querySelector('.article-item-time')?.textContent?.trim() || '';

        items.push({
          index: index + 1,
          title,
          read,
          number,
          time,
        });
      });
      return items;
    }
  `;

  const result = await executeScript(code);
  res.json(result);
});

/**
 * POST /fanqie/navigate
 * 导航到番茄小说指定页面
 */
app.post('/fanqie/navigate', async (req, res) => {
  const { path } = req.body;
  const url = `${CONFIG.FANQIE_BASE_URL}${path}`;

  const result = await navigate(url);
  res.json(result);
});

// ===== 启动服务 =====

async function startServer() {
  console.log('🎬 启动番茄小说浏览器长连接服务...');

  // 初始化浏览器
  const browserInitialized = await initBrowser();
  if (!browserInitialized) {
    console.error('浏览器初始化失败，服务启动中止');
    process.exit(1);
  }

  // 检查登录状态
  isLoggedIn = await checkLogin();
  console.log(isLoggedIn ? '✅ 已登录（帅帅它爸）' : '⚠️ 未登录，请手动登录');

  // 导航到番茄小说页面
  await navigate(CONFIG.LOGIN_URL);

  // 启动 HTTP 服务
  app.listen(CONFIG.PORT, CONFIG.HOST, () => {
    console.log('\n==========================================');
    console.log('✅ 番茄小说浏览器长连接服务已启动');
    console.log('==========================================');
    console.log(`📡 服务地址: http://${CONFIG.HOST}:${CONFIG.PORT}`);
    console.log(`📚 API 文档: http://${CONFIG.HOST}:${CONFIG.PORT}/docs`);
    console.log(`🔍 登录状态: ${isLoggedIn ? '已登录' : '未登录'}`);
    console.log('==========================================\n');
  });
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n👋 正在关闭服务...');

  if (browser) {
    await browser.close();
    console.log('✅ 浏览器已关闭');
  }

  process.exit(0);
});

// 启动服务
startServer().catch((error) => {
  console.error('启动服务失败:', error);
  process.exit(1);
});
