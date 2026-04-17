/**
 * 目标进度计算测试
 * 测试目标：验证财务自由三阶段目标进度计算、达成时间预测等核心逻辑
 * 创建时间：2026-03-25
 */

const assert = require('assert')

// 测试数据 - 财务自由三阶段目标
const mockGoals = [
  {
    id: '1',
    stage: 'security',
    name: '财务保障',
    targetAmount: 60000,
    currentAmount: 20000,
    monthlyContribution: 5000
  },
  {
    id: '2',
    stage: 'safety',
    name: '财务安全',
    targetAmount: 1500000,
    currentAmount: 100000,
    monthlyContribution: 10000,
    expectedReturn: 8
  },
  {
    id: '3',
    stage: 'freedom',
    name: '财务自由',
    targetAmount: 3000000,
    currentAmount: 0,
    monthlyContribution: 15000,
    expectedReturn: 10
  }
]

// 模拟计算逻辑
function calculateProgress(goal) {
  if (goal.targetAmount === 0) return 0
  return (goal.currentAmount / goal.targetAmount * 100).toFixed(2)
}

function calculateMonthsToReach(goal, expectedReturn = 0) {
  const { targetAmount, currentAmount, monthlyContribution } = goal
  
  // 如果已完成目标，返回0个月
  if (currentAmount >= targetAmount) return 0
  
  // 如果月投入为0且未完成，返回Infinity
  if (monthlyContribution === 0) return Infinity
  
  // 简化计算（不考虑复利）
  const remaining = targetAmount - currentAmount
  return Math.ceil(remaining / monthlyContribution)
}

function calculateMonthsWithCompound(goal) {
  const { targetAmount, currentAmount, monthlyContribution, expectedReturn = 0 } = goal
  
  if (monthlyContribution === 0) return Infinity
  if (currentAmount >= targetAmount) return 0
  
  // 考虑复利的计算（简化版）
  let balance = currentAmount
  let months = 0
  const monthlyRate = expectedReturn / 100 / 12
  
  while (balance < targetAmount && months < 1200) { // 最多100年
    balance = balance * (1 + monthlyRate) + monthlyContribution
    months++
  }
  
  return months
}

function getGoalByStage(goals, stage) {
  return goals.find(g => g.stage === stage) || null
}

function calculateOverallProgress(goals) {
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  
  if (totalTarget === 0) return 0
  return (totalCurrent / totalTarget * 100).toFixed(2)
}

function calculateRequiredMonthlySaving(targetAmount, currentAmount, months, expectedReturn = 0) {
  if (months <= 0) return 0
  
  const remaining = targetAmount - currentAmount
  if (remaining <= 0) return 0
  
  // 简化计算（不考虑复利）
  return Math.ceil(remaining / months)
}

// 测试用例
let testsPassed = 0
let testsFailed = 0

function test(description, fn) {
  try {
    fn()
    console.log(`  ✅ ${description}`)
    testsPassed++
  } catch (error) {
    console.log(`  ❌ ${description}`)
    console.log(`     错误: ${error.message}`)
    testsFailed++
  }
}

console.log('测试目标进度计算算法...\n')

// 测试 1: 财务保障进度
test('财务保障进度 - 2万/6万', () => {
  const goal = getGoalByStage(mockGoals, 'security')
  const progress = calculateProgress(goal)
  assert.strictEqual(progress, '33.33', '财务保障进度应为 33.33%')
})

// 测试 2: 财务安全进度
test('财务安全进度 - 10万/150万', () => {
  const goal = getGoalByStage(mockGoals, 'safety')
  const progress = calculateProgress(goal)
  assert.strictEqual(progress, '6.67', '财务安全进度应为 6.67%')
})

// 测试 3: 财务自由进度
test('财务自由进度 - 0/300万', () => {
  const goal = getGoalByStage(mockGoals, 'freedom')
  const progress = calculateProgress(goal)
  assert.strictEqual(progress, '0.00', '财务自由进度应为 0.00%')
})

// 测试 4: 财务保障达成时间（不考虑复利）
test('财务保障达成时间 - 8个月', () => {
  const goal = getGoalByStage(mockGoals, 'security')
  const months = calculateMonthsToReach(goal)
  assert.strictEqual(months, 8, '财务保障需8个月达成')
})

// 测试 5: 财务安全达成时间（不考虑复利）
test('财务安全达成时间 - 140个月', () => {
  const goal = getGoalByStage(mockGoals, 'safety')
  const months = calculateMonthsToReach(goal)
  assert.strictEqual(months, 140, '财务安全需140个月达成（约11.7年）')
})

