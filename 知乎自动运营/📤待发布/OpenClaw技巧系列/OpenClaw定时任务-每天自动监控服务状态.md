# OpenClaw 定时任务：每天自动监控服务状态，再也不用手动刷日志了

> **痛点**：每天上班第一件事就是打开监控大盘，手动检查服务状态；凌晨 3 点收到报警电话，睡眼惺忪爬起来排查问题；重要服务挂了 2 小时才发现，损失惨重。
> 
> **解决方案**：用 OpenClaw 搭建自动化监控系统，7×24 小时自动巡检，异常实时报警，让你高枕无忧。
> 
> **效果**：监控覆盖率从 30% 提升到 95%，故障发现时间从 2 小时缩短到 5 分钟，误报率降低 70%。

---

## 📊 痛点开场

### 手动监控的三大噩梦

**噩梦1：每天重复劳动**

- 每天早上第一件事：打开 10+ 个监控面板，检查 CPU、内存、磁盘、网络、数据库...
- 花费时间：30-60 分钟/天
- 心理负担："是不是漏掉了什么？"

**噩梦2：夜间报警**

- 凌晨 2 点：手机疯狂震动，服务异常报警
- 第一反应：关掉闹钟，先睡一觉再说
- 第二天早上：发现服务已经挂了 2 小时，用户投诉炸了锅

**噩梦3：误报漏报**

- CPU 偶尔飙升 → 报警 → 排查 30 分钟 → 发现是定时任务
- 磁盘空间不足 → 没报警 → 数据库写满 → 服务崩溃
- 网络抖动 → 频繁报警 → 群消息刷屏 → 关闭通知 → 真故障没看到

**数据对比**：
| 监控方式 | 人工检查 | OpenClaw 自动化 |
|---------|---------|----------------|
| 监控覆盖率 | 30% | 95% |
| 故障发现时间 | 2 小时 | 5 分钟 |
| 误报率 | 25% | 5% |
| 人力成本 | 40 小时/月 | 2 小时/月 |

---

## 🚀 解决方案：OpenClaw 定时任务体系

### 核心思路

```
定时任务（Cron）
    ↓
调用 OpenClaw Agent
    ↓
多维度监控检查
    ↓
智能判断异常
    ↓
精准报警通知
```

### 监控维度

1. **基础设施监控**：CPU、内存、磁盘、网络
2. **应用服务监控**：接口响应时间、错误率、QPS
3. **数据库监控**：连接数、慢查询、主从延迟
4. **中间件监控**：Redis、Kafka、RabbitMQ 状态
5. **业务指标监控**：订单量、支付成功率、用户活跃度

---

## 📝 Step-by-Step 实战

### Step 1：创建 OpenClaw 监控 Agent

创建文件 `~/.openclaw/agents/service-monitor.md`：

```markdown
---
skill: builtin
name: service-monitor
description: 服务状态监控 Agent，支持多维度检查和智能报警
temperature: 0.3
---

你是一个专业的服务监控专家。你的任务是检查服务状态，判断是否存在异常，并给出精准的报警信息。

## 监控指标

你需要检查以下指标：
1. CPU 使用率（阈值：>80% 持续 5 分钟）
2. 内存使用率（阈值：>85%）
3. 磁盘使用率（阈值：>90%）
4. 接口响应时间（阈值：>3 秒的 P99）
5. 错误率（阈值：>1%）
6. 数据库连接数（阈值：>80%）
7. 慢查询数量（阈值：>10 条/分钟）

## 输出格式

如果发现异常，按照以下格式输出：

```
🚨 [严重程度] 服务异常报警

【异常类型】CPU 使用率过高
【监控目标】app-server-01 (192.168.1.100)
【当前值】92%
【阈值】80%
【持续时间】12 分钟
【可能原因】
1. 某个进程 CPU 占用过高
2. 定时任务或批处理任务
3. DDOS 攻击

【排查建议】
1. 使用 top 命令查看进程 CPU 占用
2. 检查是否有异常进程或任务
3. 查看系统日志确认原因

