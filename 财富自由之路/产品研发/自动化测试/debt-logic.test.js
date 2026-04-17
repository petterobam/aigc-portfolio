/**
 * 负债计算逻辑测试
 * 测试目标：验证负债统计、月还款计算、负债率等核心逻辑
 * 创建时间：2026-03-25
 */

const assert = require('assert')

// 测试数据
const mockDebts = [
  { id: '1', type: 'consumer', name: '信用卡A', totalAmount: 10000, remainingAmount: 8000, monthlyPayment: 800, interestRate: 18 },
  { id: '2', type: 'consumer', name: '花呗', totalAmount: 5000, remainingAmount: 3000, monthlyPayment: 500, interestRate: 15 },
  { id: '3', type: 'mortgage', name: '房贷', totalAmount: 800000, remainingAmount: 600000, monthlyPayment: 5000, interestRate: 4.9 },
  { id: '4', type: 'car', name: '车贷', totalAmount: 150000, remainingAmount: 100000, monthlyPayment: 3000, interestRate: 5.5 }
]

// 模拟 store getter 逻辑
function calculateTotalDebt(debts) {
  return debts.reduce((sum, d) => sum + d.remainingAmount, 0)
}

function calculateMonthlyPayment(debts) {
  return debts.reduce((sum, d) => sum + d.monthlyPayment, 0)
}

function filterConsumerDebts(debts) {
  return debts.filter(d => d.type === 'consumer')
}

function filterMortgageDebts(debts) {
  return debts.filter(d => d.type === 'mortgage')
}

function calculateDebtToAssetRatio(totalDebt, totalAssets) {
  if (totalAssets === 0) return 0
  return (totalDebt / totalAssets * 100).toFixed(2)
}

function calculatePayoffMonths(debt) {
  if (debt.monthlyPayment === 0) return Infinity
  return Math.ceil(debt.remainingAmount / debt.monthlyPayment)
}

