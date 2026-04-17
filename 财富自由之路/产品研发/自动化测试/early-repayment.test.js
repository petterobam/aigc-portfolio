/**
 * 提前还款计算器 - 自动化测试
 * 
 * 验证提前还款计算算法的正确性
 */

// ==================== 提前还款计算器算法 ====================

function calculateEarlyRepayment(config) {
  const {
    loanAmount,           // 贷款总额
    annualRate,           // 年利率
    totalMonths,          // 总期数（月）
    prepaidAmount,        // 提前还款金额
    prepaidMonth,         // 提前还款时间（第几个月）
    repaymentType = 'reduce-months' // 还款方式：reduce-months（减少期数）或 reduce-amount（减少月供）
  } = config;
  
  const monthlyRate = annualRate / 12;
  
  // 计算原月供（等额本息）
  const originalMonthlyPayment = loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
    (Math.pow(1 + monthlyRate, totalMonths) - 1);
  
  // 计算提前还款时的剩余本金
  const paidMonths = prepaidMonth;
  let remainingPrincipal = loanAmount;
  
  for (let i = 0; i < paidMonths; i++) {
    const interest = remainingPrincipal * monthlyRate;
    const principal = originalMonthlyPayment - interest;
    remainingPrincipal -= principal;
  }
  
  // 提前还款后的剩余本金
  const newPrincipal = remainingPrincipal - prepaidAmount;
  
  // 计算节省的利息
  const originalTotalPayment = originalMonthlyPayment * totalMonths;
  
  let newTotalPayment, savedInterest, newMonths;
  
  if (repaymentType === 'reduce-months') {
    // 减少期数：月供不变，期数减少
    newMonths = Math.ceil(
      Math.log(originalMonthlyPayment / (originalMonthlyPayment - newPrincipal * monthlyRate)) / 
      Math.log(1 + monthlyRate)
    );
    newTotalPayment = (originalMonthlyPayment * paidMonths) + prepaidAmount + (originalMonthlyPayment * newMonths);
    savedInterest = originalTotalPayment - newTotalPayment;
  } else {
    // 减少月供：期数不变，月供减少
    const newMonthlyPayment = newPrincipal * 
      (monthlyRate * Math.pow(1 + monthlyRate, totalMonths - paidMonths)) / 
      (Math.pow(1 + monthlyRate, totalMonths - paidMonths) - 1);
    newMonths = totalMonths - paidMonths;
    newTotalPayment = (originalMonthlyPayment * paidMonths) + prepaidAmount + (newMonthlyPayment * newMonths);
    savedInterest = originalTotalPayment - newTotalPayment;
  }
  
  return {
    originalMonthlyPayment,
    originalTotalPayment,
    remainingPrincipal,
    newPrincipal,
    savedInterest,
    newMonths,
    prepaidMonth
  };
}

// ==================== 测试用例 ====================

console.log('测试提前还款计算器算法...\n');

// 测试 1: 基础提前还款
test('基础提前还款 - 贷款100万，年化5%，30年，第12个月提前还10万', () => {
  const result = calculateEarlyRepayment({
    loanAmount: 1000000,
    annualRate: 0.05,
    totalMonths: 360,
    prepaidAmount: 100000,
    prepaidMonth: 12,
    repaymentType: 'reduce-months'
  });
  
  expect(result.originalMonthlyPayment).toBeCloseTo(5368.22, 0);
  expect(result.remainingPrincipal).toBeGreaterThan(980000);
  expect(result.newPrincipal).toBeGreaterThan(880000);
  expect(result.savedInterest).toBeGreaterThan(0);
});

// 测试 2: 大额提前还款
test('大额提前还款 - 贷款100万，年化5%，30年，第60个月提前还50万', () => {
  const result = calculateEarlyRepayment({
    loanAmount: 1000000,
    annualRate: 0.05,
    totalMonths: 360,
    prepaidAmount: 500000,
    prepaidMonth: 60,
    repaymentType: 'reduce-months'
  });
  
  expect(result.savedInterest).toBeGreaterThan(200000);
});

// 测试 3: 早期提前还款
test('早期提前还款 - 第6个月提前还款', () => {
  const result = calculateEarlyRepayment({
    loanAmount: 1000000,
    annualRate: 0.05,
    totalMonths: 360,
    prepaidAmount: 100000,
    prepaidMonth: 6,
    repaymentType: 'reduce-months'
  });
  
  expect(result.remainingPrincipal).toBeGreaterThan(980000);
  expect(result.savedInterest).toBeGreaterThan(50000);
});

// 测试 4: 后期提前还款
test('后期提前还款 - 第120个月提前还款', () => {
  const result = calculateEarlyRepayment({
    loanAmount: 1000000,
    annualRate: 0.05,
    totalMonths: 360,
    prepaidAmount: 100000,
    prepaidMonth: 120,
    repaymentType: 'reduce-months'
  });
  
  // 后期提前还款节省的利息较少
  expect(result.savedInterest).toBeGreaterThan(0);
});

// 测试 5: 高利率贷款
test('高利率贷款 - 年化8%', () => {
  const result = calculateEarlyRepayment({
    loanAmount: 1000000,
    annualRate: 0.08,
    totalMonths: 360,
    prepaidAmount: 100000,
    prepaidMonth: 12,
    repaymentType: 'reduce-months'
  });
  
  // 高利率下提前还款节省更多利息
  expect(result.savedInterest).toBeGreaterThan(100000);
});

console.log('\n✨ 提前还款计算器测试完成！');
