#!/usr/bin/env node

/**
 * 指数衰减计算器
 * 用于计算时效性评分变化的指数衰减模型
 *
 * 数学公式: score_change = threshold * (1 - e^(-t / tau))
 *
 * 参数说明:
 * - threshold: 评分更新阈值(默认 0.2)
 * - t: 累积时间(分钟)
 * - tau: 衰减时间常数(默认 279 分钟,基于当前数据拟合)
 *
 * 特性:
 * - 饱和效应: 当 t → ∞ 时,score_change → threshold
 * - 初始斜率: d(score_change)/dt | t=0 = threshold / tau
 * - 半衰期: t_half = tau * ln(2) ≈ 0.693 * tau
 *
 * 版本: v1.0.0
 * 作者: 记忆优化器
 * 创建时间: 2026-03-28
 */

const { OPTIMIZE_CONFIG } = require('./config.js');

// 默认配置
const DECAY_CONFIG = {
  threshold: 0.2,                    // 评分更新阈值
  tau: 279,                         // 衰减时间常数(分钟)
  halfLife: null,                    // 半衰期(自动计算: tau * ln(2))
  initialSlope: null,               // 初始斜率(自动计算: threshold / tau)
};

// 计算半衰期
DECAY_CONFIG.halfLife = DECAY_CONFIG.tau * Math.log(2);

// 计算初始斜率
DECAY_CONFIG.initialSlope = DECAY_CONFIG.threshold / DECAY_CONFIG.tau;

/**
 * 计算指数衰减评分变化
 * @param {number} elapsedTime - 累积时间(分钟)
 * @param {number} threshold - 评分更新阈值(可选,默认使用 DECAY_CONFIG.threshold)
 * @param {number} tau - 衰减时间常数(可选,默认使用 DECAY_CONFIG.tau)
 * @returns {number} 评分变化量
 */
function calculateExponentialDecay(elapsedTime, threshold = DECAY_CONFIG.threshold, tau = DECAY_CONFIG.tau) {
  if (elapsedTime < 0) {
    throw new Error('累积时间不能为负数');
  }

  if (tau <= 0) {
    throw new Error('衰减时间常数 tau 必须为正数');
  }

  // 应用指数衰减公式
  const scoreChange = threshold * (1 - Math.exp(-elapsedTime / tau));

  return scoreChange;
}

/**
 * 计算达到目标评分变化所需的时间
 * @param {number} targetScoreChange - 目标评分变化量
 * @param {number} threshold - 评分更新阈值(可选)
 * @param {number} tau - 衰减时间常数(可选)
 * @returns {number} 所需时间(分钟)
 */
function calculateTimeToTargetScoreChange(targetScoreChange, threshold = DECAY_CONFIG.threshold, tau = DECAY_CONFIG.tau) {
  if (targetScoreChange <= 0) {
    throw new Error('目标评分变化必须为正数');
  }

  if (targetScoreChange >= threshold) {
    throw new Error(`目标评分变化 ${targetScoreChange} 不能大于等于阈值 ${threshold}`);
  }

  if (tau <= 0) {
    throw new Error('衰减时间常数 tau 必须为正数');
  }

  // 反解指数衰减公式: t = -tau * ln(1 - scoreChange / threshold)
  const requiredTime = -tau * Math.log(1 - targetScoreChange / threshold);

  return requiredTime;
}

/**
 * 检查是否应该触发评分更新
 * @param {number} elapsedTime - 累积时间(分钟)
 * @param {number} threshold - 评分更新阈值(可选)
 * @param {number} tau - 衰减时间常数(可选)
 * @returns {boolean} 是否应该触发
 */
function shouldTriggerScoreUpdate(elapsedTime, threshold = DECAY_CONFIG.threshold, tau = DECAY_CONFIG.tau) {
  const currentScoreChange = calculateExponentialDecay(elapsedTime, threshold, tau);
  return currentScoreChange >= threshold;
}

/**
 * 生成衰减曲线数据点(用于可视化或分析)
 * @param {number} maxTime - 最大时间(分钟)
 * @param {number} step - 时间步长(分钟,默认 10)
 * @param {number} threshold - 评分更新阈值(可选)
 * @param {number} tau - 衰减时间常数(可选)
 * @returns {Array<{time: number, scoreChange: number}>} 衰减曲线数据点
 */
