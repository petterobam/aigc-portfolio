#!/usr/bin/env node

/**
 * 记忆系统备份脚本
 *
 * 功能：
 * - 备份 memory.db 数据库文件
 * - 压缩备份文件，节省存储空间
 * - 自动清理过期备份（保留最近 4 周）
 * - 生成备份报告
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 引入共享配置
const CONFIG = require('./config.js');
const { DB_CONFIG, BACKUP_CONFIG } = CONFIG;

// 日志函数
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': 'ℹ️',
    'success': '✅',
    'warning': '⚠️',
    'error': '❌'
  }[type] || 'ℹ️';
  console.log(`${prefix} ${message}`);
}

// 获取日期字符串 YYYY-MM-DD
function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 创建备份目录
function ensureBackupDir() {
  if (!fs.existsSync(DB_CONFIG.backupsDir)) {
    fs.mkdirSync(DB_CONFIG.backupsDir, { recursive: true });
    log(`创建备份目录: ${DB_CONFIG.backupsDir}`, 'success');
  }
}

// 检查数据库文件是否存在
function checkDatabaseExists() {
  if (!fs.existsSync(DB_CONFIG.dbPath)) {
    throw new Error(`数据库文件不存在: ${DB_CONFIG.dbPath}`);
  }
}

// 创建备份文件
function createBackup() {
  const dateStr = getDateString();
  const backupFile = path.join(DB_CONFIG.backupsDir, `memory-db-${dateStr}.tar.gz`);

  // 检查今天是否已经备份过
  if (fs.existsSync(backupFile)) {
    log(`今天已存在备份文件: ${backupFile}`, 'warning');
    return null;
  }

  // 使用 tar 命令压缩数据库文件
  try {
    const dbFilename = path.basename(DB_CONFIG.dbPath);
    const dbDir = path.dirname(DB_CONFIG.dbPath);

    log(`开始备份数据库文件: ${dbFilename}`, 'info');
    execSync(`tar -czf "${backupFile}" -C "${dbDir}" "${dbFilename}"`, { stdio: 'inherit' });

    // 检查备份文件大小
    const stats = fs.statSync(backupFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    log(`备份完成: ${backupFile}`, 'success');
    log(`备份大小: ${sizeMB} MB`, 'info');

    return {
      file: backupFile,
      size: stats.size,
      sizeMB: parseFloat(sizeMB)
    };
  } catch (error) {
    throw new Error(`创建备份失败: ${error.message}`);
  }
}

// 清理过期备份
function cleanupOldBackups() {
  const files = fs.readdirSync(DB_CONFIG.backupsDir)
    .filter(file => file.startsWith('memory-db-') && file.endsWith('.tar.gz'))
    .map(file => {
      const filePath = path.join(DB_CONFIG.backupsDir, file);
      const stats = fs.statSync(filePath);
      return {
        file,
        path: filePath,
        mtime: stats.mtime
      };
    })
    .sort((a, b) => b.mtime - a.mtime);  // 按修改时间降序

  if (files.length === 0) {
    log('没有找到旧的备份文件', 'info');
    return { deleted: 0, kept: 0 };
  }

  // 计算保留数量（保留最近 4 周，假设每周一次备份）
  const keepCount = BACKUP_CONFIG.retentionWeeks;
  const filesToDelete = files.slice(keepCount);

  log(`当前备份文件数: ${files.length}`, 'info');
  log(`保留最近 ${keepCount} 个备份，将删除 ${filesToDelete.length} 个旧备份`, 'info');

  let deletedCount = 0;
  filesToDelete.forEach(({ file, path: filePath }) => {
    try {
      fs.unlinkSync(filePath);
      log(`删除旧备份: ${file}`, 'success');
      deletedCount++;
    } catch (error) {
      log(`删除失败 ${file}: ${error.message}`, 'error');
    }
  });

  return {
    deleted: deletedCount,
    kept: files.length - deletedCount
  };
}

// 计算文件 SHA256 哈希值
function calculateFileHash(filePath) {
  try {
    const crypto = require('crypto');
    const buffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  } catch (error) {
    throw new Error(`计算哈希值失败: ${error.message}`);
  }
}

// 验证备份文件
function verifyBackup(backupInfo) {
  if (!backupInfo) {
    return { verified: false, reason: '备份文件不存在' };
  }

  const verification = {
    verified: true,
    checks: [],
    sourceFileSize: 0,
    backupFileSize: backupInfo.size,
    sourceHash: null,
    backupHash: null
  };

  try {
    // 1. 验证源文件大小（不能为 0）
    log('验证源文件大小...', 'info');
    const sourceStats = fs.statSync(DB_CONFIG.dbPath);
    verification.sourceFileSize = sourceStats.size;

    if (sourceStats.size === 0) {
      verification.checks.push({
        name: '源文件大小验证',
        status: 'failed',
        message: '源文件大小为 0'
      });
      verification.verified = false;
    } else {
      verification.checks.push({
        name: '源文件大小验证',
        status: 'passed',
        message: `源文件大小: ${sourceStats.size} 字节`
      });
    }

    // 2. 验证备份文件大小（不能为 0）
    log('验证备份文件大小...', 'info');
    if (backupInfo.size === 0) {
      verification.checks.push({
        name: '备份文件大小验证',
        status: 'failed',
        message: '备份文件大小为 0'
      });
      verification.verified = false;
    } else {
      verification.checks.push({
        name: '备份文件大小验证',
        status: 'passed',
        message: `备份文件大小: ${backupInfo.size} 字节 (压缩率: ${((backupInfo.size / sourceStats.size) * 100).toFixed(1)}%)`
      });
    }

    // 3. 验证备份文件内容（解压后检查是否包含 memory.db）
    log('验证备份文件内容...', 'info');
    const dbFilename = path.basename(DB_CONFIG.dbPath);
    const tempDir = path.join(DB_CONFIG.backupsDir, 'temp-extract');

    try {
      // 创建临时目录
      fs.mkdirSync(tempDir, { recursive: true });

      // 解压备份文件
      execSync(`tar -xzf "${backupInfo.file}" -C "${tempDir}"`, { stdio: 'pipe' });
      const extractedFile = path.join(tempDir, dbFilename);

      if (!fs.existsSync(extractedFile)) {
        verification.checks.push({
          name: '备份文件内容验证',
          status: 'failed',
          message: '解压后未找到 memory.db 文件'
        });
        verification.verified = false;
      } else {
        const extractedStats = fs.statSync(extractedFile);
        verification.checks.push({
          name: '备份文件内容验证',
          status: 'passed',
          message: `解压成功，文件大小: ${extractedStats.size} 字节`
        });

        // 4. 数据校验（源文件和备份文件的哈希值一致）
        log('计算源文件哈希值...', 'info');
        verification.sourceHash = calculateFileHash(DB_CONFIG.dbPath);

        log('计算备份文件哈希值...', 'info');
        verification.backupHash = calculateFileHash(extractedFile);

        if (verification.sourceHash === verification.backupHash) {
          verification.checks.push({
            name: '数据完整性校验',
            status: 'passed',
            message: '哈希值 100% 一致'
          });
        } else {
          verification.checks.push({
            name: '数据完整性校验',
            status: 'failed',
            message: '哈希值不一致，数据可能损坏'
          });
          verification.verified = false;
        }

        // 清理临时目录
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      verification.checks.push({
        name: '备份文件内容验证',
        status: 'failed',
        message: `解压验证失败: ${error.message}`
      });
      verification.verified = false;

      // 清理临时目录
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }

  } catch (error) {
    verification.checks.push({
      name: '验证过程',
      status: 'failed',
      message: error.message
    });
    verification.verified = false;
  }

  return verification;
}

// 生成备份报告
function generateReport(backupInfo, cleanupInfo, verification) {
  const report = {
    timestamp: new Date().toISOString(),
    backup: {
      file: backupInfo?.file || null,
      size: backupInfo?.size || 0,
      sizeMB: backupInfo?.sizeMB || 0,
      alreadyExists: !backupInfo
    },
    cleanup: cleanupInfo,
    verification: verification,
    summary: {
      totalBackups: cleanupInfo.kept,
      deletedOldBackups: cleanupInfo.deleted,
      backupDir: DB_CONFIG.backupsDir,
      verified: verification.verified
    }
  };

  return report;
}

// 保存报告
function saveReport(report) {
  const reportPath = path.join(DB_CONFIG.backupsDir, 'latest-backup-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`备份报告已保存: ${reportPath}`, 'success');
}

// 主函数
async function main() {
  console.log('============================================================');
  console.log('  记忆系统备份脚本 v1.2.0');
  console.log('============================================================');
  console.log();

  let backupInfo = null;
  let cleanupInfo = null;
  let verification = { verified: false, checks: [] };

  try {
    // 1. 创建备份目录
    log('检查备份目录...', 'info');
    ensureBackupDir();

    // 2. 检查数据库文件
    log('检查数据库文件...', 'info');
    checkDatabaseExists();

    // 3. 创建备份
    console.log();
    log('创建备份...', 'info');
    console.log();
    backupInfo = createBackup();

    // 4. 验证备份
    let verificationResult = null;
    if (backupInfo) {
      console.log();
      log('验证备份...', 'info');
      console.log();
      verification = verifyBackup(backupInfo);
      verificationResult = verification;

      if (verification.verified) {
        log('备份验证通过 ✅', 'success');
      } else {
        log('备份验证失败 ❌', 'error');
      }
    }

    // 5. 清理旧备份
    console.log();
    log('清理旧备份...', 'info');
    console.log();
    cleanupInfo = cleanupOldBackups();

    // 6. 生成和保存报告
    console.log();
    log('生成备份报告...', 'info');
    const report = generateReport(backupInfo, cleanupInfo, verification);
    saveReport(report);

    // 7. 显示摘要
    console.log();
    console.log('============================================================');
    if (verification.verified || !backupInfo) {
      console.log('  备份完成');
    } else {
      console.log('  备份完成（验证失败）');
    }
    console.log('============================================================');
    console.log();
    console.log('📊 备份摘要：');
    if (backupInfo) {
      console.log(`  ✅ 备份文件: ${backupInfo.file}`);
      console.log(`  ✅ 备份大小: ${backupInfo.sizeMB} MB`);
    } else {
      console.log(`  ℹ️  今天已存在备份，无需重复备份`);
    }
    console.log(`  🗑️  删除旧备份: ${cleanupInfo.deleted} 个`);
    console.log(`  📦 保留备份: ${cleanupInfo.kept} 个`);
    console.log(`  📁 备份目录: ${DB_CONFIG.backupsDir}`);

    if (verificationResult) {
      console.log();
      console.log('🔍 验证结果：');
      console.log(`  ${verification.verified ? '✅' : '❌'} 验证状态: ${verification.verified ? '通过' : '失败'}`);
      verificationResult.checks.forEach(check => {
        const icon = check.status === 'passed' ? '✅' : '❌';
        console.log(`  ${icon} ${check.name}: ${check.message}`);
      });
      if (verification.sourceHash && verification.backupHash) {
        console.log(`  🔐 源文件哈希: ${verification.sourceHash}`);
        console.log(`  🔐 备份哈希: ${verification.backupHash}`);
      }
    }

    console.log();

    process.exit(0);

  } catch (error) {
    console.log();
    console.log('============================================================');
    console.log('  备份失败');
    console.log('============================================================');
    console.log();
    log(`错误: ${error.message}`, 'error');
    console.log();
    process.exit(1);
  }
}

// 运行主函数
main();
