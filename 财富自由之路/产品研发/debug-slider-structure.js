/**
 * 调试脚本 - 查看滑块的实际 DOM 结构
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const APP_URL = 'http://localhost:5183/#/asset-allocation';

async function debugSliderStructure() {
  console.log('🔍 开始调试滑块 DOM 结构...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // 导航到应用
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // 截图
  await page.screenshot({ path: path.join(__dirname, 'debug-screenshot.png'), fullPage: true });
  console.log('📸 截图保存: debug-screenshot.png');

  // 获取页面的完整 HTML
  const pageHTML = await page.content();
  const htmlPath = path.join(__dirname, 'debug-page.html');
  fs.writeFileSync(htmlPath, pageHTML);
  console.log('📄 页面 HTML 保存: debug-page.html');

  // 查找所有可能的滑块元素
  console.log('\n🔍 查找滑块元素...\n');

  // 方法 1: 查找所有 input[type="range"]
  const rangeInputs = await page.locator('input[type="range"]').all();
  console.log(`1. input[type="range"] 数量: ${rangeInputs.length}`);

  if (rangeInputs.length > 0) {
    for (let i = 0; i < rangeInputs.length; i++) {
      const input = rangeInputs[i];
      const html = await input.innerHTML();
      const value = await input.inputValue();
      const className = await input.getAttribute('class');
      const parent = await input.evaluate(el => el.parentElement ? el.parentElement.outerHTML.substring(0, 200) : 'no parent');

      console.log(`\n  滑块 ${i}:`);
      console.log(`    Class: ${className}`);
      console.log(`    Value: ${value}`);
      console.log(`    HTML: ${html.substring(0, 100)}`);
      console.log(`    Parent HTML: ${parent}`);
    }
  }

  // 方法 2: 查找所有 .el-slider 元素
  const sliders = await page.locator('.el-slider').all();
  console.log(`\n2. .el-slider 数量: ${sliders.length}`);

  if (sliders.length > 0) {
    for (let i = 0; i < sliders.length; i++) {
      const slider = sliders[i];
      const html = await slider.innerHTML();
      const className = await slider.getAttribute('class');
      const textContent = await slider.textContent();

      console.log(`\n  Slider ${i}:`);
      console.log(`    Class: ${className}`);
      console.log(`    Text: ${textContent.substring(0, 50)}`);
      console.log(`    HTML: ${html.substring(0, 200)}`);
    }
  }

  // 方法 3: 查找 .allocation-sliders 内的所有元素
  const allocationSliders = await page.locator('.allocation-sliders').all();
  console.log(`\n3. .allocation-sliders 数量: ${allocationSliders.length}`);

  if (allocationSliders.length > 0) {
    const allocationSlider = allocationSliders[0];
    const html = await allocationSlider.innerHTML();
    const sliderPath = path.join(__dirname, 'debug-allocation-sliders.html');
    fs.writeFileSync(sliderPath, html);
    console.log(`    HTML 保存: debug-allocation-sliders.html`);

    // 查找内部的所有 input 元素
    const inputs = await allocationSlider.locator('input').all();
    console.log(`    内部 input 元素数量: ${inputs.length}`);

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const className = await input.getAttribute('class');
      const value = await input.inputValue();

      console.log(`\n    Input ${i}:`);
      console.log(`      Type: ${type}`);
      console.log(`      Class: ${className}`);
      console.log(`      Value: ${value}`);
    }
  }

  // 方法 4: 查找所有包含 "低风险"、"中风险"、"高风险" 文本的元素
  console.log(`\n4. 查找风险等级文本元素...`);

  const riskLabels = ['低风险', '中风险', '高风险'];
  for (const label of riskLabels) {
    const elements = await page.locator(`:text("${label}")`).all();
    console.log(`\n  "${label}" 元素数量: ${elements.length}`);

    if (elements.length > 0) {
      const element = elements[0];
      const tagName = await element.evaluate(el => el.tagName);
      const className = await element.getAttribute('class');
      const parent = await element.evaluate(el => el.parentElement ? el.parentElement.className : 'no parent');

      console.log(`    标签名: ${tagName}`);
      console.log(`    Class: ${className}`);
      console.log(`    父元素 Class: ${parent}`);
    }
  }

  await browser.close();
  console.log('\n✅ 调试完成！');
}

debugSliderStructure().catch(console.error);
