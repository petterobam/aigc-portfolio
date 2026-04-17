#!/usr/bin/env node

/**
 * Ollama 向量去重器 (v1.0.0)
 *
 * 功能：
 * 1. 使用 Ollama 生成内容向量
 * 2. 计算余弦相似度
 * 3. 查找相似记忆（相似度 > 阈值）
 * 4. 集成到优化流程
 * 5. 向量持久化（存储到数据库）
 * 6. 智能向量生成（检查缓存、数据库、版本）
 *
 * 使用方法：
 * const OllamaEmbeddings = require('./ollama-embeddings');
 * const ollama = new OllamaEmbeddings(db, config);
 * const duplicates = await ollama.findDuplicates(memories);
 *
 * 配置：
 * - OLLAMA_MODEL: Ollama 模型名称（默认 gemma:2b）
 * - OLLAMA_API_URL: Ollama API 地址（默认 http://localhost:11434）
 * - similarityThreshold: 相似度阈值（默认 0.95）
 * - batchSize: 批量处理大小（默认 10）
 *
 * 版本历史：
 * v1.0.0 - 基础实现（Ollama API、向量生成、相似度计算、重复检测、向量持久化）
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// 默认配置
const DEFAULT_CONFIG = {
  similarityThreshold: 0.95,    // 相似度阈值 > 0.95 视为重复
  batchSize: 10,                // 批量处理大小
  model: 'gemma:2b',            // Ollama 模型
  apiUrl: 'http://localhost:11434',  // Ollama API 地址
  dimensions: 2048,            // 向量维度（gemma:2b 实测维度）
  cacheEnabled: true,           // 是否启用缓存
  usePersistence: true,         // 是否使用向量持久化
  maxContentLength: 20000,      // 最大内容长度（从 10000 增加到 20000，彻底解决长文本截断问题）
  preferSummary: true          // 优先使用 summary 字段生成向量
};

/**
 * Ollama 向量去重器类
 */
class OllamaEmbeddings {
  constructor(db, config = {}) {
    this.db = db;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.embeddingCache = new Map();  // 向量缓存
    this.currentVersion = `v1.0-${this.config.model}`;  // 当前向量版本
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
    if (!this.config.usePersistence) {
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
   * 调用 Ollama API 生成向量
   *
   * @param {string} content - 内容
   * @returns {Promise<number[]>} 向量数组
   */
  async generateEmbeddingFromOllama(content) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        model: this.config.model,
        prompt: content
      });

