/**
 * Playwright 自动化发布测试脚本
 *
 * 测试内容:
 * - Cookie 加载
 * - 登录状态验证
 * - 访问发布页面
 * - 识别发布页面元素
 *
 * 目标: 验证 Playwright 是否可以用于自动化发布
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// 选择器配置 (基于 selectors-config.js)
const selectors = {
  baseUrl: 'https://fanqienovel.com',
  publishUrl: 'https://fanqienovel.com/page/shortStoryPublish',
  loginUrl: 'https://fanqienovel.com/page/login',
  elements: {
    // 登录状态
    loginStatus: [
      '.user-avatar',
      '[class*="user"]',
      '[class*="avatar"]'
    ],
    // 发布页面元素
    titleInput: [
      'input[placeholder*="标题"]',
      'input[name="title"]',
      '.title-input'
    ],
    introInput: [
      'textarea[placeholder*="简介"]',
      'textarea[name="intro"]',
      '.intro-input'
    ],
    contentEditor: [
      '[contenteditable="true"]',
      '.editor',
      '.content-editor'
    ],
    submitButton: [
      'button[type="submit"]',
      '.submit-btn',
      '.publish-btn'
    ]
  }
};

/**
 * 加载 Cookie
 */
async function loadCookies(context, cookieFile) {
  try {
    const cookiePath = path.resolve(__dirname, cookieFile);
    const cookieData = fs.readFileSync(cookiePath, 'utf-8');
    const cookies = JSON.parse(cookieData);

    console.log(`🍪 加载 ${cookies.length} 个 Cookie`);
    await context.addCookies(cookies);

    return true;
  } catch (error) {
    console.error('❌ 加载 Cookie 失败:', error.message);
    return false;
  }
}

/**
 * 检查登录状态
 */
async function checkLoginStatus(page) {
  try {
    // 导航到首页
    await page.goto(selectors.baseUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // 检查是否有登录状态的元素
    for (const selector of selectors.elements.loginStatus) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        console.log(`✅ 找到登录状态元素: ${selector}`);

        // 获取用户名
        const username = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          return el ? el.textContent || el.getAttribute('title') : null;
        }, selector);

        if (username) {
          console.log(`👤 用户名: ${username}`);
        }

        return true;
      } catch (error) {
        // 继续尝试下一个选择器
      }
    }

    console.log('⚠️ 未找到登录状态元素');
    return false;
  } catch (error) {
    console.error('❌ 检查登录状态失败:', error.message);
    return false;
  }
}

/**
 * 访问发布页面
 */
async function navigateToPublishPage(page) {
  try {
    console.log('📝 导航到发布页面...');

    await page.goto(selectors.publishUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ 已到达发布页面');
    console.log(`🔗 URL: ${page.url()}`);

    // 截图
    const screenshotPath = path.resolve(__dirname, '../screenshots/publish-page.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}`);

    return true;
  } catch (error) {
    console.error('❌ 访问发布页面失败:', error.message);
    return false;
  }
}

/**
 * 检测发布页面元素
 */
async function detectPublishPageElements(page) {
  console.log('🔍 检测发布页面元素...');

  const results = {};

  for (const [elementName, selectorList] of Object.entries(selectors.elements)) {
    if (elementName === 'loginStatus') continue; // 跳过登录状态检测

    console.log(`\n检测 ${elementName}...`);

    let found = false;

    for (const selector of selectorList) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        console.log(`  ✅ 找到: ${selector}`);
        results[elementName] = {
          found: true,
          selector: selector
        };
        found = true;
        break;
      } catch (error) {
        console.log(`  ❌ 未找到: ${selector}`);
      }
    }

    if (!found) {
      results[elementName] = {
        found: false,
        selector: null
      };
    }
  }

  return results;
}

/**
 * 填充发布信息（测试）
 */