function generateDecayCurve(maxTime, step = 10, threshold = DECAY_CONFIG.threshold, tau = DECAY_CONFIG.tau) {
  const curveData = [];

  for (let t = 0; t <= maxTime; t += step) {
    const scoreChange = calculateExponentialDecay(t, threshold, tau);
    curveData.push({ time: t, scoreChange });
  }

  // 添加最后一个点(确保达到 maxTime)
  if (curveData[curveData.length - 1].time < maxTime) {
    const scoreChange = calculateExponentialDecay(maxTime, threshold, tau);
    curveData.push({ time: maxTime, scoreChange });
  }

  return curveData;
}

/**
 * 计算预测时间(达到阈值所需的时间)
 * @param {number} threshold - 评分更新阈值(可选)
 * @param {number} tau - 衰减时间常数(可选)
 * @returns {number} 预测时间(分钟)
 */
function calculatePredictedTime(threshold = DECAY_CONFIG.threshold, tau = DECAY_CONFIG.tau) {
  // 理论上,指数衰减永远不会完全达到阈值,但可以无限接近
  // 我们使用 99.9% 的阈值作为"达到"的标准
  const targetScoreChange = threshold * 0.999;
  const predictedTime = calculateTimeToTargetScoreChange(targetScoreChange, threshold, tau);

  return predictedTime;
}

/**
 * 对比线性模型和指数模型
 * @param {number} elapsedTime - 累积时间(分钟)
 * @param {number} threshold - 评分更新阈值
 * @param {number} tau - 衰减时间常数(指数模型)
 * @returns {Object} 对比结果
 */
function compareModels(elapsedTime, threshold = 0.2, tau = 279) {
  // 线性模型: score_change = (threshold / 277) * t
  const linearRate = threshold / 277;  // 基于旧模型的 277 分钟
  const linearScoreChange = linearRate * elapsedTime;

  // 指数模型
  const exponentialScoreChange = calculateExponentialDecay(elapsedTime, threshold, tau);

  // 计算差异
  const diff = exponentialScoreChange - linearScoreChange;
  const diffPercent = (diff / linearScoreChange) * 100;

  return {
    linear: {
      model: 'Linear',
      rate: linearRate,
      scoreChange: linearScoreChange,
      formula: `score_change = (${threshold} / 277) * t`,
    },
    exponential: {
      model: 'Exponential',
      tau: tau,
      scoreChange: exponentialScoreChange,
      formula: `score_change = ${threshold} * (1 - e^(-t / ${tau}))`,
    },
    comparison: {
      diff: diff,
      diffPercent: diffPercent,
      betterModel: Math.abs(exponentialScoreChange - threshold) < Math.abs(linearScoreChange - threshold) ? 'Exponential' : 'Linear',
    },
  };
}

/**
 * 打印配置信息
 */
function printConfig() {
  console.log('='.repeat(60));
  console.log('  指数衰减计算器配置');
  console.log('='.repeat(60));
  console.log(`阈值 (threshold): ${DECAY_CONFIG.threshold}`);
  console.log(`衰减时间常数 (tau): ${DECAY_CONFIG.tau} 分钟`);
  console.log(`半衰期 (half-life): ${DECAY_CONFIG.halfLife.toFixed(2)} 分钟`);
  console.log(`初始斜率 (initial slope): ${DECAY_CONFIG.initialSlope.toFixed(6)}`);
  console.log(`预测时间 (99.9% 阈值): ${calculatePredictedTime().toFixed(2)} 分钟`);
  console.log('='.repeat(60));
}

/**
 * 测试函数(用于验证模型准确性)
 */
