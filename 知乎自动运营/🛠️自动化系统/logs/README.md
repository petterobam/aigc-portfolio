# 日志目录

> 存放知乎自动化系统的运行日志

---

## 📁 目录结构

```
logs/
├── app.log                     应用日志
├── error.log                   错误日志
└── （其他日志文件）
```

---

## 📝 日志文件说明

### 1. 应用日志 (app.log)

**用途**: 记录系统的正常运行信息

**内容**:
- 脚本启动信息
- 操作执行记录
- 状态变更记录
- 性能指标记录

**日志格式**:
```
[2026-03-28 22:00:00] [INFO] Script started: check-zhihu-login.js
[2026-03-28 22:00:01] [INFO] Browser launched
[2026-03-28 22:00:02] [INFO] Navigating to zhihu.com
[2026-03-28 22:00:05] [INFO] Login status checked: logged in
[2026-03-28 22:00:06] [INFO] Script completed successfully
```

**日志级别**:
- `INFO`: 一般信息
- `WARN`: 警告信息
- `ERROR`: 错误信息
- `DEBUG`: 调试信息

---

### 2. 错误日志 (error.log)

**用途**: 记录系统运行中的错误

**内容**:
- 错误堆栈信息
- 错误上下文
- 错误时间戳

**日志格式**:
```
[2026-03-28 22:00:00] [ERROR] Cookie file not found
Stack: Error: Cookie file not found
    at CookieManager.loadCookies (/path/to/cookie-manager.js:10:15)
    at main (/path/to/check-zhihu-login.js:20:10)
```

---

## 🔍 日志查看

### 实时查看日志

```bash
# 查看应用日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log

# 查看所有日志
tail -f logs/*.log
```

### 搜索日志

```bash
# 搜索特定关键词
grep "ERROR" logs/app.log

# 搜索特定时间段
grep "2026-03-28 22:" logs/app.log

# 搜索错误堆栈
grep -A 10 "Stack:" logs/error.log
```

### 日志统计

```bash
# 统计错误数量
grep "ERROR" logs/app.log | wc -l

# 统计警告数量
grep "WARN" logs/app.log | wc -l

# 统计各脚本的执行次数
grep "Script started:" logs/app.log | awk '{print $NF}' | sort | uniq -c
```

---

## 🧹 日志管理

### 日志轮转

**问题**: 日志文件会不断增长

**解决方案**: 使用 logrotate 工具

**配置示例** (`/etc/logrotate.d/zhihu-auto`):
```
~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 644 oyjie staff
}
```

**说明**:
- `daily`: 每天轮转
- `rotate 7`: 保留 7 天
- `compress`: 压缩旧日志
- `missingok`: 文件不存在时不报错
- `notifempty`: 空文件不轮转
- `create 644`: 创建新文件，权限 644

---

### 手动清理

**清理旧日志**:
```bash
# 清理 7 天前的日志
find logs/ -name "*.log" -mtime +7 -delete

# 清理压缩的日志
find logs/ -name "*.log.gz" -delete
```

**清理空日志**:
```bash
# 清理空日志文件
find logs/ -name "*.log" -size 0 -delete
```

---

### 日志归档

**归档日志**:
```bash
# 归档昨天的日志
mv logs/app.log logs/app-$(date -d yesterday +%Y%m%d).log
mv logs/error.log logs/error-$(date -d yesterday +%Y%m%d).log

# 压缩归档日志
gzip logs/app-$(date -d yesterday +%Y%m%d).log
gzip logs/error-$(date -d yesterday +%Y%m%d).log
```

---

## 🎯 日志分析

### 错误分析

```bash
# 提取所有错误类型
grep "ERROR" logs/app.log | awk -F': ' '{print $2}' | sort | uniq -c | sort -nr

# 分析错误趋势
grep "ERROR" logs/app.log | awk '{print $1}' | cut -d'[' -f1 | sort | uniq -c
```

### 性能分析

```bash
# 提取脚本执行时间
grep "Script completed" logs/app.log | awk '{print $NF}'

# 计算平均执行时间
grep "Script completed" logs/app.log | awk '{print $NF}' | awk '{sum+=$1; count++} END {print sum/count}'
```

### 使用统计

```bash
# 统计各脚本的使用次数
grep "Script started:" logs/app.log | awk '{print $NF}' | sort | uniq -c | sort -nr

# 统计每日执行次数
grep "Script started:" logs/app.log | awk '{print $1}' | cut -d'[' -f1 | sort | uniq -c
```

---

## 🛠️ 日志配置

### 修改日志级别

**修改脚本中的日志配置**:
```javascript
// 创建日志器
const logger = new Logger({
  logFile: 'logs/app.log',
  errorFile: 'logs/error.log',
  level: 'INFO'  // 可选: DEBUG, INFO, WARN, ERROR
});
```

### 修改日志格式

**修改 Logger 类中的格式化方法**:
```javascript
formatMessage(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}\n`;
}
```

---

## ⚠️ 注意事项

1. **日志权限**: 确保 logs/ 目录有写入权限
2. **日志大小**: 定期清理日志，避免占用过多空间
3. **日志敏感信息**: 不要在日志中记录敏感信息（如 Cookie）
4. **日志备份**: 定期备份重要的日志文件

---

## 🔗 相关文档

- [主 README](../README.md) - 自动化系统说明
- [工具脚本说明](../scripts/utils/README.md) - 工具脚本说明
- [日志工具](../scripts/utils/logger.js) - 日志工具实现

---

**创建时间**: 2026-03-28 22:46
**版本**: v1.0
**状态**: ✅ 完成
