const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 测试数据
const testData = {
  title: '测试标题 - 自动发布测试',
  content: `这是测试正文，用于分析番茄小说发布流程。

第一段：测试内容，用于验证发布流程。

第二段：继续测试内容，确保自动发布功能正常工作。

第三段：最后一段测试内容。

全文完。`
};

// 创建输出目录
const outputDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function analyzePageStructure(page, step, description) {
  console.log(`\n📊 分析步骤 ${step}：${description}`);

  const structure = {
    step,
    description,
    url: page.url(),
    title: await page.title(),
    timestamp: new Date().toISOString(),
    elements: {
      inputs: [],
      textareas: [],
      contenteditable: [],
      selects: [],
      checkboxes: [],
      radioButtons: [],
      buttons: [],
      links: [],
      images: [],
      forms: []
    }
  };

  // 等待页面加载
  await sleep(3000);

  // 分析标准输入字段
  const inputs = await page.$$eval('input', (inputs) => {
    return inputs.map((input) => ({
      type: input.type,
      name: input.name,
      id: input.id,
      className: input.className,
      placeholder: input.placeholder,
      value: input.value,
      disabled: input.disabled,
      readonly: input.readOnly,
      ariaLabel: input.getAttribute('aria-label'),
      ariaLabelledby: input.getAttribute('aria-labelledby'),
      ariaDescribedby: input.getAttribute('aria-describedby'),
      dataAttributes: Array.from(input.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .map(attr => `${attr.name}="${attr.value}"`)
    }));
  });
  structure.elements.inputs = inputs.filter(input => input.type !== 'radio' && input.type !== 'checkbox');

  // 分析单选按钮
  const radioButtons = await page.$$eval('input[type="radio"]', (inputs) => {
    return inputs.map((input) => ({
      name: input.name,
      id: input.id,
      className: input.className,
      value: input.value,
      checked: input.checked,
      ariaLabel: input.getAttribute('aria-label'),
      dataAttributes: Array.from(input.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .map(attr => `${attr.name}="${attr.value}"`)
    }));
  });
  structure.elements.radioButtons = radioButtons;

  // 分析复选框
  const checkboxes = await page.$$eval('input[type="checkbox"]', (inputs) => {
    return inputs.map((input) => ({
      name: input.name,
      id: input.id,
      className: input.className,
      value: input.value,
      checked: input.checked,
      ariaLabel: input.getAttribute('aria-label'),
      dataAttributes: Array.from(input.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .map(attr => `${attr.name}="${attr.value}"`)
    }));
  });
  structure.elements.checkboxes = checkboxes;

  // 分析文本域
  const textareas = await page.$$eval('textarea', (textareas) => {
    return textareas.map((textarea) => ({
      name: textarea.name,
      id: textarea.id,
      className: textarea.className,
      placeholder: textarea.placeholder,
      value: textarea.value,
      disabled: textarea.disabled,
      readonly: textarea.readOnly,
      ariaLabel: textarea.getAttribute('aria-label'),
      ariaLabelledby: textarea.getAttribute('aria-labelledby'),
      ariaDescribedby: textarea.getAttribute('aria-describedby'),
      dataAttributes: Array.from(textarea.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .map(attr => `${attr.name}="${attr.value}"`)
    }));
  });
  structure.elements.textareas = textareas;

  // 分析富文本编辑器
  const contenteditable = await page.$$eval('[contenteditable="true"], [contenteditable=""]', (editors) => {
    return editors.map((editor) => ({
      tagName: editor.tagName,
      id: editor.id,
      className: editor.className,
      innerHTML: editor.innerHTML.substring(0, 200) + '...',
      innerText: editor.innerText.substring(0, 100) + '...',
      ariaLabel: editor.getAttribute('aria-label'),
      ariaLabelledby: editor.getAttribute('aria-labelledby'),
      ariaDescribedby: editor.getAttribute('aria-describedby'),
      dataAttributes: Array.from(editor.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .map(attr => `${attr.name}="${attr.value}"`)
    }));
  });
  structure.elements.contenteditable = contenteditable;

  // 分析下拉选择框
  const selects = await page.$$eval('select', (selects) => {
    return selects.map((select) => ({
      name: select.name,
      id: select.id,
      className: select.className,
      disabled: select.disabled,
      multiple: select.multiple,
      ariaLabel: select.getAttribute('aria-label'),
      ariaLabelledby: select.getAttribute('aria-labelledby'),
      options: Array.from(select.options).map(option => ({
        value: option.value,
        text: option.text,
        selected: option.selected,
        disabled: option.disabled
      })),
      dataAttributes: Array.from(select.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .map(attr => `${attr.name}="${attr.value}"`)
    }));
  });
  structure.elements.selects = selects;

  // 分析按钮
  const buttons = await page.$$eval('button', (buttons) => {
    return buttons.map((button) => ({
      tagName: button.tagName,
      type: button.type,
      id: button.id,
      className: button.className,
      textContent: button.textContent.trim().substring(0, 50),
      disabled: button.disabled,
      ariaLabel: button.getAttribute('aria-label'),
      ariaLabelledby: button.getAttribute('aria-labelledby'),
      dataAttributes: Array.from(button.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .map(attr => `${attr.name}="${attr.value}"`)
    }));
  });
  structure.elements.buttons = buttons;

  // 分析链接
  const links = await page.$$eval('a', (links) => {
    return links.map((link) => ({
      href: link.href,
      id: link.id,
      className: link.className,
      textContent: link.textContent.trim().substring(0, 50),
      ariaLabel: link.getAttribute('aria-label'),
      dataAttributes: Array.from(link.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .map(attr => `${attr.name}="${attr.value}"`)
    })).filter(link => link.href && link.href !== 'javascript:;');
  });
  structure.elements.links = links;

  // 分析图片
  const images = await page.$$eval('img', (images) => {
    return images.map((img) => ({
      src: img.src,
      alt: img.alt,
      id: img.id,
      className: img.className,
      width: img.width,
      height: img.height,
      dataAttributes: Array.from(img.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .map(attr => `${attr.name}="${attr.value}"`)
    }));
  });
  structure.elements.images = images;

  // 分析表单
  const forms = await page.$$eval('form', (forms) => {
    return forms.map((form) => ({
      action: form.action,
      method: form.method,
      id: form.id,
      className: form.className,
      dataAttributes: Array.from(form.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .map(attr => `${attr.name}="${attr.value}"`)
    }));
  });
  structure.elements.forms = forms;

  // 查找自定义组件（Arco Design 等）
  const customComponents = await page.evaluate(() => {
    const results = [];

    // 查找 Arco Design 组件
    document.querySelectorAll('[class*="arco-"]').forEach((el) => {
      const tagName = el.tagName.toLowerCase();
      const className = el.className;
      const textContent = el.textContent.trim().substring(0, 50);
      const role = el.getAttribute('role');

      results.push({
        tagName,
        className: className.substring(0, 100),
        textContent,
        role
      });
    });

    return results;
  });
  structure.customComponents = customComponents;

  // 保存截图
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = path.join(outputDir, `publish-page-step-${step}-${timestamp}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  structure.screenshot = screenshotPath;

  // 保存 HTML
  const htmlPath = path.join(outputDir, `publish-page-step-${step}-${timestamp}.html`);
  const html = await page.content();
  fs.writeFileSync(htmlPath, html);
  structure.html = htmlPath;

  console.log(`✅ 步骤 ${step} 分析完成`);
  console.log(`   - 输入字段: ${structure.elements.inputs.length}`);
  console.log(`   - 文本域: ${structure.elements.textareas.length}`);
  console.log(`   - 富文本编辑器: ${structure.elements.contenteditable.length}`);
  console.log(`   - 按钮: ${structure.elements.buttons.length}`);
  console.log(`   - 截图: ${screenshotPath}`);
  console.log(`   - HTML: ${htmlPath}`);

  return structure;
}

async function main() {
  console.log('🚀 开始分析番茄小说发布流程（多步骤）');
  console.log('📝 测试数据：', testData);

  // 使用 Chrome 用户数据目录
  const userDataDir = path.join(__dirname, '..', 'chrome-data');

  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,  // 显示浏览器窗口，便于观察
    slowMo: 100,      // 减慢操作速度，便于观察
  });

  const page = browser.pages()[0] || await browser.newPage();

  try {
    // 步骤1：访问发布页面
    console.log('\n📍 步骤1：访问发布页面');

    const publishUrl = 'https://fanqienovel.com/main/writer/publish-short/?enter_from=NEWCHAPTER_1';
    await page.goto(publishUrl, { waitUntil: 'networkidle' });
    await sleep(3000);

    // 分析第一页
    const step1Structure = await analyzePageStructure(page, 1, '填写标题和正文');

    // 填写标题
    console.log('\n✍️  填写标题：', testData.title);
    const titleTextarea = page.locator('textarea.byte-textarea.serial-textarea');
    await titleTextarea.waitFor({ state: 'visible' });
    await titleTextarea.fill(testData.title);
    await sleep(1000);

    // 填写正文
    console.log('✍️  填写正文...');
    const contentEditor = page.locator('div.ProseMirror.payNode-helper-content');
    await contentEditor.waitFor({ state: 'visible' });
    await contentEditor.fill(testData.content);
    await sleep(1000);

    // 验证填充结果
    const filledTitle = await titleTextarea.inputValue();
    const filledContent = await contentEditor.innerText();
    console.log('✅ 标题已填充：', filledTitle);
    console.log('✅ 正文已填充（前50字）：', filledContent.substring(0, 50));

    // 步骤2：点击"下一步"
    console.log('\n📍 步骤2：点击"下一步"按钮');

    const nextButton = page.locator('button.btn-primary-variant');
    await nextButton.waitFor({ state: 'visible' });
    await nextButton.click();

    // 等待页面跳转
    await sleep(5000);

    // 分析第二页
    const step2Structure = await analyzePageStructure(page, 2, '封面、标签、简介等设置');

    // 查找第二页的关键字段
    console.log('\n🔍 查找第二页关键字段：');

    // 查找封面上传区域
    const coverImages = await page.$$eval('img', imgs => {
      return imgs.filter(img => {
        const src = img.src || '';
        const alt = (img.alt || '').toLowerCase();
        const className = (img.className || '').toLowerCase();
        return src.includes('cover') || alt.includes('封面') || className.includes('cover');
      }).map(img => ({
        src: img.src,
        alt: img.alt,
        className: img.className
      }));
    });
    console.log(`   - 封面相关图片: ${coverImages.length} 个`);

    // 查找文件上传区域
    const fileInputs = await page.$$eval('input[type="file"]', inputs => {
      return inputs.map(input => ({
        id: input.id,
        className: input.className,
        accept: input.accept,
        name: input.name,
        ariaLabel: input.getAttribute('aria-label'),
        ariaDescribedby: input.getAttribute('aria-describedby'),
        dataAttributes: Array.from(input.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .map(attr => `${attr.name}="${attr.value}"`)
      }));
    });
    console.log(`   - 文件上传区域: ${fileInputs.length} 个`);

    // 查找标签选择器
    const tagElements = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('*').forEach(el => {
        const text = el.textContent.trim().substring(0, 20);
        const className = el.className;
        const ariaLabel = el.getAttribute('aria-label');

        if (
          (text && (text.includes('标签') || text.includes('Tag'))) ||
          (className && (className.includes('tag') || className.includes('label'))) ||
          (ariaLabel && (ariaLabel.includes('标签') || ariaLabel.includes('tag')))
        ) {
          results.push({
            tagName: el.tagName,
            text,
            className: className.substring(0, 100),
            ariaLabel
          });
        }
      });
      return results;
    });
    console.log(`   - 标签相关元素: ${tagElements.length} 个`);

    // 查找简介字段
    const descriptionElements = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('*').forEach(el => {
        const text = el.textContent.trim().substring(0, 20);
        const className = el.className;
        const ariaLabel = el.getAttribute('aria-label');
        const placeholder = el.getAttribute('placeholder');

        if (
          (text && (text.includes('简介') || text.includes('介绍') || text.includes('描述'))) ||
          (className && className.includes('description')) ||
          (ariaLabel && ariaLabel.includes('简介')) ||
          (placeholder && placeholder.includes('简介'))
        ) {
          results.push({
            tagName: el.tagName,
            text,
            className: className.substring(0, 100),
            ariaLabel,
            placeholder
          });
        }
      });
      return results;
    });
    console.log(`   - 简介相关元素: ${descriptionElements.length} 个`);

    // 查找最终发布按钮
    const publishButtons = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('button, a').forEach(el => {
        const text = el.textContent.trim().toLowerCase();
        const className = el.className.toLowerCase();

        if (text.includes('发布') || text.includes('publish') || className.includes('publish')) {
          results.push({
            tagName: el.tagName,
            text: el.textContent.trim().substring(0, 50),
            className: el.className.substring(0, 100),
            id: el.id,
            disabled: el.disabled
          });
        }
      });
      return results;
    });
    console.log(`   - 发布相关按钮: ${publishButtons.length} 个`);

    // 步骤3：（可选）查找更多步骤
    if (publishButtons.length === 0) {
      console.log('\n📍 步骤3：查找更多步骤...');

      // 查找所有可能需要点击的按钮
      const allButtons = step2Structure.elements.buttons.filter(btn =>
        btn.textContent &&
        !btn.textContent.includes('返回') &&
        !btn.textContent.includes('上一步') &&
        !btn.textContent.includes('存草稿')
      );

      console.log(`   找到 ${allButtons.length} 个可能需要点击的按钮:`);
      allButtons.forEach((btn, index) => {
        console.log(`     ${index + 1}. "${btn.textContent}" (${btn.className.substring(0, 50)})`);
      });

      // 尝试点击第一个可能的"下一步"按钮
      if (allButtons.length > 0) {
        console.log('\n🖱️  点击第一个可能的"下一步"按钮...');

        try {
          await page.locator('button').filter({ hasText: allButtons[0].textContent }).first().click();
          await sleep(5000);

          // 分析第三页
          const step3Structure = await analyzePageStructure(page, 3, '最终确认或发布');

          // 查找最终发布按钮
          const finalPublishButtons = await page.evaluate(() => {
            const results = [];
            document.querySelectorAll('button, a').forEach(el => {
              const text = el.textContent.trim().toLowerCase();
              const className = el.className.toLowerCase();

              if (text.includes('发布') || text.includes('publish') || className.includes('publish')) {
                results.push({
                  tagName: el.tagName,
                  text: el.textContent.trim().substring(0, 50),
                  className: el.className.substring(0, 100),
                  id: el.id,
                  disabled: el.disabled
                });
              }
            });
            return results;
          });

          console.log(`\n✅ 最终发布按钮: ${finalPublishButtons.length} 个`);
          finalPublishButtons.forEach((btn, index) => {
            console.log(`   ${index + 1}. "${btn.text}"`);
          });

          // 保存完整结构
          const completeStructure = {
            steps: [step1Structure, step2Structure, step3Structure],
            testData,
            summary: {
              totalSteps: 3,
              hasCover: fileInputs.length > 0 || coverImages.length > 0,
              hasTags: tagElements.length > 0,
              hasDescription: descriptionElements.length > 0,
              publishButtons: publishButtons.concat(finalPublishButtons)
            }
          };

          // 保存完整结构
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const structurePath = path.join(outputDir, `publish-page-multi-step-${timestamp}.json`);
          fs.writeFileSync(structurePath, JSON.stringify(completeStructure, null, 2));
          console.log(`\n💾 完整结构已保存: ${structurePath}`);

          return completeStructure;

        } catch (error) {
          console.log(`⚠️  点击失败: ${error.message}`);
          console.log('   继续保存第二步的分析结果...');
        }
      }
    } else {
      // 只有2个步骤
      console.log('\n✅ 发现发布按钮，发布流程共2个步骤');

      // 保存完整结构
      const completeStructure = {
        steps: [step1Structure, step2Structure],
        testData,
        summary: {
          totalSteps: 2,
          hasCover: fileInputs.length > 0 || coverImages.length > 0,
          hasTags: tagElements.length > 0,
          hasDescription: descriptionElements.length > 0,
          publishButtons
        }
      };

      // 保存完整结构
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const structurePath = path.join(outputDir, `publish-page-multi-step-${timestamp}.json`);
      fs.writeFileSync(structurePath, JSON.stringify(completeStructure, null, 2));
      console.log(`\n💾 完整结构已保存: ${structurePath}`);

      return completeStructure;
    }

  } catch (error) {
    console.error('❌ 分析失败:', error);
    throw error;
  } finally {
    // 等待用户查看
    console.log('\n⏳ 浏览器窗口将保持打开5秒，供您查看...');
    await sleep(5000);

    await browser.close();
    console.log('\n✅ 浏览器已关闭');
  }
}

main().catch(console.error);