function runTests() {
  console.log('\n测试指数衰减计算器...\n');

  // 测试 1: 验证基本计算
  console.log('测试 1: 基本计算验证');
  const t1 = 277;  // 旧模型的阈值时间
  const sc1 = calculateExponentialDecay(t1);
  console.log(`  t = ${t1} 分钟, score_change = ${sc1.toFixed(4)} (阈值 = 0.2)`);
  console.log(`  结果: ${sc1 >= DECAY_CONFIG.threshold ? '✅ 通过' : '❌ 失败'}\n`);

  // 测试 2: 验证半衰期
  console.log('测试 2: 半衰期验证');
  const t2 = DECAY_CONFIG.halfLife;
  const sc2 = calculateExponentialDecay(t2);
  const expectedSc2 = DECAY_CONFIG.threshold * 0.5;
  console.log(`  t = ${t2.toFixed(2)} 分钟, score_change = ${sc2.toFixed(4)}`);
  console.log(`  预期: ${expectedSc2.toFixed(4)} (阈值的 50%)`);
  console.log(`  结果: ${Math.abs(sc2 - expectedSc2) < 0.01 ? '✅ 通过' : '❌ 失败'}\n`);

  // 测试 3: 验证初始斜率
  console.log('测试 3: 初始斜率验证');
  const t3 = 1;  // 1 分钟
  const sc3 = calculateExponentialDecay(t3);
  const expectedSlope3 = sc3 / t3;  // 实际斜率
  console.log(`  t = ${t3} 分钟, score_change = ${sc3.toFixed(6)}`);
  console.log(`  实际斜率: ${expectedSlope3.toFixed(6)}`);
  console.log(`  理论斜率: ${DECAY_CONFIG.initialSlope.toFixed(6)}`);
  console.log(`  结果: ${Math.abs(expectedSlope3 - DECAY_CONFIG.initialSlope) < 0.0001 ? '✅ 通过' : '❌ 失败'}\n`);

  // 测试 4: 验证饱和效应
  console.log('测试 4: 饱和效应验证');
  const t4 = 10000;  // 10000 分钟(约 7 天)
  const sc4 = calculateExponentialDecay(t4);
  console.log(`  t = ${t4} 分钟, score_change = ${sc4.toFixed(6)}`);
  console.log(`  阈值: ${DECAY_CONFIG.threshold}`);
  console.log(`  差距: ${(DECAY_CONFIG.threshold - sc4).toFixed(6)}`);
  console.log(`  结果: ${Math.abs(sc4 - DECAY_CONFIG.threshold) < 0.01 ? '✅ 通过' : '❌ 失败'}\n`);

  // 测试 5: 模型对比
  console.log('测试 5: 线性模型 vs 指数模型');
  const t5 = 530;  // 当前累积时间
  const comparison = compareModels(t5);
  console.log(`  t = ${t5} 分钟 (当前累积时间)`);
  console.log(`  线性模型: ${comparison.linear.scoreChange.toFixed(4)}`);
  console.log(`  指数模型: ${comparison.exponential.scoreChange.toFixed(4)}`);
  console.log(`  差异: ${comparison.comparison.diff.toFixed(4)} (${comparison.comparison.diffPercent.toFixed(2)}%)`);
  console.log(`  更优模型: ${comparison.comparison.betterModel}`);
  console.log(`  结果: ${comparison.comparison.betterModel === 'Exponential' ? '✅ 通过' : '❌ 失败'}\n`);
}

/**
 * 命令行使用示例
 */
function printUsage() {
  console.log('\n使用示例:');
  console.log('  # 计算累积 530 分钟的评分变化');
  console.log('  node scripts/decay-calculator.js calc 530');
  console.log('');
  console.log('  # 计算达到评分变化 0.17 所需的时间');
  console.log('  node scripts/decay-calculator.js time 0.17');
  console.log('');
  console.log('  # 检查 530 分钟是否应该触发评分更新');
  console.log('  node scripts/decay-calculator.js check 530');
  console.log('');
  console.log('  # 生成衰减曲线数据点(0-1000 分钟,步长 10)');
  console.log('  node scripts/decay-calculator.js curve 1000 10');
  console.log('');
  console.log('  # 对比线性模型和指数模型(累积 530 分钟)');
  console.log('  node scripts/decay-calculator.js compare 530');
  console.log('');
  console.log('  # 运行测试验证模型准确性');
  console.log('  node scripts/decay-calculator.js test');
  console.log('');
  console.log('  # 打印配置信息');
  console.log('  node scripts/decay-calculator.js config');
  console.log('');
}

// 导出函数(供其他脚本使用)
module.exports = {
  DECAY_CONFIG,
  calculateExponentialDecay,
  calculateTimeToTargetScoreChange,
  shouldTriggerScoreUpdate,
  generateDecayCurve,
  calculatePredictedTime,
  compareModels,
  printConfig,
  runTests,
};

