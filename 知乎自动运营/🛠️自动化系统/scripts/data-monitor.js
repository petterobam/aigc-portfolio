#!/usr/bin/env node

/**
 * data-monitor.js
 *
 * 知乎数据采集监控系统
 *
 * 功能：
 *   1. 实时监控数据采集状态
 *   2. 性能指标追踪
 *   3. 异常检测和预警
 *   4. 系统健康检查
 *   5. 自动化报告生成
 *
 * 使用方法：
 *   node scripts/data-monitor.js [--check-performance] [--check-health] [--generate-report]
 *
 * 选项：
 *   --check-performance: 检查性能指标
 *   --check-health: 检查系统健康状态
 *   --generate-report: 生成监控报告
 *   --alert: 发送预警通知
 */

'use strict';

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { performance } = require('perf_hooks');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const ZHIHU_AUTO_DIR = path.join(WORKSPACE_DIR, '知乎自动运营');
const DATA_DIR = path.join(ZHIHU_AUTO_DIR, '📊数据看板');
const CORE_DATA_DIR = path.join(DATA_DIR, '📈核心数据');
const REPORTS_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统', 'reports');
const LOGS_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统', 'logs');
const MONITORING_DIR = path.join(ZHIHU_AUTO_DIR, '🛠️自动化系统', 'monitoring');

