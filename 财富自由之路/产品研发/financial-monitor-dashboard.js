// 财务监控仪表板 - 2026-04-05
// 实时监控财务状况，提供预警和建议

class FinancialMonitorDashboard {
    constructor() {
        this.today = new Date().toISOString().split('T')[0];
        this.currentMonth = "2026-04";
        
        // 财务数据
        this.financialData = {
            "2026-04-05": {
                dailyExpense: 243,
                foodExpense: 158,
                shoppingExpense: 45,
                transportExpense: 20,
                otherExpense: 20,
                income: 30000, // 月收入
                passiveIncome: 3471, // 月被动收入
                investmentAssets: 1020000,
                liabilities: 0,
                netWorth: 1100000
            }
        };

        // 预算设置
        this.budgets = {
            dailyExpense: 300,
            foodExpense: 300,
            weeklyShopping: 450,
            monthlyTotal: 9000
        };

        // 投资组合配置
        this.investmentPortfolio = {
            lowRisk: { ratio: 50, amount: 510000, actualReturn: 2.15 },
            mediumRisk: { ratio: 40, amount: 408000, actualReturn: 4.59 },
            highRisk: { ratio: 10, amount: 102000, actualReturn: 10.0 }
        };

        this.alerts = [];
        this.weeklySummary = this.calculateWeeklySummary();
    }

    // 计算周度总结
    calculateWeeklySummary() {
        const days = 6; // 前6天
        const totalExpense = Object.values(this.financialData).reduce((sum, day) => sum + day.dailyExpense, 0);
        
        return {
            days: days,
            totalExpense: totalExpense,
            dailyAverage: Math.round(totalExpense / days),
            weeklyTarget: this.budgets.dailyExpense * days,
            progress: Math.round((totalExpense / (this.budgets.dailyExpense * days)) * 100),
            monthlyProjection: Math.round((totalExpense / days) * 30)
        };
    }

    // 显示仪表板概览
    showDashboardOverview() {
        console.log("💰 财务监控仪表板 - " + this.today);
        console.log("=" .repeat(60));
        
        // 今日状态
        const todayData = this.financialData[this.today];
        if (todayData) {
            this.showDailyStatus(todayData);
        }

        // 周度总结
        this.showWeeklySummary();

        // 投资组合表现
        this.showInvestmentPerformance();

        // 财务三阶段进度
        this.showFinancialProgress();
    }

    // 显示每日状态
    showDailyStatus(todayData) {
        console.log("\n📊 今日财务状况 (" + this.today + ")");
        console.log("-" .repeat(40));

        const dailyStatus = [
            { name: "总支出", actual: todayData.dailyExpense, target: this.budgets.dailyExpense, unit: "元" },
            { name: "餐饮支出", actual: todayData.foodExpense, target: this.budgets.foodExpense, unit: "元" },
            { name: "购物支出", actual: todayData.shoppingExpense, target: Math.round(this.budgets.weeklyShopping/7), unit: "元" }
        ];

        dailyStatus.forEach(item => {
            const status = item.actual <= item.target ? "✅" : "❌";
            const percentage = Math.round((item.actual / item.target) * 100);
            const bar = this.createProgressBar(percentage);
            
            console.log(`${status} ${item.name}: ${item.actual}${item.unit} / ${item.target}${item.unit} ${bar} ${percentage}%`);
        });

        // 生成实时预警
        this.checkDailyAlerts(todayData);
    }

    // 显示周度总结
    showWeeklySummary() {
        console.log("\n📈 周度总结 (" + this.weeklySummary.days + "天)");
        console.log("-" .repeat(40));
        
        const weeklyBar = this.createProgressBar(this.weeklySummary.progress);
        console.log(`💰 总支出: ¥${this.weeklySummary.totalExpense} / ¥${this.weeklySummary.weeklyTarget} ${weeklyBar} ${this.weeklySummary.progress}%`);
        console.log(`📊 日均支出: ¥${this.weeklySummary.dailyAverage} (目标: ¥${this.budgets.dailyExpense})`);
        console.log(`📅 预计月支出: ¥${this.weeklySummary.monthlyProjection} (目标: ¥${this.budgets.monthlyTotal})`);
        
        const weeklyStatus = this.weeklySummary.progress <= 100 ? "✅ 正常" : "⚠️ 超支";
        console.log(`📋 状态: ${weeklyStatus}`);
    }

