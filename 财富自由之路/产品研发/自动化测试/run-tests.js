#!/usr/bin/env node

/**
 * 自动化测试运行器
 * 运行所有核心算法测试并生成报告
 */

const fs = require('fs');
const path = require('path');

// 测试文件列表
const testFiles = [
  'compound-interest.test.js',
  'freedom-timeline.test.js',
  'major-expense.test.js',
  'early-repayment.test.js',
  'retirement-planning.test.js',
  'account-logic.test.js',
  'debt-logic.test.js',
  'goal-progress.test.js'
];

// 测试统计
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failedDetails = [];

// 导出测试工具函数（在运行测试之前）
global.test = function(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ ${name}`);
  } catch (error) {
    failedTests++;
    console.log(`  ❌ ${name}`);
    console.log(`     错误: ${error.message}`);
    failedDetails.push({
      test: name,
      error: error.message
    });
  }
};

global.expect = function(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`期望 ${expected}, 但得到 ${actual}`);
      }
    },
    toBeCloseTo(expected, precision = 2) {
      const diff = Math.abs(actual - expected);
      if (diff > Math.pow(10, -precision)) {
        throw new Error(`期望接近 ${expected}, 但得到 ${actual}`);
      }
    },
    toBeGreaterThan(expected) {
      if (actual <= expected) {
        throw new Error(`期望大于 ${expected}, 但得到 ${actual}`);
      }
    },
    toBeLessThan(expected) {
      if (actual >= expected) {
        throw new Error(`期望小于 ${expected}, 但得到 ${actual}`);
      }
    }
  };
};

console.log('🧪 财富自由软件 - 自动化测试套件\n');
console.log('=' .repeat(60));
console.log(`开始时间: ${new Date().toLocaleString('zh-CN')}\n`);

// 运行每个测试文件
testFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  跳过: ${file} (文件不存在)`);
    return;
  }
  
  console.log(`\n📋 运行: ${file}`);
  console.log('-'.repeat(60));
  
  try {
    // 重置计数器
    const beforeTests = totalTests;
    const beforePassed = passedTests;
    const beforeFailed = failedTests;
    
    // 清除require缓存，确保每次运行都是新的
    delete require.cache[require.resolve(filePath)];
    
    // 运行测试
    const result = require(filePath);
    
    // 检查是否是独立测试文件（导出结果的对象）
    if (result && typeof result.passed === 'number') {
      // 独立测试文件，使用其导出的结果
      const fileTests = result.total;
      const filePassed = result.passed;
      const fileFailed = result.failed;
      
      totalTests += fileTests;
      passedTests += filePassed;
      failedTests += fileFailed;
      
      console.log(`\n✨ ${file}: ${filePassed}/${fileTests} 通过`);
    } else {
      // 使用全局test函数的测试文件
      const fileTests = totalTests - beforeTests;
      const filePassed = passedTests - beforePassed;
      const fileFailed = failedTests - beforeFailed;
      
      console.log(`\n✨ ${file}: ${filePassed}/${fileTests} 通过`);
    }
    
  } catch (error) {
    console.error(`❌ ${file} 运行失败:`, error.message);
    failedDetails.push({
      file,
      error: error.message
    });
  }
});

// 生成测试报告
console.log('\n' + '='.repeat(60));
console.log('📊 测试报告');
console.log('='.repeat(60));
console.log(`总测试数: ${totalTests}`);
console.log(`✅ 通过: ${passedTests}`);
console.log(`❌ 失败: ${failedTests}`);
console.log(`📈 通过率: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
console.log(`⏱️  完成时间: ${new Date().toLocaleString('zh-CN')}`);

if (failedDetails.length > 0) {
  console.log('\n❌ 失败详情:');
  failedDetails.forEach((detail, index) => {
    console.log(`\n${index + 1}. ${detail.file}`);
    console.log(`   错误: ${detail.error}`);
  });
}

console.log('\n' + '='.repeat(60));

// 退出码
process.exit(failedTests > 0 ? 1 : 0);
