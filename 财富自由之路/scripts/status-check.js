#!/usr/bin/env node

// 个人网站部署状态检查脚本
// 创建时间：2026-04-04
// 用途：检查GitHub部署进度，验证各项任务完成状态

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const config = {
    websiteDir: '~/.openclaw/workspace/财富自由之路/personal-website',
    scriptsDir: '~/.openclaw/workspace/财富自由之路/scripts',
    logFile: '~/.openclaw/workspace/财富自由之路/scripts/deployment-status.log'
};

// 颜色定义
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// 日志函数
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
    
    // 控制台输出
    switch(type) {
        case 'success':
            console.log(`${colors.green}${message}${colors.reset}`);
            break;
        case 'error':
            console.log(`${colors.red}${message}${colors.reset}`);
            break;
        case 'warning':
            console.log(`${colors.yellow}${message}${colors.reset}`);
            break;
        case 'info':
        default:
            console.log(`${colors.cyan}${message}${colors.reset}`);
    }
    
    // 写入日志文件
    fs.appendFileSync(config.logFile, logEntry);
}

// 检查目录存在性
function checkDirectoryExists(dir, description) {
    if (!fs.existsSync(dir)) {
        log(`❌ ${description}目录不存在: ${dir}`, 'error');
        return false;
    }
    log(`✅ ${description}目录存在: ${dir}`, 'success');
    return true;
}

// 检查文件存在性
function checkFileExists(file, description) {
    if (!fs.existsSync(file)) {
        log(`❌ ${description}文件不存在: ${file}`, 'error');
        return false;
    }
    log(`✅ ${description}文件存在: ${file}`, 'success');
    return true;
}

// 检查Git状态
function checkGitStatus() {
    log('🔍 检查Git状态...', 'info');
    
    try {
        // 检查是否在git仓库中
        const isGitRepo = execSync('git rev-parse --is-inside-work-tree', { 
            cwd: config.websiteDir,
            stdio: 'pipe'
        }).toString().trim() === 'true';
        
        if (!isGitRepo) {
            log('❌ 当前目录不是Git仓库', 'error');
            return false;
        }
        log('✅ 当前目录是Git仓库', 'success');
        
        // 检查远程仓库
        const remoteUrl = execSync('git remote get-url origin', {
            cwd: config.websiteDir,
            stdio: 'pipe'
        }).toString().trim();
        
        if (remoteUrl) {
            log(`✅ 远程仓库已配置: ${remoteUrl}`, 'success');
            
            // 提取GitHub用户名
            const match = remoteUrl.match(/github\.com[:\/]([^\/]+)\/personal-website/);
            if (match) {
                const username = match[1];
                log(`✅ GitHub用户名: ${username}`, 'success');
                return { username, remoteUrl };
            } else {
                log('⚠️ 无法从远程URL提取GitHub用户名', 'warning');
            }
        } else {
            log('⚠️ 未配置远程仓库', 'warning');
        }
        
        // 检查工作目录状态
        const status = execSync('git status --porcelain', {
            cwd: config.websiteDir,
            stdio: 'pipe'
        }).toString().trim();
        
        if (status) {
            log(`⚠️ 有未提交的更改:\n${status}`, 'warning');
        } else {
            log('✅ 工作目录干净', 'success');
        }
        
        // 检查提交历史
        const lastCommit = execSync('git log -1 --oneline', {
            cwd: config.websiteDir,
            stdio: 'pipe'
        }).toString().trim();
        
        log(`📝 最后提交: ${lastCommit}`, 'info');
        
        return true;
        
    } catch (error) {
        log(`❌ Git状态检查失败: ${error.message}`, 'error');
        return false;
    }
}

// 检查网站文件
function checkWebsiteFiles() {
    log('🔍 检查网站文件...', 'info');
    
    const requiredFiles = [
        'config.toml',
        'content/contact.md',
        'themes/ananke',
        'static/css/',
        'static/js/'
    ];
    
    let allExists = true;
    
    requiredFiles.forEach(file => {
        const fullPath = path.join(config.websiteDir, file);
        const exists = fs.existsSync(fullPath);
        
        if (exists) {
            if (file.endsWith('/')) {
                log(`✅ 目录存在: ${file}`, 'success');
            } else {
                log(`✅ 文件存在: ${file}`, 'success');
            }
        } else {
            log(`❌ 文件/目录不存在: ${file}`, 'error');
            allExists = false;
        }
    });
    
    return allExists;
}

// 检查Hugo安装
function checkHugoInstallation() {
    log('🔍 检查Hugo安装...', 'info');
    
    try {
        const version = execSync('hugo version', { stdio: 'pipe' }).toString().trim();
        log(`✅ Hugo已安装: ${version}`, 'success');
        return true;
    } catch (error) {
        log('❌ Hugo未安装或不可用', 'error');
        return false;
    }
}

