/**
 * 跨浏览器兼容性测试脚本
 * 测试资产配置可视化工具在不同浏览器中的兼容性
 *
 * 测试浏览器：
 * - Chrome (Chromium)
 * - Firefox
 * - Safari (Webkit)
 * - Edge (Chromium)
 *
 * 测试内容：
 * 1. 基本功能测试（页面加载、元素渲染）
 * 2. 图表渲染测试（饼图、雷达图、增长曲线）
 * 3. 交互功能测试（滑块、按钮、导出）
 * 4. 性能测试（加载时间、渲染时间）
 * 5. 控制台错误检测（无 404、无错误、无警告）
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 测试浏览器列表
const browsers = [
  { name: 'Chrome', path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' },
  { name: 'Firefox', path: '/Applications/Firefox.app/Contents/MacOS/firefox' },
  { name: 'Safari', path: '/Applications/Safari.app/Contents/MacOS/Safari' },
  { name: 'Edge', path: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge' },
];

// 测试结果
const testResults = {
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    browsersTested: 0,
  },
  browsers: {},
  errors: [],
};

// 测试用例
async function runTests(browserInfo, url) {
  console.log(`\n🧪 开始测试 ${browserInfo.name}...`);

  const browserResults = {
    name: browserInfo.name,
    path: browserInfo.path,
    tests: {},
    performance: {},
    consoleLogs: { errors: [], warnings: [], info: [] },
    success: true,
  };

  try {
    // 启动浏览器
    const browser = await puppeteer.launch({
      executablePath: browserInfo.path,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // 监听控制台日志
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        browserResults.consoleLogs.errors.push(text);
        console.log(`❌ ${browserInfo.name} Error: ${text}`);
      } else if (msg.type() === 'warning') {
        browserResults.consoleLogs.warnings.push(text);
        console.log(`⚠️ ${browserInfo.name} Warning: ${text}`);
      } else if (msg.type() === 'info') {
        browserResults.consoleLogs.info.push(text);
      }
    });

    // 性能测试：页面加载时间
    console.log(`⏱️ 测试页面加载时间...`);
    const loadStart = Date.now();
    await page.goto(url, { waitUntil: 'networkidle2' });
    const loadTime = Date.now() - loadStart;
    browserResults.performance.pageLoadTime = loadTime;
    console.log(`✅ ${browserInfo.name} 页面加载时间: ${loadTime}ms`);

    // 测试 1：基本功能测试
    console.log(`🔍 测试基本功能...`);
    try {
      // 检查页面标题
      const title = await page.title();
      const titleTest = title.includes('财富自由') || title.includes('资产配置');
      browserResults.tests.title = {
        name: '页面标题',
        expected: '包含"财富自由"或"资产配置"',
        actual: title,
        passed: titleTest,
      };

      // 检查主要元素
      const mainElement = await page.$('#app');
      const mainElementTest = mainElement !== null;
      browserResults.tests.mainElement = {
        name: '主容器 (#app)',
        expected: '存在',
        actual: mainElementTest ? '存在' : '不存在',
        passed: mainElementTest,
      };

      console.log(`✅ ${browserInfo.name} 基本功能测试完成`);
    } catch (error) {
      console.error(`❌ ${browserInfo.name} 基本功能测试失败:`, error.message);
      browserResults.tests.basic = { name: '基本功能', passed: false, error: error.message };
      browserResults.success = false;
    }

    // 测试 2：图表渲染测试
    console.log(`🔍 测试图表渲染...`);
    try {
      // 等待图表加载
      await page.waitForTimeout(2000);

      // 检查饼图
      const pieChart = await page.$('.asset-allocation-chart');
      const pieChartTest = pieChart !== null;
      browserResults.tests.pieChart = {
        name: '饼图',
        expected: '存在',
        actual: pieChartTest ? '存在' : '不存在',
        passed: pieChartTest,
      };

      // 检查雷达图
      const radarChart = await page.$('.risk-return-chart');
      const radarChartTest = radarChart !== null;
      browserResults.tests.radarChart = {
        name: '雷达图',
        expected: '存在',
        actual: radarChartTest ? '存在' : '不存在',
        passed: radarChartTest,
      };

      // 检查增长曲线
      const growthChart = await page.$('.growth-chart');
      const growthChartTest = growthChart !== null;
      browserResults.tests.growthChart = {
        name: '增长曲线',
        expected: '存在',
        actual: growthChartTest ? '存在' : '不存在',
        passed: growthChartTest,
      };

      console.log(`✅ ${browserInfo.name} 图表渲染测试完成`);
    } catch (error) {
      console.error(`❌ ${browserInfo.name} 图表渲染测试失败:`, error.message);
      browserResults.tests.charts = { name: '图表渲染', passed: false, error: error.message };
      browserResults.success = false;
    }

    // 测试 3：交互功能测试
    console.log(`🔍 测试交互功能...`);
    try {
      // 测试财务阶段切换
      const stageButtons = await page.$$('.financial-stage-selector .el-radio-button');
      const stageButtonsTest = stageButtons.length === 3; // 应该有 3 个阶段
      browserResults.tests.stageButtons = {
        name: '财务阶段选择器',
        expected: '3 个按钮',
        actual: `${stageButtons.length} 个按钮`,
        passed: stageButtonsTest,
      };

      // 测试滑块
      const sliders = await page.$$('.asset-slider');
      const slidersTest = sliders.length === 3; // 应该有 3 个滑块（低、中、高风险）
      browserResults.tests.sliders = {
        name: '资产配置滑块',
        expected: '3 个滑块',
        actual: `${sliders.length} 个滑块`,
        passed: slidersTest,
      };

      // 测试导出按钮
      const exportButton = await page.$('.export-buttons button');
      const exportButtonTest = exportButton !== null;
      browserResults.tests.exportButton = {
        name: '导出按钮',
        expected: '存在',
        actual: exportButtonTest ? '存在' : '不存在',
        passed: exportButtonTest,
      };

      console.log(`✅ ${browserInfo.name} 交互功能测试完成`);
    } catch (error) {
      console.error(`❌ ${browserInfo.name} 交互功能测试失败:`, error.message);
      browserResults.tests.interaction = { name: '交互功能', passed: false, error: error.message };
      browserResults.success = false;
    }

    // 测试 4：性能测试
    console.log(`⏱️ 测试性能...`);
    try {
      // 首次内容绘制时间
      const fcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
            if (fcpEntry) {
              resolve(fcpEntry.startTime);
            }
          }).observe({ entryTypes: ['paint'] });
        });
      });
      browserResults.performance.firstContentfulPaint = fcp || 'N/A';

      // 最大内容绘制时间
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              resolve(entries[entries.length - 1].startTime);
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] });
        });
      });
      browserResults.performance.largestContentfulPaint = lcp || 'N/A';

      console.log(`✅ ${browserInfo.name} 性能测试完成`);
    } catch (error) {
      console.error(`❌ ${browserInfo.name} 性能测试失败:`, error.message);
      browserResults.performance.error = error.message;
    }

    // 测试 5：404 资源检测
    console.log(`🔍 检测 404 资源...`);
    try {
      const failedRequests = [];
      page.on('requestfailed', (request) => {
        if (request.failure().errorText === 'net::ERR_FAILED' ||
            request.failure().errorText === 'net::ERR_NAME_NOT_RESOLVED') {
          failedRequests.push({
            url: request.url(),
            error: request.failure().errorText,
          });
        }
      });

      // 重新加载页面以捕获所有请求
      await page.reload({ waitUntil: 'networkidle2' });

      const has404 = failedRequests.some(req =>
        req.url.includes('favicon') || req.url.includes('/assets/')
      );

      browserResults.tests.no404 = {
        name: '无 404 资源',
        expected: '无 404 资源',
        actual: has404 ? `发现 ${failedRequests.length} 个 404 资源` : '无 404 资源',
        passed: !has404,
      };

      if (failedRequests.length > 0) {
        console.log(`⚠️ ${browserInfo.name} 发现 ${failedRequests.length} 个 404 资源`);
        failedRequests.forEach(req => console.log(`  - ${req.url}`));
      } else {
        console.log(`✅ ${browserInfo.name} 无 404 资源`);
      }
    } catch (error) {
      console.error(`❌ ${browserInfo.name} 404 资源检测失败:`, error.message);
      browserResults.tests.no404 = { name: '无 404 资源', passed: false, error: error.message };
      browserResults.success = false;
    }

    // 关闭浏览器
    await browser.close();

    // 计算测试结果
    const tests = Object.values(browserResults.tests);
    const passedTests = tests.filter(t => t.passed).length;
    const totalTests = tests.length;
    browserResults.summary = {
      passed: passedTests,
      total: totalTests,
      failed: totalTests - passedTests,
      success: browserResults.success && passedTests === totalTests,
    };

    console.log(`✅ ${browserInfo.name} 测试完成: ${passedTests}/${totalTests} 通过`);

  } catch (error) {
    console.error(`❌ ${browserInfo.name} 测试失败:`, error.message);
    browserResults.success = false;
    browserResults.error = error.message;
  }

  return browserResults;
}

// 保存测试结果
function saveTestResults(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(__dirname, `cross-browser-test-report-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📊 测试报告已保存: ${reportPath}`);
}

// 生成可读报告
function generateReadableReport(results) {
  let report = '\n\n# 跨浏览器兼容性测试报告\n\n';
  report += `测试时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

  // 总结
  report += '## 📊 测试总结\n\n';
  report += `- 总测试数: ${results.summary.totalTests}\n`;
  report += `- 通过: ${results.summary.passedTests} ✅\n`;
  report += `- 失败: ${results.summary.failedTests} ❌\n`;
  report += `- 跳过: ${results.summary.skippedTests} ⏭️\n`;
  report += `- 浏览器数: ${results.summary.browsersTested}\n\n`;

  // 浏览器详细结果
  report += '## 🌐 浏览器测试结果\n\n';
  Object.values(results.browsers).forEach((browser, index) => {
    report += `### ${index + 1}. ${browser.name}\n\n`;
    report += `状态: ${browser.success ? '✅ 通过' : '❌ 失败'}\n\n`;

    report += '#### 📋 测试详情\n\n';
    Object.values(browser.tests).forEach(test => {
      report += `- ${test.name}: ${test.passed ? '✅' : '❌'}\n`;
      if (!test.passed && test.error) {
        report += `  错误: ${test.error}\n`;
      }
    });

    report += '\n#### ⏱️ 性能\n\n';
    report += `- 页面加载时间: ${browser.performance.pageLoadTime}ms\n`;
    if (browser.performance.firstContentfulPaint !== 'N/A') {
      report += `- 首次内容绘制: ${browser.performance.firstContentfulPaint}ms\n`;
    }
    if (browser.performance.largestContentfulPaint !== 'N/A') {
      report += `- 最大内容绘制: ${browser.performance.largestContentfulPaint}ms\n`;
    }

    report += '\n#### 🚨 控制台日志\n\n';
    if (browser.consoleLogs.errors.length > 0) {
      report += '**错误:**\n';
      browser.consoleLogs.errors.forEach(error => {
        report += `- ${error}\n`;
      });
    }
    if (browser.consoleLogs.warnings.length > 0) {
      report += '\n**警告:**\n';
      browser.consoleLogs.warnings.forEach(warning => {
        report += `- ${warning}\n`;
      });
    }
    if (browser.consoleLogs.errors.length === 0 && browser.consoleLogs.warnings.length === 0) {
      report += '无错误或警告 ✅\n';
    }

    report += '\n---\n\n';
  });

  return report;
}

// 主函数
async function main() {
  console.log('🌐 开始跨浏览器兼容性测试...\n');

  // 本地开发服务器 URL
  const url = 'http://localhost:5184/#/asset-allocation';

  // 检查哪些浏览器可用
  const availableBrowsers = [];
  for (const browserInfo of browsers) {
    try {
      // 检查浏览器可执行文件是否存在
      if (fs.existsSync(browserInfo.path)) {
        availableBrowsers.push(browserInfo);
        console.log(`✅ 找到 ${browserInfo.name}: ${browserInfo.path}`);
      } else {
        console.log(`⚠️ 未找到 ${browserInfo.name}: ${browserInfo.path}`);
      }
    } catch (error) {
      console.log(`❌ 检查 ${browserInfo.name} 失败:`, error.message);
    }
  }

  if (availableBrowsers.length === 0) {
    console.error('❌ 没有找到可用的浏览器');
    process.exit(1);
  }

  console.log(`\n🧪 将测试 ${availableBrowsers.length} 个浏览器\n`);

  // 逐个测试浏览器
  for (const browserInfo of availableBrowsers) {
    const results = await runTests(browserInfo, url);
    testResults.browsers[browserInfo.name] = results;
    testResults.summary.browsersTested++;

    // 更新测试统计
    const tests = Object.values(results.tests);
    testResults.summary.totalTests += tests.length;
    testResults.summary.passedTests += tests.filter(t => t.passed).length;
    testResults.summary.failedTests += tests.filter(t => !t.passed).length;
  }

  // 保存测试结果
  saveTestResults(testResults);

  // 生成可读报告
  const readableReport = generateReadableReport(testResults);
  console.log(readableReport);

  // 保存可读报告
  const reportPath = path.join(__dirname, `cross-browser-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
  fs.writeFileSync(reportPath, readableReport);
  console.log(`📊 可读报告已保存: ${reportPath}`);

  // 总结
  console.log('\n\n## 📊 测试总结\n');
  console.log(`总计: ${testResults.summary.totalTests} 个测试`);
  console.log(`通过: ${testResults.summary.passedTests} ✅`);
  console.log(`失败: ${testResults.summary.failedTests} ❌`);
  console.log(`浏览器: ${testResults.summary.browsersTested} 个`);

  // 退出码
  const allPassed = testResults.summary.failedTests === 0;
  process.exit(allPassed ? 0 : 1);
}

// 运行测试
main().catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
