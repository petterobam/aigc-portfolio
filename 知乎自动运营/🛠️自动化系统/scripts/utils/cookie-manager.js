/**
 * Cookie 管理器
 *
 * 职责:
 * - 保存 Cookie 到 JSON 文件
 * - 加载 Cookie 到 Playwright 上下文
 * - 检测 Cookie 是否有效
 * - 刷新过期 Cookie
 */

const fs = require('fs').promises;
const path = require('path');

class CookieManager {
  constructor(options = {}) {
    this.cookieDir = options.cookieDir || path.join(__dirname, '../auth');
    this.cookieFile = options.cookieFile || path.join(this.cookieDir, 'cookies.json');
    this.logLevel = options.logLevel || 'info';
  }

  /**
   * 记录日志
   */
  log(level, message, data = null) {
    if (this.logLevel === 'debug' || level === 'error') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  /**
   * 确保目录存在
   */
  async ensureDir() {
    try {
      await fs.mkdir(this.cookieDir, { recursive: true });
      this.log('info', `Cookie 目录已创建: ${this.cookieDir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        this.log('error', '创建 Cookie 目录失败', error);
        throw error;
      }
    }
  }

  /**
   * 保存 Cookie 到 JSON 文件
   * @param {Array} cookies - Cookie 数组
   * @param {string} path - Cookie 文件路径（可选）
   * @returns {Promise<void>}
   */
  async saveCookies(cookies, filePath = null) {
    try {
      await this.ensureDir();

      const targetPath = filePath || this.cookieFile;

      // 过滤无效的 Cookie
      const validCookies = cookies.filter(cookie => {
        return cookie.name && cookie.value;
      });

      await fs.writeFile(targetPath, JSON.stringify(validCookies, null, 2));
      this.log('info', `保存 ${validCookies.length} 个 Cookie 到 ${targetPath}`);

      return validCookies;
    } catch (error) {
      this.log('error', '保存 Cookie 失败', error);
      throw error;
    }
  }

  /**
   * 加载 Cookie 从 JSON 文件
   * @param {string} path - Cookie 文件路径（可选）
   * @returns {Promise<Array>} Cookie 数组
   */
  async loadCookies(filePath = null) {
    try {
      const targetPath = filePath || this.cookieFile;

      const data = await fs.readFile(targetPath, 'utf8');
      const cookies = JSON.parse(data);

      // 过滤过期的 Cookie
      const now = Math.floor(Date.now() / 1000);
      const validCookies = cookies.filter(cookie => {
        if (cookie.expires && cookie.expires < now) {
          this.log('warn', `Cookie 过期: ${cookie.name}`);
          return false;
        }
        return true;
      });

      if (validCookies.length < cookies.length) {
        this.log('warn', `过滤掉 ${cookies.length - validCookies.length} 个过期 Cookie`);
      }

      this.log('info', `加载 ${validCookies.length} 个 Cookie 从 ${targetPath}`);

      return validCookies;
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.log('warn', `Cookie 文件不存在: ${filePath || this.cookieFile}`);
        return [];
      }
      this.log('error', '加载 Cookie 失败', error);
      throw error;
    }
  }

  /**
   * 检测 Cookie 是否有效
   * @param {Array} cookies - Cookie 数组
   * @param {string} testUrl - 测试 URL（可选）
   * @param {Object} context - Playwright 上下文
   * @returns {Promise<boolean>} Cookie 是否有效
   */
  async validateCookies(cookies, testUrl = 'https://www.zhihu.com', context = null) {
    try {
      if (!cookies || cookies.length === 0) {
        this.log('warn', 'Cookie 为空');
        return false;
      }

      this.log('info', `验证 ${cookies.length} 个 Cookie`);

      // 如果有 context，直接在浏览器中测试
      if (context) {
        await context.addCookies(cookies);
        const page = await context.newPage();

        await page.goto(testUrl, { waitUntil: 'domcontentloaded' });

        // 检查是否跳转到登录页
        const isLoginPage = await page.url().includes('signin');

        await page.close();

        if (isLoginPage) {
          this.log('warn', 'Cookie 无效：跳转到登录页');
          return false;
        }

        this.log('info', 'Cookie 验证通过');
        return true;
      }

      // 如果没有 context，只检查 Cookie 是否过期
      const now = Math.floor(Date.now() / 1000);
      const hasExpiredCookie = cookies.some(cookie => {
        return cookie.expires && cookie.expires < now;
      });

      if (hasExpiredCookie) {
        this.log('warn', 'Cookie 包含过期项');
        return false;
      }

      this.log('info', 'Cookie 验证通过（仅检查过期）');
      return true;
    } catch (error) {
      this.log('error', '验证 Cookie 失败', error);
      return false;
    }
  }

  /**
   * 从 Playwright 上下文提取 Cookie
   * @param {Object} context - Playwright 上下文
   * @param {Array} urls - URL 列表（可选）
   * @returns {Promise<Array>} Cookie 数组
   */
  async extractCookies(context, urls = ['https://www.zhihu.com']) {
    try {
      const cookies = await context.cookies(...urls);

      this.log('info', `从上下文提取 ${cookies.length} 个 Cookie`);

      return cookies;
    } catch (error) {
      this.log('error', '提取 Cookie 失败', error);
      throw error;
    }
  }

  /**
   * 刷新过期 Cookie
   * @param {Object} context - Playwright 上下文
   * @param {string} testUrl - 测试 URL
   * @returns {Promise<Array>} 刷新后的 Cookie 数组
   */
  async refreshCookies(context, testUrl = 'https://www.zhihu.com') {
    try {
      this.log('info', '刷新 Cookie');

      // 导航到测试页面，触发 Cookie 刷新
      const page = await context.newPage();
      await page.goto(testUrl, { waitUntil: 'networkidle' });

      // 等待页面加载完成
      await page.waitForTimeout(2000);

      // 提取新的 Cookie
      const newCookies = await context.cookies([testUrl]);

      await page.close();

      // 保存新的 Cookie
      await this.saveCookies(newCookies);

      this.log('info', `刷新 ${newCookies.length} 个 Cookie`);

      return newCookies;
    } catch (error) {
      this.log('error', '刷新 Cookie 失败', error);
      throw error;
    }
  }

  /**
   * 列出所有 Cookie
   * @returns {Promise<Array>} Cookie 数组
   */
  async listCookies() {
    try {
      const cookies = await this.loadCookies();
      this.log('info', `列出 ${cookies.length} 个 Cookie`);

      return cookies;
    } catch (error) {
      this.log('error', '列出 Cookie 失败', error);
      throw error;
    }
  }

  /**
   * 删除 Cookie 文件
   * @param {string} path - Cookie 文件路径（可选）
   * @returns {Promise<void>}
   */
  async deleteCookies(filePath = null) {
    try {
      const targetPath = filePath || this.cookieFile;

      await fs.unlink(targetPath);
      this.log('info', `删除 Cookie 文件: ${targetPath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.log('error', '删除 Cookie 文件失败', error);
        throw error;
      }
      this.log('warn', `Cookie 文件不存在: ${targetPath}`);
    }
  }

  /**
   * 获取 Cookie 文件路径
   * @returns {string} Cookie 文件路径
   */
  getCookieFilePath() {
    return this.cookieFile;
  }
}

module.exports = CookieManager;