// 确保目录存在
[MONITORING_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const CONFIG = {
  // 数据库文件路径
  dbFile: path.join(CORE_DATA_DIR, 'zhihu_data_optimized.db'),
  
  // 监控配置
  monitoring: {
    // 性能阈值
    performance: {
      maxExecutionTime: 60000, // 最大执行时间（毫秒）
      minSuccessRate: 0.8, // 最低成功率
      maxErrorRate: 0.2 // 最高错误率
    },
    
    // 健康检查
    health: {
      maxDatabaseConnections: 10,
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB
      maxCpuUsage: 80, // 80%
      diskSpaceThreshold: 0.1 // 10% 磁盘空间剩余
    },
    
    // 预警配置
    alerts: {
      enabled: true,
      channels: ['console', 'file'],
      thresholds: {
        critical: ['error_rate_high', 'performance_degradation', 'system_overload'],
        warning: ['retry_count_high', 'memory_usage_high', 'disk_space_low']
      }
    }
  },

  // 报告配置
  reports: {
    outputDir: MONITORING_DIR,
    filename: 'monitoring-report.json',
    format: 'json',
    includeCharts: false,
    timeRange: '24h' // 24小时数据
  },

  // 通知配置
  notifications: {
    enabled: false,
    webhook: null,
    email: null,
    slack: null
  }
};

// ─── 监控系统类 ──────────────────────────────────────────────────────────────

/**
 * 监控系统类
 */
class MonitoringSystem {
  constructor(config) {
    this.config = config;
    this.db = null;
    this.logger = new Logger(path.join(LOGS_DIR, 'monitoring.log'));
  }

  async init() {
    this.logger.info('初始化监控系统...');
    
    // 连接数据库
    this.db = new sqlite3.Database(this.config.dbFile);
    
    // 创建监控表
    await this.createMonitoringTables();
    
    this.logger.info('监控系统初始化完成');
  }

  async createMonitoringTables() {
    const tables = [
      {
        name: 'performance_metrics',
        sql: `
          CREATE TABLE IF NOT EXISTS performance_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric_name TEXT NOT NULL,
            value REAL NOT NULL,
            unit TEXT,
            timestamp TEXT,
            collection_type TEXT,
            execution_time_ms INTEGER,
            memory_usage_mb INTEGER,
            cpu_usage_percent REAL
          )
        `
      },
      {
        name: 'health_checks',
        sql: `
          CREATE TABLE IF NOT EXISTS health_checks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            check_type TEXT NOT NULL,
            status TEXT NOT NULL,
            details TEXT,
            timestamp TEXT,
            next_check_time TEXT
          )
        `
      },
      {
        name: 'alerts',
        sql: `
          CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            message TEXT,
            details TEXT,
            timestamp TEXT,
            resolved BOOLEAN DEFAULT FALSE,
            resolved_time TEXT
          )
        `
      }
    ];

    for (const table of tables) {
      await new Promise((resolve, reject) => {
        this.db.run(table.sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  /**
   * 检查性能指标
   */
  async checkPerformance() {
    this.logger.info('🔍 开始性能检查...');
    
    const startTime = performance.now();
    
    try {
      // 获取最近的性能数据
      const performanceData = await this.getRecentPerformanceData();
      
      // 分析性能指标
      const metrics = this.analyzePerformanceMetrics(performanceData);
      
      // 检查性能阈值
      const alerts = this.checkPerformanceThresholds(metrics);
      
      // 记录性能指标
      await this.recordPerformanceMetrics(metrics);
      
      this.logger.info('📊 性能检查完成');
      return {
        success: true,
        metrics,
        alerts,
        executionTime: performance.now() - startTime
      };
      
    } catch (error) {
      this.logger.error('❌ 性能检查失败:', error);
      return {
        success: false,
        error: error.message,
        executionTime: performance.now() - startTime
      };
    }
  }

  /**
   * 获取最近的性能数据
   */
  async getRecentPerformanceData() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM collection_logs 
        WHERE collection_date >= datetime('now', '-24 hours')
        ORDER BY collection_date DESC
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 分析性能指标
   */
  analyzePerformanceMetrics(data) {
    if (data.length === 0) {
      return {
        totalCollections: 0,
        successRate: 0,
        errorRate: 0,
        avgExecutionTime: 0,
        maxExecutionTime: 0,
        minExecutionTime: 0,
        totalDataPoints: 0,
        retryRate: 0
      };
    }

    const successful = data.filter(log => log.status === 'success').length;
    const total = data.length;
    const totalExecutionTime = data.reduce((sum, log) => sum + (log.execution_time_ms || 0), 0);
    const totalRetryCount = data.reduce((sum, log) => sum + (log.retry_count || 0), 0);
    
    // 计算各项指标
    const metrics = {
      totalCollections: total,
      successRate: successful / total,
      errorRate: (total - successful) / total,
      avgExecutionTime: totalExecutionTime / total,
      maxExecutionTime: Math.max(...data.map(log => log.execution_time_ms || 0)),
      minExecutionTime: Math.min(...data.map(log => log.execution_time_ms || 0)),
      totalDataPoints: data.reduce((sum, log) => sum + (log.data_points || 0), 0),
      retryRate: totalRetryCount / total,
      timestamp: new Date().toISOString()
    };

    return metrics;
  }

  /**
   * 检查性能阈值
   */
  checkPerformanceThresholds(metrics) {
    const alerts = [];
    const thresholds = this.config.monitoring.performance;
    
    // 检查执行时间
    if (metrics.avgExecutionTime > thresholds.maxExecutionTime) {
      alerts.push({
        type: 'performance_degradation',
        severity: 'warning',
        message: '平均执行时间超过阈值',
        details: `平均执行时间: ${metrics.avgExecutionTime}ms, 阈值: ${thresholds.maxExecutionTime}ms`
      });
    }
    
    // 检查成功率
    if (metrics.successRate < thresholds.minSuccessRate) {
      alerts.push({
        type: 'error_rate_high',
        severity: 'critical',
        message: '成功率低于阈值',
        details: `成功率: ${(metrics.successRate * 100).toFixed(2)}%, 阈值: ${(thresholds.minSuccessRate * 100)}%`
      });
    }
    
    // 检查错误率
    if (metrics.errorRate > thresholds.maxErrorRate) {
      alerts.push({
        type: 'error_rate_high',
        severity: 'critical',
        message: '错误率高于阈值',
        details: `错误率: ${(metrics.errorRate * 100).toFixed(2)}%, 阈值: ${(thresholds.maxErrorRate * 100)}%`
      });
    }
    
    // 检查重试率
    if (metrics.retryRate > 0.3) {
      alerts.push({
        type: 'retry_count_high',
        severity: 'warning',
        message: '重试率过高',
        details: `重试率: ${(metrics.retryRate * 100).toFixed(2)}%`
      });
    }
    
    return alerts;
  }

  /**
   * 记录性能指标
   */
  async recordPerformanceMetrics(metrics) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO performance_metrics 
        (metric_name, value, unit, timestamp, execution_time_ms, memory_usage_mb, cpu_usage_percent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      // 记录关键指标
      const metricsToRecord = [
        ['total_collections', metrics.totalCollections, 'count', metrics.timestamp, null, null, null],
        ['success_rate', metrics.successRate, 'percentage', metrics.timestamp, null, null, null],
        ['error_rate', metrics.errorRate, 'percentage', metrics.timestamp, null, null, null],
        ['avg_execution_time', metrics.avgExecutionTime, 'ms', metrics.timestamp, null, null, null],
        ['max_execution_time', metrics.maxExecutionTime, 'ms', metrics.timestamp, null, null, null],
        ['min_execution_time', metrics.minExecutionTime, 'ms', metrics.timestamp, null, null, null],
        ['retry_rate', metrics.retryRate, 'percentage', metrics.timestamp, null, null, null]
      ];
      
      let completed = 0;
      metricsToRecord.forEach(([name, value, unit, timestamp, execTime, memUsage, cpuUsage]) => {
        stmt.run([name, value, unit, timestamp, execTime, memUsage, cpuUsage], (err) => {
          if (err) {
            reject(err);
            return;
          }
          completed++;
          if (completed === metricsToRecord.length) {
            stmt.finalize();
            resolve();
          }
        });
      });
    });
  }

  /**
   * 检查系统健康状态
   */
  async checkHealth() {
    this.logger.info('🏥 开始健康检查...');
    
    const healthChecks = [];
    
    try {
      // 检查数据库连接
      const dbHealth = await this.checkDatabaseHealth();
      healthChecks.push(dbHealth);
      
      // 检查内存使用
      const memoryHealth = await this.checkMemoryHealth();
      healthChecks.push(memoryHealth);
      
      // 检查磁盘空间
      const diskHealth = await this.checkDiskHealth();
      healthChecks.push(diskHealth);
      
      // 检查进程状态
      const processHealth = await this.checkProcessHealth();
      healthChecks.push(processHealth);
      
      // 检查文件系统
      const fileSystemHealth = await this.checkFileSystemHealth();
      healthChecks.push(fileSystemHealth);
      
      // 记录健康检查结果
      await this.recordHealthChecks(healthChecks);
      
      this.logger.info('🏥 健康检查完成');
      return {
        success: true,
        checks: healthChecks,
        overall: this.calculateOverallHealth(healthChecks)
      };
      
    } catch (error) {
      this.logger.error('❌ 健康检查失败:', error);
      return {
        success: false,
        error: error.message,
        checks: [],
        overall: 'unknown'
      };
    }
  }

  /**
   * 检查数据库健康状态
   */
  async checkDatabaseHealth() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"', [], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        const tableCount = row.count;
        const status = tableCount >= 5 ? 'healthy' : 'warning';
        
        resolve({
          check_type: 'database',
          status,
          details: {
            table_count: tableCount,
            expected_min_tables: 5
          },
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  /**
   * 检查内存健康状态
   */
  async checkMemoryHealth() {
    const used = process.memoryUsage();
    const memoryUsageMB = Math.round(used.rss / 1024 / 1024);
    const threshold = CONFIG.monitoring.health.maxMemoryUsage;
    
    const status = memoryUsageMB > threshold * 0.8 ? 'warning' : 'healthy';
    
    return {
      check_type: 'memory',
      status,
      details: {
        memory_usage_mb: memoryUsageMB,
        threshold_mb: Math.round(threshold / 1024 / 1024),
        usage_percentage: (memoryUsageMB / (threshold / 1024 / 1024) * 100).toFixed(2)
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 检查磁盘健康状态
   */
  async checkDiskHealth() {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const stats = fs.statSync(WORKSPACE_DIR);
      const totalSpace = stats.blocks * stats.blksize;
      const freeSpace = stats.blocksAvailable * stats.blksize;
      const usedSpace = totalSpace - freeSpace;
      const freeSpacePercentage = (freeSpace / totalSpace * 100).toFixed(2);
      
      const status = freeSpacePercentage < 10 ? 'critical' : 
                    freeSpacePercentage < 20 ? 'warning' : 'healthy';
      
      return {
        check_type: 'disk',
        status,
        details: {
          total_space_gb: Math.round(totalSpace / 1024 / 1024 / 1024),
          free_space_gb: Math.round(freeSpace / 1024 / 1024 / 1024),
          used_space_gb: Math.round(usedSpace / 1024 / 1024 / 1024),
          free_space_percentage: freeSpacePercentage
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        check_type: 'disk',
        status: 'unknown',
        details: {
          error: error.message
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 检查进程健康状态
   */
  async checkProcessHealth() {
    const cpuUsage = process.cpuUsage();
    const cpuPercentage = (cpuUsage.user / cpuUsage.system * 100).toFixed(2);
    
    const status = cpuPercentage > 80 ? 'warning' : 'healthy';
    
    return {
      check_type: 'process',
      status,
      details: {
        cpu_usage_percent: cpuPercentage,
        uptime_seconds: process.uptime(),
        node_version: process.version
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 检查文件系统健康状态
   */
  async checkFileSystemHealth() {
    const fs = require('fs');
    const checks = [];
    
    // 检查关键目录是否存在
    const criticalDirs = [DATA_DIR, CORE_DATA_DIR, REPORTS_DIR, LOGS_DIR];
    criticalDirs.forEach(dir => {
      const exists = fs.existsSync(dir);
      checks.push({
        path: dir,
        exists,
        writable: exists && fs.accessSync(dir, fs.constants.W_OK)
      });
    });
    
    // 检查关键文件是否存在
    const criticalFiles = [this.config.dbFile];
    criticalFiles.forEach(file => {
      const exists = fs.existsSync(file);
      checks.push({
        path: file,
        exists,
        readable: exists && fs.accessSync(file, fs.constants.R_OK)
      });
    });
    
    const allHealthy = checks.every(check => check.exists && (check.writable || check.readable));
    const status = allHealthy ? 'healthy' : 'warning';
    
    return {
      check_type: 'filesystem',
      status,
      details: {
        checks_performed: checks.length,
        healthy_checks: checks.filter(c => c.exists && (c.writable || c.readable)).length,
        failed_checks: checks.filter(c => !c.exists || (!c.writable && !c.readable)).length
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 记录健康检查结果
   */
  async recordHealthChecks(checks) {
    const now = new Date().toISOString();
    const nextCheckTime = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1小时后
    
    for (const check of checks) {
      await new Promise((resolve, reject) => {
        this.db.run(`
          INSERT INTO health_checks (check_type, status, details, timestamp, next_check_time)
          VALUES (?, ?, ?, ?, ?)
        `, [
          check.check_type,
          check.status,
          JSON.stringify(check.details),
          now,
          nextCheckTime
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  /**
   * 计算整体健康状态
   */
  calculateOverallHealth(checks) {
    if (checks.length === 0) return 'unknown';
    
    const healthyCount = checks.filter(check => check.status === 'healthy').length;
    const warningCount = checks.filter(check => check.status === 'warning').length;
    const criticalCount = checks.filter(check => check.status === 'critical').length;
    
    if (criticalCount > 0) return 'critical';
    if (warningCount > 0) return 'warning';
    return 'healthy';
  }

  /**
   * 生成监控报告
   */
  async generateReport() {
    this.logger.info('📊 开始生成监控报告...');
    
    try {
      // 获取性能指标
      const performanceMetrics = await this.getPerformanceMetrics();
      
      // 获取健康检查结果
      const healthChecks = await this.getHealthChecks();
      
      // 获取预警信息
      const alerts = await this.getActiveAlerts();
      
      // 生成报告
      const report = {
        timestamp: new Date().toISOString(),
        report_type: 'monitoring_report',
        performance_metrics: performanceMetrics,
        health_checks: healthChecks,
        alerts: alerts,
        summary: {
          overall_health: this.calculateOverallHealth(healthChecks),
          active_alerts: alerts.length,
          performance_score: this.calculatePerformanceScore(performanceMetrics),
          next_check_time: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        }
      };
      
      // 保存报告
      const reportFile = path.join(CONFIG.reports.outputDir, CONFIG.reports.filename);
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      
      this.logger.info('📊 监控报告已生成');
      return report;
      
    } catch (error) {
      this.logger.error('❌ 监控报告生成失败:', error);
      throw error;
    }
  }

  /**
   * 获取性能指标
   */
  async getPerformanceMetrics() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM performance_metrics 
        WHERE timestamp >= datetime('now', '-24 hours')
        ORDER BY timestamp DESC
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 获取健康检查结果
   */
  async getHealthChecks() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM health_checks 
        WHERE timestamp >= datetime('now', '-24 hours')
        ORDER BY timestamp DESC
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 获取活跃预警
   */
  async getActiveAlerts() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM alerts 
        WHERE timestamp >= datetime('now', '-24 hours')
        AND resolved = FALSE
        ORDER BY timestamp DESC
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 计算性能分数
   */
  calculatePerformanceScore(metrics) {
    if (metrics.length === 0) return 0;
    
    const avgSuccessRate = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
    const avgExecutionTime = metrics.reduce((sum, m) => sum + m.execution_time_ms, 0) / metrics.length;
    
    // 计算性能分数（0-100）
    const successRateScore = avgSuccessRate * 100;
    const executionTimeScore = Math.max(0, 100 - (avgExecutionTime / 1000) * 10); // 假设1秒为满分
    
    return Math.round((successRateScore + executionTimeScore) / 2);
  }

  /**
   * 发送预警通知
   */
  async sendAlert(alerts) {
    if (!this.config.notifications.enabled) {
      return;
    }
    
    for (const alert of alerts) {
      const message = `[${alert.severity.toUpperCase()}] ${alert.message}`;
      
      // 发送到控制台
      console.log(`🚨 ${message}`);
      
      // 发送到文件
      fs.appendFileSync(path.join(LOGS_DIR, 'alerts.log'), 
        `${new Date().toISOString()} - ${message}\n`);
      
      // 可以添加更多的通知渠道（邮件、Slack、Webhook等）
    }
  }

  async close() {
    if (this.db) {
      this.db.close();
    }
  }
}

/**
 * 日志类
 */
class Logger {
  constructor(logFile) {
    this.logFile = logFile;
  }

  info(message, data = null) {
    this.log('info', message, data);
  }

  warn(message, data = null) {
    this.log('warn', message, data);
  }

  error(message, data = null) {
    this.log('error', message, data);
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
    
    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
  }
}

// ─── 命令行处理 ───────────────────────────────────────────────────────────────

/**
 * 命令行参数处理
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    checkPerformance: false,
    checkHealth: false,
    generateReport: false,
    alert: false
  };
  
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      if (key in options) {
        options[key] = true;
      }
    }
  }
  
  return options;
}

/**
 * 主函数
 */
async function main() {
  const options = parseArgs();
  const monitoring = new MonitoringSystem(CONFIG);
  
  try {
    // 初始化监控系统
    await monitoring.init();
    
    // 执行监控任务
    if (options.checkPerformance) {
      const performanceResult = await monitoring.checkPerformance();
      console.log('📊 性能检查结果:', performanceResult);
      
      if (performanceResult.alerts.length > 0) {
        await monitoring.sendAlert(performanceResult.alerts);
      }
    }
    
    if (options.checkHealth) {
      const healthResult = await monitoring.checkHealth();
      console.log('🏥 健康检查结果:', healthResult);
      
      if (healthResult.alerts.length > 0) {
        await monitoring.sendAlert(healthResult.alerts);
      }
    }
    
    if (options.generateReport) {
      const report = await monitoring.generateReport();
      console.log('📊 监控报告生成完成');
      console.log('📈 整体健康状态:', report.summary.overall_health);
      console.log('🚨 活跃预警数量:', report.summary.active_alerts);
      console.log('⭐ 性能分数:', report.summary.performance_score);
    }
    
    if (!options.checkPerformance && !options.checkHealth && !options.generateReport) {
      // 默认执行所有检查
      console.log('🚀 执行完整的监控检查...');
      
      const performanceResult = await monitoring.checkPerformance();
      const healthResult = await monitoring.checkHealth();
      const report = await monitoring.generateReport();
      
      console.log('📊 监控检查完成');
      console.log('📈 整体健康状态:', report.summary.overall_health);
      console.log('⭐ 性能分数:', report.summary.performance_score);
      console.log('🚨 活跃预警数量:', report.summary.active_alerts);
    }
    
  } catch (error) {
    console.error('❌ 监控执行失败:', error);
    process.exit(1);
  } finally {
    await monitoring.close();
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MonitoringSystem };