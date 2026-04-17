/**
 * 简化的知乎系统状态检查脚本
 * 快速验证核心功能状态
 */

const fs = require('fs');
const path = require('path');

class QuickSystemCheck {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            checks: {},
            overallStatus: 'unknown'
        };
    }

    checkCookieStatus() {
        console.log('🔐 检查Cookie状态...');
        
        try {
            const cookiePath = path.join(__dirname, '..', 'auth', 'zhihu-cookies-latest.json');
            if (fs.existsSync(cookiePath)) {
                const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
                const hasEssentialCookies = cookies.some(c => 
                    c.name === 'SESSIONID' || c.name === 'z_c0'
                );
                
                this.results.checks.cookie = {
                    status: 'success',
                    count: cookies.length,
                    hasEssential: hasEssentialCookies,
                    path: cookiePath
                };
                console.log(`✅ Cookie正常 (${cookies.length}个)`);
            } else {
                this.results.checks.cookie = {
                    status: 'failed',
                    reason: 'Cookie文件不存在'
                };
                console.log('❌ Cookie文件不存在');
            }
        } catch (error) {
            this.results.checks.cookie = {
                status: 'error',
                error: error.message
            };
            console.log(`❌ Cookie检查失败: ${error.message}`);
        }
    }

    checkScriptFiles() {
        console.log('📁 检查脚本文件...');
        
        const scripts = [
            'enhanced-security-handler.js',
            'smart-batch-publisher.js',
            'batch-publish-articles-v3.js'
        ];
        
        this.results.checks.scripts = {};
        
        scripts.forEach(script => {
            const scriptPath = path.join(__dirname, script);
            if (fs.existsSync(scriptPath)) {
                const stats = fs.statSync(scriptPath);
                this.results.checks.scripts[script] = {
                    status: 'success',
                    size: stats.size,
                    modified: stats.mtime
                };
                console.log(`✅ ${script} (${stats.size}字节)`);
            } else {
                this.results.checks.scripts[script] = {
                    status: 'failed',
                    reason: '文件不存在'
                };
                console.log(`❌ ${script} 不存在`);
            }
        });
    }

    checkArticlesDirectory() {
        console.log('📄 检查待发布文章...');
        
        try {
            const articlesPath = path.join(__dirname, '..', '..', '📤待发布');
            if (fs.existsSync(articlesPath)) {
                const files = fs.readdirSync(articlesPath);
                const mdFiles = files.filter(f => f.endsWith('.md'));
                
                this.results.checks.articles = {
                    status: 'success',
                    totalFiles: files.length,
                    mdFiles: mdFiles.length,
                    directory: articlesPath
                };
                console.log(`✅ 待发布文章: ${mdFiles}个Markdown文件`);
            } else {
                this.results.checks.articles = {
                    status: 'failed',
                    reason: '目录不存在'
                };
                console.log('❌ 待发布目录不存在');
            }
        } catch (error) {
            this.results.checks.articles = {
                status: 'error',
                error: error.message
            };
            console.log(`❌ 文章检查失败: ${error.message}`);
        }
    }

    checkRecentReports() {
        console.log('📊 检查最近报告...');
        
        try {
            const reportsPath = path.join(__dirname, '..', 'reports');
            if (fs.existsSync(reportsPath)) {
                const files = fs.readdirSync(reportsPath);
                const recentReports = files
                    .filter(f => f.startsWith('batch-publish-'))
                    .sort()
                    .slice(-3);
                
                this.results.checks.reports = {
                    status: 'success',
                    totalReports: files.length,
                    recentReports: recentReports,
                    directory: reportsPath
                };
                
                if (recentReports.length > 0) {
                    console.log(`✅ 最近报告: ${recentReports.join(', ')}`);
                } else {
                    console.log('⚠️ 没有最近的批量发布报告');
                }
            } else {
                this.results.checks.reports = {
                    status: 'failed',
                    reason: '报告目录不存在'
                };
                console.log('❌ 报告目录不存在');
            }
        } catch (error) {
            this.results.checks.reports = {
                status: 'error',
                error: error.message
            };
            console.log(`❌ 报告检查失败: ${error.message}`);
        }
    }

    analyzeOverallStatus() {
        console.log('🎯 分析整体状态...');
        
        const checks = Object.values(this.results.checks);
        const successCount = checks.filter(c => c.status === 'success').length;
        const totalCount = checks.length;
        
        const successRate = successCount / totalCount;
        
        if (successRate >= 0.8) {
            this.results.overallStatus = 'excellent';
            console.log('🎉 系统状态优秀');
        } else if (successRate >= 0.6) {
            this.results.overallStatus = 'good';
            console.log('✅ 系统状态良好');
        } else if (successRate >= 0.4) {
            this.results.overallStatus = 'fair';
            console.log('⚠️ 系统状态一般');
        } else {
            this.results.overallStatus = 'poor';
            console.log('❌ 系统状态较差');
        }
        
        this.results.successRate = successRate;
        this.results.summary = {
            totalChecks: totalCount,
            passedChecks: successCount,
            failedChecks: totalCount - successCount
        };
    }

    generateReport() {
        const reportPath = path.join(__dirname, 'test-results', 
            `quick-check-${Date.now()}.json`
        );
        
        if (!fs.existsSync(path.dirname(reportPath))) {
            fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        }
        
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`📄 快速检查报告已保存: ${reportPath}`);
        
        return this.results;
    }

    run() {
        console.log('🚀 开始知乎系统快速状态检查...');
        console.log('='.repeat(50));
        
        this.checkCookieStatus();
        this.checkScriptFiles();
        this.checkArticlesDirectory();
        this.checkRecentReports();
        this.analyzeOverallStatus();
        
        console.log('='.repeat(50));
        
        const report = this.generateReport();
        
        console.log('📊 检查结果总结:');
        console.log(`整体状态: ${this.results.overallStatus}`);
        console.log(`成功率: ${Math.round(this.results.successRate * 100)}%`);
        console.log(`通过检查: ${report.summary.passedChecks}/${report.summary.totalChecks}`);
        
        return report;
    }
}

// 直接运行
if (require.main === module) {
    const checker = new QuickSystemCheck();
    const results = checker.run();
    
    process.exit(results.overallStatus === 'excellent' ? 0 : 1);
}

module.exports = QuickSystemCheck;