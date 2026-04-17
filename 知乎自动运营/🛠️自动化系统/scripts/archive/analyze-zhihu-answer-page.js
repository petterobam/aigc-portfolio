#!/usr/bin/env node

/**
 * 分析知乎回答页面的数据结构
 *
 * 目标：
 * 1. 提取回答的基本信息（标题、作者、内容、赞同数、收藏数、评论数）
 * 2. 分析页面 DOM 结构
 * 3. 找到关键元素的选择器
 *
 * 使用方法：
 * node analyze-zhihu-answer-page.js <回答URL>
 *
 * 示例：
 * node analyze-zhihu-answer-page.js "https://www.zhihu.com/question/123456789/answer/987654321"
 */

const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

// Cookie 文件路径
const COOKIE_FILE = path.join(__dirname, '../../auth/cookies.json');
const OUTPUT_DIR = path.join(__dirname, '../../data/answer-data');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * 加载 Cookie
 */
async function loadCookies(context) {
  try {
    if (fs.existsSync(COOKIE_FILE)) {
      const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf8'));
      await context.addCookies(cookies);
      console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);
      return true;
    } else {
      console.log('❌ Cookie 文件不存在，请先提取 Cookie');
      return false;
    }
  } catch (error) {
    console.error('❌ 加载 Cookie 失败:', error.message);
    return false;
  }
}

/**
 * 分析回答页面数据结构
 */
async function analyzeAnswerPage(page, url) {
  console.log('\n📊 开始分析回答页面数据结构...\n');

  // 导航到页面
  console.log(`📍 导航到: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle' });

  // 等待页面加载完成
  await page.waitForTimeout(2000);

  // 检查是否跳转到登录页
  const currentUrl = page.url();
  if (currentUrl.includes('signin') || currentUrl.includes('login')) {
    console.log('❌ 页面跳转到登录页，Cookie 可能已失效');
    return null;
  }

  console.log('✅ 页面加载成功\n');

  // 提取回答数据
  const answerData = await page.evaluate(() => {
    const data = {
      // 页面基本信息
      pageInfo: {
        url: window.location.href,
        title: document.title
      },

      // 提问信息
      question: {
        title: null,
        id: null,
        excerpt: null
      },

      // 作者信息
      author: {
        name: null,
        id: null,
        avatar: null,
        bio: null,
        followerCount: null
      },

      // 回答信息
      answer: {
        content: null,
        wordCount: 0,
        publishTime: null,
        editTime: null
      },

      // 互动数据
      metrics: {
        voteupCount: 0,
        commentCount: 0,
        thanksCount: 0,
       收藏数: 0
      },

      // 话题标签
      topics: [],

      // DOM 选择器（用于后续自动化）
      selectors: {}
    };

    // 提取提问信息
    const questionTitle = document.querySelector('.QuestionHeader-title');
    if (questionTitle) {
      data.question.title = questionTitle.textContent.trim();
      data.question.id = window.location.pathname.match(/\/question\/(\d+)/)?.[1];
    }

    const questionExcerpt = document.querySelector('.QuestionHeader-detail');
    if (questionExcerpt) {
      data.question.excerpt = questionExcerpt.textContent.trim();
    }

    // 提取作者信息
    const authorName = document.querySelector('.AuthorInfo-name span');
    if (authorName) {
      data.author.name = authorName.textContent.trim();
    }

    const authorLink = document.querySelector('.AuthorInfo-name a');
    if (authorLink) {
      data.author.id = authorLink.getAttribute('href').replace('/people/', '');
    }

    const authorAvatar = document.querySelector('.AuthorInfo-avatar img');
    if (authorAvatar) {
      data.author.avatar = authorAvatar.getAttribute('src');
    }

    const authorBio = document.querySelector('.AuthorInfo-headline');
    if (authorBio) {
      data.author.bio = authorBio.textContent.trim();
    }

    // 提取回答内容
    const answerContent = document.querySelector('.RichContent-inner');
    if (answerContent) {
      data.answer.content = answerContent.innerHTML;
      data.answer.wordCount = answerContent.textContent.length;

      // 提取发布时间和编辑时间
      const timeElements = document.querySelectorAll('.ContentItem-time');
      timeElements.forEach((el) => {
        const text = el.textContent.trim();
        if (text.includes('发布于')) {
          data.answer.publishTime = text.replace('发布于', '').trim();
        } else if (text.includes('编辑于')) {
          data.answer.editTime = text.replace('编辑于', '').trim();
        }
      });
    }

    // 提取互动数据
    const voteupBtn = document.querySelector('.VoteButton--up .VoteButton-label');
    if (voteupBtn) {
      data.metrics.voteupCount = parseInt(voteupBtn.textContent.replace(/,/g, '')) || 0;
    }

    const commentBtn = document.querySelector('.ContentItem-action button[data-zop-btn-type="like"]')?.nextElementSibling;
    if (commentBtn) {
      const commentText = commentBtn.textContent;
      data.metrics.commentCount = parseInt(commentText.replace(/[^0-9]/g, '')) || 0;
    }

    const collectBtn = document.querySelector('.ContentItem-action button[data-zop-btn-type="collect"] span');
    if (collectBtn) {
      data.metrics.收藏数 = parseInt(collectBtn.textContent.replace(/,/g, '')) || 0;
    }

    // 提取话题标签
    const topicTags = document.querySelectorAll('.Tag.QuestionTopic .Tag-content');
    topicTags.forEach((tag) => {
      const tagText = tag.textContent.trim();
      if (tagText) {
        data.topics.push(tagText);
      }
    });

    return data;
  });

  console.log('✅ 数据提取完成\n');
  console.log('📋 提取的数据：');
  console.log(JSON.stringify(answerData, null, 2));

  // 保存数据到文件
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(OUTPUT_DIR, `answer-analysis-${timestamp}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(answerData, null, 2));
  console.log(`\n💾 数据已保存到: ${outputFile}`);

  // 截图
  const screenshotFile = path.join(OUTPUT_DIR, `answer-screenshot-${timestamp}.png`);
  await page.screenshot({ path: screenshotFile, fullPage: false });
  console.log(`📸 截图已保存到: ${screenshotFile}`);

  return answerData;
}

/**
 * 主函数
 */
async function main() {
  // 获取命令行参数
  const url = process.argv[2];
  if (!url) {
    console.error('❌ 请提供知乎回答 URL');
    console.error('使用方法: node analyze-zhihu-answer-page.js <回答URL>');
    process.exit(1);
  }

  console.log('========================================');
  console.log('  知乎回答页面数据分析器');
  console.log('========================================\n');

  // 启动浏览器
  const browser = await playwright.chromium.launch({
    headless: false // 显示浏览器窗口，方便调试
  });

  const context = await browser.newContext();

  // 加载 Cookie（可选）
  const cookieLoaded = await loadCookies(context);
  if (!cookieLoaded) {
    console.log('⚠️  将在无 Cookie 模式下运行（部分数据可能无法获取）\n');
  }

  // 创建页面
  const page = await context.newPage();

  try {
    // 分析回答页面
    const data = await analyzeAnswerPage(page, url);

    if (!data) {
      console.log('❌ 分析失败');
      await browser.close();
      process.exit(1);
    }

    console.log('\n✅ 分析完成');

    // 保持浏览器打开 5 秒，方便查看
    console.log('\n⏳ 浏览器将在 5 秒后关闭...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ 发生错误:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

// 运行主函数
main().catch(console.error);
