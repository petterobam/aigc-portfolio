#!/usr/bin/env node

/**
 * debug-network.js
 *
 * 网络诊断脚本
 * 测试各个数据源的可访问性，分析超时问题的根本原因
 */

const http = require('http');
const https = require('https');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace/知乎自动运营');
const DEBUG_DIR = path.join(WORKSPACE_DIR, '🛠️自动化系统', 'debug');
const REPORT_FILE = path.join(DEBUG_DIR, 'network-diagnosis.json');

// 测试目标
const TARGETS = [
  {
    name: '知乎热榜',
    url: 'https://www.zhihu.com/hot',
    type: 'https',
    method: 'simple', // simple: HTTP请求, browser: 浏览器访问
    priority: 'high'
  },
  {
    name: 'Hacker News',
    url: 'https://news.ycombinator.com/',
    type: 'https',
    method: 'simple',
    priority: 'medium'
  },
  {
    name: 'GitHub Trending',
    url: 'https://github.com/trending',
    type: 'https',
    method: 'simple',
    priority: 'medium'
  },
  {
    name: 'arXiv AI',
    url: 'https://arxiv.org/list/cs.AI/recent',
    type: 'https',
    method: 'simple',
    priority: 'low'
  }
];

/**
 * 简单 HTTP 请求测试
 */
function testSimpleHttpRequest(target, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const protocol = target.type === 'https' ? https : http;

    console.log(`\n🔍 测试 ${target.name} (HTTP 请求)...`);
    console.log(`   URL: ${target.url}`);

    const startTime = Date.now();
    let redirects = 0;
    const maxRedirects = 5;

    const makeRequest = (url) => {
      const parsedUrl = new URL(url);

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (target.type === 'https' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: timeout
      };

      const req = protocol.request(options, (res) => {
        const responseTime = Date.now() - startTime;

        // 处理重定向
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          redirects++;
          if (redirects <= maxRedirects) {
            console.log(`   ⚠️  重定向 (${res.statusCode}) -> ${res.headers.location}`);
            makeRequest(res.headers.location);
            return;
          } else {
            reject(new Error(`超过最大重定向次数 (${maxRedirects})`));
            return;
          }
        }

        // 收集响应数据
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          const result = {
            success: true,
            method: 'simple',
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
            contentLength: data.length,
            responseTime: responseTime,
            redirects: redirects,
            contentType: res.headers['content-type'] || '',
            contentEncoding: res.headers['content-encoding'] || '',
            timestamp: new Date().toISOString()
          };

          console.log(`   ✅ 成功`);
          console.log(`   状态码: ${res.statusCode}`);
          console.log(`   响应时间: ${responseTime}ms`);
          console.log(`   内容长度: ${data.length} bytes`);
          console.log(`   Content-Type: ${res.headers['content-type'] || 'N/A'}`);
          console.log(`   重定向次数: ${redirects}`);

          // 保存响应头和前 500 字符内容
          result.contentPreview = data.substring(0, 500);
          resolve(result);
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        console.log(`   ❌ 失败`);
        console.log(`   错误: ${error.message}`);
        console.log(`   响应时间: ${responseTime}ms`);

        reject({
          success: false,
          method: 'simple',
          error: error.message,
          errorCode: error.code,
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        });
      });

      req.on('timeout', () => {
        const responseTime = Date.now() - startTime;
        console.log(`   ❌ 超时`);
        console.log(`   超时时间: ${timeout}ms`);

        req.destroy();
        reject({
          success: false,
          method: 'simple',
          error: 'Request timeout',
          errorCode: 'ETIMEDOUT',
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        });
      });

      req.end();
    };

    makeRequest(target.url);
  });
}

/**
 * 浏览器访问测试
 */