      const options = {
        hostname: 'localhost',
        port: 11434,
        path: '/api/embeddings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);

            if (response.error) {
              reject(new Error(`Ollama API 错误: ${response.error}`));
              return;
            }

            if (!response.embedding) {
              reject(new Error('Ollama API 返回数据格式错误: 缺少 embedding 字段'));
              return;
            }

            resolve(response.embedding);
          } catch (error) {
            reject(new Error(`解析 Ollama API 响应失败: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Ollama API 请求失败: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * 准备用于生成向量的内容
   * 优先使用 summary，如果没有则使用 content（截断到最大长度）
   *
   * @param {Object} memory - 记忆对象
   * @returns {string} 用于生成向量的内容
   */
  prepareContentForEmbedding(memory) {
    // 优先使用 summary
    if (this.config.preferSummary && memory.summary && memory.summary.trim()) {
      console.log(`  ℹ️  使用 summary 字段生成向量 [${memory.id}] (${memory.summary.length} 字符)`);
      return memory.summary.trim();
    }

    // 使用 content，但截断到最大长度
    let content = memory.content || '';
    if (content.length > this.config.maxContentLength) {
      console.log(`  ℹ️  截断 content 字段生成向量 [${memory.id}] (${content.length} → ${this.config.maxContentLength} 字符)`);
      content = content.substring(0, this.config.maxContentLength);
    }

    return content;
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
    if (this.config.cacheEnabled && this.embeddingCache.has(contentHash)) {
      return this.embeddingCache.get(contentHash);
    }

    // 2. 检查数据库中的向量
    if (this.config.usePersistence) {
      const checkResult = this.checkEmbeddingUpdateNeeded(memoryId, content);

      if (!checkResult.needsUpdate && checkResult.storedEmbedding) {
        // 向量版本匹配，直接返回存储的向量
        if (this.config.cacheEnabled) {
          this.embeddingCache.set(contentHash, checkResult.storedEmbedding);
        }
        return checkResult.storedEmbedding;
      }
    }

    // 3. 调用 Ollama API 生成新向量
    console.log(`🔄 生成向量 [${memoryId}]... (使用 Ollama: ${this.config.model})`);
    const embedding = await this.generateEmbeddingFromOllama(content);
    console.log(`✅ 向量生成完成 [${memoryId}] (维度: ${embedding.length})`);

    // 4. 存储到内存缓存
    if (this.config.cacheEnabled) {
      this.embeddingCache.set(contentHash, embedding);
    }

    // 5. 存储到数据库
    if (this.config.usePersistence) {
      this.saveEmbedding(memoryId, embedding);
    }

    return embedding;
  }

  /**
   * 为记忆生成向量（带智能内容处理）
   *
   * @param {Object} memory - 记忆对象（必须包含 id, content, summary）
   * @returns {Promise<number[]>} 向量数组
   */
  async generateEmbeddingForMemory(memory) {
    const { id } = memory;

    // 准备用于生成向量的内容（优先使用 summary，截断长内容）
    const preparedContent = this.prepareContentForEmbedding(memory);

    // 生成向量（复用现有逻辑）
    return this.generateEmbeddingSmart(id, preparedContent);
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
      if (this.config.cacheEnabled && this.embeddingCache.has(contentHash)) {
        return this.embeddingCache.get(contentHash);
      }

      // 调用 Ollama API
      console.log(`🔄 生成向量... (使用 Ollama: ${this.config.model})`);
      const embedding = await this.generateEmbeddingFromOllama(tempContent);
      console.log(`✅ 向量生成完成 (维度: ${embedding.length})`);

      // 存入缓存
      if (this.config.cacheEnabled) {
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

    for (let i = 0; i < memories.length; i += this.config.batchSize) {
      const batch = memories.slice(i, i + this.config.batchSize);

      console.log(`📦 处理批量向量 [${i + 1}-${i + batch.length}/${memories.length}]...`);

      for (const memory of batch) {
        try {
          const embedding = await this.generateEmbeddingForMemory(memory);
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

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 查找相似记忆
   *
   * @param {number[]} embedding - 目标向量
   * @param {Array} memories - 记忆数组（带向量）
   * @param {number} threshold - 相似度阈值
   * @returns {Array} 相似记忆数组（按相似度降序）
   */
  findSimilarMemories(embedding, memories, threshold = this.config.similarityThreshold) {
    const similar = [];

    for (const memory of memories) {
      if (!memory.embedding) {
        continue;
      }

      const similarity = this.cosineSimilarity(embedding, memory.embedding);

      if (similarity >= threshold) {
        similar.push({
          ...memory,
          similarity
        });
      }
    }

    // 按相似度降序排序
    similar.sort((a, b) => b.similarity - a.similarity);

    return similar;
  }

  /**
   * 查找重复记忆
   *
   * @param {Array} memories - 记忆数组
   * @returns {Promise<Array>} 重复记忆数组
   */
  async findDuplicates(memories) {
    console.log(`\n🔍 查找重复记忆... (Ollama: ${this.config.model})`);

    const duplicates = [];

    // 生成所有记忆的向量
    const memoriesWithEmbeddings = await this.generateEmbeddingsBatch(memories);

    // 两两比较相似度
    for (let i = 0; i < memoriesWithEmbeddings.length; i++) {
      const memoryA = memoriesWithEmbeddings[i];

      if (!memoryA.embedding || memoryA.embedding === 'skip') {
        continue;
      }

      for (let j = i + 1; j < memoriesWithEmbeddings.length; j++) {
        const memoryB = memoriesWithEmbeddings[j];

        if (!memoryB.embedding || memoryB.embedding === 'skip') {
          continue;
        }

        const similarity = this.cosineSimilarity(memoryA.embedding, memoryB.embedding);

        if (similarity >= this.config.similarityThreshold) {
          console.log(`⚠️  发现重复: [${memoryA.id}] vs [${memoryB.id}] (相似度: ${(similarity * 100).toFixed(2)}%)`);

          duplicates.push({
            memoryA: {
              id: memoryA.id,
              title: memoryA.title,
              content: memoryA.content,
              summary: memoryA.summary
            },
            memoryB: {
              id: memoryB.id,
              title: memoryB.title,
              content: memoryB.content,
              summary: memoryB.summary
            },
            similarity
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * 保存向量到数据库
   *
   * @param {number} memoryId - 记忆 ID
   * @param {number[]} embedding - 向量数组
   */
  saveEmbedding(memoryId, embedding) {
    try {
      // 保存向量到 content 表
      this.db.prepare(`
        UPDATE content
        SET embedding = ?
        WHERE metadata_id = ?
      `).run(JSON.stringify(embedding), memoryId);

      // 更新 metadata 表的向量版本
      this.db.prepare(`
        UPDATE metadata
        SET embedding_version = ?
        WHERE id = ?
      `).run(this.currentVersion, memoryId);

      console.log(`💾 向量已保存到数据库 [${memoryId}]`);
    } catch (error) {
      console.error(`保存向量失败 [${memoryId}]:`, error.message);
    }
  }

  /**
   * 检查 Ollama 服务是否可用
   *
   * @returns {Promise<boolean>} 是否可用
   */
  async checkOllamaService() {
    return new Promise((resolve) => {
      const req = http.get(`${this.config.apiUrl}/api/tags`, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response.models && response.models.length > 0);
          } catch (error) {
            resolve(false);
          }
        });
      });

      req.on('error', () => {
        resolve(false);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * 获取可用模型列表
   *
   * @returns {Promise<Array>} 模型数组
   */
  async getAvailableModels() {
    return new Promise((resolve) => {
      const req = http.get(`${this.config.apiUrl}/api/tags`, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response.models || []);
          } catch (error) {
            resolve([]);
          }
        });
      });

      req.on('error', () => {
        resolve([]);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve([]);
      });
    });
  }
}

module.exports = OllamaEmbeddings;
