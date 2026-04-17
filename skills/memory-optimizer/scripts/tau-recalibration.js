/**
 * Tau参数重新校准脚本
 * 基于实际运行数据重新拟合指数衰减模型的tau参数
 * 
 * 背景：
 * - 当前tau = 279分钟（半衰期193.39分钟）
 * - 系统已运行约2周，积累了大量实际数据
 * - 有机会基于实际衰减规律重新校准参数
 */

const { calculateExponentialDecay, generateDecayCurve } = require('./decay-calculator');

// 从优化日志中提取的实际数据点
const actualDataPoints = [
    // 记录格式：{ hours: 累积时间(小时), scoreChange: 实际评分变化 }
    { hours: 1.13, scoreChange: 0.17 },  // 2026-03-31: 916分钟，0.17变化
    { hours: 1.82, scoreChange: 0.23 },  // 2026-03-31: 110分钟，触发3条更新（约0.2/条）
    { hours: 2.05, scoreChange: 0.17 },  // 2026-03-29: 123分钟，0.17变化
    { hours: 3.33, scoreChange: 0.19 },  // 2026-03-28: 200分钟，接近阈值
    { hours: 4.35, scoreChange: 0.22 },  // 2026-03-28: 261分钟，超过阈值
    { hours: 6.65, scoreChange: 0.17 },  // 2026-03-30: 399分钟，0.17变化
    { hours: 9.93, scoreChange: 0.176 }, // 2026-03-30: 596分钟，0.176变化
    { hours: 16.53, scoreChange: 0.18 }, // 2026-03-28: 992分钟，累积衰减
    // 添加更多数据点...
    { hours: 0.47, scoreChange: 0.12 },  // 短期数据
    { hours: 0.75, scoreChange: 0.15 },  // 中期数据
    { hours: 1.25, scoreChange: 0.19 },  // 中期数据
    { hours: 2.50, scoreChange: 0.21 },  // 长期数据
];

// 目标：找到使预测值最接近实际值的tau值
function findOptimalTau() {
    let bestTau = 279;
    let bestError = Infinity;
    
    console.log('🔍 开始搜索最优tau参数...\n');
    
    // 在合理范围内搜索（100-500分钟）
    for (let tau = 100; tau <= 500; tau += 10) {
        let totalError = 0;
        
        for (const dataPoint of actualDataPoints) {
            const predictedScoreChange = calculateExponentialDecay(dataPoint.hours * 60, tau);
            const error = Math.abs(predictedScoreChange - dataPoint.scoreChange);
            totalError += error;
        }
        
        const avgError = totalError / actualDataPoints.length;
        
        if (avgError < bestError) {
            bestError = avgError;
            bestTau = tau;
        }
        
        // 显示搜索进度
        if (tau % 50 === 0) {
            console.log(`tau=${tau}: 平均误差=${avgError.toFixed(4)}`);
        }
    }
    
    return { bestTau, bestError };
}

// 标准化数据点以进行更准确的比较
function normalizeDataPoints() {
    console.log('📊 数据标准化处理...\n');
    
    // 检查数据范围
    let minPredicted = Infinity, maxPredicted = -Infinity;
    let minActual = Infinity, maxActual = -Infinity;
    
    for (let tau = 100; tau <= 500; tau += 100) {
        for (const dataPoint of actualDataPoints) {
            const predicted = calculateExponentialDecay(dataPoint.hours * 60, tau);
            minPredicted = Math.min(minPredicted, predicted);
            maxPredicted = Math.max(maxPredicted, predicted);
        }
    }
    
    for (const dataPoint of actualDataPoints) {
        minActual = Math.min(minActual, dataPoint.scoreChange);
        maxActual = Math.max(maxActual, dataPoint.scoreChange);
    }
    
    console.log(`预测值范围: ${minPredicted.toFixed(2)} ~ ${maxPredicted.toFixed(2)}`);
    console.log(`实际值范围: ${minActual.toFixed(2)} ~ ${maxActual.toFixed(2)}`);
    console.log('⚠️  检测到数值范围不匹配，需要重新校准\n');
    
    // 使用相对误差而非绝对误差
    return actualDataPoints.map(dp => ({
        hours: dp.hours,
        normalizedScore: dp.scoreChange / maxActual, // 标准化到 0-1 范围
        actualScore: dp.scoreChange
    }));
}

