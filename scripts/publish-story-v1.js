/**
 * 番茄小说自动发布脚本（V1）
 *
 * 功能：
 * 1. 自动加载 Cookie 并验证登录状态
 * 2. 访问发布页面并填写发布信息
 * 3. 完成多步骤发布流程
 * 4. 验证发布结果
 * 5. 收集初始数据
 *
 * 使用方法：
 * node scripts/publish-story-v1.js <故事ID>
 *
 * 示例：
 * node scripts/publish-story-v1.js 39
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const cookieManager = require('./cookie-manager.js');

// 参数验证
const storyId = process.argv[2];
if (!storyId) {
  console.error('❌ 错误：请提供故事ID');
  console.error('使用方法: node scripts/publish-story-v1.js <故事ID>');
  console.error('示例: node scripts/publish-story-v1.js 39');
  process.exit(1);
}

// 加载发布包
const publishPackagePath = path.join(__dirname, '..', '番茄短篇故事集', '📦 发布包', `${storyId}号故事发布包.json`);
if (!fs.existsSync(publishPackagePath)) {
  console.error(`❌ 错误：未找到发布包: ${publishPackagePath}`);
  process.exit(1);
}

const publishPackage = JSON.parse(fs.readFileSync(publishPackagePath, 'utf-8'));
console.log(`📦 已加载 ${storyId}号故事发布包`);
console.log(`   标题: ${publishPackage.optimizedTitle}`);
console.log(`   分类: ${publishPackage.category} + ${publishPackage.subCategory}`);
console.log(`   标签: ${publishPackage.tags.join(', ')}`);
console.log(`   字数: ${publishPackage.actualWords}`);
console.log(`   章节: ${publishPackage.chapters}`);

// 加载故事内容
// 发布包中的路径是相对路径，需要正确解析
const publishPackageDir = path.dirname(publishPackagePath);
const storyContentPath = path.resolve(publishPackageDir, publishPackage.contentPath);
if (!fs.existsSync(storyContentPath)) {
  console.error(`❌ 错误：未找到故事内容: ${storyContentPath}`);
  process.exit(1);
}

const storyContent = fs.readFileSync(storyContentPath, 'utf-8');
console.log(`✅ 已加载故事内容 (${storyContent.length} 字符)`);

// 创建输出目录
const outputDir = path.join(__dirname, '..', '番茄短篇故事集', 'data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 生成时间戳
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkLoginStatus(page) {
  console.log('\n🔍 检查登录状态...');

  try {
    // 检查是否存在登录页面元素（二维码）
    const hasQrCode = await page.locator('.slogin-qrcode-scan-page').count() > 0;

    if (hasQrCode) {
      console.log('❌ 未登录，显示登录页面');
      return false;
    }

    // 检查是否已登录（查找用户头像或用户名）
    const hasUserInfo = await page.locator('.muye-header-user').count() > 0;

    if (hasUserInfo) {
      console.log('✅ 已登录');
      return true;
    }

    console.log('⚠️  登录状态未知');
    return false;

  } catch (error) {
    console.log('⚠️  检查登录状态时出错:', error.message);
    return false;
  }
}

async function fillPublishForm(page, publishPackage, storyContent) {
  console.log('\n✍️  开始填写发布表单...');

  // 步骤1：填写标题
  console.log('\n📍 步骤1：填写标题');
  try {
    const titleTextarea = page.locator('textarea.byte-textarea.serial-textarea');
    await titleTextarea.waitFor({ state: 'visible', timeout: 10000 });
    await titleTextarea.fill(publishPackage.optimizedTitle);
    await sleep(1000);

    // 验证填充结果
    const filledTitle = await titleTextarea.inputValue();
    console.log(`✅ 标题已填充：${filledTitle}`);
  } catch (error) {
    console.error('❌ 填写标题失败:', error.message);
    throw error;
  }

  // 步骤2：填写正文
  console.log('\n📍 步骤2：填写正文');
  try {
    const contentEditor = page.locator('div.ProseMirror.payNode-helper-content');
    await contentEditor.waitFor({ state: 'visible', timeout: 10000 });
    await contentEditor.fill(storyContent);
    await sleep(2000);

    // 验证填充结果
    const filledContent = await contentEditor.innerText();
    console.log(`✅ 正文已填充 (${filledContent.length} 字符)`);
  } catch (error) {
    console.error('❌ 填写正文失败:', error.message);
    throw error;
  }

  // 步骤3：点击"下一步"
  console.log('\n📍 步骤3：点击"下一步"按钮');
  try {
    const nextButton = page.locator('button.btn-primary-variant');
    await nextButton.waitFor({ state: 'visible', timeout: 10000 });
    await nextButton.click();

    // 等待页面跳转
    await sleep(3000);
    console.log('✅ 已点击"下一步"按钮');
  } catch (error) {
    console.error('❌ 点击"下一步"按钮失败:', error.message);
    throw error;
  }

  // 步骤4：填写第二页信息
  console.log('\n📍 步骤4：填写第二页信息（分类、标签、简介）');
  await sleep(3000);

  // 填写分类（如果需要）
  // 注意：需要根据实际页面结构调整选择器
  console.log('⚠️  分类和标签选择逻辑待实现（需要分析页面结构）');
  console.log(`   目标分类: ${publishPackage.category} + ${publishPackage.subCategory}`);
  console.log(`   目标标签: ${publishPackage.tags.join(', ')}`);

  // 填写简介
  try {
    // 查找简介输入框（可能是 textarea 或 contenteditable）
    const descriptionTextarea = page.locator('textarea[placeholder*="简介"], textarea[placeholder*="介绍"]');
    const count = await descriptionTextarea.count();

    if (count > 0) {
      await descriptionTextarea.first().fill(publishPackage.introduction);
      await sleep(1000);
      console.log(`✅ 简介已填充（${publishPackage.introduction.length} 字符）`);
    } else {
      console.log('⚠️  未找到简介输入框，可能跳过');
    }
  } catch (error) {
    console.log('⚠️  填写简介失败:', error.message);
  }

  // 步骤5：点击"发布"按钮
  console.log('\n📍 步骤5：点击"发布"按钮');
  try {
    // 查找发布按钮
    const publishButton = page.locator('button').filter({ hasText: /发布|提交/ });
    await publishButton.waitFor({ state: 'visible', timeout: 10000 });
    await publishButton.click();

    // 等待发布完成
    await sleep(5000);
    console.log('✅ 已点击"发布"按钮');
  } catch (error) {
    console.error('❌ 点击"发布"按钮失败:', error.message);
    throw error;
  }

  // 步骤6：验证发布结果
  console.log('\n📍 步骤6：验证发布结果');
  await sleep(3000);

  try {
    // 检查是否发布成功
    const currentUrl = page.url();
    console.log(`   当前页面: ${currentUrl}`);

    // 查找成功提示
    const successElements = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('*').forEach(el => {
        const text = el.textContent.trim();
        if (text.includes('发布成功') || text.includes('提交成功') || text.includes('已发布')) {
          results.push(text.substring(0, 50));
        }
      });
      return results;
    });

    if (successElements.length > 0) {
      console.log('✅ 发布成功！');
      console.log(`   成功提示: ${successElements[0]}`);
      return true;
    } else {
      console.log('⚠️  未找到明确的发布成功提示');
      return false;
    }
  } catch (error) {
    console.error('❌ 验证发布结果失败:', error.message);
    return false;
  }
}

async function collectInitialData(page) {
  console.log('\n📊 收集初始数据...');

  try {
    // 保存页面截图
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(outputDir, `publish-result-${storyId}-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ 截图已保存: ${screenshotPath}`);

    // 收集页面信息
    const pageInfo = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      title: await page.title(),
      screenshot: screenshotPath
    };

    return pageInfo;
  } catch (error) {
    console.error('❌ 收集初始数据失败:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 开始自动发布流程（V1）');
  console.log(`📖 故事ID: ${storyId}`);

  // 打印 Cookie 状态
  console.log('\n' + '='.repeat(60));
  console.log('  Cookie 状态检查');
  console.log('='.repeat(60));
  cookieManager.printCookieStatus();

  // 获取最新 Cookie 文件
  const cookieFile = cookieManager.getLatestCookieFile();

  let browser;
  let page;

  try {
    // 启动浏览器
    console.log('\n🚀 启动浏览器...');
    browser = await chromium.launch({
      headless: false,  // 显示浏览器窗口，便于观察
      slowMo: 100,      // 减慢操作速度，便于观察
    });

    const context = await browser.newContext();

    // 尝试加载 Cookie
    let cookieLoaded = false;
    if (cookieFile) {
      console.log(`\n🍪 尝试加载 Cookie: ${cookieFile}`);
      cookieLoaded = await cookieManager.loadCookies(context, cookieFile);

      if (cookieLoaded) {
        console.log('✅ Cookie 加载成功，准备访问发布页面');
      } else {
        console.log('⚠️  Cookie 加载失败，将使用扫码登录');
      }
    } else {
      console.log('⚠️  未找到 Cookie 文件，将使用扫码登录');
    }

    page = await context.newPage();

    // 访问发布页面
    console.log('\n📍 访问发布页面');
    const publishUrl = 'https://fanqienovel.com/main/writer/publish-short/?enter_from=NEWCHAPTER_1';
    await page.goto(publishUrl, { waitUntil: 'networkidle' });
    await sleep(3000);

    // 检查登录状态
    const isLoggedIn = await checkLoginStatus(page);

    if (!isLoggedIn) {
      console.error('\n❌ 未登录，无法继续发布流程');
      console.error('   请先手动登录并保存 Cookie');
      console.error('   命令: node scripts/login-save-cookies.js');
      await browser.close();
      process.exit(1);
    }

    console.log('✅ 登录状态有效，开始填写发布表单');

    // 填写发布表单
    const fillSuccess = await fillPublishForm(page, publishPackage, storyContent);

    if (!fillSuccess) {
      console.error('\n❌ 填写发布表单失败');
      await browser.close();
      process.exit(1);
    }

    // 收集初始数据
    const initialData = await collectInitialData(page);

    if (initialData) {
      console.log('\n💾 保存发布记录...');

      const publishRecord = {
        storyId,
        title: publishPackage.optimizedTitle,
        publishTime: new Date().toISOString(),
        pageInfo: initialData,
        status: '已发布'
      };

      const recordPath = path.join(outputDir, `publish-record-${storyId}-${timestamp}.json`);
      fs.writeFileSync(recordPath, JSON.stringify(publishRecord, null, 2));
      console.log(`✅ 发布记录已保存: ${recordPath}`);
    }

    console.log('\n✅ 发布流程完成！');
    console.log('📋 发布信息:');
    console.log(`   故事ID: ${storyId}`);
    console.log(`   标题: ${publishPackage.optimizedTitle}`);
    console.log(`   发布时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);

    // 等待用户查看
    console.log('\n⏳ 浏览器窗口将保持打开10秒，供您查看...');
    await sleep(10000);

  } catch (error) {
    console.error('\n❌ 发布流程失败:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n✅ 浏览器已关闭');
    }
  }
}

main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
