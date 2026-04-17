/**
 * 简化版测试 - 检查控制台错误和警告
 */

const { chromium } = require('playwright');
const path = require('path');

const APP_URL = 'http://localhost:5182/#/asset-allocation';

// 测试结果
const testResults = {
  consoleErrors: [],
  consoleWarnings: [],
  elementPlusDeprecation: [],
  resource404s: [],
  startTime: new Date().toISOString(),
  endTime: null
};

async function runTest() {
  console.log('🚀 启动简化测试...\n');
  console.log(`应用地址: ${APP_URL}\n`);

  let browser;
  try {
    browser = await chromium.launch({
      headless: false,
      slowMo: 50
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // 监听控制台消息
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();

      const logEntry = {
        type,
        text,
        location: location ? `${path.basename(location.url)}:${location.lineNumber}` : 'unknown'
      };

      if (type === 'error') {
        testResults.consoleErrors.push(logEntry);
        console.error(`[ERROR] ${text}`);
      } else if (type === 'warning') {
        testResults.consoleWarnings.push(logEntry);
        console.warn(`[WARNING] ${text}`);

        // 检查 Element Plus 废弃警告
        if (text.includes('Element Plus') && (text.includes('deprecated') || text.includes('prop is deprecated'))) {
          testResults.elementPlusDeprecation.push(logEntry);
        }
      } else if (type === 'info') {
        console.log(`[INFO] ${text}`);
      }
    });

    // 监听网络请求
    page.on('response', async (response) => {
      if (response.status() === 404) {
        const url = response.url();
        testResults.resource404s.push({
          url,
          resourceType: response.request().resourceType()
        });
        console.warn(`[404] ${response.request().resourceType()}: ${url}`);
      }
    });

    // 导航到应用
    console.log('📄 加载页面...');
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('✅ 页面加载完成');

    // 等待一段时间，让所有资源加载
    console.log('⏳ 等待资源加载...');
    await page.waitForTimeout(3000);

    // 获取页面标题
    const title = await page.title();
    console.log(`📝 页面标题: ${title}`);

    // 获取页面内容（检查是否有错误提示）
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('错误') || bodyText.includes('Error')) {
      console.warn('⚠️ 页面可能包含错误信息');
    }

    // 截图
    const screenshotPath = path.join(__dirname, 'test-simple.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图保存: ${screenshotPath}`);

    // 等待更多时间，收集更多控制台消息
    console.log('⏳ 等待更多控制台消息...');
    await page.waitForTimeout(2000);

    // 关闭浏览器
    await browser.close();

  } catch (error) {
    console.error('❌ 测试执行失败:', error);

    if (browser) {
      await browser.close();
    }
  }

  // 记录测试结束时间
  testResults.endTime = new Date().toISOString();

  // 生成测试报告
  console.log('\n' + '='.repeat(80));
  console.log('📊 测试报告');
  console.log('='.repeat(80));

  console.log('\n📌 控制台错误:');
  console.log(`  总计: ${testResults.consoleErrors.length}`);
  if (testResults.consoleErrors.length > 0) {
    testResults.consoleErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.text}`);
      console.log(`     位置: ${error.location}`);
    });
  } else {
    console.log('  ✅ 无控制台错误');
  }

  console.log('\n📌 控制台警告:');
  console.log(`  总计: ${testResults.consoleWarnings.length}`);
  if (testResults.consoleWarnings.length > 0) {
    testResults.consoleWarnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning.text}`);
      console.log(`     位置: ${warning.location}`);
    });
  } else {
    console.log('  ✅ 无控制台警告');
  }

  console.log('\n📌 Element Plus 废弃警告:');
  if (testResults.elementPlusDeprecation.length === 0) {
    console.log('  ✅ 无废弃警告 - 修复成功！');
  } else {
    console.log(`  ❌ 发现 ${testResults.elementPlusDeprecation.length} 个废弃警告`);
    testResults.elementPlusDeprecation.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning.text}`);
      console.log(`     位置: ${warning.location}`);
    });
  }

  console.log('\n📌 404 资源:');
  if (testResults.resource404s.length === 0) {
    console.log('  ✅ 无 404 资源');
  } else {
    console.log(`  ⚠️ 发现 ${testResults.resource404s.length} 个 404 资源`);
    testResults.resource404s.forEach((resource, index) => {
      console.log(`  ${index + 1}. [${resource.resourceType}] ${resource.url}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log(`开始时间: ${testResults.startTime}`);
  console.log(`结束时间: ${testResults.endTime}`);
  console.log('='.repeat(80) + '\n');

  // 保存测试结果
  const fs = require('fs');
  const reportPath = path.join(__dirname, `test-simple-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`📝 测试报告已保存: ${reportPath}`);

  return testResults;
}

// 运行测试
runTest().then((results) => {
  console.log('✅ 测试完成');

  // 退出码：如果有错误则返回 1
  const hasErrors =
    results.consoleErrors.length > 0 ||
    results.elementPlusDeprecation.length > 0;

  process.exit(hasErrors ? 1 : 0);
}).catch((error) => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