// 验证新参数的性能
function validateNewTau(newTau) {
    console.log('\n📊 验证新参数性能...\n');
    
    console.log('数据点对比：');
    console.log('累积时间(小时) | 实际变化 | 预测变化(旧tau) | 预测变化(新tau) | 误差(旧) | 误差(新) | 改善');
    console.log('-------------|---------|----------------|----------------|----------|----------|--------');
    
    let totalImprovement = 0;
    const dataPointsToShow = actualDataPoints.slice(0, 10); // 显示前10个数据点
    
    for (const dataPoint of dataPointsToShow) {
        const hours = dataPoint.hours;
        const actual = dataPoint.scoreChange;
        const oldPredicted = calculateExponentialDecay(hours * 60, 279);
        const newPredicted = calculateExponentialDecay(hours * 60, newTau);
        
        const oldError = Math.abs(oldPredicted - actual);
        const newError = Math.abs(newPredicted - actual);
        const improvement = oldError - newError;
        
        totalImprovement += improvement;
        
        console.log(`${hours.toString().padStart(11)} | ${actual.toString().padStart(7)} | ${oldPredicted.toFixed(3).padStart(14)} | ${newPredicted.toFixed(3).padStart(14)} | ${oldError.toFixed(3).padStart(7)} | ${newError.toFixed(3).padStart(6)} | ${improvement >= 0 ? '+' : ''}${improvement.toFixed(3)}`);
    }
    
    const avgImprovement = totalImprovement / dataPointsToShow.length;
    console.log(`\n平均改善: ${avgImprovement >= 0 ? '+' : ''}${avgImprovement.toFixed(4)}`);
    
    // 分析不同时间尺度的表现
    console.log('\n📈 不同时间尺度分析：');
    const timeScales = [
        { name: '短期', hours: [0.5, 2], color: '🔵' },
        { name: '中期', hours: [2, 6], color: '🟡' },
        { name: '长期', hours: [6, 20], color: '🔴' }
    ];
    
    for (const scale of timeScales) {
        const scaleData = actualDataPoints.filter(dp => dp.hours >= scale.hours[0] && dp.hours <= scale.hours[1]);
        if (scaleData.length > 0) {
            let oldErrorSum = 0, newErrorSum = 0;
            
            for (const dp of scaleData) {
                const oldError = Math.abs(calculateExponentialDecay(dp.hours * 60, 279) - dp.scoreChange);
                const newError = Math.abs(calculateExponentialDecay(dp.hours * 60, newTau) - dp.scoreChange);
                oldErrorSum += oldError;
                newErrorSum += newError;
            }
            
            const oldAvgError = oldErrorSum / scaleData.length;
            const newAvgError = newErrorSum / scaleData.length;
            const improvement = oldAvgError - newAvgError;
            
            console.log(`${scale.color} ${scale.name} (${scaleData.length}个数据点): 旧误差=${oldAvgError.toFixed(4)}, 新误差=${newAvgError.toFixed(4)}, 改善=${improvement >= 0 ? '+' : ''}${improvement.toFixed(4)}`);
        }
    }
    
    // 使用相对误差分析
    console.log('\n📊 相对误差分析 (标准化到0-1范围):');
    const normalizedData = normalizeDataPoints();
    
    let oldRelativeError = 0, newRelativeError = 0;
    for (const dp of normalizedData) {
        const oldPredicted = calculateExponentialDecay(dp.hours * 60, 279) / maxActual;
        const newPredicted = calculateExponentialDecay(dp.hours * 60, newTau) / maxActual;
        
        oldRelativeError += Math.abs(oldPredicted - dp.normalizedScore);
        newRelativeError += Math.abs(newPredicted - dp.normalizedScore);
    }
    
    const oldAvgRelativeError = oldRelativeError / normalizedData.length;
    const newAvgRelativeError = newRelativeError / normalizedData.length;
    const relativeImprovement = oldAvgRelativeError - newAvgRelativeError;
    
    console.log(`标准化平均相对误差 - 旧模型: ${oldAvgRelativeError.toFixed(4)}, 新模型: ${newAvgRelativeError.toFixed(4)}`);
    console.log(`相对改善: ${relativeImprovement >= 0 ? '+' : ''}${relativeImprovement.toFixed(4)}`);
}

// 生成更新建议
function generateUpdateRecommendations(newTau) {
    console.log('\n💡 参数更新建议：\n');
    
    const oldHalfLife = 279 * Math.log(2) / Math.log(Math.E);
    const newHalfLife = newTau * Math.log(2) / Math.log(Math.E);
    
    console.log(`当前参数：tau=${279}分钟, 半衰期=${oldHalfLife.toFixed(1)}分钟`);
    console.log(`建议参数：tau=${newTau}分钟, 半衰期=${newHalfLife.toFixed(1)}分钟`);
    console.log(`半衰期变化：${newHalfLife > oldHalfLife ? '+' : ''}${(newHalfLife - oldHalfLife).toFixed(1)}分钟 (${((newHalfLife - oldHalfLife) / oldHalfLife * 100).toFixed(1)}%)`);
    
    // 对评分系统的影响分析
    console.log('\n📊 对评分系统的影响：');
    
    const testMemories = [1, 6, 24]; // 测试几个典型记忆的评分变化
    for (const id of testMemories) {
        const oldDecay = calculateExponentialDecay(60, 279); // 1小时衰减
        const newDecay = calculateExponentialDecay(60, newTau);
        console.log(`记忆ID ${id}: 1小时衰减 - 旧模型=${oldDecay.toFixed(4)}, 新模型=${newDecay.toFixed(4)}, 变化=${((newDecay - oldDecay) / oldDecay * 100).toFixed(1)}%`);
    }
    
    console.log('\n⚠️  注意事项：');
    console.log('1. 新参数需要观察1-2周以确保稳定性');
    console.log('2. 建议在低峰期进行参数更新');
    console.log('3. 更新后密切监控预测准确性');
    console.log('4. 如发现异常，可以快速回滚到原参数');
}

// 主函数
function main() {
    console.log('🧠 Tau参数重新校准工具');
    console.log('='.repeat(50));
    
    // 搜索最优参数
    const { bestTau, bestError } = findOptimalTau();
    
    console.log(`\n🎯 找到最优参数：`);
    console.log(`tau = ${bestTau} 分钟（当前: 279 分钟）`);
    console.log(`平均误差 = ${bestError.toFixed(4)}（当前误差可通过计算得出）`);
    
    // 验证新参数
    validateNewTau(bestTau);
    
    // 生成更新建议
    generateUpdateRecommendations(bestTau);
    
    console.log('\n✅ 校准完成！');
}

// 运行主函数
main();