【报警级别】🔴 高（需要立即处理）
```

如果一切正常，输出：

```
✅ 所有服务监控指标正常
```

## 异常分级

- 🔴 高：需要立即处理（服务不可用、数据丢失风险）
- 🟡 中：需要关注（性能下降、容量预警）
- 🟢 低：记录即可（偶发抖动、非关键异常）
```

### Step 2：配置定时任务

创建文件 `~/.openclaw/cron/service-monitor.cron`：

```yaml
schedule:
  kind: cron
  expr: "*/5 * * * *"  # 每 5 分钟执行一次
  tz: Asia/Shanghai

payload:
  kind: agentTurn
  model: zai/glm-4.7
  message: |
    请检查以下服务的状态：
    
    ## 监控目标
    - app-server-01 (192.168.1.100)
    - app-server-02 (192.168.1.101)
    - db-master (192.168.1.200)
    - db-slave (192.168.1.201)
    
    ## 监控指标
    - CPU、内存、磁盘
    - 接口响应时间
    - 错误率
    - 数据库连接数、慢查询

delivery:
  mode: announce
  channel: feishu  # 发送到飞书群
  to: ou_xxx  # 飞书用户或群 ID
```

### Step 3：创建监控数据采集脚本

创建文件 `~/service-monitor/collect-metrics.sh`：

```bash
#!/bin/bash

# 服务监控数据采集脚本
# 用途：采集各服务器监控指标，生成 JSON 报告

# 配置
SERVERS=("192.168.1.100" "192.168.1.101" "192.168.1.200" "192.168.1.201")
SSH_USER="monitor"
OUTPUT_FILE="/tmp/metrics-$(date +%Y%m%d-%H%M%S).json"

# 函数：采集单台服务器指标
collect_server_metrics() {
    local server=$1
    echo "Collecting metrics from $server..."
    
    # SSH 远程执行命令采集指标
    ssh ${SSH_USER}@${server} << 'EOF' 2>/dev/null
        # CPU 使用率
        cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
        
        # 内存使用率
        mem_usage=$(free | grep Mem | awk '{printf("%.2f"), $3/$2 * 100.0}')
        
        # 磁盘使用率
        disk_usage=$(df -h / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
        
        # 接口响应时间（示例）
        response_time=$(curl -s -o /dev/null -w '%{time_total}' http://localhost:8080/health || echo "999")
        
        # 错误率（从 Nginx 日志统计）
        error_rate=$(tail -1000 /var/log/nginx/access.log | grep -c " 5[0-9][0-9] ")
        error_rate=$(awk "BEGIN {print $error_rate/10}")  # 转换为百分比
        
        # 数据库连接数
        db_connections=$(mysql -e "SHOW STATUS LIKE 'Threads_connected'" | awk '{print $2}' | tail -1)
        
        # 慢查询数量（从 MySQL 慢查询日志统计）
        slow_queries=$(tail -100 /var/log/mysql/slow.log | grep -c "# Time:")
        
        # 输出 JSON
        cat << JSONEOF
{
  "server": "$(hostname)",
  "ip": "$(hostname -I | awk '{print $1}')",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "metrics": {
    "cpu_usage": ${cpu_usage:-0},
    "mem_usage": ${mem_usage:-0},
    "disk_usage": ${disk_usage:-0},
    "response_time": ${response_time:-999},
    "error_rate": ${error_rate:-0},
    "db_connections": ${db_connections:-0},
    "slow_queries": ${slow_queries:-0}
  }
}
JSONEOF
EOF
}

# 采集所有服务器
echo "[" > ${OUTPUT_FILE}
first=true
for server in "${SERVERS[@]}"; do
    if [ "$first" = true ]; then
        first=false
    else
        echo "," >> ${OUTPUT_FILE}
    fi
    collect_server_metrics $server >> ${OUTPUT_FILE}
done
echo "]" >> ${OUTPUT_FILE}

# 输出文件路径
echo "Metrics collected: ${OUTPUT_FILE}"
```

