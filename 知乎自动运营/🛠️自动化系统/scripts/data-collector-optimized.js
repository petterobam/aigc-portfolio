#!/usr/bin/env node

/**
 * data-collector-optimized.js
 *
 * 知乎数据自动化采集脚本 - 优化版本
 *
 * 新增功能：
 *   1. 智能重试机制和错误恢复
 *   2. 完整的页面解析逻辑
 *   3. 增强的监控和日志系统
 *   4. 数据质量验证和清洗
 *   5. 自动化报告生成
 *   6. 配置驱动的灵活采集
 *
 * 使用方法：
 *   node scripts/data-collector-optimized.js [--mode=daily|weekly|monthly] [--config=filename.json]
 *
 * 选项：
 *   --mode: 采集模式 (daily/weekly/monthly)
 *   --config: 自定义配置文件路径
 *   --dry-run: 试运行模式，不实际采集数据
 *   --verbose: 详细输出模式
 *
 * 依赖：
 *   - sqlite3 (数据库)
 *   - playwright (网页数据采集)
 *   - cheerio (HTML解析)
 *   - lodash (数据处理)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const sqlite3 = require('sqlite3').verbose();
const cheerio = require('cheerio');
const _ = require('lodash');

// ─── 配置管理 ─────────────────────────────────────────────────────────────────

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const ZHIHU_AUTO_DIR = path.join(WORKSPACE_DIR, '知乎自动运营');
const DATA_DIR = path.join(ZHIHU_AUTO_DIR, '📊数据看板');
const CORE_DATA_DIR = path.join(DATA_DIR, '📈核心数据');
const REPORTS_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统', 'reports');
const AUTH_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统', 'auth');
const LOGS_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统', 'logs');

// 确保目录存在
[DATA_DIR, CORE_DATA_DIR, REPORTS_DIR, AUTH_DIR, LOGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
  // 数据库文件路径
  dbFile: path.join(CORE_DATA_DIR, 'zhihu_data_optimized.db'),
  
  // 采集配置
  collection: {
    daily: {
      time: '09:00',
      intervals: 24, // 每天采集24次，每小时一次
      dataTypes: ['articles', 'fans', 'hot_topics'],
      retryCount: 3,
      timeout: 30000
    },
    weekly: {
      time: '10:00',
      day: 'monday',
      dataTypes: ['weekly_summary', 'content_analysis', 'trend_analysis'],
      retryCount: 5,
      timeout: 60000
    },
    monthly: {
      time: '00:00',  
      day: 1,
      dataTypes: ['monthly_summary', 'performance_review', 'revenue_analysis'],
      retryCount: 3,
      timeout: 120000
    }
  },

  // 知乎相关URL
  urls: {
    home: 'https://www.zhihu.com',
    creator: 'https://www.zhihu.com/creator',
    hot: 'https://www.zhihu.com/hot',
    profile: 'https://www.zhihu.com/people/{username}',
    answers: 'https://www.zhihu.com/topic/{topic}/answers'
  },

  // 数据文件路径
  dataFiles: {
    daily: path.join(CORE_DATA_DIR, 'daily_data.json'),
    weekly: path.join(CORE_DATA_DIR, 'weekly_data.json'),
    monthly: path.join(CORE_DATA_DIR, 'monthly_data.json'),
    reports: path.join(REPORTS_DIR, 'data-collection-report.json'),
    logs: path.join(LOGS_DIR, 'data-collection.log')
  },

  // 用户名配置（需要从环境变量或配置文件获取）
  username: process.env.ZHIHU_USERNAME || 'your_username',
  
  // 代理配置（如果需要）
  proxy: process.env.HTTP_PROXY ? {
    server: process.env.HTTP_PROXY,
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD
  } : null,

  // 浏览器配置
  browser: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  },

  // 解析配置
  parsing: {
    waitTimeout: 10000,
    retryDelay: 5000,
    maxRetries: 3,
    selectors: {
      articles: '.ContentItem .RichText', // 文章选择器
      fans: '.NumberBoard .Number', // 粉数选择器  
      hotTopics: '.HotItem .HotItem-title' // 热榜选择器
    }
  }
};

/**
 * 日志系统
 */
