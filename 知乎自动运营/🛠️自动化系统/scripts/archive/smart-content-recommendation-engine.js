#!/usr/bin/env node

/**
 * smart-content-recommendation-engine.js
 *
 * 智能内容推荐引擎
 *
 * 主要功能：
 *   - 基于用户画像的内容个性化推荐
 *   - 内容质量评估和效果预测
 *   - A/B 测试和数据驱动的优化
 *   - 实时推荐策略调整
 *
 * 技术特性：
 *   - 机器学习推荐算法
 *   - 多维度质量评估
 *   - 个性化用户画像
 *   - 实时数据更新
 *   - A/B 测试框架
 *
 * 使用方法：
 *   node scripts/smart-content-recommendation-engine.js [options]
 *
 * 选项：
 *   --user-id <id>           指定用户ID
 *   --content-id <id>        指定内容ID
 *   --algorithm <name>       指定推荐算法 (collaborative|content-based|hybrid)
 *   --limit <number>         返回推荐数量
 *   --test-mode              启用测试模式
 *   --debug                  启用调试模式
 *   --update-model           更新推荐模型
 *   --ab-test               启动A/B测试
 *
 * 依赖：
 *   - @tensorflow/tfjs
 *   - @tensorflow/tfjs-node
 *   - natural (NLP处理)
 *   - node-svm (SVM分类)
 *   - mongoose (MongoDB)
 *   - redis (缓存)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs');
const natural = require('natural');
const { MongoClient } = require('mongodb');
const redis = require('redis');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw/workspace');
const ZHIHU_AUTO_DIR = path.join(WORKSPACE_DIR, '知乎自动运营');
const CONTENT_DIR = path.join(ZHIHU_AUTO_DIR, '📤待发布');
const PUBLISHED_DIR = path.join(ZHIHU_AUTO_DIR, '📤已发布');
const METHOD_DIR = path.join(ZHIHU_AUTO_DIR, '📚方法论');
const CONFIG = require(path.join(ZHIHU_AUTO_DIR, 'config.json'));

// ─── 数据库连接 ─────────────────────────────────────────────────────────────

class DatabaseManager {
  constructor() {
    this.mongodb = null;
    this.mongodbClient = null;
    this.redis = null;
    this.connected = false;
  }

  async connect() {
    try {
      // 连接 MongoDB
      this.mongodbClient = new MongoClient(CONFIG.mongodb.url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      await this.mongodbClient.connect();
      this.mongodb = this.mongodbClient.db(CONFIG.mongodb.database);

      // 连接 Redis
      this.redis = redis.createClient({
        host: CONFIG.redis.host,
        port: CONFIG.redis.port,
        password: CONFIG.redis.password
      });

      await this.redis.connect();
      this.connected = true;
      console.log('✅ 数据库连接成功');
    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.mongodbClient) {
      await this.mongodbClient.close();
    }
    if (this.redis) {
      await this.redis.disconnect();
    }
    this.connected = false;
  }

  async getContentCollection() {
    return this.mongodb.collection('content');
  }

  async getUserCollection() {
    return this.mongodb.collection('users');
  }

  async getBehaviorCollection() {
    return this.mongodb.collection('user_behaviors');
  }

  async getCache(key) {
    try {
      return await this.redis.get(key);
    } catch (error) {
      console.error('Redis缓存读取失败:', error);
      return null;
    }
  }

  async setCache(key, value, ttl = 3600) {
    try {
      await this.redis.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis缓存写入失败:', error);
    }
  }
}

// ─── 用户画像系统 ────────────────────────────────────────────────────────────

class UserProfile {
  constructor(database) {
    this.db = database;
    this.analyzer = new natural.SentimentAnalyzer('English', 
      natural.PorterStemmer, 'afinn');
  }

  async buildUserProfile(userId) {
    try {
      // 获取用户行为数据
      const behaviors = await this.getUserBehaviors(userId);
      
      // 构建用户画像
      const profile = {
        userId,
        technicalInterests: this.analyzeTechnicalInterests(behaviors),
        skillLevel: this.assessSkillLevel(behaviors),
        learningStyle: this.identifyLearningStyle(behaviors),
        contentPreferences: this.analyzeContentPreferences(behaviors),
        engagementPattern: this.analyzeEngagementPattern(behaviors),
        purchaseBehavior: this.analyzePurchaseBehavior(behaviors),
        lastUpdated: new Date()
      };

      // 缓存用户画像
      await this.db.setCache(`user_profile_${userId}`, profile, 7200);
      
      return profile;
    } catch (error) {
      console.error('构建用户画像失败:', error);
      throw error;
    }
  }

  async getUserBehaviors(userId) {
    const behaviorsCollection = await this.db.getBehaviorCollection();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await behaviorsCollection
      .find({ 
        userId, 
        timestamp: { $gte: thirtyDaysAgo }
      })
      .sort({ timestamp: -1 })
      .toArray();
  }

  analyzeTechnicalInterests(behaviors) {
    const interests = {};
    
    behaviors.forEach(behavior => {
      if (behavior.contentType === 'article') {
        // 分析技术标签
        const tags = this.extractTechnicalTags(behavior.content);
        tags.forEach(tag => {
          interests[tag] = (interests[tag] || 0) + 1;
        });
      }
    });

    // 归一化并排序
    const total = Object.values(interests).reduce((sum, count) => sum + count, 0);
    Object.keys(interests).forEach(key => {
      interests[key] = interests[key] / total;
    });

    return interests;
  }

  assessSkillLevel(behaviors) {
    let skillScore = 0;
    let totalWeight = 0;

    behaviors.forEach(behavior => {
      const weight = this.getBehaviorWeight(behavior);
      const skillContribution = this.calculateSkillContribution(behavior);
      
      skillScore += weight * skillContribution;
      totalWeight += weight;
    });

    return totalWeight > 0 ? skillScore / totalWeight : 0.5;
  }

  identifyLearningStyle(behaviors) {
    const styleScores = {
      visual: 0,
      auditory: 0,
      reading: 0,
      kinesthetic: 0
    };

    behaviors.forEach(behavior => {
      if (behavior.contentType === 'article') {
        // 分析内容偏好
        if (behavior.content.includes('图表') || behavior.content.includes('示意图')) {
          styleScores.visual += 1;
        }
        if (behavior.content.includes('视频') || behavior.content.includes('音频')) {
          styleScores.auditory += 1;
        }
        if (behavior.content.includes('步骤') || behavior.content.includes('教程')) {
          styleScores.reading += 1;
        }
        if (behavior.content.includes('实践') || behavior.content.includes('实战')) {
          styleScores.kinesthetic += 1;
        }
      }
    });

    // 找出最高分的风格
    const maxStyle = Object.keys(styleScores).reduce((a, b) => 
      styleScores[a] > styleScores[b] ? a : b
    );

    return {
      primary: maxStyle,
      scores: styleScores
    };
  }

  extractTechnicalTags(content) {
    // 使用 TF-IDF 提取技术关键词
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(content.toLowerCase());
    
    // 过滤停用词
    const stopWords = natural.stopwords;
    const filteredTokens = tokens.filter(token => 
      token.length > 2 && !stopWords.includes(token)
    );

    // 计算词频
    const wordFreq = {};
    filteredTokens.forEach(token => {
      wordFreq[token] = (wordFreq[token] || 0) + 1;
    });

    // 返回前10个高频词
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  getBehaviorWeight(behavior) {
    const weights = {
      view: 1,
      like: 3,
      favorite: 5,
      comment: 4,
      share: 6,
      purchase: 10
    };
    return weights[behavior.action] || 1;
  }

  calculateSkillContribution(behavior) {
    const skillWeights = {
      beginner: 0.3,
      intermediate: 0.6,
      advanced: 0.9,
      expert: 1.0
    };
    return skillWeights[behavior.difficulty] || 0.5;
  }
}

// ─── 内容质量评估系统 ────────────────────────────────────────────────────────

class ContentQualityAnalyzer {
  constructor(database) {
    this.db = database;
    this.model = null;
    this.featureExtractor = new ContentFeatureExtractor();
  }

  async loadModel() {
    try {
      // 加载预训练的质量评估模型
      const modelPath = path.join(__dirname, '../models/content_quality_model');
      if (fs.existsSync(modelPath)) {
        this.model = await tf.loadLayersModel(`file://${modelPath}`);
        console.log('✅ 质量评估模型加载成功');
      } else {
        console.log('🔄 使用默认评估模型');
        this.model = this.createDefaultModel();
      }
    } catch (error) {
      console.error('模型加载失败:', error);
      this.model = this.createDefaultModel();
    }
  }

  createDefaultModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [20], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  async analyzeContent(content) {
    try {
      // 提取内容特征
      const features = await this.featureExtractor.extractFeatures(content);
      
      // 使用模型预测质量分数
      const prediction = this.model.predict(tf.tensor([features]));
      const qualityScore = await prediction.data();
      
      // 分析各个维度的分数
      const dimensionalScores = await this.analyzeDimensionalScores(content);
      
      // 生成优化建议
      const suggestions = this.generateOptimizationSuggestions(dimensionalScores);
      
      return {
        qualityScore: qualityScore[0],
        dimensionalScores,
        suggestions,
        features,
        predictionConfidence: this.calculateConfidence(features)
      };
    } catch (error) {
      console.error('内容分析失败:', error);
      throw error;
    }
  }

  async analyzeDimensionalScores(content) {
    return {
      technicalDepth: this.calculateTechnicalDepth(content),
      practicalValue: this.calculatePracticalValue(content),
      userExperience: this.calculateUserExperience(content),
      marketValue: this.calculateMarketValue(content)
    };
  }

  calculateTechnicalDepth(content) {
    let score = 0;
    const totalChecks = 4;
    
    // 检查数学推导
    if (content.match(/公式|推导|数学/g)) score += 0.25;
    if (content.match(/算法|原理|机制/g)) score += 0.25;
    if (content.match(/性能|优化|复杂度/g)) score += 0.25;
    if (content.match(/架构|设计|模式/g)) score += 0.25;
    
    return Math.min(score, 1.0);
  }

  calculatePracticalValue(content) {
    let score = 0;
    const totalChecks = 4;
    
    // 检查步骤清晰度
    if (content.match(/步骤|方法|流程/g)) score += 0.25;
    if (content.match(/代码|实现|示例/g)) score += 0.25;
    if (content.match(/避坑|问题|解决/g)) score += 0.25;
    if (content.match(/效果|验证|测试/g)) score += 0.25;
    
    return Math.min(score, 1.0);
  }

  calculateUserExperience(content) {
    let score = 0;
    const totalChecks = 4;
    
    // 检查结构清晰度
    if (content.match(/##|###|标题|目录/g)) score += 0.25;
    if (content.match(/图表|图片|示意图/g)) score += 0.25;
    if (content.match(/简单|易懂|清晰/g)) score += 0.25;
    if (content.length > 1000 && content.length < 5000) score += 0.25;
    
    return Math.min(score, 1.0);
  }

  calculateMarketValue(content) {
    let score = 0;
    const totalChecks = 4;
    
    // 检查市场价值
    if (content.match(/热门|趋势|前沿/g)) score += 0.25;
    if (content.match(/稀缺|独特|差异化/g)) score += 0.25;
    if (content.match(/付费|变现|商业/g)) score += 0.25;
    if (content.match(/分享|传播|推荐/g)) score += 0.25;
    
    return Math.min(score, 1.0);
  }

  generateOptimizationSuggestions(dimensionalScores) {
    const suggestions = [];
    
    // 技术深度建议
    if (dimensionalScores.technicalDepth < 0.7) {
      suggestions.push({
        category: 'technical_depth',
        priority: 'high',
        title: '增强技术深度',
        description: '添加更多技术原理解释和数学推导',
        suggestions: [
          '添加核心算法的详细推导过程',
          '补充技术原理的深入解释',
          '增加性能对比和优化建议',
          '添加技术演进历史和背景'
        ]
      });
    }
    
    // 实用价值建议
    if (dimensionalScores.practicalValue < 0.7) {
      suggestions.push({
        category: 'practical_value',
        priority: 'high',
        title: '提升实用价值',
        description: '增加更多实操步骤和具体案例',
        suggestions: [
          '添加详细的操作步骤指导',
          '提供完整的代码示例',
          '补充常见问题和解决方案',
          '添加实际应用效果展示'
        ]
      });
    }
    
    // 用户体验建议
    if (dimensionalScores.userExperience < 0.7) {
      suggestions.push({
        category: 'user_experience',
        priority: 'medium',
        title: '优化用户体验',
        description: '改善内容结构和表达方式',
        suggestions: [
          '重新组织内容结构',
          '优化标题和层次结构',
          '增加图表和视觉元素',
          '改善语言表达和可读性'
        ]
      });
    }
    
    // 市场价值建议
    if (dimensionalScores.marketValue < 0.7) {
      suggestions.push({
        category: 'market_value',
        priority: 'medium',
        title: '提升市场价值',
        description: '增强内容差异化和社会影响力',
        suggestions: [
          '突出内容的独特价值',
          '结合当前技术趋势',
          '强调商业应用场景',
          '添加社交分享价值'
        ]
      });
    }
    
    return suggestions;
  }

  calculateConfidence(features) {
    // 基于特征一致性计算预测置信度
    const featureVariance = this.calculateFeatureVariance(features);
    const confidence = 1 - Math.min(featureVariance, 1);
    return confidence;
  }

  calculateFeatureVariance(features) {
    const values = Object.values(features);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}

// ─── 特征提取器 ───────────────────────────────────────────────────────────────

class ContentFeatureExtractor {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.tfidf = new natural.TfIdf();
  }

  async extractFeatures(content) {
    const features = {};
    
    // 基础统计特征
    features.wordCount = content.length;
    features.paragraphCount = content.split('\n\n').length;
    features.sentenceCount = content.split(/[.!?]+/).length;
    
    // 技术特征
    features.technicalTermCount = this.countTechnicalTerms(content);
    features.codeSnippetCount = this.countCodeSnippets(content);
    features.formulaCount = this.countFormulas(content);
    
    // 结构特征
    features.headingCount = this.countHeadings(content);
    features.listCount = this.countLists(content);
    features.linkCount = this.countLinks(content);
    
    // 语言特征
    features.readabilityScore = this.calculateReadability(content);
    features.complexityScore = this.calculateComplexity(content);
    
    // 内容特征
    features.topicDistribution = this.analyzeTopics(content);
    features.sentimentScore = this.analyzeSentiment(content);
    
    // 归一化特征
    return this.normalizeFeatures(features);
  }

  countTechnicalTerms(content) {
    const technicalTerms = [
      '算法', '架构', '设计', '模式', '原理', '机制',
      '优化', '性能', '效率', '复杂度', '数据结构',
      '机器学习', '深度学习', '神经网络', 'transformer',
      'rnn', 'lstm', 'attention', 'embedding', 'vector'
    ];
    
    let count = 0;
    technicalTerms.forEach(term => {
      count += (content.match(new RegExp(term, 'g')) || []).length;
    });
    
    return count;
  }

  countCodeSnippets(content) {
    const codeRegex = /```[\s\S]*?```/g;
    const matches = content.match(codeRegex);
    return matches ? matches.length : 0;
  }

  countFormulas(content) {
    const formulaRegex = /\$.*\$|\\\[\s*[\s\S]*?\s*\\\]/g;
    const matches = content.match(formulaRegex);
    return matches ? matches.length : 0;
  }

  countHeadings(content) {
    const headingRegex = /^#{1,6}\s+/gm;
    const matches = content.match(headingRegex);
    return matches ? matches.length : 0;
  }

  countLists(content) {
    const listRegex = /^[\*\-\+]\s+|^\d+\.\s+/gm;
    const matches = content.match(listRegex);
    return matches ? matches.length : 0;
  }

  countLinks(content) {
    const linkRegex = /\[.*?\]\(.*?\)/g;
    const matches = content.match(linkRegex);
    return matches ? matches.length : 0;
  }

  calculateReadability(content) {
    // 简化的可读性计算
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    
    // 可读性分数（越低越好）
    const readability = Math.min(100, Math.max(0, 100 - (avgWordsPerSentence * 1.015)));
    return readability / 100;
  }

  calculateComplexity(content) {
    // 基于技术术语密度和代码复杂度的计算
    const words = content.split(/\s+/).length;
    const technicalTerms = this.countTechnicalTerms(content);
    const complexity = technicalTerms / words;
    
    return Math.min(1, complexity * 5); // 归一化到0-1
  }

  analyzeTopics(content) {
    // 简单的主题分析
    const topics = {
      ai: /机器学习|深度学习|神经网络|人工智能|ai/gi,
      web: /前端|后端|全栈|web|网站|开发/gi,
      mobile: /移动端|手机|app|ios|android/gi,
      data: /数据|数据库|大数据|数据挖掘|数据分析/gi,
      cloud: /云|云计算|容器|docker|kubernetes/gi
    };
    
    const topicScores = {};
    Object.keys(topics).forEach(topic => {
      const matches = content.match(topics[topic]);
      topicScores[topic] = matches ? matches.length : 0;
    });
    
    return topicScores;
  }

  analyzeSentiment(content) {
    // 简化的情感分析
    const positiveWords = ['好', '棒', '优秀', '完美', '成功', '有效', '高效', '简单'];
    const negativeWords = ['差', '坏', '失败', '复杂', '困难', '无效', '低效', '麻烦'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      positiveScore += (content.match(new RegExp(word, 'g')) || []).length;
    });
    
    negativeWords.forEach(word => {
      negativeScore += (content.match(new RegExp(word, 'g')) || []).length;
    });
    
    const totalWords = content.split(/\s+/).length;
    const sentiment = (positiveScore - negativeScore) / totalWords;
    
    return Math.max(-1, Math.min(1, sentiment * 10)); // 归一化到-1到1
  }

  normalizeFeatures(features) {
    const normalized = {};
    const keys = Object.keys(features);
    
    keys.forEach(key => {
      const value = features[key];
      if (typeof value === 'number') {
        // 根据特征类型进行归一化
        if (key === 'wordCount') {
          normalized[key] = Math.min(1, value / 10000);
        } else if (key === 'paragraphCount') {
          normalized[key] = Math.min(1, value / 50);
        } else if (key === 'sentenceCount') {
          normalized[key] = Math.min(1, value / 200);
        } else if (key === 'technicalTermCount') {
          normalized[key] = Math.min(1, value / 100);
        } else if (key === 'codeSnippetCount') {
          normalized[key] = Math.min(1, value / 20);
        } else if (key === 'formulaCount') {
          normalized[key] = Math.min(1, value / 50);
        } else if (key === 'headingCount') {
          normalized[key] = Math.min(1, value / 30);
        } else if (key === 'listCount') {
          normalized[key] = Math.min(1, value / 50);
        } else if (key === 'linkCount') {
          normalized[key] = Math.min(1, value / 20);
        } else if (key === 'readabilityScore') {
          normalized[key] = value;
        } else if (key === 'complexityScore') {
          normalized[key] = value;
        } else if (key === 'sentimentScore') {
          normalized[key] = (value + 1) / 2; // 归一化到0-1
        } else {
          normalized[key] = value;
        }
      } else if (typeof value === 'object') {
        // 处理对象类型的特征（如topicDistribution）
        const total = Object.values(value).reduce((sum, val) => sum + val, 0);
        normalized[key] = total > 0 ? value : {};
      }
    });
    
    return normalized;
  }
}

// ─── 推荐引擎 ─────────────────────────────────────────────────────────────────

class RecommendationEngine {
  constructor(database) {
    this.db = database;
    this.userProfile = new UserProfile(database);
    this.qualityAnalyzer = new ContentQualityAnalyzer(database);
    this.algorithms = {
      collaborative: new CollaborativeFiltering(database),
      'content-based': new ContentBasedFiltering(database),
      hybrid: new HybridFiltering(database)
    };
  }

  async initialize() {
    try {
      await this.db.connect();
      await this.qualityAnalyzer.loadModel();
      console.log('✅ 推荐引擎初始化成功');
    } catch (error) {
      console.error('❌ 推荐引擎初始化失败:', error);
      throw error;
    }
  }

  async getRecommendations(userId, options = {}) {
    try {
      // 构建用户画像
      const userProfile = await this.userProfile.buildUserProfile(userId);
      
      // 获取候选内容
      const candidateContent = await this.getCandidateContent(userId);
      
      // 评估内容质量
      const qualityAssessments = {};
      for (const content of candidateContent) {
        qualityAssessments[content.id] = await this.qualityAnalyzer.analyzeContent(content.content);
      }
      
      // 应用推荐算法
      const algorithm = options.algorithm || 'hybrid';
      const recommendations = await this.algorithms[algorithm].recommend(
        userProfile,
        candidateContent,
        qualityAssessments
      );
      
      // 排序和筛选
      const sortedRecommendations = this.sortAndFilterRecommendations(
        recommendations,
        options
      );
      
      // 生成推荐理由
      const recommendationsWithReasons = this.generateRecommendationReasons(
        sortedRecommendations,
        userProfile
      );
      
      return {
        userId,
        algorithm,
        recommendations: recommendationsWithReasons,
        timestamp: new Date(),
        totalCandidates: candidateContent.length,
        recommendationCount: sortedRecommendations.length
      };
    } catch (error) {
      console.error('推荐生成失败:', error);
      throw error;
    }
  }

  async getCandidateContent(userId) {
    try {
      const contentCollection = await this.db.getContentCollection();
      
      // 获取用户偏好相关的候选内容
      const userPreferences = await this.getUserPreferences(userId);
      const contentCategories = Object.keys(userPreferences);
      
      // 查询候选内容
      const query = {
        status: 'published',
        $or: [
          { category: { $in: contentCategories } },
          { tags: { $in: contentCategories } }
        ]
      };
      
      const content = await contentCollection
        .find(query)
        .sort({ qualityScore: -1, publishDate: -1 })
        .limit(100)
        .toArray();
      
      return content;
    } catch (error) {
      console.error('获取候选内容失败:', error);
      throw error;
    }
  }

  async getUserPreferences(userId) {
    const cacheKey = `user_preferences_${userId}`;
    const cached = await this.db.getCache(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 从用户行为数据中提取偏好
    const behaviors = await this.userProfile.getUserBehaviors(userId);
    const preferences = {};
    
    behaviors.forEach(behavior => {
      if (behavior.contentType === 'article') {
        const categories = behavior.categories || [];
        categories.forEach(category => {
          preferences[category] = (preferences[category] || 0) + 1;
        });
      }
    });
    
    // 缓存结果
    await this.db.setCache(cacheKey, preferences, 3600);
    
    return preferences;
  }

  sortAndFilterRecommendations(recommendations, options) {
    let sorted = [...recommendations];
    
    // 按推荐分数排序
    sorted.sort((a, b) => b.score - a.score);
    
    // 应用数量限制
    if (options.limit) {
      sorted = sorted.slice(0, options.limit);
    }
    
    // 过滤低质量内容
    sorted = sorted.filter(rec => rec.qualityScore > 0.6);
    
    return sorted;
  }

  generateRecommendationReasons(recommendations, userProfile) {
    return recommendations.map(rec => ({
      ...rec,
      reasons: this.generateReasons(rec, userProfile)
    }));
  }

  generateReasons(recommendation, userProfile) {
    const reasons = [];
    
    // 基于用户兴趣的推荐理由
    if (recommendation.matchScore > 0.7) {
      reasons.push({
        type: 'interest_match',
        strength: 'strong',
        description: '与您的技术兴趣高度匹配'
      });
    }
    
    // 基于内容质量的推荐理由
    if (recommendation.qualityScore > 0.8) {
      reasons.push({
        type: 'quality',
        strength: 'strong',
        description: '高质量内容，深度价值'
      });
    }
    
    // 基于新颖性的推荐理由
    if (recommendation.noveltyScore > 0.7) {
      reasons.push({
        type: 'novelty',
        strength: 'medium',
        description: '前沿技术内容'
      });
    }
    
    // 基于实用性的推荐理由
    if (recommendation.practicalValue > 0.7) {
      reasons.push({
        type: 'practical',
        strength: 'medium',
        description: '实用性强，可直接应用'
      });
    }
    
    return reasons;
  }
}

// ─── 推荐算法实现 ────────────────────────────────────────────────────────────

class CollaborativeFiltering {
  constructor(database) {
    this.db = database;
  }

  async recommend(userProfile, candidateContent, qualityAssessments) {
    // 基于协同过滤的推荐算法
    const recommendations = [];
    
    for (const content of candidateContent) {
      const score = await this.calculateCollaborativeScore(
        userProfile,
        content,
        qualityAssessments
      );
      
      recommendations.push({
        contentId: content.id,
        score,
        algorithm: 'collaborative',
        matchScore: this.calculateMatchScore(userProfile, content),
        qualityScore: qualityAssessments[content.id].qualityScore,
        reasons: []
      });
    }
    
    return recommendations;
  }

  async calculateCollaborativeScore(userProfile, content, qualityAssessments) {
    // 简化的协同过滤算法
    let score = 0;
    
    // 基于用户相似度的分数
    const similarity = await this.calculateUserSimilarity(userProfile, content);
    score += similarity * 0.4;
    
    // 基于内容质量的分数
    const quality = qualityAssessments[content.id].qualityScore;
    score += quality * 0.3;
    
    // 基于流行度的分数
    const popularity = await this.calculateContentPopularity(content.id);
    score += popularity * 0.2;
    
    // 基于新颖性的分数
    const novelty = await this.calculateContentNovelty(content);
    score += novelty * 0.1;
    
    return score;
  }

  async calculateUserSimilarity(userProfile, content) {
    // 简化的用户相似度计算
    const userInterests = userProfile.technicalInterests;
    const contentTags = content.tags || [];
    
    let similarity = 0;
    let totalWeight = 0;
    
    contentTags.forEach(tag => {
      if (userInterests[tag]) {
        similarity += userInterests[tag];
        totalWeight += 1;
      }
    });
    
    return totalWeight > 0 ? similarity / totalWeight : 0;
  }

  async calculateContentPopularity(contentId) {
    // 简化的内容流行度计算
    // 这里可以从数据库获取实际的流行度数据
    return Math.random() * 0.5 + 0.5; // 临时值
  }

  async calculateContentNovelty(content) {
    // 简化的内容新颖性计算
    const publishDate = new Date(content.publishDate);
    const now = new Date();
    const daysDiff = (now - publishDate) / (1000 * 60 * 60 * 24);
    
    // 发布时间越近，新颖性越高
    return Math.max(0, 1 - daysDiff / 365);
  }

  calculateMatchScore(userProfile, content) {
    const interests = userProfile.technicalInterests;
    const contentTags = content.tags || [];
    
    let matchScore = 0;
    let totalTags = 0;
    
    contentTags.forEach(tag => {
      if (interests[tag]) {
        matchScore += interests[tag];
        totalTags += 1;
      }
    });
    
    return totalTags > 0 ? matchScore / totalTags : 0;
  }
}

class ContentBasedFiltering {
  constructor(database) {
    this.db = database;
    this.featureExtractor = new ContentFeatureExtractor();
  }

  async recommend(userProfile, candidateContent, qualityAssessments) {
    const recommendations = [];
    
    for (const content of candidateContent) {
      const score = await this.calculateContentBasedScore(
        userProfile,
        content,
        qualityAssessments
      );
      
      recommendations.push({
        contentId: content.id,
        score,
        algorithm: 'content-based',
        matchScore: this.calculateMatchScore(userProfile, content),
        qualityScore: qualityAssessments[content.id].qualityScore,
        reasons: []
      });
    }
    
    return recommendations;
  }

  async calculateContentBasedScore(userProfile, content, qualityAssessments) {
    let score = 0;
    
    // 基于内容特征匹配
    const contentFeatures = await this.featureExtractor.extractFeatures(content.content);
    const profileFeatures = userProfile.contentPreferences;
    
    // 计算特征相似度
    const featureSimilarity = this.calculateFeatureSimilarity(contentFeatures, profileFeatures);
    score += featureSimilarity * 0.4;
    
    // 基于学习风格的匹配
    const learningStyleMatch = this.calculateLearningStyleMatch(userProfile, content);
    score += learningStyleMatch * 0.3;
    
    // 基于技能水平的匹配
    const skillLevelMatch = this.calculateSkillLevelMatch(userProfile, content);
    score += skillLevelMatch * 0.2;
    
    // 基于内容质量的权重
    const quality = qualityAssessments[content.id].qualityScore;
    score += quality * 0.1;
    
    return score;
  }

  calculateFeatureSimilarity(contentFeatures, profileFeatures) {
    // 简化的特征相似度计算
    let similarity = 0;
    let totalFeatures = 0;
    
    Object.keys(contentFeatures).forEach(feature => {
      if (profileFeatures[feature]) {
        similarity += Math.min(contentFeatures[feature], profileFeatures[feature]);
        totalFeatures += 1;
      }
    });
    
    return totalFeatures > 0 ? similarity / totalFeatures : 0;
  }

  calculateLearningStyleMatch(userProfile, content) {
    const userStyle = userProfile.learningStyle.primary;
    const contentStyle = this.detectContentStyle(content);
    
    // 简化的学习风格匹配
    const styleCompatibility = {
      visual: ['visual', 'reading'],
      auditory: ['auditory', 'reading'],
      reading: ['reading', 'visual'],
      kinesthetic: ['kinesthetic', 'reading']
    };
    
    return styleCompatibility[userStyle]?.includes(contentStyle) ? 1 : 0;
  }

  calculateSkillLevelMatch(userProfile, content) {
    const userLevel = userProfile.skillLevel;
    const contentLevel = content.difficulty || 'intermediate';
    
    // 简化的技能水平匹配
    const levelCompatibility = {
      beginner: ['beginner', 'intermediate'],
      intermediate: ['beginner', 'intermediate', 'advanced'],
      advanced: ['intermediate', 'advanced', 'expert'],
      expert: ['advanced', 'expert']
    };
    
    return levelCompatibility[userLevel]?.includes(contentLevel) ? 1 : 0.5;
  }

  calculateMatchScore(userProfile, content) {
    // 基于内容特征的用户匹配分数
    const contentFeatures = this.extractContentFeatures(content);
    const userInterests = userProfile.technicalInterests;
    
    let matchScore = 0;
    let totalInterests = 0;
    
    Object.keys(contentFeatures).forEach(topic => {
      if (userInterests[topic]) {
        matchScore += userInterests[topic] * contentFeatures[topic];
        totalInterests += 1;
      }
    });
    
    return totalInterests > 0 ? matchScore / totalInterests : 0;
  }

  extractContentFeatures(content) {
    // 提取内容特征
    const features = {};
    const text = content.content.toLowerCase();
    
    // 技术主题特征
    features.ai = text.match(/机器学习|深度学习|神经网络/gi) ? 1 : 0;
    features.web = text.match(/前端|后端|全栈|web/gi) ? 1 : 0;
    features.mobile = text.match(/移动端|手机|app/gi) ? 1 : 0;
    features.data = text.match(/数据|数据库|大数据/gi) ? 1 : 0;
    features.cloud = text.match(/云|云计算|容器/gi) ? 1 : 0;
    
    return features;
  }

  detectContentStyle(content) {
    // 简化的内容风格检测
    const text = content.content;
    
    if (text.includes('图表') || text.includes('示意图')) return 'visual';
    if (text.includes('视频') || text.includes('音频')) return 'auditory';
    if (text.includes('步骤') || text.includes('教程')) return 'reading';
    if (text.includes('实践') || text.includes('实战')) return 'kinesthetic';
    
    return 'reading'; // 默认风格
  }
}

class HybridFiltering {
  constructor(database) {
    this.db = database;
    this.collaborative = new CollaborativeFiltering(database);
    this.contentBased = new ContentBasedFiltering(database);
  }

  async recommend(userProfile, candidateContent, qualityAssessments) {
    // 混合推荐算法
    const collaborativeRecs = await this.collaborative.recommend(
      userProfile, candidateContent, qualityAssessments
    );
    
    const contentBasedRecs = await this.contentBased.recommend(
      userProfile, candidateContent, qualityAssessments
    );
    
    // 混合推荐结果
    const hybridRecs = this.hybridizeRecommendations(
      collaborativeRecs, contentBasedRecs
    );
    
    return hybridRecs;
  }

  hybridizeRecommendations(collaborativeRecs, contentBasedRecs) {
    const hybridRecs = [];
    
    // 创建内容ID到分数的映射
    const scoreMap = new Map();
    
    // 协同过滤分数 (权重 0.6)
    collaborativeRecs.forEach(rec => {
      const key = rec.contentId;
      scoreMap.set(key, (scoreMap.get(key) || 0) + rec.score * 0.6);
    });
    
    // 基于内容的分数 (权重 0.4)
    contentBasedRecs.forEach(rec => {
      const key = rec.contentId;
      scoreMap.set(key, (scoreMap.get(key) || 0) + rec.score * 0.4);
    });
    
    // 生成混合推荐结果
    scoreMap.forEach((score, contentId) => {
      const collabRec = collaborativeRecs.find(r => r.contentId === contentId);
      const contentRec = contentBasedRecs.find(r => r.contentId === contentId);
      
      hybridRecs.push({
        contentId,
        score,
        algorithm: 'hybrid',
        matchScore: collabRec?.matchScore || contentRec?.matchScore || 0,
        qualityScore: collabRec?.qualityScore || contentRec?.qualityScore || 0,
        reasons: [
          ...(collabRec?.reasons || []),
          ...(contentRec?.reasons || [])
        ]
      });
    });
    
    // 按分数排序
    hybridRecs.sort((a, b) => b.score - a.score);
    
    return hybridRecs;
  }
}

// ─── A/B 测试框架 ──────────────────────────────────────────────────────────────

class ABTestFramework {
  constructor(database) {
    this.db = database;
  }

  async createABTest(testConfig) {
    const test = {
      id: this.generateTestId(),
      name: testConfig.name,
      description: testConfig.description,
      startTime: new Date(),
      endTime: new Date(Date.now() + testConfig.duration * 24 * 60 * 60 * 1000),
      groups: testConfig.groups,
      metrics: testConfig.metrics,
      status: 'active',
      results: null
    };
    
    // 保存测试配置
    const testsCollection = this.db.tests;
    await testsCollection.insertOne(test);
    
    return test;
  }

  async assignUserToTest(userId, testId) {
    // 随机分配用户到测试组
    const test = await this.db.tests.findOne({ id: testId });
    if (!test) throw new Error('测试不存在');
    
    const randomGroup = Math.random() < 0.5 ? 'A' : 'B';
    
    const assignment = {
      userId,
      testId,
      group: randomGroup,
      assignedAt: new Date()
    };
    
    const assignmentsCollection = this.db.abTestAssignments;
    await assignmentsCollection.insertOne(assignment);
    
    return randomGroup;
  }

  async recordMetric(metricData) {
    // 记录用户在测试中的行为数据
    const metric = {
      ...metricData,
      recordedAt: new Date()
    };
    
    const metricsCollection = this.db.abTestMetrics;
    await metricsCollection.insertOne(metric);
  }

  async calculateTestResults(testId) {
    const test = await this.db.tests.findOne({ id: testId });
    if (!test) throw new Error('测试不存在');
    
    // 获取所有测试数据
    const assignments = await this.db.abTestAssignments
      .find({ testId })
      .toArray();
    
    const metrics = await this.db.abTestMetrics
      .find({ testId })
      .toArray();
    
    // 计算各组的指标
    const groupResults = {};
    
    test.groups.forEach(group => {
      const groupAssignments = assignments.filter(a => a.group === group);
      const groupMetrics = metrics.filter(m => 
        groupAssignments.some(a => a.userId === m.userId)
      );
      
      groupResults[group] = this.calculateGroupMetrics(groupMetrics, test.metrics);
    });
    
    // 计算统计显著性
    const significance = this.calculateSignificance(groupResults.A, groupResults.B);
    
    return {
      testId,
      groupResults,
      significance,
      confidence: significance.confidence,
      recommendation: significance.confidence > 0.95 ? 
        (groupResults.A.value > groupResults.B.value ? 'A' : 'B') : 'inconclusive'
    };
  }

  calculateGroupMetrics(groupMetrics, metrics) {
    const result = {};
    
    metrics.forEach(metric => {
      const values = groupMetrics
        .filter(m => m.metricType === metric.type)
        .map(m => m.value);
      
      if (values.length > 0) {
        result[metric.type] = {
          value: values.reduce((sum, val) => sum + val, 0) / values.length,
          count: values.length,
          total: values.reduce((sum, val) => sum + val, 0)
        };
      }
    });
    
    return result;
  }

  calculateSignificance(groupA, groupB) {
    // 简化的显著性计算
    const aValues = Object.values(groupA).map(g => g.value);
    const bValues = Object.values(groupB).map(g => g.value);
    
    if (aValues.length === 0 || bValues.length === 0) {
      return { confidence: 0, significance: 'insufficient_data' };
    }
    
    // 计算平均值差异
    const aMean = aValues.reduce((sum, val) => sum + val, 0) / aValues.length;
    const bMean = bValues.reduce((sum, val) => sum + val, 0) / bValues.length;
    const meanDiff = Math.abs(aMean - bMean);
    
    // 简化的置信度计算
    const confidence = Math.min(0.95, meanDiff / Math.max(aMean, bMean));
    
    return {
      confidence,
      significance: confidence > 0.95 ? 'significant' : 'not_significant'
    };
  }

  generateTestId() {
    return 'ab_test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// ─── 主程序 ───────────────────────────────────────────────────────────────────

class SmartContentRecommendationEngine {
  constructor() {
    this.db = new DatabaseManager();
    this.recommendationEngine = new RecommendationEngine(this.db);
    this.abTest = new ABTestFramework(this.db);
  }

  async initialize() {
    await this.db.connect();
    await this.recommendationEngine.initialize();
  }

  async shutdown() {
    await this.db.disconnect();
  }

  async run(options) {
    try {
      const { userId, algorithm, limit, testMode, debug } = options;
      
      if (testMode) {
        return await this.runTestMode(options);
      }
      
      if (debug) {
        return await this.runDebugMode(options);
      }
      
      // 正常推荐模式
      const recommendations = await this.recommendationEngine.getRecommendations(userId, {
        algorithm,
        limit
      });
      
      return recommendations;
    } catch (error) {
      console.error('推荐引擎运行失败:', error);
      throw error;
    }
  }

  async runTestMode(options) {
    const testResults = {
      algorithmComparison: {},
      qualityAssessment: {},
      performanceMetrics: {}
    };
    
    // 测试不同算法
    const algorithms = ['collaborative', 'content-based', 'hybrid'];
    for (const algorithm of algorithms) {
      const startTime = Date.now();
      const recommendations = await this.recommendationEngine.getRecommendations(options.userId, {
        algorithm,
        limit: options.limit
      });
      const endTime = Date.now();
      
      testResults.algorithmComparison[algorithm] = {
        recommendationCount: recommendations.recommendations.length,
        averageScore: recommendations.recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.recommendations.length,
        averageQuality: recommendations.recommendations.reduce((sum, rec) => sum + rec.qualityScore, 0) / recommendations.recommendations.length,
        executionTime: endTime - startTime
      };
    }
    
    // 测试质量评估
    const contentCollection = await this.db.getContentCollection();
    const sampleContent = await contentCollection.find().limit(10).toArray();
    
    testResults.qualityAssessment = {
      sampleSize: sampleContent.length,
      averageScore: 0,
      scoreDistribution: {}
    };
    
    for (const content of sampleContent) {
      const assessment = await this.recommendationEngine.qualityAnalyzer.analyzeContent(content.content);
      testResults.qualityAssessment.averageScore += assessment.qualityScore;
      
      const scoreRange = Math.floor(assessment.qualityScore * 10) / 10;
      testResults.qualityAssessment.scoreDistribution[scoreRange] = 
        (testResults.qualityAssessment.scoreDistribution[scoreRange] || 0) + 1;
    }
    
    testResults.qualityAssessment.averageScore /= sampleContent.length;
    
    return testResults;
  }

  async runDebugMode(options) {
    const debugInfo = {
      userProfile: null,
      contentAnalysis: {},
      recommendationDetails: {}
    };
    
    // 构建用户画像
    debugInfo.userProfile = await this.recommendationEngine.userProfile.buildUserProfile(options.userId);
    
    // 分析内容
    const contentCollection = await this.db.getContentCollection();
    const sampleContent = await contentCollection.find().limit(5).toArray();
    
    for (const content of sampleContent) {
      const analysis = await this.recommendationEngine.qualityAnalyzer.analyzeContent(content.content);
      debugInfo.contentAnalysis[content.id] = analysis;
    }
    
    // 生成推荐
    const recommendations = await this.recommendationEngine.getRecommendations(options.userId, {
      algorithm: options.algorithm,
      limit: options.limit
    });
    
    debugInfo.recommendationDetails = {
      totalCandidates: recommendations.totalCandidates,
      selectedRecommendations: recommendations.recommendations.length,
      algorithmUsed: recommendations.algorithm,
      topRecommendations: recommendations.recommendations.slice(0, 3)
    };
    
    return debugInfo;
  }
}

// ─── 命令行接口 ────────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    userId: args.find(arg => arg.startsWith('--user-id'))?.split('=')[1],
    algorithm: args.find(arg => arg.startsWith('--algorithm'))?.split('=')[1] || 'hybrid',
    limit: parseInt(args.find(arg => arg.startsWith('--limit'))?.split('=')[1]) || 10,
    testMode: args.includes('--test-mode'),
    debug: args.includes('--debug'),
    updateModel: args.includes('--update-model'),
    abTest: args.includes('--ab-test')
  };
  
  // 验证必要参数
  if (!options.userId) {
    console.error('❌ 错误: 必须指定 --user-id 参数');
    console.log('使用示例:');
    console.log('  node scripts/smart-content-recommendation-engine.js --user-id user123');
    console.log('  node scripts/smart-content-recommendation-engine.js --user-id user123 --algorithm collaborative --limit 5');
    console.log('  node scripts/smart-content-recommendation-engine.js --user-id user123 --test-mode');
    console.log('  node scripts/smart-content-recommendation-engine.js --user-id user123 --debug');
    process.exit(1);
  }
  
  // 创建并运行推荐引擎
  const engine = new SmartContentRecommendationEngine();
  
  engine.initialize()
    .then(() => {
      console.log('🚀 智能内容推荐引擎启动成功');
      console.log('配置:', JSON.stringify(options, null, 2));
      
      return engine.run(options);
    })
    .then((result) => {
      console.log('\n📊 推荐结果:');
      console.log(JSON.stringify(result, null, 2));
      
      if (options.testMode) {
        console.log('\n🔬 测试模式结果:');
        console.log('算法对比:', result.algorithmComparison);
        console.log('质量评估:', result.qualityAssessment);
      }
      
      if (options.debug) {
        console.log('\n🔍 调试信息:');
        console.log('用户画像:', result.userProfile);
        console.log('内容分析:', Object.keys(result.contentAnalysis).length);
        console.log('推荐详情:', result.recommendationDetails);
      }
    })
    .catch((error) => {
      console.error('❌ 运行失败:', error);
      process.exit(1);
    })
    .finally(() => {
      engine.shutdown();
    });
}

module.exports = {
  SmartContentRecommendationEngine,
  UserProfile,
  ContentQualityAnalyzer,
  RecommendationEngine,
  ABTestFramework
};