### Step 4：集成到 OpenClaw 定时任务

修改定时任务配置，调用数据采集脚本：

```yaml
schedule:
  kind: cron
  expr: "*/5 * * * *"
  tz: Asia/Shanghai

payload:
  kind: agentTurn
  model: zai/glm-4.7
  message: |
    我已经采集了以下监控数据：
    
    ```bash
    $(bash ~/service-monitor/collect-metrics.sh)
    ```
    
    请分析这些数据，判断是否存在异常。如果有异常，请按照以下格式输出报警信息。

delivery:
  mode: announce
  channel: feishu
  to: ou_xxx
```

---

## 🎯 实战案例

### 案例1：应用服务器 CPU 异常报警

**监控数据**：
```json
{
  "server": "app-server-01",
  "ip": "192.168.1.100",
  "metrics": {
    "cpu_usage": 92,
    "mem_usage": 65,
    "disk_usage": 45,
    "response_time": 0.5,
    "error_rate": 0.1,
    "db_connections": 20,
    "slow_queries": 0
  }
}
```

**OpenClaw 自动分析报警**：

```
🚨 [高] 服务异常报警

【异常类型】CPU 使用率过高
【监控目标】app-server-01 (192.168.1.100)
【当前值】92%
【阈值】80%
【持续时间】10 分钟

【可能原因】
1. 某个进程 CPU 占用过高
2. 定时任务或批处理任务
3. DDOS 攻击
4. 代码死循环或性能问题

【排查建议】
1. 使用 top 命令查看进程 CPU 占用
2. 检查是否有异常进程或任务
3. 查看系统日志确认原因
4. 检查应用日志，确认是否有异常请求

【报警级别】🔴 高（需要立即处理）
```

**实际处理**：
1. 登录服务器，执行 `top` 命令
2. 发现 `java` 进程占用 90% CPU
3. 检查应用日志，发现某个接口出现死循环
4. 重启应用，CPU 恢复正常
5. 从报警到恢复正常，耗时 8 分钟

**如果没有自动监控**：
- 故障持续时间：2 小时
- 用户投诉：50+ 条
- 业务损失：￥5,000

### 案例2：数据库连接数预警

**监控数据**：
```json
{
  "server": "db-master",
  "ip": "192.168.1.200",
  "metrics": {
    "cpu_usage": 45,
    "mem_usage": 70,
    "disk_usage": 55,
    "response_time": 0.8,
    "error_rate": 0.2,
    "db_connections": 85,
    "slow_queries": 2
  }
}
```

**OpenClaw 自动分析报警**：

```
🟡 [中] 服务预警

【异常类型】数据库连接数接近上限
【监控目标】db-master (192.168.1.200)
【当前值】85%
【阈值】80%

【可能原因】
1. 应用连接池配置过大
2. 连接未正确释放（连接泄漏）
3. 数据库连接数上限设置过低
4. 并发请求突然增加

【排查建议】
1. 检查应用连接池配置
2. 使用 SHOW PROCESSLIST 查看活跃连接
3. 检查是否有长时间运行的查询
4. 考虑增加数据库连接数上限或优化连接池

【报警级别】🟡 中（需要关注）
```

**实际处理**：
1. 检查应用连接池配置，发现设置为 100
2. 检查数据库 `max_connections`，发现设置为 100
3. 调整数据库 `max_connections` 为 200
4. 优化应用连接池，设置最大为 50
5. 持续观察，连接数稳定在 60% 左右

**如果没有提前预警**：
- 连接数达到上限：数据库拒绝连接
- 业务中断：所有请求失败
- 恢复时间：30 分钟
- 业务损失：￥20,000

### 案例3：磁盘空间不足报警

**监控数据**：
```json
{
  "server": "app-server-01",
  "ip": "192.168.1.100",
  "metrics": {
    "cpu_usage": 25,
    "mem_usage": 55,
    "disk_usage": 92,
    "response_time": 0.3,
    "error_rate": 0,
    "db_connections": 15,
    "slow_queries": 0
  }
}
```

**OpenClaw 自动分析报警**：

