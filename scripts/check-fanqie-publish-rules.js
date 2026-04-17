#!/usr/bin/env node

/**
 * 检查番茄小说发布规则
 *
 * 访问番茄小说帮助中心，查找短篇故事的发布规则和要求
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Cookie 文件路径
const COOKIE_PATH = path.join(__dirname, '..', 'cookies', 'latest.json');

// 输出文件路径
const OUTPUT_DIR = path.join(__dirname, '..', '番茄短篇故事集', 'heartbeat-logs');
const OUTPUT_FILE = path.join(OUTPUT_DIR, `fanqie-publish-rules-${new Date().toISOString().slice(0, 10)}.md`);

// 番茄小说帮助中心 URL
const HELP_CENTER_URL = 'https://fanqienovel.com/page/help';

// 短故事创作指南 URL
const SHORT_STORY_GUIDE_URL = 'https://fanqienovel.com/page/shortstoryguide';

// 创作公约 URL
const CREATION_CONVENTION_URL = 'https://fanqienovel.com/page/convention';

/**
 * 加载最新的 Cookie
 */
async function loadCookies(context) {
  if (!fs.existsSync(COOKIE_PATH)) {
    console.log('❌ Cookie 文件不存在');
    return false;
  }

  const cookies = JSON.parse(fs.readFileSync(COOKIE_PATH, 'utf8'));
  await context.addCookies(cookies);

  console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);
  return true;
}

/**
 * 等待一段时间
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 提取页面文本内容
 */
async function extractPageContent(page) {
  // 获取页面标题
  const title = await page.title();

  // 获取主要文本内容
  const content = await page.evaluate(() => {
    // 移除脚本和样式
    const scripts = document.querySelectorAll('script, style');
    scripts.forEach(el => el.remove());

    // 获取主要内容
    const mainContent = document.querySelector('main, article, .content, .help-content');
    if (mainContent) {
      return mainContent.innerText;
    }

    // 如果没有找到主要内容，返回 body 文本
    return document.body.innerText;
  });

  return { title, content };
}

/**
 * 截图
 */
async function takeScreenshot(page, filename) {
  const screenshotPath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`✅ 已保存截图: ${screenshotPath}`);
  return screenshotPath;
}

/**
 * 保存规则到文件
 */
