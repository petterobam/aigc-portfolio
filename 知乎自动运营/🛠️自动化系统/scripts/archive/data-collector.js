#!/usr/bin/env node

/**
 * data-collector.js
 *
 * 知乎数据自动化采集脚本
 *
 * 功能：
 *   1. 自动采集文章表现数据（赞同、收藏、评论）
 *   2. 监控粉丝增长趋势
 *   3. 追踪热点话题和趋势
 *   4. 生成数据报告和分析
 *
 * 使用方法：
 *   node scripts/data-collector.js [--daily] [--weekly] [--monthly]
 *
 * 选项：
 *   --daily: 每日数据采集
 *   --weekly: 每周数据汇总
 *   --monthly: 每月数据复盘
 *
 * 依赖：
 *   - sqlite3 (数据库)
 *   - playwright (网页数据采集)
 *   - cheerio (HTML解析)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const sqlite3 = require('sqlite3').verbose();

// ─── 配置 ────────────────────────────────────────────────────────────────────

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const ZHIHU_AUTO_DIR = path.join(WORKSPACE_DIR, '知乎自动运营');
const DATA_DIR = path.join(ZHIHU_AUTO_DIR, '📊数据看板');
const CORE_DATA_DIR = path.join(DATA_DIR, '📈核心数据');
const REPORTS_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统', 'reports');
const AUTH_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统', 'auth');

const CONFIG = {
  // 数据库文件路径
  dbFile: path.join(CORE_DATA_DIR, 'zhihu_data.db'),
  
  // 数据采集配置
  collection: {
    daily: {
      time: '09:00',
      intervals: 24, // 每天采集24次，每小时一次
      dataTypes: ['articles', 'fans', 'hot_topics']
    },
    weekly: {
      time: '10:00',
      day: 'monday',
      dataTypes: ['weekly_summary', 'content_analysis', 'trend_analysis']
    },
    monthly: {
      time: '00:00',  
      day: 1,
      dataTypes: ['monthly_summary', 'performance_review', 'revenue_analysis']
    }
  },

  // 知乎相关URL
  urls: {
    home: 'https://www.zhihu.com',
    creator: 'https://www.zhihu.com/creator',
    hot: 'https://www.zhihu.com/hot',
    profile: 'https://www.zhihu.com/people/{username}'
  },

  // 数据文件路径
  dataFiles: {
    daily: path.join(CORE_DATA_DIR, 'daily_data.json'),
    weekly: path.join(CORE_DATA_DIR, 'weekly_data.json'),
    monthly: path.join(CORE_DATA_DIR, 'monthly_data.json'),
    reports: path.join(REPORTS_DIR, 'data-collection-report.json')
  }
};

// ─── 数据库初始化 ────────────────────────────────────────────────────────────

/**
 * 初始化数据库
 */
function initDatabase() {
  const db = new sqlite3.Database(CONFIG.dbFile);
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 创建文章数据表
      db.run(`
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
          status TEXT DEFAULT 'draft'
        )
      `);

      // 创建粉丝数据表
      db.run(`
        CREATE TABLE IF NOT EXISTS fans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          total_fans INTEGER DEFAULT 0,
          new_fans_today INTEGER DEFAULT 0,
          fans_growth_rate REAL DEFAULT 0,
          collection_date TEXT,
          last_updated TEXT
        )
      `);

      // 创建热点话题表
      db.run(`
        CREATE TABLE IF NOT EXISTS hot_topics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          url TEXT,
          category TEXT,
          heat_score INTEGER DEFAULT 0,
          collection_date TEXT,
          last_updated TEXT
        )
      `);

      // 创建数据采集日志表
      db.run(`
        CREATE TABLE IF NOT EXISTS collection_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          collection_type TEXT,
          status TEXT,
          message TEXT,
          collection_date TEXT,
          execution_time_ms INTEGER
        )
      `);

      // 创建内容表现分析表
      db.run(`
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
          FOREIGN KEY (article_id) REFERENCES articles (id)
        )
      `);

      console.log('✅ 数据库初始化完成');
      resolve(db);
    });
  });
}

// ─── 数据采集函数 ─────────────────────────────────────────────────────────────

/**
 * 采集文章数据
 */
async function collectArticlesData(db, browser) {
  console.log('📝 开始采集文章数据...');
  
  const context = await browser.newContext({
    cookies: JSON.parse(fs.readFileSync(path.join(AUTH_DIR, 'zhihu-cookies-latest.json'), 'utf8'))
  });
  
  const page = await context.newPage();
  const articles = [];

  try {
    // 访问创作中心
    await page.goto(CONFIG.urls.creator);
    await page.waitForLoadState('networkidle');
    
    // 等待页面加载完成
    await page.waitForTimeout(3000);
    
    // 获取文章列表数据（这里需要根据实际页面结构调整）
    const pageContent = await page.content();
    
    // TODO: 实现具体的文章数据解析逻辑
    // 这里需要根据知乎创作中心的实际页面结构来解析
    
    console.log('📝 文章数据采集完成');
    
    return {
      success: true,
      count: articles.length,
      articles: articles
    };
    
  } catch (error) {
    console.error('❌ 文章数据采集失败:', error.message);
    return {
      success: false,
      error: error.message,
      count: 0,
      articles: []
    };
  } finally {
    await page.close();
  }
}

/**
 * 采集粉丝数据
 */
