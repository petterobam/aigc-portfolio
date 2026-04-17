# Electron 安装修复 - 心跳 #154

**日期**: 2026-03-28 09:20
**心跳编号**: #154
**执行人**: AI 助手

---

## 问题描述

用户报告 Electron 安装失败：
```
Exec failed (salty-se, signal 15) :: ules/.pnpm/registry.npmmirror.com+electron@41.1.0/node_modules/electron
Running postinstall script, failed in 29m 56.5s
```

---

## 问题分析

1. **根本原因**：Electron postinstall 脚本执行超时（29分56.5秒）
2. **网络问题**：可能是 Electron 二进制文件下载缓慢或失败
3. **版本问题**：package.json 中指定的是 electron@41.1.0，但实际安装的是 electron@28.3.3

---

## 解决方案

### 1. 清理缓存
```bash
cd ~/.openclaw/workspace/财富自由之路/产品研发/code/wealth-freedom
rm -rf node_modules/.pnpm/registry.npmmirror.com+electron@41.1.0
```

### 2. 使用国内镜像源
```bash
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
pnpm install
```

### 3. 验证安装
```bash
ls -la node_modules/.pnpm/registry.npmmirror.com+electron@28.3.3/node_modules/electron/dist/
```

---

## 发现的代码问题

启动应用时发现编译错误：
```
No matching export in "src/renderer/src/utils/format.ts" for import "formatNumber"
```

### 问题原因
IncomeActions.vue 导入了 formatNumber 函数，但 format.ts 中没有导出该函数。

### 解决方案
在 `apps/desktop/src/renderer/src/utils/format.ts` 中添加 formatNumber 函数：

```typescript
/**
 * 格式化数字（不带货币符号）
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}
```

---

## 验证结果

### Electron 安装状态
- ✅ electron@28.3.3 安装成功
- ✅ dist 目录存在
- ✅ postinstall 完成

### 应用启动状态
- ✅ 主进程构建成功
- ✅ 预加载脚本构建成功
- ✅ Vite 开发服务器运行在 http://localhost:5173/
- ✅ Electron 应用启动成功

---

## 执行时间

- 开始时间：09:11
- 结束时间：09:20
- 总耗时：约 9 分钟

---

## 关键学习

1. **Electron 镜像源**：使用国内镜像源可以显著加快 Electron 安装速度
   - 环境变量：`ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`

2. **pnpm 缓存**：删除特定包的缓存可以解决安装失败问题
   - 路径：`node_modules/.pnpm/registry.npmmirror.com+electron@VERSION`

3. **版本锁定**：package.json 中的版本可能与实际安装版本不一致
   - 可能原因：依赖树中其他包锁定了不同版本

4. **代码审查**：启动应用前需要检查所有导入的函数是否已正确导出

---

## 下一步建议

1. **锁定 Electron 版本**：在 package.json 中明确指定 electron@28.3.3
2. **文档更新**：在 README.md 中添加 Electron 安装故障排查指南
3. **CI/CD 优化**：在 CI/CD 流程中使用 Electron 镜像源加速安装
4. **代码审查**：检查其他页面的导入语句，确保所有导出函数都已实现

---

**维护者**: AI 助手
**文件状态**: 完成
