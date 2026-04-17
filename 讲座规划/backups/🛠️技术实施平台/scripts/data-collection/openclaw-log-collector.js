const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const cron = require('node-cron');
const sqlite3 = require('sqlite3').verbose();
const WebSocket = require('ws');
const axios = require('axios');

class OpenClawLogCollector {
    constructor() {
        this.logDirectory = '～/.openclaw/workspace';
        this.dataStore = path.join(this.logDirectory, '讲座规划/🛠️技术实施平台/data/raw');
        this.databasePath = path.join(this.dataStore, 'usage_logs.db');
        this.realtimeClients = new Set();
        this.ensureDirectories();
        this.setupDatabase();
    }

    ensureDirectories() {
        // 确保数据目录存在
        const dirs = [
            this.dataStore,
            path.join(this.dataStore, 'logs'),
            path.join(this.dataStore, 'sessions'),
            path.join(this.dataStore, 'interactions'),
            path.join(this.dataStore, 'processed')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    setupDatabase() {
        // 设置SQLite数据库
        this.db = new sqlite3.Database(this.databasePath, (err) => {
            if (err) {
                console.error('数据库连接失败:', err);
            } else {
                console.log('数据库连接成功');
                this.createTables();
            }
        });
    }

    createTables() {
        const createTablesSQL = `
            CREATE TABLE IF NOT EXISTS usage_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id TEXT,
                session_id TEXT,
                tool_name TEXT,
                action_type TEXT,
                duration REAL,
                success BOOLEAN DEFAULT 1,
                error_message TEXT,
                metadata TEXT,
                raw_content TEXT,
                processed_at DATETIME
            );

            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                session_id TEXT,
                start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                end_time DATETIME,
                total_duration REAL,
                actions_count INTEGER DEFAULT 0,
                tools_used TEXT,
                status TEXT DEFAULT 'active'
            );

            CREATE TABLE IF NOT EXISTS daily_summary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE UNIQUE,
                total_actions INTEGER DEFAULT 0,
                unique_users INTEGER DEFAULT 0,
                unique_tools INTEGER DEFAULT 0,
                total_duration REAL DEFAULT 0,
                success_rate REAL DEFAULT 0,
                avg_duration REAL DEFAULT 0,
                peak_hour INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp);
            CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_usage_logs_tool_name ON usage_logs(tool_name);
            CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON daily_summary(date);
        `;

        this.db.exec(createTablesSQL, (err) => {
            if (err) {
                console.error('创建表失败:', err);
            } else {
                console.log('数据表创建成功');
            }
        });
    }

    // 收集OpenClaw使用日志
    collectUsageLogs() {
        console.log('开始收集OpenClaw使用日志...');
        
        const logFiles = this.findLogFiles();
        const logs = [];
        
        let totalLogs = 0;
        let processedLogs = 0;
        
        logFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const parsedLogs = this.parseLogContent(content, file);
                logs.push(...parsedLogs);
                totalLogs += parsedLogs.length;
            } catch (error) {
                console.warn(`解析日志文件失败: ${file}`, error.message);
            }
        });
        
        // 保存到数据库
        if (logs.length > 0) {
            this.saveToDatabase(logs);
            processedLogs = logs.length;
        }
        
        // 生成每日汇总
        this.generateDailySummary();
        
        console.log(`收集完成，共发现${totalLogs}条日志，处理${processedLogs}条`);
        
