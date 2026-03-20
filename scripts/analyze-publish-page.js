/**
 * 番茄小说发布页面结构分析脚本
 *
 * 目标：
 * 1. 访问番茄小说发布页面
 * 2. 分析页面结构（标题、简介、正文等字段）
 * 3. 保存页面截图和 HTML
 * 4. 提取需要填充的字段信息
 * 5. 分析发布操作步骤
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// 使用专用的用户数据目录（与数据抓取脚本共享，保持登录状态）
const USER_DATA_DIR = path.join(__dirname, '../data/chrome-user-data');

async function analyzePublishPage() {
  console.log('\n========================================');
  console.log('📚 番茄小说发布页面结构分析');
  console.log('========================================\n');

  console.log('🚀 启动浏览器（使用 Chrome）...\n');

  const browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    channel: 'chrome',
    viewport: { width: 1920, height: 1080 },
    args: [
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const pages = browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  try {
    // 步骤1：访问短故事管理页面
    console.log('📡 步骤 1: 访问短故事管理页面...');
    await page.goto('https://fanqienovel.com/main/writer/short-manage', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    // 检查是否需要登录
    const url = page.url();
    if (url.includes('login') || url.includes('passport')) {
      console.log('\n⚠️  需要登录！');
      console.log('请在浏览器中完成登录...');
      console.log('登录成功后，脚本会自动继续\n');

      await page.waitForURL('**/writer/short-manage**', {
        timeout: 600000,
      });

      console.log('✅ 登录成功！\n');
    } else {
      console.log('✅ 已登录状态\n');
    }

    await page.waitForTimeout(2000);

    // 步骤2：寻找"发布"或"新建"按钮
    console.log('🔍 步骤 2: 寻找发布入口...\n');

    // 尝试多种可能的选择器
    const possibleSelectors = [
      'a[href*="publish"]',
      'a[href*="new"]',
      'a[href*="create"]',
      'button:has-text("发布")',
      'button:has-text("新建")',
      'button:has-text("创作")',
      '.arco-btn-primary',
      '.publish-button',
    ];

    let publishUrl = null;
    let publishButton = null;

    for (const selector of possibleSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          const href = await element.getAttribute('href');

          console.log(`找到元素: ${selector}`);
          console.log(`  文本: "${text}"`);
          console.log(`  Href: "${href}"`);

          if (href && (href.includes('publish') || href.includes('new') || href.includes('create'))) {
            publishUrl = href;
            publishButton = element;
            console.log(`  ✅ 这是发布入口！`);
            break;
          }
        }
      } catch (e) {
        // 忽略错误
      }
    }

    if (!publishUrl) {
      console.log('\n⚠️  未找到发布按钮，尝试直接访问发布页面 URL...\n');

      // 常见的发布页面 URL
      const possibleUrls = [
        'https://fanqienovel.com/main/writer/publish-short',
        'https://fanqienovel.com/main/writer/new-short',
        'https://fanqienovel.com/main/writer/create-short',
        'https://fanqienovel.com/page/short/publish',
      ];

      for (const url of possibleUrls) {
        console.log(`尝试访问: ${url}`);
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

          await page.waitForTimeout(3000);

          // 检查页面是否成功加载（通过检查是否存在标题输入框）
          const titleInput = await page.$('input[type="text"], textarea');
          if (titleInput) {
            publishUrl = url;
            console.log(`✅ 成功访问发布页面: ${url}\n`);
            break;
          }
        } catch (e) {
          console.log(`  ❌ 失败: ${e.message}`);
        }
      }
    } else {
      console.log(`\n🎯 找到发布入口: ${publishUrl}`);

      // 构建完整 URL
      if (publishUrl.startsWith('/')) {
        publishUrl = 'https://fanqienovel.com' + publishUrl;
      }

      console.log(`📡 访问发布页面: ${publishUrl}\n`);

      // 点击发布按钮或直接访问
      await page.goto(publishUrl, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
    }

    if (!publishUrl) {
      console.log('\n❌ 无法访问发布页面');
      console.log('请手动检查番茄小说平台的发布入口位置\n');
      return;
    }

    await page.waitForTimeout(3000);

    // 步骤3：分析页面结构
    console.log('📊 步骤 3: 分析页面结构...\n');

    const pageStructure = await page.evaluate(() => {
      const result = {
        url: window.location.href,
        title: document.title,
        forms: [],
        inputs: [],
        buttons: [],
        textareas: [],
        selects: [],
      };

      // 查找所有表单
      document.querySelectorAll('form, .arco-form').forEach((form, index) => {
        const formInfo = {
          index,
          id: form.id || '',
          className: form.className || '',
          action: form.action || '',
          method: form.method || '',
          inputs: [],
        };

        // 查找表单内的输入框
        form.querySelectorAll('input, textarea, select').forEach((input) => {
          const inputInfo = {
            tag: input.tagName,
            type: input.type || input.getAttribute('data-type') || 'text',
            id: input.id || '',
            name: input.name || input.getAttribute('name') || '',
            className: input.className || '',
            placeholder: input.placeholder || '',
            value: input.value || '',
            required: input.required || input.getAttribute('aria-required') === 'true',
            visible: input.offsetParent !== null,
          };

          // 尝试找到标签
          const label = document.querySelector(`label[for="${input.id}"]`) ||
                       input.parentElement?.querySelector('label') ||
                       input.parentElement?.textContent?.slice(0, 50);

          if (label && typeof label === 'string') {
            inputInfo.label = label.trim();
          } else if (label) {
            inputInfo.label = label.textContent.trim().slice(0, 50);
          }

          formInfo.inputs.push(inputInfo);
        });

        if (formInfo.inputs.length > 0) {
          result.forms.push(formInfo);
        }
      });

      // 查找所有按钮
      document.querySelectorAll('button, .arco-btn').forEach((button) => {
        const buttonInfo = {
          tag: button.tagName,
          id: button.id || '',
          className: button.className || '',
          text: button.textContent.trim(),
          type: button.type || 'button',
          disabled: button.disabled || button.getAttribute('disabled') === 'disabled',
        };

        if (buttonInfo.text && buttonInfo.text.length > 0) {
          result.buttons.push(buttonInfo);
        }
      });

      return result;
    });

    console.log('📄 页面信息：');
    console.log(`  URL: ${pageStructure.url}`);
    console.log(`  标题: ${pageStructure.title}\n`);

    console.log(`📝 找到 ${pageStructure.forms.length} 个表单：\n`);

    pageStructure.forms.forEach((form, index) => {
      console.log(`表单 ${index + 1}:`);
      console.log(`  ID: ${form.id}`);
      console.log(`  Class: ${form.className}`);
      console.log(`  Action: ${form.action}`);
      console.log(`  Method: ${form.method}`);
      console.log(`  输入字段数量: ${form.inputs.length}\n`);

      console.log(`  输入字段：`);
      form.inputs.forEach((input, inputIndex) => {
        console.log(`    ${inputIndex + 1}. ${input.label || '无标签'}`);
        console.log(`       类型: ${input.type}`);
        console.log(`       ID: ${input.id}`);
        console.log(`       Name: ${input.name}`);
        console.log(`       Placeholder: ${input.placeholder}`);
        console.log(`       必填: ${input.required ? '是' : '否'}`);
        console.log(`       可见: ${input.visible ? '是' : '否'}`);
        console.log('');
      });
    });

    console.log(`🔘 找到 ${pageStructure.buttons.length} 个按钮：\n`);

    pageStructure.buttons.forEach((button, index) => {
      if (index < 20) { // 只显示前20个按钮
        console.log(`${index + 1}. "${button.text}"`);
        console.log(`   类型: ${button.type}`);
        console.log(`   ID: ${button.id}`);
        console.log(`   Class: ${button.className}`);
        console.log(`   禁用: ${button.disabled ? '是' : '否'}`);
        console.log('');
      }
    });

    // 步骤4：保存页面信息
    console.log('💾 步骤 4: 保存页面信息...\n');

    // 保存页面结构 JSON
    const structurePath = path.join(__dirname, `../data/publish-page-structure-${timestamp}.json`);
    fs.writeFileSync(structurePath, JSON.stringify(pageStructure, null, 2), 'utf8');
    console.log('✅ 页面结构已保存:', structurePath);

    // 截图
    const screenshotPath = path.join(__dirname, `../data/publish-page-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('✅ 截图已保存:', screenshotPath);

    // 保存页面 HTML
    const html = await page.content();
    const htmlPath = path.join(__dirname, `../data/publish-page-${timestamp}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('✅ 页面 HTML 已保存:', htmlPath);

    // 步骤5：生成分析报告
    console.log('\n📊 步骤 5: 生成分析报告...\n');

    const report = {
      timestamp,
      publishUrl: pageStructure.url,
      analysis: {
        // 关键字段识别
        titleField: pageStructure.forms[0]?.inputs.find(i => i.placeholder?.includes('标题') || i.label?.includes('标题')),
        introField: pageStructure.forms[0]?.inputs.find(i => i.placeholder?.includes('简介') || i.label?.includes('简介') || i.placeholder?.includes('介绍')),
        contentField: pageStructure.forms[0]?.inputs.find(i => i.placeholder?.includes('正文') || i.label?.includes('正文') || i.placeholder?.includes('内容')),
        tagsField: pageStructure.forms[0]?.inputs.find(i => i.placeholder?.includes('标签') || i.label?.includes('标签')),
        coverField: pageStructure.forms[0]?.inputs.find(i => i.placeholder?.includes('封面') || i.label?.includes('封面') || i.type === 'file'),

        // 关键按钮识别
        publishButton: pageStructure.buttons.find(b => b.text?.includes('发布') || b.text?.includes('提交')),
        saveButton: pageStructure.buttons.find(b => b.text?.includes('保存') || b.text?.includes('草稿')),
        previewButton: pageStructure.buttons.find(b => b.text?.includes('预览')),
      },
      recommendations: [
        '建议使用 Arco Design 组件库的选择器',
        '建议先检查必填字段再填充',
        '建议模拟真实用户输入行为（逐字输入）',
        '建议添加等待时间确保页面响应',
        '建议添加错误处理和重试机制',
      ],
      nextSteps: [
        '开发自动填充字段的脚本',
        '实现自动上传封面功能',
        '实现自动发布流程',
        '开发数据验证机制',
        '集成到自动化运营体系',
      ],
    };

    const reportPath = path.join(__dirname, `../data/publish-page-analysis-${timestamp}.md`);
    const reportContent = `# 番茄小说发布页面分析报告

**生成时间**: ${timestamp}
**分析URL**: ${report.publishUrl}

---

## 关键字段

### 标题字段
${report.analysis.titleField ? `\`\`\`json
${JSON.stringify(report.analysis.titleField, null, 2)}
\`\`\`` : '❌ 未找到标题字段'}

### 简介字段
${report.analysis.introField ? `\`\`\`json
${JSON.stringify(report.analysis.introField, null, 2)}
\`\`\`` : '❌ 未找到简介字段'}

### 正文字段
${report.analysis.contentField ? `\`\`\`json
${JSON.stringify(report.analysis.contentField, null, 2)}
\`\`\`` : '❌ 未找到正文字段'}

### 标签字段
${report.analysis.tagsField ? `\`\`\`json
${JSON.stringify(report.analysis.tagsField, null, 2)}
\`\`\`` : '❌ 未找到标签字段'}

### 封面字段
${report.analysis.coverField ? `\`\`\`json
${JSON.stringify(report.analysis.coverField, null, 2)}
\`\`\`` : '❌ 未找到封面字段'}

---

## 关键按钮

### 发布按钮
${report.analysis.publishButton ? `\`\`\`json
${JSON.stringify(report.analysis.publishButton, null, 2)}
\`\`\`` : '❌ 未找到发布按钮'}

### 保存按钮
${report.analysis.saveButton ? `\`\`\`json
${JSON.stringify(report.analysis.saveButton, null, 2)}
\`\`\`` : '❌ 未找到保存按钮'}

### 预览按钮
${report.analysis.previewButton ? `\`\`\`json
${JSON.stringify(report.analysis.previewButton, null, 2)}
\`\`\`` : '❌ 未找到预览按钮'}

---

## 建议

${report.recommendations.map(r => `- ${r}`).join('\n')}

---

## 下一步

${report.nextSteps.map(s => `- ${s}`).join('\n')}

---

## 相关文件

- 页面结构: \`publish-page-structure-${timestamp}.json\`
- 页面截图: \`publish-page-${timestamp}.png\`
- 页面 HTML: \`publish-page-${timestamp}.html\`
`;

    fs.writeFileSync(reportPath, reportContent, 'utf8');
    console.log('✅ 分析报告已保存:', reportPath);

    console.log('\n========================================');
    console.log('✅ 分析完成！');
    console.log('========================================\n');

    console.log('📋 关键发现：');
    console.log(`- 发布页面 URL: ${report.publishUrl}`);
    console.log(`- 找到 ${pageStructure.forms.length} 个表单`);
    console.log(`- 找到 ${pageStructure.forms[0]?.inputs.length || 0} 个输入字段`);
    console.log(`- 找到 ${pageStructure.buttons.length} 个按钮`);
    console.log('');

    if (report.analysis.titleField) {
      console.log(`✅ 找到标题字段: ${report.analysis.titleField.id || report.analysis.titleField.name}`);
    }
    if (report.analysis.contentField) {
      console.log(`✅ 找到正文字段: ${report.analysis.contentField.id || report.analysis.contentField.name}`);
    }
    if (report.analysis.publishButton) {
      console.log(`✅ 找到发布按钮: "${report.analysis.publishButton.text}"`);
    }

    console.log('');

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);

    const errorLog = path.join(__dirname, `../data/analyze-publish-error-${timestamp}.log`);
    fs.writeFileSync(errorLog, `${new Date().toISOString()}\n${error.stack}`, 'utf8');
    console.log('错误日志已保存:', errorLog);

  } finally {
    // 立即关闭浏览器
    console.log('\n🔒 关闭浏览器...\n');
    await browser.close();
    console.log('✅ 浏览器已关闭');
  }
}

// 运行
analyzePublishPage().catch(console.error);
