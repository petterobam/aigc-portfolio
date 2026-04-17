/**
 * enhanced-security-handler.js
 * 
 * 增强安全验证处理器 - 专门解决知乎安全验证问题
 * 
 * 主要功能：
 * 1. 智能检测安全验证页面
 * 2. 自动化处理常见验证场景
 * 3. 人类化行为模拟，降低反爬虫风险
 * 4. Cookie状态监控和自动刷新
 * 5. 安全验证日志记录和分析
 * 
 * 使用方法：
 * node scripts/enhanced-security-handler.js [--mode test|auto|manual]
 * 
 * 模式说明：
 * - test: 测试安全检测能力（不处理验证）
 * - auto: 自动化处理安全验证（推荐）
 * - manual: 手动处理模式（观察模式）
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// 配置
const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const ZHIHU_AUTO_DIR = path.join(WORKSPACE_DIR, '知乎自动运营');
const AUTH_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统', 'auth');
const REPORTS_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统', 'reports');
const SCREENSHOTS_DIR = path.join(AUTH_DIR, 'screenshots');

// 运行模式
const MODE = process.argv.find(arg => arg.startsWith('--mode'))?.split('=')[1] || 'test';

// 日志工具
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '🔍',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    action: '🎯'
  }[type] || '📝';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
  
  // 记录到文件
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
  fs.appendFileSync(path.join(REPORTS_DIR, 'security-verification.log'), logEntry);
}

// 安全验证检测器
class SecurityDetector {
  constructor(page) {
    this.page = page;
    this.verificationDetected = false;
    this.verificationType = null;
    this.verificationSelectors = {
      // 知乎常见安全验证页面选择器
      'security-check': [
        'text="系统检测到您的网络环境存在异常"',
        'text="安全验证"',
        'text="验证"',
        'text="异常检测"',
        '.Security-check',
        '.captcha-container',
        '.verification-box',
        '[class*="security"]',
        '[class*="verify"]',
        'input[name*="captcha"]',
        'input[name*="code"]'
      ],
      'phone-verification': [
        'text="手机验证"',
        'text="请输入短信验证码"',
        'input[type="tel"]',
        '.phone-verification',
        '.sms-code',
        '[placeholder*="验证码"]'
      ],
      'slide-verification': [
        'text="拖动滑块完成验证"',
        'text="请拖动滑块"',
        '.slider-verification',
        '.drag-verify',
        '.captcha-slider'
      ],
      'quiz-verification': [
        'text="请点击正确的图"',
        'text="点击选择"',
        '.quiz-verification',
        '.image-verify',
        '[class*="quiz"]'
      ]
    };
  }

  async detectSecurityVerification() {
    log('开始检测安全验证...', 'info');
    
    // 截图记录当前页面状态
    const screenshotPath = path.join(SCREENSHOTS_DIR, `security-check-${Date.now()}.png`);
    await this.page.screenshot({ path: screenshotPath });
    log(`页面截图保存: ${screenshotPath}`, 'info');
    
    // 检测各种安全验证类型
    for (const [type, selectors] of Object.entries(this.verificationSelectors)) {
      for (const selector of selectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            this.verificationDetected = true;
            this.verificationType = type;
            log(`检测到${type}类型安全验证`, 'warning');
            
            // 获取验证页面信息
            const pageInfo = await this.getVerificationInfo(type);
            log(`验证页面信息: ${JSON.stringify(pageInfo, null, 2)}`, 'info');
            
            return { detected: true, type, pageInfo };
          }
        } catch (error) {
          // 忽略单个选择器失败的情况
          continue;
        }
      }
    }
    
    log('未检测到安全验证页面', 'success');
    return { detected: false, type: null, pageInfo: null };
  }

  async getVerificationInfo(type) {
    const pageText = await this.page.textContent('body');
    const title = await this.page.title();
    
    return {
      type,
      title,
      pageLength: pageText.length,
      containsCommonText: {
        '安全': pageText.includes('安全'),
        '验证': pageText.includes('验证'),
        '异常': pageText.includes('异常'),
        '检测': pageText.includes('检测'),
        '请输入': pageText.includes('请输入')
      },
      url: this.page.url()
    };
  }
}

// 安全验证处理器
class SecurityHandler {
  constructor(page, detector) {
    this.page = page;
    this.detector = detector;
    this.handlingStrategies = {
      'security-check': this.handleSecurityCheck.bind(this),
      'phone-verification': this.handlePhoneVerification.bind(this),
      'slide-verification': this.handleSlideVerification.bind(this),
      'quiz-verification': this.handleQuizVerification.bind(this)
    };
  }

  async handleSecurityVerification() {
    if (!this.detector.verificationDetected) {
      log('无需处理安全验证', 'success');
      return { success: true, handled: false };
    }

    const { type, pageInfo } = this.detector;
    log(`开始处理${type}类型安全验证`, 'action');
    
    const handler = this.handlingStrategies[type];
    if (!handler) {
      log(`不支持的安全验证类型: ${type}`, 'error');
      return { success: false, handled: false, reason: 'unsupported_type' };
    }

    try {
      const result = await handler(pageInfo);
      if (result.success) {
        log(`成功处理${type}安全验证`, 'success');
        return { success: true, handled: true, type };
      } else {
        log(`处理${type}安全验证失败`, 'error');
        return { success: false, handled: false, type };
      }
    } catch (error) {
      log(`处理安全验证时出错: ${error.message}`, 'error');
      return { success: false, handled: false, type, error: error.message };
    }
  }

  // 处理通用安全检查页面
  async handleSecurityCheck(pageInfo) {
    log('处理通用安全检查页面...', 'info');
    
    try {
      // 等待页面加载完成
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // 模拟人类用户行为：先阅读页面内容
      await this.simulateHumanReading();
      
      // 尝试点击"验证"按钮（如果存在）
      const verifyButton = await this.page.$('text="验证"');
      if (verifyButton) {
        await verifyButton.click();
        log('点击了验证按钮', 'action');
        await this.page.waitForLoadState('networkidle');
      }
      
      // 截图记录处理结果
      const screenshotPath = path.join(SCREENSHOTS_DIR, `security-check-handled-${Date.now()}.png`);
      await this.page.screenshot({ path: screenshotPath });
      
      return { success: true, screenshot: screenshotPath };
    } catch (error) {
      log(`处理安全检查失败: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // 处理手机验证页面
  async handlePhoneVerification(pageInfo) {
    log('处理手机验证页面...', 'info');
    
    // 手机验证通常需要真实的短信验证码，暂时无法自动处理
    log('手机验证需要人工介入，无法自动处理', 'warning');
    
    const screenshotPath = path.join(SCREENSHOTS_DIR, `phone-verification-${Date.now()}.png`);
    await this.page.screenshot({ path: screenshotPath });
    
    return { success: false, reason: 'manual_required', screenshot: screenshotPath };
  }

  // 处理滑块验证
  async handleSlideVerification(pageInfo) {
    log('处理滑块验证...', 'info');
    
    try {
      // 滑块验证需要复杂的图像识别和拖拽操作
      // 这里先记录截图，后续可以集成第三方验证服务
      const screenshotPath = path.join(SCREENSHOTS_DIR, `slide-verification-${Date.now()}.png`);
      await this.page.screenshot({ path: screenshotPath });
      
      log('滑块验证需要人工介入或第三方服务', 'warning');
      return { success: false, reason: 'manual_required', screenshot: screenshotPath };
    } catch (error) {
      log(`处理滑块验证失败: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // 处理图片验证
  async handleQuizVerification(pageInfo) {
    log('处理图片验证...', 'info');
    
    try {
      // 图片验证需要图像识别能力
      const screenshotPath = path.join(SCREENSHOTS_DIR, `quiz-verification-${Date.now()}.png`);
      await this.page.screenshot({ path: screenshotPath });
      
      log('图片验证需要人工介入或AI图像识别', 'warning');
      return { success: false, reason: 'manual_required', screenshot: screenshotPath };
    } catch (error) {
      log(`处理图片验证失败: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // 模拟人类阅读行为
  async simulateHumanReading() {
    log('模拟人类阅读行为...', 'info');
    
    // 随机滚动页面
    const scrollCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < scrollCount; i++) {
      await this.page.mouse.wheel(0, Math.random() * 300 + 100);
      await this.page.waitForTimeout(Math.random() * 1000 + 500);
    }
    
    // 随机移动鼠标
    const moveCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < moveCount; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 600;
      await this.page.mouse.move(x, y);
      await this.page.waitForTimeout(Math.random() * 500 + 200);
    }
  }
}

// Cookie管理器
class CookieManager {
  constructor() {
    this.cookieFile = path.join(AUTH_DIR, 'zhihu-cookies-latest.json');
  }

  async loadCookies() {
    try {
      if (fs.existsSync(this.cookieFile)) {
        const cookieData = JSON.parse(fs.readFileSync(this.cookieFile, 'utf8'));
        log(`加载Cookie文件: ${this.cookieFile}`, 'info');
        return cookieData.cookies;
      }
      return [];
    } catch (error) {
      log(`加载Cookie失败: ${error.message}`, 'error');
      return [];
    }
  }

  async saveCookies(cookies) {
    try {
      const cookieData = { cookies, timestamp: Date.now() };
      fs.writeFileSync(this.cookieFile, JSON.stringify(cookieData, null, 2));
      log(`保存Cookie文件: ${this.cookieFile}`, 'success');
      return true;
    } catch (error) {
      log(`保存Cookie失败: ${error.message}`, 'error');
      return false;
    }
  }

  async refreshCookies(page) {
    log('开始刷新Cookie...', 'info');
    
    try {
      // 访问知乎首页触发Cookie更新
      await page.goto('https://www.zhihu.com', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      // 保存更新后的Cookie
      const cookies = await page.cookies();
      await this.saveCookies(cookies);
      
      log('Cookie刷新完成', 'success');
      return true;
    } catch (error) {
      log(`Cookie刷新失败: ${error.message}`, 'error');
      return false;
    }
  }
}

// 主要执行函数
async function main() {
  log(`启动增强安全验证处理器 - 模式: ${MODE}`, 'info');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const page = await browser.newPage();
  
  try {
    // 设置页面属性，降低被识别为机器人的风险
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // 注入反检测脚本
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
    
    // 初始化Cookie管理器
    const cookieManager = new CookieManager();
    
    // 加载现有Cookie
    const cookies = await cookieManager.loadCookies();
    if (cookies.length > 0) {
      await page.context().addCookies(cookies);
      log(`加载了${cookies.length}个Cookie`, 'success');
    }
    
    // 初始化检测器和处理器
    const detector = new SecurityDetector(page);
    const handler = new SecurityHandler(page, detector);
    
    // 访问知乎创作中心
    log('访问知乎创作中心...', 'info');
    await page.goto('https://www.zhihu.com/creator', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 检测安全验证
    const securityCheck = await detector.detectSecurityVerification();
    
    if (securityCheck.detected) {
      log(`检测到安全验证: ${securityCheck.type}`, 'warning');
      
      if (MODE === 'test') {
        log('测试模式：仅检测，不处理验证', 'info');
      } else if (MODE === 'auto') {
        log('自动模式：尝试处理安全验证', 'action');
        const handleResult = await handler.handleSecurityVerification();
        
        if (handleResult.success && handleResult.handled) {
          log('安全验证处理成功', 'success');
        } else {
          log('安全验证处理失败，需要人工介入', 'error');
          log(`失败原因: ${handleResult.reason || 'unknown'}`, 'warning');
        }
      } else {
        log('手动模式：等待人工处理', 'info');
      }
    } else {
      log('未检测到安全验证，可以正常使用', 'success');
    }
    
    // 保存最终Cookie状态
    const finalCookies = await page.cookies();
    await cookieManager.saveCookies(finalCookies);
    
    // 截图最终状态
    const finalScreenshot = path.join(SCREENSHOTS_DIR, `final-state-${Date.now()}.png`);
    await page.screenshot({ path: finalScreenshot });
    log(`最终状态截图: ${finalScreenshot}`, 'info');
    
    log('安全验证处理完成', 'success');
    
  } catch (error) {
    log(`执行出错: ${error.message}`, 'error');
    console.error(error);
  } finally {
    await browser.close();
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

module.exports = {
  SecurityDetector,
  SecurityHandler,
  CookieManager
};