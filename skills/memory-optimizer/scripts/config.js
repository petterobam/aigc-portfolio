/**
 * 记忆优化器 - 共享配置文件
 *
 * 用途：统一管理所有脚本的配置参数，避免配置不一致、难以维护的问题
 *
 * 版本：
 * v1.1.0 (2026-03-25): 调整评分权重（accessFrequency: 0.25 → 0.30, recency: 0.20 → 0.15）
 *
 * 使用方法：
 * const CONFIG = require('./config.js');
 * const db = new Database(CONFIG.dbPath);
 */

const path = require('path');

// 工作目录
const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');

// 数据库配置
const DB_CONFIG = {
  dbPath: path.join(WORKSPACE_DIR, 'memory.db'),  // SQLite 数据库文件路径
  reportsDir: path.join(__dirname, '..', 'reports'),  // 优化报告存储目录
  backupsDir: path.join(__dirname, '..', 'backups'),  // 备份文件存储目录
  dataDir: path.join(WORKSPACE_DIR, 'data'),  // 数据目录（临时文件、报告等）
};

// 优化脚本配置
const OPTIMIZE_CONFIG = {
  // 归档配置
  archiveAfterDays: 14,        // 归档超过 N 天未访问的记忆（短期优化：30 → 14 天）
  minImportance: 1.2,          // 重要性低于此值的记忆可能被归档（短期优化：1.5 → 1.2）
  deleteArchived: false,       // 是否删除已归档的记忆

  // 质量过滤配置
  minContentLength: 50,        // 内容少于此字符数的记忆可能被删除
  protectedTag: 'protected',   // 带有此标签的记忆不会被优化

  // 评分配置
  scoreUpdateThreshold: 0.15,   // 评分变化超过此值才更新数据库（降低阈值以增加敏感度）

  // 评分权重（总和 = 1.0）
  // v2.5.0: 调整权重，增加访问频率权重，降低时效性权重
  // 原因：未访问记忆评分不准确（评分 2.0，但从未被访问）
  scoreWeights: {
    accessFrequency: 0.30,     // 访问频率权重（从 0.25 调整到 0.30）
    recency: 0.15,             // 时效性权重（从 0.20 调整到 0.15）
    contentQuality: 0.25,      // 内容质量权重（保持不变）
    titleQuality: 0.15,        // 标题质量权重（保持不变）
    keywordDensity: 0.15       // 关键词密度权重（保持不变）
  },

  // 类别权重（影响基础评分）
  categoryWeights: {
    breakthrough: 1.5,         // 突破性洞察（最高权重）
    creation: 1.2,             // 创作相关
    general: 1.0,              // 通用记忆
    operation: 0.8,            // 操作性记忆
    task: 0.9                  // 任务相关
  },

  // 标题质量配置
  titleQuality: {
    idealMin: 10,               // 理想最小长度
    idealMax: 50,               // 理想最大长度
    noTitleScore: 0,            // 无标题评分
    tooShortScore: 0.3,         // 太短评分
    idealScore: 1.0,           // 理想长度评分
    tooLongScore: 0.6          // 太长评分
  },

  // 内容质量分段配置
  contentQualitySegments: [
    { maxLength: 200, score: 0.2, label: '太短' },
    { maxLength: 500, score: 0.5, label: '中等' },
    { maxLength: 1000, score: 0.7, label: '较长' },
    { maxLength: Infinity, score: 1.0, label: '很长' }
  ],

  // 向量去重配置（v2.0.0）
  enableVectorDedup: true,             // 是否启用向量去重
  openaiApiKey: process.env.OPENAI_API_KEY || '',  // OpenAI API Key
  vectorSimilarityThreshold: 0.95,     // 向量相似度阈值
  vectorSaveToDB: false,               // 是否将向量存储到数据库
  vectorModel: 'text-embedding-ada-002', // 使用的嵌入模型

  // Ollama 配置（v2.0.0，本地向量生成，零成本）
  ollamaEnabled: true,                 // 是否启用 Ollama 向量去重（优先级高于 OpenAI）
  ollamaModel: 'gemma:2b',             // Ollama 模型（轻量级，速度快）
  ollamaApiUrl: 'http://localhost:11434/api/embeddings',  // Ollama API 地址
  ollamaSimilarityThreshold: 0.98,     // Ollama 相似度阈值（保持 0.98，进一步降低会增加格式相似记忆的误判）
};

// 备份脚本配置
const BACKUP_CONFIG = {
  retentionWeeks: 4,                  // 保留最近 N 周的备份
  timestampFormat: 'YYYY-MM-DD',      // 备份文件时间戳格式
  compressionFormat: 'tar.gz',        // 备份文件压缩格式
  maxBackupSize: 1024 * 1024 * 100,   // 最大备份文件大小（100MB）
  backupPrefix: 'memory-db-',          // 备份文件名前缀
  backupSuffix: '.tar.gz'              // 备份文件名后缀
};

// 访问追踪配置
const ACCESS_TRACKER_CONFIG = {
  // 类别访问频率基数（模拟访问次数）
  categoryAccessBase: {
    breakthrough: 1.5,   // 突破性记忆访问频率高
    creation: 1.3,       // 创作记忆访问频率中高
    task: 1.0,           // 任务记忆访问频率中等
    general: 0.8,        // 通用记忆访问频率中低
    operation: 0.6       // 操作性记忆访问频率低
  },

  // 时间衰减权重（越新的记忆访问频率越高）
  timeDecayWeight: 0.05,

  // 内容质量权重（内容越长的记忆可能被更频繁访问）
  contentQualityWeight: 0.1,

  // 标签保护权重（protected 标签的记忆是高访问频率的记忆）
  protectedTagWeight: 1.5,

  // 随机扰动范围（±N%，模拟真实访问波动）
  randomFluctuation: 0.1
};

// 报告归档配置
const REPORT_ARCHIVE_CONFIG = {
  retentionWeeks: 4,                  // 保留最近 N 周的报告
  filenamePattern: 'YYYYMMDD-HHMMSS-report.json',  // 报告文件名模式
  indexFile: 'README.md'               // 历史报告索引文件名
};

// 指数衰减配置（v2.5.0）
const EXPONENTIAL_DECAY_CONFIG = {
  // 评分更新阈值
  threshold: 0.15,                     // 评分变化超过此值才更新数据库

  // 指数衰减参数
  tau: 279,                          // 衰减时间常数(分钟,基于当前数据拟合)
  halfLife: null,                     // 半衰期(自动计算: tau * ln(2))

  // 线性模型参数(用于对比)
  linearRate: 0.000722,              // 线性衰减速率(score_change / 分钟)

  // 预测配置
  predictionAccuracyThreshold: 0.99,   // 预测准确率阈值(99%)
  dataPointsRequired: 10,            // 建立模型所需的最少数据点

  // 调试配置
  debugMode: false,                  // 调试模式(输出详细预测信息)
  logPredictions: true                // 记录预测结果到 optimization_log
};

// 计算半衰期
EXPONENTIAL_DECAY_CONFIG.halfLife = EXPONENTIAL_DECAY_CONFIG.tau * Math.log(2);

// 导出配置
module.exports = {
  WORKSPACE_DIR,
  DB_CONFIG,
  OPTIMIZE_CONFIG,
  BACKUP_CONFIG,
  ACCESS_TRACKER_CONFIG,
  REPORT_ARCHIVE_CONFIG,
  EXPONENTIAL_DECAY_CONFIG
};
