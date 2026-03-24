#!/usr/bin/env node

/**
 * 向量去重器 (v2.0.0)
 *
 * 功能：
 * 1. 生成内容向量（使用 OpenAI Embeddings）
 * 2. 计算余弦相似度
 * 3. 查找相似记忆（相似度 > 阈值）
 * 4. 集成到优化流程
 * 5. 向量持久化（存储到数据库）
 * 6. 智能向量生成（检查缓存、数据库、版本）
 *
 * 使用方法：
 * const VectorDeduplicator = require('./vector-deduplicator');
 * const deduplicator = new VectorDeduplicator(db, openaiApiKey);
 * const duplicates = await deduplicator.findDuplicates(memories);
 *
 * 版本历史：
 * v1.0.0 - 基础实现（向量生成、相似度计算、重复检测）
 * v2.0.0 - 向量持久化（数据库存储、智能生成、版本控制）
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  similarityThreshold: 0.95,    // 相似度阈值 > 0.95 视为重复
  batchSize: 10,                // 批量处理大小（避免超过 API 限制）
  model: 'text-embedding-3-small',  // OpenAI 模型
  dimensions: 1536,             // 向量维度
  cacheEnabled: true,           // 是否启用缓存
  usePersistence: true          // 是否使用向量持久化
};

/**
 * 向量去重器类
 */
class VectorDeduplicator {
  constructor(db, openaiApiKey) {
    this.db = db;
    this.openaiApiKey = openaiApiKey;
    this.openai = null;  // 延迟加载 OpenAI 客户端
    this.embeddingCache = new Map();  // 向量缓存
    this.currentVersion = 'v1.0-text-embedding-3-small';  // 当前向量版本
  }

  /**
   * 初始化 OpenAI 客户端
   */
  initOpenAI() {
    if (!this.openai) {
      const OpenAI = require('openai');
      this.openai = new OpenAI({ apiKey: this.openaiApiKey });
    }
  }

  /**
   * 获取当前向量版本
   *
   * @returns {string} 向量版本
   */
  getEmbeddingVersion() {
    return this.currentVersion;
  }

  /**
   * 计算内容的哈希值
   *
   * @param {string} content - 内容
   * @returns {string} 哈希值
   */
  getContentHash(content) {
    return require('crypto')
      .createHash('md5')
      .update(content)
      .digest('hex');
  }

  /**
   * 检查向量是否需要更新
   *
   * @param {number} memoryId - 记忆 ID
   * @param {string} content - 内容
   * @returns {Object} { needsUpdate: boolean, storedEmbedding: number[] | null, storedVersion: string | null }
   */
  checkEmbeddingUpdateNeeded(memoryId, content) {
    if (!CONFIG.usePersistence) {
      return { needsUpdate: true, storedEmbedding: null, storedVersion: null };
    }

    // 查询数据库中的向量
    const stored = this.db.prepare(`
      SELECT c.embedding, m.embedding_version
      FROM content c
      JOIN metadata m ON c.metadata_id = m.id
      WHERE c.metadata_id = ?
    `).get(memoryId);

    if (!stored || !stored.embedding) {
      // 没有存储的向量，需要生成
      return { needsUpdate: true, storedEmbedding: null, storedVersion: null };
    }

    if (!stored.embedding_version || stored.embedding_version !== this.currentVersion) {
      // 向量版本不匹配，需要更新
      return {
        needsUpdate: true,
        storedEmbedding: JSON.parse(stored.embedding),
        storedVersion: stored.embedding_version
      };
    }

    // 向量版本匹配，不需要更新
    return {
      needsUpdate: false,
      storedEmbedding: JSON.parse(stored.embedding),
      storedVersion: stored.embedding_version
    };
  }

