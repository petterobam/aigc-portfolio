#!/usr/bin/env node

/**
 * 检查发布页面状态
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const cookieFile = path.join(__dirname, '..', 'cookies', 'latest.json');
const dataDir = path.join(__dirname, '..', 'data');

function loadCookies() {
  if (!fs.existsSync(cookieFile)) {
    throw new Error(`Cookie 文件不存在: ${cookieFile}`);
  }

  const cookies = JSON.parse(fs.readFileSync(cookieFile, 'utf8'));
  console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);

  return cookies;
}

async function checkPublishStatus() {
  console.log('🔍 检查发布页面状态...\n');

  let browser = null;

  try {
    // 启动浏览器
    console.log('📍 启动 Chromium 浏览器...');
    browser = await chromium.launch({
      headless: false,
    });

    // 创建页面
    const page = await browser.newPage();

    // 加载 Cookie
    console.log('📍 加载 Cookie...');
    const cookies = loadCookies();
    await page.context().addCookies(cookies);

    // 访问发布页面
    console.log('📍 访问发布页面...');
    const publishUrl = 'https://fanqienovel.com/main/writer/publish-short/7621568248030429720?enter_from=NEWCHAPTER_1';
    await page.goto(publishUrl, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    // 等待页面加载
    await page.waitForTimeout(5000);

    // 检查发布状态
    console.log('📍 检查发布状态...');
    const status = await page.evaluate(() => {
      // 检查是否有成功提示
      const successMessage = Array.from(document.querySelectorAll('*'))
        .find(el => el.textContent.includes('发布成功') || el.textContent.includes('提交成功'));

      // 检查是否有错误提示
      const errorMessage = Array.from(document.querySelectorAll('*'))
        .find(el => el.textContent.includes('发布失败') || el.textContent.includes('提交失败'));

      // 检查标题
      const titleEl = document.querySelector('textarea.byte-textarea.serial-textarea');
      const title = titleEl ? titleEl.value : '';

      // 检查正文
      const contentEl = document.querySelector('div.ProseMirror.payNode-helper-content');
      const content = contentEl ? contentEl.textContent.substring(0, 100) : '';

      return {
        hasSuccessMessage: !!successMessage,
        hasErrorMessage: !!errorMessage,
        title,
        content,
        currentUrl: window.location.href,
      };
    });

    console.log('\n📊 发布状态：');
    console.log('──────────────────────────────────────────────────');
    console.log(`标题: ${status.title || '未找到'}`);
    console.log(`正文预览: ${status.content || '未找到'}`);
    console.log(`成功提示: ${status.hasSuccessMessage ? '是' : '否'}`);
    console.log(`错误提示: ${status.hasErrorMessage ? '是' : '否'}`);
    console.log(`当前URL: ${status.currentUrl}`);
    console.log('──────────────────────────────────────────────────\n');

    if (status.hasSuccessMessage) {
      console.log('🎉 发布成功！\n');
    } else if (status.hasErrorMessage) {
      console.log('❌ 发布失败\n');
    } else if (status.title && status.content) {
      console.log('ℹ️  发布页面仍在编辑状态（可能未提交）\n');
    } else {
      console.log('❓ 发布状态不确定\n');
    }

    // 截图
    const screenshot = path.join(dataDir, 'publish-status.png');
    await page.screenshot({ path: screenshot, fullPage: true });
    console.log(`📸 截图已保存: ${screenshot}\n`);

    // 保存检查结果
    const result = {
      timestamp: new Date().toISOString(),
      status,
    };

    const resultFile = path.join(dataDir, 'publish-status-result.json');
    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
    console.log(`📄 检查结果已保存: ${resultFile}\n`);

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

checkPublishStatus();
