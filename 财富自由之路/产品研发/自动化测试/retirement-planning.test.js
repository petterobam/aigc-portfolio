/**
 * 退休规划工具 - 自动化测试
 * 
 * 验证退休规划算法的正确性
 */

// ==================== 退休规划算法 ====================

function calculateRetirement(config) {
  const {
    currentAge,            // 当前年龄
    retirementAge,         // 退休年龄
    currentSavings,        // 当前储蓄
    monthlySavings,        // 每月储蓄
    monthlyExpenseAtRetirement, // 退休后月支出
    annualReturn = 0.08,   // 年化收益率
    inflationRate = 0.03   // 通货膨胀率
  } = config;
  
  const yearsToRetirement = retirementAge - currentAge;
  const monthsToRetirement = yearsToRetirement * 12;
  
  const monthlyRate = annualReturn / 12;
  const monthlyInflation = inflationRate / 12;
  
  // 计算退休时的储蓄总额
  let savingsAtRetirement;
  if (annualReturn === 0) {
    savingsAtRetirement = currentSavings + (monthlySavings * monthsToRetirement);
  } else {
    const currentGrowth = currentSavings * Math.pow(1 + monthlyRate, monthsToRetirement);
    const contributionGrowth = monthlySavings * 
      ((Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / monthlyRate);
    savingsAtRetirement = currentGrowth + contributionGrowth;
  }
  
  // 计算考虑通胀后的退休支出
  const inflatedExpense = monthlyExpenseAtRetirement * 
    Math.pow(1 + inflationRate, yearsToRetirement);
  
  // 计算退休所需资金（基于4%法则：年支出×25）
  const requiredSavings = inflatedExpense * 12 * 25;
  
  // 判断是否足够
  const sufficient = savingsAtRetirement >= requiredSavings;
  const gap = sufficient ? 0 : requiredSavings - savingsAtRetirement;
  
  // 计算需要增加的月储蓄
  const additionalMonthlyNeeded = sufficient ? 0 : gap / monthsToRetirement;
  
  // 计算退休后可支撑的月数（假设退休后也保持投资收益）
  const monthlyWithdrawal = inflatedExpense;
  const monthsSupported = Math.log(1 + (savingsAtRetirement * monthlyRate / monthlyWithdrawal)) / 
    Math.log(1 + monthlyRate);
  
  return {
    yearsToRetirement,
    savingsAtRetirement,
    inflatedExpense,
    requiredSavings,
    sufficient,
    gap,
    additionalMonthlyNeeded,
    monthsSupported: isFinite(monthsSupported) ? Math.floor(monthsSupported) : Infinity
  };
}

// ==================== 测试用例 ====================

console.log('测试退休规划工具算法...\n');

// 测试 1: 基础退休规划
test('基础退休规划 - 30岁，60岁退休，当前储蓄10万，每月存1万，退休后月支出1万', () => {
  const result = calculateRetirement({
    currentAge: 30,
    retirementAge: 60,
    currentSavings: 100000,
    monthlySavings: 10000,
    monthlyExpenseAtRetirement: 10000,
    annualReturn: 0.08,
    inflationRate: 0.03
  });
  
  expect(result.yearsToRetirement).toBe(30);
  expect(result.savingsAtRetirement).toBeGreaterThan(10000000);
  expect(result.inflatedExpense).toBeGreaterThan(10000);
  // 退休时储蓄约1600万，通胀后月支出约2.4万，支撑约253个月（21年）
  expect(result.monthsSupported).toBeGreaterThan(200);
});

// 测试 2: 临近退休
test('临近退休 - 55岁，60岁退休', () => {
  const result = calculateRetirement({
    currentAge: 55,
    retirementAge: 60,
    currentSavings: 1000000,
    monthlySavings: 5000,
    monthlyExpenseAtRetirement: 10000,
    annualReturn: 0.08,
    inflationRate: 0.03
  });
  
  expect(result.yearsToRetirement).toBe(5);
  expect(result.savingsAtRetirement).toBeGreaterThan(1000000);
});

// 测试 3: 储蓄不足
test('储蓄不足 - 需要增加月储蓄', () => {
  const result = calculateRetirement({
    currentAge: 40,
    retirementAge: 60,
    currentSavings: 100000,
    monthlySavings: 2000,
    monthlyExpenseAtRetirement: 15000,
    annualReturn: 0.06,
    inflationRate: 0.03
  });
  
  expect(result.sufficient).toBe(false);
  expect(result.gap).toBeGreaterThan(0);
  expect(result.additionalMonthlyNeeded).toBeGreaterThan(0);
});

// 测试 4: 已达退休年龄
test('已达退休年龄 - 60岁', () => {
  const result = calculateRetirement({
    currentAge: 60,
    retirementAge: 60,
    currentSavings: 5000000,
    monthlySavings: 0,
    monthlyExpenseAtRetirement: 10000,
    annualReturn: 0.08,
    inflationRate: 0.03
  });
  
  expect(result.yearsToRetirement).toBe(0);
  expect(result.savingsAtRetirement).toBe(5000000);
  expect(result.inflatedExpense).toBe(10000);
});

// 测试 5: 高通胀影响
test('高通胀影响 - 通胀5%', () => {
  const result = calculateRetirement({
    currentAge: 30,
    retirementAge: 60,
    currentSavings: 100000,
    monthlySavings: 10000,
    monthlyExpenseAtRetirement: 10000,
    annualReturn: 0.08,
    inflationRate: 0.05
  });
  
  // 高通胀下，退休支出大幅增加
  expect(result.inflatedExpense).toBeGreaterThan(40000);
  expect(result.requiredSavings).toBeGreaterThan(10000000);
});

// 测试 6: 零储蓄零月存
test('边界条件 - 零储蓄零月存', () => {
  const result = calculateRetirement({
    currentAge: 30,
    retirementAge: 60,
    currentSavings: 0,
    monthlySavings: 0,
    monthlyExpenseAtRetirement: 10000,
    annualReturn: 0.08,
    inflationRate: 0.03
  });
  
  expect(result.savingsAtRetirement).toBe(0);
  expect(result.sufficient).toBe(false);
  expect(result.gap).toBeGreaterThan(0);
});

// 测试 7: 低收益率
test('低收益率 - 年化4%', () => {
  const result = calculateRetirement({
    currentAge: 30,
    retirementAge: 60,
    currentSavings: 100000,
    monthlySavings: 10000,
    monthlyExpenseAtRetirement: 10000,
    annualReturn: 0.04,
    inflationRate: 0.03
  });
  
  // 低收益率下，储蓄增长较慢
  expect(result.savingsAtRetirement).toBeLessThan(8000000);
});

console.log('\n✨ 退休规划工具测试完成！');
