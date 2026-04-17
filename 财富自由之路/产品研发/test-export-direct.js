/**
 * 直接测试导出功能的脚本
 * 在浏览器控制台中执行
 */

// 打开浏览器控制台，然后粘贴以下代码：

async function testExport() {
  console.log('🚀 开始测试导出功能...');

  // 步骤 1：检查图表实例
  console.log('\n📊 步骤 1：检查图表实例...');

  const pieChart = window.__vue_app__?._context?.provides?.pieChartInstance;
  const radarChart = window.__vue_app__?._context?.provides?.radarChartInstance;
  const growthChart = window.__vue_app__?._context?.provides?.growthChartInstance;

  console.log('饼图实例:', pieChart ? '✅ 存在' : '❌ 不存在');
  console.log('雷达图实例:', radarChart ? '✅ 存在' : '❌ 不存在');
  console.log('增长曲线实例:', growthChart ? '✅ 存在' : '❌ 不存在');

  // 步骤 2：测试单个图表导出
  console.log('\n📥 步骤 2：测试单个图表导出...');

  try {
    if (pieChart) {
      const dataURL = pieChart.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
      console.log('饼图数据 URL 长度:', dataURL.length);

      // 尝试下载
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = '测试-饼图.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ 饼图导出成功');
    }
  } catch (error) {
    console.error('❌ 饼图导出失败:', error);
  }

  try {
    if (radarChart) {
      const dataURL = radarChart.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
      console.log('雷达图数据 URL 长度:', dataURL.length);

      // 尝试下载
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = '测试-雷达图.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ 雷达图导出成功');
    }
  } catch (error) {
    console.error('❌ 雷达图导出失败:', error);
  }

  try {
    if (growthChart) {
      const dataURL = growthChart.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
      console.log('增长曲线数据 URL 长度:', dataURL.length);

      // 尝试下载
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = '测试-增长曲线.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ 增长曲线导出成功');
    }
  } catch (error) {
    console.error('❌ 增长曲线导出失败:', error);
  }

  console.log('\n✅ 测试完成');
}

// 执行测试
testExport();