async function testBrowserAccess(target, timeout = 60000) {
  console.log(`\n🌐 测试 ${target.name} (浏览器访问)...`);
  console.log(`   URL: ${target.url}`);

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  });

  const page = await context.newPage();

  const startTime = Date.now();
  let result;

  try {
    await page.goto(target.url, {
      waitUntil: 'domcontentloaded',
      timeout: timeout
    });

    const responseTime = Date.now() - startTime;

    // 获取页面信息
    const title = await page.title();
    const url = page.url();
    const contentLength = await page.evaluate(() => document.body.innerHTML.length);

    result = {
      success: true,
      method: 'browser',
      title: title,
      url: url,
      contentLength: contentLength,
      responseTime: responseTime,
      timestamp: new Date().toISOString()
    };

    console.log(`   ✅ 成功`);
    console.log(`   响应时间: ${responseTime}ms`);
    console.log(`   页面标题: ${title.substring(0, 50)}...`);
    console.log(`   内容长度: ${contentLength} bytes`);

  } catch (error) {
    const responseTime = Date.now() - startTime;

    result = {
      success: false,
      method: 'browser',
      error: error.message,
      errorCode: error.name,
      responseTime: responseTime,
      timestamp: new Date().toISOString()
    };

    console.log(`   ❌ 失败`);
    console.log(`   错误: ${error.message}`);
    console.log(`   响应时间: ${responseTime}ms`);
  }

  await browser.close();
  return result;
}

/**
 * DNS 解析测试
 */
