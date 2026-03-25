#!/usr/bin/env node

/**
 * 分析短故事管理页面结构
 * 用于查找发布按钮
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  cookieFile: path.join(__dirname, '..', 'cookies', 'latest.json'),
  publishUrl: 'https://fanqienovel.com/page/writer/short-manage',
  outputDir: path.join(__dirname, '..', 'data')
};

/**
 * 加载 Cookie
 */
function loadCookies() {
  const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));
  console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);
  return cookies;
}

async function analyzeShortManagePage() {
  console.log('🚀 启动短故事管理页面分析...\n');

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

    console.log(`📍 访问页面: ${CONFIG.publishUrl}`);
    await page.goto(CONFIG.publishUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    console.log('\n📊 页面信息：');
    console.log('─'.repeat(80));

    const pageInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyText: document.body.innerText.substring(0, 500)
      };
    });

    console.log(`URL: ${pageInfo.url}`);
    console.log(`标题: ${pageInfo.title}`);
    console.log(`页面文本（前500字）:\n${pageInfo.bodyText}\n`);

    // 查找所有按钮
    console.log('─'.repeat(80));
    console.log('🔍 所有按钮：\n');
    const buttons = await page.$$eval('button', buttons => {
      return buttons.map((button, index) => {
        return {
          index,
          text: button.textContent.trim(),
          className: button.className,
          id: button.id,
          disabled: button.disabled
        };
      });
    });

    buttons.forEach((button, i) => {
      if (button.text) {
        console.log(`  ${i + 1}. "${button.text}"`);
        console.log(`     className: ${button.className.substring(0, 100)}`);
        console.log(`     id: ${button.id || 'N/A'}`);
        console.log(`     disabled: ${button.disabled}`);
        console.log('');
      }
    });

    // 查找所有链接
    console.log('─'.repeat(80));
    console.log('🔍 所有链接（包含"发布"或"新建"）：\n');
    const links = await page.$$eval('a', links => {
      return links.map((link, index) => {
        return {
          index,
          href: link.href,
          text: link.textContent.trim(),
          className: link.className,
          id: link.id
        };
      });
    });

    links.forEach((link, i) => {
      if ((link.text.includes('发布') || link.text.includes('新建') || link.text.includes('创建')) && link.text) {
        console.log(`  ${i + 1}. "${link.text}"`);
        console.log(`     href: ${link.href}`);
        console.log(`     className: ${link.className.substring(0, 100)}`);
        console.log('');
      }
    });

    // 查找所有图标或 SVG 元素
    console.log('─'.repeat(80));
    console.log('🔍 图标元素：\n');
    const icons = await page.$$eval('svg, i[class*="icon"], span[class*="icon"]', icons => {
      return Array.from(icons).slice(0, 20).map((icon, index) => {
        return {
          index,
          tagName: icon.tagName,
          className: icon.className,
          ariaLabel: icon.getAttribute('aria-label')
        };
      });
    });

    icons.forEach((icon, i) => {
      console.log(`  ${i + 1}. <${icon.tagName}>`);
      console.log(`     className: ${icon.className.substring(0, 100)}`);
      console.log(`     ariaLabel: ${icon.ariaLabel || 'N/A'}`);
      console.log('');
    });

    // 截图
    const screenshotFile = path.join(CONFIG.outputDir, `short-manage-page-${Date.now()}.png`);
    await page.screenshot({ path: screenshotFile, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotFile}`);

    // 保存分析结果
    const result = {
      timestamp: new Date().toISOString(),
      pageInfo,
      buttons: buttons.filter(b => b.text),
      publishLinks: links.filter(l => l.text.includes('发布') || l.text.includes('新建')),
      icons
    };

    const resultFile = path.join(CONFIG.outputDir, `short-manage-analysis-${Date.now()}.json`);
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

analyzeShortManagePage()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ 分析异常:', error);
    process.exit(1);
  });
