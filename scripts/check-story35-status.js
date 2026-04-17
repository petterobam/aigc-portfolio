#!/usr/bin/env node

/**
 * 检查 35号故事发布状态和初始数据
 *
 * 目的：验证 35号故事是否成功发布，收集初始数据（发布约 5.5 小时）
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  cookieFile: path.join(__dirname, '..', 'cookies', 'latest.json'),
  storyManageUrl: 'https://fanqienovel.com/main/writer/short-manage',
  outputDir: path.join(__dirname, '..', 'data')
};

function log(message, color = '\x1b[0m') {
  console.log(`${color}${message}\x1b[0m`);
}

function loadCookies() {
  const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));
  console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);
  return cookies;
}

async function checkStory35Status() {
  console.log('🚀 启动 35号故事发布状态检查...\n');

  let browser = null;

  try {
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    console.log('📍 启动浏览器...');
    browser = await chromium.launch({
      headless: false,
      slowMo: 200
    });

    const page = await browser.newPage();
    await page.context().addCookies(loadCookies());

    console.log('📍 访问短故事管理页面...');
    await page.goto(CONFIG.storyManageUrl, { waitUntil: 'commit', timeout: 60000 });
    await page.waitForTimeout(8000);

    console.log('📊 检查结果：\n');

    // 查找 35号故事
    const storyData = await page.evaluate(() => {
      // 查找所有文本内容，查找包含"穿成太子妃"的内容
      const allText = document.body.innerText;

      // 查找包含"穿成太子妃"的文本行
      const lines = allText.split('\n');
      const matchedLines = [];

      lines.forEach(line => {
        if (line.includes('穿成太子妃') || line.includes('太子妃')) {
          matchedLines.push(line.trim());
        }
      });

      return {
        allTextPreview: allText.substring(0, 1000),
        matchedLines
      };
    });

    if (storyData.matchedLines.length === 0) {
      log('❌ 未找到 35号故事，可能发布失败', '\x1b[31m');
      console.log('\n页面内容预览（前1000字）：\n');
      console.log(storyData.allTextPreview);
    } else {
      log('✅ 找到 35号故事', '\x1b[32m');
      console.log('─'.repeat(80));

      storyData.matchedLines.forEach((line, i) => {
        console.log(`\n匹配行 ${i + 1}:`);
        console.log(`  ${line}`);
      });

      // 尝试提取阅读量
      const match = storyData.allTextPreview.match(/穿成太子妃[^0-9]*(\d+)阅读/);
      if (match) {
        const readCount = parseInt(match[1]);
        console.log('\n' + '─'.repeat(80));
        console.log('\n📊 数据分析：\n');
        console.log(`阅读量: ${readCount}`);

        // 对比预期阅读量（20-35阅读）
        console.log(`预期阅读量: 20-35阅读`);
        if (readCount >= 20) {
          log('✅ 达到预期下限', '\x1b[32m');
        } else {
          log('⚠️  未达到预期下限，需要继续观察', '\x1b[33m');
        }
      }
    }

    // 截图
    const screenshotFile = path.join(CONFIG.outputDir, `story35-status-${Date.now()}.png`);
    try {
      await page.screenshot({ path: screenshotFile, fullPage: true, timeout: 10000 });
      log(`\n📸 截图已保存: ${screenshotFile}`, '\x1b[36m');
    } catch (error) {
      log(`\n⚠️  截图失败: ${error.message}`, '\x1b[33m');
    }

    // 保存检查结果
    const result = {
      timestamp: new Date().toISOString(),
      storyId: '35',
      found: storyData.length > 0,
      storyData,
      status: storyData.length > 0 ? 'published' : 'not_found'
    };

    const resultFile = path.join(CONFIG.outputDir, `story35-status-${Date.now()}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2), 'utf8');
    log(`📄 检查结果已保存: ${resultFile}`, '\x1b[36m');

    console.log('\n✅ 检查完成！');

  } catch (error) {
    console.error('\n❌ 检查失败:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n📍 浏览器已关闭');
    }
  }
}

function calculateHoursSincePublish(dateString) {
  try {
    const publishDate = new Date(dateString);
    const now = new Date();
    const diffMs = now - publishDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return diffHours;
  } catch (error) {
    return 0;
  }
}

checkStory35Status()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ 检查异常:', error);
    process.exit(1);
  });
