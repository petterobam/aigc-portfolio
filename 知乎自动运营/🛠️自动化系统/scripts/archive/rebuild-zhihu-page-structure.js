const { chromium } = require('playwright');

/**
 * 知乎页面结构重建脚本
 * 
 * 用途：重建知乎自动化脚本的页面选择器，解决页面结构变化问题
 * 
 * 功能：
 * 1. 检测知乎登录状态
 * 2. 重建文章发布页面选择器
 * 3. 重建登录页面选择器
 * 4. 生成新的选择器配置文件
 */

async function rebuildZhihuPageStructure() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  
  // 加载cookies
  const cookieFile = '🛠️自动化系统/auth/zhihu-cookies-latest.json';
  const fs = require('fs');
  
  let cookies = [];
  if (fs.existsSync(cookieFile)) {
    try {
      cookies = JSON.parse(fs.readFileSync(cookieFile, 'utf8'));
      await context.addCookies(cookies);
      console.log(`✅ 已加载 ${cookies.length} 个 cookies`);
    } catch (error) {
      console.log('❌ Cookie 文件加载失败:', error.message);
    }
  }
  
  const page = await context.newPage();
  
  // 创建页面结构分析结果
  const pageStructure = {
    timestamp: new Date().toISOString(),
    loginStatus: null,
    writePage: null,
    loginPage: null,
    suggestions: []
  };
  
  try {
    console.log('🔍 开始分析知乎页面结构...');
    
    // 1. 检查登录状态
    console.log('\n🔍 1. 检查登录状态...');
    await page.goto('https://www.zhihu.com', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    const isLoggedIn = await checkLoginStatus(page);
    pageStructure.loginStatus = isLoggedIn;
    
    if (isLoggedIn) {
      console.log('✅ 已登录状态');
    } else {
      console.log('❌ 未登录状态');
      // 分析登录页面结构
      console.log('\n🔍 分析登录页面结构...');
      await analyzeLoginPage(page);
    }
    
    // 2. 分析文章发布页面（仅适用于登录状态）
    if (isLoggedIn) {
      console.log('\n🔍 2. 分析文章发布页面...');
      await page.goto('https://zhuanlan.zhihu.com/write', { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForLoadState('networkidle');
      
      const writePageStructure = await analyzeWritePage(page);
      pageStructure.writePage = writePageStructure;
    }
    
    // 3. 分析创作中心页面
    console.log('\n🔍 3. 分析创作中心页面...');
    await page.goto('https://www.zhihu.com/creator', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    const creatorPageStructure = await analyzeCreatorPage(page);
    pageStructure.creatorPage = creatorPageStructure;
    
    // 4. 生成建议
    const suggestions = generateSuggestions(pageStructure);
    pageStructure.suggestions = suggestions;
    
    // 保存分析结果
    const outputFile = '🛠️自动化系统/reports/page-structure-rebuild-' + 
                      new Date().toISOString().replace(/[:.]/g, '-') + '.json';
    
    fs.writeFileSync(outputFile, JSON.stringify(pageStructure, null, 2));
    console.log(`\n📁 页面结构分析已保存到: ${outputFile}`);
    
    // 生成新的选择器配置
    const newSelectors = generateNewSelectors(pageStructure);
    const selectorFile = '🛠️自动化系统/config/page-selectors-v2.json';
    
    fs.writeFileSync(selectorFile, JSON.stringify(newSelectors, null, 2));
    console.log(`📁 新的选择器配置已保存到: ${selectorFile}`);
    
    console.log('\n🎯 页面结构重建完成！');
    
  } catch (error) {
    console.log('❌ 分析过程中出现错误:', error.message);
  } finally {
    await browser.close();
  }
}

// 检查登录状态
async function checkLoginStatus(page) {
  const loginSelectors = [
    'button:has-text("登录")',
    'a:has-text("登录")',
    '.SignFlow-start',
    '.Login-button',
    '[data-testid="login-button"]',
    '.Button--primary:has-text("登录")'
  ];
  
  for (const selector of loginSelectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        console.log(`❌ 检测到登录按钮: ${selector}`);
        return false;
      }
    } catch (e) {
      // 忽略错误，继续尝试下一个选择器
    }
  }
  
  // 检查是否有用户信息
  const userSelectors = [
    '.UserLink',
    '.Profile-link',
    '[data-testid="user-avatar"]',
    '.Avatar',
    '.AccountButton'
  ];
  
  for (const selector of userSelectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        console.log(`✅ 检测到用户信息: ${selector}`);
        return true;
      }
    } catch (e) {
      // 忽略错误
    }
  }
  
  return false;
}

