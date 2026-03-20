#!/usr/bin/env node

/**
 * 番茄小说每周数据监控脚本
 * 
 * 功能：
 * 1. 每周自动抓取数据
 * 2. 对比上周数据
 * 3. 生成趋势报告
 * 4. 识别异常变化
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const USER_DATA_DIR = path.join(__dirname, '../data/chrome-user-data');
const DATA_DIR = path.join(__dirname, '../data');
const REPORTS_DIR = path.join(__dirname, '../番茄短篇故事集/monitoring');

// 确保监控目录存在
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// 解析阅读量
function parseReading(reads) {
  if (!reads) return 0;
  const match = reads.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// 解析字数
function parseWords(words) {
  if (!words) return 0;
  const match = words.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// 加载最新数据
function loadLatestData() {
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.startsWith('all-stories-') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (files.length === 0) return null;
  
  const filePath = path.join(DATA_DIR, files[0]);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  return {
    fileName: files[0],
    data: data,
    timestamp: files[0].match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/)[1]
  };
}

// 抓取新数据
async function fetchNewData() {
  console.log('📡 抓取最新数据...\n');
  
  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true });
  }

  const browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    channel: 'chrome',
    viewport: { width: 1920, height: 1080 },
  });

  const page = browser.pages()[0] || await browser.newPage();

  try {
    await page.goto('https://fanqienovel.com/main/writer/short-manage', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    const url = page.url();
    if (url.includes('login') || url.includes('passport')) {
      console.log('⚠️  需要登录！请手动登录...');
      await page.waitForURL('**/writer/short-manage**', { timeout: 600000 });
    }

    await page.waitForTimeout(3000);

    // 获取总页数
    const pageNumbers = await page.$$eval('.arco-pagination-item', items => {
      return items.map(item => parseInt(item.textContent.trim())).filter(num => !isNaN(num));
    });
    const totalPages = Math.max(...pageNumbers) || 1;

    const allStories = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (pageNum > 1) {
        await page.click(`.arco-pagination-item >> text="${pageNum}"`);
        await page.waitForTimeout(2000);
      }

      const stories = await page.evaluate(() => {
        const list = [];
        const html = document.documentElement.outerHTML;
        
        const extract = (regex) => {
          const results = [];
          let match;
          while ((match = regex.exec(html)) !== null) {
            results.push(match[1].trim());
          }
          return results;
        };

        const titles = extract(/class="article-item-title[^"]*"[^>]*>([^<]+)</g);
        const statuses = extract(/class="short-item-sign-tag"[^>]*>([^<]+)</g);
        const reads = extract(/class="article-item-read"[^>]*>([^<]+)</g);
        const words = extract(/class="article-item-number"[^>]*>([^<]+)</g);
        const times = extract(/class="article-item-time"[^>]*>([^<]+)</g);

        for (let i = 0; i < titles.length; i++) {
          list.push({
            title: titles[i] || '未知',
            status: statuses[i] || '未知',
            reads: reads[i] || '0',
            words: words[i] || '0',
            time: times[i] || '未知',
          });
        }

        return list;
      });

      stories.forEach(s => s.page = pageNum);
      allStories.push(...stories);
    }

    await browser.close();
    return allStories;

  } catch (error) {
    await browser.close();
    throw error;
  }
}

