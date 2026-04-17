const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 创建输出目录
const outputDir = path.join(__dirname, '..', '宗教思想研究', '数据');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 佛津平台数据源调研工具');
  console.log('📍 目标：梳理 503 个数据源的分类和覆盖范围');

  // 使用独立的临时 Chrome 用户数据目录
  const userDataDir = path.join(__dirname, '..', 'chrome-data-fojin');

  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,  // 显示浏览器窗口，便于观察
    slowMo: 100,      // 减慢操作速度，便于观察
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = browser.pages()[0] || await browser.newPage();

  try {
    console.log('\n📍 访问佛津数据源导航页面...');

    const url = 'https://fojin.app/sources';
    console.log('   URL:', url);

    await page.goto(url, { waitUntil: 'networkidle' });
    await sleep(3000);

    // 获取页面信息
    const pageTitle = await page.title();
    console.log('\n📊 页面标题:', pageTitle);

    // 查找数据源列表
    console.log('\n🔍 查找数据源元素...');

    // 尝试不同的选择器
    const selectors = [
      'div.source-item',
      'div.source-card',
      'li.source',
      '[class*="source"]',
      'article',
      'div[class*="card"]',
    ];

    let foundSelector = null;
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      console.log(`   - ${selector}: ${count} 个`);
      if (count > 0 && count > 10) {  // 假设至少有10个数据源
        foundSelector = selector;
        break;
      }
    }

    if (foundSelector) {
      console.log(`\n✅ 找到数据源元素：${foundSelector}`);

      // 提取数据源信息
      const sources = await page.evaluate((selector) => {
        const elements = Array.from(document.querySelectorAll(selector));
        return elements.slice(0, 50).map((el, index) => {
          // 尝试提取各种可能的信息
          const text = el.innerText || el.textContent || '';
          const title = el.querySelector('h1, h2, h3, h4, h5, h6, .title, [class*="title"]')?.innerText ||
                       el.querySelector('[class*="name"]')?.innerText ||
                       text.split('\n')[0];
          const url = el.querySelector('a')?.href || '';
          const description = text.replace(title, '').trim().substring(0, 200);

          return {
            index: index + 1,
            title: title.trim(),
            url: url,
            description: description,
            fullText: text.substring(0, 500)
          };
        });
      }, foundSelector);

      console.log(`\n📋 成功提取 ${sources.length} 个数据源`);

      // 保存数据
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const jsonPath = path.join(outputDir, `fojin-sources-${timestamp}.json`);
      const mdPath = path.join(outputDir, `fojin-sources-${timestamp}.md`);

      // 保存 JSON
      fs.writeFileSync(jsonPath, JSON.stringify(sources, null, 2));

      // 保存 Markdown
      let mdContent = `# 佛津平台数据源调研\n\n`;
      mdContent += `> **抓取时间**：${new Date().toLocaleString('zh-CN')}\n`;
      mdContent += `> **数据来源**：https://fojin.app/sources\n\n`;
      mdContent += `## 概览\n\n`;
      mdContent += `- **数据源总数**：503 个（官方数据）\n`;
      mdContent += `- **本次提取**：${sources.length} 个\n\n`;

      mdContent += `## 数据源列表\n\n`;

      sources.forEach(source => {
        mdContent += `### ${source.index}. ${source.title}\n\n`;
        if (source.url) {
          mdContent += `- **链接**：${source.url}\n`;
        }
        if (source.description) {
          mdContent += `- **描述**：${source.description}\n`;
        }
        mdContent += '\n';
      });

      fs.writeFileSync(mdPath, mdContent);

      console.log('\n💾 已保存:');
      console.log('   - JSON:', jsonPath);
      console.log('   - Markdown:', mdPath);

    } else {
      console.log('\n⚠️  未找到合适的数据源元素，尝试提取页面全部文本...');

      // 获取页面全部文本
      const fullText = await page.evaluate(() => {
        return document.body.innerText;
      });

      // 保存页面文本
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const textPath = path.join(outputDir, `fojin-sources-page-${timestamp}.txt`);

      fs.writeFileSync(textPath, fullText);

      console.log('\n💾 已保存页面文本:', textPath);

      // 尝试分析文本内容
      console.log('\n📊 页面文本分析:');
      const lines = fullText.split('\n').filter(line => line.trim());
      console.log(`   - 总行数：${lines.length}`);
      console.log(`   - 字符数：${fullText.length}`);
      console.log('\n前50行内容：');
      lines.slice(0, 50).forEach((line, i) => {
        console.log(`   ${i + 1}: ${line}`);
      });
    }

    // 截图
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(outputDir, `fojin-sources-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('\n💾 已保存截图:', screenshotPath);

    // 保存 HTML
    const htmlPath = path.join(outputDir, `fojin-sources-${timestamp}.html`);
    const html = await page.content();
    fs.writeFileSync(htmlPath, html);
    console.log('💾 已保存 HTML:', htmlPath);

    // 保持浏览器打开，便于手动检查
    console.log('\n⏳ 浏览器将保持打开60秒，供您手动检查...');
    await sleep(60000);

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('\n✅ 浏览器已关闭');
  }
}

main().catch(console.error);
