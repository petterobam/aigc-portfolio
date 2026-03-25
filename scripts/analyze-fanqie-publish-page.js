/**
 * 分析番茄小说发布页面 DOM 结构
 *
 * 功能:
 * - 自动分析页面的所有 input 元素
 * - 自动分析页面的所有 textarea 元素
 * - 自动分析页面的所有 button 元素
 * - 生成选择器建议
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * 加载 Cookie
 */
async function loadCookies(context, cookieFile) {
  try {
    const cookiePath = path.resolve(__dirname, cookieFile);
    const cookieData = fs.readFileSync(cookiePath, 'utf-8');
    const cookies = JSON.parse(cookieData);

    console.log(`🍪 加载 ${cookies.length} 个 Cookie\n`);
    await context.addCookies(cookies);

    return true;
  } catch (error) {
    console.error('❌ 加载 Cookie 失败:', error.message);
    return false;
  }
}

/**
 * 分析页面元素
 */
async function analyzePageElements(page) {
  console.log('🔍 分析页面 DOM 结构...\n');

  const analysis = await page.evaluate(() => {
    const result = {
      titleInputs: [],
      introInputs: [],
      contentEditors: [],
      submitButtons: []
    };

    // 1. 分析所有 input 元素
    const inputs = document.querySelectorAll('input');
    console.log(`📝 找到 ${inputs.length} 个 input 元素\n`);

    inputs.forEach((input, index) => {
      const info = {
        index,
        type: input.type,
        name: input.name,
        id: input.id,
        className: input.className,
        placeholder: input.placeholder,
        value: input.value ? input.value.substring(0, 50) : '',
        tagName: input.tagName,
        selectors: []
      };

      // 生成选择器
      if (input.id) {
        info.selectors.push(`#${input.id}`);
      }
      if (input.name) {
        info.selectors.push(`input[name="${input.name}"]`);
      }
      if (input.placeholder) {
        info.selectors.push(`input[placeholder="${input.placeholder}"]`);
      }
      if (input.className) {
        info.selectors.push(`.${input.className.split(' ').join('.')}`);
      }

      // 判断是否可能是标题输入框
      const placeholder = (input.placeholder || '').toLowerCase();
      const name = (input.name || '').toLowerCase();
      const id = (input.id || '').toLowerCase();
      const className = (input.className || '').toLowerCase();

      if (placeholder.includes('标题') || name.includes('title') || id.includes('title') || className.includes('title')) {
        result.titleInputs.push(info);
      }

      // 判断是否可能是简介输入框
      if (placeholder.includes('简介') || name.includes('intro') || name.includes('summary') || id.includes('intro') || className.includes('intro')) {
        result.introInputs.push(info);
      }
    });

    // 2. 分析所有 textarea 元素
    const textareas = document.querySelectorAll('textarea');
    console.log(`📝 找到 ${textareas.length} 个 textarea 元素\n`);

    textareas.forEach((textarea, index) => {
      const info = {
        index,
        name: textarea.name,
        id: textarea.id,
        className: textarea.className,
        placeholder: textarea.placeholder,
        value: textarea.value ? textarea.value.substring(0, 50) : '',
        tagName: textarea.tagName,
        selectors: []
      };

      // 生成选择器
      if (textarea.id) {
        info.selectors.push(`#${textarea.id}`);
      }
      if (textarea.name) {
        info.selectors.push(`textarea[name="${textarea.name}"]`);
      }
      if (textarea.placeholder) {
        info.selectors.push(`textarea[placeholder="${textarea.placeholder}"]`);
      }
      if (textarea.className) {
        info.selectors.push(`.${textarea.className.split(' ').join('.')}`);
      }

      // 判断是否可能是简介输入框
      const placeholder = (textarea.placeholder || '').toLowerCase();
      const name = (textarea.name || '').toLowerCase();
      const id = (textarea.id || '').toLowerCase();
      const className = (textarea.className || '').toLowerCase();

      if (placeholder.includes('简介') || name.includes('intro') || name.includes('summary') || id.includes('intro') || className.includes('intro')) {
        result.introInputs.push(info);
      }

      // 判断是否可能是内容编辑器
      if (placeholder.includes('正文') || name.includes('content') || id.includes('content') || className.includes('content') || className.includes('editor')) {
        result.contentEditors.push(info);
      }
    });

    // 3. 分析所有 contenteditable 元素
    const editables = document.querySelectorAll('[contenteditable="true"]');
    console.log(`📝 找到 ${editables.length} 个 contenteditable 元素\n`);

    editables.forEach((editable, index) => {
      const info = {
        index,
        tagName: editable.tagName,
        id: editable.id,
        className: editable.className,
        innerHTML: editable.innerHTML ? editable.innerHTML.substring(0, 50) : '',
        selectors: []
      };

      // 生成选择器
      if (editable.id) {
        info.selectors.push(`#${editable.id}`);
      }
      if (editable.className) {
        info.selectors.push(`.${editable.className.split(' ').join('.')}`);
      }

      result.contentEditors.push(info);
    });

    // 4. 分析所有 button 元素
    const buttons = document.querySelectorAll('button');
    console.log(`📝 找到 ${buttons.length} 个 button 元素\n`);

    buttons.forEach((button, index) => {
      const info = {
        index,
        type: button.type,
        name: button.name,
        id: button.id,
        className: button.className,
        text: button.textContent ? button.textContent.trim().substring(0, 30) : '',
        tagName: button.tagName,
        selectors: []
      };

      // 生成选择器
      if (button.id) {
        info.selectors.push(`#${button.id}`);
      }
      if (button.type) {
        info.selectors.push(`button[type="${button.type}"]`);
      }
      if (button.className) {
        info.selectors.push(`.${button.className.split(' ').join('.')}`);
      }
      if (button.textContent) {
        const text = button.textContent.trim();
        if (text.length > 0 && text.length < 50) {
          info.selectors.push(`button:has-text("${text}")`);
        }
      }

      // 判断是否可能是提交按钮
      const text = (button.textContent || '').toLowerCase();
      const className = (button.className || '').toLowerCase();
      const id = (button.id || '').toLowerCase();

      if (text.includes('发布') || text.includes('提交') || className.includes('submit') || className.includes('publish') || id.includes('submit') || id.includes('publish')) {
        result.submitButtons.push(info);
      }
    });

    return result;
  });

  return analysis;
}

