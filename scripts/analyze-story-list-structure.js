/**
 * 分析番茄小说短故事管理页面的 DOM 结构
 *
 * 目标：找到正确的选择器，以便抓取故事列表
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../data/short-manage-2026-03-19T11-00-38.html');

console.log('========================================');
console.log('🔍 分析番茄小说短故事管理页面结构');
console.log('========================================\n');

// 读取 HTML 文件
const html = fs.readFileSync(htmlPath, 'utf8');

console.log('📊 分析结果：\n');

// 查找所有 article-item-title 的标题
const titleRegex = /<div class="article-item-title[^>]*>([^<]+)<\/div>/g;
const titles = [];
let match;
while ((match = titleRegex.exec(html)) !== null) {
  titles.push(match[1].trim());
}

console.log('1️⃣ 找到的标题（article-item-title）：');
titles.forEach((title, index) => {
  console.log(`   ${index + 1}. ${title}`);
});

// 查找阅读量
const readRegex = /<div class="article-item-read">(\d+)阅读<\/div>/g;
const reads = [];
while ((match = readRegex.exec(html)) !== null) {
  reads.push(match[1]);
}

console.log('\n2️⃣ 找到的阅读量（article-item-read）：');
reads.forEach((read, index) => {
  console.log(`   ${index + 1}. ${read}阅读`);
});

// 查找字数
const numberRegex = /<div class="article-item-number">(\d+)字<\/div>/g;
const numbers = [];
while ((match = numberRegex.exec(html)) !== null) {
  numbers.push(match[1]);
}

console.log('\n3️⃣ 找到的字数（article-item-number）：');
numbers.forEach((num, index) => {
  console.log(`   ${index + 1}. ${num}字`);
});

// 查找时间
const timeRegex = /<div class="article-item-time">([^<]+)<\/div>/g;
const times = [];
while ((match = timeRegex.exec(html)) !== null) {
  times.push(match[1]);
}

console.log('\n4️⃣ 找到的发布时间（article-item-time）：');
times.forEach((time, index) => {
  console.log(`   ${index + 1}. ${time}`);
});

// 查找签约状态
const signRegex = /<span class="short-item-sign-tag">([^<]+)<\/span>/g;
const signs = [];
while ((match = signRegex.exec(html)) !== null) {
  signs.push(match[1]);
}

console.log('\n5️⃣ 找到的签约状态（short-item-sign-tag）：');
signs.forEach((sign, index) => {
  console.log(`   ${index + 1}. ${sign}`);
});

// 查找预览链接
const previewRegex = /<a href="\/main\/writer\/preview-short\/(\d+)" target="_blank"/g;
const previewIds = [];
while ((match = previewRegex.exec(html)) !== null) {
  previewIds.push(match[1]);
}

console.log('\n6️⃣ 找到的预览链接 ID：');
previewIds.forEach((id, index) => {
  console.log(`   ${index + 1}. ${id}`);
});

console.log('\n========================================');
console.log('📋 数据总结：');
console.log('========================================');
console.log(`标题数量：${titles.length}`);
console.log(`阅读量数量：${reads.length}`);
console.log(`字数数量：${numbers.length}`);
console.log(`时间数量：${times.length}`);
console.log(`签约状态数量：${signs.length}`);
console.log(`预览链接数量：${previewIds.length}`);

// 生成完整的故事列表数据
const stories = [];
const maxCount = Math.max(titles.length, reads.length, numbers.length, times.length, signs.length, previewIds.length);

for (let i = 0; i < maxCount; i++) {
  stories.push({
    title: titles[i] || '',
    read: reads[i] || '0',
    number: numbers[i] || '0',
    time: times[i] || '',
    sign: signs[i] || '',
    previewId: previewIds[i] || ''
  });
}

console.log('\n========================================');
console.log('📄 完整故事列表：');
console.log('========================================');
stories.forEach((story, index) => {
  console.log(`${index + 1}. ${story.title}`);
  console.log(`   阅读量: ${story.read}, 字数: ${story.number}`);
  console.log(`   发布时间: ${story.time}, 签约状态: ${story.sign}`);
  console.log(`   预览ID: ${story.previewId}`);
  console.log('');
});

// 保存 JSON
const jsonPath = path.join(__dirname, '../data/stories-analyzed-2026-03-19T11-00-38.json');
fs.writeFileSync(jsonPath, JSON.stringify(stories, null, 2), 'utf8');
console.log('✅ 分析结果已保存:', jsonPath);

// 生成正确的选择器建议
console.log('\n========================================');
console.log('🎯 正确的选择器建议：');
console.log('========================================');
console.log('每个故事项的容器：');
console.log('  - .short-article-table-item 或 .short-article-item-wrapper');
console.log('');
console.log('标题选择器：');
console.log('  - .article-item-title');
console.log('');
console.log('阅读量选择器：');
console.log('  - .article-item-read');
console.log('');
console.log('字数选择器：');
console.log('  - .article-item-number');
console.log('');
console.log('时间选择器：');
console.log('  - .article-item-time');
console.log('');
console.log('签约状态选择器：');
console.log('  - .short-item-sign-tag');
console.log('');
console.log('预览链接选择器：');
console.log('  - a[href*="/main/writer/preview-short/"]');
console.log('');
console.log('========================================');