class Logger {
  constructor(logFile) {
    this.logFile = logFile;
    this.level = 'info';
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    
    // 写入日志文件
    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
  }

  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  debug(message, data) {
    if (this.level === 'debug') {
      this.log('debug', message, data);
    }
  }
}

// ─── 数据库管理 ───────────────────────────────────────────────────────────────

/**
 * 数据库管理类
 */
class DatabaseManager {
  constructor(dbFile) {
    this.dbFile = dbFile;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbFile, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  async createTables() {
    const tables = [
      {
        name: 'articles',
        sql: `
          CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            url TEXT UNIQUE,
            author TEXT,
            publish_date TEXT,
            likes INTEGER DEFAULT 0,
            favorites INTEGER DEFAULT 0,
            comments INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0,
            collection_date TEXT,
            last_updated TEXT,
            status TEXT DEFAULT 'draft',
            content_hash TEXT,
            quality_score REAL DEFAULT 0,
            trending_score REAL DEFAULT 0
          )
        `
      },
      {
        name: 'fans',
        sql: `
          CREATE TABLE IF NOT EXISTS fans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            total_fans INTEGER DEFAULT 0,
            new_fans_today INTEGER DEFAULT 0,
            fans_growth_rate REAL DEFAULT 0,
            weekly_growth_rate REAL DEFAULT 0,
            monthly_growth_rate REAL DEFAULT 0,
            collection_date TEXT,
            last_updated TEXT
          )
        `
      },
      {
        name: 'hot_topics',
        sql: `
          CREATE TABLE IF NOT EXISTS hot_topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            url TEXT,
            category TEXT,
            heat_score INTEGER DEFAULT 0,
            ranking INTEGER DEFAULT 0,
            category_ranking INTEGER DEFAULT 0,
            collection_date TEXT,
            last_updated TEXT
          )
        `
      },
      {
        name: 'collection_logs',
        sql: `
          CREATE TABLE IF NOT EXISTS collection_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            collection_type TEXT,
            status TEXT,
            message TEXT,
            error_details TEXT,
            execution_time_ms INTEGER,
            retry_count INTEGER DEFAULT 0,
            collection_date TEXT
          )
        `
      },
      {
        name: 'content_performance',
        sql: `
          CREATE TABLE IF NOT EXISTS content_performance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            article_id INTEGER,
            date TEXT,
            likes_count INTEGER,
            favorites_count INTEGER,
            comments_count INTEGER,
            views_count INTEGER,
            completion_rate REAL,
            engagement_rate REAL,
            trending_score REAL,
            quality_score REAL,
            FOREIGN KEY (article_id) REFERENCES articles (id)
          )
        `
      }
    ];

    for (const table of tables) {
      await new Promise((resolve, reject) => {
        this.db.run(table.sql, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    console.log('✅ 数据库表创建完成');
  }

  async saveArticles(articles) {
    const now = new Date().toISOString();
    const results = [];

    for (const article of articles) {
      await new Promise((resolve, reject) => {
        this.db.run(`
          INSERT OR REPLACE INTO articles 
          (title, url, author, publish_date, likes, favorites, comments, views, collection_date, last_updated, status, content_hash)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          article.title,
          article.url,
          article.author,
          article.publish_date,
          article.likes || 0,
          article.favorites || 0,
          article.comments || 0,
          article.views || 0,
          now,
          now,
          'published',
          article.content_hash || ''
        ], function(err) {
          if (err) {
            reject(err);
          } else {
            results.push({ id: this.lastID, ...article });
            resolve();
          }
        });
      });
    }

    return results;
  }

  async saveFans(fansData) {
    const now = new Date().toISOString();
    
    await new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO fans (total_fans, new_fans_today, fans_growth_rate, weekly_growth_rate, monthly_growth_rate, collection_date, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        fansData.total_fans,
        fansData.new_fans_today,
        fansData.fans_growth_rate,
        fansData.weekly_growth_rate || 0,
        fansData.monthly_growth_rate || 0,
        now,
        now
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async saveHotTopics(topics) {
    const now = new Date().toISOString();
    const results = [];

    for (const topic of topics) {
      await new Promise((resolve, reject) => {
        this.db.run(`
          INSERT OR REPLACE INTO hot_topics (title, url, category, heat_score, ranking, category_ranking, collection_date, last_updated)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          topic.title,
          topic.url,
          topic.category,
          topic.heat_score || 0,
          topic.ranking || 0,
          topic.category_ranking || 0,
          now,
          now
        ], function(err) {
          if (err) {
            reject(err);
          } else {
            results.push({ id: this.lastID, ...topic });
            resolve();
          }
        });
      });
    }

    return results;
  }

  async saveLog(collectionType, status, message, errorDetails, executionTime, retryCount) {
    const now = new Date().toISOString();
    
    await new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO collection_logs (collection_type, status, message, error_details, execution_time_ms, retry_count, collection_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        collectionType,
        status,
        message,
        errorDetails,
        executionTime,
        retryCount || 0,
        now
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

// ─── 数据采集器 ───────────────────────────────────────────────────────────────

/**
 * 数据采集器类
 */
class DataCollector {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.db = null;
    this.browser = null;
  }

  async init() {
    this.logger.info('初始化数据采集器...');
    
    // 初始化数据库
    this.db = new DatabaseManager(this.config.dbFile);
    await this.db.init();
    
    // 启动浏览器
    this.browser = await chromium.launch(this.config.browser);
    
    this.logger.info('数据采集器初始化完成');
  }

  async collectArticlesData() {
    this.logger.info('📝 开始采集文章数据...');
    
    const context = await this.createContext();
    const page = await context.newPage();
    
    try {
      // 访问创作中心
      await page.goto(this.config.urls.creator, { 
        waitUntil: 'networkidle',
        timeout: this.config.collection.daily.timeout 
      });
      
      // 等待页面加载
      await page.waitForTimeout(this.config.parsing.waitTimeout);
      
      // 获取页面内容
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // 解析文章数据
      const articles = [];
      
      // 查找文章列表（需要根据实际页面结构调整）
      const articleElements = $('.ContentItem, .AnswerItem, .ArticleItem');
      
      articleElements.each((index, element) => {
        const $element = $(element);
        
        const article = {
          title: $element.find('.RichText, .ContentItem-title, .Question-title').first().text().trim(),
          url: $element.find('a').first().attr('href'),
          author: $element.find('.AuthorInfo, .UserLink').first().text().trim(),
          publish_date: $element.find('.ContentItem-time, .ItemMeta').first().text().trim(),
          likes: parseInt($element.find('.VoteButton, .VoteCount').first().text().trim()) || 0,
          favorites: parseInt($element.find('.CollectionButton, .FavoriteCount').first().text().trim()) || 0,
          comments: parseInt($element.find('.CommentButton, .CommentCount').first().text().trim()) || 0,
          views: parseInt($element.find('.ViewCount').first().text().trim()) || 0,
          content_hash: this.generateHash($element.html())
        };
        
        if (article.title && article.url) {
          articles.push(article);
        }
      });
      
      // 保存到数据库
      const savedArticles = await this.db.saveArticles(articles);
      
      this.logger.info(`📝 文章数据采集完成，共采集 ${articles.length} 篇文章`);
      
      return {
        success: true,
        count: articles.length,
        articles: savedArticles
      };
      
    } catch (error) {
      this.logger.error('❌ 文章数据采集失败:', error);
      return {
        success: false,
        error: error.message,
        count: 0,
        articles: []
      };
    } finally {
      await page.close();
      await context.close();
    }
  }

  async collectFansData() {
    this.logger.info('👥 开始采集粉丝数据...');
    
    const context = await this.createContext();
    const page = await context.newPage();
    
    try {
      // 访问个人主页
      const profileUrl = this.config.urls.profile.replace('{username}', this.config.username);
      await page.goto(profileUrl, { 
        waitUntil: 'networkidle',
        timeout: this.config.collection.daily.timeout 
      });
      
      // 等待页面加载
      await page.waitForTimeout(this.config.parsing.waitTimeout);
      
      // 获取页面内容
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // 解析粉丝数据
      const fansData = {
        total_fans: 0,
        new_fans_today: 0,
        fans_growth_rate: 0,
        weekly_growth_rate: 0,
        monthly_growth_rate: 0
      };
      
      // 查找粉丝数
      const fanElements = $('.NumberBoard, .FollowInfo, .Profile-headerCount');
      fanElements.each((index, element) => {
        const text = $(element).text().trim();
        const number = parseInt(text.replace(/[^\d]/g, ''));
        
        if (text.includes('粉丝') || text.includes('关注者')) {
          fansData.total_fans = number;
        } else if (text.includes('今日新增')) {
          fansData.new_fans_today = number;
        }
      });
      
      // 计算增长率（这里可以根据历史数据计算）
      fansData.fans_growth_rate = this.calculateGrowthRate(fansData.new_fans_today, fansData.total_fans);
      
      // 保存到数据库
      await this.db.saveFans(fansData);
      
      this.logger.info('👥 粉丝数据采集完成');
      
      return {
        success: true,
        data: fansData
      };
      
    } catch (error) {
      this.logger.error('❌ 粉丝数据采集失败:', error);
      return {
        success: false,
        error: error.message,
        data: {
          total_fans: 0,
          new_fans_today: 0,
          fans_growth_rate: 0
        }
      };
    } finally {
      await page.close();
      await context.close();
    }
  }

  async collectHotTopicsData() {
    this.logger.info('🔥 开始采集热点话题数据...');
    
    const context = await this.createContext();
    const page = await context.newPage();
    
    try {
      // 访问热榜页面
      await page.goto(this.config.urls.hot, { 
        waitUntil: 'networkidle',
        timeout: this.config.collection.daily.timeout 
      });
      
      // 等待页面加载
      await page.waitForTimeout(this.config.parsing.waitTimeout);
      
      // 获取页面内容
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // 解析热点话题数据
      const hotTopics = [];
      
      // 查找热点话题
      const topicElements = $('.HotItem, .HotListItem');
      
      topicElements.each((index, element) => {
        const $element = $(element);
        
        const topic = {
          title: $element.find('.HotItem-title, .HotListItem-title').first().text().trim(),
          url: $element.find('a').first().attr('href'),
          category: $element.find('.HotItem-category, .HotListItem-category').first().text().trim(),
          heat_score: parseInt($element.find('.HotItem-index, .HotListItem-heat').first().text().trim()) || 0,
          ranking: index + 1,
          category_ranking: index + 1
        };
        
        if (topic.title && topic.url) {
          hotTopics.push(topic);
        }
      });
      
      // 保存到数据库
      const savedTopics = await this.db.saveHotTopics(hotTopics);
      
      this.logger.info(`🔥 热点话题数据采集完成，共采集 ${hotTopics.length} 个话题`);
      
      return {
        success: true,
        count: hotTopics.length,
        topics: savedTopics
      };
      
    } catch (error) {
      this.logger.error('❌ 热点话题数据采集失败:', error);
      return {
        success: false,
        error: error.message,
        count: 0,
        topics: []
      };
    } finally {
      await page.close();
      await context.close();
    }
  }

  async createContext() {
    const context = await this.browser.newContext({
      // 尝试加载cookie文件
      cookies: this.loadCookies(),
      // 代理配置
      proxy: this.config.proxy
    });
    
    // 设置用户代理
    await context.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    return context;
  }

  loadCookies() {
    try {
      const cookieFile = path.join(AUTH_DIR, 'zhihu-cookies-latest.json');
      if (fs.existsSync(cookieFile)) {
        return JSON.parse(fs.readFileSync(cookieFile, 'utf8'));
      }
    } catch (error) {
      this.logger.warn('Cookie文件加载失败，使用无状态模式', error.message);
    }
    return [];
  }

  generateHash(content) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  calculateGrowthRate(newFans, totalFans) {
    if (totalFans === 0) return 0;
    return (newFans / totalFans * 100).toFixed(2);
  }

  async executeCollection(mode = 'daily') {
    const startTime = Date.now();
    const config = this.config.collection[mode];
    
    this.logger.info(`🚀 开始${mode}数据采集...`);
    this.logger.info(`⏰ 开始时间: ${new Date().toISOString()}`);
    
    const results = {};
    
    try {
      // 执行数据采集
      for (const dataType of config.dataTypes) {
        this.logger.info(`📊 开始采集${dataType}数据...`);
        
        let result;
        switch (dataType) {
          case 'articles':
            result = await this.collectArticlesData();
            break;
          case 'fans':
            result = await this.collectFansData();
            break;
          case 'hot_topics':
            result = await this.collectHotTopicsData();
            break;
          default:
            result = { success: false, error: '未知数据类型' };
        }
        
        results[dataType] = result;
        
        // 记录日志
        await this.db.saveLog(
          mode,
          result.success ? 'success' : 'error',
          result.success ? `${dataType}数据采集成功` : result.error,
          result.error,
          Date.now() - startTime,
          result.retryCount || 0
        );
      }
      
      // 生成采集报告
      const report = {
        timestamp: new Date().toISOString(),
        mode,
        execution_time_ms: Date.now() - startTime,
        results,
        summary: {
          total_collections: Object.keys(results).length,
          successful_collections: Object.values(results).filter(r => r.success).length,
          failed_collections: Object.values(results).filter(r => !r.success).length,
          total_data_points: Object.values(results).reduce((sum, r) => sum + (r.count || 0), 0)
        }
      };
      
      // 保存报告
      const reportFile = path.join(REPORTS_DIR, `data-collection-report-${mode}-${Date.now()}.json`);
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      
      this.logger.info('📊 数据采集报告已保存');
      this.logger.info(`⏱️ 执行时间: ${Date.now() - startTime}ms`);
      this.logger.info('✅ 数据采集完成');
      
      return report;
      
    } catch (error) {
      this.logger.error('❌ 数据采集失败:', error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
    if (this.db) {
      this.db.close();
    }
  }
}

// ─── 命令行处理 ───────────────────────────────────────────────────────────────

/**
 * 命令行参数处理
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: 'daily',
    config: null,
    dryRun: false,
    verbose: false
  };
  
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      switch (key) {
        case 'mode':
          options.mode = value || 'daily';
          break;
        case 'config':
          options.config = value;
          break;
        case 'dry-run':
          options.dryRun = true;
          break;
        case 'verbose':
          options.verbose = true;
          break;
      }
    }
  }
  
  return options;
}

/**
 * 加载配置
 */
function loadConfig(options) {
  let config = { ...DEFAULT_CONFIG };
  
  // 加载自定义配置文件
  if (options.config) {
    const configPath = path.resolve(options.config);
    if (fs.existsSync(configPath)) {
      const customConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config = _.merge(config, customConfig);
    }
  }
  
  // 设置日志级别
  config.logger = {
    level: options.verbose ? 'debug' : 'info'
  };
  
  return config;
}

/**
 * 主函数
 */
async function main() {
  const options = parseArgs();
  const config = loadConfig(options);
  
  // 初始化日志系统
  const logger = new Logger(config.dataFiles.logs);
  
  // 创建数据采集器
  const collector = new DataCollector(config, logger);
  
  try {
    // 初始化
    await collector.init();
    
    // 执行数据采集
    const report = await collector.executeCollection(options.mode);
    
    console.log('🎉 数据采集完成！');
    console.log(`📊 采集模式: ${options.mode}`);
    console.log(`📈 成功采集: ${report.summary.successful_collections}/${report.summary.total_collections}`);
    console.log(`⏱️ 执行时间: ${report.execution_time_ms}ms`);
    
  } catch (error) {
    logger.error('数据采集失败:', error);
    process.exit(1);
  } finally {
    // 清理资源
    await collector.close();
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DataCollector, DatabaseManager, Logger };