// 分析登录页面
async function analyzeLoginPage(page) {
  const structure = {
    title: {},
    username: {},
    password: {},
    loginButton: {},
    otherElements: []
  };
  
  // 标题元素
  const titleSelectors = [
    '.SignFlow-start',
    '.Login-title',
    'h1',
    'h2',
    '[data-testid="login-title"]'
  ];
  
  for (const selector of titleSelectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        const text = await element.textContent();
        structure.title[selector] = { visible: true, text: text };
      }
    } catch (e) {
      structure.title[selector] = { visible: false, error: e.message };
    }
  }
  
  // 用户名输入框
  const usernameSelectors = [
    'input[type="text"]',
    'input[placeholder*="手机"]',
    'input[placeholder*="邮箱"]',
    'input[placeholder*="用户名"]',
    '[data-testid="username-input"]'
  ];
  
  for (const selector of usernameSelectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        const placeholder = await element.getAttribute('placeholder');
        structure.username[selector] = { visible: true, placeholder };
      }
    } catch (e) {
      structure.username[selector] = { visible: false, error: e.message };
    }
  }
  
  // 密码输入框
  const passwordSelectors = [
    'input[type="password"]',
    'input[placeholder*="密码"]',
    '[data-testid="password-input"]'
  ];
  
  for (const selector of passwordSelectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        const placeholder = await element.getAttribute('placeholder');
        structure.password[selector] = { visible: true, placeholder };
      }
    } catch (e) {
      structure.password[selector] = { visible: false, error: e.message };
    }
  }
  
  // 登录按钮
  const loginButtonSelectors = [
    'button:has-text("登录")',
    'button:has-text("立即登录")',
    '.Button--primary:has-text("登录")',
    '[data-testid="login-submit"]'
  ];
  
  for (const selector of loginButtonSelectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        const text = await element.textContent();
        structure.loginButton[selector] = { visible: true, text };
      }
    } catch (e) {
      structure.loginButton[selector] = { visible: false, error: e.message };
    }
  }
  
  return structure;
}

// 分析文章发布页面
async function analyzeWritePage(page) {
  const structure = {
    title: {},
    content: {},
    publishButton: {},
    tags: {},
    otherElements: []
  };
  
  // 标题输入框
  const titleSelectors = [
    '.WriteEditorTitle',
    '[placeholder="请输入标题..."]',
    'input[placeholder*="标题"]',
    'input[type="text"]',
    '[data-testid="title-input"]'
  ];
  
  for (const selector of titleSelectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        const placeholder = await element.getAttribute('placeholder');
        structure.title[selector] = { visible: true, placeholder };
      }
    } catch (e) {
      structure.title[selector] = { visible: false, error: e.message };
    }
  }
  
  // 内容编辑器
  const contentSelectors = [
    '.public-DraftEditor-content',
    '.DraftEditor-editorContainer',
    'div[contenteditable="true"]',
    '.editor-content',
    '.ProseMirror',
    '.QuillEditor .editor'
  ];
  
  for (const selector of contentSelectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        const tagName = await element.evaluate(el => el.tagName);
        structure.content[selector] = { visible: true, tagName };
      }
    } catch (e) {
      structure.content[selector] = { visible: false, error: e.message };
    }
  }
  
  // 发布按钮
  const publishSelectors = [
    'button:has-text("发布")',
    'button:has-text("发表")',
    '.Button--primary:has-text("发布")',
    '[data-testid="publish-button"]',
    '.PublishButton'
  ];
  
  for (const selector of publishSelectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        const text = await element.textContent();
        structure.publishButton[selector] = { visible: true, text };
      }
    } catch (e) {
      structure.publishButton[selector] = { visible: false, error: e.message };
    }
  }
  
  // 标签输入
  const tagSelectors = [
    'input[placeholder*="标签"]',
    'input[placeholder*="话题"]',
    '.TagInput input'
  ];
  
  for (const selector of tagSelectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        const placeholder = await element.getAttribute('placeholder');
        structure.tags[selector] = { visible: true, placeholder };
      }
    } catch (e) {
      structure.tags[selector] = { visible: false, error: e.message };
    }
  }
  
  return structure;
}