function saveRulesToFile(rules) {
  // 确保输出目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const content = `# 番茄小说发布规则检查报告

**检查时间**: ${new Date().toISOString()}
**检查人**: 自动化脚本

---

## 📋 检查概览

- ✅ 帮助中心: ${rules.helpCenter ? '已访问' : '未访问'}
- ✅ 短故事创作指南: ${rules.shortStoryGuide ? '已访问' : '未访问'}
- ✅ 创作公约: ${rules.creationConvention ? '已访问' : '未访问'}

---

## 📖 帮助中心

${rules.helpCenter ? `
### 页面标题
${rules.helpCenter.title}

### 页面内容
${rules.helpCenter.content}

### 截图
![帮助中心截图](${rules.helpCenter.screenshot})
` : '❌ 未访问帮助中心'}

---

## 📖 短故事创作指南

${rules.shortStoryGuide ? `
### 页面标题
${rules.shortStoryGuide.title}

### 页面内容
${rules.shortStoryGuide.content}

### 截图
![短故事创作指南截图](${rules.shortStoryGuide.screenshot})
` : '❌ 未访问短故事创作指南'}

---

## 📖 创作公约

${rules.creationConvention ? `
### 页面标题
${rules.creationConvention.title}

### 页面内容
${rules.creationConvention.content}

### 截图
![创作公约截图](${rules.creationConvention.screenshot})
` : '❌ 未访问创作公约'}

---

## 🔍 关键发现

${rules.findings.map(finding => `
- ${finding}`).join('\n')}

---

## 📝 发布要求总结

${rules.summary || '待提取...'}

---

**报告生成时间**: ${new Date().toISOString()}
`;

  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
  console.log(`✅ 已保存报告到: ${OUTPUT_FILE}`);
  return OUTPUT_FILE;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始检查番茄小说发布规则...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const rules = {
    helpCenter: null,
    shortStoryGuide: null,
    creationConvention: null,
    findings: [],
    summary: ''
  };

  try {
    // 加载 Cookie
    await loadCookies(context);

    // 1. 访问帮助中心
    console.log('\n📍 1. 访问帮助中心...');
    await page.goto(HELP_CENTER_URL, { waitUntil: 'networkidle' });
    await sleep(2000);

    const helpCenterContent = await extractPageContent(page);
    const helpCenterScreenshot = await takeScreenshot(page, `fanqie-help-center-${Date.now()}.png`);
    rules.helpCenter = {
      title: helpCenterContent.title,
      content: helpCenterContent.content,
      screenshot: helpCenterScreenshot
    };
    console.log('✅ 帮助中心内容已提取');

    // 分析帮助中心内容
    if (helpCenterContent.content.includes('发布') || helpCenterContent.content.includes('规则')) {
      rules.findings.push('✅ 帮助中心包含发布相关规则');
    } else {
      rules.findings.push('⚠️ 帮助中心未找到明确的发布规则');
    }

    // 2. 访问短故事创作指南
    console.log('\n📍 2. 访问短故事创作指南...');
    await page.goto(SHORT_STORY_GUIDE_URL, { waitUntil: 'networkidle' });
    await sleep(2000);

    const shortStoryGuideContent = await extractPageContent(page);
    const shortStoryGuideScreenshot = await takeScreenshot(page, `fanqie-short-story-guide-${Date.now()}.png`);
    rules.shortStoryGuide = {
      title: shortStoryGuideContent.title,
      content: shortStoryGuideContent.content,
      screenshot: shortStoryGuideScreenshot
    };
    console.log('✅ 短故事创作指南内容已提取');

    // 分析短故事创作指南
    if (shortStoryGuideContent.content.includes('发布')) {
      rules.findings.push('✅ 短故事创作指南包含发布相关说明');
      // 提取发布要求
      if (shortStoryGuideContent.content.includes('字数')) {
        const match = shortStoryGuideContent.content.match(/字数[^\n。]+/);
        if (match) rules.findings.push(`📏 字数要求: ${match[0]}`);
      }
      if (shortStoryGuideContent.content.includes('审核')) {
        const match = shortStoryGuideContent.content.match(/审核[^\n。]+/);
        if (match) rules.findings.push(`🔍 审核要求: ${match[0]}`);
      }
    } else {
      rules.findings.push('⚠️ 短故事创作指南未找到明确的发布说明');
    }

    // 3. 访问创作公约
    console.log('\n📍 3. 访问创作公约...');
    await page.goto(CREATION_CONVENTION_URL, { waitUntil: 'networkidle' });
    await sleep(2000);

    const creationConventionContent = await extractPageContent(page);
    const creationConventionScreenshot = await takeScreenshot(page, `fanqie-creation-convention-${Date.now()}.png`);
    rules.creationConvention = {
      title: creationConventionContent.title,
      content: creationConventionContent.content,
      screenshot: creationConventionScreenshot
    };
    console.log('✅ 创作公约内容已提取');

    // 分析创作公约
    if (creationConventionContent.content.includes('禁止')) {
      rules.findings.push('🚫 创作公约包含禁止内容');
      const matches = creationConventionContent.content.match(/禁止[^\n。]+/g);
      if (matches && matches.length > 0) {
        rules.findings.push(`🚫 禁止内容: ${matches.slice(0, 3).join(', ')}`);
      }
    }

    // 总结
    rules.summary = `
根据检查结果，番茄小说的发布流程可能需要满足以下条件：

1. **实名认证**: 可能需要完成实名认证才能发布作品
2. **绑定手机号**: 可能需要绑定手机号才能发布作品
3. **审核机制**: 所有发布的内容都需要经过审核
4. **内容规范**: 需要遵守创作公约，禁止违规内容
5. **新手任务**: 可能需要完成新手任务才能解锁发布功能

建议手动登录账号，检查账号状态和权限设置。
    `;

  } catch (error) {
    console.error('❌ 发生错误:', error.message);
    rules.findings.push(`❌ 检查过程中发生错误: ${error.message}`);
  } finally {
    await browser.close();

    // 保存报告
    const reportPath = saveRulesToFile(rules);
    console.log(`\n✅ 检查完成！报告已保存到: ${reportPath}`);
  }
}

// 运行主函数
main().catch(console.error);
