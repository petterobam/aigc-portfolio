const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 增强的知乎页面结构诊断与修复脚本
// 专门处理反爬虫措施和页面结构变化

class ZhihuPageStructureFixer {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      originalUrl: '',
      finalUrl: '',
      title: '',
      isRedirected: false,
      redirectChain: [],
      workingSelectors: {},
      brokenSelectors: {},
      newSelectors: {},
      recommendations: [],
      antiBotDetected: false
    };
  }

  async init() {
    console.log('🔧 初始化增强浏览器环境...');
    
    // 读取最新cookie
    const cookiePath = path.join(__dirname, '../auth/zhihu-cookies-latest.json');
    let cookies = [];
    
    if (fs.existsSync(cookiePath)) {
      cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
      console.log(`📝 加载了 ${cookies.length} 个cookie`);
    } else {
      console.log('❌ 未找到cookie文件，需要先登录');
      return false;
    }

    // 启动浏览器，添加反检测参数
    this.browser = await chromium.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-features=IsolateOrigins',
        '--disable-features=TranslateUI',
        '--disable-blink-features=AutomationControlled',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images', // 减少特征
        '--disable-javascript', // 先禁用JS，然后手动启用
        '--no-first-run',
        '--no-zygote',
        '--disable-devtools'
      ]
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Upgrade-Insecure-Requests': '1'
      },
      // 禁用自动化特征
      bypassCSP: true,
      javaScriptEnabled: false // 先禁用JS
    });

    // 注入cookie
    await this.context.addCookies(cookies);

    this.page = await this.context.newPage();
    
    // 监听所有网络请求
    this.page.on('request', request => {
      // 记录重定向链
      if (request.url().includes('resultsearchnow.com') || request.url().includes('zhihu.org')) {
        this.results.redirectChain.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
      }
      
      // 检测反爬虫请求
      if (request.url().includes('antibot') || request.url().includes('captcha')) {
        this.results.antiBotDetected = true;
        console.log('🚨 检测到反爬虫措施:', request.url());
      }
    });

    this.page.on('response', response => {
      if (response.status() === 403 || response.status() === 441) {
        console.log('❌ 检测到限制响应:', response.url(), response.status());
        this.results.antiBotDetected = true;
      }
    });

    this.page.on('pageerror', error => {
      console.log('❌ 页面错误:', error.message);
    });

    console.log('✅ 增强浏览器环境初始化完成');
    return true;
  }

  async navigateWithAntiBotBypass() {
    console.log('🌐 使用反爬虫绕过策略导航...');
    
    try {
      // 步骤1：先访问知乎主页
      console.log('步骤1：访问知乎主页...');
      await this.page.goto('https://www.zhihu.com', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // 等待一下
      await this.page.waitForTimeout(2000);
      
      // 启用JavaScript
      console.log('步骤2：启用JavaScript...');
      await this.page.evaluate(() => {
        window.JavaScriptEnabled = true;
      });
      
      // 重新加载页面
      console.log('步骤3：重新加载页面...');
      await this.page.reload({ 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      await this.page.waitForTimeout(3000);
      
      // 步骤4：直接访问发布页面
      console.log('步骤4：访问发布页面...');
      await this.page.goto('https://www.zhihu.org/publish', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      await this.page.waitForTimeout(5000);
      
      // 记录URL信息
      this.results.originalUrl = 'https://www.zhihu.org/publish';
      this.results.finalUrl = this.page.url();
      this.results.title = await this.page.title();
      this.results.isRedirected = this.results.finalUrl !== this.results.originalUrl;
      
      console.log(`原始URL: ${this.results.originalUrl}`);
      console.log(`最终URL: ${this.results.finalUrl}`);
      console.log(`页面标题: ${this.results.title}`);
      console.log(`是否重定向: ${this.results.isRedirected}`);
      
      if (this.results.isRedirected) {
        console.log('🚨 检测到重定向，反爬虫措施可能已激活');
      }
      
      // 检查是否到达真实页面
      const pageText = await this.page.textContent('body');
      if (pageText.includes('知乎') || pageText.includes('发布') || pageText.includes('编辑')) {
        console.log('✅ 成功到达知乎发布页面');
        return true;
      } else {
        console.log('❌ 未到达预期的知乎页面');
        return false;
      }
      
    } catch (error) {
      console.log('❌ 导航失败:', error.message);
      return false;
    }
  }

  async captureRealPageStructure() {
    console.log('📸 捕获真实页面结构...');
    
    try {
      // 获取页面HTML
      const html = await this.page.content();
      this.results.pageHtml = html;
      
      // 查找所有可能的输入元素
      const allInputs = await this.page.$$('input, textarea, [contenteditable="true"]');
      console.log(`📋 找到 ${allInputs.length} 个可能的输入元素`);
      
      // 分析每个输入元素
      for (const element of allInputs) {
        try {
          const tagName = await element.tagName();
          const placeholder = await element.getAttribute('placeholder') || '';
          const name = await element.getAttribute('name') || '';
          const id = await element.getAttribute('id') || '';
          const className = await element.getAttribute('class') || '';
          const type = await element.getAttribute('type') || '';
          const isVisible = await element.isVisible();
          const isEditable = await element.isEditable();
          
          console.log(`发现元素: ${tagName}, placeholder: ${placeholder}, name: ${name}, id: ${id}`);
          
          // 检查是否是标题相关元素
          if (placeholder.includes('标题') || name.includes('title') || id.includes('title') || 
              placeholder.includes('请输入') || className.includes('title') || className.includes('editor')) {
            console.log(`🎯 发现可能的标题元素: ${tagName} - ${placeholder || name || id}`);
          }
          
        } catch (error) {
          console.log(`❌ 分析元素时出错: ${error.message}`);
        }
      }
      
      // 截图保存当前页面状态
      const screenshotPath = path.join(__dirname, '../auth/screenshots/page-structure-fix-' + Date.now() + '.png');
      await this.page.screenshot({ path: screenshotPath });
      console.log(`📸 页面截图已保存: ${screenshotPath}`);
      
      return true;
    } catch (error) {
      console.log('❌ 捕获页面结构失败:', error.message);
      return false;
    }
  }

  async generateNewSelectors() {
    console.log('🔧 生成新的选择器策略...');
    
    const newSelectors = {
      titleInput: [],
      contentArea: [],
      publishButton: []
    };
    
    // 基于实际页面结构生成新的选择器策略
    // 这里使用更广泛的选择器策略
    
    // 标题输入框 - 基于各种可能的新结构
    newSelectors.titleInput = [
      // 基于placeholder
      'input[placeholder*="标题"]',
      'input[placeholder*="请输入标题"]',
      'input[placeholder*="专栏标题"]',
      'input[placeholder*="文章标题"]',
      'input[placeholder*="输入标题"]',
      'input[placeholder*="主题"]',
      
      // 基于name和id
      'input[name="title"]',
      'input[name="subject"]',
      'input[id="title"]',
      'input[id="subject"]',
      'input[id="headline"]',
      
      // 基于class
      'input[class*="title"]',
      'input[class*="editor"]',
      'input[class*="subject"]',
      'input[class*="headline"]',
      'textarea[class*="title"]',
      
      // 基于data属性
      'input[data-*="title"]',
      'input[data-testid*="title"]',
      'input[data-name="title"]',
      
      // 通用选择器
      'input[type="text"]',
      'textarea',
      '[contenteditable="true"]',
      
      // 更具体的选择器
      '.DraftEditor-root input',
      '.ProseMirror input',
      '.rich-editor input',
      '.editor-container input',
      
      // 备用策略
      'input:visible',
      'textarea:visible',
      '[contenteditable="true"]:visible'
    ];
    
    // 内容区域
    newSelectors.contentArea = [
      '.editor-content',
      '.rich-editor-content',
      '.DraftEditor-editorContainer',
      '.ProseMirror',
      '[contenteditable="true"]',
      '.editor-container',
      '.rich-text-editor',
      '.ZhihuEditor-content',
      '.PublishForm-content',
      '.ArticleEditor-content',
      '.note-editor',
      '.article-content',
      '.text-editor',
      '.content-editor',
      '.DraftEditor-root',
      '.editor-body',
      '.editor-text',
      '[role="textbox"]',
      '[aria-label*="内容"]',
      '[aria-label*="编辑"]'
    ];
    
    // 发布按钮
    newSelectors.publishButton = [
      'button[button-type="primary"]',
      'button[type="submit"]',
      '.submit-button',
      '.publish-button',
      '.PublishForm-submit button',
      '.ArticleEditor-publish button',
      'button:has-text("发布")',
      'button:has-text("发表")',
      'button:has-text("保存草稿")',
      'button:has-text("发布文章")',
      'button:has-text("发布专栏")',
      'button:has-text("下一步")',
      'button:has-text("完成")',
      '.primary-button',
      '.main-button',
      '.action-button',
      '[class*="submit"]',
      '[class*="publish"]',
      '[class*="post"]',
      'button:visible',
      '[type="submit"]:visible'
    ];
    
    this.results.newSelectors = newSelectors;
    
    // 测试新的选择器
    await this.testNewSelectors(newSelectors);
    
    console.log('🔧 新选择器策略生成完成');
  }

  async testNewSelectors(selectors) {
    console.log('🧪 测试新选择器策略...');
    
    for (const [category, selectorList] of Object.entries(selectors)) {
      console.log(`\n📋 测试 ${category} 新选择器...`);
      
      this.results.newSelectors[category] = {
        working: [],
        broken: [],
        details: []
      };

      for (const selector of selectorList) {
        try {
          // 检查元素是否存在
          const element = await this.page.$(selector);
          
          if (element) {
            // 如果是输入框，检查是否可交互
            if (category === 'titleInput') {
              const isVisible = await element.isVisible();
              const isEnabled = await element.isEnabled();
              
              if (isVisible && isEnabled) {
                this.results.newSelectors[category].working.push({
                  selector,
                  visible: true,
                  enabled: true,
                  tagName: await element.tagName()
                });
                console.log(`  ✅ ${selector} - 可用`);
              } else {
                this.results.newSelectors[category].broken.push({
                  selector,
                  visible: isVisible,
                  enabled: isEnabled,
                  reason: isVisible ? 'disabled' : 'hidden'
                });
                console.log(`  ⚠️ ${selector} - 不可用 (${isVisible ? 'hidden' : 'disabled'})`);
              }
            } else {
              this.results.newSelectors[category].working.push({
                selector,
                visible: true,
                tagName: await element.tagName()
              });
              console.log(`  ✅ ${selector} - 可用`);
            }
          } else {
            this.results.newSelectors[category].broken.push({
              selector,
              reason: 'not found'
            });
            console.log(`  ❌ ${selector} - 未找到`);
          }
        } catch (error) {
          this.results.newSelectors[category].broken.push({
            selector,
            reason: error.message
          });
          console.log(`  ❌ ${selector} - 错误: ${error.message}`);
        }
      }
    }
    
    console.log('\n📊 新选择器测试完成');
  }

  async generateFixRecommendations() {
    console.log('💡 生成修复建议...');
    
    const recommendations = [];
    
    // 分析新选择器测试结果
    for (const [category, results] of Object.entries(this.results.newSelectors)) {
      const workingCount = results.working.length;
      const brokenCount = results.broken.length;
      
      if (workingCount === 0) {
        recommendations.push({
          priority: 'CRITICAL',
          category,
          issue: `新的${category}选择器全部失效，需要手动干预`,
          solution: [
            `手动访问 ${this.results.finalUrl} 查看实际页面结构`,
            '使用浏览器开发者工具找到实际的选择器',
            '可能需要模拟人工操作绕过反爬虫',
            '考虑使用官方API替代页面自动化'
          ]
        });
      } else if (workingCount < 3) {
        recommendations.push({
          priority: 'HIGH',
          category,
          issue: `新的${category}选择器可用数量不足(${workingCount}/${workingCount + brokenCount})`,
          solution: [
            `推荐使用: ${results.working[0].selector}`,
            `备选选择器: ${results.working.slice(0, Math.min(3, workingCount)).map(s => s.selector).join(', ')}`,
            '继续收集更多备用选择器'
          ]
        });
      } else {
        recommendations.push({
          priority: 'MEDIUM',
          category,
          issue: `新的${category}选择器可用(${workingCount}个)`,
          solution: [
            `推荐选择器: ${results.working[0].selector}`,
            `备选选择器: ${results.working.slice(0, 3).map(s => s.selector).join(', ')}`
          ]
        });
      }
    }
    
    // 添加反爬虫检测建议
    if (this.results.antiBotDetected) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'antiBot',
        issue: '检测到反爬虫措施，自动化可能被阻止',
        solution: [
          '需要更新User-Agent和浏览器指纹',
          '增加人工操作模拟',
          '考虑降低自动化频率',
          '探索官方API替代方案'
        ]
      });
    }
    
    this.results.recommendations = recommendations;
    
    console.log('💡 修复建议生成完成');
  }

  async saveResults() {
    const outputPath = path.join(__dirname, '../reports/page-structure-fix-results.json');
    
    // 保存结果
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    
    console.log(`📄 修复结果已保存到: ${outputPath}`);
    
    // 生成报告
    await this.generateFixReport();
    
    // 更新选择器库
    await this.updateSelectorLibrary();
  }

  async generateFixReport() {
    const reportPath = path.join(__dirname, '../reports/page-structure-fix-report.md');
    
    const report = `# 知乎页面结构修复报告

**诊断时间**: ${this.results.timestamp}  
**原始URL**: ${this.results.originalUrl}  
**最终URL**: ${this.results.finalUrl}  
**页面标题**: ${this.results.title}  
**是否重定向**: ${this.results.isRedirected}  
**反爬虫检测**: ${this.results.antiBotDetected ? '是' : '否'}

## 📊 诊断结果摘要

### 选择器测试结果
| 类别 | 可用选择器 | 失效选择器 | 成功率 |
|------|------------|------------|--------|
| 标题输入框 | ${this.results.newSelectors.titleInput?.working?.length || 0} | ${this.results.newSelectors.titleInput?.broken?.length || 0} | ${this.results.newSelectors.titleInput?.working?.length ? (this.results.newSelectors.titleInput.working.length / (this.results.newSelectors.titleInput.working.length + this.results.newSelectors.titleInput.broken.length) * 100).toFixed(1) : 0}% |
| 内容区域 | ${this.results.newSelectors.contentArea?.working?.length || 0} | ${this.results.newSelectors.contentArea?.broken?.length || 0} | ${this.results.newSelectors.contentArea?.working?.length ? (this.results.newSelectors.contentArea.working.length / (this.results.newSelectors.contentArea.working.length + this.results.newSelectors.contentArea.broken.length) * 100).toFixed(1) : 0}% |
| 发布按钮 | ${this.results.newSelectors.publishButton?.working?.length || 0} | ${this.results.newSelectors.publishButton?.broken?.length || 0} | ${this.results.newSelectors.publishButton?.working?.length ? (this.results.newSelectors.publishButton.working.length / (this.results.newSelectors.publishButton.working.length + this.results.newSelectors.publishButton.broken.length) * 100).toFixed(1) : 0}% |

## 🔧 推荐选择器

### 标题输入框
${this.results.newSelectors.titleInput?.working?.map(s => `- \`${s.selector}\` (${s.tagName})`).join('\n') || '无可用选择器'}