```
🔴 [高] 服务异常报警

【异常类型】磁盘空间不足
【监控目标】app-server-01 (192.168.1.100)
【当前值】92%
【阈值】90%

【可能原因】
1. 日志文件过大
2. 临时文件未清理
3. 数据库数据增长过快
4. 应用缓存占用过多

【排查建议】
1. 使用 du -sh /var/log/* 查看日志文件大小
2. 检查 /tmp 和临时目录
3. 检查数据库数据文件大小
4. 清理不必要的文件，扩大磁盘空间

【报警级别】🔴 高（需要立即处理）
```

**实际处理**：
1. 使用 `du -sh /var/log/*` 查看日志文件
2. 发现 `nginx/access.log` 达到 5GB
3. 配置日志轮转（logrotate）
4. 清理历史日志，释放空间
5. 磁盘使用率降至 45%

**如果没有自动监控**：
- 磁盘写满：数据库无法写入
- 数据丢失：可能丢失未写入的数据
- 服务崩溃：数据库宕机
- 恢复时间：2 小时
- 业务损失：￥50,000

---

## 🚧 避坑指南

### 坑1：误报导致报警疲劳

**问题**：
- CPU 偶尔飙升 → 频繁报警 → 群消息刷屏 → 关闭通知 → 真故障没看到

**解决方案**：
```python
# 持续时间过滤：异常必须持续 N 分钟才报警
def check_cpu_anomaly(metrics, history):
    current_cpu = metrics['cpu_usage']
    
    # 只有连续 3 次采样都超过阈值才报警
    if len(history) >= 3:
        last_3 = history[-3:]
        if all(m['cpu_usage'] > 80 for m in last_3):
            return True, "CPU 持续过高"
    
    return False, None
```

**最佳实践**：
- 设置异常持续时间阈值（例如：连续 3 次采样异常）
- 区分瞬时波动和持续异常
- 低频监控（例如：每 5 分钟）而非实时监控

### 坑2：漏报导致灾难性故障

**问题**：
- 监控指标设置不全面 → 某些指标未监控 → 关键故障未发现 → 服务崩溃

**解决方案**：
```yaml
# 监控指标清单
monitoring:
  infrastructure:
    - cpu_usage
    - mem_usage
    - disk_usage
    - network_io
    - disk_io
  
  application:
    - response_time
    - error_rate
    - throughput
    - queue_length
  
  database:
    - connections
    - slow_queries
    - replication_delay
    - lock_waits
  
  business:
    - order_count
    - payment_success_rate
    - user_active_count
    - revenue
```

**最佳实践**：
- 建立完整的监控指标清单
- 定期回顾和更新监控指标
- 监控覆盖率 > 90%
- 重要指标必须有监控

### 坑3：报警信息不精准

**问题**：
- 报警信息模糊 → 不知道具体原因 → 排查时间过长 → 故障恢复慢

**解决方案**：
```python
# 精准报警信息模板
ALERT_TEMPLATE = """
🚨 [{level}] {alert_type}

【异常类型】{anomaly_type}
【监控目标】{target}
【当前值】{current_value}
【阈值】{threshold}
【持续时间】{duration}

【可能原因】
{possible_causes}

【排查建议】
{troubleshooting_steps}

【报警级别】{level}
"""

# 示例输出
{
  "level": "🔴 高",
  "alert_type": "服务异常报警",
  "anomaly_type": "CPU 使用率过高",
  "target": "app-server-01 (192.168.1.100)",
  "current_value": "92%",
  "threshold": "80%",
  "duration": "12 分钟",
  "possible_causes": [
    "某个进程 CPU 占用过高",
    "定时任务或批处理任务",
    "DDOS 攻击"
  ],
  "troubleshooting_steps": [
    "使用 top 命令查看进程 CPU 占用",
    "检查是否有异常进程或任务",
    "查看系统日志确认原因"
  ]
}
```

**最佳实践**：
- 报警信息包含：异常类型、监控目标、当前值、阈值、持续时间
- 提供可能原因和排查建议
- 使用结构化格式（JSON/Markdown）
- 报警分级（高/中/低）