// 命令行执行
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printConfig();
    printUsage();
    process.exit(0);
  }

  try {
    switch (command) {
      case 'calc': {
        const elapsedTime = parseFloat(args[1]);
        if (isNaN(elapsedTime)) {
          throw new Error('请输入有效的累积时间(分钟)');
        }
        const scoreChange = calculateExponentialDecay(elapsedTime);
        console.log(`\n累积时间: ${elapsedTime} 分钟`);
        console.log(`评分变化: ${scoreChange.toFixed(4)} (阈值: ${DECAY_CONFIG.threshold})`);
        console.log(`是否触发: ${shouldTriggerScoreUpdate(elapsedTime) ? '是 ✅' : '否 ❌'}\n`);
        break;
      }

      case 'time': {
        const targetScoreChange = parseFloat(args[1]);
        if (isNaN(targetScoreChange)) {
          throw new Error('请输入有效的目标评分变化量');
        }
        const requiredTime = calculateTimeToTargetScoreChange(targetScoreChange);
        console.log(`\n目标评分变化: ${targetScoreChange.toFixed(4)}`);
        console.log(`所需时间: ${requiredTime.toFixed(2)} 分钟 (${(requiredTime / 60).toFixed(2)} 小时)`);
        console.log(`预测时间(99.9% 阈值): ${calculatePredictedTime().toFixed(2)} 分钟\n`);
        break;
      }

      case 'check': {
        const elapsedTime = parseFloat(args[1]);
        if (isNaN(elapsedTime)) {
          throw new Error('请输入有效的累积时间(分钟)');
        }
        const shouldTrigger = shouldTriggerScoreUpdate(elapsedTime);
        const scoreChange = calculateExponentialDecay(elapsedTime);
        console.log(`\n累积时间: ${elapsedTime} 分钟`);
        console.log(`评分变化: ${scoreChange.toFixed(4)} (阈值: ${DECAY_CONFIG.threshold})`);
        console.log(`是否触发: ${shouldTrigger ? '是 ✅' : '否 ❌'}\n`);
        break;
      }

      case 'curve': {
        const maxTime = parseFloat(args[1]) || 1000;
        const step = parseFloat(args[2]) || 10;
        const curveData = generateDecayCurve(maxTime, step);
        console.log(`\n衰减曲线数据点 (0-${maxTime} 分钟, 步长 ${step} 分钟):\n`);
        console.log('时间(分钟)  评分变化');
        console.log('----------  ----------');
        for (const point of curveData) {
          console.log(`${point.time.toString().padStart(10)}  ${point.scoreChange.toFixed(4).padStart(10)}`);
        }
        console.log('');
        break;
      }

      case 'compare': {
        const elapsedTime = parseFloat(args[1]);
        if (isNaN(elapsedTime)) {
          throw new Error('请输入有效的累积时间(分钟)');
        }
        const comparison = compareModels(elapsedTime);
        console.log('\n线性模型 vs 指数模型对比:\n');
        console.log(`线性模型:`);
        console.log(`  公式: ${comparison.linear.formula}`);
        console.log(`  评分变化: ${comparison.linear.scoreChange.toFixed(4)}`);
        console.log('');
        console.log(`指数模型:`);
        console.log(`  公式: ${comparison.exponential.formula}`);
        console.log(`  评分变化: ${comparison.exponential.scoreChange.toFixed(4)}`);
        console.log('');
        console.log(`对比:`);
        console.log(`  差异: ${comparison.comparison.diff.toFixed(4)} (${comparison.comparison.diffPercent.toFixed(2)}%)`);
        console.log(`  更优模型: ${comparison.comparison.betterModel}\n`);
        break;
      }

      case 'test': {
        printConfig();
        runTests();
        break;
      }

      case 'config': {
        printConfig();
        break;
      }

      default:
        console.error(`\n未知命令: ${command}`);
        console.error('运行 "node scripts/decay-calculator.js help" 查看使用帮助\n');
        process.exit(1);
    }
  } catch (error) {
    console.error(`\n错误: ${error.message}\n`);
    process.exit(1);
  }
}