/**
 * 打印分析结果
 */
function printAnalysisResult(analysis) {
  console.log('='.repeat(80));
  console.log('📊 页面元素分析结果');
  console.log('='.repeat(80) + '\n');

  // 1. 标题输入框
  console.log('📌 标题输入框');
  console.log('-'.repeat(80));
  if (analysis.titleInputs.length > 0) {
    analysis.titleInputs.forEach((item, index) => {
      console.log(`\n#${index + 1}`);
      console.log(`  类型: ${item.type}`);
      console.log(`  标签: ${item.tagName}`);
      console.log(`  Name: ${item.name || '无'}`);
      console.log(`  ID: ${item.id || '无'}`);
      console.log(`  ClassName: ${item.className || '无'}`);
      console.log(`  Placeholder: ${item.placeholder || '无'}`);
      console.log(`  推荐选择器:`);
      item.selectors.forEach(sel => console.log(`    - ${sel}`));
    });
  } else {
    console.log('⚠️ 未找到标题输入框\n');
  }

  // 2. 简介输入框
  console.log('\n' + '='.repeat(80));
  console.log('📖 简介输入框');
  console.log('-'.repeat(80));
  if (analysis.introInputs.length > 0) {
    analysis.introInputs.forEach((item, index) => {
      console.log(`\n#${index + 1}`);
      console.log(`  标签: ${item.tagName}`);
      console.log(`  Name: ${item.name || '无'}`);
      console.log(`  ID: ${item.id || '无'}`);
      console.log(`  ClassName: ${item.className || '无'}`);
      console.log(`  Placeholder: ${item.placeholder || '无'}`);
      console.log(`  推荐选择器:`);
      item.selectors.forEach(sel => console.log(`    - ${sel}`));
    });
  } else {
    console.log('⚠️ 未找到简介输入框\n');
  }

  // 3. 内容编辑器
  console.log('\n' + '='.repeat(80));
  console.log('✏️ 内容编辑器');
  console.log('-'.repeat(80));
  if (analysis.contentEditors.length > 0) {
    analysis.contentEditors.forEach((item, index) => {
      console.log(`\n#${index + 1}`);
      console.log(`  标签: ${item.tagName}`);
      console.log(`  ID: ${item.id || '无'}`);
      console.log(`  ClassName: ${item.className || '无'}`);
      console.log(`  推荐选择器:`);
      item.selectors.forEach(sel => console.log(`    - ${sel}`));
    });
  } else {
    console.log('⚠️ 未找到内容编辑器\n');
  }

  // 4. 提交按钮
  console.log('\n' + '='.repeat(80));
  console.log('🚀 提交按钮');
  console.log('-'.repeat(80));
  if (analysis.submitButtons.length > 0) {
    analysis.submitButtons.forEach((item, index) => {
      console.log(`\n#${index + 1}`);
      console.log(`  类型: ${item.type}`);
      console.log(`  标签: ${item.tagName}`);
      console.log(`  文本: ${item.text || '无'}`);
      console.log(`  Name: ${item.name || '无'}`);
      console.log(`  ID: ${item.id || '无'}`);
      console.log(`  ClassName: ${item.className || '无'}`);
      console.log(`  推荐选择器:`);
      item.selectors.forEach(sel => console.log(`    - ${sel}`));
    });
  } else {
    console.log('⚠️ 未找到提交按钮\n');
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * 生成选择器配置
 */
function generateSelectorConfig(analysis) {
  const config = {
    baseUrl: 'https://fanqienovel.com',
    publishUrl: 'https://fanqienovel.com/page/shortStoryPublish',
    selectors: {
      title: [],
      intro: [],
      content: [],
      submit: []
    }
  };

  // 提取最佳选择器
  if (analysis.titleInputs.length > 0) {
    config.selectors.title = analysis.titleInputs[0].selectors;
  }

  if (analysis.introInputs.length > 0) {
    config.selectors.intro = analysis.introInputs[0].selectors;
  }

  if (analysis.contentEditors.length > 0) {
    config.selectors.content = analysis.contentEditors[0].selectors;
  }

  if (analysis.submitButtons.length > 0) {
    config.selectors.submit = analysis.submitButtons[0].selectors;
  }

  return config;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 番茄小说发布页面 DOM 结构分析\n');

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    // 1. 加载 Cookie
    const cookieFile = '../cookies/latest.json';
    await loadCookies(context, cookieFile);

    // 2. 导航到发布页面
    console.log('📝 导航到发布页面...\n');
    await page.goto('https://fanqienovel.com/page/shortStoryPublish', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ 已到达发布页面\n');
    console.log(`🔗 URL: ${page.url()}\n`);

    // 3. 保存页面 HTML
    console.log('💾 保存页面 HTML...\n');
    const htmlPath = path.resolve(__dirname, '../debug/publish-page.html');
    const htmlDir = path.dirname(htmlPath);
    if (!fs.existsSync(htmlDir)) {
      fs.mkdirSync(htmlDir, { recursive: true });
    }
    const htmlContent = await page.content();
    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    console.log(`✅ 页面 HTML 已保存: ${htmlPath}\n`);

    // 4. 截图
    const screenshotPath = path.resolve(__dirname, '../screenshots/publish-page-full.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ 截图已保存: ${screenshotPath}\n`);

    // 5. 分析页面元素
    const analysis = await analyzePageElements(page);

    // 6. 打印分析结果
    printAnalysisResult(analysis);

    // 5. 生成选择器配置
    const config = generateSelectorConfig(analysis);

    // 7. 保存选择器配置
    const configPath = path.resolve(__dirname, '../automation/selectors-config-v4.json');
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`\n✅ 选择器配置已保存: ${configPath}\n`);

    // 7. 等待用户查看
    console.log('按任意键关闭浏览器...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

  } catch (error) {
    console.error('❌ 分析失败:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('\n✅ 分析结束');
  }
}

// 运行主函数
main().catch(error => {
  console.error('❌ 程序异常退出:', error.message);
  process.exit(1);
});