// 检查GitHub认证状态
function checkGithubAuth() {
    log('🔍 检查GitHub认证状态...', 'info');
    
    try {
        // 检查GitHub CLI状态
        const authStatus = execSync('gh auth status', { stdio: 'pipe' }).toString().trim();
        log(`✅ GitHub CLI认证状态: ${authStatus}`, 'success');
        return true;
    } catch (error) {
        log('⚠️ GitHub CLI未认证或不可用', 'warning');
        
        // 检查是否有GitHub token
        const token = process.env.GITHUB_TOKEN;
        if (token) {
            log('✅ 检测到GitHub Token环境变量', 'success');
            return true;
        } else {
            log('⚠️ 未检测到GitHub认证信息', 'warning');
            return false;
        }
    }
}

// 模拟网站访问检查
function checkWebsiteAccess() {
    log('🔍 检查网站访问状态...', 'info');
    
    // 从git remote获取用户名
    try {
        const remoteUrl = execSync('git remote get-url origin', {
            cwd: config.websiteDir,
            stdio: 'pipe'
        }).toString().trim();
        
        const match = remoteUrl.match(/github\.com[:\/]([^\/]+)\/personal-website/);
        if (match) {
            const username = match[1];
            const websiteUrl = `https://${username}.github.io/personal-website/`;
            
            log(`🌐 网站URL: ${websiteUrl}`, 'info');
            
            // 使用curl检查网站状态
            try {
                const response = execSync(`curl -s -I ${websiteUrl}`, { stdio: 'pipe' }).toString().trim();
                const statusCode = response.split('\n')[0].split(' ')[1];
                
                if (statusCode === '200') {
                    log(`✅ 网站可访问，状态码: ${statusCode}`, 'success');
                    return { websiteUrl, statusCode: 200 };
                } else {
                    log(`⚠️ 网站返回状态码: ${statusCode}`, 'warning');
                    return { websiteUrl, statusCode };
                }
            } catch (error) {
                log(`⚠️ 网站访问检查失败: ${error.message}`, 'warning');
                return { websiteUrl, statusCode: null };
            }
        } else {
            log('⚠️ 无法从远程URL提取用户名', 'warning');
            return null;
        }
    } catch (error) {
        log('❌ 无法获取远程URL', 'error');
        return null;
    }
}

// 生成部署报告
function generateDeploymentReport(status) {
    log('📊 生成部署状态报告...', 'info');
    
    const report = {
        timestamp: new Date().toISOString(),
        status: status,
        summary: {
            gitStatus: status.git ? '✅' : '❌',
            websiteFiles: status.files ? '✅' : '❌',
            hugoInstalled: status.hugo ? '✅' : '❌',
            githubAuth: status.auth ? '✅' : '❌',
            websiteAccess: status.access ? '✅' : '❌'
        },
        recommendations: []
    };
    
    // 生成建议
    if (!status.git) {
        report.recommendations.push('需要初始化Git仓库');
    }
    if (!status.files) {
        report.recommendations.push('缺少必要的网站文件');
    }
    if (!status.hugo) {
        report.recommendations.push('需要安装Hugo');
    }
    if (!status.auth) {
        report.recommendations.push('需要配置GitHub认证');
    }
    if (!status.access) {
        report.recommendations.push('需要配置GitHub Pages并等待部署');
    }
    
    // 保存报告
    const reportFile = path.join(config.scriptsDir, 'deployment-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    log(`✅ 部署状态报告已保存: ${reportFile}`, 'success');
    
    // 显示摘要
    console.log('\n' + '='.repeat(50));
    console.log('📊 部署状态摘要');
    console.log('='.repeat(50));
    console.log(`Git状态: ${report.summary.gitStatus}`);
    console.log(`网站文件: ${report.summary.websiteFiles}`);
    console.log(`Hugo安装: ${report.summary.hugoInstalled}`);
    console.log(`GitHub认证: ${report.summary.githubAuth}`);
    console.log(`网站访问: ${report.summary.websiteAccess}`);
    
    if (report.recommendations.length > 0) {
        console.log('\n💡 建议:');
        report.recommendations.forEach(rec => {
            console.log(`  - ${rec}`);
        });
    }
    
    console.log('='.repeat(50));
    
    return report;
}

// 主检查流程
function main() {
    console.log('🌟 个人网站部署状态检查');
    console.log('时间:', new Date().toLocaleString('zh-CN'));
    console.log('='.repeat(50));
    
    // 检查必要目录
    if (!checkDirectoryExists(config.websiteDir, '网站') ||
        !checkDirectoryExists(config.scriptsDir, '脚本')) {
        log('❌ 缺少必要目录，无法继续检查', 'error');
        process.exit(1);
    }
    
    // 执行各项检查
    const status = {
        git: checkGitStatus(),
        files: checkWebsiteFiles(),
        hugo: checkHugoInstallation(),
        auth: checkGithubAuth(),
        access: checkWebsiteAccess()
    };
    
    // 生成报告
    const report = generateDeploymentReport(status);
    
    // 返回状态
    const allGood = Object.values(status).every(s => s);
    
    if (allGood) {
        log('\n🎉 所有检查通过！部署准备完成！', 'success');
        process.exit(0);
    } else {
        log('\n⚠️ 部分检查未通过，请根据建议进行修复', 'warning');
        process.exit(1);
    }
}

// 捕获错误
process.on('uncaughtException', (error) => {
    log(`❌ 未捕获的错误: ${error.message}`, 'error');
    process.exit(1);
});

// 执行主函数
main();