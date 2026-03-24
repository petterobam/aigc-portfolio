#!/usr/bin/env node

/**
 * 向量去重器 (v1.0.0)
 *
 * 功能：
 * 1. 生成内容向量（使用 OpenAI Embeddings）
 * 2. 计算余弦相似度
 * 3. 查找相似记忆（相似度 > 阈值）
 * 4. 集成到优化流程
 *
 * 使用方法：
 * const VectorDeduplicator = require('./vector-deduplicator');
 * const deduplicator = new VectorDeduplicator(db, openaiApiKey);
 * const duplicates = await deduplicator.findDuplicates(memories);
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  similarityThreshold: 0.95,    // 相似度阈值 > 0.95 视为重复
  batchSize: 10,                // 批量处理大小（避免超过 API 限制）
  model: 'text-embedding-3-small',  // OpenAI 模型
  dimensions: 1536,             // 向量维度
  cacheEnabled: true            // 是否启用缓存
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
   * 生成内容向量
   *
   * @param {string} content - 记忆内容
   * @returns {Promise<number[]>} 向量数组
   */
  async generateEmbedding(content) {
    // 检查缓存
    const contentHash = require('crypto')
      .createHash('md5')
      .update(content)
      .digest('hex');

    if (CONFIG.cacheEnabled && this.embeddingCache.has(contentHash)) {
      return this.embeddingCache.get(contentHash);
    }

    // 调用 OpenAI API
    this.initOpenAI();
    const response = await this.openai.embeddings.create({
      model: CONFIG.model,
      input: content,
      dimensions: CONFIG.dimensions
    });

    const embedding = response.data[0].embedding;

    // 存入缓存
    if (CONFIG.cacheEnabled) {
      this.embeddingCache.set(contentHash, embedding);
    }

    return embedding;
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
          const embedding = await this.generateEmbedding(memory.content);
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
    const memoriesWithEmbeddings = await this.generateEmbeddingsBatch(memories);
    const validMemories = memoriesWithEmbeddings.filter(m => m.embedding && !m.error);

    console.log(`✅ 成功生成 ${validMemories.length} 条向量，${memoriesWithEmbeddings.length - validMemories.length} 条失败`);

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
   * 存储向量到数据库（可选）
   *
   * @param {number} memoryId - 记忆 ID
   * @param {number[]} embedding - 向量
   */
  saveEmbedding(memoryId, embedding) {
    const embeddingJson = JSON.stringify(embedding);
    this.db.prepare(`
      UPDATE content
      SET embedding = ?
      WHERE metadata_id = ?
    `).run(embeddingJson, memoryId);
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
}

module.exports = { VectorDeduplicator, CONFIG };
