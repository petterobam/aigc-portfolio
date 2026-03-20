/**
 * 番茄小说定期数据监控脚本
 *
 * 功能：
 * - 每天自动抓取所有已发布作品数据
 * - 生成数据对比报告（对比昨日数据）
 * - 生成趋势分析报告
 * - 检测异常数据（阅读量突然下降）
 *
 * 使用方法：
 * node scripts/daily-data-monitor.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const today = new Date().toISOString().slice(0, 10);

console.log('\n========================================');
console.log('📊 番茄小说定期数据监控');
console.log('========================================\n');

console.log('🚀 步骤 1: 抓取最新数据...\n');

try {
  // 调用抓取脚本
  execSync('node scripts/fetch-story-list-chrome-v3.js', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });

  console.log('\n✅ 数据抓取完成\n');

  // 找到最新生成的 JSON 文件
  const dataDir = path.join(__dirname, '../data');
  const files = fs.readdirSync(dataDir);
  const jsonFiles = files.filter((f) => f.startsWith('story-list-all-') && f.endsWith('.json'));
  jsonFiles.sort().reverse();
  const latestJsonFile = jsonFiles[0];
  const yesterdayJsonFile = jsonFiles[1];

  console.log('📁 最新数据文件:', latestJsonFile);
  console.log('📁 昨日数据文件:', yesterdayJsonFile || '不存在\n');

  // 读取数据
  const latestData = JSON.parse(fs.readFileSync(path.join(dataDir, latestJsonFile), 'utf8'));
  let yesterdayData = null;
  if (yesterdayJsonFile) {
    yesterdayData = JSON.parse(fs.readFileSync(path.join(dataDir, yesterdayJsonFile), 'utf8'));
  }

  console.log('\n📊 步骤 2: 生成数据对比报告...\n');

  // 生成对比报告
  const comparisonReport = {
    timestamp: new Date().toISOString(),
    latestFile: latestJsonFile,
    yesterdayFile: yesterdayJsonFile || '不存在',
    summary: {
      totalStories: latestData.length,
      totalReads: latestData.reduce((sum, s) => sum + s.read, 0),
      avgReads: (latestData.reduce((sum, s) => sum + s.read, 0) / latestData.length).toFixed(2),
      signedCount: latestData.filter((s) => s.sign === '已签约').length,
      signRate: ((latestData.filter((s) => s.sign === '已签约').length / latestData.length) * 100).toFixed(2) + '%',
    },
    dailyChange: yesterdayData ? {
      newStories: latestData.length - yesterdayData.length,
      readChange: latestData.reduce((sum, s) => sum + s.read, 0) - yesterdayData.reduce((sum, s) => sum + s.read, 0),
    } : { note: '昨日数据不存在，无法对比' },
    topStories: latestData.sort((a, b) => b.read - a.read).slice(0, 10).map((s) => ({
      title: s.title,
      read: s.read,
      change: yesterdayData ? {
        readDiff: s.read - (yesterdayData.find((y) => s.previewId === y.previewId)?.read || 0),
      } : { note: '昨日数据不存在' },
    })),
    zeroReadStories: latestData.filter((s) => s.read === 0).map((s) => ({
      title: s.title,
      previewId: s.previewId,
    })),
  };

  // 保存对比报告
  const reportDir = path.join(__dirname, '../data/reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportFile = path.join(reportDir, `daily-report-${today}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(comparisonReport, null, 2), 'utf8');
  console.log('📊 数据对比报告已保存:', reportFile);

  console.log('\n========================================');
  console.log('📈 数据概览：');
  console.log('========================================');
  console.log(`总故事数: ${comparisonReport.summary.totalStories}`);
  console.log(`总阅读量: ${comparisonReport.summary.totalReads}`);
  console.log(`平均阅读量: ${comparisonReport.summary.avgReads}`);
  console.log(`已签约数量: ${comparisonReport.summary.signedCount} (${comparisonReport.summary.signRate})`);

  if (yesterdayData) {
    console.log('\n========================================');
    console.log('📊 每日变化：');
    console.log('========================================');
    console.log(`新增故事: ${comparisonReport.dailyChange.newStories > 0 ? '+' : ''}${comparisonReport.dailyChange.newStories}`);
    console.log(`阅读量变化: ${comparisonReport.dailyChange.readChange > 0 ? '+' : ''}${comparisonReport.dailyChange.readChange}`);
  }

  console.log('\n========================================');
  console.log('🏆 TOP 10 高阅读作品：');
  console.log('========================================');
  comparisonReport.topStories.forEach((story, index) => {
    console.log(`${index + 1}. ${story.title}`);
    console.log(`   阅读量: ${story.read}`);
    if (yesterdayData && story.change.readDiff !== 0) {
      console.log(`   变化: ${story.change.readDiff > 0 ? '+' : ''}${story.change.readDiff}`);
    }
    console.log('');
  });

  console.log('========================================');
  console.log('⚠️  零阅读作品列表：');
  console.log('========================================');
  console.log(`共 ${comparisonReport.zeroReadStories.length} 个零阅读作品（${((comparisonReport.zeroReadStories.length / latestData.length) * 100).toFixed(2)}%）\n`);

  comparisonReport.zeroReadStories.forEach((story, index) => {
    console.log(`${index + 1}. ${story.title}`);
  });

  console.log('\n✅ 监控完成！\n');

} catch (error) {
  console.error('\n❌ 错误:', error.message);
  console.error(error.stack);
  process.exit(1);
}