// 测试 6: 财务自由达成时间（不考虑复利）
test('财务自由达成时间 - 200个月', () => {
  const goal = getGoalByStage(mockGoals, 'freedom')
  const months = calculateMonthsToReach(goal)
  assert.strictEqual(months, 200, '财务自由需200个月达成（约16.7年）')
})

// 测试 7: 总体进度
test('总体进度 - 三阶段合计', () => {
  const progress = calculateOverallProgress(mockGoals)
  assert.strictEqual(progress, '2.63', '总体进度应为 2.63%')
})

// 测试 8: 已完成目标
test('已完成目标 - 进度100%', () => {
  const completedGoal = {
    id: '1',
    stage: 'security',
    name: '财务保障',
    targetAmount: 60000,
    currentAmount: 60000,
    monthlyContribution: 0
  }
  
  const progress = calculateProgress(completedGoal)
  assert.strictEqual(progress, '100.00', '已完成目标进度应为 100.00%')
  
  const months = calculateMonthsToReach(completedGoal)
  assert.strictEqual(months, 0, '已完成目标需0个月')
})

// 测试 9: 超额完成目标
test('超额完成目标 - 进度>100%', () => {
  const exceededGoal = {
    id: '1',
    stage: 'security',
    name: '财务保障',
    targetAmount: 60000,
    currentAmount: 80000,
    monthlyContribution: 0
  }
  
  const progress = calculateProgress(exceededGoal)
  assert.strictEqual(progress, '133.33', '超额完成进度应为 133.33%')
})

// 测试 10: 边界条件 - 目标金额为0
test('边界条件 - 目标金额为0', () => {
  const zeroGoal = {
    id: '1',
    stage: 'security',
    name: '未设定',
    targetAmount: 0,
    currentAmount: 0,
    monthlyContribution: 0
  }
  
  const progress = calculateProgress(zeroGoal)
  assert.strictEqual(progress, 0, '目标为0时进度应为 0')
})

// 测试 11: 边界条件 - 月投入为0
test('边界条件 - 月投入为0', () => {
  const noContributionGoal = {
    id: '1',
    stage: 'security',
    name: '财务保障',
    targetAmount: 60000,
    currentAmount: 20000,
    monthlyContribution: 0
  }
  
  const months = calculateMonthsToReach(noContributionGoal)
  assert.strictEqual(months, Infinity, '月投入为0时需无限月')
})

// 测试 12: 计算所需月储蓄
test('计算所需月储蓄 - 12个月达成财务保障', () => {
  const goal = getGoalByStage(mockGoals, 'security')
  const required = calculateRequiredMonthlySaving(goal.targetAmount, goal.currentAmount, 12)
  assert.strictEqual(required, 3334, '12个月达成财务保障需月存 3,334 元')
})

// 测试 13: 计算所需月储蓄 - 60个月达成财务安全
test('计算所需月储蓄 - 60个月达成财务安全', () => {
  const goal = getGoalByStage(mockGoals, 'safety')
  const required = calculateRequiredMonthlySaving(goal.targetAmount, goal.currentAmount, 60)
  assert.strictEqual(required, 23334, '60个月达成财务安全需月存 23,334 元')
})

// 测试 14: 复利加速效果（简化测试）
test('复利加速效果 - 8%年化收益缩短时间', () => {
  const goal = getGoalByStage(mockGoals, 'safety')
  const monthsWithoutCompound = calculateMonthsToReach(goal)
  const monthsWithCompound = calculateMonthsWithCompound(goal)
  
  // 复利应该能缩短达成时间
  assert.ok(monthsWithCompound < monthsWithoutCompound, '复利应缩短达成时间')
  console.log(`     无复利: ${monthsWithoutCompound}个月, 有复利: ${monthsWithCompound}个月`)
})

// 测试 15: 三阶段优先级
test('三阶段优先级 - 保障→安全→自由', () => {
  const securityGoal = getGoalByStage(mockGoals, 'security')
  const safetyGoal = getGoalByStage(mockGoals, 'safety')
  const freedomGoal = getGoalByStage(mockGoals, 'freedom')
  
  // 财务保障目标最小，财务自由目标最大
  assert.ok(securityGoal.targetAmount < safetyGoal.targetAmount, '保障目标<安全目标')
  assert.ok(safetyGoal.targetAmount < freedomGoal.targetAmount, '安全目标<自由目标')
})

console.log('\n✨ 目标进度计算测试完成！\n')

// 导出结果
module.exports = {
  passed: testsPassed,
  failed: testsFailed,
  total: testsPassed + testsFailed
}
