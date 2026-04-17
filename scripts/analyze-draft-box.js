#!/usr/bin/env node

/**
 * 分析番茄小说草稿箱页面结构
 *
 * 访问短故事管理页面，查找草稿箱，分析草稿箱的结构和操作
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Cookie 文件路径
const COOKIE_PATH = path.join(__dirname, '..', 'cookies', 'latest.json');

// 输出文件路径
const OUTPUT_DIR = path.join(__dirname, '..', '番茄短篇故事集', 'heartbeat-logs');
const OUTPUT_FILE = path.join(OUTPUT_DIR, `draft-box-analysis-${new Date().toISOString().slice(0, 10)}.md`);

// 短故事管理页面 URL
const SHORT_MANAGE_URL = 'https://fanqienovel.com/main/writer/short-manage';

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
 * 截图
 */
async function takeScreenshot(page, filename) {
  const screenshotPath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`✅ 已保存截图: ${screenshotPath}`);
  return screenshotPath;
}

/**
 * 保存分析结果到文件
 */
function saveAnalysisToFile(analysis) {
  // 确保输出目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const content = `# 番茄小说草稿箱页面结构分析报告

**分析时间**: ${new Date().toISOString()}
**分析人**: 自动化脚本

---

## 📋 分析概览

- ✅ 短故事管理页面: ${analysis.shortManagePage ? '已访问' : '未访问'}
- ✅ 草稿箱: ${analysis.draftBox ? '已找到' : '未找到'}
- ✅ 草稿列表: ${analysis.draftList ? '已找到' : '未找到'}
- ✅ 编辑按钮: ${analysis.editButton ? '已找到' : '未找到'}
- ✅ 发布按钮: ${analysis.publishButton ? '已找到' : '未找到'}

---

## 📖 短故事管理页面

${analysis.shortManagePage ? `
### 页面 URL
${SHORT_MANAGE_URL}

### 页面截图
![短故事管理页面截图](${analysis.shortManagePage.screenshot})

### 页面主要内容
${analysis.shortManagePage.content}

### 已发现元素
${analysis.shortManagePage.elements.map(el => `- ${el}`).join('\n')}
` : '❌ 未访问短故事管理页面'}

---

## 📁 草稿箱

${analysis.draftBox ? `
### 草稿箱截图
![草稿箱截图](${analysis.draftBox.screenshot})

### 草稿箱选择器
${analysis.draftBox.selector ? `\`${analysis.draftBox.selector}\`` : '未找到'}

### 草稿箱内容
${analysis.draftBox.content}

### 草稿数量
${analysis.draftBox.count || '未知'}
` : '❌ 未找到草稿箱'}

---

## 📋 草稿列表

${analysis.draftList ? `
### 草稿列表截图
![草稿列表截图](${analysis.draftList.screenshot})

### 草稿项选择器
${analysis.draftList.itemSelector ? `\`${analysis.draftList.itemSelector}\`` : '未找到'}

### 草稿详情
${analysis.draftList.items.map(item => `
#### 草稿 ${item.index}
- 标题: ${item.title || '未知'}
- 状态: ${item.status || '未知'}
- 选择器: ${item.selector || '未知'}
`).join('\n')}
` : '❌ 未找到草稿列表'}

---

## 🖊️ 编辑按钮

${analysis.editButton ? `
### 编辑按钮截图
![编辑按钮截图](${analysis.editButton.screenshot})

### 编辑按钮选择器
${analysis.editButton.selector ? `\`${analysis.editButton.selector}\`` : '未找到'}

### 编辑按钮文本
${analysis.editButton.text || '未知'}
` : '❌ 未找到编辑按钮'}

---

## 🚀 发布按钮

${analysis.publishButton ? `
### 发布按钮截图
![发布按钮截图](${analysis.publishButton.screenshot})

### 发布按钮选择器
${analysis.publishButton.selector ? `\`${analysis.publishButton.selector}\`` : '未找到'}

### 发布按钮文本
${analysis.publishButton.text || '未知'}
` : '❌ 未找到发布按钮'}

---

## 🔍 关键发现

${analysis.findings.map(finding => `
- ${finding}`).join('\n')}

---

## 📝 草稿发布流程总结

${analysis.summary || '待分析...'}

---

## 🎯 下一步行动

${analysis.nextActions.map(action => `
- [ ] ${action}`).join('\n')}

---

**报告生成时间**: ${new Date().toISOString()}
`;

  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
  console.log(`✅ 已保存分析报告到: ${OUTPUT_FILE}`);
  return OUTPUT_FILE;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始分析番茄小说草稿箱页面结构...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const analysis = {
    shortManagePage: null,
    draftBox: null,
    draftList: null,
    editButton: null,
    publishButton: null,
    findings: [],
    summary: '',
    nextActions: []
  };

  try {
    // 加载 Cookie
    await loadCookies(context);

    // 1. 访问短故事管理页面
    console.log('\n📍 1. 访问短故事管理页面...');
    await page.goto(SHORT_MANAGE_URL, { waitUntil: 'networkidle' });
    await sleep(3000);

    const shortManageScreenshot = await takeScreenshot(page, `short-manage-page-${Date.now()}.png`);

    // 获取页面主要内容
    const shortManageContent = await page.evaluate(() => {
      const mainContent = document.querySelector('main, .main, .container, .content');
      return mainContent ? mainContent.innerText : document.body.innerText.slice(0, 500);
    });

    analysis.shortManagePage = {
      screenshot: shortManageScreenshot,
      content: shortManageContent,
      elements: []
    };

    console.log('✅ 短故事管理页面已访问');

    // 2. 查找草稿箱
    console.log('\n📍 2. 查找草稿箱...');

    // 尝试多种草稿箱选择器
    const draftBoxSelectors = [
      '.draft-box',
      '.draft',
      '[class*="draft"]',
      'text=草稿',
      'text=草稿箱',
      '.tab-item:has-text("草稿")',
      '[role="tab"]:has-text("草稿")'
    ];

    let draftBoxElement = null;
    let draftBoxSelector = null;

    for (const selector of draftBoxSelectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout: 2000 });
        if (element) {
          draftBoxElement = element;
          draftBoxSelector = selector;
          console.log(`✅ 找到草稿箱: ${selector}`);
          break;
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }

    if (draftBoxElement) {
      const draftBoxScreenshot = await takeScreenshot(page, `draft-box-${Date.now()}.png`);
      const draftBoxContent = await draftBoxElement.innerText();

      analysis.draftBox = {
        screenshot: draftBoxScreenshot,
        selector: draftBoxSelector,
        content: draftBoxContent
      };
      analysis.shortManagePage.elements.push(`草稿箱: ${draftBoxSelector}`);
      analysis.findings.push('✅ 找到草稿箱');
    } else {
      console.log('❌ 未找到草稿箱');
      analysis.findings.push('❌ 未找到草稿箱');
    }

    // 3. 点击草稿箱标签（如果有）
    if (draftBoxElement) {
      console.log('\n📍 3. 点击草稿箱标签...');
      await draftBoxElement.click();
      await sleep(2000);

      const draftBoxClickedScreenshot = await takeScreenshot(page, `draft-box-clicked-${Date.now()}.png`);

      // 查找草稿列表
      console.log('\n📍 4. 查找草稿列表...');

      const draftListSelectors = [
        '.draft-item',
        '.draft-list-item',
        '[class*="draft-item"]',
        '.story-item',
        '.short-story-item'
      ];

      let draftListItems = [];

      for (const selector of draftListSelectors) {
        try {
          const items = await page.$$(selector);
          if (items && items.length > 0) {
            draftListItems = items;
            console.log(`✅ 找到 ${items.length} 个草稿项: ${selector}`);
            analysis.shortManagePage.elements.push(`草稿列表: ${selector}`);
            break;
          }
        } catch (e) {
          // 继续尝试下一个选择器
        }
      }

      if (draftListItems.length > 0) {
        const draftListScreenshot = await takeScreenshot(page, `draft-list-${Date.now()}.png`);

        const items = [];
        for (let i = 0; i < Math.min(draftListItems.length, 5); i++) {
          const item = draftListItems[i];
          const text = await item.innerText();
          items.push({
            index: i + 1,
            title: text.slice(0, 50),
            status: '草稿',
            selector: draftListSelectors.find(sel => sel) || '未知'
          });
        }

        analysis.draftList = {
          screenshot: draftListScreenshot,
          itemSelector: draftListSelectors.find(sel => sel),
          count: draftListItems.length,
          items: items
        };
        analysis.findings.push(`✅ 找到 ${draftListItems.length} 个草稿`);
      } else {
        console.log('❌ 未找到草稿列表');
        analysis.findings.push('❌ 未找到草稿列表');
      }

      // 5. 点击第一个草稿进行编辑
      if (draftListItems.length > 0) {
        console.log('\n📍 5. 点击第一个草稿进行编辑...');
        await draftListItems[0].click();
        await sleep(3000);

        const draftEditScreenshot = await takeScreenshot(page, `draft-edit-${Date.now()}.png`);

        // 查找编辑按钮
        console.log('\n📍 6. 查找编辑按钮...');

        const editButtonSelectors = [
          '.edit-btn',
          '.edit-button',
          '[class*="edit"]',
          'button:has-text("编辑")',
          'a:has-text("编辑")',
          '.btn:has-text("编辑")'
        ];

        let editButtonElement = null;
        let editButtonSelector = null;

        for (const selector of editButtonSelectors) {
          try {
            const element = await page.waitForSelector(selector, { timeout: 2000 });
            if (element) {
              editButtonElement = element;
              editButtonSelector = selector;
              console.log(`✅ 找到编辑按钮: ${selector}`);
              break;
            }
          } catch (e) {
            // 继续尝试下一个选择器
          }
        }

        if (editButtonElement) {
          const editButtonScreenshot = await takeScreenshot(page, `edit-button-${Date.now()}.png`);
          const editButtonText = await editButtonElement.innerText();

          analysis.editButton = {
            screenshot: editButtonScreenshot,
            selector: editButtonSelector,
            text: editButtonText
          };
          analysis.findings.push('✅ 找到编辑按钮');

          // 点击编辑按钮
          console.log('\n📍 7. 点击编辑按钮...');
          await editButtonElement.click();
          await sleep(3000);

          const editClickedScreenshot = await takeScreenshot(page, `edit-clicked-${Date.now()}.png`);

          // 查找发布按钮
          console.log('\n📍 8. 查找发布按钮...');

          const publishButtonSelectors = [
            '.publish-btn',
            '.publish-button',
            '[class*="publish"]',
            'button:has-text("发布")',
            'a:has-text("发布")',
            '.btn:has-text("发布")',
            '.btn-primary:has-text("发布")',
            '.short-publish-btn'
          ];

          let publishButtonElement = null;
          let publishButtonSelector = null;

          for (const selector of publishButtonSelectors) {
            try {
              const element = await page.waitForSelector(selector, { timeout: 2000 });
              if (element) {
                publishButtonElement = element;
                publishButtonSelector = selector;
                console.log(`✅ 找到发布按钮: ${selector}`);
                break;
              }
            } catch (e) {
              // 继续尝试下一个选择器
            }
          }

          if (publishButtonElement) {
            const publishButtonScreenshot = await takeScreenshot(page, `publish-button-${Date.now()}.png`);
            const publishButtonText = await publishButtonElement.innerText();

            analysis.publishButton = {
              screenshot: publishButtonScreenshot,
              selector: publishButtonSelector,
              text: publishButtonText
            };
            analysis.findings.push('✅ 找到发布按钮（在草稿编辑页面）');
          } else {
            console.log('❌ 未找到发布按钮');
            analysis.findings.push('❌ 未找到发布按钮（在草稿编辑页面）');
          }
        } else {
          console.log('❌ 未找到编辑按钮');
          analysis.findings.push('❌ 未找到编辑按钮');
        }
      }
    }

    // 总结
    analysis.summary = `
根据分析结果，草稿箱发布流程如下：

1. **访问短故事管理页面**: ${SHORT_MANAGE_URL}
2. **点击草稿箱标签**: ${analysis.draftBox ? '✅ 已找到' : '❌ 未找到'}
3. **查看草稿列表**: ${analysis.draftList ? `✅ 找到 ${analysis.draftList.count} 个草稿` : '❌ 未找到'}
4. **点击草稿进行编辑**: ${analysis.editButton ? '✅ 已找到编辑按钮' : '❌ 未找到编辑按钮'}
5. **在编辑页面发布**: ${analysis.publishButton ? '✅ 已找到发布按钮' : '❌ 未找到发布按钮'}

${analysis.publishButton ? '✅ 草稿发布流程已验证！可以通过草稿箱发布故事。' : '⚠️ 草稿发布流程未完全验证，需要进一步分析。'}
    `;

    analysis.nextActions = [
      '如果找到发布按钮，开发从草稿箱发布的自动化脚本',
      '如果未找到发布按钮，手动登录账号检查账号状态和权限',
      '检查是否需要完成实名认证、绑定手机号等设置',
      '检查是否有新手任务未完成',
      '联系番茄小说客服，询问发布流程和限制'
    ];

  } catch (error) {
    console.error('❌ 发生错误:', error.message);
    analysis.findings.push(`❌ 分析过程中发生错误: ${error.message}`);
  } finally {
    await browser.close();

    // 保存分析报告
    const reportPath = saveAnalysisToFile(analysis);
    console.log(`\n✅ 分析完成！报告已保存到: ${reportPath}`);
  }
}

// 运行主函数
main().catch(console.error);