async function collectFansData(db, browser) {
  console.log('👥 开始采集粉丝数据...');
  
  const context = await browser.newContext({
    cookies: JSON.parse(fs.readFileSync(path.join(AUTH_DIR, 'zhihu-cookies-latest.json'), 'utf8'))
  });
  
  const page = await context.newPage();
  let fansData = {
    total_fans: 0,
    new_fans_today: 0,
    fans_growth_rate: 0
  };

  try {
    // 访问个人主页
    const profileUrl = CONFIG.urls.profile.replace('{username}', 'your_username'); // TODO: 获取实际用户名
    await page.goto(profileUrl);
    await page.waitForLoadState('networkidle');
    
    // 等待页面加载完成
    await page.waitForTimeout(3000);
    
    // TODO: 实现具体的粉丝数据解析逻辑
    // 这里需要根据个人主页的实际页面结构来解析
    
    console.log('👥 粉丝数据采集完成');
    
    return {
      success: true,
      data: fansData
    };
    
  } catch (error) {
    console.error('❌ 粉丝数据采集失败:', error.message);
    return {
      success: false,
      error: error.message,
      data: fansData
    };
  } finally {
    await page.close();
  }
}

/**
 * 采集热点话题数据
 */
async function collectHotTopicsData(db, browser) {
  console.log('🔥 开始采集热点话题数据...');
  
  const context = await browser.newContext({
    cookies: JSON.parse(fs.readFileSync(path.join(AUTH_DIR, 'zhihu-cookies-latest.json'), 'utf8'))
  });
  
  const page = await context.newPage();
  const hotTopics = [];

  try {
    // 访问热榜页面
    await page.goto(CONFIG.urls.hot);
    await page.waitForLoadState('networkidle');
    
    // 等待页面加载完成
    await page.waitForTimeout(3000);
    
    // TODO: 实现具体的热点话题解析逻辑
    // 这里需要根据热榜页面的实际页面结构来解析
    
    console.log('🔥 热点话题数据采集完成');
    
    return {
      success: true,
      count: hotTopics.length,
      topics: hotTopics
    };
    
  } catch (error) {
    console.error('❌ 热点话题数据采集失败:', error.message);
    return {
      success: false,
      error: error.message,
      count: 0,
      topics: []
    };
  } finally {
    await page.close();
  }
}

// ─── 数据存储函数 ─────────────────────────────────────────────────────────────

/**
 * 保存数据到数据库
 */
async function saveDataToDb(db, dataType, data) {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    
    switch (dataType) {
      case 'articles':
        // 保存文章数据
        data.articles.forEach(article => {
          db.run(`
            INSERT OR REPLACE INTO articles 
            (title, url, author, publish_date, likes, favorites, comments, views, collection_date, last_updated, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            'published'
          ], (err) => {
            if (err) console.error('保存文章数据失败:', err);
          });
        });
        break;
        
      case 'fans':
        // 保存粉丝数据
        db.run(`
          INSERT INTO fans (total_fans, new_fans_today, fans_growth_rate, collection_date, last_updated)
          VALUES (?, ?, ?, ?, ?)
        `, [
          data.data.total_fans,
          data.data.new_fans_today,
          data.data.fans_growth_rate,
          now,
          now
        ], (err) => {
          if (err) console.error('保存粉丝数据失败:', err);
        });
        break;
        
      case 'hot_topics':
        // 保存热点话题数据
        data.topics.forEach(topic => {
          db.run(`
            INSERT OR REPLACE INTO hot_topics (title, url, category, heat_score, collection_date, last_updated)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            topic.title,
            topic.url,
            topic.category,
            topic.heat_score || 0,
            now,
            now
          ], (err) => {
            if (err) console.error('保存热点话题数据失败:', err);
          });
        });
        break;
    }
    
    console.log(`✅ ${dataType} 数据保存完成`);
    resolve();
  });
}

// ─── 主要执行函数 ──────────────────────────────────────────────────────────────

/**
 * 主要执行函数
 */
async function main() {
  const startTime = Date.now();
  
  console.log('🚀 知乎数据采集脚本启动...');
  console.log(`⏰ 开始时间: ${new Date().toISOString()}`);
  
  try {
    // 初始化数据库
    const db = await initDatabase();
    
    // 启动浏览器
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // 执行数据采集
    const results = {};
    
    // 采集文章数据
    const articlesResult = await collectArticlesData(db, browser);
    results.articles = articlesResult;
    
    // 采集粉丝数据
    const fansResult = await collectFansData(db, browser);
    results.fans = fansResult;
    
    // 采集热点话题数据
    const hotTopicsResult = await collectHotTopicsData(db, browser);
    results.hot_topics = hotTopicsResult;
    
    // 保存数据到数据库
    if (articlesResult.success) {
      await saveDataToDb(db, 'articles', articlesResult);
    }
    
    if (fansResult.success) {
      await saveDataToDb(db, 'fans', fansResult);
    }
    
    if (hotTopicsResult.success) {
      await saveDataToDb(db, 'hot_topics', hotTopicsResult);
    }
    
    // 生成采集报告
    const report = {
      timestamp: new Date().toISOString(),
      execution_time_ms: Date.now() - startTime,
      results: results,
      summary: {
        total_collections: Object.keys(results).length,
        successful_collections: Object.values(results).filter(r => r.success).length,
        failed_collections: Object.values(results).filter(r => !r.success).length,
        total_data_points: Object.values(results).reduce((sum, r) => sum + (r.count || 0), 0)
      }
    };
    
    // 保存报告
    fs.writeFileSync(CONFIG.dataFiles.reports, JSON.stringify(report, null, 2));
    
    console.log('📊 数据采集报告已保存');
    console.log(`⏱️ 执行时间: ${Date.now() - startTime}ms`);
    console.log('✅ 数据采集完成');
    
  } catch (error) {
    console.error('❌ 数据采集失败:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    if (db) {
      db.close();
    }
  }
}

// ─── 命令行参数处理 ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const collectionType = args.find(arg => arg.startsWith('--'))?.substring(2) || 'daily';

console.log(`📋 执行类型: ${collectionType}`);

// 执行主函数
main().catch(console.error);