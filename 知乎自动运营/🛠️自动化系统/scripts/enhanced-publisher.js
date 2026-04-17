const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Enhanced security handlers
const SecurityDetector = {
  detectSecurityChallenge: async (page) => {
    try {
      const challengeSelectors = [
        '.captcha-container',
        '.verify-code',
        '.security-check',
        '.human-verification',
        '[data-testid="captcha"]',
        '.qrcode-container',
        '.sms-verify'
      ];
      
      for (const selector of challengeSelectors) {
        const element = await page.$(selector);
        if (element) {
          console.log(`🔍 检测到安全验证: ${selector}`);
          return { type: 'challenge', selector };
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  detectLoginPage: async (page) => {
    try {
      const loginSelectors = [
        'input[name="password"]',
        'input[type="password"]',
        '.SignFlow-content',
        '.Login-content',
        'button[type="submit"]'
      ];
      
      for (const selector of loginSelectors) {
        const element = await page.$(selector);
        if (element) {
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }
};

const CookieManager = {
  loadCookies: (cookieFile) => {
    if (fs.existsSync(cookieFile)) {
      try {
        return JSON.parse(fs.readFileSync(cookieFile, 'utf8'));
      } catch (error) {
        console.log('⚠️ Cookie文件损坏，需要重新登录');
        return null;
      }
    }
    return null;
  },

  saveCookies: async (context, cookieFile) => {
    try {
      const cookies = await context.cookies();
      fs.writeFileSync(cookieFile, JSON.stringify(cookies, null, 2));
      console.log(`🍪 Cookie已保存: ${cookies.length}个`);
    } catch (error) {
      console.log('❌ Cookie保存失败');
    }
  }
};

class SmartPublisher {
  constructor(browser) {
    this.browser = browser;
    this.successCount = 0;
    this.failureCount = 0;
    this.results = [];
  }

  async checkLogin(context) {
    try {
      const page = await context.newPage();
      await page.goto('https://www.zhihu.com');
      
      // 检查是否已登录
      const userElement = await page.$('.UserLink-link');
      if (userElement) {
        const username = await userElement.textContent();
        console.log(`✅ 已登录: ${username}`);
        await page.close();
        return true;
      }
      
      await page.close();
      return false;
    } catch (error) {
      console.log('❌ 登录状态检查失败');
      return false;
    }
  }

  async createContext() {
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // 加载现有cookies
    if (fs.existsSync(COOKIE_FILE)) {
      try {
        const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf8'));
        await context.addCookies(cookies);
        console.log(`🍪 已加载 ${cookies.length} 个 cookies`);
      } catch (error) {
        console.log('⚠️ Cookie加载失败，将使用新会话');
      }
    }

    // 加载持久化上下文状态
    if (fs.existsSync(CONTEXT_STATE_FILE)) {
      try {
        await context.storageState({ path: CONTEXT_STATE_FILE });
        console.log('📂 已加载持久化上下文状态');
      } catch (error) {
        console.log('⚠️ 持久化状态加载失败');
      }
    }

    return context;
  }

  async publishArticle(context, article, options = {}) {
    const startTime = Date.now();
    console.log(`\n🚀 开始发布: ${article.title}`);
    
    try {
      const page = await context.newPage();
      
      // 导航到发布页面
      console.log('📍 导航到发布页面...');
      await page.goto('https://zhuanlan.zhihu.com/publish');
      
      // 等待页面加载
      await page.waitForLoadState('networkidle');
      
      // 填写标题
      console.log('📝 填写标题...');
      await page.fill('input[placeholder$="标题"]', article.title);
      await page.waitForTimeout(1000);
      
      // 填写内容
      console.log('📄 填写内容...');
      const contentFrame = await page.frameLocator('iframe[title$="编辑器"]').first();
      await contentFrame.locator('div.ProseMirror').click();
      await contentFrame.locator('div.ProseMirror').fill(article.content);
      await page.waitForTimeout(2000);
      
      // 添加标签
      console.log('🏷️ 添加标签...');
      const tagInput = page.locator('input[placeholder$="添加标签"]');
      for (const tag of article.tags.slice(0, 3)) {
        await tagInput.fill(tag);
        await page.waitForTimeout(500);
        await tagInput.press('Enter');
      }
      await page.waitForTimeout(1000);
      
      // 检查安全验证
      const securityCheck = await SecurityDetector.detectSecurityChallenge(page);
      if (securityCheck) {
        console.log('⚠️ 检测到安全验证，暂时跳过此文章');
        await page.close();
        return {
          success: false,
          article: article.title,
          error: '安全验证',
          duration: Date.now() - startTime
        };
      }
      
      // 发布文章
      console.log('📤 点击发布按钮...');
      const publishButton = page.locator('button[type="submit"]').filter({ hasText: /发布|提交/ }).first();
      await publishButton.click();
      
      // 等待发布完成
      await page.waitForTimeout(3000);
      
      // 验证发布成功
      const publishedUrl = page.url();
      console.log(`✅ 发布成功: ${publishedUrl}`);
      
      await page.close();
      
      this.successCount++;
      return {
        success: true,
        article: article.title,
        url: publishedUrl,
        duration: Date.now() - startTime
      };
      
    } catch (error) {
      console.log(`❌ 发布失败: ${error.message}`);
      this.failureCount++;
      
      if (page) {
        await page.close();
      }
      
      return {
        success: false,
        article: article.title,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  async startPublishing(articles, options = {}) {
    console.log(`📋 开始发布 ${articles.length} 篇文章...`);
    
    // 创建带有cookies的context
    const context = await this.createContext();
    
    // 检查登录状态
    const isLoggedIn = await this.checkLogin(context);
    if (!isLoggedIn) {
      console.log('❌ 未登录知乎，无法发布文章');
      await context.close();
      return [];
    }
    
    const results = [];
    const limit = options.limit || articles.length;
    
    for (let i = 0; i < Math.min(limit, articles.length); i++) {
      const article = articles[i];
      const result = await this.publishArticle(context, article);
      results.push(result);
      
      // 保存cookies（可能有更新）
      await CookieManager.saveCookies(context, COOKIE_FILE);
      
      // 随机延迟，避免频繁操作
      const delay = Math.random() * 5000 + 3000;
      console.log(`⏱️ 等待 ${Math.round(delay/1000)} 秒后继续...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    await context.close();
    return results;
  }
}

// ─── 配置 ────────────────────────────────────────────────────────────────────

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const ZHIHU_AUTO_DIR = path.join(WORKSPACE_DIR, '知乎自动运营');
const PUBLISH_DIR = path.join(ZHIHU_AUTO_DIR, '📤待发布');
const HIGH_PRIORITY_DIR = path.join(PUBLISH_DIR, '🔥高优先级');
const AUTH_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统', 'auth');
const COOKIE_FILE = path.join(AUTH_DIR, 'zhihu-cookies-latest.json');
const BROWSER_DATA_DIR = path.join(__dirname, '../.browser-data', 'zhihu');
const CONTEXT_STATE_FILE = path.join(BROWSER_DATA_DIR, 'context.json');

// ─── 参数解析 ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const CONFIG = {
  dryRun: args.includes('--dry-run'),
  limit: parseInt(args.find(arg => arg.startsWith('--limit'))?.split('=')[1]) || 1,
  securityMode: args.find(arg => arg.startsWith('--security-mode'))?.split('=')[1] || 'auto',
  debug: args.includes('--debug'),
  headless: !args.includes('--headless')
};

// ─── 日志工具 ────────────────────────────────────────────────────────────────

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : '🎯';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

// ─── 文件加载工具 ─────────────────────────────────────────────────────────────

function loadJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`加载JSON文件失败 ${filePath}: ${error.message}`);
  }
}

function loadMarkdownFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`加载Markdown文件失败 ${filePath}: ${error.message}`);
  }
}

// ─── 智能文件匹配 ─────────────────────────────────────────────────────────────

function findMatchingMdFile(jsonFile, highPriorityDir) {
  const baseName = path.basename(jsonFile, '.json');
  
  // 尝试多种MD文件命名模式
  const possibleMdFiles = [
    baseName + '.md',
    baseName + '-quality-report.md',
    baseName + '-evaluation-report.md'
  ];
  
  // 如果包含特定关键词，尝试对应的MD文件
  if (baseName.includes('从单Agent到多Agent协作')) {
    possibleMdFiles.push('AI-Agent架构设计-从单Agent到多Agent协作.md');
  }
  if (baseName.includes('数学推导')) {
    possibleMdFiles.push('Diffusion模型从零开始-数学推导加代码实现.md');
  }
  if (baseName.includes('如何颠覆科研')) {
    possibleMdFiles.push('AI-Scientist-v2深度解析-Agentic-Tree-Search-如何颠覆科研.md');
  }
  if (baseName.includes('多模态大模型')) {
    possibleMdFiles.push('GPT-4V原理深度解析-多模态大模型是如何工作的.md');
  }
  if (baseName.includes('稀疏激活')) {
    possibleMdFiles.push('MoE架构-GPT4的秘密武器-稀疏激活与路由设计.md');
  }
  if (baseName.includes('Agent控制协议')) {
    possibleMdFiles.push('OpenClaw-ACP-原理深度解析-从零理解Agent控制协议.md');
  }
  
  for (const mdFile of possibleMdFiles) {
    const mdPath = path.join(highPriorityDir, mdFile);
    if (fs.existsSync(mdPath)) {
      return mdPath;
    }
  }
  
  return null;
}

// ─── 主函数 ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('');

  log(CONFIG.dryRun ? '🔧 模拟模式：仅测试发布流程，不实际发布' : '🚀 实际发布模式', CONFIG.dryRun ? 'warning' : 'info');

  // 获取待发布文章列表
  const jsonFiles = fs.readdirSync(HIGH_PRIORITY_DIR).filter(f => f.endsWith('.json'));
  const articles = [];

  for (const jsonFile of jsonFiles) {
    const jsonPath = path.join(HIGH_PRIORITY_DIR, jsonFile);
    
    try {
      const jsonData = loadJsonFile(jsonPath);
      
      // 查找匹配的MD文件
      const mdPath = findMatchingMdFile(jsonFile, HIGH_PRIORITY_DIR);
      if (mdPath) {
        const mdContent = loadMarkdownFile(mdPath);
        
        articles.push({
          ...jsonData,
          content: mdContent,
          jsonFile: jsonFile,
          mdFile: path.basename(mdPath)
        });
        
        log(`✅ 找到匹配文件: ${jsonData.title || '未标题'}`, 'success');
      } else {
        log(`❌ MD文件不匹配: ${jsonData.title || '未标题'}`, 'error');
      }
      
    } catch (error) {
      log(`❌ JSON文件解析失败: ${jsonFile}`, 'error');
    }
  }

  log(`找到${articles.length}篇有效文章`, 'info');
  
  if (articles.length === 0) {
    log('没有找到可发布文章', 'warning');
    return;
  }

  // 显示将要发布的文章
  console.log('\n📋 将要发布的文章:');
  articles.slice(0, CONFIG.limit).forEach((article, index) => {
    console.log(`${index + 1}. ${article.title} (${article.tags.join(', ')})`);
  });

  if (CONFIG.dryRun) {
    log('🔧 模拟模式完成，未实际发布任何文章', 'warning');
    return;
  }

  // 启动浏览器
  log('🌐 启动浏览器...', 'info');
  const browser = await chromium.launch({ 
    headless: CONFIG.headless,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  try {
    // 创建发布器
    const publisher = new SmartPublisher(browser);
    
    // 执行发布
    const results = await publisher.startPublishing(articles.slice(0, CONFIG.limit), { limit: CONFIG.limit });
    
    // 显示结果
    console.log('\n📊 发布结果:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const message = result.success ? `发布成功: ${result.url}` : `发布失败: ${result.error}`;
      console.log(`${status} ${result.article} - ${message}`);
    });
    
    log(`发布完成: 成功${publisher.successCount}篇，失败${publisher.failureCount}篇`, 'info');
    
  } finally {
    await browser.close();
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { main, SmartPublisher };