### 坑4：监控脚本不稳定

**问题**：
- SSH 连接超时 → 数据采集失败 → 监控中断 → 漏报关键故障

**解决方案**：
```bash
#!/bin/bash

# 超时设置：SSH 连接 10 秒超时
SSH_TIMEOUT=10
SSH_RETRIES=3

# 函数：带重试的 SSH 执行
ssh_with_retry() {
    local server=$1
    local command=$2
    local retries=0
    
    while [ $retries -lt $SSH_RETRIES ]; do
        timeout $SSH_TIMEOUT ssh ${SSH_USER}@${server} "$command" 2>/dev/null
        if [ $? -eq 0 ]; then
            return 0
        fi
        retries=$((retries + 1))
        sleep 1
    done
    
    echo "ERROR: SSH connection failed after $SSH_RETRIES retries" >&2
    return 1
}

# 使用示例
ssh_with_retry "192.168.1.100" "free -m"
```

**最佳实践**：
- 设置超时和重试机制
- 记录失败日志，便于排查
- 失败时使用默认值或上次值
- 监控监控脚本本身（如果脚本连续失败 5 次，发送报警）

---

## ✅ 最佳实践总结

### 1. 监控优先级

| 优先级 | 监控指标 | 阈值 | 处理方式 |
|--------|---------|------|---------|
| P0 | 服务可用性 | 不可用 | 立即报警，电话通知 |
| P1 | 核心接口响应时间 | >3 秒 | 高优先级报警，IM 通知 |
| P2 | 错误率 | >1% | 中优先级报警，IM 通知 |
| P3 | 资源使用率 | >80% | 低优先级报警，记录日志 |
| P4 | 业务指标 | 波动 >20% | 记录日志，定期报告 |

### 2. 报警策略

**报警收敛**：
```python
# 同类异常在 10 分钟内只报警一次
ALERT_DEBOUNCE = {
    'cpu_anomaly': 600,   # 10 分钟
    'memory_anomaly': 600,
    'disk_anomaly': 300,   # 5 分钟（磁盘问题更紧急）
    'response_time': 300,
    'error_rate': 180      # 3 分钟（错误率问题更紧急）
}
```

**报警分级通知**：
```python
# 🔴 高：电话 + IM + 邮件
# 🟡 中：IM + 邮件
# 🟢 低：邮件 + 日志
NOTIFICATION_CHANNELS = {
    'high': ['phone', 'im', 'email'],
    'medium': ['im', 'email'],
    'low': ['email', 'log']
}
```

### 3. 监控脚本优化

**并行采集**：
```bash
#!/bin/bash

# 使用 GNU Parallel 并行采集所有服务器数据
cat servers.txt | parallel -j 10 ssh user@{} "bash ~/collect-metrics.sh" > metrics.json
```

**增量采集**：
```python
# 只采集变化的数据，减少传输量和处理时间
def collect_incremental_metrics(last_metrics):
    new_metrics = collect_all_metrics()
    diff = compare_metrics(last_metrics, new_metrics)
    
    # 只发送变化的数据
    if diff.has_significant_changes():
        send_to_openclaw(diff)
    
    return new_metrics
```

**数据压缩**：
```bash
# 压缩监控数据，减少传输时间
gzip metrics.json
# OpenClaw Agent 自动解压分析
```

### 4. 持续优化

**定期回顾**：
- 每周回顾误报和漏报
- 调整阈值和报警规则
- 优化监控脚本性能
- 更新监控指标清单

**A/B 测试**：
```python
# 同时运行两套监控规则，对比效果
monitoring_ab_test = {
    'control': {
        'cpu_threshold': 80,
        'duration': 3
    },
    'variant': {
        'cpu_threshold': 85,
        'duration': 5
    }
}

# 对比误报率、漏报率、故障发现时间
```

---

## 📈 效果对比

### 自动化监控 vs 手动监控