  /**
   * 智能生成向量（带缓存和持久化）
   *
   * @param {number} memoryId - 记忆 ID
   * @param {string} content - 记忆内容
   * @returns {Promise<number[]>} 向量数组
   */
  async generateEmbeddingSmart(memoryId, content) {
    const contentHash = this.getContentHash(content);

    // 1. 检查内存缓存
    if (CONFIG.cacheEnabled && this.embeddingCache.has(contentHash)) {
      return this.embeddingCache.get(contentHash);
    }

    // 2. 检查数据库中的向量
    if (CONFIG.usePersistence) {
      const checkResult = this.checkEmbeddingUpdateNeeded(memoryId, content);

      if (!checkResult.needsUpdate && checkResult.storedEmbedding) {
        // 向量版本匹配，直接返回存储的向量
        if (CONFIG.cacheEnabled) {
          this.embeddingCache.set(contentHash, checkResult.storedEmbedding);
        }
        return checkResult.storedEmbedding;
      }
    }

    // 3. 调用 OpenAI API 生成新向量
    this.initOpenAI();
    const response = await this.openai.embeddings.create({
      model: CONFIG.model,
      input: content,
      dimensions: CONFIG.dimensions
    });

    const embedding = response.data[0].embedding;

    // 4. 存储到内存缓存
    if (CONFIG.cacheEnabled) {
      this.embeddingCache.set(contentHash, embedding);
    }

    // 5. 存储到数据库
    if (CONFIG.usePersistence) {
      this.saveEmbedding(memoryId, embedding);
    }

    return embedding;
  }

  /**
   * 生成内容向量（兼容旧接口，内部使用 generateEmbeddingSmart）
   *
   * @param {number|string} memoryIdOrContent - 记忆 ID 或内容
   * @param {string} content - 记忆内容（如果第一个参数是 ID）
   * @returns {Promise<number[]>} 向量数组
   */
  async generateEmbedding(memoryIdOrContent, content) {
    // 兼容旧接口：如果第一个参数是字符串，则视为内容
    if (typeof memoryIdOrContent === 'string') {
      const tempContent = memoryIdOrContent;
      const contentHash = this.getContentHash(tempContent);

      // 检查内存缓存
      if (CONFIG.cacheEnabled && this.embeddingCache.has(contentHash)) {
        return this.embeddingCache.get(contentHash);
      }

      // 调用 OpenAI API
      this.initOpenAI();
      const response = await this.openai.embeddings.create({
        model: CONFIG.model,
        input: tempContent,
        dimensions: CONFIG.dimensions
      });

      const embedding = response.data[0].embedding;

      // 存入缓存
      if (CONFIG.cacheEnabled) {
        this.embeddingCache.set(contentHash, embedding);
      }

      return embedding;
    }

    // 新接口：第一个参数是 ID，第二个参数是内容
    return this.generateEmbeddingSmart(memoryIdOrContent, content);
  }

  /**
   * 批量生成向量
   *
   * @param {Array} memories - 记忆数组
   * @returns {Promise<Array>} 带有向量的记忆数组
   */
  async generateEmbeddingsBatch(memories) {
    const results = [];

    for (let i = 0; i < memories.length; i += CONFIG.batchSize) {
      const batch = memories.slice(i, i + CONFIG.batchSize);

      for (const memory of batch) {
        try {
          const embedding = await this.generateEmbedding(memory.id, memory.content);
          results.push({ ...memory, embedding });
        } catch (error) {
          console.error(`生成向量失败 [${memory.id}]:`, error.message);
          results.push({ ...memory, embedding: null, error: error.message });
        }
      }
    }

    return results;
  }

