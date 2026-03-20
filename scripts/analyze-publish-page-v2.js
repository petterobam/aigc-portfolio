/**
 * 番茄小说发布页面结构分析脚本 V2
 *
 * 改进点：
 * 1. 支持动态渲染的组件（Vue/React）
 * 2. 查找 contenteditable 元素（富文本编辑器）
 * 3. 查找自定义输入组件
 * 4. 更长等待时间
 * 5. 更智能的字段识别
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// 使用专用的用户数据目录
const USER_DATA_DIR = path.join(__dirname, '../data/chrome-user-data');

async function analyzePublishPageV2() {
  console.log('\n========================================');
  console.log('📚 番茄小说发布页面结构分析 V2');
  console.log('  支持动态组件 + 富文本编辑器');
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

    // 步骤2：访问发布页面
    console.log('🔍 步骤 2: 访问发布页面...\n');

    // 直接访问发布页面（已知 URL）
    const publishUrl = 'https://fanqienovel.com/main/writer/publish-short/?enter_from=NEWCHAPTER_1';
    console.log(`📡 访问发布页面: ${publishUrl}\n`);

    await page.goto(publishUrl, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    // 等待页面完全加载（动态渲染需要更长时间）
    console.log('⏳ 等待页面完全加载...');
    await page.waitForTimeout(5000);

    // 步骤3：智能分析页面结构
    console.log('📊 步骤 3: 智能分析页面结构...\n');

    const pageStructure = await page.evaluate(() => {
      const result = {
        url: window.location.href,
        title: document.title,
        inputFields: [],
        buttons: [],
        richTextEditors: [],
        uploadAreas: [],
      };

      // 查找所有标准输入字段
      document.querySelectorAll('input, textarea, select').forEach((input) => {
        const inputInfo = {
          tag: input.tagName,
          type: input.type || 'text',
          id: input.id || '',
          name: input.name || '',
          className: input.className || '',
          placeholder: input.placeholder || '',
          value: input.value || '',
          required: input.required || input.getAttribute('aria-required') === 'true',
          visible: input.offsetParent !== null,
          disabled: input.disabled,
        };

        // 查找标签
        const label = document.querySelector(`label[for="${input.id}"]`) ||
                     input.parentElement?.querySelector('label') ||
                     input.parentElement?.parentElement?.querySelector('label');

        if (label) {
          inputInfo.label = label.textContent.trim().slice(0, 100);
        }

        // 查找父容器（可能有特定类名）
        if (input.parentElement) {
          inputInfo.parentElementClass = input.parentElement.className;
          inputInfo.parentElementId = input.parentElement.id;
        }

        result.inputFields.push(inputInfo);
      });

      // 查找 contenteditable 元素（富文本编辑器）
      document.querySelectorAll('[contenteditable="true"], [contenteditable=""]').forEach((editor, index) => {
        const editorInfo = {
          tag: editor.tagName,
          id: editor.id || '',
          className: editor.className || '',
          index,
          text: editor.textContent?.slice(0, 100) || '',
          html: editor.innerHTML?.slice(0, 200) || '',
          visible: editor.offsetParent !== null,
          placeholder: editor.getAttribute('data-placeholder') || '',
        };

        // 查找父容器
        if (editor.parentElement) {
          editorInfo.parentElementClass = editor.parentElement.className;
          editorInfo.parentElementId = editor.parentElement.id;
        }

        result.richTextEditors.push(editorInfo);
      });

      // 查找上传区域（文件上传）
      document.querySelectorAll('input[type="file"], .upload, .arco-upload, .ant-upload').forEach((upload, index) => {
        const uploadInfo = {
          tag: upload.tagName,
          id: upload.id || '',
          className: upload.className || '',
          type: upload.type || 'div',
          index,
          visible: upload.offsetParent !== null,
          accept: upload.accept || '',
        };

        // 查找提示文本
        const text = upload.textContent || upload.querySelector('.arco-upload-drag-text')?.textContent || '';
        uploadInfo.text = text.trim().slice(0, 100);

        result.uploadAreas.push(uploadInfo);
      });

      // 查找所有按钮
      document.querySelectorAll('button, .arco-btn, [role="button"]').forEach((button) => {
        const buttonInfo = {
          tag: button.tagName,
          id: button.id || '',
          className: button.className || '',
          text: button.textContent.trim(),
          type: button.type || 'button',
          role: button.getAttribute('role') || '',
          disabled: button.disabled || button.getAttribute('disabled') === 'disabled' || button.classList.contains('arco-btn-disabled'),
          visible: button.offsetParent !== null,
        };

        if (buttonInfo.text && buttonInfo.text.length > 0 && buttonInfo.text.length < 100) {
          result.buttons.push(buttonInfo);
        }
      });

      return result;
    });

    console.log('📄 页面信息：');
    console.log(`  URL: ${pageStructure.url}`);
    console.log(`  标题: ${pageStructure.title}\n`);

    // 显示输入字段
    console.log(`📝 找到 ${pageStructure.inputFields.length} 个标准输入字段：\n`);

    pageStructure.inputFields.forEach((input, index) => {
      console.log(`${index + 1}. ${input.label || '无标签'} [${input.type}]`);
      console.log(`   ID: ${input.id}`);
      console.log(`   Name: ${input.name}`);
      console.log(`   Class: ${input.className}`);
      console.log(`   Placeholder: ${input.placeholder}`);
      console.log(`   值: ${input.value?.slice(0, 50) || '空'}`);
      console.log(`   必填: ${input.required ? '是' : '否'}`);
      console.log(`   可见: ${input.visible ? '是' : '否'}`);
      console.log('');
    });

    // 显示富文本编辑器
    console.log(`📄 找到 ${pageStructure.richTextEditors.length} 个富文本编辑器：\n`);

    pageStructure.richTextEditors.forEach((editor, index) => {
      console.log(`${index + 1}. ${editor.tag} [contenteditable]`);
      console.log(`   ID: ${editor.id}`);
      console.log(`   Class: ${editor.className}`);
      console.log(`   Placeholder: ${editor.placeholder}`);
      console.log(`   文本: ${editor.text?.slice(0, 50) || '空'}`);
      console.log(`   可见: ${editor.visible ? '是' : '否'}`);
      console.log('');
    });

    // 显示上传区域
    console.log(`📤 找到 ${pageStructure.uploadAreas.length} 个上传区域：\n`);

    pageStructure.uploadAreas.forEach((upload, index) => {
      console.log(`${index + 1}. ${upload.tag} [${upload.type}]`);
      console.log(`   ID: ${upload.id}`);
      console.log(`   Class: ${upload.className}`);
      console.log(`   文本: ${upload.text}`);
      console.log(`   接受: ${upload.accept}`);
      console.log(`   可见: ${upload.visible ? '是' : '否'}`);
      console.log('');
    });

    // 显示按钮
    console.log(`🔘 找到 ${pageStructure.buttons.length} 个按钮：\n`);

    pageStructure.buttons.forEach((button, index) => {
      if (index < 30) { // 只显示前30个
        console.log(`${index + 1}. "${button.text}" [${button.tag}]`);
        console.log(`   类型: ${button.type}`);
        console.log(`   角色: ${button.role}`);
        console.log(`   ID: ${button.id}`);
        console.log(`   Class: ${button.className?.slice(0, 80)}`);
        console.log(`   禁用: ${button.disabled ? '是' : '否'}`);
        console.log(`   可见: ${button.visible ? '是' : '否'}`);
        console.log('');
      }
    });

    // 步骤4：识别关键字段
    console.log('\n🎯 步骤 4: 识别关键字段...\n');

    const keyFields = {
      // 标题字段
      titleInput: pageStructure.inputFields.find(i =>
        i.placeholder?.includes('标题') ||
        i.label?.includes('标题') ||
        i.id?.toLowerCase().includes('title') ||
        i.name?.toLowerCase().includes('title')
      ) || pageStructure.richTextEditors.find(e =>
        e.placeholder?.includes('标题') ||
        e.id?.toLowerCase().includes('title')
      ),

      // 简介字段
      introInput: pageStructure.inputFields.find(i =>
        i.placeholder?.includes('简介') ||
        i.label?.includes('简介') ||
        i.placeholder?.includes('介绍') ||
        i.placeholder?.includes('描述') ||
        i.id?.toLowerCase().includes('intro') ||
        i.id?.toLowerCase().includes('desc')
      ) || pageStructure.richTextEditors.find(e =>
        e.placeholder?.includes('简介') ||
        e.placeholder?.includes('介绍')
      ),

      // 正文字段（富文本编辑器）
      contentEditor: pageStructure.richTextEditors.find(e =>
        e.placeholder?.includes('正文') ||
        e.placeholder?.includes('内容') ||
        e.placeholder?.includes('章节') ||
        e.className?.toLowerCase().includes('content') ||
        e.className?.toLowerCase().includes('editor')
      ) || pageStructure.inputFields.find(i =>
        i.placeholder?.includes('正文') ||
        i.placeholder?.includes('内容')
      ),

      // 标签字段
      tagsInput: pageStructure.inputFields.find(i =>
        i.placeholder?.includes('标签') ||
        i.label?.includes('标签') ||
        i.id?.toLowerCase().includes('tag')
      ),

      // 封面上传
      coverUpload: pageStructure.uploadAreas.find(u =>
        u.text?.includes('封面') ||
        u.className?.toLowerCase().includes('cover')
      ) || pageStructure.inputFields.find(i =>
        i.type === 'file' &&
        (i.accept?.includes('image') || i.id?.toLowerCase().includes('cover'))
      ),

      // 发布按钮
      publishButton: pageStructure.buttons.find(b =>
        b.text?.includes('发布') ||
        b.text?.includes('提交') ||
        b.className?.includes('publish')
      ),

      // 保存草稿按钮
      saveDraftButton: pageStructure.buttons.find(b =>
        b.text?.includes('保存') &&
        b.text?.includes('草稿')
      ) || pageStructure.buttons.find(b =>
        b.className?.includes('save-draft')
      ),

      // 下一步按钮
      nextButton: pageStructure.buttons.find(b =>
        b.text?.includes('下一步') ||
        b.className?.includes('next')
      ),
    };

    console.log('📋 关键字段识别结果：\n');

    if (keyFields.titleInput) {
      console.log('✅ 标题字段:');
      console.log(`   类型: ${keyFields.titleInput.tag || keyFields.titleInput.type}`);
      console.log(`   ID: ${keyFields.titleInput.id}`);
      console.log(`   Class: ${keyFields.titleInput.className}`);
      console.log('');
    } else {
      console.log('❌ 未找到标题字段\n');
    }

    if (keyFields.contentEditor) {
      console.log('✅ 正文字段（富文本编辑器）:');
      console.log(`   ID: ${keyFields.contentEditor.id}`);
      console.log(`   Class: ${keyFields.contentEditor.className}`);
      console.log(`   Placeholder: ${keyFields.contentEditor.placeholder}`);
      console.log('');
    } else {
      console.log('❌ 未找到正文字段\n');
    }

    if (keyFields.publishButton) {
      console.log('✅ 发布按钮:');
      console.log(`   文本: "${keyFields.publishButton.text}"`);
      console.log(`   Class: ${keyFields.publishButton.className}`);
      console.log('');
    } else {
      console.log('❌ 未找到发布按钮\n');
    }

    if (keyFields.nextButton) {
      console.log('✅ 下一步按钮:');
      console.log(`   文本: "${keyFields.nextButton.text}"`);
      console.log(`   Class: ${keyFields.nextButton.className}`);
      console.log('');
    }

    // 步骤5：保存页面信息
    console.log('💾 步骤 5: 保存页面信息...\n');

    const completeData = {
      timestamp,
      url: pageStructure.url,
      title: pageStructure.title,
      structure: pageStructure,
      keyFields,
    };

    const jsonPath = path.join(__dirname, `../data/publish-page-v2-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(completeData, null, 2), 'utf8');
    console.log('✅ 页面结构已保存:', jsonPath);

    // 截图
    const screenshotPath = path.join(__dirname, `../data/publish-page-v2-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('✅ 截图已保存:', screenshotPath);

    // 保存页面 HTML
    const html = await page.content();
    const htmlPath = path.join(__dirname, `../data/publish-page-v2-${timestamp}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('✅ 页面 HTML 已保存:', htmlPath);

    // 生成详细分析报告
    const reportPath = path.join(__dirname, `../data/publish-analysis-v2-${timestamp}.md`);
    const reportContent = generateReport(completeData);
    fs.writeFileSync(reportPath, reportContent, 'utf8');
    console.log('✅ 分析报告已保存:', reportPath);

    console.log('\n========================================');
    console.log('✅ 分析完成！');
    console.log('========================================\n');

    console.log('📋 总结：');
    console.log(`- 发布页面 URL: ${pageStructure.url}`);
    console.log(`- 标准输入字段: ${pageStructure.inputFields.length}`);
    console.log(`- 富文本编辑器: ${pageStructure.richTextEditors.length}`);
    console.log(`- 上传区域: ${pageStructure.uploadAreas.length}`);
    console.log(`- 按钮: ${pageStructure.buttons.length}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);

    const errorLog = path.join(__dirname, `../data/analyze-publish-error-v2-${timestamp}.log`);
    fs.writeFileSync(errorLog, `${new Date().toISOString()}\n${error.stack}`, 'utf8');
    console.log('错误日志已保存:', errorLog);

  } finally {
    // 立即关闭浏览器
    console.log('\n🔒 关闭浏览器...\n');
    await browser.close();
    console.log('✅ 浏览器已关闭');
  }
}

function generateReport(data) {
  const { timestamp, url, title, structure, keyFields } = data;

  return `# 番茄小说发布页面分析报告 V2

**生成时间**: ${timestamp}
**分析URL**: ${url}
**页面标题**: ${title}

---

## 页面统计

- 标准输入字段: ${structure.inputFields.length}
- 富文本编辑器: ${structure.richTextEditors.length}
- 上传区域: ${structure.uploadAreas.length}
- 按钮: ${structure.buttons.length}

---

## 关键字段

### 标题字段
${keyFields.titleInput ? `
\`\`\`json
${JSON.stringify(keyFields.titleInput, null, 2)}
\`\`\`
` : '❌ 未找到标题字段'}

### 简介字段
${keyFields.introInput ? `
\`\`\`json
${JSON.stringify(keyFields.introInput, null, 2)}
\`\`\`
` : '❌ 未找到简介字段'}

### 正文字段（富文本编辑器）
${keyFields.contentEditor ? `
\`\`\`json
${JSON.stringify(keyFields.contentEditor, null, 2)}
\`\`\`
` : '❌ 未找到正文字段'}

### 标签字段
${keyFields.tagsInput ? `
\`\`\`json
${JSON.stringify(keyFields.tagsInput, null, 2)}
\`\`\`
` : '❌ 未找到标签字段'}

### 封面上传
${keyFields.coverUpload ? `
\`\`\`json
${JSON.stringify(keyFields.coverUpload, null, 2)}
\`\`\`
` : '❌ 未找到封面上传'}

---

## 关键按钮

### 发布按钮
${keyFields.publishButton ? `
\`\`\`json
${JSON.stringify(keyFields.publishButton, null, 2)}
\`\`\`
` : '❌ 未找到发布按钮'}

### 保存草稿按钮
${keyFields.saveDraftButton ? `
\`\`\`json
${JSON.stringify(keyFields.saveDraftButton, null, 2)}
\`\`\`
` : '❌ 未找到保存草稿按钮'}

### 下一步按钮
${keyFields.nextButton ? `
\`\`\`json
${JSON.stringify(keyFields.nextButton, null, 2)}
\`\`\`
` : '❌ 未找到下一步按钮'}

---

## 技术建议

### 填充字段
1. **标题字段**: 使用 \`type()\` 方法逐字输入
2. **富文本编辑器**: 使用 \`fill()\` 或 \`type()\` 方法
3. **文件上传**: 使用 \`setInputFiles()\` 方法

### 按钮操作
1. **发布按钮**: 先验证所有必填字段，再点击
2. **保存草稿**: 可用于测试
3. **下一步按钮**: 可能需要分步操作

### 等待策略
1. 使用 \`waitForSelector()\` 等待元素出现
2. 使用 \`waitForTimeout()\` 等待动态加载
3. 检查按钮是否可用（非 disabled）

### 错误处理
1. 捕获所有可能的错误
2. 添加重试机制
3. 记录详细日志

---

## 下一步开发计划

### 阶段1：基础填充
- [ ] 开发标题字段自动填充
- [ ] 开发富文本编辑器自动填充
- [ ] 开发封面自动上传

### 阶段2：发布流程
- [ ] 实现"下一步"按钮自动点击
- [ ] 实现多步骤表单处理
- [ ] 实现"发布"按钮自动点击

### 阶段3：验证和错误处理
- [ ] 添加字段验证
- [ ] 添加错误检测和重试
- [ ] 添加日志记录

### 阶段4：集成和自动化
- [ ] 集成到自动化运营体系
- [ ] 实现批量发布功能
- [ ] 实现定时发布

---

## 相关文件

- 页面结构 JSON: \`publish-page-v2-${timestamp}.json\`
- 页面截图: \`publish-page-v2-${timestamp}.png\`
- 页面 HTML: \`publish-page-v2-${timestamp}.html\`
- 原始分析 V1: \`publish-page-analysis-2026-03-19T11-31-44.md\`

---

## 使用示例

### 填充标题
\`\`\`javascript
await page.type('input[placeholder*="标题"]', '这是标题');
// 或
await page.fill('#title-input', '这是标题');
\`\`\`

### 填充富文本编辑器
\`\`\`javascript
await page.fill('[contenteditable="true"]', '这是正文内容');
// 或
await page.evaluate((content) => {
  const editor = document.querySelector('[contenteditable="true"]');
  editor.innerHTML = content;
}, content);
\`\`\`

### 上传封面
\`\`\`javascript
await page.setInputFiles('input[type="file"]', '/path/to/cover.jpg');
\`\`\`

### 点击发布按钮
\`\`\`javascript
await page.click('button:has-text("发布")');
// 或
await page.click('.arco-btn-primary');
\`\`\`
`;

  return reportContent;
}

// 运行
analyzePublishPageV2().catch(console.error);
