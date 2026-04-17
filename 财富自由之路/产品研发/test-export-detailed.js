/**
 * 资产配置导出功能 - 详细测试脚本
 * 在浏览器环境中直接调用导出函数
 */

const { chromium } = require('playwright');

async function main() {
  console.log('🚀 启动详细测试...\n');

  // 启动浏览器
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  // 捕获控制台输出
  const consoleMessages = [];
  page.on('console', (msg) => {
    const text = msg.text();
    consoleMessages.push(text);
    console.log(`[控制台] ${text}`);
  });

  try {
    // 步骤 1：访问页面
    console.log('📍 步骤 1：访问资产配置页面...');
    await page.goto('http://localhost:5181/#/asset-allocation');
    await page.waitForTimeout(3000);

    // 步骤 2：检查图表状态
    console.log('\n📊 步骤 2：检查图表状态...');

    const chartStatus = await page.evaluate(() => {
      const results = {};

      // 检查图表容器
      const containers = document.querySelectorAll('.chart-container');
      results.containerCount = containers.length;

      // 检查 Canvas 元素
      const canvases = document.querySelectorAll('.chart-container canvas');
      results.canvasCount = canvases.length;

      // 检查每个 Canvas 的尺寸
      results.canvasSizes = [];
      canvases.forEach((canvas, index) => {
        results.canvasSizes.push({
          index,
          width: canvas.width,
          height: canvas.height,
          valid: canvas.width > 0 && canvas.height > 0
        });
      });

      return results;
    });

    console.log(`  图表容器数量: ${chartStatus.containerCount}`);
    console.log(`  Canvas 数量: ${chartStatus.canvasCount}`);
    console.log(`  Canvas 尺寸:`);
    chartStatus.canvasSizes.forEach((canvas) => {
      const status = canvas.valid ? '✅' : '❌';
      console.log(`    Canvas ${canvas.index}: ${canvas.width}x${canvas.height}px ${status}`);
    });

    // 步骤 3：通过浏览器控制台调用导出函数
    console.log('\n📥 步骤 3：通过浏览器控制台调用导出函数...');

    const exportResult = await page.evaluate(async () => {
      // 查找 Vue 组件实例
      const vueApp = document.querySelector('#app').__vueParentComponent?.appContext;
      if (!vueApp) {
        return { error: 'Vue 应用未找到' };
      }

      // 查找导出函数
      // 注意：这里需要根据实际的组件结构来访问
      return {
        status: 'ok',
        message: 'Vue 应用已找到（需要进一步定位导出函数）'
      };
    });

    console.log(`  导出函数查找: ${exportResult.status}`);

    // 步骤 4：模拟点击导出按钮
    console.log('\n🖱️  步骤 4：模拟点击导出按钮...');

    // 查找导出按钮
    const exportButton = await page.$('button:has-text("导出配置报告")');
    if (!exportButton) {
      console.error('  ❌ 导出按钮未找到');
    } else {
      console.log('  ✅ 导出按钮已找到');

      // 点击导出按钮
      await exportButton.click();
      console.log('  ✅ 导出按钮已点击');

      // 等待一段时间，让导出函数执行
      await page.waitForTimeout(3000);
    }

    // 步骤 5：检查下载的文件
    console.log('\n📋 步骤 5：检查下载的文件...');

    const fs = require('fs');
    const downloadDir = '/tmp';

    try {
      const files = fs.readdirSync(downloadDir);
      const imageFiles = files.filter(file => 
        file.includes('资产配置') || file.includes('饼图') || file.includes('雷达图') || file.includes('增长曲线')
      );

      if (imageFiles.length > 0) {
        console.log(`  ✅ 找到 ${imageFiles.length} 个导出的图片文件:`);
        imageFiles.forEach(file => {
          const filePath = `${downloadDir}/${file}`;
          const stats = fs.statSync(filePath);
          console.log(`    - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
        });
      } else {
        console.log(`  ❌ 未找到导出的图片文件`);
        console.log(`  💡 提示：检查是否下载到其他目录`);
      }
    } catch (error) {
      console.error(`  ❌ 检查下载文件失败: ${error.message}`);
    }

    // 步骤 6：分析控制台输出
    console.log('\n🐛 步骤 6：分析控制台输出...');

    const errorMessages = consoleMessages.filter(msg => 
      msg.toLowerCase().includes('error') || 
      msg.toLowerCase().includes('failed') ||
      msg.toLowerCase().includes('异常')
    );

    if (errorMessages.length > 0) {
      console.log(`  发现 ${errorMessages.length} 个错误消息:`);
      errorMessages.forEach((msg, index) => {
        console.log(`    ${index + 1}. ${msg}`);
      });
    } else {
      console.log(`  ✅ 未发现错误消息`);
    }

    // 步骤 7：保持浏览器窗口，便于手动验证
    console.log('\n💡 提示：浏览器窗口已打开，可以手动验证导出功能');
    console.log('💡 提示：按 Ctrl+C 终止脚本，或等待 60 秒自动关闭...\n');

    // 保持 60 秒
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error(`\n❌ 测试失败: ${error.message}`);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('\n✅ 测试完成，浏览器已关闭');
  }
}

main();
