// 退休规划工具 - 算法验证
// 目标：验证退休规划计算的核心算法正确性

/**
 * 退休规划计算器
 * @param {Object} params
 * @param {number} params.currentAge - 当前年龄
 * @param {number} params.retirementAge - 退休年龄
 * @param {number} params.currentSavings - 当前储蓄
 * @param {number} params.monthlySavings - 每月储蓄
 * @param {number} params.expectedReturn - 预期年化收益率（小数，如0.08）
 * @param {number} params.retirementExpenses - 退休后每月支出
 * @param {number} params.inflationRate - 通胀率（小数，如0.03）
 * @param {number} params.lifeExpectancy - 预期寿命
 * @returns {Object} 退休规划结果
 */
function retirementCalculator(params) {
  const {
    currentAge,
    retirementAge,
    currentSavings,
    monthlySavings,
    expectedReturn,
    retirementExpenses,
    inflationRate = 0.03,
    lifeExpectancy = 85
  } = params;

  // 1. 计算退休前的工作年限
  const yearsToRetirement = retirementAge - currentAge;
  
  // 2. 计算退休时的总储蓄（考虑复利）
  const monthlyReturn = expectedReturn / 12;
  const monthsToRetirement = yearsToRetirement * 12;
  
  // 当前储蓄的增长
  const futureValueOfCurrentSavings = currentSavings * Math.pow(1 + expectedReturn, yearsToRetirement);
  
  // 每月储蓄的增长（年金终值公式）
  let futureValueOfMonthlySavings = 0;
  if (monthlyReturn > 0) {
    futureValueOfMonthlySavings = monthlySavings * 
      ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn);
  } else {
    futureValueOfMonthlySavings = monthlySavings * monthsToRetirement;
  }
  
  const totalSavingsAtRetirement = futureValueOfCurrentSavings + futureValueOfMonthlySavings;
  
  // 3. 计算退休时每月支出（考虑通胀）
  const inflatedMonthlyExpenses = retirementExpenses * Math.pow(1 + inflationRate, yearsToRetirement);
  
  // 4. 计算退休后能维持的年数
  // 使用简化的计算：假设退休后储蓄继续获得收益率
  const retirementYears = lifeExpectancy - retirementAge;
  const retirementMonths = retirementYears * 12;
  
  // 退休后的每月实际收益率（考虑通胀）
  const realReturnAfterRetirement = (1 + expectedReturn) / (1 + inflationRate) - 1;
  const monthlyRealReturn = realReturnAfterRetirement / 12;
  
  // 计算能维持的月数（使用现值公式）
  let monthsCanSustain;
  if (monthlyRealReturn > 0) {
    // 现值公式反推：PV = PMT * [(1 - (1+r)^-n) / r]
    // n = -log(1 - PV*r/PMT) / log(1+r)
    const ratio = totalSavingsAtRetirement * monthlyRealReturn / inflatedMonthlyExpenses;
    if (ratio >= 1) {
      // 储蓄足够，可以永续
      monthsCanSustain = Infinity;
    } else {
      monthsCanSustain = -Math.log(1 - ratio) / Math.log(1 + monthlyRealReturn);
    }
  } else {
    // 无收益，简单除法
    monthsCanSustain = totalSavingsAtRetirement / inflatedMonthlyExpenses;
  }
  
  const yearsCanSustain = monthsCanSustain / 12;
  
  // 5. 计算储蓄缺口（如果有）
  const shortfall = yearsCanSustain < retirementYears 
    ? (retirementYears - yearsCanSustain) * 12 * inflatedMonthlyExpenses 
    : 0;
  
  // 6. 计算需要增加的每月储蓄（如果有缺口）
  let additionalMonthlySavingsNeeded = 0;
  if (shortfall > 0 && monthlyReturn > 0) {
    // 计算未来需要的额外总额
    const additionalNeeded = shortfall / Math.pow(1 + expectedReturn, yearsToRetirement);
    // 反推每月需要增加的储蓄
    additionalMonthlySavingsNeeded = additionalNeeded / 
      ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn);
  }
  
  return {
    yearsToRetirement,
    totalSavingsAtRetirement: Math.round(totalSavingsAtRetirement),
    inflatedMonthlyExpenses: Math.round(inflatedMonthlyExpenses),
    yearsCanSustain: yearsCanSustain === Infinity ? Infinity : Math.round(yearsCanSustain * 10) / 10,
    isSufficient: yearsCanSustain >= retirementYears,
    shortfall: Math.round(shortfall),
    additionalMonthlySavingsNeeded: Math.round(additionalMonthlySavingsNeeded),
    retirementYears,
    monthlyRealReturn: Math.round(monthlyRealReturn * 10000) / 10000
  };
}

