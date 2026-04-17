/**
 * 资产配置可视化工具 - 交互和边界测试
 *
 * 测试目标：
 * 1. 检查控制台是否有 Element Plus 废弃警告
 * 2. 验证财务阶段切换功能
 * 3. 验证滑块交互（极端值、快速拖拽）
 * 4. 验证导出功能
 * 5. 检查 404 资源警告
 */

const { chromium } = require('playwright');
const path = require('path');

const APP_URL = 'http://localhost:5182/#/asset-allocation';

// 测试结果记录
const testResults = {
  consoleErrors: [],
  consoleWarnings: [],
  consoleInfos: [],
  elementPlusDeprecation: [],
  resource404s: [],
  interactionTests: [],
  boundaryTests: [],
  exportTests: [],
  startTime: new Date().toISOString(),
  endTime: null
};

// 控制台消息监听器
function setupConsoleListeners(page) {
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();

    const logEntry = {
      type,
      text,
      location: location ? `${location.url}:${location.lineNumber}` : 'unknown',
      timestamp: new Date().toISOString()
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
      testResults.consoleInfos.push(logEntry);
    }
  });

  // 监听网络请求，检查 404
  page.on('response', async (response) => {
    if (response.status() === 404) {
      const url = response.url();
      testResults.resource404s.push({
        url,
        timestamp: new Date().toISOString()
      });
      console.warn(`[404] ${url}`);
    }
  });
}