async function testFillPublishInfo(page) {
  console.log('\n📝 测试填充发布信息...');

  try {
    // 获取检测结果
    const results = await detectPublishPageElements(page);

    // 测试填充标题
    if (results.titleInput && results.titleInput.found) {
      console.log('\n测试填充标题...');
      await page.fill(results.titleInput.selector, '测试标题');
      console.log('✅ 标题填充成功');
    }

    // 测试填充简介
    if (results.introInput && results.introInput.found) {
      console.log('\n测试填充简介...');
      await page.fill(results.introInput.selector, '测试简介');
      console.log('✅ 简介填充成功');
    }

    // 测试填充正文
    if (results.contentEditor && results.contentEditor.found) {
      console.log('\n测试填充正文...');
      await page.evaluate((selector) => {
        const editor = document.querySelector(selector);
        if (editor) {
          editor.innerHTML = '<h2>第一章</h2><p>测试内容</p>';
          editor.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, results.contentEditor.selector);
      console.log('✅ 正文填充成功');
    }

    // 截图
    const screenshotPath = path.resolve(__dirname, '../screenshots/publish-filled.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}`);

    return true;
  } catch (error) {
    console.error('❌ 测试填充发布信息失败:', error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 Playwright 自动化发布测试\n');

  const browser = await chromium.launch({
    headless: false, // 显示浏览器
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    // 1. 加载 Cookie
    console.log('1️⃣ 加载 Cookie\n');
    const cookieFile = '../cookies/latest.json';
    const cookieLoaded = await loadCookies(context, cookieFile);

    if (!cookieLoaded) {
      console.error('⚠️ Cookie 加载失败，但继续测试...');
    }

    // 2. 检查登录状态
    console.log('\n2️⃣ 检查登录状态\n');
    const isLoggedIn = await checkLoginStatus(page);

    if (!isLoggedIn) {
      console.error('❌ 登录状态无效，无法继续测试');
      await browser.close();
      process.exit(1);
    }

    // 3. 访问发布页面
    console.log('\n3️⃣ 访问发布页面\n');
    const navigated = await navigateToPublishPage(page);

    if (!navigated) {
      console.error('❌ 访问发布页面失败');
      await browser.close();
      process.exit(1);
    }

    // 4. 检测发布页面元素
    console.log('\n4️⃣ 检测发布页面元素\n');
    const detectionResults = await detectPublishPageElements(page);

    // 5. 测试填充发布信息
    console.log('\n5️⃣ 测试填充发布信息\n');
    const fillTestPassed = await testFillPublishInfo(page);

    // 6. 总结
    console.log('\n' + '='.repeat(50));
    console.log('📊 测试总结\n');

    const elementCount = Object.keys(detectionResults).length;
    const foundCount = Object.values(detectionResults).filter(r => r.found).length;

    console.log(`🔍 元素检测结果: ${foundCount}/${elementCount} 个元素找到\n`);

    for (const [elementName, result] of Object.entries(detectionResults)) {
      const status = result.found ? '✅' : '❌';
      console.log(`${status} ${elementName}: ${result.selector || '未找到'}`);
    }

    console.log('\n' + '='.repeat(50));

    if (foundCount === elementCount && fillTestPassed) {
      console.log('✅ 所有测试通过，Playwright 可以用于自动化发布！');
      console.log('\n下一步:');
      console.log('  1. 创建完整的 Playwright 发布脚本');
      console.log('  2. 实现35号故事自动化发布');
      console.log('  3. 验证发布流程');
    } else {
      console.log('⚠️ 部分测试未通过，需要优化选择器');
      console.log('\n建议:');
      console.log('  1. 手动检查番茄小说发布页面');
      console.log('  2. 更新选择器配置');
      console.log('  3. 重新运行测试');
    }

    // 等待用户查看
    console.log('\n按任意键关闭浏览器...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('\n✅ 测试结束');
  }
}

// 运行主函数
main().catch(error => {
  console.error('❌ 程序异常退出:', error.message);
  process.exit(1);
});
