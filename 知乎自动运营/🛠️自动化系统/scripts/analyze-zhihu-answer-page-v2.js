#!/usr/bin/env node

/**
 * 知乎回答页面数据分析器 v2
 * 改进版本，使用更稳健的选择器和调试输出
 */

const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIE_FILE = path.join(__dirname, '../../auth/cookies.json');
const OUTPUT_DIR = path.join(__dirname, '../../../data/answer-data');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * 提取回答数据（改进版本）
 */
async function extractAnswerData(page) {
  console.log('\n📊 开始提取数据...\n');

  // 先保存页面 HTML 用于调试
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const htmlFile = path.join(OUTPUT_DIR, `page-html-${timestamp}.html`);
  const htmlContent = await page.content();
  fs.writeFileSync(htmlFile, htmlContent);
  console.log(`💾 页面 HTML 已保存到: ${htmlFile}\n`);

  // 提取数据
  const data = await page.evaluate(() => {
    console.log('[浏览器环境] 开始提取数据...');

    const result = {
      pageInfo: {
        url: window.location.href,
        title: document.title
      },
      question: {},
      author: {},
      answer: {},
      metrics: {},
      topics: []
    };

    // 尝试多种选择器
    const selectors = {
      questionTitle: [
        '.QuestionHeader-title',
        'h1.QuestionHeader-title',
        '[data-zop-feedlist="question"] h1'
      ],
      questionExcerpt: [
        '.QuestionHeader-detail',
        '.QuestionHeader-text'
      ],
      authorName: [
        '.AuthorInfo-name span',
        '.AuthorInfo-name',
        '.UserLink-link'
      ],
      authorAvatar: [
        '.AuthorInfo-avatar img',
        '.Avatar img'
      ],
      answerContent: [
        '.RichContent-inner',
        '.RichContent',
        '.Post-RichText'
      ],
      voteupCount: [
        '.VoteButton--up .VoteButton-label',
        'button.VoteButton--up .VoteButton-label'
      ],
      commentCount: [
        '.ContentItem-action button[data-zop-btn-type="like"]',
        '.ContentItem-action .Button--plain'
      ],
      collectCount: [
        '.ContentItem-action button[data-zop-btn-type="collect"] span'
      ],
      topics: [
        '.Tag.QuestionTopic .Tag-content',
        '.QuestionHeader-topics .Tag'
      ]
    };

    // 辅助函数：尝试多个选择器
    function trySelectors(selectorList, parent = document) {
      for (const selector of selectorList) {
        try {
          const element = parent.querySelector(selector);
          if (element) {
            console.log(`[选择器] 找到元素: ${selector}`);
            return element;
          }
        } catch (e) {
          // 忽略错误，继续尝试下一个选择器
        }
      }
      console.log(`[选择器] 未找到元素: ${selectorList.join(', ')}`);
      return null;
    }

    // 提取问题标题
    const questionTitle = trySelectors(selectors.questionTitle);
    if (questionTitle) {
      result.question.title = questionTitle.textContent.trim();
      console.log(`[数据] 问题标题: ${result.question.title}`);
    }

    // 提取问题 ID
    const urlMatch = window.location.pathname.match(/\/question\/(\d+)/);
    if (urlMatch) {
      result.question.id = urlMatch[1];
      console.log(`[数据] 问题 ID: ${result.question.id}`);
    }

    // 提取作者信息
    const authorName = trySelectors(selectors.authorName);
    if (authorName) {
      result.author.name = authorName.textContent.trim();
      console.log(`[数据] 作者: ${result.author.name}`);
    }

    // 提取回答内容
    const answerContent = trySelectors(selectors.answerContent);
    if (answerContent) {
      result.answer.content = answerContent.innerHTML.substring(0, 500); // 只保存前 500 字符
      result.answer.wordCount = answerContent.textContent.length;
      console.log(`[数据] 回答字数: ${result.answer.wordCount}`);
    }

    // 提取赞同数
    const voteupBtn = trySelectors(selectors.voteupCount);
    if (voteupBtn) {
      const text = voteupBtn.textContent.trim();
      result.metrics.voteupCount = parseInt(text.replace(/[^\d]/g, '')) || 0;
      console.log(`[数据] 赞同数: ${result.metrics.voteupCount}`);
    }

    // 提取评论数（通过文本查找）
    const allButtons = document.querySelectorAll('.ContentItem-action button, .ContentItem-action span');
    allButtons.forEach(btn => {
      const text = btn.textContent.trim();
      if (text.includes('条评论') || text.match(/\d+ 条评论/)) {
        const match = text.match(/(\d+)/);
        if (match) {
          result.metrics.commentCount = parseInt(match[1]) || 0;
          console.log(`[数据] 评论数: ${result.metrics.commentCount}`);
        }
      }
    });

    // 提取收藏数
    const collectBtn = trySelectors(selectors.collectCount);
    if (collectBtn) {
      const text = collectBtn.textContent.trim();
      result.metrics.collectCount = parseInt(text.replace(/[^\d]/g, '')) || 0;
      console.log(`[数据] 收藏数: ${result.metrics.collectCount}`);
    }

    // 提取话题标签
    const topicElements = document.querySelectorAll('.Tag.QuestionTopic, .QuestionHeader-topics .Tag');
    topicElements.forEach((tag) => {
      const text = tag.textContent.trim();
      if (text && text.length < 50) {
        result.topics.push(text);
      }
    });
    if (result.topics.length > 0) {
      console.log(`[数据] 话题标签: ${result.topics.join(', ')}`);
    }

    console.log('[浏览器环境] 数据提取完成');
    return result;
  });

  console.log('✅ 数据提取完成\n');

  // 保存数据到文件
  const timestamp2 = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(OUTPUT_DIR, `answer-data-${timestamp2}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
  console.log(`💾 数据已保存到: ${outputFile}\n`);

  // 截图
  const screenshotFile = path.join(OUTPUT_DIR, `screenshot-${timestamp2}.png`);
  await page.screenshot({ path: screenshotFile, fullPage: false });
  console.log(`📸 截图已保存到: ${screenshotFile}\n`);

  console.log('📋 提取的数据：');
  console.log(JSON.stringify(data, null, 2));

  return data;
}

/**
 * 主函数
 */
async function main() {
  const url = process.argv[2] || 'https://www.zhihu.com/question/434962982/answer/1620538220';

  console.log('========================================');
  console.log('  知乎回答页面数据分析器 v2');
  console.log('========================================\n');

  const browser = await playwright.chromium.launch({
    headless: true // 使用 headless 模式
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`📍 正在访问: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
    console.log('✅ 页面加载成功\n');

    // 等待页面稳定
    await page.waitForTimeout(3000);

    // 提取数据
    const data = await extractAnswerData(page);

    console.log('\n✅ 分析完成');
    console.log('⏳ 浏览器将在 10 秒后关闭...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ 发生错误:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
