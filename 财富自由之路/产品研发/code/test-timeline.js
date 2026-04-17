/**
 * 财务自由时间路径计算器 - 测试版
 * 快速验证计算逻辑
 */

const input = {
  currentNetAssets: 50000,      // 当前净资产：5万
  monthlyIncome: 15000,          // 月收入：1.5万
  monthlyExpense: 10000,         // 月支出：1万
  savingsRate: 0.2,              // 储蓄率：20%
  annualRaiseRate: 0.05,         // 年化收入增长：5%
  annualReturnRate: 0.08,        // 年化收益率：8%
  securityMonths: 6,             // 保障月数：6个月
  monthlyBasicLiving: 8000,      // 基本生活：8000/月
  monthlyDreamLiving: 20000      // 梦想生活：20000/月
};

// 计算三阶段目标
const securityTarget = input.monthlyExpense * input.securityMonths;
const safetyTarget = input.monthlyBasicLiving * 150;
const freedomTarget = input.monthlyDreamLiving * 150;

console.log('=== 财务自由时间路径计算器 ===\n');
console.log('📊 输入参数：');
console.log(`  当前净资产：¥${input.currentNetAssets.toLocaleString()}`);
console.log(`  月收入：¥${input.monthlyIncome.toLocaleString()}`);
console.log(`  月支出：¥${input.monthlyExpense.toLocaleString()}`);
console.log(`  储蓄率：${(input.savingsRate * 100).toFixed(0)}% (¥${(input.monthlyIncome * input.savingsRate).toLocaleString()}/月)`);
console.log(`  年化收益率：${(input.annualReturnRate * 100).toFixed(0)}%`);
console.log();

console.log('🎯 三阶段目标：');
console.log(`  财务保障：¥${securityTarget.toLocaleString()} (${input.securityMonths}个月支出)`);
console.log(`  财务安全：¥${safetyTarget.toLocaleString()} (月入${input.monthlyBasicLiving.toLocaleString()}的150倍)`);
console.log(`  财务自由：¥${freedomTarget.toLocaleString()} (月入${input.monthlyDreamLiving.toLocaleString()}的150倍)`);
console.log();

// 计算达成时间
function calculateMilestone(targetAmount, currentAssets, monthlySavings, annualReturnRate, annualRaiseRate, name) {
  let assets = currentAssets;
  let months = 0;
  let currentMonthlySavings = monthlySavings;
  const monthlyReturnRate = annualReturnRate / 12;
  const maxMonths = 600;
  
  while (assets < targetAmount && months < maxMonths) {
    assets *= (1 + monthlyReturnRate);
    assets += currentMonthlySavings;
    months++;
    
    if (months % 12 === 0) {
      currentMonthlySavings *= (1 + annualRaiseRate);
    }
  }
  
  return {
    name,
    targetAmount,
    years: Math.floor(months / 12),
    months: months % 12,
    totalMonths: months,
    finalAssets: Math.round(assets),
    progress: Math.min(currentAssets / targetAmount, 1)
  };
}

const monthlySavings = input.monthlyIncome * input.savingsRate;

const security = calculateMilestone(securityTarget, input.currentNetAssets, monthlySavings, input.annualReturnRate, input.annualRaiseRate, '财务保障');
const safety = calculateMilestone(safetyTarget, input.currentNetAssets, monthlySavings, input.annualReturnRate, input.annualRaiseRate, '财务安全');
const freedom = calculateMilestone(freedomTarget, input.currentNetAssets, monthlySavings, input.annualReturnRate, input.annualRaiseRate, '财务自由');

console.log('⏱️  预计达成时间：');
console.log(`  ${security.name}：${security.years}年${security.months}个月 (进度 ${(security.progress * 100).toFixed(1)}%)`);
console.log(`  ${safety.name}：${safety.years}年${safety.months}个月 (进度 ${(safety.progress * 100).toFixed(1)}%)`);
console.log(`  ${freedom.name}：${freedom.years}年${freedom.months}个月 (进度 ${(freedom.progress * 100).toFixed(1)}%)`);
console.log();

// 年度进度（前5年）
console.log('📈 前5年资产增长：');
let assets = input.currentNetAssets;
let currentSavings = monthlySavings;
for (let year = 1; year <= 5; year++) {
  const startAssets = assets;
  let yearlySavings = 0;
  let investmentReturn = 0;
  
  for (let month = 0; month < 12; month++) {
    const returnThisMonth = assets * (input.annualReturnRate / 12);
    investmentReturn += returnThisMonth;
    assets *= (1 + input.annualReturnRate / 12);
    assets += currentSavings;
    yearlySavings += currentSavings;
  }
  
  currentSavings *= (1 + input.annualRaiseRate);
  
  let milestone = '';
  if (assets >= securityTarget && startAssets < securityTarget) milestone = ' ✨ 财务保障达成！';
  else if (assets >= safetyTarget && startAssets < safetyTarget) milestone = ' ✨ 财务安全达成！';
  
  console.log(`  第${year}年：¥${Math.round(assets).toLocaleString()} (储蓄 ¥${Math.round(yearlySavings).toLocaleString()}, 收益 ¥${Math.round(investmentReturn).toLocaleString()})${milestone}`);
}
console.log();

// 关键指标
const doublingTime = Math.ceil(72 / (input.annualReturnRate * 100));
const passiveIncomeAtFreedom = freedom.finalAssets * input.annualReturnRate / 12;

console.log('🔑 关键指标：');
console.log(`  72法则：资产约${doublingTime}年翻倍（${(input.annualReturnRate * 100).toFixed(0)}%收益率）`);
console.log(`  财务自由时被动收入：¥${Math.round(passiveIncomeAtFreedom).toLocaleString()}/月`);
console.log(`  财务自由时年被动收入：¥${Math.round(passiveIncomeAtFreedom * 12).toLocaleString()}/年`);
console.log();

// 敏感性分析
console.log('💡 敏感性分析：如果储蓄率提高到30%...');
const input2 = { ...input, savingsRate: 0.3 };
const monthlySavings2 = input2.monthlyIncome * input2.savingsRate;
const freedom2 = calculateMilestone(freedomTarget, input2.currentNetAssets, monthlySavings2, input2.annualReturnRate, input2.annualRaiseRate, '财务自由');
console.log(`  财务自由：${freedom2.years}年${freedom2.months}个月 (快了${freedom.years - freedom2.years}年${freedom.months - freedom2.months}个月)`);
console.log();

console.log('💡 敏感性分析：如果收益率提高到10%...');
const input3 = { ...input, annualReturnRate: 0.10 };
const monthlySavings3 = input3.monthlyIncome * input3.savingsRate;
const freedom3 = calculateMilestone(freedomTarget, input3.currentNetAssets, monthlySavings3, input3.annualReturnRate, input3.annualRaiseRate, '财务自由');
console.log(`  财务自由：${freedom3.years}年${freedom3.months}个月 (快了${freedom.years - freedom3.years}年${freedom.months - freedom3.months}个月)`);
