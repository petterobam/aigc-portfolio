# OpenAI API 配置指南

## 概述

记忆优化器的向量去重功能需要 OpenAI API Key 才能运行。向量去重可以识别语义重复的记忆，提升记忆库质量。

## 配置步骤

### 1. 获取 OpenAI API Key

1. 访问 [OpenAI Platform](https://platform.openai.com)
2. 登录或注册账号
3. 进入 [API Keys 页面](https://platform.openai.com/api-keys)
4. 点击 "Create new secret key"
5. 复制生成的 API Key（格式：`sk-...`）

**注意**：
- API Key 只会显示一次，请妥善保存
- 建议为不同项目创建不同的 API Key
- 可以在 Settings 中设置使用限额，避免超额扣费

### 2. 创建 .env 文件

在 `memory-optimizer` 目录下创建 `.env` 文件：

```bash
cd ~/.openclaw/workspace/skills/memory-optimizer
cp .env.example .env
```

### 3. 填入 API Key

编辑 `.env` 文件，填入你的 API Key：

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 4. 验证配置

运行优化脚本，验证配置是否生效：

```bash
cd ~/.openclaw/workspace/skills/memory-optimizer
node scripts/optimize.js
```

如果看到以下输出，说明配置成功：
```
[向量去重] 开始语义去重（12 条记忆）...
[向量去重] 生成向量进度: 100% (12/12)
[向量去重] 查找重复记忆... 完成
[向量去重] 发现 0 组语义重复记忆
```

如果看到以下警告，说明配置失败：
```
⚠️ 向量去重已启用但未配置 OPENAI_API_KEY，跳过向量去重
```

## 费用说明

向量去重使用的是 `text-embedding-3-small` 模型，费用非常低：

- **价格**：$0.02 / 1M tokens（输入）
- **单次调用**：生成一条记忆的向量约 0.000001-0.00001 美元
- **示例**：优化 100 条记忆，费用约 $0.001-0.01（1-10 美分）

**建议**：
- 设置使用限额（Settings → Usage limits）
- 定期查看账单（Settings → Billing）
- 开启用量提醒（Settings → Email alerts）

## 安全注意事项

1. **保护 API Key**：
   - 不要将 `.env` 文件提交到版本控制系统
   - 不要在公开场合分享 API Key
   - 定期轮换 API Key（特别是怀疑泄露时）

2. **使用限额**：
   - 设置月度限额（例如 $5 或 $10）
   - 避免意外超支

3. **访问控制**：
   - 为 API Key 设置权限（只读、特定模型等）
   - 不同项目使用不同的 API Key

## 故障排查

### 问题 1：找不到 .env 文件

**错误信息**：
```
⚠️ 向量去重已启用但未配置 OPENAI_API_KEY，跳过向量去重
```

**解决方案**：
1. 检查 `.env` 文件是否存在于 `memory-optimizer` 目录
2. 确保 API Key 格式正确（以 `sk-` 开头）
3. 重启终端或重新加载环境变量

### 问题 2：API Key 无效

**错误信息**：
```
Error: Incorrect API key provided
```

**解决方案**：
1. 检查 API Key 是否正确复制
2. 确认 API Key 未被删除或过期
3. 尝试创建新的 API Key

### 问题 3：额度不足

**错误信息**：
```
Error: You exceeded your current quota
```

**解决方案**：
1. 检查账户余额（Settings → Billing）
2. 充值或增加额度
3. 设置使用限额，避免超额

### 问题 4：网络问题

**错误信息**：
```
Error: Connection refused / timeout
```

**解决方案**：
1. 检查网络连接
2. 确认代理设置（如果使用代理）
3. 尝试使用 VPN 或更换网络

## 高级配置

### 修改相似度阈值

编辑 `scripts/optimize.js`，修改配置：

```javascript
const CONFIG = {
  // ...
  vectorSimilarityThreshold: 0.95,  // 降低阈值可以检测更多相似记忆
  // ...
};
```

**说明**：
- 0.95：严格匹配，只检测高度相似的记忆
- 0.90：中等匹配，检测更多相似记忆
- 0.85：宽松匹配，检测所有可能相似的记忆

**建议**：
- 初次使用建议设置为 0.95
- 根据实际效果逐步降低
- 避免设置过低（<0.80），可能误判

### 禁用向量去重

如果暂时不需要向量去重，可以在 `scripts/optimize.js` 中禁用：

```javascript
const CONFIG = {
  enableVectorDedup: false,  // 禁用向量去重
  // ...
};
```

### 向量存储到数据库

启用向量存储可以避免重复生成向量，提升性能：

```javascript
const CONFIG = {
  // ...
  vectorSaveToDB: true,  // 启用向量存储
  // ...
};
```

**说明**：
- 需要在数据库中创建 `embedding_vector` 列（BLOB 类型）
- 首次运行会生成并存储所有记忆的向量
- 后续运行会复用已存储的向量

## 替代方案

如果不想使用 OpenAI API，可以考虑以下替代方案：

### 1. 使用免费向量模型

- **Hugging Face**：下载开源模型（如 sentence-transformers）
- **Ollama**：本地运行 LLM 和向量模型
- **缺点**：需要额外配置，性能可能不如 OpenAI

### 2. 使用哈希去重

- 基于内容哈希（MD5/SHA256）
- 只能检测完全重复的记忆
- 优点：无需 API Key，速度快
- 缺点：无法检测语义重复

### 3. 使用关键词匹配

- 基于 TF-IDF 或 TextRank
- 检测关键词相似的记忆
- 优点：无需 API Key，可解释性强
- 缺点：准确性不如向量模型

## 相关文档

- [向量去重技术调研](./vector-deduplication-research.md)
- [向量去重使用指南](./vector-deduplication-usage.md)
- [记忆系统设计文档](./memory-system-design.md)

## 反馈与支持

如果遇到问题或需要帮助，请：

1. 查看本文档的故障排查部分
2. 查看执行日志（`logs/latest.md`）
3. 查看系统状态（`state/current-state.md`）
4. 提交 Issue 或联系维护者

---

**维护者**：记忆优化器
**版本**：v1.0.0
**最后更新**：2026-03-21
