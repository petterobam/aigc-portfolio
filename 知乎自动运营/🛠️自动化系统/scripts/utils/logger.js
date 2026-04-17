/**
 * 日志工具
 *
 * 职责:
 * - 记录日志到控制台
 * - 记录日志到文件
 * - 支持不同日志级别
 * - 格式化日志输出
 */

const fs = require('fs').promises;
const path = require('path');

class Logger {
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(__dirname, '../../logs');
    this.logFile = options.logFile || path.join(this.logDir, 'app.log');
    this.errorFile = options.errorFile || path.join(this.logDir, 'error.log');
    this.logLevel = options.logLevel || 'info'; // debug, info, warn, error
    this.consoleOutput = options.consoleOutput !== false;
    this.fileOutput = options.fileOutput !== false;
  }

  /**
   * 确保日志目录存在
   */
  async ensureDir() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      this.log('debug', `日志目录已创建: ${this.logDir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`[${new Date().toISOString()}] [ERROR] 创建日志目录失败:`, error);
        throw error;
      }
    }
  }

  /**
   * 格式化日志消息
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据（可选）
   * @returns {string} 格式化后的日志消息
   */
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(data && { data })
    };
    return JSON.stringify(logData);
  }

  /**
   * 记录日志
   * @param {string} level - 日志级别 (debug, info, warn, error)
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据（可选）
   */
  async log(level, message, data = null) {
    try {
      // 检查日志级别
      const levels = ['debug', 'info', 'warn', 'error'];
      const currentLevelIndex = levels.indexOf(this.logLevel);
      const logLevelIndex = levels.indexOf(level);

      if (logLevelIndex < currentLevelIndex) {
        return;
      }

      // 格式化消息
      const formattedMessage = this.formatMessage(level, message, data);

      // 输出到控制台
      if (this.consoleOutput) {
        const colors = {
          debug: '\x1b[36m',   // 青色
          info: '\x1b[32m',    // 绿色
          warn: '\x1b[33m',    // 黄色
          error: '\x1b[31m'    // 红色
        };
        const resetColor = '\x1b[0m';
        const timestamp = new Date().toISOString();
        console.log(`${colors[level]}[${timestamp}] [${level.toUpperCase()}]${resetColor} ${message}`);
        if (data) {
          console.log(JSON.stringify(data, null, 2));
        }
      }

      // 输出到文件
      if (this.fileOutput) {
        await this.ensureDir();
        await fs.appendFile(this.logFile, formattedMessage + '\n');

        // 如果是 error 级别，同时写入 error 日志
        if (level === 'error') {
          await fs.appendFile(this.errorFile, formattedMessage + '\n');
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [ERROR] 记录日志失败:`, error);
    }
  }

  /**
   * Debug 级别日志
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据（可选）
   */
  async debug(message, data = null) {
    await this.log('debug', message, data);
  }

  /**
   * Info 级别日志
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据（可选）
   */
  async info(message, data = null) {
    await this.log('info', message, data);
  }

  /**
   * Warn 级别日志
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据（可选）
   */
  async warn(message, data = null) {
    await this.log('warn', message, data);
  }

  /**
   * Error 级别日志
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据（可选）
   */
  async error(message, data = null) {
    await this.log('error', message, data);
  }

  /**
   * 读取日志文件
   * @param {string} filePath - 日志文件路径（可选）
   * @param {number} lines - 读取行数（可选）
   * @returns {Promise<Array>} 日志行数组
   */
  async readLogs(filePath = null, lines = 100) {
    try {
      const targetPath = filePath || this.logFile;

      const data = await fs.readFile(targetPath, 'utf8');
      const logLines = data.split('\n').filter(line => line.trim());

      // 返回最后 N 行
      return logLines.slice(-lines);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.warn(`日志文件不存在: ${filePath || this.logFile}`);
        return [];
      }
      throw error;
    }
  }

  /**
   * 清空日志文件
   * @param {string} filePath - 日志文件路径（可选）
   * @returns {Promise<void>}
   */
  async clearLogs(filePath = null) {
    try {
      const targetPath = filePath || this.logFile;

      await fs.writeFile(targetPath, '');
      await this.info(`日志文件已清空: ${targetPath}`);
    } catch (error) {
      await this.error('清空日志文件失败', error);
      throw error;
    }
  }

  /**
   * 删除旧的日志文件
   * @param {number} days - 保留天数（默认 7 天）
   * @returns {Promise<void>}
   */
  async cleanOldLogs(days = 7) {
    try {
      await this.ensureDir();

      const files = await fs.readdir(this.logDir);
      const now = Date.now();
      const maxAge = days * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          await this.info(`删除旧日志文件: ${file}`);
        }
      }
    } catch (error) {
      await this.error('清理旧日志文件失败', error);
      throw error;
    }
  }

  /**
   * 获取日志文件路径
   * @returns {Object} 日志文件路径
   */
  getLogFilePaths() {
    return {
      logFile: this.logFile,
      errorFile: this.errorFile,
      logDir: this.logDir
    };
  }
}

module.exports = Logger;
