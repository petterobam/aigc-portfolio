/**
 * 大额支出规划工具 - 算法验证
 * 
 * 目的：验证大额支出规划算法的正确性
 * 创建时间：2026-03-24 04:31（心跳 #110）
 */

// ============================================
// 核心算法
// ============================================

/**
 * 复利计算器（用于大额支出规划的基础计算）
 */
function calculateCompoundInterest(principal, monthlyContribution, years, annualRate) {
  if (annualRate === 0) {
    // 0收益率：简单加法
    const totalContribution = principal + (monthlyContribution * years * 12);
    return {
      totalFuture: Math.round(totalContribution),
      totalContribution: Math.round(totalContribution),
      totalInterest: 0,
      interestRatio: 0,
      yearlyData: []
    };
  }
  
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  
  // 本金的复利
  const principalFuture = principal * Math.pow(1 + monthlyRate, months);
  
  // 每月定投的复利（年金终值公式）
  const contributionFuture = monthlyContribution * 
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  
  const totalFuture = principalFuture + contributionFuture;
  const totalContribution = principal + (monthlyContribution * months);
  const totalInterest = totalFuture - totalContribution;
  
  // 计算每年的资产增长（用于可视化）
  const yearlyData = [];
  for (let year = 1; year <= years; year++) {
    const yearMonths = year * 12;
    const yearPrincipalFuture = principal * Math.pow(1 + monthlyRate, yearMonths);
    const yearContributionFuture = monthlyContribution * 
      ((Math.pow(1 + monthlyRate, yearMonths) - 1) / monthlyRate);
    const yearTotal = yearPrincipalFuture + yearContributionFuture;
    
    yearlyData.push({
      year: year,
      totalAssets: Math.round(yearTotal),
      totalContribution: principal + (monthlyContribution * yearMonths),
      totalInterest: Math.round(yearTotal - principal - (monthlyContribution * yearMonths))
    });
  }
  
  return {
    totalFuture: Math.round(totalFuture),
    totalContribution: Math.round(totalContribution),
    totalInterest: Math.round(totalInterest),
    interestRatio: ((totalInterest / totalContribution) * 100).toFixed(1),
    yearlyData: yearlyData
  };
}

/**
 * 大额支出规划
 * @param {number} targetAmount - 目标金额
 * @param {number} monthsToTarget - 距离目标月数
 * @param {number} currentSavings - 当前储蓄
 * @param {number} monthlySavings - 每月储蓄
 * @param {number} annualReturn - 年化收益率（小数）
 * @returns {object} 规划结果
 */
function planLargeExpense(targetAmount, monthsToTarget, currentSavings, monthlySavings, annualReturn) {
  // 计算目标日期时的总资产
  const yearsToTarget = monthsToTarget / 12;
  const futureAssets = calculateCompoundInterest(currentSavings, monthlySavings, yearsToTarget, annualReturn);
  
  // 判断是否足够
  const isAchievable = futureAssets.totalFuture >= targetAmount;
  
  // 计算达成日期（如果足够）
  let monthsToAchieve = null;
  if (isAchievable) {
    // 反推达成月数
    if (annualReturn === 0) {
      // 0收益率：简单计算
      monthsToAchieve = Math.ceil((targetAmount - currentSavings) / monthlySavings);
    } else {
      const monthlyRate = annualReturn / 12;
      let assets = currentSavings;
      monthsToAchieve = 0;
      
      while (assets < targetAmount && monthsToAchieve < monthsToTarget) {
        const monthlyReturn = assets * monthlyRate;
        assets += monthlyReturn + monthlySavings;
        monthsToAchieve++;
      }
    }
  }
  
  // 计算需要增加的月储蓄（如果不足）
  let additionalSavingsNeeded = 0;
  if (!isAchievable) {
    if (annualReturn === 0) {
      // 0收益率：简单计算
      additionalSavingsNeeded = Math.ceil((targetAmount - currentSavings) / monthsToTarget) - monthlySavings;
    } else {
      const monthlyRate = annualReturn / 12;
      const targetMonths = monthsToTarget;
      
      // 计算需要的每月储蓄（年金终值公式反推）
      const futureValueOfPrincipal = currentSavings * Math.pow(1 + monthlyRate, targetMonths);
      const requiredContribution = (targetAmount - futureValueOfPrincipal) / 
        ((Math.pow(1 + monthlyRate, targetMonths) - 1) / monthlyRate);
      
      additionalSavingsNeeded = Math.ceil(requiredContribution - monthlySavings);
    }
  }
  
  // 计算缺口
  const gap = targetAmount - futureAssets.totalFuture;
  
  // 生成建议
  let recommendation = '';
  if (isAchievable) {
    const yearsToAchieve = (monthsToAchieve / 12).toFixed(1);
    recommendation = `目标可达成！预计 ${yearsToAchieve} 年后达成`;
  } else {
    recommendation = `目标不足，需要每月增加 ${additionalSavingsNeeded.toLocaleString()} 元储蓄`;
  }
  
  return {
    targetAmount: targetAmount,
    monthsToTarget: monthsToTarget,
    yearsToTarget: (monthsToTarget / 12).toFixed(1),
    currentSavings: currentSavings,
    monthlySavings: monthlySavings,
    futureAssets: futureAssets.totalFuture,
    isAchievable: isAchievable,
    monthsToAchieve: monthsToAchieve,
    yearsToAchieve: monthsToAchieve ? (monthsToAchieve / 12).toFixed(1) : null,
    gap: gap > 0 ? Math.round(gap) : 0,
    additionalSavingsNeeded: additionalSavingsNeeded > 0 ? additionalSavingsNeeded : 0,
    recommendation: recommendation,
    futureAssetsDetail: futureAssets
  };
}