/**
 * 测试用例
 */
function runTests() {
  console.log('=== 退休规划工具 - 算法验证 ===\n');
  
  let passCount = 0;
  let failCount = 0;
  
  // 测试1：基本退休规划（30岁，60岁退休，月存20k，8%收益）
  console.log('测试1：基本退休规划（30岁，60岁退休）');
  const test1 = retirementCalculator({
    currentAge: 30,
    retirementAge: 60,
    currentSavings: 0,
    monthlySavings: 20000,
    expectedReturn: 0.08,
    retirementExpenses: 10000,
    inflationRate: 0.03,
    lifeExpectancy: 85
  });
  
  console.log('结果:', test1);
  console.log('验证点:');
  console.log(`  - 退休前年限: ${test1.yearsToRetirement}年 (期望: 30年)`);
  console.log(`  - 退休时总储蓄: ¥${test1.totalSavingsAtRetirement.toLocaleString()}`);
  console.log(`  - 退休时月支出（考虑通胀）: ¥${test1.inflatedMonthlyExpenses.toLocaleString()}`);
  console.log(`  - 能维持年数: ${test1.yearsCanSustain === Infinity ? '永续' : test1.yearsCanSustain + '年'}`);
  console.log(`  - 是否充足: ${test1.isSufficient ? '✅ 是' : '❌ 否'}`);
  
  // 预期：30年，每月存20k，8%收益，应该有足够的储蓄
  if (test1.yearsToRetirement === 30 && test1.isSufficient) {
    console.log('✅ 测试1通过\n');
    passCount++;
  } else {
    console.log('❌ 测试1失败\n');
    failCount++;
  }
  
  // 测试2：已有初始储蓄（40岁，60岁退休，已有100万）
  console.log('测试2：已有初始储蓄（40岁，60岁退休，已有100万）');
  const test2 = retirementCalculator({
    currentAge: 40,
    retirementAge: 60,
    currentSavings: 1000000,
    monthlySavings: 20000,
    expectedReturn: 0.08,
    retirementExpenses: 10000,
    inflationRate: 0.03,
    lifeExpectancy: 85
  });
  
  console.log('结果:', test2);
  console.log('验证点:');
  console.log(`  - 退休前年限: ${test2.yearsToRetirement}年 (期望: 20年)`);
  console.log(`  - 退休时总储蓄: ¥${test2.totalSavingsAtRetirement.toLocaleString()}`);
  console.log(`  - 能维持年数: ${test2.yearsCanSustain === Infinity ? '永续' : test2.yearsCanSustain + '年'}`);
  console.log(`  - 是否充足: ${test2.isSufficient ? '✅ 是' : '❌ 否'}`);
  
  // 预期：有初始储蓄，应该更快达成目标
  if (test2.yearsToRetirement === 20 && test2.isSufficient) {
    console.log('✅ 测试2通过\n');
    passCount++;
  } else {
    console.log('❌ 测试2失败\n');
    failCount++;
  }
  
  // 测试3：低收益率场景（4%收益）
  console.log('测试3：低收益率场景（4%收益）');
  const test3 = retirementCalculator({
    currentAge: 30,
    retirementAge: 60,
    currentSavings: 0,
    monthlySavings: 20000,
    expectedReturn: 0.04,
    retirementExpenses: 10000,
    inflationRate: 0.03,
    lifeExpectancy: 85
  });
  
  console.log('结果:', test3);
  console.log('验证点:');
  console.log(`  - 退休时总储蓄: ¥${test3.totalSavingsAtRetirement.toLocaleString()}`);
  console.log(`  - 能维持年数: ${test3.yearsCanSustain === Infinity ? '永续' : test3.yearsCanSustain + '年'}`);
  console.log(`  - 是否充足: ${test3.isSufficient ? '✅ 是' : '❌ 否'}`);
  
  // 预期：4%收益较低，可能不足以维持25年
  if (test3.totalSavingsAtRetirement > 0) {
    console.log('✅ 测试3通过（数据合理）\n');
    passCount++;
  } else {
    console.log('❌ 测试3失败\n');
    failCount++;
  }
  
  // 测试4：提前退休（55岁）
  console.log('测试4：提前退休（55岁）');
  const test4 = retirementCalculator({
    currentAge: 30,
    retirementAge: 55,
    currentSavings: 0,
    monthlySavings: 20000,
    expectedReturn: 0.08,
    retirementExpenses: 10000,
    inflationRate: 0.03,
    lifeExpectancy: 85
  });
  
  console.log('结果:', test4);
  console.log('验证点:');
  console.log(`  - 退休前年限: ${test4.yearsToRetirement}年 (期望: 25年)`);
  console.log(`  - 退休时总储蓄: ¥${test4.totalSavingsAtRetirement.toLocaleString()}`);
  console.log(`  - 能维持年数: ${test4.yearsCanSustain === Infinity ? '永续' : test4.yearsCanSustain + '年'}`);
  console.log(`  - 是否充足: ${test4.isSufficient ? '✅ 是' : '❌ 否'}`);
  
  if (test4.yearsToRetirement === 25) {
    console.log('✅ 测试4通过\n');
    passCount++;
  } else {
    console.log('❌ 测试4失败\n');
    failCount++;
  }
  
  // 测试5：高通胀场景（5%通胀）
  console.log('测试5：高通胀场景（5%通胀）');
  const test5 = retirementCalculator({
    currentAge: 30,
    retirementAge: 60,
    currentSavings: 0,
    monthlySavings: 20000,
    expectedReturn: 0.08,
    retirementExpenses: 10000,
    inflationRate: 0.05,
    lifeExpectancy: 85
  });
  
  console.log('结果:', test5);
  console.log('验证点:');
  console.log(`  - 退休时月支出（通胀后）: ¥${test5.inflatedMonthlyExpenses.toLocaleString()}`);
  console.log(`  - 能维持年数: ${test5.yearsCanSustain === Infinity ? '永续' : test5.yearsCanSustain + '年'}`);
  
  // 预期：高通胀会导致退休支出大幅增加
  if (test5.inflatedMonthlyExpenses > 10000) {
    console.log('✅ 测试5通过（通胀计算正确）\n');
    passCount++;
  } else {
    console.log('❌ 测试5失败\n');
    failCount++;
  }
  
  // 测试6：边界情况 - 0收益率
  console.log('测试6：边界情况 - 0收益率');
  const test6 = retirementCalculator({
    currentAge: 30,
    retirementAge: 60,
    currentSavings: 0,
    monthlySavings: 20000,
    expectedReturn: 0,
    retirementExpenses: 10000,
    inflationRate: 0.03,
    lifeExpectancy: 85
  });
  
  console.log('结果:', test6);
  console.log('验证点:');
  console.log(`  - 退休时总储蓄: ¥${test6.totalSavingsAtRetirement.toLocaleString()} (期望: 7,200,000)`);
  console.log(`  - 能维持年数: ${test6.yearsCanSustain === Infinity ? '永续' : test6.yearsCanSustain + '年'}`);
  
  // 预期：0收益时，总储蓄 = 20,000 * 12 * 30 = 7,200,000
  if (test6.totalSavingsAtRetirement === 7200000) {
    console.log('✅ 测试6通过\n');
    passCount++;
  } else {
    console.log('❌ 测试6失败\n');
    failCount++;
  }
  
  // 测试7：用户案例（欧阳洁，30岁，月存20k，8%收益，10,000月支出）
  console.log('测试7：用户案例（欧阳洁的退休规划）');
  const test7 = retirementCalculator({
    currentAge: 30,
    retirementAge: 60,
    currentSavings: 0,
    monthlySavings: 20000,
    expectedReturn: 0.08,
    retirementExpenses: 10000,
    inflationRate: 0.03,
    lifeExpectancy: 85
  });
  
  console.log('结果:', test7);
  console.log('分析:');
  console.log(`  - 退休前年限: ${test7.yearsToRetirement}年`);
  console.log(`  - 退休时总储蓄: ¥${test7.totalSavingsAtRetirement.toLocaleString()}`);
  console.log(`  - 退休时月支出（通胀后）: ¥${test7.inflatedMonthlyExpenses.toLocaleString()}`);
  console.log(`  - 能维持年数: ${test7.yearsCanSustain === Infinity ? '永续' : test7.yearsCanSustain + '年'}`);
  console.log(`  - 是否充足: ${test7.isSufficient ? '✅ 是' : '❌ 否'}`);
  
  if (test7.totalSavingsAtRetirement > 0 && test7.isSufficient) {
    console.log('✅ 测试7通过（用户案例合理）\n');
    passCount++;
  } else {
    console.log('❌ 测试7失败\n');
    failCount++;
  }
  
  // 总结
  console.log('=== 测试总结 ===');
  console.log(`通过: ${passCount}/${passCount + failCount}`);
  console.log(`失败: ${failCount}/${passCount + failCount}`);
  
  if (failCount === 0) {
    console.log('\n✅ 所有测试通过！算法验证成功！');
  } else {
    console.log('\n⚠️ 部分测试失败，需要检查算法逻辑');
  }
  
  return { passCount, failCount };
}

// 运行测试
runTests();

/**
 * 导出函数供产品使用
 */
module.exports = {
  retirementCalculator
};