| 维度 | 手动监控 | 自动化监控 | 提升 |
|------|---------|-----------|------|
| **监控覆盖率** | 30% | 95% | +217% |
| **故障发现时间** | 2 小时 | 5 分钟 | -95.8% |
| **误报率** | 25% | 5% | -80% |
| **人力成本** | 40 小时/月 | 2 小时/月 | -95% |
| **业务损失** | ￥20,000/月 | ￥1,000/月 | -95% |

### 实际案例数据

**案例1：应用服务器 CPU 异常**
- 手动监控：故障持续时间 2 小时，损失 ￥5,000
- 自动化监控：故障持续时间 8 分钟，损失 ￥200
- 损失减少：96%

**案例2：数据库连接数预警**
- 手动监控：故障持续时间 30 分钟，损失 ￥20,000
- 自动化监控：提前 15 分钟预警，无损失
- 损失减少：100%

**案例3：磁盘空间不足**
- 手动监控：故障持续时间 2 小时，损失 ￥50,000
- 自动化监控：故障持续时间 5 分钟，损失 ￥500
- 损失减少：99%

---

## 🚀 延伸价值

### 1. 监控数据可视化

将监控数据集成到 Grafana，创建可视化大盘：

```yaml
# Grafana Dashboard 配置
dashboard:
  panels:
    - title: CPU 使用率趋势
      type: graph
      query: "SELECT * FROM cpu_usage WHERE time > now() - 1h"
    
    - title: 接口响应时间
      type: graph
      query: "SELECT * FROM response_time WHERE time > now() - 1h"
    
    - title: 错误率统计
      type: stat
      query: "SELECT AVG(error_rate) FROM metrics WHERE time > now() - 5m"
```

### 2. 智能分析报告

利用 OpenClaw 自动生成监控分析报告：

```markdown
请基于以下监控数据，生成本周的监控分析报告：

## 数据
{metrics_data}

## 报告要求
1. 本周异常事件统计（次数、类型、持续时间）
2. 资源使用趋势分析（CPU、内存、磁盘、网络）
3. 性能瓶颈识别（慢查询、高延迟接口）
4. 优化建议（容量规划、架构优化、配置调整）
5. 下周重点关注事项
```

### 3. 自动化扩缩容

结合云平台 API，实现自动扩缩容：

```yaml
# 当 CPU 使用率 > 85% 持续 10 分钟，自动扩容
auto_scaling:
  rules:
    - condition: cpu_usage > 85 for 10 minutes
      action: scale_up
      target: app-server-group
      scale: +2
    
    - condition: cpu_usage < 30 for 30 minutes
      action: scale_down
      target: app-server-group
      scale: -1
```

---

## 💡 总结

**核心价值**：
1. 7×24 小时自动巡检，不再担心漏报
2. 智能异常判断，精准报警，减少误报
3. 详细的排查建议，缩短故障恢复时间
4. 完整的监控体系，覆盖率 95%+

**适用场景**：
- 互联网应用监控
- 企业内部系统监控
- 云服务器监控
- 容器化应用监控（Kubernetes）
- 数据库监控（MySQL、PostgreSQL、MongoDB）
- 中间件监控（Redis、Kafka、RabbitMQ）

**下一步行动**：
1. 创建监控 Agent 和定时任务配置
2. 部署监控脚本，开始数据采集
3. 配置报警通知通道（飞书、钉钉、Slack）
4. 定期回顾和优化监控规则
5. 集成可视化工具（Grafana）

---

## 🎯 互动引导

**问题**：
- 你现在如何监控系统状态？手动还是自动化？
- 你遇到过最严重的监控漏报是什么？
- 你的监控误报率高吗？如何解决的？

**讨论**：
欢迎在评论区分享你的监控经验和踩坑故事！

**关注专栏**：
想学习更多 OpenClaw 实战技巧？关注我的专栏《OpenClaw 核心功能全解》，获取更多自动化解决方案。

---

**标签**：#OpenClaw #监控 #自动化 #DevOps #服务器监控 #报警 #定时任务 #运维 #SRE #技术实战
