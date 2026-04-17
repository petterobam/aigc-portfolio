/**
 * 财务自由时间路径 - 自动化测试
 * 
 * 验证财务自由时间计算算法的正确性
 */

// ==================== 财务自由时间路径算法 ====================

function calculateFreedomTimeline(config) {
  const {
    currentNetWorth,      // 当前净资产
    monthlyIncome,        // 月收入
    monthlyExpense,       // 月支出
    annualReturn = 0.08,  // 年化收益率（默认8%）
    securityMultiplier = 150, // 财务安全倍数
    freedomMultiplier = 150   // 财务自由倍数
  } = config;
  
  const monthlySavings = monthlyIncome - monthlyExpense;
  const savingsRate = (monthlySavings / monthlyIncome) * 100;
  
  // 三阶段目标
  const stage1 = {
    name: '财务保障',
    target: monthlyExpense * 6, // 6个月支出
    description: '拥有6个月生活储备金'
  };
  
  const stage2 = {
    name: '财务安全',
    target: monthlyExpense * securityMultiplier, // ×150
    description: '靠利息覆盖基本生活支出'
  };
  
  const stage3 = {
    name: '财务自由',
    target: monthlyExpense * 2 * freedomMultiplier, // 假设梦想生活是基本生活的2倍
    description: '靠利息实现梦想生活'
  };
  
  // 计算每个阶段的达成时间（简化版，不考虑复利）
  const calculateTimeToTarget = (target) => {
    if (currentNetWorth >= target) return 0;
    
    const gap = target - currentNetWorth;
    const months = Math.ceil(gap / monthlySavings);
    return months;
  };
  
  return {
    currentNetWorth,
    monthlyIncome,
    monthlyExpense,
    monthlySavings,
    savingsRate,
    stages: [
      { ...stage1, monthsToReach: calculateTimeToTarget(stage1.target) },
      { ...stage2, monthsToReach: calculateTimeToTarget(stage2.target) },
      { ...stage3, monthsToReach: calculateTimeToTarget(stage3.target) }
    ]
  };
}

// ==================== 测试用例 ====================

console.log('测试财务自由时间路径算法...\n');

// 测试 1: 基础场景
test('基础场景 - 月收入30k，月支出10k，净资产0', () => {
  const result = calculateFreedomTimeline({
    currentNetWorth: 0,
    monthlyIncome: 30000,
    monthlyExpense: 10000
  });
  
  expect(result.monthlySavings).toBe(20000);
  expect(result.savingsRate).toBeCloseTo(66.7, 0);
  
  // 财务保障：6万 ÷ 2万 = 3个月
  expect(result.stages[0].monthsToReach).toBe(3);
  
  // 财务安全：150万 ÷ 2万 = 75个月
  expect(result.stages[1].monthsToReach).toBe(75);
  
  // 财务自由：300万 ÷ 2万 = 150个月
  expect(result.stages[2].monthsToReach).toBe(150);
});

// 测试 2: 已有储备金
test('已有储备金 - 月收入30k，月支出10k，净资产6万', () => {
  const result = calculateFreedomTimeline({
    currentNetWorth: 60000,
    monthlyIncome: 30000,
    monthlyExpense: 10000
  });
  
  // 财务保障：已完成
  expect(result.stages[0].monthsToReach).toBe(0);
  
  // 财务安全：(150万 - 6万) ÷ 2万 = 72个月
  expect(result.stages[1].monthsToReach).toBe(72);
});

// 测试 3: 已达财务安全
test('已达财务安全 - 净资产150万', () => {
  const result = calculateFreedomTimeline({
    currentNetWorth: 1500000,
    monthlyIncome: 30000,
    monthlyExpense: 10000
  });
  
  expect(result.stages[0].monthsToReach).toBe(0);
  expect(result.stages[1].monthsToReach).toBe(0);
  
  // 财务自由：(300万 - 150万) ÷ 2万 = 75个月
  expect(result.stages[2].monthsToReach).toBe(75);
});

// 测试 4: 低储蓄率
test('低储蓄率 - 月收入20k，月支出18k', () => {
  const result = calculateFreedomTimeline({
    currentNetWorth: 0,
    monthlyIncome: 20000,
    monthlyExpense: 18000
  });
  
  expect(result.monthlySavings).toBe(2000);
  expect(result.savingsRate).toBe(10);
  
  // 财务保障：10.8万 ÷ 2千 = 54个月
  expect(result.stages[0].monthsToReach).toBe(54);
});

// 测试 5: 边界条件 - 零支出
test('边界条件 - 零支出（理论上不可能）', () => {
  const result = calculateFreedomTimeline({
    currentNetWorth: 0,
    monthlyIncome: 30000,
    monthlyExpense: 0
  });
  
  expect(result.monthlySavings).toBe(30000);
  expect(result.savingsRate).toBe(100);
  
  // 所有目标都是0（因为月支出为0）
  expect(result.stages[0].target).toBe(0);
  expect(result.stages[1].target).toBe(0);
});

// 测试 6: 高收入场景
test('高收入场景 - 月收入50k，月支出15k', () => {
  const result = calculateFreedomTimeline({
    currentNetWorth: 0,
    monthlyIncome: 50000,
    monthlyExpense: 15000
  });
  
  expect(result.monthlySavings).toBe(35000);
  expect(result.savingsRate).toBe(70);
  
  // 财务保障：9万 ÷ 3.5万 ≈ 3个月
  expect(result.stages[0].monthsToReach).toBe(3);
  
  // 财务安全：225万 ÷ 3.5万 ≈ 65个月
  expect(result.stages[1].monthsToReach).toBe(65);
});

console.log('\n✨ 财务自由时间路径测试完成！');
