#!/usr/bin/env node

/**
 * 检查39号故事发布状态
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

async function checkStory39() {
  console.log('🔍 检查39号故事发布状态...\n');

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

    // 访问短故事管理页面
    console.log('📍 访问短故事管理页面...');
    await page.goto('https://fanqienovel.com/main/writer/short-manage', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 查找39号故事（标题：午夜电梯，全死光了）
    console.log('📍 查找39号故事...');
    const storyInfo = await page.evaluate(() => {
      const storyItems = document.querySelectorAll('.short-article-table-item');
      const stories = [];

      storyItems.forEach((item) => {
        try {
          const titleEl = item.querySelector('.article-item-title');
          const title = titleEl ? titleEl.textContent.trim() : '';

          // 查找39号故事（标题包含"午夜电梯"或"全死光了"）
          if (title.includes('午夜电梯') || title.includes('全死光了')) {
            const statusEl = item.querySelector('.arco-tag');
            const status = statusEl ? statusEl.textContent.trim() : '';

            const readCountEl = item.querySelector('.article-item-read-count');
            const readCount = readCountEl ? readCountEl.textContent.trim() : '';

            const wordCountEl = item.querySelector('.article-item-word-count');
            const wordCount = wordCountEl ? wordCountEl.textContent.trim() : '';

            const createTimeEl = item.querySelector('.article-item-create-time');
            const createTime = createTimeEl ? createTimeEl.textContent.trim() : '';

            stories.push({
              title,
              status,
              readCount,
              wordCount,
              createTime,
            });
          }
        } catch (err) {
          // 忽略错误
        }
      });

      return stories;
    });

    if (storyInfo.length > 0) {
      console.log('\n✅ 找到39号故事！');
      console.log('──────────────────────────────────────────────────');
      console.log(`标题: ${storyInfo[0].title}`);
      console.log(`状态: ${storyInfo[0].status}`);
      console.log(`阅读量: ${storyInfo[0].readCount}`);
      console.log(`字数: ${storyInfo[0].wordCount}`);
      console.log(`创建时间: ${storyInfo[0].createTime}`);
      console.log('──────────────────────────────────────────────────\n');

      // 判断是否已发布
      if (storyInfo[0].status.includes('已发布') || storyInfo[0].status.includes('上架')) {
        console.log('🎉 39号故事已发布！\n');
      } else {
        console.log('⚠️  39号故事尚未发布\n');
      }
    } else {
      console.log('\n❌ 未找到39号故事（标题：午夜电梯，全死光了）\n');

      // 查找所有故事，看看是否有草稿或待发布的故事
      console.log('📍 查找所有故事（包括草稿）...');
      const allStories = await page.evaluate(() => {
        const storyItems = document.querySelectorAll('.short-article-table-item');
        const stories = [];

        storyItems.forEach((item, index) => {
          try {
            const titleEl = item.querySelector('.article-item-title');
            const title = titleEl ? titleEl.textContent.trim() : '';

            const statusEl = item.querySelector('.arco-tag');
            const status = statusEl ? statusEl.textContent.trim() : '';

            const readCountEl = item.querySelector('.article-item-read-count');
            const readCount = readCountEl ? readCountEl.textContent.trim() : '';

            stories.push({
              index,
              title,
              status,
              readCount,
            });
          } catch (err) {
            // 忽略错误
          }
        });

        return stories;
      });

      if (allStories.length > 0) {
        console.log('\n📊 找到的所有故事：');
        console.log('──────────────────────────────────────────────────');
        allStories.forEach((story) => {
          console.log(`#${story.index + 1} ${story.title} | 状态: ${story.status} | 阅读量: ${story.readCount}`);
        });
        console.log('──────────────────────────────────────────────────\n');

        // 查找草稿或待发布的故事
        const draftStories = allStories.filter(s =>
          s.status.includes('草稿') ||
          s.status.includes('待发布') ||
          s.status.includes('未发布')
        );

        if (draftStories.length > 0) {
          console.log('⚠️  找到草稿或待发布的故事：');
          console.log('──────────────────────────────────────────────────');
          draftStories.forEach((story) => {
            console.log(`#${story.index + 1} ${story.title} | 状态: ${story.status}`);
          });
          console.log('──────────────────────────────────────────────────\n');
        } else {
          console.log('ℹ️  没有找到草稿或待发布的故事\n');
        }
      }
    }

    // 保存检查结果
    const result = {
      timestamp: new Date().toISOString(),
      storyId: 39,
      found: storyInfo.length > 0,
      stories: storyInfo,
    };

    const resultFile = path.join(dataDir, 'check-39-status-result.json');
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

checkStory39();
