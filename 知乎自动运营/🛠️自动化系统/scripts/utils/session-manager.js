/**
 * Session 管理器
 *
 * 职责:
 * - 创建持久化浏览器上下文
 * - 保存上下文状态
 * - 恢复上下文状态
 * - 管理浏览器生命周期
 */

const fs = require('fs').promises;
const path = require('path');

class SessionManager {
  constructor(options = {}) {
    this.sessionDir = options.sessionDir || path.join(__dirname, '../../auth');
    this.userDataDir = options.userDataDir || path.join(this.sessionDir, 'user-data-dir');
    this.sessionFile = options.sessionFile || path.join(this.sessionDir, 'session.json');
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
      await fs.mkdir(this.sessionDir, { recursive: true });
      this.log('info', `Session 目录已创建: ${this.sessionDir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        this.log('error', '创建 Session 目录失败', error);
        throw error;
      }
    }
  }

  /**
   * 创建持久化上下文
   * @param {Object} browser - Playwright 浏览器实例
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 持久化上下文
   */
  async createContext(browser, options = {}) {
    try {
      await this.ensureDir();

      const {
        storageState = null,
        viewport = { width: 1280, height: 800 },
        userAgent = null,
        locale = 'zh-CN',
        timezoneId = 'Asia/Shanghai'
      } = options;

      // 如果有 storageState，先尝试恢复
      const contextOptions = {
        viewport,
        locale,
        timezoneId
      };

      if (storageState) {
        contextOptions.storageState = storageState;
        this.log('info', `从 storageState 创建上下文: ${storageState}`);
      } else if (await this.sessionExists()) {
        contextOptions.storageState = this.sessionFile;
        this.log('info', `从 sessionFile 创建上下文: ${this.sessionFile}`);
      }

      if (userAgent) {
        contextOptions.userAgent = userAgent;
      }

      const context = await browser.newContext(contextOptions);

      this.log('info', '持久化上下文创建成功');

      return context;
    } catch (error) {
      this.log('error', '创建持久化上下文失败', error);
      throw error;
    }
  }

  /**
   * 创建用户数据目录上下文
   * @param {Object} browser - Playwright 浏览器实例
   * @param {string} userDataDir - 用户数据目录（可选）
   * @returns {Promise<Object>} 持久化上下文
   */
  async createUserDataDirContext(browser, userDataDir = null) {
    try {
      await this.ensureDir();

      const targetUserDataDir = userDataDir || this.userDataDir;

      // 创建上下文时指定用户数据目录
      const context = await browser.newContext({
        storageState: targetUserDataDir,
        viewport: { width: 1280, height: 800 },
        locale: 'zh-CN',
        timezoneId: 'Asia/Shanghai'
      });

      this.log('info', `用户数据目录上下文创建成功: ${targetUserDataDir}`);

      return context;
    } catch (error) {
      this.log('error', '创建用户数据目录上下文失败', error);
      throw error;
    }
  }

  /**
   * 保存上下文状态
   * @param {Object} context - Playwright 上下文
   * @param {string} path - 状态文件路径（可选）
   * @returns {Promise<void>}
   */
  async saveState(context, filePath = null) {
    try {
      await this.ensureDir();

      const targetPath = filePath || this.sessionFile;

      // 保存状态到文件
      await context.storageState({ path: targetPath });

      this.log('info', `上下文状态已保存: ${targetPath}`);
    } catch (error) {
      this.log('error', '保存上下文状态失败', error);
      throw error;
    }
  }

  /**
   * 恢复上下文状态
   * @param {Object} browser - Playwright 浏览器实例
   * @param {string} path - 状态文件路径（可选）
   * @returns {Promise<Object>} 恢复的上下文
   */
  async restoreState(browser, filePath = null) {
    try {
      const targetPath = filePath || this.sessionFile;

      // 检查文件是否存在
      try {
        await fs.access(targetPath);
      } catch (error) {
        this.log('warn', `状态文件不存在: ${targetPath}`);
        return null;
      }

      // 从状态文件创建上下文
      const context = await browser.newContext({
        storageState: targetPath,
        viewport: { width: 1280, height: 800 },
        locale: 'zh-CN',
        timezoneId: 'Asia/Shanghai'
      });

      this.log('info', `上下文状态已恢复: ${targetPath}`);

      return context;
    } catch (error) {
      this.log('error', '恢复上下文状态失败', error);
      throw error;
    }
  }

  /**
   * 检查 Session 是否存在
   * @returns {Promise<boolean>} Session 是否存在
   */
  async sessionExists() {
    try {
      await fs.access(this.sessionFile);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取 Session 信息
   * @returns {Promise<Object|null>} Session 信息
   */
  async getSessionInfo() {
    try {
      if (!await this.sessionExists()) {
        return null;
      }

      const data = await fs.readFile(this.sessionFile, 'utf8');
      const session = JSON.parse(data);

      this.log('info', `Session 信息: ${JSON.stringify(session)}`);

      return session;
    } catch (error) {
      this.log('error', '获取 Session 信息失败', error);
      throw error;
    }
  }

  /**
   * 删除 Session
   * @param {string} path - Session 文件路径（可选）
   * @returns {Promise<void>}
   */
  async deleteSession(filePath = null) {
    try {
      const targetPath = filePath || this.sessionFile;

      await fs.unlink(targetPath);
      this.log('info', `Session 已删除: ${targetPath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.log('error', '删除 Session 失败', error);
        throw error;
      }
      this.log('warn', `Session 不存在: ${targetPath}`);
    }
  }

  /**
   * 创建浏览器实例
   * @param {Object} playwright - Playwright 实例
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 浏览器实例
   */
  async createBrowser(playwright, options = {}) {
    try {
      const {
        headless = false,
        slowMo = 0,
        devtools = false
      } = options;

      const browser = await playwright.chromium.launch({
        headless,
        slowMo,
        devtools,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process'
        ]
      });

      this.log('info', '浏览器实例创建成功');

      return browser;
    } catch (error) {
      this.log('error', '创建浏览器实例失败', error);
      throw error;
    }
  }

  /**
   * 关闭浏览器
   * @param {Object} browser - 浏览器实例
   * @returns {Promise<void>}
   */
  async closeBrowser(browser) {
    try {
      if (browser) {
        await browser.close();
        this.log('info', '浏览器实例已关闭');
      }
    } catch (error) {
      this.log('error', '关闭浏览器实例失败', error);
      throw error;
    }
  }

  /**
   * 获取 Session 文件路径
   * @returns {string} Session 文件路径
   */
  getSessionFilePath() {
    return this.sessionFile;
  }

  /**
   * 获取用户数据目录路径
   * @returns {string} 用户数据目录路径
   */
  getUserDataDirPath() {
    return this.userDataDir;
  }
}

module.exports = SessionManager;