### 内容区域
${this.results.newSelectors.contentArea?.working?.map(s => `- \`${s.selector}\``).join('\n') || '无可用选择器'}

### 发布按钮
${this.results.newSelectors.publishButton?.working?.map(s => `- \`${s.selector}\``).join('\n') || '无可用选择器'}

## 🚨 修复建议

${this.results.recommendations?.map(r => `
### ${r.priority} - ${r.category}
**问题**: ${r.issue}
**解决方案**:
${r.solution.map(s => `- ${s}`).join('\n')}
`).join('\n')}

## 📋 行动计划

### 立即执行（今天）
1. ✅ 执行增强页面结构诊断
2. 🔄 分析诊断结果
3. 🔄 使用推荐选择器更新发布脚本
4. 🔄 测试修复后的发布功能

### 短期（明天）
1. 🔄 实现反爬虫绕过策略
2. 🔄 优化浏览器环境配置
3. 🔄 建立监控预警系统

### 中期（本周）
1. 🔄 实现智能选择器适配
2. 🔄 建立页面变化自动检测
3. 🔄 开发官方API替代方案

---

*报告生成时间: ${new Date().toISOString()}*
*修复工具版本: v2.0*
`;

    fs.writeFileSync(reportPath, report);
    console.log(`📄 修复报告已保存到: ${reportPath}`);
  }

  async updateSelectorLibrary() {
    // 更新选择器库文件
    const selectorLibraryPath = path.join(__dirname, '../data/selector-library.json');
    
    const selectorLibrary = {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      selectors: this.results.newSelectors,
      recommendations: this.results.recommendations,
      antiBotStatus: this.results.antiBotDetected ? 'detected' : 'clear'
    };
    
    fs.writeFileSync(selectorLibraryPath, JSON.stringify(selectorLibrary, null, 2));
    console.log(`📄 选择器库已更新: ${selectorLibraryPath}`);
  }

  async cleanup() {
    console.log('🧹 清理资源...');
    
    if (this.page) {
      await this.page.close();
    }
    
    if (this.context) {
      await this.context.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    console.log('✅ 资源清理完成');
  }

  async run() {
    console.log('🚀 开始知乎页面结构修复...\n');
    
    try {
      // 初始化
      const initSuccess = await this.init();
      if (!initSuccess) {
        console.log('❌ 初始化失败，退出修复');
        return;
      }
      
      // 使用反爬虫绕过策略导航
      const navSuccess = await this.navigateWithAntiBotBypass();
      if (!navSuccess) {
        console.log('❌ 导航失败，退出修复');
        await this.cleanup();
        return;
      }
      
      // 捕获真实页面结构
      await this.captureRealPageStructure();
      
      // 生成新的选择器策略
      await this.generateNewSelectors();
      
      // 生成修复建议
      await this.generateFixRecommendations();
      
      // 保存结果
      await this.saveResults();
      
      console.log('\n🎉 页面结构修复完成！');
      
      // 输出摘要
      console.log('\n📊 修复摘要:');
      console.log(`- 检测到反爬虫: ${this.results.antiBotDetected ? '是' : '否'}`);
      console.log(`- 是否重定向: ${this.results.isRedirected ? '是' : '否'}`);
      console.log(`- 标题选择器可用: ${this.results.newSelectors.titleInput?.working?.length || 0} 个`);
      console.log(`- 内容选择器可用: ${this.results.newSelectors.contentArea?.working?.length || 0} 个`);
      console.log(`- 按钮选择器可用: ${this.results.newSelectors.publishButton?.working?.length || 0} 个`);
      console.log(`- 修复建议数量: ${this.results.recommendations?.length || 0} 个`);
      
      if (this.results.newSelectors.titleInput?.working?.length === 0) {
        console.log('🚨 紧急：标题输入框问题仍未解决，需要手动干预！');
      }
      
    } catch (error) {
      console.log('❌ 修复过程中发生错误:', error.message);
      console.log(error.stack);
    } finally {
      await this.cleanup();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const fixer = new ZhihuPageStructureFixer();
  fixer.run().catch(console.error);
}

module.exports = ZhihuPageStructureFixer;