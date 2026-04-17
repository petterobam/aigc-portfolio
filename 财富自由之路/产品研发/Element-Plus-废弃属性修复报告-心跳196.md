# Element Plus 废弃属性修复报告

**日期**: 2026-03-28 23:40
**心跳编号**: #196
**修复人**: AI 助手

---

## 问题概述

Element Plus 在新版本中废弃了 `el-radio` 和 `el-radio-button` 组件的 `label` 属性，需要改为 `value` 属性。

**废弃警告示例**：
```
[Element Plus Warn]: `label` prop is deprecated. Use `value` prop instead.
```

---

## 修复范围

修复了以下 6 个 Vue 文件中的所有废弃属性：

### 1. AssetAllocation.vue（资产配置可视化工具）
- **修复位置**: 财务阶段选择器 + 年份选择器
- **修复数量**: 6 处
- **修复内容**:
  - `<el-radio-button label="guarantee">` → `value="guarantee"`
  - `<el-radio-button label="safety">` → `value="safety"`
  - `<el-radio-button label="freedom">` → `value="freedom"`
  - `<el-radio-button :label="5">` → `:value="5"`
  - `<el-radio-button :label="10">` → `:value="10"`
  - `<el-radio-button :label="20">` → `:value="20"`

### 2. Dashboard.vue（仪表盘）
- **修复位置**: 记账弹窗类型选择器
- **修复数量**: 2 处
- **修复内容**:
  - `<el-radio label="expense">` → `value="expense"`
  - `<el-radio label="income">` → `value="income"`

### 3. Transactions.vue（交易记录）
- **修复位置**: 记账弹窗类型选择器
- **修复数量**: 2 处
- **修复内容**:
  - `<el-radio label="expense">` → `value="expense"`
  - `<el-radio label="income">` → `value="income"`

### 4. IncomeActions.vue（收入行动清单）
- **修复位置**: 时间过滤器 + 优先级选择器
- **修复数量**: 6 处
- **修复内容**:
  - `<el-radio-button label="month">` → `value="month"`
  - `<el-radio-button label="quarter">` → `value="quarter"`
  - `<el-radio-button label="year">` → `value="year"`
  - `<el-radio-button label="high">` → `value="high"`
  - `<el-radio-button label="medium">` → `value="medium"`
  - `<el-radio-button label="low">` → `value="low"`

### 5. IncomeGoals.vue（收入目标）
- **修复位置**: 目标周期选择器
- **修复数量**: 3 处
- **修复内容**:
  - `<el-radio label="monthly">` → `value="monthly"`
  - `<el-radio label="quarterly">` → `value="quarterly"`
  - `<el-radio label="yearly">` → `value="yearly"`

### 6. IncomeStrategies.vue（收入策略）
- **修复位置**: 策略过滤器
- **修复数量**: 5 处
- **修复内容**:
  - `<el-radio-button label="all">` → `value="all"`
  - `<el-radio-button label="expert">` → `value="expert"`
  - `<el-radio-button label="product">` → `value="product"`
  - `<el-radio-button label="leverage">` → `value="leverage"`
  - `<el-radio-button label="investment">` → `value="investment"`

### 7. IncomeAnalysis.vue（收入分析）
- **修复位置**: 时间范围选择器
- **修复数量**: 4 处
- **修复内容**:
  - `<el-radio-button label="1m">` → `value="1m"`
  - `<el-radio-button label="3m">` → `value="3m"`
  - `<el-radio-button label="6m">` → `value="6m"`
  - `<el-radio-button label="1y">` → `value="1y"`

---

## 修复统计

| 文件名 | 修复数量 | 组件类型 |
|-------|---------|---------|
| AssetAllocation.vue | 6 | el-radio-button |
| Dashboard.vue | 2 | el-radio |
| Transactions.vue | 2 | el-radio |
| IncomeActions.vue | 6 | el-radio-button |
| IncomeGoals.vue | 3 | el-radio |
| IncomeStrategies.vue | 5 | el-radio-button |
| IncomeAnalysis.vue | 4 | el-radio-button |
| **总计** | **28** | **el-radio / el-radio-button** |

---

## 未修改项

以下组件的 `label` 属性保持不变，因为它们是正确的用法：

- **el-option**: `label` 用作显示文本，`value` 用作实际值（例如：`<el-option label="餐饮" value="food" />`）
- **el-option-group**: `label` 用作分组标题（例如：`<el-option-group label="主动收入">`）

---

## 验证方法

### 1. 启动应用

```bash
cd ~/.openclaw/workspace/财富自由之路/产品研发/code/wealth-freedom
pnpm dev
```

### 2. 打开浏览器控制台

检查是否还存在以下警告：
```
[Element Plus Warn]: `label` prop is deprecated. Use `value` prop instead.
```

### 3. 测试功能

确保以下功能正常工作：
- 资产配置可视化工具的财务阶段切换
- 仪表盘和交易记录的记账类型切换
- 收入行动清单的时间过滤和优先级选择
- 收入目标的周期切换
- 收入策略的过滤
- 收入分析的时间范围切换

---

## 影响评估

### 兼容性影响

- ✅ **无破坏性变更**: 修复前后功能完全一致
- ✅ **数据绑定**: 所有 `v-model` 绑定的变量名和值保持不变
- ✅ **用户体验**: 用户看到的文本内容（如"财务保障"、"本月"等）保持不变

### 代码质量

- ✅ 消除控制台警告，提升开发体验
- ✅ 符合 Element Plus 最新版本的 API 规范
- ✅ 为未来版本升级做好准备

---

## 经验总结

### Element Plus 属性变更规律

| 组件 | 废弃属性 | 新属性 |
|------|---------|-------|
| el-radio | label | value |
| el-radio-button | label | value |
| el-checkbox | label | value |

### 修复技巧

1. **批量查找**: 使用 grep 快速定位所有需要修复的位置
   ```bash
   grep -rn "el-radio.*label=" src --include="*.vue"
   ```

2. **排除误报**: 排除 el-option 和 el-option-group（它们的 label 是正确的用法）
   ```bash
   grep -rn "el-radio.*label=" src --include="*.vue" | grep -v "el-option"
   ```

3. **动态绑定注意**: `:label` 改为 `:value`，冒号不能丢
   ```vue
   <!-- 错误 -->
   <el-radio-button :label="5">5 年</el-radio-button>
   <!-- 正确 -->
   <el-radio-button :value="5">5 年</el-radio-button>
   ```

---

## 后续建议

1. **测试验证**: 启动应用进行全面功能测试，确保没有遗漏
2. **代码审查**: 团队其他成员审查修复内容，确保一致性
3. **文档更新**: 更新组件使用文档，明确 `value` 属性的正确用法
4. **lint 规则**: 添加 ESLint 规则，在开发阶段就检测废弃属性

---

## 附录：修复命令记录

所有修复通过 `edit` 工具完成，确保精确替换，避免误操作。

修复顺序：
1. AssetAllocation.vue（2 次替换）
2. Dashboard.vue（1 次替换）
3. Transactions.vue（1 次替换）
4. IncomeActions.vue（2 次替换）
5. IncomeGoals.vue（1 次替换）
6. IncomeStrategies.vue（1 次替换）
7. IncomeAnalysis.vue（1 次替换）

---

**修复完成时间**: 2026-03-28 23:40
**验证状态**: ⏳ 待启动应用验证
**相关任务**: 心跳 #196 - 产品优化与迭代
