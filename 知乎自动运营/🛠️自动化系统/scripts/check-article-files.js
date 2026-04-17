const fs = require('fs');
const path = require('path');

const HIGH_PRIORITY_DIR = '~/.openclaw/workspace/知乎自动运营/📤待发布/🔥高优先级';

// Find all JSON files
const jsonFiles = fs.readdirSync(HIGH_PRIORITY_DIR).filter(f => f.endsWith('.json'));

console.log('📊 检查文章文件匹配情况：\n');

const validArticles = [];

jsonFiles.forEach(jsonFile => {
  const jsonPath = path.join(HIGH_PRIORITY_DIR, jsonFile);
  
  try {
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Find matching MD file (try multiple naming patterns)
    const baseName = jsonFile.replace('-standardized.json', '').replace('.json', '');
    const possibleMdFiles = [
      baseName + '.md',
      baseName + '-quality-report.md',
      baseName + '-evaluation-report.md',
      baseName + '-从单Agent到多Agent协作.md',
      baseName + '-如何颠覆科研.md',
      baseName + '-数学推导加代码实现.md',
      baseName + '-多模态大模型是如何工作的.md',
      baseName + '-一篇文章讲透.md',
      baseName + '-领导都说好.md',
      baseName + '-从云端到边缘设备.md'
    ];
    
    let mdContent = null;
    let usedMdFile = null;
    
    for (const mdFile of possibleMdFiles) {
      const mdPath = path.join(HIGH_PRIORITY_DIR, mdFile);
      if (fs.existsSync(mdPath)) {
        mdContent = fs.readFileSync(mdPath, 'utf8');
        usedMdFile = mdFile;
        break;
      }
    }
    
    if (mdContent) {
      validArticles.push({
        jsonFile: jsonFile,
        mdFile: usedMdFile,
        title: jsonData.title || '未标题',
        tags: jsonData.tags || [],
        content: mdContent
      });
      console.log(`✅ ${jsonData.title || '未标题'}`);
      console.log(`   JSON: ${jsonFile}`);
      console.log(`   MD:  ${usedMdFile}\n`);
    } else {
      console.log(`❌ ${jsonData.title || '未标题'} - 缺少MD文件`);
      console.log(`   JSON: ${jsonFile}\n`);
    }
    
  } catch (error) {
    console.log(`❌ JSON文件解析失败: ${jsonFile}`);
    console.log(`   错误: ${error.message}\n`);
  }
});

console.log(`\n📈 统计结果：`);
console.log(`总JSON文件: ${jsonFiles.length}`);
console.log(`有效文章: ${validArticles.length}`);
console.log(`缺少MD文件: ${jsonFiles.length - validArticles.length}`);

if (validArticles.length > 0) {
  console.log(`\n🎯 推荐优先发布的文章：`);
  validArticles.slice(0, 5).forEach((article, index) => {
    console.log(`${index + 1}. ${article.title} (${article.tags.join(', ')})`);
  });
}