    // 显示投资组合表现
    showInvestmentPerformance() {
        console.log("\n📈 投资组合表现");
        console.log("-" .repeat(40));
        
        const portfolio = this.investmentPortfolio;
        const totalInvestment = portfolio.lowRisk.amount + portfolio.mediumRisk.amount + portfolio.highRisk.amount;
        
        // 计算加权平均收益率
        const weightedReturn = (
            portfolio.lowRisk.ratio * portfolio.lowRisk.actualReturn +
            portfolio.mediumRisk.ratio * portfolio.mediumRisk.actualReturn +
            portfolio.highRisk.ratio * portfolio.highRisk.actualReturn
        ) / 100;
        
        const monthlyReturn = Math.round(totalInvestment * weightedReturn / 12);
        const annualReturn = Math.round(weightedReturn * 100);
        
        console.log(`💰 总投资额: ¥${totalInvestment.toLocaleString()}`);
        console.log(`📊 年化收益率: ${annualReturn}% (预期: 3.8%)`);
        console.log(`💸 月收益: ¥${monthlyReturn.toLocaleString()}`);
        console.log(`📈 实际月收益: ¥${this.financialData[this.today].passiveIncome.toLocaleString()}`);
        
        const performance = weightedReturn > 0.038 ? "✅ 超预期" : "⚠️ 低于预期";
        console.log(`🏆 表现: ${performance}`);
        
        // 各风险等级详细表现
        Object.entries(portfolio).forEach(([risk, data]) => {
            const riskName = risk === 'lowRisk' ? '低风险' : risk === 'mediumRisk' ? '中风险' : '高风险';
            console.log(`   ${riskName}: ${data.ratio}% 配置, ¥${data.amount.toLocaleString()}, ${data.actualReturn}% 收益`);
        });
    }

    // 显示财务三阶段进度
    showFinancialProgress() {
        console.log("\n🎯 财务自由三阶段进度");
        console.log("-" .repeat(40));
        
        const monthlyExpense = 10000; // 每月支出
        const safeAmount = monthlyExpense * 316; // 财务安全所需金额
        const freedomAmount = monthlyExpense * 150; // 财务自由所需金额
        
        const netWorth = this.financialData[this.today].netWorth;
        
        // 第一阶段：财务保障
        const securityProgress = Math.round((netWorth / (monthlyExpense * 6)) * 100);
        console.log(`🛡️ 财务保障: ${securityProgress}% (目标: 6个月生活费 = ¥${(monthlyExpense * 6).toLocaleString()})`);
        
        if (securityProgress >= 100) {
            console.log("   ✅ 已完成 - 拥有充足的应急资金");
        }
        
        // 第二阶段：财务安全
        const safetyProgress = Math.round((netWorth / safeAmount) * 100);
        const safetyYears = Math.round(safeAmount / (netWorth * 0.0409 / 12)); // 基于4.09%收益率
        console.log(`🏠 财务安全: ${safetyProgress}% (目标: ¥${safeAmount.toLocaleString()})`);
        console.log(`   📅 预计达成: ${safetyYears}年`);
        
        // 第三阶段：财务自由
        const freedomProgress = Math.round((netWorth / freedomAmount) * 100);
        const freedomYears = Math.round(freedomAmount / (netWorth * 0.0409 / 12));
        console.log(`🎉 财务自由: ${freedomProgress}% (目标: ¥${freedomAmount.toLocaleString()})`);
        console.log(`   📅 预计达成: ${freedomYears}年`);
        
        // 总体进度
        const totalProgress = Math.round((safetyProgress + freedomProgress) / 2);
        console.log(`\n📊 总体进度: ${totalProgress}%`);
    }

    // 检查每日预警
    checkDailyAlerts(todayData) {
        const alerts = [];
        
        // 总支出预警
        if (todayData.dailyExpense > this.budgets.dailyExpense) {
            alerts.push({
                type: "🚨",
                category: "总支出超支",
                message: `今日支出¥${todayData.dailyExpense}，超过目标¥${this.budgets.dailyExpense}`,
                suggestion: "检查支出项目，控制不必要的开支"
            });
        }
        
        // 餐饮支出预警
        if (todayData.foodExpense > this.budgets.foodExpense) {
            alerts.push({
                type: "⚠️",
                category: "餐饮支出过高", 
                message: `今日餐饮支出¥${todayData.foodExpense}，建议控制在¥${this.budgets.foodExpense}以内`,
                suggestion: "考虑自备午餐，减少外卖频率"
            });
        }
        
        // 购物支出预警
        const dailyShoppingBudget = Math.round(this.budgets.weeklyShopping / 7);
        if (todayData.shoppingExpense > dailyShoppingBudget * 1.5) {
            alerts.push({
                type: "⚠️",
                category: "购物支出异常",
                message: `今日购物支出¥${todayData.shoppingExpense}，高于日常水平`,
                suggestion: "检查是否为必要购买，考虑延迟消费"
            });
        }
        
        // 显示预警
        if (alerts.length > 0) {
            console.log("\n🚨 财务预警");
            console.log("-" .repeat(30));
            alerts.forEach(alert => {
                console.log(`${alert.type} ${alert.category}`);
                console.log(`   💬 ${alert.message}`);
                console.log(`   💡 ${alert.suggestion}\n`);
            });
        } else {
            console.log("\n✅ 今日财务状况良好，无预警事项");
        }
    }

