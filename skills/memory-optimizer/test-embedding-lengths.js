#!/usr/bin/env node

// Test script to check vector generation with different content lengths
const http = require('http');

function testEmbeddingLength(length) {
  return new Promise((resolve, reject) => {
    const content = 'x'.repeat(length);
    console.log(`Testing content length: ${length}`);

    const postData = JSON.stringify({
      model: 'gemma:2b',
      prompt: content
    });

    const options = {
      hostname: 'localhost',
      port: 11434,
      path: '/api/embeddings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { 
        try {
          const result = JSON.parse(data);
          resolve({
            length: length,
            dimension: result.embedding.length,
            success: true
          });
        } catch (e) {
          resolve({
            length: length,
            error: e.message,
            success: false
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        length: length,
        error: e.message,
        success: false
      });
    });

    req.setTimeout(8000);
    req.write(postData);
    req.end();
  });
}

// Test different lengths
const lengths = [8000, 10000, 12000, 15000, 20000];

async function runTests() {
  for (const length of lengths) {
    const result = await testEmbeddingLength(length);
    console.log(result);
    console.log('---');
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

runTests().catch(console.error);