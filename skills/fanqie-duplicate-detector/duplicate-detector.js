#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 解析命令行参数
const args = process.argv.slice(2);
let targetPath = args[0];
let threshold = 80;
let format = 'markdown';
let allFiles = false;

// 解析参数
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--threshold' && args[i + 1]) {
        threshold = parseInt(args[i + 1]);
    } else if (args[i] === '--format' && args[i + 1]) {
        format = args[i + 1];
    } else if (args[i] === '--all') {
        allFiles = true;
    }
}

// 验证参数
if (!targetPath) {
    console.error('❌ 请指定文件或目录路径');
    console.error('\n使用方法:');
    console.error('  node duplicate-detector.js <path> [--threshold <80>] [--format <markdown|json>] [--all]');
    console.error('\n示例:');
    console.error('  node duplicate-detector.js story.md');
    console.error('  node duplicate-detector.js story.md --threshold 90');
    console.error('  node duplicate-detector.js directory --all --format json');
    process.exit(1);
}

// 验证路径
if (!fs.existsSync(targetPath)) {
    console.error(`❌ 路径不存在: ${targetPath}`);
    process.exit(1);
}

// 相似度计算函数
function calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;

    // 简单的编辑距离算法
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));

    for (let i = 0; i <= len1; i++) {
        matrix[i][0] = i;
    }

    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return 1 - (distance / maxLen);
}

// 检测单个文件
function detectDuplicates(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // 按段落分割（空行分隔）
    const paragraphs = content.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 10);

    // 检测重复段落
    const duplicates = [];
    const seen = new Map();

    for (let i = 0; i < paragraphs.length; i++) {
        const p1 = paragraphs[i];

        for (let j = i + 1; j < paragraphs.length; j++) {
            const p2 = paragraphs[j];

            // 计算相似度
            const similarity = calculateSimilarity(p1, p2);

            if (similarity >= threshold / 100) {
                if (!seen.has(i)) {
                    duplicates.push({
                        index1: i + 1,
                        index2: j + 1,
                        similarity: similarity,
                        text1: p1.length > 100 ? p1.substring(0, 100) + '...' : p1,
                        text2: p2.length > 100 ? p2.substring(0, 100) + '...' : p2
                    });
                    seen.set(i, true);
                }
            }
        }
    }

    return {
        fileName: path.basename(filePath),
        filePath: filePath,
        totalParagraphs: paragraphs.length,
        duplicates: duplicates,
        duplicateRate: (duplicates.length / paragraphs.length * 100).toFixed(2)
    };
}

// 输出Markdown格式
function outputMarkdown(results) {
    if (Array.isArray(results)) {
        // 多文件模式
        console.log(`\n📊 重复段落检测报告（批量模式）`);
        console.log(`检测文件数: ${results.length}`);
        console.log(`检测阈值: ${threshold}%相似度\n`);

        results.forEach((result, index) => {
            console.log(`\n### ${index + 1}. ${result.fileName}`);
            console.log(`文件: ${result.filePath}`);
            console.log(`总段落数: ${result.totalParagraphs}`);
            console.log(`重复段落数: ${result.duplicates.length}`);
            console.log(`重复率: ${result.duplicateRate}%`);

            if (result.duplicates.length > 0) {
                console.log(`\n前5处重复:`);
                result.duplicates.slice(0, 5).forEach((dup, dupIndex) => {
                    console.log(`  ${dupIndex + 1}. 段落 ${dup.index1} ≈ 段落 ${dup.index2}`);
                    console.log(`     相似度: ${(dup.similarity * 100).toFixed(1)}%`);
                    console.log(`     段落${dup.index1}: ${dup.text1}`);
                    console.log(`     段落${dup.index2}: ${dup.text2}`);
                });
            }
        });
    } else {
        // 单文件模式
        const result = results;
        console.log(`\n📊 重复段落检测报告`);
        console.log(`文件: ${result.fileName}`);
        console.log(`总段落数: ${result.totalParagraphs}`);
        console.log(`检测阈值: ${threshold}%相似度\n`);

        if (result.duplicates.length === 0) {
            console.log('✅ 未发现重复段落\n');
        } else {
            console.log(`⚠️  发现 ${result.duplicates.length} 处重复段落\n`);

            result.duplicates.forEach((dup, index) => {
                console.log(`${index + 1}. 段落 ${dup.index1} ≈ 段落 ${dup.index2}`);
                console.log(`   相似度: ${(dup.similarity * 100).toFixed(1)}%`);
                console.log(`   段落${dup.index1}: ${dup.text1}`);
                console.log(`   段落${dup.index2}: ${dup.text2}`);
                console.log();
            });
        }

        // 输出重复率评估
        console.log(`\n📈 重复率评估: ${result.duplicateRate}%`);
        if (result.duplicateRate <= 5) {
            console.log(`✅ 优秀，无需优化`);
        } else if (result.duplicateRate <= 10) {
            console.log(`⚠️  良好，可以优化`);
        } else if (result.duplicateRate <= 20) {
            console.log(`⚠️  一般，需要优化`);
        } else if (result.duplicateRate <= 30) {
            console.log(`❌ 较差，必须优化`);
        } else {
            console.log(`❌ 很差，严重优化`);
        }
    }
}

// 输出JSON格式
function outputJSON(results) {
    console.log(JSON.stringify(results, null, 2));
}

// 主函数
function main() {
    if (allFiles && fs.statSync(targetPath).isDirectory()) {
        // 批量检测目录下的所有文件
        const files = fs.readdirSync(targetPath).filter(f =>
            f.endsWith('.md') || f.endsWith('.txt')
        );

        const results = files.map(file => {
            const filePath = path.join(targetPath, file);
            return detectDuplicates(filePath);
        });

        if (format === 'json') {
            outputJSON(results);
        } else {
            outputMarkdown(results);
        }
    } else if (fs.statSync(targetPath).isDirectory()) {
        // 检测目录下的第一个Markdown文件
        const files = fs.readdirSync(targetPath).filter(f =>
            f.endsWith('.md') || f.endsWith('.txt')
        );

        if (files.length === 0) {
            console.error(`❌ 目录中没有找到Markdown或文本文件: ${targetPath}`);
            process.exit(1);
        }

        const filePath = path.join(targetPath, files[0]);
        const result = detectDuplicates(filePath);

        if (format === 'json') {
            outputJSON(result);
        } else {
            outputMarkdown(result);
        }
    } else {
        // 检测单个文件
        const result = detectDuplicates(targetPath);

        if (format === 'json') {
            outputJSON(result);
        } else {
            outputMarkdown(result);
        }
    }
}

// 执行
main();
