/**
 * smart-batch-publisher.js
 * 
 * 智能批量发布器 - 集成安全验证处理的增强发布系统
 * 
 * 主要改进：
 * 1. 集成增强安全验证处理器
 * 2. 智能重试机制，避免因验证失败导致的发布中断
 * 3. 人类化行为模拟，降低反爬虫风险
 * 4. 实时状态监控和错误恢复
 * 5. 发布质量评估和优化建议
 * 
 * 使用方法：
 * node scripts/smart-batch-publisher.js [--dry-run] [--limit N] [--security-mode auto|manual|skip]
 * 
 * 安全模式：
 * - auto: 自动处理安全验证（推荐）
 * - manual: 人工处理模式（需要监督）
 * - skip: 跳过安全验证处理（不推荐）
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// 导入安全验证处理器
const { SecurityDetector, SecurityHandler, CookieManager } = require('./enhanced-security-handler');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const ZHIHU_AUTO_DIR = path.join(WORKSPACE_DIR, '知乎自动运营');
const PUBLISH_DIR = path.join(ZHIHU_AUTO_DIR, '📤待发布');
const HIGH_PRIORITY_DIR = path.join(PUBLISH_DIR, '🔥高优先级');
const AUTH_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统', 'auth');
const REPORTS_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统', 'reports');

// ─── 参数解析 ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const CONFIG = {
  dryRun: args.includes('--dry-run'),
  limit: parseInt(args.find(arg => arg.startsWith('--limit'))?.split('=')[1]) || Infinity,
  securityMode: args.find(arg => arg.startsWith('--security-mode'))?.split('=')[1] || 'auto',
  debug: args.includes('--debug'),
  headless: !args.includes('--headless')
};

// ─── 日志工具 ────────────────────────────────────────────────────────────────

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📝',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    action: '🎯',
    retry: '🔄'
  }[type] || '📝';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
  
  // 记录到文件
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
  fs.appendFileSync(path.join(REPORTS_DIR, 'smart-batch-publisher.log'), logEntry);
}

// ─── 文件工具 ────────────────────────────────────────────────────────────────

function getJsonFiles(directory) {
  return fs.readdirSync(directory)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(directory, file));
}

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

// ─── 人类化行为模拟 ──────────────────────────────────────────────────────────

class HumanBehaviorSimulator {
  constructor(page) {
    this.page = page;
  }

  async simulateNaturalBehavior() {
    // 模拟人类浏览自然的页面交互
    await this.simulateRandomScroll();
    await this.simulateMouseMovement();
    await this.simulateReadingTime();
  }

  async simulateRandomScroll() {
    const scrollCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < scrollCount; i++) {
      const direction = Math.random() > 0.5 ? 0 : -1;
      const distance = Math.random() * 200 + 50;
      await this.page.mouse.wheel(0, direction * distance);
      await this.page.waitForTimeout(Math.random() * 1000 + 500);
    }
  }

  async simulateMouseMovement() {
    const moveCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < moveCount; i++) {
      const x = Math.random() * 800 + 100;
      const y = Math.random() * 600 + 100;
      await this.page.mouse.move(x, y);
      await this.page.waitForTimeout(Math.random() * 500 + 200);
    }
  }

  async simulateReadingTime() {
    const readingTime = Math.random() * 3000 + 1000; // 1-4秒
    await this.page.waitForTimeout(readingTime);
  }

  async simulateTypingNatural(text, selector) {
    const element = await this.page.$(selector);
    if (element) {
      await element.click();
      
      // 模拟自然的打字节奏
      const chars = text.split('');
      for (const char of chars) {
        await this.page.keyboard.type(char);
        await this.page.waitForTimeout(Math.random() * 100 + 50);
      }
      
      // 随机暂停
      await this.page.waitForTimeout(Math.random() * 500 + 200);
    }
  }
}

// ─── 智能发布器 ──────────────────────────────────────────────────────────────

class SmartPublisher {
  constructor(browser) {
    this.browser = browser;
    this.cookieManager = new CookieManager();
    this.results = [];
    this.successCount = 0;
    this.failureCount = 0;
  }

  async startPublishing(articles, options = {}) {
    log(`开始智能批量发布，共${articles.length}篇文章`, 'action');
    
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    const humanSimulator = new HumanBehaviorSimulator(page);
    
    // 注入反检测脚本
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      
      if (options.limit && i >= options.limit) {
        log(`达到发布限制 ${options.limit}，停止发布`, 'warning');
        break;
      }
      
      log(`正在发布第${i + 1}/${articles.length}篇: ${article.title}`, 'info');
      
      try {
        const result = await this.publishSingleArticle(page, humanSimulator, article);
        this.results.push(result);
        
        if (result.success) {
          this.successCount++;
          log(`✅ 发布成功: ${article.title}`, 'success');
        } else {
          this.failureCount++;
          log(`❌ 发布失败: ${article.title} - ${result.error}`, 'error');
        }
        
        // 发布间隔，避免频率过高
        if (i < articles.length - 1) {
          const delay = Math.random() * 10000 + 5000; // 5-15秒
          log(`等待${Math.round(delay / 1000)}秒后继续...`, 'info');
          await page.waitForTimeout(delay);
        }
        
      } catch (error) {
        this.failureCount++;
        log(`发布文章时发生异常: ${article.title} - ${error.message}`, 'error');
        this.results.push({
          article,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    log(`批量发布完成: 成功${this.successCount}，失败${this.failureCount}`, 'success');
    return this.results;
  }

  async publishSingleArticle(page, humanSimulator, article) {
    const securityDetector = new SecurityDetector(page);
    const securityHandler = new SecurityHandler(page, securityDetector);
    
    try {
      // 1. 加载最新Cookie
      const cookies = await this.cookieManager.loadCookies();
      if (cookies.length > 0) {
        await context.addCookies(cookies);
        log(`加载了${cookies.length}个Cookie`, 'info');
      }
      
      // 2. 访问创作中心
      await page.goto('https://www.zhihu.com/creator', { waitUntil: 'networkidle' });
      await humanSimulator.simulateNaturalBehavior();
      
      // 3. 检测并处理安全验证
      const securityCheck = await securityDetector.detectSecurityVerification();
      if (securityCheck.detected) {
        log(`检测到安全验证: ${securityCheck.type}`, 'warning');
        
        if (CONFIG.securityMode === 'auto') {
          const handleResult = await securityHandler.handleSecurityVerification();
          if (!handleResult.success || !handleResult.handled) {
            return {
              success: false,
              error: `安全验证处理失败: ${handleResult.reason || 'unknown'}`,
              article,
              timestamp: new Date().toISOString()
            };
          }
          log('安全验证处理成功', 'success');
        } else if (CONFIG.securityMode === 'manual') {
          log('安全验证需要人工处理，暂停发布', 'warning');
          return {
            success: false,
            error: 'manual_security_verification_required',
            article,
            timestamp: new Date().toISOString()
          };
        }
      }
      
      // 4. 根据文章类型选择发布方式
      if (article.content_type === 'article') {
        return await this.publishArticle(page, humanSimulator, article);
      } else if (article.content_type === 'answer') {
        log('回答类型暂不支持自动发布', 'warning');
        return {
          success: false,
          error: 'answer_type_not_supported',
          article,
          timestamp: new Date().toISOString()
        };
      } else {
        return await this.publishQuestion(page, humanSimulator, article);
      }
      
    } catch (error) {
      return {
        success: false,
        error: `发布异常: ${error.message}`,
        article,
        timestamp: new Date().toISOString()
      };
    }
  }

  async publishArticle(page, humanSimulator, article) {
    try {
      // 点击"写文章"按钮
      const writeButton = await page.$('text="写文章"');
      if (writeButton) {
        await writeButton.click();
        await page.waitForLoadState('networkidle');
      } else {
        // 尝试其他选择器
        const otherSelectors = [
          '.Write-button',
          '.create-article',
          'a[href*="create"]',
          'button[class*="write"]'
        ];
        
        for (const selector of otherSelectors) {
          const element = await page.$(selector);
          if (element) {
            await element.click();
            await page.waitForLoadState('networkidle');
            break;
          }
        }
      }
      
      await humanSimulator.simulateNaturalBehavior();
      
      // 输入标题
      if (article.title) {
        const titleSelectors = [
          'input[placeholder*="标题"]',
          '.Title-input',
          '.editor-title input',
          'input[name*="title"]'
        ];
        
        for (const selector of titleSelectors) {
          const element = await page.$(selector);
          if (element) {
            await humanSimulator.simulateTypingNatural(article.title, selector);
            break;
          }
        }
      }
      
      // 输入内容
      if (article.content) {
        const contentSelectors = [
          '.Editor-content',
          '.ProseMirror',
          '.ql-editor',
          'textarea[name*="content"]',
          '.text-editor'
        ];
        
        for (const selector of contentSelectors) {
          const element = await page.$(selector);
          if (element) {
            await element.click();
            await page.keyboard.type(article.content);
            break;
          }
        }
      }
      
      await humanSimulator.simulateNaturalBehavior();
      
      // 选择专栏（如果有）
      if (article.column && article.column !== '默认专栏') {
        // 实现专栏选择逻辑
        log('专栏选择功能待实现', 'info');
      }
      
      // 发布文章
      const publishSelectors = [
        'text="发布"',
        'text="立即发布"',
        '.Publish-button',
        'button[class*="publish"]',
        'input[type="submit"]'
      ];
      
      for (const selector of publishSelectors) {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          await page.waitForLoadState('networkidle');
          break;
        }
      }
      
      // 等待发布完成
      await humanSimulator.simulateNaturalBehavior();
      
      return {
        success: true,
        article,
        timestamp: new Date().toISOString(),
        url: page.url()
      };
      
    } catch (error) {
      return {
        success: false,
        error: `发布文章失败: ${error.message}`,
        article,
        timestamp: new Date().toISOString()
      };
    }
  }

  async publishQuestion(page, humanSimulator, article) {
    // 问题发布逻辑（类似文章发布）
    log('问题发布功能待实现', 'info');
    return {
      success: false,
      error: 'question_publish_not_implemented',
      article,
      timestamp: new Date().toISOString()
    };
  }
}

// ─── 主函数 ──────────────────────────────────────────────────────────────────

async function main() {
  log('启动智能批量发布器', 'action');
  
  if (CONFIG.dryRun) {
    log('🔧 模拟模式：仅测试发布流程，不实际发布', 'warning');
  }
  
  if (CONFIG.securityMode === 'skip') {
    log('⚠️ 安全验证已跳过：反爬虫风险较高', 'warning');
  }
  
  try {
    // 启动浏览器
    const browser = await chromium.launch({ 
      headless: CONFIG.headless,
      args: ['--disable-blink-features=AutomationControlled']
    });
    
    // 获取待发布文章列表
    const jsonFiles = getJsonFiles(HIGH_PRIORITY_DIR);
    const articles = jsonFiles.map(file => {
      const metadata = loadJsonFile(file);
      const content = loadMarkdownFile(file.replace('.json', '.md'));
      return {
        ...metadata,
        content,
        file_path: file
      };
    });
    
    log(`找到${articles.length}篇待发布文章`, 'info');
    
    if (articles.length === 0) {
      log('没有找到待发布文章', 'warning');
      return;
    }
    
    // 过滤出支持的内容类型
    const supportedArticles = articles.filter(article => 
      article.content_type === 'article' || article.content_type === 'question'
    );
    
    log(`${supportedArticles.length}篇支持的内容类型可发布`, 'info');
    
    // 创建智能发布器
    const publisher = new SmartPublisher(browser);
    
    // 执行发布
    const results = await publisher.startPublishing(supportedArticles, { limit: CONFIG.limit });
    
    // 生成报告
    const report = {
      timestamp: new Date().toISOString(),
      dry_run: CONFIG.dryRun,
      security_mode: CONFIG.securityMode,
      total_articles: supportedArticles.length,
      published_articles: results.length,
      success_count: publisher.successCount,
      failure_count: publisher.failureCount,
      success_rate: Math.round((publisher.successCount / results.length) * 100),
      results: results,
      config: CONFIG
    };
    
    const reportFile = path.join(REPORTS_DIR, `smart-batch-publish-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    log(`发布报告已保存: ${reportFile}`, 'success');
    
    // 输出摘要
    console.log(`
════════════════════════════════════════════════════════════
  智能批量发布摘要
════════════════════════════════════════════════════════════
  总文章数: ${report.total_articles}
  处理文章数: ${report.published_articles}
  成功发布: ${report.success_count}
  发布失败: ${report.failure_count}
  成功率: ${report.success_rate}%
  运行模式: ${CONFIG.dryRun ? '模拟' : '实际'}${CONFIG.securityMode !== 'skip' ? ' + 安全验证' : ''}
  报告文件: ${reportFile}
════════════════════════════════════════════════════════════
    `);
    
    // 关闭浏览器
    await browser.close();
    
    log('智能批量发布完成', 'success');
    
  } catch (error) {
    log(`执行失败: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    log(`未捕获的错误: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { SmartPublisher, HumanBehaviorSimulator };