    // 生成月度预算报告
    generateMonthlyBudgetReport() {
        console.log("\n📋 月度预算报告");
        console.log("=" .repeat(40));
        
        const daysInMonth = 30;
        const projectedMonthlyExpense = this.weeklySummary.monthlyProjection;
        
        console.log(`📅 预算周期: ${this.currentMonth}`);
        console.log(`📊 总预算: ¥${this.budgets.monthlyTotal.toLocaleString()}`);
        console.log(`📈 预计支出: ¥${projectedMonthlyExpense.toLocaleString()}`);
        console.log(`💰 预计结余: ¥${(this.budgets.monthlyTotal - projectedMonthlyExpense).toLocaleString()}`);
        
        const budgetStatus = projectedMonthlyExpense <= this.budgets.monthlyTotal ? "✅ 预算内" : "❌ 超预算";
        console.log(`📋 状态: ${budgetStatus}`);
        
        // 预算分配建议
        this.showBudgetAllocation();
    }

    // 显示预算分配建议
    showBudgetAllocation() {
        console.log("\n💡 预算分配建议");
        console.log("-" .repeat(30));
        
        const allocation = [
            { category: "餐饮支出", budget: Math.round(this.budgets.foodExpense * 30), percentage: "33%" },
            { category: "购物支出", budget: this.budgets.weeklyShopping, percentage: "15%" },
            { category: "交通支出", budget: Math.round(20 * 30), percentage: "7%" },
            { category: "其他支出", budget: Math.round(150 * 30), percentage: "45%" }
        ];
        
        allocation.forEach(item => {
            console.log(`🛍️ ${item.category}: ¥${item.budget.toLocaleString()} (${item.percentage})`);
        });
    }

    // 生成优化建议
    generateOptimizationSuggestions() {
        console.log("\n🚀 优化建议");
        console.log("=" .repeat(40));
        
        const suggestions = [
            {
                title: "餐饮优化",
                current: "日均¥158（当前）",
                target: "日均¥300（目标）",
                savings: "¥142/天",
                benefit: "月节省¥4,260",
                action: "继续保持自备午餐，考虑增加健康食材预算"
            },
            {
                title: "购物控制",
                current: "周均¥450（当前）",
                target: "周均¥450（目标）",
                savings: "¥0/周",
                benefit: "保持当前水平",
                action: "严格执行购物清单，使用24小时冷静期"
            },
            {
                title: "投资优化",
                current: "年化4.09%（当前）",
                target: "年化4.2%（目标）",
                savings: "月收益+¥50-100",
                benefit: "加速财务自由进程",
                action: "考虑将高风险配置从10%提升至15%"
            },
            {
                title: "订阅审查",
                current: "待审查",
                target: "节省¥500-800/月",
                savings: "¥500-800/月",
                benefit: "月度现金流的直接提升",
                action: "全面审查所有订阅服务，取消低价值项目"
            }
        ];
        
        suggestions.forEach(suggestion => {
            console.log(`\n📋 ${suggestion.title}`);
            console.log(`   当前: ${suggestion.current}`);
            console.log(`   目标: ${suggestion.target}`);
            console.log(`   潜在收益: ${suggestion.savings}`);
            console.log(`   月度效益: ${suggestion.benefit}`);
            console.log(`   执行方案: ${suggestion.action}`);
        });
    }

    // 创建进度条
    createProgressBar(percentage, width = 20) {
        const filled = Math.round((percentage / 100) * width);
        const empty = width - filled;
        return '[' + '█'.repeat(filled) + ' '.repeat(empty) + ']';
    }

    // 显示完整仪表板
    showFullDashboard() {
        this.showDashboardOverview();
        this.generateMonthlyBudgetReport();
        this.generateOptimizationSuggestions();
        
        console.log("\n🎯 下一步行动");
        console.log("=" .repeat(40));
        console.log("1. 📝 继续记录每日支出，保持良好习惯");
        console.log("2. 🚀 执行GitHub一键部署脚本");
        console.log("3. 📝 发布技术文章，建立影响力");
        console.log("4. 🔍 审查订阅服务，优化月度支出");
        console.log("5. 📊 监控投资表现，适时调整配置");
    }
}

// 使用示例
const dashboard = new FinancialMonitorDashboard();

// 显示完整仪表板
dashboard.showFullDashboard();

// 导出数据供其他脚本使用
module.exports = FinancialMonitorDashboard;