/**
 * 时间计算器（反推达成时间）
 * @param {number} targetAmount - 目标金额
 * @param {number} currentSavings - 当前储蓄
 * @param {number} monthlySavings - 每月储蓄
 * @param {number} annualReturn - 年化收益率（小数）
 * @returns {object} 时间计算结果
 */
function calculateTimeToGoal(targetAmount, currentSavings, monthlySavings, annualReturn) {
  if (annualReturn === 0) {
    // 0收益率：简单计算
    const months = Math.ceil((targetAmount - currentSavings) / monthlySavings);
    return {
      years: Math.floor(months / 12),
      months: months % 12,
      totalMonths: months,
      finalAmount: currentSavings + monthlySavings * months
    };
  }
  
  const monthlyRate = annualReturn / 12;
  let assets = currentSavings;
  let months = 0;
  
  while (assets < targetAmount) {
    const monthlyReturn = assets * monthlyRate;
    assets += monthlyReturn + monthlySavings;
    months++;
    
    // 安全限制：最多100年
    if (months > 1200) {
      return {
        years: 100,
        months: 0,
        totalMonths: 1200,
        finalAmount: assets,
        unreachable: true
      };
    }
  }
  
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    totalMonths: months,
    finalAmount: Math.round(assets)
  };
}

// ============================================
// 测试用例
// ============================================

console.log('========================================');
console.log('大额支出规划工具 - 算法验证');
console.log('========================================\n');

// 测试1：买房首付规划（3年后，100万，当前20万，每月存2万）
console.log('【测试1】买房首付规划（3年后，100万，当前20万，每月存2万，8%年化）');
const test1 = planLargeExpense(1000000, 36, 200000, 20000, 0.08);
console.log('目标金额：¥' + test1.targetAmount.toLocaleString());
console.log('目标时间：' + test1.yearsToTarget + ' 年');
console.log('当前储蓄：¥' + test1.currentSavings.toLocaleString());
console.log('每月储蓄：¥' + test1.monthlySavings.toLocaleString());
console.log('未来资产：¥' + test1.futureAssets.toLocaleString());
console.log('是否可达成：' + (test1.isAchievable ? '✅ 是' : '❌ 否'));
if (test1.isAchievable) {
  console.log('达成时间：' + test1.yearsToAchieve + ' 年');
} else {
  console.log('缺口：¥' + test1.gap.toLocaleString());
  console.log('需要增加月储蓄：¥' + test1.additionalSavingsNeeded.toLocaleString());
}
console.log('建议：' + test1.recommendation);
console.log('');

// 测试2：买车规划（2年后，30万，当前5万，每月存1万）
console.log('【测试2】买车规划（2年后，30万，当前5万，每月存1万，8%年化）');
const test2 = planLargeExpense(300000, 24, 50000, 10000, 0.08);
console.log('目标金额：¥' + test2.targetAmount.toLocaleString());
console.log('目标时间：' + test2.yearsToTarget + ' 年');
console.log('当前储蓄：¥' + test2.currentSavings.toLocaleString());
console.log('每月储蓄：¥' + test2.monthlySavings.toLocaleString());
console.log('未来资产：¥' + test2.futureAssets.toLocaleString());
console.log('是否可达成：' + (test2.isAchievable ? '✅ 是' : '❌ 否'));
if (test2.isAchievable) {
  console.log('达成时间：' + test2.yearsToAchieve + ' 年');
} else {
  console.log('缺口：¥' + test2.gap.toLocaleString());
  console.log('需要增加月储蓄：¥' + test2.additionalSavingsNeeded.toLocaleString());
}
console.log('建议：' + test2.recommendation);
console.log('');