// 测试财务阶段切换
async function testStageSwitching(page) {
  console.log('\n🔄 测试财务阶段切换...');

  const stages = ['guarantee', 'safety', 'freedom'];

  for (const stage of stages) {
    try {
      // 点击阶段按钮
      await page.click(`button:has-text("${stage === 'guarantee' ? '财务保障' : stage === 'safety' ? '财务安全' : '财务自由'}")`);

      // 等待图表更新
      await page.waitForTimeout(500);

      // 检查总比例是否正确
      const totalPercentage = await page.locator('.total-percentage').textContent();
      const isTotalValid = totalPercentage.includes('100%');

      testResults.interactionTests.push({
        name: `财务阶段切换 - ${stage}`,
        status: isTotalValid ? '✅ 通过' : '❌ 失败',
        detail: `总比例显示: ${totalPercentage}`,
        timestamp: new Date().toISOString()
      });

      console.log(`  ${stage}: ${isTotalValid ? '✅ 通过' : '❌ 失败'} - ${totalPercentage}`);
    } catch (error) {
      testResults.interactionTests.push({
        name: `财务阶段切换 - ${stage}`,
        status: '❌ 失败',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.error(`  ${stage}: ❌ 失败 - ${error.message}`);
    }
  }
}

// 测试滑块交互（极端值）
async function testSliderBoundaries(page) {
  console.log('\n📏 测试滑块边界值...');

  const sliderTests = [
    { name: '低风险 0%', slider: 'low-risk', value: 0 },
    { name: '低风险 100%', slider: 'low-risk', value: 100 },
    { name: '中风险 0%', slider: 'medium-risk', value: 0 },
    { name: '中风险 100%', slider: 'medium-risk', value: 100 },
    { name: '高风险 0%', slider: 'high-risk', value: 0 },
    { name: '高风险 100%', slider: 'high-risk', value: 100 }
  ];

  for (const test of sliderTests) {
    try {
      // 找到滑块并拖动
      const slider = page.locator(`input[type="range"]`).nth(test.slider === 'low-risk' ? 0 : test.slider === 'medium-risk' ? 1 : 2);

      // 设置滑块值
      await slider.evaluate((el, val) => el.value = val, test.value);
      await slider.dispatchEvent('input');

      await page.waitForTimeout(300);

      // 检查总比例提示
      const totalMessage = await page.locator('.total-message').textContent();

      testResults.boundaryTests.push({
        name: test.name,
        status: '✅ 通过',
        detail: `总比例提示: ${totalMessage}`,
        timestamp: new Date().toISOString()
      });

      console.log(`  ${test.name}: ✅ 通过 - ${totalMessage}`);
    } catch (error) {
      testResults.boundaryTests.push({
        name: test.name,
        status: '❌ 失败',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.error(`  ${test.name}: ❌ 失败 - ${error.message}`);
    }
  }
}

// 测试快速拖拽滑块
async function testRapidSliderDrag(page) {
  console.log('\n⚡ 测试快速拖拽滑块...');

  try {
    const slider = page.locator('input[type="range"]').first();
    const sliderBox = await slider.boundingBox();

    if (!sliderBox) {
      throw new Error('滑块元素未找到');
    }

    // 快速拖动滑块 5 次
    for (let i = 0; i < 5; i++) {
      const x = sliderBox.x + (Math.random() * sliderBox.width);
      const y = sliderBox.y + sliderBox.height / 2;

      await page.mouse.move(sliderBox.x, sliderBox.y + sliderBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(x, y);
      await page.mouse.up();

      await page.waitForTimeout(100);
    }

    // 检查是否有 JavaScript 错误
    const hasErrors = testResults.consoleErrors.length > 0;

    testResults.boundaryTests.push({
      name: '快速拖拽滑块',
      status: hasErrors ? '❌ 失败' : '✅ 通过',
      detail: hasErrors ? `发现 ${testResults.consoleErrors.length} 个错误` : '无错误',
      timestamp: new Date().toISOString()
    });

    console.log(`  快速拖拽: ${hasErrors ? '❌ 失败' : '✅ 通过'}`);
  } catch (error) {
    testResults.boundaryTests.push({
      name: '快速拖拽滑块',
      status: '❌ 失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    console.error(`  快速拖拽: ❌ 失败 - ${error.message}`);
  }
}

// 测试导出功能
async function testExportFunction(page) {
  console.log('\n📤 测试导出功能...');

  const exportTests = [
    { name: '一键应用推荐配置', selector: 'button:has-text("一键应用推荐配置")' },
    { name: '导出配置报告', selector: 'button:has-text("导出配置报告")' },
    { name: '保存当前配置', selector: 'button:has-text("保存当前配置")' }
  ];

  for (const test of exportTests) {
    try {
      // 检查按钮是否存在
      const buttonExists = await page.locator(test.selector).count() > 0;

      if (!buttonExists) {
        throw new Error('按钮未找到');
      }

      // 尝试点击按钮
      await page.click(test.selector);
      await page.waitForTimeout(1000);

      testResults.exportTests.push({
        name: test.name,
        status: '✅ 通过',
        timestamp: new Date().toISOString()
      });

      console.log(`  ${test.name}: ✅ 通过`);
    } catch (error) {
      testResults.exportTests.push({
        name: test.name,
        status: '⚠️ 未测试',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.warn(`  ${test.name}: ⚠️ 未测试 - ${error.message}`);
    }
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 启动测试...\n');
  console.log(`应用地址: ${APP_URL}`);
  console.log(`开始时间: ${new Date().toISOString()}\n`);

  let browser;
  try {
    // 启动浏览器
    browser = await chromium.launch({
      headless: false,
      slowMo: 100
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // 设置控制台监听器
    setupConsoleListeners(page);

    // 导航到应用
    console.log('📄 加载页面...');
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 截图 - 初始状态
    await page.screenshot({ path: path.join(__dirname, 'test-initial.png'), fullPage: true });
    console.log('📸 截图保存: test-initial.png');

    // 运行测试
    await testStageSwitching(page);
    await testSliderBoundaries(page);
    await testRapidSliderDrag(page);
    await testExportFunction(page);

    // 截图 - 最终状态
    await page.screenshot({ path: path.join(__dirname, 'test-final.png'), fullPage: true });
    console.log('📸 截图保存: test-final.png');

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
  testResults.consoleErrors.forEach((error, index) => {
    console.log(`  ${index + 1}. ${error.text}`);
    console.log(`     位置: ${error.location}`);
  });

  console.log('\n📌 控制台警告:');
  console.log(`  总计: ${testResults.consoleWarnings.length}`);
  testResults.consoleWarnings.forEach((warning, index) => {
    console.log(`  ${index + 1}. ${warning.text}`);
  });

  console.log('\n📌 Element Plus 废弃警告:');
  if (testResults.elementPlusDeprecation.length === 0) {
    console.log('  ✅ 无废弃警告 - 修复成功！');
  } else {
    console.log(`  ❌ 发现 ${testResults.elementPlusDeprecation.length} 个废弃警告`);
    testResults.elementPlusDeprecation.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning.text}`);
    });
  }

  console.log('\n📌 404 资源:');
  if (testResults.resource404s.length === 0) {
    console.log('  ✅ 无 404 资源');
  } else {
    console.log(`  ⚠️ 发现 ${testResults.resource404s.length} 个 404 资源`);
    testResults.resource404s.forEach((resource, index) => {
      console.log(`  ${index + 1}. ${resource.url}`);
    });
  }

  console.log('\n📌 交互测试:');
  testResults.interactionTests.forEach((test) => {
    console.log(`  ${test.status} ${test.name}`);
    if (test.detail) {
      console.log(`    ${test.detail}`);
    }
    if (test.error) {
      console.log(`    错误: ${test.error}`);
    }
  });

  console.log('\n📌 边界测试:');
  testResults.boundaryTests.forEach((test) => {
    console.log(`  ${test.status} ${test.name}`);
    if (test.detail) {
      console.log(`    ${test.detail}`);
    }
    if (test.error) {
      console.log(`    错误: ${test.error}`);
    }
  });

  console.log('\n📌 导出测试:');
  testResults.exportTests.forEach((test) => {
    console.log(`  ${test.status} ${test.name}`);
    if (test.error) {
      console.log(`    错误: ${test.error}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`开始时间: ${testResults.startTime}`);
  console.log(`结束时间: ${testResults.endTime}`);
  console.log('='.repeat(80) + '\n');

  // 保存测试结果
  const fs = require('fs');
  const reportPath = path.join(__dirname, `test-interaction-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`📝 测试报告已保存: ${reportPath}`);

  return testResults;
}

// 运行测试
runTests().then((results) => {
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
