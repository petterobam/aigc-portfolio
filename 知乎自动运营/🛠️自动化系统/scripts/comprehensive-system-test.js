/**
 * 知乎自动化系统综合测试脚本
 * 测试最新增强安全验证处理器和智能批量发布器
 * 
 * 执行目标：
 * 1. 验证登录状态和Cookie有效性
 * 2. 测试增强安全验证处理器功能
 * 3. 测试智能批量发布器功能
 * 4. 生成详细测试报告
 * 5. 识别优化机会和风险点
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class ZhihuSystemTester {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.testResults = {
            timestamp: new Date().toISOString(),
            loginStatus: null,
            securityVerification: null,
            batchPublisher: null,
            overallScore: 0,
            recommendations: []
        };
        this.testDir = path.join(__dirname, 'test-results');
        this.ensureTestDir();
    }

    ensureTestDir() {
        if (!fs.existsSync(this.testDir)) {
            fs.mkdirSync(this.testDir, { recursive: true });
        }
    }

    async initializeBrowser() {
        console.log('🚀 初始化浏览器环境...');
        this.browser = await chromium.launch({ 
            headless: false,
            slowMo: 100,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        
        this.context = await this.browser.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            javaScriptEnabled: true,
            ignoreHTTPSErrors: true
        });

        this.page = await this.context.newPage();
        console.log('✅ 浏览器环境初始化完成');
    }

    async testLoginStatus() {
        console.log('🔐 测试登录状态...');
        
        try {
            const cookiePath = path.join(__dirname, '..', 'auth', 'zhihu-cookies-latest.json');
            console.log(`📁 查找Cookie文件: ${cookiePath}`);
            
            if (fs.existsSync(cookiePath)) {
                const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
                console.log(`🍪 找到 ${cookies.length} 个Cookie`);
                
                await this.context.addCookies(cookies);
                console.log('✅ Cookie 已加载');
                
                // 访问知乎首页验证登录状态
                await this.page.goto('https://www.zhihu.com', { waitUntil: 'networkidle' });
                
                // 等待页面加载完成
                await this.page.waitForTimeout(3000);
                
                // 检查是否登录成功
                const loginButton = await this.page.$('.SignFlow-button, .SignFlow-qrcode, .SignFlow-tab');
                const loginSuccess = loginButton === null;
                
                if (loginSuccess) {
                    console.log('✅ 登录状态验证成功');
                    this.testResults.loginStatus = {
                        status: 'success',
                        cookieCount: cookies.length,
                        hasSessionId: cookies.some(c => c.name === 'SESSIONID'),
                        hasZCookie: cookies.some(c => c.name === 'z_c0'),
                        timestamp: new Date().toISOString()
                    };
                } else {
                    console.log('❌ 登录状态验证失败');
                    this.testResults.loginStatus = {
                        status: 'failed',
                        reason: '页面仍然显示登录元素'
                    };
                }
            } else {
                console.log('❌ Cookie 文件不存在');
                this.testResults.loginStatus = {
                    status: 'failed',
                    reason: 'Cookie 文件不存在'
                };
            }
        } catch (error) {
            console.log(`❌ 登录状态测试失败: ${error.message}`);
            this.testResults.loginStatus = {
                status: 'error',
                error: error.message
            };
        }
    }

    async testSecurityVerificationHandler() {
        console.log('🛡️ 测试增强安全验证处理器...');
        
        try {
            const { SecurityHandler } = require('./enhanced-security-handler');
            const securityHandler = new SecurityHandler(this.page);
            
            // 访问知乎可能触发安全验证的页面
            await this.page.goto('https://www.zhihu.com/question', { waitUntil: 'networkidle' });
            
            // 等待页面加载
            await this.page.waitForTimeout(3000);
            
            // 检测安全验证
            const verificationType = await securityHandler.detectSecurityVerification();
            
            this.testResults.securityVerification = {
                detectionWorking: verificationType !== null,
                detectedType: verificationType,
                timestamp: new Date().toISOString(),
                handlerLoaded: true
            };
            
            if (verificationType) {
                console.log(`⚠️ 检测到安全验证: ${verificationType}`);
                // 尝试自动处理
                const handleResult = await securityHandler.handleSecurityVerification();
                this.testResults.securityVerification.handled = handleResult;
            } else {
                console.log('✅ 未检测到安全验证');
            }
            
        } catch (error) {
            console.log(`❌ 安全验证处理器测试失败: ${error.message}`);
            this.testResults.securityVerification = {
                status: 'error',
                error: error.message,
                handlerLoaded: false
            };
        }
    }

    async testSmartBatchPublisher() {
        console.log('📤 测试智能批量发布器...');
        
        try {
            const { SmartPublisher } = require('./smart-batch-publisher');
            const publisher = new SmartPublisher(this.page);
            
            // 测试 dry run 模式
            const testArticles = [
                { title: '测试文章1：AI 技术发展趋势', content: '这是测试内容...' },
                { title: '测试文章2：机器学习应用', content: '这是测试内容...' }
            ];
            
            const result = await publisher.publishBatch(testArticles, { dryRun: true });
            
            this.testResults.batchPublisher = {
                success: result.success,
                successCount: result.successCount,
                failureCount: result.failureCount,
                detailedResults: result.detailedResults,
                dryRun: true,
                timestamp: new Date().toISOString(),
                publisherLoaded: true
            };
            
            console.log(`✅ 批量发布器测试成功: ${result.successCount}/${testArticles.length}`);
            
        } catch (error) {
            console.log(`❌ 智能批量发布器测试失败: ${error.message}`);
            this.testResults.batchPublisher = {
                status: 'error',
                error: error.message,
                publisherLoaded: false
            };
        }
    }

    async testHumanBehaviorSimulation() {
        console.log('👤 测试人类化行为模拟...');
        
        try {
            // 模拟自然浏览行为
            await this.page.goto('https://www.zhihu.com', { waitUntil: 'networkidle' });
            
            // 随机滚动
            await this.page.evaluate(() => {
                const scrollAmount = Math.random() * 500 + 100;
                window.scrollBy(0, scrollAmount);
            });
            await this.page.waitForTimeout(Math.random() * 2000 + 1000);
            
            // 鼠标移动
            await this.page.mouse.move(
                Math.random() * 1280,
                Math.random() * 720,
                { steps: Math.floor(Math.random() * 10 + 5) }
            );
            await this.page.waitForTimeout(Math.random() * 1000 + 500);
            
            // 随机停留
            await this.page.waitForTimeout(Math.random() * 3000 + 2000);
            
            this.testResults.humanBehavior = {
                simulationCompleted: true,
                behaviors: ['scrolling', 'mouseMovement', 'randomWait'],
                timestamp: new Date().toISOString()
            };
            
            console.log('✅ 人类化行为模拟测试完成');
            
        } catch (error) {
            console.log(`❌ 人类化行为模拟测试失败: ${error.message}`);
            this.testResults.humanBehavior = {
                status: 'error',
                error: error.message
            };
        }
    }

    calculateOverallScore() {
        console.log('📊 计算综合评分...');
        
        let score = 0;
        const maxScore = 100;
        
        // 登录状态评分 (30分)
        if (this.testResults.loginStatus?.status === 'success') {
            score += 30;
        } else if (this.testResults.loginStatus?.status === 'failed') {
            score += 15;
        }
        
        // 安全验证处理器评分 (25分)
        if (this.testResults.securityVerification?.detectionWorking) {
            score += 20;
        } else if (this.testResults.securityVerification?.handlerLoaded) {
            score += 10;
        }
        
        // 批量发布器评分 (25分)
        if (this.testResults.batchPublisher?.publisherLoaded) {
            const successRate = this.testResults.batchPublisher.successCount / 
                               (this.testResults.batchPublisher.successCount + this.testResults.batchPublisher.failureCount);
            score += successRate * 25;
        }
        
        // 人类化行为模拟评分 (20分)
        if (this.testResults.humanBehavior?.simulationCompleted) {
            score += 20;
        }
        
        this.testResults.overallScore = Math.round(score);
        
        // 生成建议
        if (score < 60) {
            this.testResults.recommendations.push('系统整体性能较差，需要重点优化登录和安全验证处理');
        } else if (score < 80) {
            this.testResults.recommendations.push('系统基本功能正常，但部分功能需要优化');
        } else {
            this.testResults.recommendations.push('系统性能良好，可以开始实际发布测试');
        }
    }

    generateTestReport() {
        console.log('📝 生成测试报告...');
        
        const report = {
            ...this.testResults,
            summary: {
                totalTests: 4,
                passedTests: Object.values(this.testResults).filter(result => 
                    result && (result.status === 'success' || result.success === true)
                ).length,
                failedTests: 4 - Object.values(this.testResults).filter(result => 
                    result && (result.status === 'success' || result.success === true)
                ).length
            }
        };
        
        const reportPath = path.join(this.testDir, `comprehensive-test-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📄 测试报告已保存至: ${reportPath}`);
        
        return report;
    }

    async cleanup() {
        console.log('🧹 清理资源...');
        if (this.browser) {
            await this.browser.close();
        }
        console.log('✅ 资源清理完成');
    }

    async runAllTests() {
        console.log('🎯 开始知乎自动化系统综合测试...');
        console.log('='.repeat(60));
        
        try {
            await this.initializeBrowser();
            await this.testLoginStatus();
            await this.testSecurityVerificationHandler();
            await this.testSmartBatchPublisher();
            await this.testHumanBehaviorSimulation();
            this.calculateOverallScore();
            
            const report = this.generateTestReport();
            
            console.log('='.repeat(60));
            console.log('🎉 测试完成！');
            console.log(`📊 综合评分: ${this.testResults.overallScore}/100`);
            console.log(`📄 详细报告: ${this.testDir}/`);
            
            return report;
            
        } catch (error) {
            console.log(`❌ 测试过程中发生错误: ${error.message}`);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// 主执行函数
async function main() {
    const tester = new ZhihuSystemTester();
    const results = await tester.runAllTests();
    
    console.log('\n📋 测试结果总结:');
    console.log(`登录状态: ${results.loginStatus?.status || '未测试'}`);
    console.log(`安全验证: ${results.securityVerification?.detectionWorking ? '正常' : '异常'}`);
    console.log(`批量发布: ${results.batchPublisher?.success ? '正常' : '异常'}`);
    console.log(`人类行为: ${results.humanBehavior?.simulationCompleted ? '正常' : '异常'}`);
    console.log(`综合评分: ${results.overallScore}/100`);
    
    if (results.recommendations.length > 0) {
        console.log('\n💡 优化建议:');
        results.recommendations.forEach(rec => {
            console.log(`- ${rec}`);
        });
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ZhihuSystemTester;