#!/usr/bin/env node

/**
 * 39号故事手动发布辅助脚本
 *
 * 功能：
 * 1. 访问番茄小说发布页面
 * 2. 自动加载 Cookie
 * 3. 自动填写标题
 * 4. 保持浏览器窗口打开，等待用户手动填写正文和完成发布
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const cookieFile = path.join(__dirname, '..', 'cookies', 'latest.json');
const storyPackagePath = path.join(__dirname, '..', '番茄短篇故事集/📦 发布包', '39号故事发布包.json');
const storyContentPath = path.join(__dirname, '..', '番茄短篇故事集/stories/归档故事集/39_灵异悬疑_午夜电梯/content/full_story.md');

function loadCookies() {
  if (!fs.existsSync(cookieFile)) {
    throw new Error(`Cookie 文件不存在: ${cookieFile}`);
  }

  const cookies = JSON.parse(fs.readFileSync(cookieFile, 'utf8'));
  console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);

  return cookies;
}

function loadStoryPackage() {
  if (!fs.existsSync(storyPackagePath)) {
    throw new Error(`故事发布包不存在: ${storyPackagePath}`);
  }

  const package = JSON.parse(fs.readFileSync(storyPackagePath, 'utf8'));
  console.log(`✅ 故事标题: ${package.optimizedTitle || package.title}`);

  return package;
}

function loadStoryContent() {
  if (!fs.existsSync(storyContentPath)) {
    throw new Error(`故事内容文件不存在: ${storyContentPath}`);
  }

  let content = fs.readFileSync(storyContentPath, 'utf8');

  // 去除 Markdown 标题（第一行）
  const lines = content.split('\n');
  if (lines[0].startsWith('#')) {
    content = lines.slice(1).join('\n').trim();
  }

  console.log(`✅ 故事内容长度: ${content.length} 字符`);

  return content;
}

async function manualPublish() {
  console.log('🔍 39号故事手动发布辅助脚本\n');

  let browser = null;

  try {
    // 加载数据
    console.log('📍 加载数据...');
    const cookies = loadCookies();
    const storyPackage = loadStoryPackage();
    const storyContent = loadStoryContent();
    console.log('');

    // 启动浏览器
    console.log('📍 启动浏览器...');
    browser = await chromium.launch({
      headless: false,
    });

    const page = await browser.newPage();

    // 加载 Cookie
    console.log('📍 加载 Cookie...');
    await page.context().addCookies(cookies);
    console.log('');

    // 访问发布页面
    console.log('📍 访问发布页面...');
    await page.goto('https://fanqienovel.com/main/writer/publish-short/?enter_from=NEWCHAPTER_1', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    console.log('✅ 已访问发布页面\n');

    // 等待页面加载
    console.log('📍 等待页面加载...');
    await page.waitForTimeout(5000);
    console.log('✅ 页面已加载\n');

    // 填写标题
    console.log('📍 填写标题...');
    const title = storyPackage.optimizedTitle || storyPackage.title;
    console.log(`   标题: ${title}`);

    try {
      // 尝试多种选择器
      const titleSelectors = [
        'textarea.byte-textarea.serial-textarea',
        'textarea[placeholder*="标题"]',
        'input[placeholder*="标题"]',
      ];

      let titleFilled = false;
      for (const selector of titleSelectors) {
        try {
          const titleInput = page.locator(selector).first();
          await titleInput.fill(title);
          await page.waitForTimeout(1000);
          console.log('✅ 标题已填写');
          titleFilled = true;
          break;
        } catch (err) {
          // 尝试下一个选择器
        }
      }

      if (!titleFilled) {
        console.log('⚠️  自动填写标题失败，请手动填写');
      }
    } catch (error) {
      console.log('⚠️  自动填写标题失败，请手动填写');
    }
    console.log('');

    // 准备故事内容（复制到剪贴板）
    console.log('📍 准备故事内容...');
    console.log(`   长度: ${storyContent.length} 字符`);
    console.log('');

    // 尝试自动填写正文
    console.log('📍 尝试自动填写正文...');
    try {
      // 尝试多种选择器
      const contentSelectors = [
        'div.ProseMirror.payNode-helper-content',
        'div[contenteditable="true"]',
        'textarea[placeholder*="正文"]',
      ];

      let contentFilled = false;
      for (const selector of contentSelectors) {
        try {
          const contentEditor = page.locator(selector).first();
          await contentEditor.click();
          await page.waitForTimeout(500);
          await contentEditor.fill(storyContent);
          await page.waitForTimeout(1000);
          console.log('✅ 正文已填写');
          contentFilled = true;
          break;
        } catch (err) {
          // 尝试下一个选择器
        }
      }

      if (!contentFilled) {
        console.log('⚠️  自动填写正文失败，请手动填写');
        console.log('   提示：可以使用 Ctrl+V 粘贴故事内容');
      }
    } catch (error) {
      console.log('⚠️  自动填写正文失败，请手动填写');
      console.log('   提示：可以使用 Ctrl+V 粘贴故事内容');
    }
    console.log('');

    // 显示提示信息
    console.log('='.repeat(60));
    console.log('✅ 浏览器窗口已打开，发布页面已加载');
    console.log('='.repeat(60));
    console.log('');
    console.log('📋 请手动完成以下步骤：');
    console.log('');
    console.log('1. 检查标题是否正确填写（如果没有，请手动填写）');
    console.log('2. 填写正文（如果没有自动填写，请手动粘贴）');
    console.log('3. 点击"下一步"按钮');
    console.log('4. 设置作品分类（建议选择"灵异悬疑"）');
    console.log('5. 勾选发布协议');
    console.log('6. 点击"发布"按钮');
    console.log('');
    console.log('💡 故事内容已加载到脚本内存，如果需要，可以手动复制');
    console.log('');
    console.log('='.repeat(60));
    console.log('⚠️  完成发布后，请按 Ctrl+C 关闭浏览器和脚本');
    console.log('='.repeat(60));
    console.log('');

    // 保存故事内容到文件，方便复制
    const contentFile = path.join(__dirname, '..', 'data', 'story-39-content-for-copy.txt');
    fs.writeFileSync(contentFile, storyContent, 'utf-8');
    console.log(`💡 故事内容已保存到: ${contentFile}`);
    console.log('💡 如果需要，可以手动从该文件复制内容\n');

    // 保持浏览器窗口打开，等待用户手动操作
    console.log('📍 浏览器窗口将保持打开状态...');
    console.log('📍 请手动完成发布步骤后，按 Ctrl+C 关闭脚本。\n');

    // 等待用户手动操作（无限等待，直到用户手动关闭）
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

manualPublish();
