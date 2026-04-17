/**
 * 复利计算器 - 自动化测试
 * 
 * 验证复利计算器算法的正确性
 */

// ==================== 复利计算器核心算法 ====================

function calculateCompoundInterest(principal, monthlyContribution, years, annualRate) {
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  
  let totalFuture, principalFuture, contributionFuture;
  
  // 处理收益率为0的特殊情况
  if (annualRate === 0) {
    principalFuture = principal;
    contributionFuture = monthlyContribution * months;
    totalFuture = principalFuture + contributionFuture;
  } else {
    // 本金的复利
    principalFuture = principal * Math.pow(1 + monthlyRate, months);
    
    // 每月定投的复利（年金终值公式）
    contributionFuture = monthlyContribution * 
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    
    totalFuture = principalFuture + contributionFuture;
  }
  
  const totalContribution = principal + (monthlyContribution * months);
  const totalInterest = totalFuture - totalContribution;
  
  return {
    totalFuture,
    principalFuture,
    contributionFuture,
    totalContribution,
    totalInterest,
    years
  };
}

// ==================== 测试用例 ====================

console.log('测试复利计算器算法...\n');

// 测试 1: 基础复利计算
test('基础复利计算 - 本金10万，年化8%，10年', () => {
  const result = calculateCompoundInterest(100000, 0, 10, 0.08);
  expect(result.totalFuture).toBeCloseTo(221964.02, 0);
  expect(result.principalFuture).toBeCloseTo(221964.02, 0);
  expect(result.contributionFuture).toBe(0);
  expect(result.totalInterest).toBeCloseTo(121964.02, 0);
});

// 测试 2: 定投复利计算（月复利公式）
test('定投复利计算 - 本金0，每月定投1000，年化8%，10年', () => {
  const result = calculateCompoundInterest(0, 1000, 10, 0.08);
  // 月复利公式：FV = PMT × ((1+r)^n - 1) / r = 182946.04
  expect(result.totalFuture).toBeCloseTo(182946.04, 0);
  expect(result.principalFuture).toBe(0);
  expect(result.contributionFuture).toBeCloseTo(182946.04, 0);
  expect(result.totalContribution).toBe(120000);
  expect(result.totalInterest).toBeCloseTo(62946.04, 0);
});

// 测试 3: 本金+定投组合（月复利公式）
test('组合复利计算 - 本金10万+每月定投1000，年化8%，10年', () => {
  const result = calculateCompoundInterest(100000, 1000, 10, 0.08);
  // 本金复利 + 定投复利
  expect(result.totalFuture).toBeCloseTo(404910.06, 0);
  expect(result.totalContribution).toBe(220000);
  expect(result.totalInterest).toBeCloseTo(184910.06, 0);
});

// 测试 4: 零收益率
test('零收益率 - 本金10万，每月定投1000，年化0%，10年', () => {
  const result = calculateCompoundInterest(100000, 1000, 10, 0);
  expect(result.totalFuture).toBe(220000);
  expect(result.totalInterest).toBe(0);
});

// 测试 5: 大额本金长期投资
test('大额长期投资 - 本金50万，每月定投5000，年化10%，20年', () => {
  const result = calculateCompoundInterest(500000, 5000, 20, 0.10);
  expect(result.totalFuture).toBeGreaterThan(5000000);
  expect(result.totalContribution).toBe(1700000);
});

// 测试 6: 边界条件 - 零本金零定投
test('边界条件 - 零本金零定投', () => {
  const result = calculateCompoundInterest(0, 0, 10, 0.08);
  expect(result.totalFuture).toBe(0);
  expect(result.totalInterest).toBe(0);
});

// 测试 7: 边界条件 - 零年数
test('边界条件 - 零年数', () => {
  const result = calculateCompoundInterest(100000, 1000, 0, 0.08);
  expect(result.totalFuture).toBeCloseTo(100000, 0);
  expect(result.totalContribution).toBe(100000);
});

// 测试 8: 高收益率验证（月复利公式）
test('高收益率 - 本金10万，年化15%，5年', () => {
  const result = calculateCompoundInterest(100000, 0, 5, 0.15);
  // 月复利：本金 × (1 + 月利率)^月数 = 210718.13
  expect(result.totalFuture).toBeCloseTo(210718.13, 0);
  expect(result.totalInterest).toBeGreaterThan(100000);
});

console.log('\n✨ 复利计算器测试完成！');
