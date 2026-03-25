#!/usr/bin/env node

/**
 * 分析番茄小说作家后台
 * 查找正确的发布入口
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  cookieFile: path.join(__dirname, '..', 'cookies', 'latest.json'),
  writerDashboardUrl: 'https://fanqienovel.com/main/writer/short-manage',
  outputDir: path.join(__dirname, '..', 'data')
};

function loadCookies() {
  const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));
  console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);
  return cookies;
}

async function analyzeWriterDashboard() {
  console.log('🚀 启动作家后台分析...\n');

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

    console.log(`📍 访问作家后台: ${CONFIG.writerDashboardUrl}`);
    await page.goto(CONFIG.writerDashboardUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    console.log('\n📊 页面信息：');
    console.log('─'.repeat(80));

    const pageInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasUserName: document.body.innerText.includes('帅帅它爸'),
        bodyText: document.body.innerText.substring(0, 800)
      };
    });

    console.log(`URL: ${pageInfo.url}`);
    console.log(`标题: ${pageInfo.title}`);
    console.log(`包含用户名: ${pageInfo.hasUserName ? '✅' : '❌'}`);
    console.log(`页面文本（前800字）:\n${pageInfo.bodyText}\n`);

    if (!pageInfo.hasUserName) {
      console.log('❌ 未找到用户名，可能未登录或 Cookie 失效');
      throw new Error('登录失败');
    }

    // 查找所有包含"发布"的按钮和链接
    console.log('─'.repeat(80));
    console.log('🔍 所有包含"发布"、"新建"、"创建"的按钮和链接：\n');

    const publishElements = await page.evaluate(() => {
      const results = [];

      // 查找按钮
      document.querySelectorAll('button').forEach((button, index) => {
        const text = button.textContent.trim();
        if (text.includes('发布') || text.includes('新建') || text.includes('创建') || text.includes('写')) {
          results.push({
            type: 'button',
            index,
            text,
            className: button.className,
            id: button.id,
            disabled: button.disabled,
            href: button.getAttribute('href')
          });
        }
      });

      // 查找链接
      document.querySelectorAll('a').forEach((link, index) => {
        const text = link.textContent.trim();
        if (text.includes('发布') || text.includes('新建') || text.includes('创建') || text.includes('写')) {
          results.push({
            type: 'link',
            index,
            text,
            href: link.href,
            className: link.className,
            id: link.id
          });
        }
      });

      return results;
    });

    if (publishElements.length === 0) {
      console.log('⚠️  未找到包含"发布"、"新建"、"创建"的按钮或链接');
      console.log('\n尝试查找所有按钮...\n');

      const allButtons = await page.$$eval('button', buttons => {
        return buttons.map((button, index) => ({
          index,
          text: button.textContent.trim(),
          className: button.className,
          id: button.id,
          disabled: button.disabled
        })).filter(b => b.text);
      });

      allButtons.forEach((button, i) => {
        console.log(`  ${i + 1}. "${button.text}"`);
        console.log(`     className: ${button.className.substring(0, 100)}`);
        console.log(`     id: ${button.id || 'N/A'}`);
        console.log('');
      });
    } else {
      publishElements.forEach((element, i) => {
        console.log(`  ${i + 1}. [${element.type.toUpperCase()}] "${element.text}"`);
        console.log(`     className: ${element.className.substring(0, 100)}`);
        console.log(`     id: ${element.id || 'N/A'}`);
        if (element.href) {
          console.log(`     href: ${element.href}`);
        }
        console.log('');
      });
    }

    // 查找所有导航项
    console.log('─'.repeat(80));
    console.log('🔍 导航菜单：\n');

    const navItems = await page.evaluate(() => {
      const results = [];

      // 查找导航链接
      document.querySelectorAll('nav a, .nav a, [class*="nav"] a').forEach((link, index) => {
        const text = link.textContent.trim();
        if (text) {
          results.push({
            index,
            text,
            href: link.href,
            className: link.className
          });
        }
      });

      return results;
    });

    navItems.forEach((item, i) => {
      console.log(`  ${i + 1}. "${item.text}"`);
      console.log(`     href: ${item.href}`);
      console.log(`     className: ${item.className.substring(0, 100)}`);
      console.log('');
    });

    // 截图
    const screenshotFile = path.join(CONFIG.outputDir, `writer-dashboard-${Date.now()}.png`);
    await page.screenshot({ path: screenshotFile, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotFile}`);

    // 保存分析结果
    const result = {
      timestamp: new Date().toISOString(),
      pageInfo,
      publishElements,
      navItems
    };

    const resultFile = path.join(CONFIG.outputDir, `writer-dashboard-analysis-${Date.now()}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2), 'utf8');
    console.log(`\n📄 分析结果已保存: ${resultFile}`);

    console.log('\n✅ 分析完成！');

  } catch (error) {
    console.error('\n❌ 分析失败:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n📍 浏览器已关闭');
    }
  }
}

analyzeWriterDashboard()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ 分析异常:', error);
    process.exit(1);
  });
