#!/usr/bin/env node

/**
 * 39号故事最终发布脚本（改进版）
 *
 * 基于 UI 结构分析结果，使用更精确的选择器完成发布
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  cookieFile: path.join(__dirname, '..', 'cookies', 'latest.json'),
  storyPackagePath: path.join(__dirname, '..', '番茄短篇故事集/📦 发布包', '39号故事发布包.json'),
  storyContentPath: path.join(__dirname, '..', '番茄短篇故事集/stories/归档故事集/39_灵异悬疑_午夜电梯/content/full_story.md'),
  publishUrl: 'https://fanqienovel.com/main/writer/publish-short/?enter_from=NEWCHAPTER_1',
  outputDir: path.join(__dirname, '..', 'data')
};

function log(message, color = '\x1b[0m') {
  console.log(`${color}${message}\x1b[0m`);
}

function loadCookies() {
  const cookies = JSON.parse(fs.readFileSync(CONFIG.cookieFile, 'utf8'));
  log(`✅ 已加载 ${cookies.length} 个 Cookie\n`, '\x1b[32m');
  return cookies;
}

function loadStoryPackage() {
  const package = JSON.parse(fs.readFileSync(CONFIG.storyPackagePath, 'utf8'));
  log(`📚 故事标题: ${package.title}\n`, '\x1b[36m');
  return package;
}

function loadStoryContent() {
  let content = fs.readFileSync(CONFIG.storyContentPath, 'utf8');
  const lines = content.split('\n');
  if (lines[0].startsWith('#')) {
    content = lines.slice(1).join('\n').trim();
  }
  log(`📝 故事内容长度: ${content.length} 字符\n`, '\x1b[36m');
  return content;
}

async function finalPublish() {
  log('\n' + '='.repeat(80), '\x1b[36m');
  log('39号故事最终发布脚本（改进版）', '\x1b[36m');
  log('='.repeat(80) + '\n', '\x1b[36m');

  let browser = null;
  const screenshots = [];

  try {
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    // 加载数据
    log('📍 加载数据...\n', '\x1b[36m');
    const cookies = loadCookies();
    const storyPackage = loadStoryPackage();
    const storyContent = loadStoryContent();

    // 启动浏览器
    log('📍 启动浏览器...\n', '\x1b[36m');
    browser = await chromium.launch({
      headless: false,
      slowMo: 500
    });

    const page = await browser.newPage();

    // 加载 Cookie
    log('📍 加载 Cookie...\n', '\x1b[36m');
    await page.context().addCookies(cookies);

    // 访问发布页面
    log('📍 访问发布页面...\n', '\x1b[36m');
    await page.goto(CONFIG.publishUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(10000);

    // 检查登录状态（多种方式）
    log('📍 检查登录状态...\n', '\x1b[36m');
    let isLoggedIn = false;

    // 方式1：检查页面标题
    try {
      const pageTitle = await page.title();
      if (pageTitle.includes('作家专区') || pageTitle.includes('番茄小说')) {
        isLoggedIn = true;
        log('✅ 登录状态：已登录（通过页面标题验证）\n', '\x1b[32m');
      }
    } catch (error) {
      // 继续尝试其他方式
    }

    // 方式2：检查用户名
    if (!isLoggedIn) {
      try {
        const hasUserName = await page.innerText('body').then(text => text.includes('帅帅它爸'));
        if (hasUserName) {
          isLoggedIn = true;
          log('✅ 登录状态：已登录（通过用户名验证）\n', '\x1b[32m');
        }
      } catch (error) {
        // 继续尝试其他方式
      }
    }

    if (!isLoggedIn) {
      log('❌ 登录状态：未登录或 Cookie 无效\n', '\x1b[31m');
      throw new Error('未登录');
    }

    // 步骤1：填写标题
    log('─'.repeat(80) + '\n', '\x1b[36m');
    log('📍 步骤1：填写标题...\n', '\x1b[36m');
    const storyTitle = '午夜电梯，全死光了';
    log(`📚 标题: ${storyTitle}\n`, '\x1b[36m');

    const titleFilled = await page.locator('textarea.byte-textarea.serial-textarea').fill(storyTitle);
    if (titleFilled) {
      log('✅ 标题已填写\n', '\x1b[32m');
    }
    await page.waitForTimeout(1000);

    // 截图
    const screenshot1 = path.join(CONFIG.outputDir, `final-publish-39-step1-${Date.now()}.png`);
    await page.screenshot({ path: screenshot1, fullPage: true });
    screenshots.push(screenshot1);
    log(`📸 截图已保存: ${screenshot1}\n\n`, '\x1b[36m');

    // 步骤2：填写正文
    log('─'.repeat(80) + '\n', '\x1b[36m');
    log('📍 步骤2：填写正文...\n', '\x1b[36m');
    log(`📝 正文长度: ${storyContent.length} 字符\n`, '\x1b[36m');

    const contentFilled = await page.locator('div.ProseMirror.payNode-helper-content').fill(storyContent);
    if (contentFilled) {
      log('✅ 正文已填写\n', '\x1b[32m');
    }
    await page.waitForTimeout(1000);

    // 截图
    const screenshot2 = path.join(CONFIG.outputDir, `final-publish-39-step2-${Date.now()}.png`);
    await page.screenshot({ path: screenshot2, fullPage: true });
    screenshots.push(screenshot2);
    log(`📸 截图已保存: ${screenshot2}\n\n`, '\x1b[36m');

    // 步骤3：点击"下一步"按钮
    log('─'.repeat(80) + '\n', '\x1b[36m');
    log('📍 步骤3：点击"下一步"按钮...\n', '\x1b[36m');

    const nextClicked = await page.locator('#app button:has-text("下一步").btn-primary-variant').click();
    if (nextClicked) {
      log('✅ "下一步"按钮已点击\n', '\x1b[32m');
    }
    await page.waitForTimeout(5000);

    // 截图
    const screenshot3 = path.join(CONFIG.outputDir, `final-publish-39-step3-${Date.now()}.png`);
    await page.screenshot({ path: screenshot3, fullPage: true });
    screenshots.push(screenshot3);
    log(`📸 截图已保存: ${screenshot3}\n\n`, '\x1b[36m');

    // 步骤4：设置作品分类
    log('─'.repeat(80) + '\n', '\x1b[36m');
    log('📍 步骤4：设置作品分类...\n', '\x1b[36m');
    log('💡 建议选择: 灵异悬疑\n', '\x1b[36m');

    let categorySet = false;

    try {
      // 点击作品分类选择器
      log('🔍 点击作品分类选择器...\n', '\x1b[36m');
      await page.locator('div.publish-short-category-select').click();
      await page.waitForTimeout(2000);

      // 截图
      const screenshot4a = path.join(CONFIG.outputDir, `final-publish-39-step4a-${Date.now()}.png`);
      await page.screenshot({ path: screenshot4a, fullPage: true });
      screenshots.push(screenshot4a);
      log(`📸 截图已保存: ${screenshot4a}\n\n`, '\x1b[36m');

      // 尝试点击"灵异悬疑"分类
      log('🔍 尝试点击"灵异悬疑"分类...\n', '\x1b[36m');
      await page.waitForTimeout(1000);

      // 查找包含"灵异"或"悬疑"的选项
      const categoryClicked = await page.locator('*:has-text("灵异悬疑")').first().click();
      await page.waitForTimeout(2000);

      if (categoryClicked) {
        log('✅ 作品分类已设置\n', '\x1b[32m');
        categorySet = true;
      } else {
        log('❌ 作品分类设置失败\n', '\x1b[31m');
      }
    } catch (error) {
      log(`⚠️ 作品分类设置失败: ${error.message}\n`, '\x1b[33m');
    }

    // 截图
    const screenshot4b = path.join(CONFIG.outputDir, `final-publish-39-step4b-${Date.now()}.png`);
    await page.screenshot({ path: screenshot4b, fullPage: true });
    screenshots.push(screenshot4b);
    log(`📸 截图已保存: ${screenshot4b}\n\n`, '\x1b[36m');

    // 步骤5：勾选发布协议
    log('─'.repeat(80) + '\n', '\x1b[36m');
    log('📍 步骤5：勾选发布协议...\n', '\x1b[36m');

    let agreementChecked = false;

    try {
      // 尝试查找并点击发布协议
      log('🔍 尝试查找发布协议...\n', '\x1b[36m');

      // 查找包含"协议"的 checkbox
      const agreementCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: '协议' });
      const count = await agreementCheckbox.count();

      if (count > 0) {
        log(`✅ 找到 ${count} 个发布协议 checkbox\n`, '\x1b[32m');
        await agreementCheckbox.first().check();
        log('✅ 发布协议已勾选\n', '\x1b[32m');
        agreementChecked = true;
      } else {
        log('⚠️ 未找到发布协议 checkbox\n', '\x1b[33m');
      }
    } catch (error) {
      log(`⚠️ 发布协议勾选失败: ${error.message}\n`, '\x1b[33m');
    }

    // 截图
    const screenshot5 = path.join(CONFIG.outputDir, `final-publish-39-step5-${Date.now()}.png`);
    await page.screenshot({ path: screenshot5, fullPage: true });
    screenshots.push(screenshot5);
    log(`📸 截图已保存: ${screenshot5}\n\n`, '\x1b[36m');

    // 步骤6：点击"发布"按钮
    log('─'.repeat(80) + '\n', '\x1b[36m');
    log('📍 步骤6：点击"发布"按钮...\n', '\x1b[36m');

    const publishClicked = await page.locator('#app button:has-text("发布").btn-primary-variant').click();
    if (publishClicked) {
      log('✅ "发布"按钮已点击\n', '\x1b[32m');
    }
    await page.waitForTimeout(5000);

    // 截图
    const screenshot6 = path.join(CONFIG.outputDir, `final-publish-39-step6-${Date.now()}.png`);
    await page.screenshot({ path: screenshot6, fullPage: true });
    screenshots.push(screenshot6);
    log(`📸 截图已保存: ${screenshot6}\n\n`, '\x1b[36m');

    // 验证发布成功
    log('─'.repeat(80) + '\n', '\x1b[36m');
    log('📍 验证发布成功...\n', '\x1b[36m');

    const pageTitle = await page.title();
    const pageUrl = page.url();
    log(`📊 页面标题: ${pageTitle}\n`, '\x1b[36m');
    log(`📊 页面URL: ${pageUrl}\n`, '\x1b[36m');

    const isPublished = pageTitle.includes('成功') || pageUrl.includes('success') || pageUrl.includes('short-manage');

    if (isPublished) {
      log('✅ 发布成功！\n', '\x1b[32m');
    } else {
      log('⚠️ 发布状态未知，请手动确认\n', '\x1b[33m');
    }

    // 保存发布结果
    log('─'.repeat(80) + '\n', '\x1b[36m');
    log('📍 保存发布结果...\n', '\x1b[36m');

    const result = {
      timestamp: new Date().toISOString(),
      storyId: '39',
      storyTitle: '午夜电梯，全死光了',
      steps: {
        title: true,
        content: true,
        next: true,
        category: categorySet,
        agreement: agreementChecked,
        publish: true,
        isPublished: isPublished
      },
      screenshots: screenshots,
      status: isPublished ? '发布成功' : '发布状态未知'
    };

    const resultFile = path.join(CONFIG.outputDir, `final-publish-39-result-${Date.now()}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2), 'utf8');
    log(`✅ 发布结果已保存: ${resultFile}\n\n`, '\x1b[32m');

    log('='.repeat(80), '\x1b[36m');
    log(isPublished ? '✅ 发布成功！' : '⚠️ 发布状态未知，请手动确认', '\x1b[32m');
    log('='.repeat(80) + '\n', '\x1b[36m');

    if (!isPublished) {
      log('⚠️ 请手动完成以下步骤：\n', '\x1b[33m');
      log('1. 检查作品分类是否已设置\n', '\x1b[33m');
      log('2. 检查发布协议是否已勾选\n', '\x1b[33m');
      log('3. 重新点击"发布"按钮（如果需要）\n', '\x1b[33m');
      log('4. 确认发布成功\n\n', '\x1b[33m');
    }

    log('ℹ️ 浏览器窗口将保持打开状态...\n', '\x1b[36m');
    log('ℹ️ 确认发布完成后，按 Ctrl+C 关闭脚本。\n\n', '\x1b[36m');

    await new Promise(() => {});

  } catch (error) {
    log(`❌ 发布失败: ${error.message}\n`, '\x1b[31m');
    console.error(error);
    throw error;
  } finally {
    log('ℹ️ 保持浏览器窗口打开...\n', '\x1b[36m');
  }
}

finalPublish()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ 发布异常:', error);
    process.exit(1);
  });
