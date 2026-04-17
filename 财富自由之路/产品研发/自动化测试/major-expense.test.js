/**
 * 大额支出规划 - 自动化测试
 * 
 * 验证大额支出规划算法的正确性
 */

// ==================== 大额支出规划算法 ====================

function planMajorExpense(config) {
  const {
    currentSavings,       // 当前储蓄
    monthlySavings,       // 每月储蓄
    expenseAmount,        // 大额支出金额
    expenseDate,          // 支出日期（月数）
    annualReturn = 0.08   // 年化收益率
  } = config;
  
  const monthlyRate = annualReturn / 12;
  
  // 计算到支出日期时的储蓄总额
  let futureSavings;
  if (annualReturn === 0) {
    futureSavings = currentSavings + (monthlySavings * expenseDate);
  } else {
    const currentGrowth = currentSavings * Math.pow(1 + monthlyRate, expenseDate);
    const contributionGrowth = monthlySavings * 
      ((Math.pow(1 + monthlyRate, expenseDate) - 1) / monthlyRate);
    futureSavings = currentGrowth + contributionGrowth;
  }
  
  // 判断是否足够
  const sufficient = futureSavings >= expenseAmount;
  const gap = sufficient ? 0 : expenseAmount - futureSavings;
  
  // 计算需要增加的月储蓄
  const additionalMonthlyNeeded = sufficient ? 0 : gap / expenseDate;
  
  return {
    futureSavings,
    expenseAmount,
    sufficient,
    gap,
    additionalMonthlyNeeded,
    monthsUntilExpense: expenseDate
  };
}

// ==================== 测试用例 ====================

console.log('测试大额支出规划算法...\n');

// 测试 1: 足够储蓄
test('足够储蓄 - 当前10万，每月存1万，12个月后支出15万', () => {
  const result = planMajorExpense({
    currentSavings: 100000,
    monthlySavings: 10000,
    expenseAmount: 150000,
    expenseDate: 12,
    annualReturn: 0
  });
  
  expect(result.futureSavings).toBe(220000);
  expect(result.sufficient).toBe(true);
  expect(result.gap).toBe(0);
  expect(result.additionalMonthlyNeeded).toBe(0);
});

// 测试 2: 储蓄不足
test('储蓄不足 - 当前5万，每月存5000，12个月后支出15万', () => {
  const result = planMajorExpense({
    currentSavings: 50000,
    monthlySavings: 5000,
    expenseAmount: 150000,
    expenseDate: 12,
    annualReturn: 0
  });
  
  expect(result.futureSavings).toBe(110000);
  expect(result.sufficient).toBe(false);
  expect(result.gap).toBe(40000);
  expect(result.additionalMonthlyNeeded).toBeCloseTo(3333.33, 0);
});

// 测试 3: 考虑复利
test('考虑复利 - 当前10万，每月存1万，年化8%，12个月后', () => {
  const result = planMajorExpense({
    currentSavings: 100000,
    monthlySavings: 10000,
    expenseAmount: 200000,
    expenseDate: 12,
    annualReturn: 0.08
  });
  
  expect(result.futureSavings).toBeGreaterThan(220000);
  expect(result.sufficient).toBe(true);
});

// 测试 4: 刚好够用
test('刚好够用 - 当前0，每月存1万，12个月后支出12万', () => {
  const result = planMajorExpense({
    currentSavings: 0,
    monthlySavings: 10000,
    expenseAmount: 120000,
    expenseDate: 12,
    annualReturn: 0
  });
  
  expect(result.futureSavings).toBe(120000);
  expect(result.sufficient).toBe(true);
  expect(result.gap).toBe(0);
});

// 测试 5: 长期规划
test('长期规划 - 当前0，每月存5000，60个月后支出40万', () => {
  const result = planMajorExpense({
    currentSavings: 0,
    monthlySavings: 5000,
    expenseAmount: 400000,
    expenseDate: 60,
    annualReturn: 0
  });
  
  expect(result.futureSavings).toBe(300000);
  expect(result.sufficient).toBe(false);
  expect(result.gap).toBe(100000);
  expect(result.additionalMonthlyNeeded).toBeCloseTo(1666.67, 0);
});

// 测试 6: 边界条件 - 零支出
test('边界条件 - 零支出', () => {
  const result = planMajorExpense({
    currentSavings: 100000,
    monthlySavings: 10000,
    expenseAmount: 0,
    expenseDate: 12,
    annualReturn: 0.08
  });
  
  expect(result.sufficient).toBe(true);
  expect(result.gap).toBe(0);
});

console.log('\n✨ 大额支出规划测试完成！');
