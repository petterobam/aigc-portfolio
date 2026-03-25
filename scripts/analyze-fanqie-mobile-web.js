#!/usr/bin/env node

/**
 * 番茄小说移动端网页版分析脚本
 * 分析番茄小说移动端网页版是否支持发布功能
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Cookie 文件路径
const cookiePath = path.join(__dirname, '../cookies/latest.json');

/**
 * 加载最新的 Cookie
 */
function loadLatestCookies() {
  try {
    const cookieData = fs.readFileSync(cookiePath, 'utf8');
    const cookies = JSON.parse(cookieData);
    console.log(`✅ 成功加载 ${cookies.length} 个 Cookie`);
    return cookies;
  } catch (error) {
    console.error('❌ 加载 Cookie 失败:', error.message);
    return null;
  }
}

/**
 * 分析番茄小说移动端网页版
 */
async function analyzeFanqieMobileWeb() {
  let browser = null;

  try {
    console.log('\n========================================');
    console.log('番茄小说移动端网页版分析');
    console.log('========================================\n');

    // 启动浏览器
    console.log('🚀 启动浏览器...');
    browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 375, height: 812 }, // iPhone X 尺寸
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
    });

    // 加载 Cookie
    const cookies = loadLatestCookies();
    if (cookies) {
      await context.addCookies(cookies);
      console.log('✅ Cookie 加载成功\n');
    }

    const page = await context.newPage();

    // 测试 URL 列表
    const testUrls = [
      {
        name: '移动端首页',
        url: 'https://fanqienovel.com/',
        description: '测试移动端首页是否可访问'
      },
      {
        name: '移动端作家后台',
        url: 'https://novelfm.com/author/center',
        description: '测试移动端作家后台是否可访问'
      },
      {
        name: '移动端发布页',
        url: 'https://novelfm.com/author/center/publish',
        description: '测试移动端是否有发布功能'
      },
      {
        name: 'PC 端作家后台',
        url: 'https://fanqienovel.com/page/author',
        description: '测试 PC 端作家后台（对比）'
      }
    ];

    const results = [];

    for (const testUrl of testUrls) {
      console.log(`\n--- 测试: ${testUrl.name} ---`);
      console.log(`URL: ${testUrl.url}`);
      console.log(`描述: ${testUrl.description}`);

      try {
        await page.goto(testUrl.url, { waitUntil: 'networkidle', timeout: 10000 });

        // 等待页面加载
        await page.waitForTimeout(2000);

        // 获取页面标题
        const title = await page.title();
        console.log(`✅ 页面标题: ${title}`);

        // 检查是否有发布相关的元素
        const publishElements = await page.$$eval('[class*="publish"], [class*="发布"], [class*="添加"], button:has-text("发布"), button:has-text("添加作品")',
          elements => elements.map(el => ({
            text: el.textContent,
            class: el.className
          }))
        );

        if (publishElements.length > 0) {
          console.log(`✅ 发现 ${publishElements.length} 个发布相关元素:`);
          publishElements.forEach(el => {
            console.log(`   - 文本: ${el.text}, Class: ${el.class}`);
          });
        } else {
          console.log('⚠️  未发现发布相关元素');
        }

        // 检查页面是否有明显的发布按钮
        const hasPublishButton = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a'));
          return buttons.some(btn => {
            const text = btn.textContent || '';
            return text.includes('发布') || text.includes('添加作品') || text.includes('新建');
          });
        });

        console.log(hasPublishButton ? '✅ 页面包含发布按钮' : '❌ 页面不包含发布按钮');

        // 截图
        const screenshotPath = path.join(__dirname, '../logs/screenshots', `${testUrl.name.replace(/\s+/g, '-')}-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 截图已保存: ${screenshotPath}`);

        results.push({
          url: testUrl.url,
          name: testUrl.name,
          accessible: true,
          title: title,
          hasPublishButton: hasPublishButton,
          publishElements: publishElements.length
        });

      } catch (error) {
        console.error(`❌ 访问失败:`, error.message);
        results.push({
          url: testUrl.url,
          name: testUrl.name,
          accessible: false,
          error: error.message
        });
      }
    }

    // 输出总结
    console.log('\n========================================');
    console.log('分析总结');
    console.log('========================================\n');

    results.forEach(result => {
      console.log(`\n${result.name}:`);
      console.log(`  - URL: ${result.url}`);
      console.log(`  - 可访问: ${result.accessible ? '✅' : '❌'}`);
      if (result.accessible) {
        console.log(`  - 页面标题: ${result.title}`);
        console.log(`  - 发布按钮: ${result.hasPublishButton ? '✅' : '❌'}`);
        if (result.publishElements !== undefined) {
          console.log(`  - 发布元素: ${result.publishElements} 个`);
        }
      }
    });

    // 生成分析报告
    const reportPath = path.join(__dirname, '../reports', `fanqie-mobile-web-analysis-${Date.now()}.md`);
    fs.writeFileSync(reportPath, generateReport(results));
    console.log(`\n📄 分析报告已保存: ${reportPath}`);

  } catch (error) {
    console.error('\n❌ 分析失败:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log('\n✅ 浏览器已关闭');
  }
}

/**
 * 生成分析报告
 */
function generateReport(results) {
  let report = `# 番茄小说移动端网页版分析报告

**分析时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
**分析工具**: Playwright (Chromium)
**User Agent**: iPhone X (移动端)

---

## 测试结果

`;

  results.forEach(result => {
    report += `### ${result.name}

**URL**: ${result.url}
**可访问**: ${result.accessible ? '✅' : '❌'}
`;

    if (result.accessible) {
      report += `**页面标题**: ${result.title}\n`;
      report += `**发布按钮**: ${result.hasPublishButton ? '✅' : '❌'}\n`;
      if (result.publishElements !== undefined) {
        report += `**发布元素**: ${result.publishElements} 个\n`;
      }
    } else {
      report += `**错误**: ${result.error}\n`;
    }

    report += '\n';
  });

  report += `---

## 核心结论

`;

  const hasPublishUrl = results.find(r => r.accessible && r.hasPublishButton);
  if (hasPublishUrl) {
    report += `✅ **发现支持发布功能的页面**: ${hasPublishUrl.name}\n\n`;
    report += `建议使用该页面进行自动化发布。\n`;
  } else {
    report += `❌ **未发现支持发布功能的页面**\n\n`;
    report += `所有测试的页面都不包含发布功能。可能需要:\n`;
    report += `1. 使用 App 自动化工具（如 Appium）\n`;
    report += `2. 分析番茄小说的 API 接口\n`;
    report += `3. 使用移动设备模拟器\n`;
  }

  return report;
}

// 执行分析
analyzeFanqieMobileWeb().catch(console.error);