        return {
            total_found: totalLogs,
            total_processed: processedLogs,
            timestamp: new Date().toISOString()
        };
    }

    // 查找日志文件
    findLogFiles() {
        const patterns = [
            '**/*.log',
            '**/*.json',
            '**/*session*.log',
            '**/*interaction*.log',
            '**/memory/**/*.md',
            '**/workspace/**/*.md'
        ];
        
        const foundFiles = [];
        patterns.forEach(pattern => {
            try {
                const files = glob.sync(path.join(this.logDirectory, pattern));
                foundFiles.push(...files);
            } catch (error) {
                console.warn(`查找文件失败: ${pattern}`, error.message);
            }
        });
        
        return [...new Set(foundFiles)]; // 去重
    }

    // 解析日志内容
    parseLogContent(content, filePath) {
        const lines = content.split('\n').filter(line => line.trim());
        const logs = [];
        
        lines.forEach((line, index) => {
            try {
                const logEntry = this.parseLogLine(line, filePath, index);
                if (logEntry) {
                    logs.push(logEntry);
                }
            } catch (error) {
                console.warn(`解析日志行失败: ${filePath}:${index}`, error.message);
            }
        });
        
        return logs;
    }

    // 解析单行日志
    parseLogLine(line, filePath, lineIndex) {
        const logEntry = {
            timestamp: new Date(),
            source: filePath,
            line_number: lineIndex,
            raw_content: line,
            processed: false
        };

        // 尝试解析为JSON
        try {
            const json = JSON.parse(line);
            logEntry.processed = true;
            logEntry.data = json;
            logEntry.timestamp = json.timestamp || new Date(json.created_at) || new Date();
            logEntry.user_id = json.user_id || json.sessionId || json.session_id || 'unknown';
            logEntry.session_id = json.sessionId || json.session_id || json.user_id;
            logEntry.tool_name = json.tool || json.service || 'openclaw';
            logEntry.action_type = json.action || json.type || 'log';
            logEntry.success = json.success !== false;
            logEntry.duration = json.duration || json.time || 0;
            logEntry.metadata = json.metadata || {};
        } catch {
            // 如果不是JSON，尝试解析为结构化文本
            const textMatch = line.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+(.+)$/);
            if (textMatch) {
                logEntry.processed = true;
                logEntry.timestamp = new Date(textMatch[1]);
                logEntry.content = textMatch[2];
                logEntry.user_id = 'unknown';
                logEntry.action_type = 'log';
                logEntry.tool_name = 'openclaw';
                logEntry.success = true;
                logEntry.metadata = { raw: line };
            }
        }

        return logEntry;
    }

    // 保存到数据库
    saveToDatabase(logs) {
        const insertSQL = `
            INSERT INTO usage_logs 
            (timestamp, user_id, session_id, tool_name, action_type, duration, success, error_message, metadata, raw_content)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const stmt = this.db.prepare(insertSQL);
        
        logs.forEach(log => {
            stmt.run(
                log.timestamp,
                log.user_id,
                log.session_id,
                log.tool_name,
                log.action_type,
                log.duration,
                log.success,
                log.error_message || null,
                JSON.stringify(log.metadata),
                log.raw_content
            );
        });

        stmt.finalize();
        console.log(`成功保存${logs.length}条日志到数据库`);
    }

    // 生成每日汇总
    generateDailySummary() {
        const today = new Date().toISOString().split('T')[0];
        const summarySQL = `
            SELECT 
                COUNT(*) as total_actions,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT tool_name) as unique_tools,
                SUM(duration) as total_duration,
                AVG(duration) as avg_duration,
                AVG(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_rate,
                strftime('%H', timestamp) as peak_hour
            FROM usage_logs 
            WHERE date(timestamp) = ?
        `;

        this.db.get(summarySQL, [today], (err, row) => {
            if (err) {
                console.error('生成每日汇总失败:', err);
                return;
            }

            // 检查是否已存在今日汇总
            const checkSQL = 'SELECT id FROM daily_summary WHERE date = ?';
            this.db.get(checkSQL, [today], (err, existing) => {
                if (err) {
                    console.error('检查汇总记录失败:', err);
                    return;
                }

                const insertSQL = `
                    INSERT OR REPLACE INTO daily_summary 
                    (date, total_actions, unique_users, unique_tools, total_duration, success_rate, avg_duration, peak_hour)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;

                this.db.run(insertSQL, [
                    today,
                    row.total_actions,
                    row.unique_users,
                    row.unique_tools,
                    row.total_duration,
                    row.success_rate,
                    row.avg_duration,
                    row.peak_hour
                ], (err) => {
                    if (err) {
                        console.error('保存每日汇总失败:', err);
                    } else {
                        console.log(`每日汇总已生成: ${today}`);
                        this.pushRealtimeData('daily_summary', row);
                    }
                });
            });
        });
    }

    // 更新用户会话
    updateUserSession(userId, sessionId, action) {
        const checkSQL = 'SELECT * FROM user_sessions WHERE user_id = ? AND session_id = ? AND status = "active"';
        this.db.get(checkSQL, [userId, sessionId], (err, session) => {
            if (err) {
                console.error('检查用户会话失败:', err);
                return;
            }

            if (session) {
                // 更新现有会话
                const updateSQL = `
                    UPDATE user_sessions 
                    SET end_time = CURRENT_TIMESTAMP, total_duration = ? + COALESCE(total_duration, 0), 
                        actions_count = ? + COALESCE(actions_count, 0), status = 'completed'
                    WHERE user_id = ? AND session_id = ?
                `;
                this.db.run(updateSQL, [action.duration || 0, 1, userId, sessionId]);
            } else {
                // 创建新会话
                const insertSQL = `
                    INSERT INTO user_sessions 
                    (user_id, session_id, total_duration, actions_count, tools_used, status)
                    VALUES (?, ?, ?, ?, ?, 'active')
                `;
                this.db.run(insertSQL, [userId, sessionId, action.duration || 0, 1, action.tool_name]);
            }
        });
    }

    // 获取实时数据
    getRealtimeData() {
        return new Promise((resolve, reject) => {
            const realtimeSQL = `
                SELECT 
                    COUNT(*) as total_actions,
                    COUNT(DISTINCT user_id) as active_users,
                    COUNT(DISTINCT tool_name) as unique_tools,
                    AVG(duration) as avg_duration,
                    AVG(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100 as success_rate,
                    COUNT(CASE WHEN timestamp > datetime('now', '-1 hour') THEN 1 END) as recent_actions
                FROM usage_logs 
                WHERE timestamp > datetime('now', '-24 hours')
            `;

            this.db.get(realtimeSQL, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // 推送实时数据
    pushRealtimeData(type, data) {
        const message = {
            type: type,
            data: data,
            timestamp: new Date().toISOString()
        };

        this.realtimeClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }

    // 添加WebSocket客户端
    addClient(client) {
        this.realtimeClients.add(client);
        
        client.on('close', () => {
            this.realtimeClients.delete(client);
        });
        
        client.on('error', () => {
            this.realtimeClients.delete(client);
        });
    }

    // 设置定时任务
    setupScheduledCollection() {
        // 每小时收集一次
        cron.schedule('0 * * * *', () => {
            console.log('定时任务：收集OpenClaw使用日志');
            this.collectUsageLogs();
        });

        // 每天生成汇总报告
        cron.schedule('0 23 * * *', () => {
            console.log('定时任务：生成每日汇总报告');
            this.generateDailySummary();
            this.generateWeeklySummary();
        });

        // 每分钟更新实时数据
        cron.schedule('*/1 * * * *', () => {
            this.getRealtimeData().then(data => {
                this.pushRealtimeData('realtime_stats', data);
            });
        });
    }

    // 生成每周汇总
    generateWeeklySummary() {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        
        const weeklySQL = `
            SELECT 
                date(timestamp) as date,
                COUNT(*) as daily_actions,
                COUNT(DISTINCT user_id) as daily_users,
                COUNT(DISTINCT tool_name) as daily_tools
            FROM usage_logs 
            WHERE timestamp >= ?
            GROUP BY date(timestamp)
            ORDER BY date
        `;

        this.db.all(weeklySQL, [weekStart.toISOString()], (err, rows) => {
            if (err) {
                console.error('生成每周汇总失败:', err);
                return;
            }

            const summaryFile = path.join(this.dataStore, 'analysis', `weekly_summary_${new Date().toISOString().split('T')[0]}.json`);
            
            fs.writeFileSync(summaryFile, JSON.stringify({
                period: {
                    start: weekStart.toISOString(),
                    end: new Date().toISOString()
                },
                daily_data: rows,
                totals: {
                    total_actions: rows.reduce((sum, row) => sum + row.daily_actions, 0),
                    total_users: rows.reduce((sum, row) => sum + row.daily_users, 0),
                    total_tools: rows.reduce((sum, row) => sum + row.daily_tools, 0)
                }
            }, null, 2));

            console.log(`每周汇总已生成: ${summaryFile}`);
        });
    }

    // 获取使用趋势分析
    getUsageTrends(days = 30) {
        return new Promise((resolve, reject) => {
            const trendsSQL = `
                SELECT 
                    date(timestamp) as date,
                    COUNT(*) as actions,
                    COUNT(DISTINCT user_id) as users,
                    COUNT(DISTINCT tool_name) as tools,
                    AVG(duration) as avg_duration,
                    AVG(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100 as success_rate
                FROM usage_logs 
                WHERE timestamp >= datetime('now', '-${days} days')
                GROUP BY date(timestamp)
                ORDER BY date
            `;

            this.db.all(trendsSQL, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 获取工具使用统计
    getToolStatistics() {
        return new Promise((resolve, reject) => {
            const toolSQL = `
                SELECT 
                    tool_name,
                    COUNT(*) as usage_count,
                    COUNT(DISTINCT user_id) as unique_users,
                    AVG(duration) as avg_duration,
                    AVG(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100 as success_rate
                FROM usage_logs 
                WHERE timestamp >= datetime('now', '-30 days')
                GROUP BY tool_name
                ORDER BY usage_count DESC
            `;

            this.db.all(toolSQL, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 清理旧数据
    cleanupOldData(daysToKeep = 90) {
        const cleanupSQL = 'DELETE FROM usage_logs WHERE timestamp < datetime("now", "-' + daysToKeep + ' days")';
        this.db.run(cleanupSQL, (err) => {
            if (err) {
                console.error('清理旧数据失败:', err);
            } else {
                console.log('已清理90天前的旧数据');
            }
        });
    }

    // 启动服务
    start() {
        console.log('启动OpenClaw日志收集服务...');
        this.setupScheduledCollection();
        this.collectUsageLogs();
        
        // 启动WebSocket服务器
        const wss = new WebSocket.Server({ port: 8081 });
        wss.on('connection', (ws) => {
            console.log('新的WebSocket连接');
            this.addClient(ws);
            
            // 发送初始数据
            this.getRealtimeData().then(data => {
                ws.send(JSON.stringify({
                    type: 'initial_stats',
                    data: data
                }));
            });
        });
        
        console.log('WebSocket服务已启动在端口 8081');
    }
}

// 导出模块
module.exports = OpenClawLogCollector;

// 如果直接运行此文件，启动服务
if (require.main === module) {
    const collector = new OpenClawLogCollector();
    collector.start();
}