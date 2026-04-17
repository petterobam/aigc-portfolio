const { chromium } = require('playwright');

async function testZhihuPage() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  // Load cookies
  const cookieFile = '🛠️自动化系统/auth/zhihu-cookies-latest.json';
  if (require('fs').existsSync(cookieFile)) {
    const cookies = JSON.parse(require('fs').readFileSync(cookieFile, 'utf8'));
    await context.addCookies(cookies);
    console.log(`✅ Loaded ${cookies.length} cookies`);
  } else {
    console.log('❌ Cookie file not found');
  }
  
  const page = await context.newPage();
  
  try {
    console.log('🔍 Testing Zhihu page structure...');
    console.log('Navigating to Zhihu article write page...');
    
    await page.goto('https://zhuanlan.zhihu.com/write', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    console.log('✅ Navigation successful');
    console.log('URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Check for possible redirect/login
    if (page.url().includes('signin')) {
      console.log('⚠️ Page redirected to login page');
      return;
    }
    
    // Look for title selectors with more patience
    const titleSelectors = [
      '.WriteEditorTitle',
      '[placeholder="请输入标题..."]',
      'input[placeholder*="标题"]',
      'input[placeholder*="title"]',
      'input[type="text"]',
      '.Input input',
      '.QuillEditor input',
      '[data-testid="title-input"]',
      '[data-test="title-input"]'
    ];
    
    console.log('\n🔍 Searching for title input elements...');
    let titleElement = null;
    
    for (const selector of titleSelectors) {
      try {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          const placeholder = await element.getAttribute('placeholder');
          const tagName = await element.evaluate(el => el.tagName);
          console.log(`✅ FOUND: ${selector} - visible: true - placeholder: ${placeholder} - tag: ${tagName}`);
          titleElement = element;
          break;
        }
      } catch (e) {
        console.log(`❌ ERROR checking ${selector}: ${e.message}`);
      }
    }
    
    if (!titleElement) {
      console.log('❌ No title element found with current selectors');
      // Log page HTML for debugging
      const html = await page.innerHTML('body');
      console.log('Page body preview:', html.substring(0, 500));
    }
    
    // Look for content selectors
    console.log('\n🔍 Searching for content editor elements...');
    const contentSelectors = [
      '.public-DraftEditor-content',
      '.DraftEditor-editorContainer',
      '.QuillEditor .editor',
      '[contenteditable="true"]',
      '.editor-content',
      '.write-editor',
      '.ProseMirror'
    ];
    
    for (const selector of contentSelectors) {
      try {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          const tagName = await element.evaluate(el => el.tagName);
          console.log(`✅ FOUND: ${selector} - visible: true - tag: ${tagName}`);
        }
      } catch (e) {
        console.log(`❌ ERROR checking ${selector}: ${e.message}`);
      }
    }
    
    // Look for publish button
    console.log('\n🔍 Searching for publish button...');
    const publishSelectors = [
      'button:has-text("发布")',
      '.Button--primary:has-text("发布")',
      '[data-testid="publish-button"]',
      '[data-test="publish-button"]',
      'button:has-text("发表")',
      '.Button:has-text("发布")'
    ];
    
    for (const selector of publishSelectors) {
      try {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          const tagName = await element.evaluate(el => el.tagName);
          console.log(`✅ FOUND: ${selector} - visible: true - tag: ${tagName}`);
        }
      } catch (e) {
        console.log(`❌ ERROR checking ${selector}: ${e.message}`);
      }
    }
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    console.log('✅ Page fully loaded');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.message.includes('timeout')) {
      console.log('⏰ Timeout occurred - page might be loading slowly or blocked');
    }
  } finally {
    await browser.close();
  }
}

testZhihuPage().catch(console.error);