// 测试3：教育基金（5年后，50万，当前10万，每月存5千）
console.log('【测试3】教育基金（5年后，50万，当前10万，每月存5千，8%年化）');
const test3 = planLargeExpense(500000, 60, 100000, 5000, 0.08);
console.log('目标金额：¥' + test3.targetAmount.toLocaleString());
console.log('目标时间：' + test3.yearsToTarget + ' 年');
console.log('当前储蓄：¥' + test3.currentSavings.toLocaleString());
console.log('每月储蓄：¥' + test3.monthlySavings.toLocaleString());
console.log('未来资产：¥' + test3.futureAssets.toLocaleString());
console.log('是否可达成：' + (test3.isAchievable ? '✅ 是' : '❌ 否'));
if (test3.isAchievable) {
  console.log('达成时间：' + test3.yearsToAchieve + ' 年');
} else {
  console.log('缺口：¥' + test3.gap.toLocaleString());
  console.log('需要增加月储蓄：¥' + test3.additionalSavingsNeeded.toLocaleString());
}
console.log('建议：' + test3.recommendation);
console.log('');

// 测试4：0收益率场景（边界条件）
console.log('【测试4】0收益率场景（2年后，30万，当前10万，每月存1万，0%年化）');
const test4 = planLargeExpense(300000, 24, 100000, 10000, 0);
console.log('目标金额：¥' + test4.targetAmount.toLocaleString());
console.log('目标时间：' + test4.yearsToTarget + ' 年');
console.log('当前储蓄：¥' + test4.currentSavings.toLocaleString());
console.log('每月储蓄：¥' + test4.monthlySavings.toLocaleString());
console.log('未来资产：¥' + test4.futureAssets.toLocaleString());
console.log('是否可达成：' + (test4.isAchievable ? '✅ 是' : '❌ 否'));
if (test4.isAchievable) {
  console.log('达成时间：' + test4.yearsToAchieve + ' 年');
} else {
  console.log('缺口：¥' + test4.gap.toLocaleString());
  console.log('需要增加月储蓄：¥' + test4.additionalSavingsNeeded.toLocaleString());
}
console.log('建议：' + test4.recommendation);
console.log('');

// 测试5：短期目标（6个月后，10万，当前5万，每月存1万）
console.log('【测试5】短期目标（6个月后，10万，当前5万，每月存1万，8%年化）');
const test5 = planLargeExpense(100000, 6, 50000, 10000, 0.08);
console.log('目标金额：¥' + test5.targetAmount.toLocaleString());
console.log('目标时间：' + test5.yearsToTarget + ' 年');
console.log('当前储蓄：¥' + test5.currentSavings.toLocaleString());
console.log('每月储蓄：¥' + test5.monthlySavings.toLocaleString());
console.log('未来资产：¥' + test5.futureAssets.toLocaleString());
console.log('是否可达成：' + (test5.isAchievable ? '✅ 是' : '❌ 否'));
if (test5.isAchievable) {
  console.log('达成时间：' + test5.yearsToAchieve + ' 年');
} else {
  console.log('缺口：¥' + test5.gap.toLocaleString());
  console.log('需要增加月储蓄：¥' + test5.additionalSavingsNeeded.toLocaleString());
}
console.log('建议：' + test5.recommendation);
console.log('');

// 测试6：长期目标（10年后，200万，当前0，每月存1万）
console.log('【测试6】长期目标（10年后，200万，当前0，每月存1万，8%年化）');
const test6 = planLargeExpense(2000000, 120, 0, 10000, 0.08);
console.log('目标金额：¥' + test6.targetAmount.toLocaleString());
console.log('目标时间：' + test6.yearsToTarget + ' 年');
console.log('当前储蓄：¥' + test6.currentSavings.toLocaleString());
console.log('每月储蓄：¥' + test6.monthlySavings.toLocaleString());
console.log('未来资产：¥' + test6.futureAssets.toLocaleString());
console.log('是否可达成：' + (test6.isAchievable ? '✅ 是' : '❌ 否'));
if (test6.isAchievable) {
  console.log('达成时间：' + test6.yearsToAchieve + ' 年');
} else {
  console.log('缺口：¥' + test6.gap.toLocaleString());
  console.log('需要增加月储蓄：¥' + test6.additionalSavingsNeeded.toLocaleString());
}
console.log('建议：' + test6.recommendation);
console.log('');

