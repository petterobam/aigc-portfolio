const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 新的知乎登录和页面诊断脚本
// 修复登录问题并重新诊断页面结构

class ZhihuLoginAndDiagnostic {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.results = {
      loginStatus: 'unknown',
      pageStructure: {},
      currentUrl: '',
      currentTitle: '',
      availableSelectors: {
        title: [],
        content: [],
        publish: []
      },
      issueAnalysis: [],
      solutionPlan: []
    };
  }

  async init() {
    console.log('🔧 初始化浏览器环境...');
    
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
        '--disable-automation',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    this.page = await this.context.newPage();
    
    // 监听页面错误和日志
    this.page.on('console', msg => {
      const type = msg.type();
      if (type === 'error') {
        console.log(`❌ 控制台错误 [${type}]:`, msg.text());
      } else if (type === 'warning') {
        console.log(`⚠️ 控制台警告 [${type}]:`, msg.text());
      } else if (type === 'info') {
        console.log(`ℹ️ 控制台信息 [${type}]:`, msg.text());
      }
    });

    this.page.on('pageerror', error => {
      console.log('❌ 页面错误:', error.message);
    });

    this.page.on('request', request => {
      const url = request.url();
      if (url.includes('resultsearchnow.com') || url.includes('searchnow')) {
        console.log(`🚫 拦截可疑请求: ${url}`);
      }
    });

    console.log('✅ 浏览器环境初始化完成');
    return true;
  }

  async checkLoginStatus() {
    console.log('🔍 检查登录状态...');
    
    try {
      // 访问知乎主页
      await this.page.goto('https://www.zhihu.com', { 
        waitUntil: 'networkidle',
        timeout: 15000 
      });
      
      // 等待页面加载
      await this.page.waitForTimeout(3000);
      
      // 检查是否在登录页面
      const currentUrl = this.page.url();
      this.results.currentUrl = currentUrl;
      
      if (currentUrl.includes('www.zhihu.com') && !currentUrl.includes('login')) {
        console.log('✅ 已登录知乎');
        this.results.loginStatus = 'success';
        
        // 检查用户名
        try {
          const username = await this.page.textContent('.UserLink-link');
          console.log(`👤 用户名: ${username || '未找到用户名'}`);
        } catch (error) {
          console.log('👤 未找到用户名元素');
        }
        
        return true;
      } else if (currentUrl.includes('login') || currentUrl.includes('resultsearchnow')) {
        console.log('❌ 未登录或被重定向到登录页面');
        this.results.loginStatus = 'failed';
        return false;
      } else {
        console.log('❌ 未知页面:', currentUrl);
        this.results.loginStatus = 'unknown';
        return false;
      }
    } catch (error) {
      console.log('❌ 登录状态检查失败:', error.message);
      this.results.loginStatus = 'error';
      return false;
    }
  }

  async manualLogin() {
    console.log('🔐 启动手动登录流程...');
    
    try {
      // 导航到知乎登录页面
      await this.page.goto('https://www.zhihu.com/signin', { 
        waitUntil: 'networkidle',
        timeout: 15000 
      });
      
      console.log('✅ 打开登录页面，请在浏览器中手动完成登录');
      console.log('📝 登录完成后，按 Enter 继续...');
      
      // 等待用户登录完成
      await this.page.waitForFunction(() => {
        return document.querySelector('.UserLink-link') !== null;
      }, { timeout: 300000 }); // 5分钟超时
      
      console.log('✅ 检测到登录完成！');
      
      // 保存登录状态
      await this.saveCookies();
      
      return true;
    } catch (error) {
      console.log('❌ 手动登录流程失败:', error.message);
      return false;
    }
  }

  async saveCookies() {
    console.log('💾 保存登录状态...');
    
    try {
      const cookies = await this.context.cookies();
      const cookiePath = path.join(__dirname, '../auth/zhihu-cookies-latest.json');
      fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));
      console.log(`✅ 已保存 ${cookies.length} 个cookie到: ${cookiePath}`);
    } catch (error) {
      console.log('❌ 保存cookie失败:', error.message);
    }
  }

  async navigateToPublishPage() {
    console.log('📝 导航到专栏发布页面...');
    
    try {
      // 先访问知乎专栏页面
      await this.page.goto('https://www.zhihu.org', { 
        waitUntil: 'networkidle',
        timeout: 15000 
      });
      
      console.log('✅ 访问知乎专栏页面成功');
      
      // 等待页面稳定
      await this.page.waitForTimeout(3000);
      
      // 查找并点击发布按钮
      const publishSelectors = [
        'a[href*="publish"]',
        'a[href*="创建"]',
        'a[href*="写"]',
        'button:has-text("发布")',
        'button:has-text("写文章")',
        'a:has-text("发布")',
        'a:has-text("写文章")',
        '.PublishButton',
        '.WriteButton',
        '.CreateButton'
      ];
      
      let publishClicked = false;
      for (const selector of publishSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            await element.click();
            publishClicked = true;
            console.log(`✅ 点击发布按钮: ${selector}`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!publishClicked) {
        console.log('❌ 未找到发布按钮，尝试直接访问发布页面');
        await this.page.goto('https://www.zhihu.org/publish', { 
          waitUntil: 'networkidle',
          timeout: 15000 
        });
      }
      
      // 等待页面加载
      await this.page.waitForTimeout(5000);
      
      this.results.currentTitle = await this.page.title();
      console.log(`📄 页面标题: ${this.results.currentTitle}`);
      
      return true;
    } catch (error) {
      console.log('❌ 导航到发布页面失败:', error.message);
      return false;
    }
  }

  async analyzePageStructure() {
    console.log('🔍 分析页面结构...');
    
    try {
      // 获取页面HTML
      const html = await this.page.content();
      
      // 分析页面元素
      const analysis = {
        totalElements: 0,
        inputElements: [],
        textareaElements: [],
        buttonElements: [],
        editableElements: [],
        iframeElements: [],
        potentialTitleElements: [],
        potentialContentElements: [],
        potentialPublishElements: []
      };
      
      // 查找所有输入元素
      const inputs = await this.page.$$('input, textarea, [contenteditable="true"]');
      analysis.totalElements = inputs.length;
      
      for (const element of inputs) {
        try {
          const tagName = await element.tagName();
          const type = await element.getAttribute('type') || '';
          const placeholder = await element.getAttribute('placeholder') || '';
          const name = await element.getAttribute('name') || '';
          const id = await element.getAttribute('id') || '';
          const className = await element.getAttribute('class') || '';
          const isVisible = await element.isVisible();
          const isEditable = await element.isEditable();
          
          const elementInfo = {
            tagName,
            type,
            placeholder,
            name,
            id,
            className,
            isVisible,
            isEditable
          };
          
          if (tagName === 'input' || tagName === 'textarea') {
            analysis.inputElements.push(elementInfo);
            
            // 检查是否是标题输入框
            if (placeholder.includes('标题') || name.includes('title') || id.includes('title')) {
              analysis.potentialTitleElements.push(elementInfo);
            }
          }
          
          if (isEditable && isVisible) {
            analysis.editableElements.push(elementInfo);
            
            // 检查是否是内容区域
            if (tagName === 'div' || (tagName === 'input' && placeholder.includes('内容'))) {
              analysis.potentialContentElements.push(elementInfo);
            }
          }
          
          if (tagName === 'button') {
            const buttonText = await element.textContent();
            analysis.buttonElements.push({
              ...elementInfo,
              text: buttonText
            });
            
            // 检查是否是发布按钮
            if (buttonText && (buttonText.includes('发布') || buttonText.includes('发表') || buttonText.includes('保存'))) {
              analysis.potentialPublishElements.push({
                ...elementInfo,
                text: buttonText
              });
            }
          }
          
        } catch (error) {
          // 忽略单个元素错误
        }
      }
      
      // 查找iframe
      const iframes = await this.page.$$('iframe');
      analysis.iframeElements = await Promise.all(
        iframes.map(async (iframe) => {
          try {
            const src = await iframe.getAttribute('src');
            return { src };
          } catch (error) {
            return { src: 'unknown' };
          }
        })
      );
      
      this.results.pageStructure = analysis;
      
      console.log('📊 页面结构分析完成:');
      console.log(`- 总元素数: ${analysis.totalElements}`);
      console.log(`- 输入元素: ${analysis.inputElements.length}`);
      console.log(`- 按钮元素: ${analysis.buttonElements.length}`);
      console.log(`- 可编辑元素: ${analysis.editableElements.length}`);
      console.log(`- 潜在标题元素: ${analysis.potentialTitleElements.length}`);
      console.log(`- 潜在内容元素: ${analysis.potentialContentElements.length}`);
      console.log(`- 潜在发布元素: ${analysis.potentialPublishElements.length}`);
      console.log(`- iframe元素: ${analysis.iframeElements.length}`);
      
      return true;
    } catch (error) {
      console.log('❌ 页面结构分析失败:', error.message);
      return false;
    }
  }

  async generateNewSelectors() {
    console.log('🔧 生成新的选择器...');
    
    const analysis = this.results.pageStructure;
    const newSelectors = {
      title: [],
      content: [],
      publish: []
    };
    
    // 生成标题输入框选择器
    for (const element of analysis.potentialTitleElements) {
      const selectors = [
        `input[name="${element.name}"]`,
        `input[id="${element.id}"]`,
        `input[placeholder="${element.placeholder}"]`,
        `input[placeholder*="${element.placeholder}"]`,
        `textarea[name="${element.name}"]`,
        `textarea[id="${element.id}"]`,
        `textarea[placeholder="${element.placeholder}"]`,
        `[contenteditable="true"][placeholder*="${element.placeholder}"]`
      ];
      
      for (const selector of selectors) {
        if (!newSelectors.title.includes(selector)) {
          newSelectors.title.push(selector);
        }
      }
    }
    
    // 生成内容区域选择器
    for (const element of analysis.potentialContentElements) {
      const selectors = [
        `[contenteditable="true"]`,
        `.DraftEditor-root`,
        `.ProseMirror`,
        `[data-testid="editor"]`,
        `[role="textbox"]`,
        `[aria-label*="内容"]`,
        `[aria-label*="编辑"]`
      ];
      
      for (const selector of selectors) {
        if (!newSelectors.content.includes(selector)) {
          newSelectors.content.push(selector);
        }
      }
    }
    
    // 生成发布按钮选择器
    for (const element of analysis.potentialPublishElements) {
      const selectors = [
        `button:has-text("${element.text}")`,
        `button:has-text("${element.text.trim()}")`,
        `button:has-text("发布")`,
        `button:has-text("发表")`,
        `button:has-text("保存")`,
        `button[type="submit"]`,
        `[data-testid="publish-button"]`,
        `[data-testid="submit-button"]`
      ];
      
      for (const selector of selectors) {
        if (!newSelectors.publish.includes(selector)) {
          newSelectors.publish.push(selector);
        }
      }
    }
    
    this.results.availableSelectors = newSelectors;
    
    console.log('🔧 新选择器生成完成:');
    console.log(`- 标题选择器: ${newSelectors.title.length} 个`);
    console.log(`- 内容选择器: ${newSelectors.content.length} 个`);
    console.log(`- 发布选择器: ${newSelectors.publish.length} 个`);
  }

  async generateSolutionPlan() {
    console.log('📋 生成解决方案...');
    
    const solutions = [];
    
    // 分析问题
    if (this.results.availableSelectors.title.length === 0) {
      solutions.push({
        priority: 'CRITICAL',
        issue: '标题输入框选择器仍然找不到',
        solution: [
          '可能需要等待编辑器完全加载',
          '可能需要使用iframe内的元素',
          '可能需要手动定位标题输入框',
          '可能需要重新设计定位策略'
        ]
      });
    }
    
    if (this.results.availableSelectors.content.length === 0) {
      solutions.push({
        priority: 'HIGH',
        issue: '内容区域选择器可能有问题',
        solution: [
          '检查是否有iframe内的编辑器',
          '使用不同的定位策略',
          '等待编辑器完全加载后再定位'
        ]
      });
    }
    
    if (this.results.availableSelectors.publish.length === 0) {
      solutions.push({
        priority: 'HIGH',
        issue: '发布按钮选择器可能有问题',
        solution: [
          '检查发布按钮是否在iframe内',
          '等待按钮变为可点击状态',
          '使用文本内容进行定位'
        ]
      });
    }
    
    if (this.results.pageStructure.iframeElements.length > 0) {
      solutions.push({
        priority: 'MEDIUM',
        issue: '检测到iframe元素，编辑器可能在iframe内',
        solution: [
          '需要切换到iframe内进行操作',
          '使用page.frame()来访问iframe内的元素',
          '检查iframe的src属性确定编辑器类型'
        ]
      });
    }
    
    this.results.solutionPlan = solutions;
    
    console.log('📋 解决方案生成完成:', solutions.length, '个问题');
  }

  async testNewSelectors() {
    console.log('🧪 测试新选择器...');
    
    const testResults = {
      title: [],
      content: [],
      publish: []
    };
    
    // 测试标题选择器
    for (const selector of this.results.availableSelectors.title) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          testResults.title.push({ selector, status: 'working' });
          console.log(`✅ 标题选择器工作: ${selector}`);
        } else {
          testResults.title.push({ selector, status: 'not_visible' });
          console.log(`⚠️ 标题选择器不可见: ${selector}`);
        }
      } catch (error) {
        testResults.title.push({ selector, status: 'error', error: error.message });
        console.log(`❌ 标题选择器错误: ${selector} - ${error.message}`);
      }
    }
    
    // 测试内容选择器
    for (const selector of this.results.availableSelectors.content) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          testResults.content.push({ selector, status: 'working' });
          console.log(`✅ 内容选择器工作: ${selector}`);
        } else {
          testResults.content.push({ selector, status: 'not_visible' });
          console.log(`⚠️ 内容选择器不可见: ${selector}`);
        }
      } catch (error) {
        testResults.content.push({ selector, status: 'error', error: error.message });
        console.log(`❌ 内容选择器错误: ${selector} - ${error.message}`);
      }
    }
    
    // 测试发布选择器
    for (const selector of this.results.availableSelectors.publish) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          testResults.publish.push({ selector, status: 'working' });
          console.log(`✅ 发布选择器工作: ${selector}`);
        } else {
          testResults.publish.push({ selector, status: 'not_visible' });
          console.log(`⚠️ 发布选择器不可见: ${selector}`);
        }
      } catch (error) {
        testResults.publish.push({ selector, status: 'error', error: error.message });
        console.log(`❌ 发布选择器错误: ${selector} - ${error.message}`);
      }
    }
    
    this.results.selectorTestResults = testResults;
    
    console.log('🧪 选择器测试完成:');
    console.log(`- 标题选择器: ${testResults.title.filter(r => r.status === 'working').length}/${testResults.title.length} 工作正常`);
    console.log(`- 内容选择器: ${testResults.content.filter(r => r.status === 'working').length}/${testResults.content.length} 工作正常`);
    console.log(`- 发布选择器: ${testResults.publish.filter(r => r.status === 'working').length}/${testResults.publish.length} 工作正常`);
  }

  async saveResults() {
    const outputPath = path.join(__dirname, '../reports/login-and-diagnostic-results.json');
    const reportPath = path.join(__dirname, '../reports/login-and-diagnostic-report.md');
    
    // 生成详细报告
    const report = `# 知乎登录和页面结构诊断报告

**诊断时间**: ${new Date().toISOString()}  
**页面URL**: ${this.results.currentUrl}  
**页面标题**: ${this.results.currentTitle}  
**登录状态**: ${this.results.loginStatus}

## 📊 诊断结果摘要

### 登录状态
- **状态**: ${this.results.loginStatus}
- **当前页面**: ${this.results.currentUrl}

### 页面结构分析
- **总元素数**: ${this.results.pageStructure.totalElements}
- **输入元素**: ${this.results.pageStructure.inputElements.length}
- **按钮元素**: ${this.results.pageStructure.buttonElements.length}
- **可编辑元素**: ${this.results.pageStructure.editableElements.length}
- **iframe元素**: ${this.results.pageStructure.iframeElements.length}

### 可用选择器数量
- **标题选择器**: ${this.results.availableSelectors.title.length} 个
- **内容选择器**: ${this.results.availableSelectors.content.length} 个
- **发布选择器**: ${this.results.availableSelectors.publish.length} 个

## 🔧 可用选择器推荐

### 标题输入框
${this.results.availableSelectors.title.map(selector => `- ${selector}`).join('\n')}

### 内容区域
${this.results.availableSelectors.content.map(selector => `- ${selector}`).join('\n')}

### 发布按钮
${this.results.availableSelectors.publish.map(selector => `- ${selector}`).join('\n')}

## 📋 选择器测试结果

### 标题选择器
${this.results.selectorTestResults?.title?.map(r => 
  `- ${r.selector}: ${r.status === 'working' ? '✅' : r.status === 'not_visible' ? '⚠️' : '❌'}`
).join('\n') || '无测试结果'}

### 内容选择器
${this.results.selectorTestResults?.content?.map(r => 
  `- ${r.selector}: ${r.status === 'working' ? '✅' : r.status === 'not_visible' ? '⚠️' : '❌'}`
).join('\n') || '无测试结果'}

### 发布选择器
${this.results.selectorTestResults?.publish?.map(r => 
  `- ${r.selector}: ${r.status === 'working' ? '✅' : r.status === 'not_visible' ? '⚠️' : '❌'}`
).join('\n') || '无测试结果'}

## 🚨 问题与解决方案

${this.results.solutionPlan.map(s => `
### ${s.priority} - ${s.issue}
**解决方案**:
${s.solution.map(sol => `- ${sol}`).join('\n')}
`).join('\n')}

## 📋 下一步行动计划

### 短期（今天）
1. ✅ 执行登录检查和页面诊断
2. 🔄 分析诊断结果
3. 🔄 更新publish脚本中的选择器
4. 🔄 测试修复后的发布功能

### 中期（明天）
1. 🔄 实现修复后的发布流程
2. 🔄 增强错误处理机制
3. 🔄 建立监控预警系统

### 长期（本周）
1. 🔄 实现智能选择器适配
2. 🔄 建立页面变化监控
3. 🔄 优化发布策略

---

*报告生成时间: ${new Date().toISOString()}*
*诊断工具版本: v2.0*
`;

    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    fs.writeFileSync(reportPath, report);
    
    console.log(`📄 详细结果已保存到: ${outputPath}`);
    console.log(`📄 诊断报告已保存到: ${reportPath}`);
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
    console.log('🚀 开始知乎登录和页面结构诊断...\n');
    
    try {
      // 初始化
      await this.init();
      
      // 检查登录状态
      const isLoggedIn = await this.checkLoginStatus();
      
      if (!isLoggedIn) {
        console.log('🔐 需要手动登录...');
        const loginSuccess = await this.manualLogin();
        
        if (!loginSuccess) {
          console.log('❌ 登录失败，退出诊断');
          await this.cleanup();
          return;
        }
      }
      
      // 导航到发布页面
      const navSuccess = await this.navigateToPublishPage();
      if (!navSuccess) {
        console.log('❌ 导航到发布页面失败，退出诊断');
        await this.cleanup();
        return;
      }
      
      // 分析页面结构
      await this.analyzePageStructure();
      
      // 生成新选择器
      await this.generateNewSelectors();
      
      // 测试新选择器
      await this.testNewSelectors();
      
      // 生成解决方案
      await this.generateSolutionPlan();
      
      // 保存结果
      await this.saveResults();
      
      console.log('\n🎉 登录和页面结构诊断完成！');
      
      // 输出摘要
      console.log('\n📊 诊断摘要:');
      console.log(`- 登录状态: ${this.results.loginStatus}`);
      console.log(`- 可用标题选择器: ${this.results.availableSelectors.title.length} 个`);
      console.log(`- 可用内容选择器: ${this.results.availableSelectors.content.length} 个`);
      console.log(`- 可用发布选择器: ${this.results.availableSelectors.publish.length} 个`);
      console.log(`- 解决方案数量: ${this.results.solutionPlan.length} 个`);
      
      const workingTitleSelectors = this.results.selectorTestResults?.title?.filter(r => r.status === 'working').length || 0;
      const workingContentSelectors = this.results.selectorTestResults?.content?.filter(r => r.status === 'working').length || 0;
      const workingPublishSelectors = this.results.selectorTestResults?.publish?.filter(r => r.status === 'working').length || 0;
      
      console.log(`- 实际工作标题选择器: ${workingTitleSelectors} 个`);
      console.log(`- 实际工作内容选择器: ${workingContentSelectors} 个`);
      console.log(`- 实际工作发布选择器: ${workingPublishSelectors} 个`);
      
      if (workingTitleSelectors === 0) {
        console.log('🚨 紧急：仍然没有可用的标题输入框选择器！');
      }
      
      if (workingPublishSelectors === 0) {
        console.log('🚨 紧急：仍然没有可用的发布按钮选择器！');
      }
      
    } catch (error) {
      console.log('❌ 诊断过程中发生错误:', error.message);
      console.log(error.stack);
    } finally {
      await this.cleanup();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const diagnostic = new ZhihuLoginAndDiagnostic();
  diagnostic.run().catch(console.error);
}

module.exports = ZhihuLoginAndDiagnostic;