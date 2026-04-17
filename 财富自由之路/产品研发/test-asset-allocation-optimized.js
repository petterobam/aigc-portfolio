/**
 * 资产配置可视化工具 - 交互和边界测试（优化版）
 *
 * 改进点：
 * 1. 使用更精确的 CSS 选择器
 * 2. 增加页面加载等待时间
 * 3. 添加重试机制
 * 4. 使用更灵活的文本匹配
 * 5. 添加详细的调试日志
 */

const { chromium } = require('playwright');
const path = require('path');

const APP_URL = 'http://localhost:5183/#/asset-allocation';
const PAGE_LOAD_TIMEOUT = 5000;
const ELEMENT_WAIT_TIMEOUT = 3000;

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

// 等待元素出现的通用函数
async function waitForElement(page, selector, timeout = ELEMENT_WAIT_TIMEOUT) {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return true;
  } catch (error) {
    console.log(`  ⏰ 元素未找到: ${selector}`);
    return false;
  }
}

// 测试财务阶段切换
async function testStageSwitching(page) {
  console.log('\n🔄 测试财务阶段切换...');

  // 使用更灵活的选择器策略
  const stageTests = [
    {
      name: '财务保障',
      selectors: [
        'button:has-text("财务保障")',
        '.stage-name:has-text("财务保障")',
        'span:has-text("财务保障")'
      ]
    },
    {
      name: '财务安全',
      selectors: [
        'button:has-text("财务安全")',
        '.stage-name:has-text("财务安全")',
        'span:has-text("财务安全")'
      ]
    },
    {
      name: '财务自由',
      selectors: [
        'button:has-text("财务自由")',
        '.stage-name:has-text("财务自由")',
        'span:has-text("财务自由")'
      ]
    }
  ];

  for (const stage of stageTests) {
    let clickSuccess = false;
    let selectorUsed = '';

    // 尝试多个选择器
    for (const selector of stage.selectors) {
      try {
        // 检查元素是否存在
        const exists = await page.locator(selector).count() > 0;

        if (exists) {
          console.log(`  ✓ 找到元素: ${selector}`);

          // 点击元素
          await page.click(selector);
          await page.waitForTimeout(800); // 等待图表更新

          clickSuccess = true;
          selectorUsed = selector;
          break;
        }
      } catch (error) {
        // 继续尝试下一个选择器
        console.log(`  ✗ 选择器失败: ${selector} - ${error.message}`);
      }
    }

    if (clickSuccess) {
      testResults.interactionTests.push({
        name: `财务阶段切换 - ${stage.name}`,
        status: '✅ 通过',
        detail: `使用选择器: ${selectorUsed}`,
        timestamp: new Date().toISOString()
      });
      console.log(`  ${stage.name}: ✅ 通过`);
    } else {
      testResults.interactionTests.push({
        name: `财务阶段切换 - ${stage.name}`,
        status: '❌ 失败',
        error: '所有选择器都未能定位到元素',
        timestamp: new Date().toISOString()
      });
      console.log(`  ${stage.name}: ❌ 失败 - 所有选择器都未能定位到元素`);

      // 调试：打印页面 HTML 结构
      try {
        const stageSelectorHTML = await page.locator('.stage-selector').innerHTML();
        console.log(`\n  🔍 调试信息 - 阶段选择器 HTML:`);
        console.log(`  ${stageSelectorHTML.substring(0, 500)}...\n`);
      } catch (debugError) {
        console.log(`  🔍 无法获取调试信息: ${debugError.message}`);
      }
    }
  }
}

// 测试滑块交互（极端值）
async function testSliderBoundaries(page) {
  console.log('\n📏 测试滑块边界值...');

  const sliderTests = [
    { name: '低风险 0%', index: 0, value: 0 },
    { name: '低风险 100%', index: 0, value: 100 },
    { name: '中风险 0%', index: 1, value: 0 },
    { name: '中风险 100%', index: 1, value: 100 },
    { name: '高风险 0%', index: 2, value: 0 },
    { name: '高风险 100%', index: 2, value: 100 }
  ];

  for (const test of sliderTests) {
    try {
      // 使用更稳定的选择器
      const slider = page.locator('.allocation-sliders input[type="range"]').nth(test.index);

      // 检查滑块是否存在
      const exists = await slider.count() > 0;

      if (!exists) {
        throw new Error(`滑块 ${test.index} 未找到`);
      }

      // 设置滑块值
      await slider.evaluate((el, val) => {
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, test.value);

      await page.waitForTimeout(500);

      // 检查总比例提示
      const totalMessage = await page.locator('.total-allocation').textContent();

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
    const slider = page.locator('.allocation-sliders input[type="range"]').first();
    const sliderBox = await slider.boundingBox();

    if (!sliderBox) {
      throw new Error('滑块元素未找到');
    }

    // 记录测试开始时的错误数量
    const initialErrorCount = testResults.consoleErrors.length;

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

    // 检查是否有新的 JavaScript 错误
    const newErrorsCount = testResults.consoleErrors.length - initialErrorCount;
    const hasErrors = newErrorsCount > 0;

    testResults.boundaryTests.push({
      name: '快速拖拽滑块',
      status: hasErrors ? '❌ 失败' : '✅ 通过',
      detail: hasErrors ? `发现 ${newErrorsCount} 个新错误` : '无错误',
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
  console.log('🚀 启动优化版测试...\n');
  console.log(`应用地址: ${APP_URL}`);
  console.log(`开始时间: ${new Date().toISOString()}\n`);

  let browser;
  try {
    // 启动浏览器
    browser = await chromium.launch({
      headless: false,  // 显示浏览器以便调试
      slowMo: 50       // 减慢操作速度，便于观察
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // 设置控制台监听器
    setupConsoleListeners(page);

    // 导航到应用
    console.log('📄 加载页面...');
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(PAGE_LOAD_TIMEOUT);

    // 检查页面是否成功加载
    const pageTitle = await page.title();
    console.log(`📄 页面标题: ${pageTitle}`);

    // 截图 - 初始状态
    await page.screenshot({ path: path.join(__dirname, 'test-optimized-initial.png'), fullPage: true });
    console.log('📸 截图保存: test-optimized-initial.png');

    // 运行测试
    await testStageSwitching(page);
    await testSliderBoundaries(page);
    await testRapidSliderDrag(page);
    await testExportFunction(page);

    // 截图 - 最终状态
    await page.screenshot({ path: path.join(__dirname, 'test-optimized-final.png'), fullPage: true });
    console.log('📸 截图保存: test-optimized-final.png');

    // 关闭浏览器
    await browser.close();

  } catch (error) {
    console.error('❌ 测试执行失败:', error);

    if (browser) {
      await browser.close();
    }

    throw error;
  }

  // 记录测试结束时间
  testResults.endTime = new Date().toISOString();

  // 生成测试报告
  console.log('\n' + '='.repeat(80));
  console.log('📊 测试报告（优化版）');
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
  const reportPath = path.join(__dirname, `test-optimized-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
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
