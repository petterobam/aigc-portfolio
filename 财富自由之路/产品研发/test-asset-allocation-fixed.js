/**
 * 资产配置可视化工具 - 交互和边界测试（修复版）
 *
 * 修复点：
 * 1. 使用正确的 Element Plus 滑块选择器（.el-slider）
 * 2. 使用正确的滑块交互方式（点击轨道位置，而非设置 input 值）
 * 3. 保留财务阶段切换和导出功能测试（已验证通过）
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

// 测试财务阶段切换
async function testStageSwitching(page) {
  console.log('\n🔄 测试财务阶段切换...');

  const stageTests = [
    {
      name: '财务保障',
      selector: '.stage-name:has-text("财务保障")'
    },
    {
      name: '财务安全',
      selector: '.stage-name:has-text("财务安全")'
    },
    {
      name: '财务自由',
      selector: '.stage-name:has-text("财务自由")'
    }
  ];

  for (const stage of stageTests) {
    try {
      // 检查元素是否存在
      const exists = await page.locator(stage.selector).count() > 0;

      if (!exists) {
        throw new Error('元素未找到');
      }

      // 点击元素
      await page.click(stage.selector);
      await page.waitForTimeout(800); // 等待图表更新

      testResults.interactionTests.push({
        name: `财务阶段切换 - ${stage.name}`,
        status: '✅ 通过',
        detail: `使用选择器: ${stage.selector}`,
        timestamp: new Date().toISOString()
      });

      console.log(`  ${stage.name}: ✅ 通过`);
    } catch (error) {
      testResults.interactionTests.push({
        name: `财务阶段切换 - ${stage.name}`,
        status: '❌ 失败',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.error(`  ${stage.name}: ❌ 失败 - ${error.message}`);
    }
  }
}

// 测试滑块交互（修复版）
async function testSliderInteractions(page) {
  console.log('\n📏 测试滑块交互...');

  const sliderTests = [
    { name: '低风险滑块', index: 0, values: [0, 50, 100] },
    { name: '中风险滑块', index: 1, values: [0, 50, 100] },
    { name: '高风险滑块', index: 2, values: [0, 50, 100] }
  ];

  for (const test of sliderTests) {
    try {
      const slider = page.locator('.allocation-sliders .el-slider').nth(test.index);

      // 检查滑块是否存在
      const exists = await slider.count() > 0;

      if (!exists) {
        throw new Error(`滑块 ${test.index} 未找到`);
      }

      // 测试不同的值
      for (const value of test.values) {
        try {
          // 获取滑块边界框
          const box = await slider.boundingBox();

          if (!box) {
            throw new Error('无法获取滑块边界框');
          }

          // 计算点击位置（基于百分比）
          const clickX = box.x + (box.width * (value / 100));
          const clickY = box.y + box.height / 2;

          // 点击滑块轨道
          await page.mouse.click(clickX, clickY);
          await page.waitForTimeout(300);

          console.log(`    ${test.name} 设置为 ${value}%: ✅`);
        } catch (clickError) {
          console.log(`    ${test.name} 设置为 ${value}%: ❌ - ${clickError.message}`);
          throw clickError;
        }
      }

      // 检查总比例提示
      const totalMessage = await page.locator('.total-allocation').textContent();

      testResults.boundaryTests.push({
        name: `${test.name} 边界测试`,
        status: '✅ 通过',
        detail: `总比例提示: ${totalMessage}`,
        timestamp: new Date().toISOString()
      });

      console.log(`  ${test.name}: ✅ 通过 - ${totalMessage}`);

    } catch (error) {
      testResults.boundaryTests.push({
        name: `${test.name} 边界测试`,
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
    const slider = page.locator('.allocation-sliders .el-slider').first();
    const box = await slider.boundingBox();

    if (!box) {
      throw new Error('滑块元素未找到');
    }

    // 记录测试开始时的错误数量
    const initialErrorCount = testResults.consoleErrors.length;

    // 快速拖动滑块 5 次
    for (let i = 0; i < 5; i++) {
      const x = box.x + (Math.random() * box.width);
      const y = box.y + box.height / 2;

      await page.mouse.click(x, y);
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
      const button = page.locator(test.selector);
      const count = await button.count();

      if (count === 0) {
        throw new Error('按钮未找到');
      }

      // 检查按钮是否被禁用
      const isDisabled = await button.isDisabled();

      if (isDisabled) {
        testResults.exportTests.push({
          name: test.name,
          status: '⚠️ 跳过',
          detail: '按钮被禁用（预期行为）',
          timestamp: new Date().toISOString()
        });
        console.log(`  ${test.name}: ⚠️ 跳过 - 按钮被禁用（预期行为）`);
        continue;
      }

      // 尝试点击按钮
      await button.click();
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
        status: '❌ 失败',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.error(`  ${test.name}: ❌ 失败 - ${error.message}`);
    }
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 启动修复版测试...\n');
  console.log(`应用地址: ${APP_URL}`);
  console.log(`开始时间: ${new Date().toISOString()}\n`);

  let browser;
  try {
    // 启动浏览器
    browser = await chromium.launch({
      headless: false,
      slowMo: 50
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
    await page.screenshot({ path: path.join(__dirname, 'test-fixed-initial.png'), fullPage: true });
    console.log('📸 截图保存: test-fixed-initial.png');

    // 运行测试
    await testStageSwitching(page);
    await testSliderInteractions(page);
    await testRapidSliderDrag(page);
    await testExportFunction(page);

    // 截图 - 最终状态
    await page.screenshot({ path: path.join(__dirname, 'test-fixed-final.png'), fullPage: true });
    console.log('📸 截图保存: test-fixed-final.png');

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
  console.log('📊 测试报告（修复版）');
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
    if (test.detail) {
      console.log(`    ${test.detail}`);
    }
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
  const reportPath = path.join(__dirname, `test-fixed-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
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