function testDNSResolution(hostname) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 测试 DNS 解析: ${hostname}`);

    const startTime = Date.now();

    require('dns').resolve(hostname, (err, addresses) => {
      const resolveTime = Date.now() - startTime;

      if (err) {
        console.log(`   ❌ 失败: ${err.message}`);
        console.log(`   解析时间: ${resolveTime}ms`);

        reject({
          success: false,
          error: err.message,
          errorCode: err.code,
          resolveTime: resolveTime
        });
      } else {
        console.log(`   ✅ 成功`);
        console.log(`   IP 地址: ${addresses.join(', ')}`);
        console.log(`   解析时间: ${resolveTime}ms`);

        resolve({
          success: true,
          addresses: addresses,
          resolveTime: resolveTime
        });
      }
    });
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('═'.repeat(60));
  console.log('  网络诊断脚本');
  console.log('═'.repeat(60));

  const results = [];

  // 1. DNS 解析测试
  console.log('\n\n' + '═'.repeat(60));
  console.log('  第 1 步：DNS 解析测试');
  console.log('═'.repeat(60));

  for (const target of TARGETS) {
    try {
      const url = new URL(target.url);
      const dnsResult = await testDNSResolution(url.hostname);
      results.push({
        target: target.name,
        type: 'dns',
        ...dnsResult
      });
    } catch (error) {
      results.push({
        target: target.name,
        type: 'dns',
        ...error
      });
    }
  }

  // 2. HTTP 请求测试
  console.log('\n\n' + '═'.repeat(60));
  console.log('  第 2 步：HTTP 请求测试');
  console.log('═'.repeat(60));

  for (const target of TARGETS) {
    try {
      const result = await testSimpleHttpRequest(target, 30000);
      results.push({
        target: target.name,
        ...result
      });
    } catch (error) {
      results.push({
        target: target.name,
        ...error
      });
    }
  }

  // 3. 浏览器访问测试（仅测试有问题的目标）
  console.log('\n\n' + '═'.repeat(60));
  console.log('  第 3 步：浏览器访问测试（仅测试超时目标）');
  console.log('═'.repeat(60));

  const timeoutTargets = results.filter(r =>
    r.method === 'simple' && (!r.success || r.errorCode === 'ETIMEDOUT')
  ).map(r => r.target);

  if (timeoutTargets.length === 0) {
    console.log('✅ 所有目标 HTTP 请求测试通过，跳过浏览器测试');
  } else {
    console.log(`⚠️  发现 ${timeoutTargets.length} 个超时目标，进行浏览器测试：`);
    console.log(`   ${timeoutTargets.join(', ')}`);

    for (const targetName of timeoutTargets) {
      const target = TARGETS.find(t => t.name === targetName);
      if (!target) continue;

      try {
        const result = await testBrowserAccess(target, 60000);
        results.push({
          target: target.name,
          ...result
        });
      } catch (error) {
        results.push({
          target: target.name,
          ...error
        });
      }
    }
  }

  // 4. 生成报告
  console.log('\n\n' + '═'.repeat(60));
  console.log('  第 4 步：生成诊断报告');
  console.log('═'.repeat(60));

  // 创建目录
  if (!fs.existsSync(DEBUG_DIR)) {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
  }

  // 保存报告
  fs.writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n💾 报告已保存到: ${REPORT_FILE}`);

  // 汇总结果
  console.log('\n\n' + '═'.repeat(60));
  console.log('  诊断汇总');
  console.log('═'.repeat(60));

  const summary = {};

  for (const target of TARGETS) {
    const targetResults = results.filter(r => r.target === target.name);

    const dnsResult = targetResults.find(r => r.type === 'dns');
    const simpleResult = targetResults.find(r => r.method === 'simple');
    const browserResult = targetResults.find(r => r.method === 'browser');

    const summaryItem = {
      name: target.name,
      priority: target.priority,
      dns: {
        success: dnsResult?.success || false,
        resolveTime: dnsResult?.resolveTime || 0
      },
      simple: {
        success: simpleResult?.success || false,
        responseTime: simpleResult?.responseTime || 0,
        error: simpleResult?.error || null
      },
      browser: {
        success: browserResult?.success || null,
        responseTime: browserResult?.responseTime || 0,
        error: browserResult?.error || null
      }
    };

    summary[target.name] = summaryItem;

    // 打印汇总
    console.log(`\n📊 ${target.name} (优先级: ${target.priority})`);
    console.log(`   DNS 解析: ${summaryItem.dns.success ? '✅' : '❌'} (${summaryItem.dns.resolveTime}ms)`);
    console.log(`   HTTP 请求: ${summaryItem.simple.success ? '✅' : '❌'} (${summaryItem.simple.responseTime}ms)`);
    if (simpleResult?.error) {
      console.log(`   错误: ${simpleResult.error}`);
    }
    if (browserResult !== undefined) {
      console.log(`   浏览器访问: ${summaryItem.browser.success ? '✅' : '❌'} (${summaryItem.browser.responseTime}ms)`);
      if (browserResult?.error) {
        console.log(`   错误: ${browserResult.error}`);
      }
    }
  }

  // 保存汇总
  const summaryFile = path.join(DEBUG_DIR, `network-summary-${Date.now()}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`\n💾 汇总已保存到: ${summaryFile}`);

  // 5. 生成建议
  console.log('\n\n' + '═'.repeat(60));
  console.log('  优化建议');
  console.log('═'.repeat(60));

  const suggestions = [];

  for (const target of TARGETS) {
    const targetResults = results.filter(r => r.target === target.name);
    const simpleResult = targetResults.find(r => r.method === 'simple');
    const browserResult = targetResults.find(r => r.method === 'browser');

    if (!simpleResult?.success) {
      if (browserResult?.success) {
        suggestions.push({
          target: target.name,
          issue: 'HTTP 请求失败，但浏览器访问成功',
          solution: '网站检测到自动化工具，需要增加请求头伪装或使用浏览器自动化',
          priority: target.priority
        });
      } else {
        suggestions.push({
          target: target.name,
          issue: 'HTTP 请求和浏览器访问都失败',
          solution: '网络连接问题或网站不可访问，检查网络连接或考虑使用代理',
          priority: target.priority
        });
      }
    } else if (simpleResult?.responseTime > 10000) {
      suggestions.push({
        target: target.name,
        issue: `HTTP 响应时间过长 (${simpleResult.responseTime}ms)`,
        solution: '增加超时时间或使用更快的网络连接',
        priority: target.priority
      });
    }
  }

  // 按优先级排序
  suggestions.sort((a, b) => {
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (suggestions.length === 0) {
    console.log('✅ 所有测试通过，无需优化');
  } else {
    suggestions.forEach((suggestion, index) => {
      console.log(`\n${index + 1}. ${suggestion.target} (优先级: ${suggestion.priority})`);
      console.log(`   问题: ${suggestion.issue}`);
      console.log(`   建议: ${suggestion.solution}`);
    });
  }

  // 保存建议
  const suggestionsFile = path.join(DEBUG_DIR, `network-suggestions-${Date.now()}.json`);
  fs.writeFileSync(suggestionsFile, JSON.stringify(suggestions, null, 2), 'utf8');
  console.log(`\n💾 建议已保存到: ${suggestionsFile}`);

  console.log('\n\n' + '═'.repeat(60));
  console.log('  ✅ 诊断完成');
  console.log('═'.repeat(60));

  return { results, summary, suggestions };
}

// 运行主函数
main().catch(err => {
  console.error('\n❌ 发生错误:', err);
  console.error(err.stack);
  process.exit(1);
});
