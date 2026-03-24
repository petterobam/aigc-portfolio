# 配置 OPENAI_API_KEY - 启用向量去重功能

## 概述

记忆优化器的向量去重功能（Phase 1）已完成开发，但需要配置 OpenAI API Key 才能启用。向量去重可以识别语义重复的记忆，提升记忆库质量。

## 前置条件

1. 拥有 OpenAI 账户
2. 有效的 API Key（需要在 OpenAI Platform 创建）

## 配置步骤

### 步骤 1：获取 API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 登录或注册 OpenAI 账户
3. 点击 "Create new secret key"
4. 复制生成的 API Key（只显示一次，请妥善保存）

### 步骤 2：创建 .env 文件

在 `~/.openclaw/workspace/skills/memory-optimizer/` 目录下创建 `.env` 文件：

```bash
cd ~/.openclaw/workspace/skills/memory-optimizer
cp .env.example .env
```

### 步骤 3：配置 API Key

编辑 `.env` 文件，将 `your-openai-api-key-here` 替换为你的真实 API Key：

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**注意**：
- 不要将 `.env` 文件提交到版本控制系统（已添加到 .gitignore）
- API Key 应该保密，不要分享给他人
- 如果泄露，可以立即在 OpenAI Platform 删除并重新创建

### 步骤 4：验证配置

运行优化脚本，验证向量去重是否启用：

```bash
cd ~/.openclaw/workspace/skills/memory-optimizer
node scripts/optimize.js
```

如果配置成功，你应该看到：
- 没有警告 "⚠️ 向量去重已启用但未配置 OPENAI_API_KEY"
- 输出包含 "🔍 识别语义重复记忆（向量）..."
- 检测到语义重复记忆（如果有）

## 费用说明

OpenAI Embeddings API 的使用费用：
- **模型**: text-embedding-3-small（推荐）
- **价格**: $0.02 / 1M tokens
- **估算**: 假设平均每条记忆 1000 tokens，15 条记忆的费用约为 $0.0003

**注意**：
- 记忆优化器会缓存向量，避免重复调用 API
- 只对新记忆进行向量化，不重复处理已处理过的记忆
- 总体费用极低，可以忽略不计

## 高级配置（可选）

### 调整相似度阈值

编辑 `.env` 文件，添加以下配置：

```env
# 向量相似度阈值（0.0-1.0，越高越严格）
VECTOR_SIMILARITY_THRESHOLD=0.95

# 是否将向量存储到数据库（提升性能）
VECTOR_SAVE_TO_DB=false
```

### 向量相似度阈值说明

- **0.90-0.95**: 宽松模式，可能误判不相似的记忆为重复
- **0.95-0.97**: 推荐值，平衡精度和召回率
- **0.97-1.00**: 严格模式，只识别高度相似的记忆

## 故障排查

### 问题 1：仍然显示警告 "未配置 OPENAI_API_KEY"

**原因**：环境变量未正确加载

**解决方法**：
1. 检查 `.env` 文件路径是否正确
2. 确认 `.env` 文件中有 `OPENAI_API_KEY=` 这一行
3. 确认 API Key 格式正确（以 `sk-` 开头）

### 问题 2：API 调用失败

**原因**：API Key 无效或账户余额不足

**解决方法**：
1. 确认 API Key 有效（未过期或被删除）
2. 检查 OpenAI 账户余额（需要充值）
3. 查看 OpenAI Platform 的 Usage 页面，确认 API 调用是否成功

### 问题 3：没有检测到语义重复记忆

**原因**：
- 记忆数量少（当前只有 15 条）
- 记忆之间语义差异较大
- 相似度阈值设置过高

**解决方法**：
1. 降低 `VECTOR_SIMILARITY_THRESHOLD` 到 0.90
2. 等待记忆数量增加，再次运行
3. 手动检查记忆内容，确认是否有语义重复

## 下一步

配置完成后，向量去重功能将自动启用。下次心跳时会：
1. 为所有记忆生成向量（首次运行）
2. 识别语义重复记忆
3. 在优化报告中显示检测到的重复记忆
4. 根据配置自动处理重复记忆（归档或删除）

## 相关文档

- [向量去重技术调研](./vector-deduplication-research.md)
- [向量去重使用指南](./vector-deduplication-usage.md)
- [记忆系统设计](./memory-system-design.md)

---

**维护者**: 记忆优化器
**创建时间**: 2026-03-21 21:15
**最后更新**: 2026-03-21 21:15