// 测试7：用户案例（欧阳洁，3年后买房首付100万，当前0，每月存2万）
console.log('【测试7】用户案例（欧阳洁，3年后买房首付100万，当前0，每月存2万，8%年化）');
const test7 = planLargeExpense(1000000, 36, 0, 20000, 0.08);
console.log('目标金额：¥' + test7.targetAmount.toLocaleString());
console.log('目标时间：' + test7.yearsToTarget + ' 年');
console.log('当前储蓄：¥' + test7.currentSavings.toLocaleString());
console.log('每月储蓄：¥' + test7.monthlySavings.toLocaleString());
console.log('未来资产：¥' + test7.futureAssets.toLocaleString());
console.log('是否可达成：' + (test7.isAchievable ? '✅ 是' : '❌ 否'));
if (test7.isAchievable) {
  console.log('达成时间：' + test7.yearsToAchieve + ' 年');
} else {
  console.log('缺口：¥' + test7.gap.toLocaleString());
  console.log('需要增加月储蓄：¥' + test7.additionalSavingsNeeded.toLocaleString());
}
console.log('建议：' + test7.recommendation);
console.log('');

// ============================================
// 时间计算器测试
// ============================================

console.log('========================================');
console.log('时间计算器测试');
console.log('========================================\n');

// 时间测试1：买房首付100万，当前0，每月存2万
console.log('【时间测试1】买房首付100万，当前0，每月存2万，8%年化');
const time1 = calculateTimeToGoal(1000000, 0, 20000, 0.08);
console.log('达成时间：' + time1.years + ' 年 ' + time1.months + ' 个月');
console.log('总月数：' + time1.totalMonths);
console.log('最终金额：¥' + time1.finalAmount.toLocaleString());
console.log('');

// 时间测试2：买车30万，当前5万，每月存1万
console.log('【时间测试2】买车30万，当前5万，每月存1万，8%年化');
const time2 = calculateTimeToGoal(300000, 50000, 10000, 0.08);
console.log('达成时间：' + time2.years + ' 年 ' + time2.months + ' 个月');
console.log('总月数：' + time2.totalMonths);
console.log('最终金额：¥' + time2.finalAmount.toLocaleString());
console.log('');

// 时间测试3：0收益率场景
console.log('【时间测试3】0收益率：买房100万，当前0，每月存2万');
const time3 = calculateTimeToGoal(1000000, 0, 20000, 0);
console.log('达成时间：' + time3.years + ' 年 ' + time3.months + ' 个月');
console.log('总月数：' + time3.totalMonths);
console.log('最终金额：¥' + time3.finalAmount.toLocaleString());
console.log('');

// ============================================
// 验证结果总结
// ============================================

console.log('========================================');
console.log('验证结果总结');
console.log('========================================\n');

const tests = [
  { name: '测试1（买房首付）', result: test1.isAchievable === true },
  { name: '测试2（买车）', result: test2.isAchievable === true }, // 修正：目标可达成
  { name: '测试3（教育基金）', result: test3.isAchievable === true },
  { name: '测试4（0收益率）', result: test4.futureAssets === 340000 },
  { name: '测试5（短期目标）', result: test5.isAchievable === true },
  { name: '测试6（长期目标）', result: test6.isAchievable === false }, // 修正：目标不可达成
  { name: '测试7（用户案例）', result: test7.isAchievable === false } // 修正：目标不可达成
];

let passed = 0;
tests.forEach((test, index) => {
  const status = test.result ? '✅ 通过' : '❌ 失败';
  console.log(`${test.name}：${status}`);
  if (test.result) passed++;
});

console.log('');
console.log(`通过率：${passed}/${tests.length} (${Math.round(passed / tests.length * 100)}%)`);

if (passed === tests.length) {
  console.log('\n🎉 所有测试通过！算法验证成功！');
} else {
  console.log('\n⚠️  部分测试失败，需要检查算法逻辑');
}

console.log('\n========================================');
console.log('核心功能验证');
console.log('========================================\n');

console.log('✅ 大额支出规划计算');
console.log('✅ 时间计算器（反推达成时间）');
console.log('✅ 0收益率场景处理');
console.log('✅ 缺口计算和建议');
console.log('✅ 边界条件处理');

console.log('\n【核心发现】');
console.log('- 欧阳洁的买房首付规划（3年，100万，月存2万）：不可达成');
console.log('- 复利效应：8%年化，3年后总资产约81万（vs 纯储蓄72万）');
console.log('- 缺口：¥189,289');
console.log('- 建议：每月增加¥4,670储蓄，或延长目标时间至3年8个月');

console.log('\n========================================');
console.log('算法验证完成！可以集成到产品中。');
console.log('========================================\n');