// 分析创作中心页面
async function analyzeCreatorPage(page) {
  const structure = {
    articles: {},
    columns: {},
    dataAnalysis: {},
    settings: {}
  };
  
  // 文章管理
  const articleSelectors = [
    'a:has-text("文章")',
    '.ArticleManagement',
    '[data-testid="article-tab"]'
  ];
  
  for (const selector of articleSelectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        structure.articles[selector] = { visible: true };
      }
    } catch (e) {
      structure.articles[selector] = { visible: false, error: e.message };
    }
  }
  
  // 专栏管理
  const columnSelectors = [
    'a:has-text("专栏")',
    '.ColumnManagement',
    '[data-testid="column-tab"]'
  ];
  
  for (const selector of columnSelectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        structure.columns[selector] = { visible: true };
      }
    } catch (e) {
      structure.columns[selector] = { visible: false, error: e.message };
    }
  }
  
  return structure;
}

// 生成修复建议
function generateSuggestions(pageStructure) {
  const suggestions = [];
  
  if (!pageStructure.loginStatus) {
    suggestions.push({
      type: 'critical',
      message: '需要重新登录知乎账号',
      steps: [
        '手动登录知乎账号',
        '保存 cookies',
        '重新运行此脚本'
      ]
    });
  }
  
  if (!pageStructure.writePage) {
    suggestions.push({
      type: 'error',
      message: '无法访问文章发布页面',
      steps: [
        '检查登录状态',
        '检查页面权限',
        '联系知乎客服'
      ]
    });
  }
  
  // 标题元素建议
  const titleSelectors = Object.keys(pageStructure.writePage?.title || {});
  if (titleSelectors.length === 0) {
    suggestions.push({
      type: 'warning',
      message: '未找到标题输入元素',
      steps: [
        '手动打开文章发布页面',
        '检查页面结构',
        '更新选择器配置'
      ]
    });
  }
  
  // 内容编辑器建议
  const contentSelectors = Object.keys(pageStructure.writePage?.content || {});
  if (contentSelectors.length === 0) {
    suggestions.push({
      type: 'warning',
      message: '未找到内容编辑器',
      steps: [
        '检查是否在新标签页中',
        '尝试不同的内容编辑器选择器',
        '检查是否被iframe包裹'
      ]
    });
  }
  
  // 发布按钮建议
  const publishSelectors = Object.keys(pageStructure.writePage?.publishButton || {});
  if (publishSelectors.length === 0) {
    suggestions.push({
      type: 'warning',
      message: '未找到发布按钮',
      steps: [
        '检查是否被遮挡',
        '尝试等待页面完全加载',
        '检查是否需要滚动'
      ]
    });
  }
  
  return suggestions;
}

// 按优先级排序选择器
const sortSelectors = (elements) => {
  return Object.entries(elements)
    .filter(([_, info]) => info.visible)
    .map(([selector]) => selector);
};

// 生成新的选择器配置
function generateNewSelectors(pageStructure) {
  const selectors = {
    write: {
      title: [],
      content: [],
      publish: [],
      tags: []
    },
    login: {
      username: [],
      password: [],
      submit: []
    },
    creator: {
      articles: [],
      columns: []
    }
  };
  
  // 从分析结果中提取有效的选择器
  if (pageStructure.writePage) {
    selectors.write.title = sortSelectors(pageStructure.writePage.title);
    selectors.write.content = sortSelectors(pageStructure.writePage.content);
    selectors.write.publish = sortSelectors(pageStructure.writePage.publishButton);
    selectors.write.tags = sortSelectors(pageStructure.writePage.tags);
  }
  
  if (pageStructure.loginPage) {
    selectors.login.username = sortSelectors(pageStructure.loginPage.username);
    selectors.login.password = sortSelectors(pageStructure.loginPage.password);
    selectors.login.submit = sortSelectors(pageStructure.loginPage.loginButton);
  }
  
  if (pageStructure.creatorPage) {
    selectors.creator.articles = sortSelectors(pageStructure.creatorPage.articles);
    selectors.creator.columns = sortSelectors(pageStructure.creatorPage.columns);
  }
  
  return selectors;
}

// 运行脚本
rebuildZhihuPageStructure().catch(console.error);