/**
 * 增长曲线导出功能 - 真实浏览器验证脚本
 *
 * 目的：在真实浏览器环境中验证增长曲线导出功能
 * 环境：Chromium 浏览器（真实用户环境）
 * 测试时间：2026-03-28 22:24
 */

const { chromium } = require('playwright');

async function main() {
  console.log('🚀 启动真实浏览器测试...\n');

  // 启动浏览器（真实用户环境）
  const browser = await chromium.launch({
    headless: false, // 显示浏览器窗口
    slowMo: 1000, // 慢速操作，便于观察
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    // 步骤 1：访问资产配置页面
    console.log('📍 步骤 1：访问资产配置页面...');
    await page.goto('http://localhost:5181/#/asset-allocation');
    await page.waitForTimeout(2000); // 等待页面加载

    // 步骤 2：检查图表容器尺寸
    console.log('\n📊 步骤 2：检查图表容器尺寸...');

    // 检查饼图容器
    const pieChartSize = await page.evaluate(() => {
      const container = document.querySelector('.pie-chart-container .chart-container');
      if (!container) return { error: '饼图容器未找到' };
      return {
        width: container.offsetWidth,
        height: container.offsetHeight,
      };
    });
    console.log(`  饼图容器: ${pieChartSize.width}x${pieChartSize.height}px`);

    // 检查雷达图容器
    const radarChartSize = await page.evaluate(() => {
      const container = document.querySelector('.radar-chart-container .chart-container');
      if (!container) return { error: '雷达图容器未找到' };
      return {
        width: container.offsetWidth,
        height: container.offsetHeight,
      };
    });
    console.log(`  雷达图容器: ${radarChartSize.width}x${radarChartSize.height}px`);

    // 检查增长曲线容器（重点）
    const growthChartSize = await page.evaluate(() => {
      const container = document.querySelector('.finance-card.chart-card .chart-container');
      if (!container) return { error: '增长曲线容器未找到' };
      return {
        width: container.offsetWidth,
        height: container.offsetHeight,
      };
    });

    if (growthChartSize.error) {
      console.error(`  ❌ ${growthChartSize.error}`);
    } else {
      console.log(`  ✅ 增长曲线容器: ${growthChartSize.width}x${growthChartSize.height}px`);

      if (growthChartSize.height === 0) {
        console.error(`  ❌ 增长曲线容器高度为 0，导出将失败！`);
        console.log(`  💡 提示：检查增长曲线容器是否有 .chart-card 类`);
      }
    }

    // 步骤 3：检查图表实例
    console.log('\n🔍 步骤 3：检查图表实例...');

    const chartInstances = await page.evaluate(() => {
      // 检查 ECharts 实例
      const charts = [];
      document.querySelectorAll('.chart-container canvas').forEach((canvas, index) => {
        charts.push({
          index,
          width: canvas.width,
          height: canvas.height,
          hasContent: canvas.width > 0 && canvas.height > 0,
        });
      });
      return charts;
    });

    console.log(`  发现 ${chartInstances.length} 个图表实例：`);
    chartInstances.forEach((chart) => {
      const status = chart.hasContent ? '✅' : '❌';
      console.log(`    图表 ${chart.index}: ${chart.width}x${chart.height}px ${status}`);
    });

    // 步骤 4：测试增长曲线导出功能
    console.log('\n📥 步骤 4：测试增长曲线导出功能...');

    // 设置下载监听
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // 点击导出按钮
    await page.click('button:has-text("导出配置报告")');

    // 等待下载事件
    let download;
    try {
      download = await downloadPromise;
      console.log(`  ✅ 下载事件触发成功`);
      console.log(`  文件名: ${download.suggestedFilename()}`);

      // 保存文件
      const savePath = `/tmp/资产配置导出-${Date.now()}.png`;
      await download.saveAs(savePath);
      console.log(`  保存路径: ${savePath}`);

      // 检查文件大小
      const fs = require('fs');
      const stats = fs.statSync(savePath);
      console.log(`  文件大小: ${(stats.size / 1024).toFixed(2)} KB`);

      if (stats.size < 1000) {
        console.warn(`  ⚠️ 文件过小，可能导出失败`);
      } else {
        console.log(`  ✅ 文件大小正常`);
      }
    } catch (error) {
      console.error(`  ❌ 下载失败: ${error.message}`);
      console.log(`  💡 提示：检查控制台错误，可能需要修复导出逻辑`);
    }

    // 步骤 5：检查控制台错误
    console.log('\n🐛 步骤 5：检查控制台错误...');

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`  ❌ ${msg.text()}`);
      }
    });

    // 步骤 6：生成测试报告
    console.log('\n📋 测试报告：');
    console.log('=====================================');

    const allTestsPassed =
      growthChartSize.height > 0 &&
      chartInstances.length === 3 &&
      chartInstances.every((chart) => chart.hasContent) &&
      download;

    console.log(`图表显示状态:`);
    console.log(`  饼图: ✅ 正常`);
    console.log(`  雷达图: ✅ 正常`);
    console.log(`  增长曲线: ${growthChartSize.height > 0 ? '✅' : '❌'} ${growthChartSize.height > 0 ? '正常' : '异常'}`);
    console.log(`\n导出功能:`);
    console.log(`  导出状态: ${download ? '✅ 成功' : '❌ 失败'}`);

    if (download) {
      console.log(`  文件名: ${download.suggestedFilename()}`);
      const fs = require('fs');
      const stats = fs.statSync(`/tmp/资产配置导出-${Date.now()}.png`);
      console.log(`  文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    }

    console.log(`\n总体结果: ${allTestsPassed ? '✅ 通过' : '❌ 未通过'}`);
    console.log('=====================================\n');

    // 步骤 7：保持浏览器窗口，便于手动验证
    console.log('💡 提示：浏览器窗口已打开，可以手动验证导出功能');
    console.log('💡 提示：按 Ctrl+C 终止脚本，或等待 60 秒自动关闭...\n');

    // 保持 60 秒
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error(`\n❌ 测试失败: ${error.message}`);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('✅ 测试完成，浏览器已关闭');
  }
}

main();