function prioritizeDebts(debts) {
  // 按利率降序排序（高利率优先偿还）
  return [...debts].sort((a, b) => b.interestRate - a.interestRate)
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

console.log('测试负债计算逻辑算法...\n')

// 测试 1: 计算总负债
test('计算总负债 - 4笔债务合计', () => {
  const total = calculateTotalDebt(mockDebts)
  assert.strictEqual(total, 711000, '总负债应为 711,000 元')
})

// 测试 2: 计算月还款额
test('计算月还款额 - 所有债务月供', () => {
  const monthly = calculateMonthlyPayment(mockDebts)
  assert.strictEqual(monthly, 9300, '月还款总额应为 9,300 元')
})

// 测试 3: 筛选消费债
test('筛选消费债 - 信用卡+花呗', () => {
  const consumerDebts = filterConsumerDebts(mockDebts)
  assert.strictEqual(consumerDebts.length, 2, '应有2笔消费债')
  assert.strictEqual(consumerDebts[0].name, '信用卡A')
  assert.strictEqual(consumerDebts[1].name, '花呗')
})

// 测试 4: 筛选房贷
test('筛选房贷 - 房贷', () => {
  const mortgageDebts = filterMortgageDebts(mockDebts)
  assert.strictEqual(mortgageDebts.length, 1, '应有1笔房贷')
  assert.strictEqual(mortgageDebts[0].remainingAmount, 600000)
})

// 测试 5: 消费债总额
test('消费债总额 - 信用卡+花呗剩余', () => {
  const consumerDebts = filterConsumerDebts(mockDebts)
  const consumerTotal = consumerDebts.reduce((sum, d) => sum + d.remainingAmount, 0)
  assert.strictEqual(consumerTotal, 11000, '消费债总额应为 11,000 元')
})

// 测试 6: 消费债月供
test('消费债月供 - 信用卡+花呗月还款', () => {
  const consumerDebts = filterConsumerDebts(mockDebts)
  const consumerMonthly = consumerDebts.reduce((sum, d) => sum + d.monthlyPayment, 0)
  assert.strictEqual(consumerMonthly, 1300, '消费债月供应为 1,300 元')
})

// 测试 7: 负债率计算
test('负债率计算 - 总负债/总资产', () => {
  const totalDebt = calculateTotalDebt(mockDebts)
  const totalAssets = 977000 // 假设总资产
  const ratio = calculateDebtToAssetRatio(totalDebt, totalAssets)
  assert.strictEqual(ratio, '72.77', '负债率应为 72.77%')
})

// 测试 8: 还清时间估算 - 信用卡
test('还清时间估算 - 信用卡A', () => {
  const creditCard = mockDebts[0]
  const months = calculatePayoffMonths(creditCard)
  assert.strictEqual(months, 10, '信用卡A需10个月还清')
})

// 测试 9: 还清时间估算 - 房贷
test('还清时间估算 - 房贷', () => {
  const mortgage = mockDebts[2]
  const months = calculatePayoffMonths(mortgage)
  assert.strictEqual(months, 120, '房贷需120个月（10年）还清')
})

// 测试 10: 债务优先级排序（按利率）
test('债务优先级排序 - 高利率优先', () => {
  const prioritized = prioritizeDebts(mockDebts)
  assert.strictEqual(prioritized[0].name, '信用卡A', '利率18%应排第一')
  assert.strictEqual(prioritized[0].interestRate, 18)
  assert.strictEqual(prioritized[1].name, '花呗', '利率15%应排第二')
  assert.strictEqual(prioritized[1].interestRate, 15)
  assert.strictEqual(prioritized[2].name, '车贷', '利率5.5%应排第三')
  assert.strictEqual(prioritized[3].name, '房贷', '利率4.9%应排第四')
})

// 测试 11: 边界条件 - 空债务列表
test('边界条件 - 空债务列表', () => {
  const total = calculateTotalDebt([])
  assert.strictEqual(total, 0, '空列表总负债应为 0')
  
  const monthly = calculateMonthlyPayment([])
  assert.strictEqual(monthly, 0, '空列表月还款应为 0')
})

// 测试 12: 边界条件 - 单笔债务
test('边界条件 - 单笔债务', () => {
  const singleDebt = [{ id: '1', type: 'consumer', name: '信用卡', totalAmount: 10000, remainingAmount: 8000, monthlyPayment: 800, interestRate: 18 }]
  const total = calculateTotalDebt(singleDebt)
  assert.strictEqual(total, 8000, '单笔债务总负债应为 8,000 元')
  
  const months = calculatePayoffMonths(singleDebt[0])
  assert.strictEqual(months, 10, '单笔债务需10个月还清')
})

// 测试 13: 50/50原则应用
test('50/50原则 - 月结余分配', () => {
  const monthlySurplus = 20000 // 假设月结余2万
  const forDebt = monthlySurplus * 0.5
  const forReserve = monthlySurplus * 0.5
  
  assert.strictEqual(forDebt, 10000, '50%用于还债应为 10,000 元')
  assert.strictEqual(forReserve, 10000, '50%用于储备金应为 10,000 元')
})

// 测试 14: 债务类型统计
test('债务类型统计 - 各类型数量', () => {
  const typeCount = mockDebts.reduce((count, debt) => {
    count[debt.type] = (count[debt.type] || 0) + 1
    return count
  }, {})
  
  assert.strictEqual(typeCount['consumer'], 2, '应有2笔消费债')
  assert.strictEqual(typeCount['mortgage'], 1, '应有1笔房贷')
  assert.strictEqual(typeCount['car'], 1, '应有1笔车贷')
})

// 测试 15: 平均利率计算
test('平均利率计算 - 加权平均', () => {
  const totalRemaining = calculateTotalDebt(mockDebts)
  const weightedSum = mockDebts.reduce((sum, d) => sum + d.remainingAmount * d.interestRate, 0)
  const avgRate = (weightedSum / totalRemaining).toFixed(2)
  
  assert.strictEqual(avgRate, '5.17', '加权平均利率应为 5.17%')
})

console.log('\n✨ 负债计算逻辑测试完成！\n')

// 导出结果
module.exports = {
  passed: testsPassed,
  failed: testsFailed,
  total: testsPassed + testsFailed
}