// 生成监控报告
function generateReport(oldData, newData) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  // 统计分析
  const oldStats = {
    total: oldData.length,
    zeroReading: oldData.filter(s => parseReading(s.reads) === 0).length,
    lowReading: oldData.filter(s => parseReading(s.reads) >= 1 && parseReading(s.reads) <= 3).length,
    mediumReading: oldData.filter(s => parseReading(s.reads) >= 4 && parseReading(s.reads) <= 10).length,
    highReading: oldData.filter(s => parseReading(s.reads) > 10).length,
    totalReadings: oldData.reduce((sum, s) => sum + parseReading(s.reads), 0)
  };

  const newStats = {
    total: newData.length,
    zeroReading: newData.filter(s => parseReading(s.reads) === 0).length,
    lowReading: newData.filter(s => parseReading(s.reads) >= 1 && parseReading(s.reads) <= 3).length,
    mediumReading: newData.filter(s => parseReading(s.reads) >= 4 && parseReading(s.reads) <= 10).length,
    highReading: newData.filter(s => parseReading(s.reads) > 10).length,
    totalReadings: newData.reduce((sum, s) => sum + parseReading(s.reads), 0)
  };

  // 对比变化
  const changes = {
    zeroReading: newStats.zeroReading - oldStats.zeroReading,
    lowReading: newStats.lowReading - oldStats.lowReading,
    mediumReading: newStats.mediumReading - oldStats.mediumReading,
    highReading: newStats.highReading - oldStats.highReading,
    totalReadings: newStats.totalReadings - oldStats.totalReadings
  };

  // 识别异常变化
  const alerts = [];
  
  // 检查新增0阅读作品
  const newZeroReading = newData.filter(s => {
    const old = oldData.find(o => o.title === s.title);
    return parseReading(s.reads) === 0 && (!old || parseReading(old.reads) > 0);
  });
  
  if (newZeroReading.length > 0) {
    alerts.push(`⚠️ 新增 ${newZeroReading.length} 个0阅读作品：${newZeroReading.map(s => s.title).join('、')}`);
  }

  // 检查阅读量大幅下降
  const dropped = newData.filter(s => {
    const old = oldData.find(o => o.title === s.title);
    if (!old) return false;
    const oldReading = parseReading(old.reads);
    const newReading = parseReading(s.reads);
    return oldReading > 5 && newReading < oldReading * 0.5;
  });

  if (dropped.length > 0) {
    alerts.push(`⚠️ ${dropped.length} 个作品阅读量大幅下降：${dropped.map(s => s.title).join('、')}`);
  }

  // 生成 Markdown 报告
  const report = `# 番茄小说数据监控报告

**监控时间**：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
**对比周期**：${oldData.timestamp || '上次数据'} → 本次

---

## 📊 总体概况

| 指标 | 上次 | 本次 | 变化 |
|------|------|------|------|
| 总故事数 | ${oldStats.total} | ${newStats.total} | ${newStats.total - oldStats.total > 0 ? '+' : ''}${newStats.total - oldStats.total} |
| 0阅读作品 | ${oldStats.zeroReading} | ${newStats.zeroReading} | ${changes.zeroReading > 0 ? '+' : ''}${changes.zeroReading} |
| 1-3阅读作品 | ${oldStats.lowReading} | ${newStats.lowReading} | ${changes.lowReading > 0 ? '+' : ''}${changes.lowReading} |
| 4-10阅读作品 | ${oldStats.mediumReading} | ${newStats.mediumReading} | ${changes.mediumReading > 0 ? '+' : ''}${changes.mediumReading} |
| >10阅读作品 | ${oldStats.highReading} | ${newStats.highReading} | ${changes.highReading > 0 ? '+' : ''}${changes.highReading} |
| **总阅读量** | **${oldStats.totalReadings}** | **${newStats.totalReadings}** | **${changes.totalReadings > 0 ? '+' : ''}${changes.totalReadings}** |

---

## 🚨 异常提醒

${alerts.length > 0 ? alerts.join('\n\n') : '✅ 无异常情况'}

---

## 📈 Top 5 高阅读作品

${newData
  .map(s => ({ ...s, reading: parseReading(s.reads) }))
  .sort((a, b) => b.reading - a.reading)
  .slice(0, 5)
  .map((s, i) => `${i + 1}. **${s.title}** - ${s.reading}阅读 (${s.words})`)
  .join('\n')}

---

## ⚠️ 0阅读作品列表

${newData
  .filter(s => parseReading(s.reads) === 0)
  .map((s, i) => `${i + 1}. **${s.title}** (${s.words})`)
  .join('\n') || '✅ 无0阅读作品'}

---

## 💡 建议

${changes.totalReadings > 0 ? 
  `✅ 总阅读量上升 ${changes.totalReadings} 次，继续保持！` :
  `⚠️ 总阅读量下降 ${Math.abs(changes.totalReadings)} 次，需要关注。`
}

${changes.zeroReading < 0 ? 
  `✅ 0阅读作品减少 ${Math.abs(changes.zeroReading)} 个，优化效果显著！` :
  changes.zeroReading > 0 ? 
  `⚠️ 0阅读作品增加 ${changes.zeroReading} 个，需要优化。` :
  `➖ 0阅读作品数量保持不变。`
}

---

**报告生成时间**：${timestamp}
**监控脚本**：scripts/fanqie-weekly-monitor.js
`;

  return { report, timestamp, newStats, changes };
}

// 主函数
async function main() {
  console.log('📊 番茄小说每周数据监控\n');
  console.log('========================================\n');

  // 加载旧数据
  const oldData = loadLatestData();
  if (oldData) {
    console.log(`✅ 已加载上次数据：${oldData.fileName}`);
    console.log(`   时间：${oldData.timestamp}\n`);
  } else {
    console.log('⚠️  未找到上次数据，这将是第一次监控\n');
  }

  // 抓取新数据
  const newData = await fetchNewData();
  console.log(`\n✅ 抓取完成：${newData.length} 个故事\n`);

  // 保存新数据
  const newTimestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const newDataFile = path.join(DATA_DIR, `all-stories-${newTimestamp}.json`);
  fs.writeFileSync(newDataFile, JSON.stringify(newData, null, 2), 'utf8');
  console.log(`💾 数据已保存：all-stories-${newTimestamp}.json\n`);

  // 生成报告
  if (oldData) {
    const { report, timestamp, newStats, changes } = generateReport(oldData.data, newData);
    
    const reportFile = path.join(REPORTS_DIR, `weekly-report-${timestamp}.md`);
    fs.writeFileSync(reportFile, report, 'utf8');
    console.log(`📄 报告已生成：weekly-report-${timestamp}.md\n`);

    // 输出摘要
    console.log('========================================');
    console.log('📊 监控摘要\n');
    console.log(`总阅读量：${newStats.totalReadings} (${changes.totalReadings > 0 ? '+' : ''}${changes.totalReadings})`);
    console.log(`0阅读作品：${newStats.zeroReading} (${changes.zeroReading > 0 ? '+' : ''}${changes.zeroReading})`);
    console.log(`1-3阅读作品：${newStats.lowReading} (${changes.lowReading > 0 ? '+' : ''}${changes.lowReading})`);
    console.log(`4-10阅读作品：${newStats.mediumReading} (${changes.mediumReading > 0 ? '+' : ''}${changes.mediumReading})`);
    console.log(`>10阅读作品：${newStats.highReading} (${changes.highReading > 0 ? '+' : ''}${changes.highReading})`);
    console.log('\n========================================');
  } else {
    console.log('✅ 第一次监控完成，下次将生成对比报告\n');
  }
}

main().catch(console.error);
