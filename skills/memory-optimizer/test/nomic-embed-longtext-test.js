#!/usr/bin/env node

/**
 * 测试 nomic-embed-text 模型的长文本处理能力
 * 目标：验证该模型能否处理超过 20000 字符的文本
 */

const http = require('http');

function generateEmbedding(text, model = 'nomic-embed-text') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: model,
      prompt: text
    });

    const options = {
      hostname: 'localhost',
      port: 11434,
      path: '/api/embeddings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.embedding) {
            resolve(result.embedding);
          } else if (result.error) {
            reject(new Error(result.error));
          } else {
            reject(new Error('No embedding in response'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testLongText() {
  console.log('🧪 测试 nomic-embed-text 长文本处理能力\n');

  const testCases = [
    { length: 10000, label: '10,000 字符' },
    { length: 20000, label: '20,000 字符' },
    { length: 30000, label: '30,000 字符' },
    { length: 40000, label: '40,000 字符' },
    { length: 50000, label: '50,000 字符' }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`📝 测试 ${testCase.label}...`);
      const testText = 'a'.repeat(testCase.length);
      const start = Date.now();
      const embedding = await generateEmbedding(testText, 'nomic-embed-text');
      const duration = Date.now() - start;
      console.log(`  ✅ 成功！向量维度: ${embedding.length}, 耗时: ${duration}ms\n`);
    } catch (error) {
      console.log(`  ❌ 失败: ${error.message}\n`);
      // 如果失败，停止后续测试
      if (testCase.length >= 20000) {
        console.log('⚠️  模型无法处理超过 ' + testCase.length + ' 字符的文本');
        break;
      }
    }
  }

  console.log('📊 测试完成');
}

testLongText().catch(console.error);