  /**
   * 计算余弦相似度
   *
   * @param {number[]} vecA - 向量 A
   * @param {number[]} vecB - 向量 B
   * @returns {number} 相似度 (0-1)
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * 查找相似记忆
   *
   * @param {number[]} targetEmbedding - 目标向量
   * @param {Array} memories - 记忆数组（已带向量）
   * @param {number} threshold - 相似度阈值
   * @returns {Array} 相似记忆列表
   */
  findSimilarMemories(targetEmbedding, memories, threshold = CONFIG.similarityThreshold) {
    const similar = [];

    for (const memory of memories) {
      if (!memory.embedding) continue;

      const similarity = this.cosineSimilarity(targetEmbedding, memory.embedding);

      if (similarity > threshold) {
        similar.push({
          ...memory,
          similarity
        });
      }
    }

    // 按相似度降序排序
    return similar.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * 查找重复记忆（基于向量相似度）
   *
   * @param {Array} memories - 记忆数组
   * @returns {Promise<Array>} 重复记忆列表
   */
  async findDuplicates(memories) {
    console.log('🧠 向量去重分析中...');

    // 检查 API Key
    if (!this.openaiApiKey) {
      console.warn('⚠️  未配置 OpenAI API Key，跳过向量去重');
      return [];
    }

    // 批量生成向量
    console.log(`📊 正在为 ${memories.length} 条记忆生成向量...`);
    const startTime = Date.now();

    const memoriesWithEmbeddings = await this.generateEmbeddingsBatch(memories);
    const validMemories = memoriesWithEmbeddings.filter(m => m.embedding && !m.error);

    const elapsed = Date.now() - startTime;
    console.log(`✅ 成功生成 ${validMemories.length} 条向量，${memoriesWithEmbeddings.length - validMemories.length} 条失败`);
    console.log(`⏱️  耗时: ${(elapsed / 1000).toFixed(2)} 秒`);

    // 查找重复
    const duplicates = [];
    const processedIds = new Set();

    for (let i = 0; i < validMemories.length; i++) {
      const memoryA = validMemories[i];

      if (processedIds.has(memoryA.id)) {
        continue;
      }

      // 查找相似记忆（排除自己）
      const similar = this.findSimilarMemories(
        memoryA.embedding,
        validMemories.filter(m => m.id !== memoryA.id),
        CONFIG.similarityThreshold
      );

      if (similar.length > 0) {
        duplicates.push({
          original: memoryA,
          similar: similar,
          duplicateCount: similar.length
        });

        // 标记所有相似记忆为已处理
        processedIds.add(memoryA.id);
        similar.forEach(m => processedIds.add(m.id));
      }
    }

    console.log(`🔍 发现 ${duplicates.length} 组语义重复记忆`);

    return duplicates;
  }

  /**
   * 存储向量到数据库
   *
   * @param {number} memoryId - 记忆 ID
   * @param {number[]} embedding - 向量
   */
  saveEmbedding(memoryId, embedding) {
    const embeddingJson = JSON.stringify(embedding);

    // 更新 content 表的 embedding 字段
    this.db.prepare(`
      UPDATE content
      SET embedding = ?
      WHERE metadata_id = ?
    `).run(embeddingJson, memoryId);

    // 更新 metadata 表的 embedding_version 字段
    this.db.prepare(`
      UPDATE metadata
      SET embedding_version = ?
      WHERE id = ?
    `).run(this.currentVersion, memoryId);
  }

  /**
   * 批量存储向量到数据库
   *
   * @param {Array} memories - 记忆数组（已带向量）
   */
  saveEmbeddingsBatch(memories) {
    let saved = 0;
    let failed = 0;

    for (const memory of memories) {
      if (!memory.embedding) {
        failed++;
        continue;
      }

      try {
        this.saveEmbedding(memory.id, memory.embedding);
        saved++;
      } catch (error) {
        console.error(`存储向量失败 [${memory.id}]:`, error.message);
        failed++;
      }
    }

    console.log(`💾 存储 ${saved} 条向量，${failed} 条失败`);

    return { saved, failed };
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.embeddingCache.clear();
  }

  /**
   * 获取缓存统计信息
   *
   * @returns {Object} 缓存统计
   */
  getCacheStats() {
    return {
      size: this.embeddingCache.size,
      enabled: CONFIG.cacheEnabled,
      usePersistence: CONFIG.usePersistence
    };
  }
}

module.exports = { VectorDeduplicator, CONFIG };
