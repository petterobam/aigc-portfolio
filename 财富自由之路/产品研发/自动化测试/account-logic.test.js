/**
 * 账户管理逻辑测试
 * 测试目标：验证账户资产计算、分类统计等核心逻辑
 * 创建时间：2026-03-25
 */

const assert = require('assert')

// 测试数据
const mockAccounts = [
  { id: '1', type: 'cash', name: '现金', balance: 5000 },
  { id: '2', type: 'checking', name: '银行卡', balance: 20000 },
  { id: '3', type: 'savings', name: '余额宝', balance: 50000 },
  { id: '4', type: 'investment', name: '股票账户', balance: 100000 },
  { id: '5', type: 'fixed', name: '房产', balance: 800000 },
  { id: '6', type: 'cash', name: '微信零钱', balance: 2000 }
]

// 模拟 store getter 逻辑
function calculateTotalAssets(accounts) {
  return accounts.reduce((sum, acc) => sum + acc.balance, 0)
}

function filterByType(accounts, type) {
  return accounts.filter(a => a.type === type)
}

function groupByType(accounts) {
  return accounts.reduce((groups, acc) => {
    if (!groups[acc.type]) {
      groups[acc.type] = []
    }
    groups[acc.type].push(acc)
    return groups
  }, {})
}

function calculateTypeTotals(accounts) {
  const grouped = groupByType(accounts)
  const totals = {}
  for (const [type, accs] of Object.entries(grouped)) {
    totals[type] = accs.reduce((sum, acc) => sum + acc.balance, 0)
  }
  return totals
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

console.log('测试账户管理逻辑算法...\n')

// 测试 1: 计算总资产
test('计算总资产 - 6个账户合计', () => {
  const total = calculateTotalAssets(mockAccounts)
  assert.strictEqual(total, 977000, '总资产应为 977,000 元')
})

// 测试 2: 按类型筛选 - 现金账户
test('按类型筛选 - 现金账户', () => {
  const cashAccounts = filterByType(mockAccounts, 'cash')
  assert.strictEqual(cashAccounts.length, 2, '应有2个现金账户')
  assert.strictEqual(cashAccounts[0].name, '现金')
  assert.strictEqual(cashAccounts[1].name, '微信零钱')
})

// 测试 3: 按类型筛选 - 投资账户
test('按类型筛选 - 投资账户', () => {
  const investmentAccounts = filterByType(mockAccounts, 'investment')
  assert.strictEqual(investmentAccounts.length, 1, '应有1个投资账户')
  assert.strictEqual(investmentAccounts[0].balance, 100000)
})

// 测试 4: 按类型分组
test('按类型分组 - 统计类型数量', () => {
  const grouped = groupByType(mockAccounts)
  assert.strictEqual(Object.keys(grouped).length, 5, '应有5种账户类型')
  assert.ok(grouped['cash'], '应包含现金类型')
  assert.ok(grouped['checking'], '应包含活期类型')
  assert.ok(grouped['savings'], '应包含储蓄类型')
  assert.ok(grouped['investment'], '应包含投资类型')
  assert.ok(grouped['fixed'], '应包含固定资产类型')
})

// 测试 5: 计算各类型总额
test('计算各类型总额 - 验证分组合计', () => {
  const typeTotals = calculateTypeTotals(mockAccounts)
  assert.strictEqual(typeTotals['cash'], 7000, '现金类合计应为 7,000 元')
  assert.strictEqual(typeTotals['checking'], 20000, '活期类合计应为 20,000 元')
  assert.strictEqual(typeTotals['savings'], 50000, '储蓄类合计应为 50,000 元')
  assert.strictEqual(typeTotals['investment'], 100000, '投资类合计应为 100,000 元')
  assert.strictEqual(typeTotals['fixed'], 800000, '固定资产类合计应为 800,000 元')
})

// 测试 6: 边界条件 - 空账户列表
test('边界条件 - 空账户列表', () => {
  const total = calculateTotalAssets([])
  assert.strictEqual(total, 0, '空列表总资产应为 0')
  
  const grouped = groupByType([])
  assert.strictEqual(Object.keys(grouped).length, 0, '空列表分组应为空对象')
})

// 测试 7: 边界条件 - 单个账户
test('边界条件 - 单个账户', () => {
  const singleAccount = [{ id: '1', type: 'cash', name: '现金', balance: 10000 }]
  const total = calculateTotalAssets(singleAccount)
  assert.strictEqual(total, 10000, '单个账户总资产应为 10,000 元')
})

// 测试 8: 负余额账户
test('负余额账户 - 信用卡欠款', () => {
  const accountsWithNegative = [
    ...mockAccounts,
    { id: '7', type: 'credit', name: '信用卡', balance: -5000 }
  ]
  const total = calculateTotalAssets(accountsWithNegative)
  assert.strictEqual(total, 972000, '包含负余额的总资产应为 972,000 元')
})

// 测试 9: 流动资产计算
test('流动资产计算 - 现金+活期+储蓄', () => {
  const liquidTypes = ['cash', 'checking', 'savings']
  const liquidAssets = mockAccounts
    .filter(a => liquidTypes.includes(a.type))
    .reduce((sum, acc) => sum + acc.balance, 0)
  assert.strictEqual(liquidAssets, 77000, '流动资产合计应为 77,000 元')
})

// 测试 10: 固定资产占比
test('固定资产占比 - 房产占总资产比例', () => {
  const total = calculateTotalAssets(mockAccounts)
  const fixedAssets = filterByType(mockAccounts, 'fixed')
  const fixedTotal = fixedAssets.reduce((sum, acc) => sum + acc.balance, 0)
  const ratio = (fixedTotal / total * 100).toFixed(2)
  assert.strictEqual(ratio, '81.88', '固定资产占比应为 81.88%')
})

console.log('\n✨ 账户管理逻辑测试完成！\n')

// 导出结果
module.exports = {
  passed: testsPassed,
  failed: testsFailed,
  total: testsPassed + testsFailed
}
