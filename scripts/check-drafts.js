#!/usr/bin/env node

/**
 * 检查番茄小说草稿列表
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

async function checkDrafts() {
  console.log('🔍 检查番茄小说草稿列表...\n');

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

    // 查找草稿相关链接
    console.log('📍 查找草稿相关链接...');
    const draftLinks = await page.evaluate(() => {
      const links = [];

      // 查找所有链接
      const allLinks = document.querySelectorAll('a');
      allLinks.forEach(link => {
        const text = link.textContent.trim();
        const href = link.getAttribute('href');

        // 查找包含"草稿"关键词的链接
        if (text.includes('草稿') || text.includes('待发布') || text.includes('未发布')) {
          links.push({
            text,
            href,
          });
        }
      });

      return links;
    });

    if (draftLinks.length > 0) {
      console.log('\n✅ 找到草稿相关链接！');
      console.log('──────────────────────────────────────────────────');
      draftLinks.forEach((link, index) => {
        console.log(`#${index + 1} ${link.text}`);
        console.log(`   URL: ${link.href}`);
      });
      console.log('──────────────────────────────────────────────────\n');
    } else {
      console.log('\nℹ️  未找到草稿相关链接\n');
    }

    // 截图
    const screenshot = path.join(dataDir, 'short-manage-drafts.png');
    await page.screenshot({ path: screenshot, fullPage: true });
    console.log(`📸 截图已保存: ${screenshot}\n`);

    // 尝试访问草稿页面
    console.log('📍 尝试访问草稿页面...');
    try {
      // 尝试访问常见的草稿页面URL
      const draftUrls = [
        'https://fanqienovel.com/main/writer/short-manage?tab=draft',
        'https://fanqienovel.com/main/writer/short-manage?status=0',
        'https://fanqienovel.com/main/writer/short-manage/draft',
      ];

      for (const draftUrl of draftUrls) {
        try {
          console.log(`   尝试: ${draftUrl}`);
          await page.goto(draftUrl, {
            waitUntil: 'networkidle',
            timeout: 10000,
          });
          await page.waitForTimeout(2000);

          // 检查是否有草稿内容
          const hasDraft = await page.evaluate(() => {
            const items = document.querySelectorAll('.short-article-table-item');
            return items.length > 0;
          });

          if (hasDraft) {
            console.log(`   ✅ 找到草稿页面: ${draftUrl}`);

            // 获取草稿列表
            const drafts = await page.evaluate(() => {
              const items = document.querySelectorAll('.short-article-table-item');
              const drafts = [];

              items.forEach((item) => {
                try {
                  const titleEl = item.querySelector('.article-item-title');
                  const title = titleEl ? titleEl.textContent.trim() : '';

                  drafts.push({
                    title,
                  });
                } catch (err) {
                  // 忽略错误
                }
              });

              return drafts;
            });

            console.log('\n📊 草稿列表：');
            console.log('──────────────────────────────────────────────────');
            drafts.forEach((draft, index) => {
              console.log(`#${index + 1} ${draft.title}`);
            });
            console.log('──────────────────────────────────────────────────\n');

            break;
          }
        } catch (err) {
          // 忽略错误，继续尝试下一个URL
          console.log(`   ❌ ${err.message}`);
        }
      }
    } catch (err) {
      console.error(`   ❌ 访问草稿页面失败: ${err.message}`);
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

checkDrafts();
