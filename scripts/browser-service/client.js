#!/usr/bin/env node

/**
 * 番茄小说浏览器长连接服务客户端
 *
 * 通过 HTTP API 调用浏览器服务，保持 session
 */

const http = require('http');

// 配置
const CONFIG = {
  HOST: '127.0.0.1',
  PORT: 3001,
  BASE_URL: `http://127.0.0.1:3001`,
};

/**
 * 发送 HTTP 请求
 */
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CONFIG.BASE_URL);
    const options = {
      method,
      hostname: CONFIG.HOST,
      port: CONFIG.PORT,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`${res.statusCode}: ${json.error || body}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * 获取服务状态
 */
async function getStatus() {
  return await request('GET', '/status');
}

/**
 * 检查登录状态
 */
async function checkLogin() {
  return await request('GET', '/login');
}

/**
 * 导航到指定 URL
 */
async function navigate(url) {
  return await request('POST', '/navigate', { url });
}

/**
 * 执行 JavaScript 代码
 */
async function execute(code) {
  return await request('POST', '/execute', { code });
}

/**
 * 点击元素
 */
async function click(selector) {
  return await request('POST', '/click', { selector });
}

/**
 * 输入文字
 */
async function type(selector, text) {
  return await request('POST', '/type', { selector, text });
}

/**
 * 等待元素
 */
async function waitFor(selector, timeout) {
  return await request('POST', '/wait', { selector, timeout });
}

/**
 * 截图
 */
async function screenshot() {
  return await request('GET', '/screenshot');
}

/**
 * 获取页面内容
 */
async function getContent() {
  return await request('GET', '/content');
}

/**
 * 获取番茄小说短故事列表
 */
async function getFanqieStories() {
  return await request('GET', '/fanqie/stories');
}

/**
 * 导航到番茄小说指定页面
 */
async function navigateFanqie(path) {
  return await request('POST', '/fanqie/navigate', { path });
}

// ===== 命令行接口 =====

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'status':
        const status = await getStatus();
        console.log(JSON.stringify(status, null, 2));
        break;

      case 'login':
        const login = await checkLogin();
        console.log(JSON.stringify(login, null, 2));
        break;

      case 'navigate':
        const navResult = await navigate(args[0]);
        console.log(JSON.stringify(navResult, null, 2));
        break;

      case 'execute':
        const code = args.join(' ');
        const execResult = await execute(code);
        console.log(JSON.stringify(execResult, null, 2));
        break;

      case 'click':
        const clickResult = await click(args[0]);
        console.log(JSON.stringify(clickResult, null, 2));
        break;

      case 'type':
        const typeResult = await type(args[0], args.slice(1).join(' '));
        console.log(JSON.stringify(typeResult, null, 2));
        break;

      case 'wait':
        const waitResult = await waitFor(args[0], parseInt(args[1]) || 10000);
        console.log(JSON.stringify(waitResult, null, 2));
        break;

      case 'screenshot':
        const shotResult = await screenshot();
        console.log(JSON.stringify(shotResult, null, 2));
        break;

      case 'content':
        const content = await getContent();
        console.log(JSON.stringify(content, null, 2));
        break;

      case 'fanqie-stories':
        const stories = await getFanqieStories();
        console.log(JSON.stringify(stories, null, 2));
        break;

      case 'fanqie-navigate':
        const fanqieNavResult = await navigateFanqie(args[0]);
        console.log(JSON.stringify(fanqieNavResult, null, 2));
        break;

      default:
        console.log(`
番茄小说浏览器长连接服务客户端

用法:
  node client.js <command> [args...]

命令:
  status                    获取服务状态
  login                     检查登录状态
  navigate <url>            导航到指定 URL
  execute <code>            执行 JavaScript 代码
  click <selector>          点击元素
  type <selector> <text>    输入文字
  wait <selector> [timeout] 等待元素
  screenshot                截图
  content                   获取页面内容
  fanqie-stories            获取番茄小说短故事列表
  fanqie-navigate <path>    导航到番茄小说指定页面

示例:
  node client.js status
  node client.js login
  node client.js fanqie-stories
  node client.js navigate https://fanqienovel.com/main/writer/short-manage
        `);
    }
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

// 导出 API（供模块使用）
module.exports = {
  getStatus,
  checkLogin,
  navigate,
  execute,
  click,
  type,
  waitFor,
  screenshot,
  getContent,
  getFanqieStories,
  navigateFanqie,
};

// 如果直接运行此脚本
if (require.main === module) {
  main();
}
