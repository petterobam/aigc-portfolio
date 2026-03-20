const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 创建输出目录
const outputDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 简化版页面分析工具');
  console.log('📍 目标：快速诊断页面状态');

  // 使用 Chrome 用户数据目录
  const userDataDir = path.join(__dirname, '..', 'chrome-data');

  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,  // 显示浏览器窗口，便于观察
    slowMo: 100,      // 减慢操作速度，便于观察
  });

  const page = browser.pages()[0] || await browser.newPage();

  try {
    console.log('\n📍 访问发布页面...');

    const publishUrl = 'https://fanqienovel.com/main/writer/publish-short/?enter_from=NEWCHAPTER_1';
    console.log('   URL:', publishUrl);

    await page.goto(publishUrl, { waitUntil: 'networkidle' });
    await sleep(5000);

    // 获取页面信息
    const url = page.url();
    const title = await page.title();
    const bodyText = await page.evaluate(() => {
      return document.body.innerText.substring(0, 500);
    });

    console.log('\n📊 页面信息:');
    console.log('   URL:', url);
    console.log('   标题:', title);
    console.log('   Body 文本（前500字）:');
    console.log('   ', bodyText.split('\n').map(line => '   ' + line).join('\n'));

    // 查找关键元素
    console.log('\n🔍 查找关键元素:');

    const hasQrCode = await page.locator('.slogin-qrcode-scan-page').count() > 0;
    console.log('   - 登录二维码元素 (.slogin-qrcode-scan-page):', hasQrCode ? '✅' : '❌');

    const hasLoginForm = await page.locator('#slogin-pc-login-form').count() > 0;
    console.log('   - 登录表单 (#slogin-pc-login-form):', hasLoginForm ? '✅' : '❌');

    const hasUserInfo = await page.locator('.muye-header-user').count() > 0;
    console.log('   - 用户信息 (.muye-header-user):', hasUserInfo ? '✅' : '❌');

    const hasPublishForm = await page.locator('.publish-short-form').count() > 0;
    console.log('   - 发布表单 (.publish-short-form):', hasPublishForm ? '✅' : '❌');

    const hasTitleInput = await page.locator('textarea.byte-textarea.serial-textarea').count() > 0;
    console.log('   - 标题输入框 (textarea.byte-textarea.serial-textarea):', hasTitleInput ? '✅' : '❌');

    const hasContentEditor = await page.locator('div.ProseMirror.payNode-helper-content').count() > 0;
    console.log('   - 内容编辑器 (div.ProseMirror.payNode-helper-content):', hasContentEditor ? '✅' : '❌');

    // 统计页面元素
    console.log('\n📈 页面元素统计:');

    const inputCount = await page.locator('input').count();
    console.log('   - input 元素:', inputCount);

    const textareaCount = await page.locator('textarea').count();
    console.log('   - textarea 元素:', textareaCount);

    const buttonCount = await page.locator('button').count();
    console.log('   - button 元素:', buttonCount);

    const contenteditableCount = await page.locator('[contenteditable]').count();
    console.log('   - contenteditable 元素:', contenteditableCount);

    // 保存截图和 HTML
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(outputDir, `page-simple-${timestamp}.png`);
    const htmlPath = path.join(outputDir, `page-simple-${timestamp}.html`);

    await page.screenshot({ path: screenshotPath, fullPage: true });
    const html = await page.content();
    fs.writeFileSync(htmlPath, html);

    console.log('\n💾 已保存:');
    console.log('   - 截图:', screenshotPath);
    console.log('   - HTML:', htmlPath);

    // 判断页面状态
    console.log('\n🎯 页面状态判断:');

    if (hasQrCode || hasLoginForm) {
      console.log('   状态: ❌ 未登录（登录页面）');
    } else if (hasTitleInput && hasContentEditor) {
      console.log('   状态: ✅ 已登录（发布页面）');
    } else if (hasUserInfo) {
      console.log('   状态: ✅ 已登录（但可能是其他页面）');
    } else {
      console.log('   状态: ⚠️  无法确定');
    }

    // 保持浏览器打开，便于手动检查
    console.log('\n⏳ 浏览器将保持打开30秒，供您手动检查...');
    await sleep(30000);

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ 浏览器已关闭');
  }
}

main().catch(console.error);
