# GitHub 仓库创建与发布流程

> 创建时间：2026-03-29 13:45
> 心跳编号：#216
> 目标：指导用户创建 GitHub 仓库、推送代码、创建 Release

---

## 📋 前提条件

### ✅ 已完成的工作

1. **Git 仓库初始化**（心跳 #215）
   - 仓库已在本地初始化
   - .gitignore 文件已创建
   - README.md 文件已创建
   - 初始提交已完成：`Initial commit: 财富自由之路 v0.1.0`
   - master 分支已重命名为 main

2. **产品打包**（心跳 #212）
   - macOS x64 版本已打包：`财富自由之路-0.1.0.dmg`（123 MB）
   - macOS arm64 和 Windows 版本待打包（网络改善后）

3. **发布素材准备**（心跳 #211-215）
   - 产品图标：3 个（1024x1024、512x512、256x256）
   - 发布文案：7 份（知乎、小红书、B站、GitHub Release 等）
   - 演示视频脚本：1 份
   - README.md：1 份

### ⏳ 待完成的工作

1. **GitHub 仓库创建**
2. **推送代码到 GitHub**
3. **继续打包**（macOS arm64 和 Windows）
4. **创建 GitHub Release**
5. **上传安装包**
6. **发布内容**（知乎、小红书、B站）

---

## 🚀 步骤 1：创建 GitHub 仓库

### 方式一：通过 GitHub 网页创建（推荐）

1. **访问 GitHub**
   - 打开浏览器，访问：https://github.com/new

2. **填写仓库信息**
   - **Repository name**：`wealth-freedom`
   - **Description**：`财富自由之路 - 资产配置可视化工具，助你科学配置资产，实现财务自由`
   - **Public / Private**：选择 `Public`（公开）或 `Private`（私有）
     - 建议：选择 `Public`，便于用户下载和反馈
   - **Initialize this repository with**：不要勾选任何选项（Add a README file、Choose a license、Choose .gitignore）
     - 原因：本地已有 README.md 和 .gitignore

3. **创建仓库**
   - 点击 `Create repository` 按钮

4. **获取仓库 URL**
   - 创建成功后，复制仓库的 HTTPS URL
   - URL 格式：`https://github.com/YOUR_USERNAME/wealth-freedom.git`

### 方式二：通过 GitHub CLI 创建

```bash
# 1. 安装 GitHub CLI（如果未安装）
brew install gh

# 2. 登录 GitHub
gh auth login

# 3. 创建仓库
cd ~/.openclaw/workspace/财富自由之路/产品研发/code/wealth-freedom
gh repo create wealth-freedom --public --source=. --remote=origin --push

# 说明：
# --public：创建公开仓库
# --source=.：使用当前目录作为源
# --remote=origin：设置远程仓库名称为 origin
# --push：推送代码到 GitHub
```

---

## 🚀 步骤 2：推送代码到 GitHub

### 前提条件

- 本地 Git 仓库已初始化
- GitHub 仓库已创建
- 已获取 GitHub 仓库的 HTTPS URL

### 推送步骤

```bash
# 1. 进入项目目录
cd ~/.openclaw/workspace/财富自由之路/产品研发/code/wealth-freedom

# 2. 添加远程仓库（如果尚未添加）
git remote add origin https://github.com/YOUR_USERNAME/wealth-freedom.git

# 3. 验证远程仓库
git remote -v
# 应该看到：
# origin  https://github.com/YOUR_USERNAME/wealth-freedom.git (fetch)
# origin  https://github.com/YOUR_USERNAME/wealth-freedom.git (push)

# 4. 查看当前分支
git branch
# 应该看到：
# * main

# 5. 推送代码到 GitHub
git push -u origin main
# 说明：
# -u origin main：设置上游分支，以后直接使用 git push 即可
# 首次推送可能需要输入 GitHub 用户名和密码（或 Personal Access Token）

# 6. 验证推送成功
# 打开浏览器，访问：https://github.com/YOUR_USERNAME/wealth-freedom
# 应该看到代码已成功推送
```

### 常见问题

**问题 1：推送时提示认证失败**

**解决方案**：
- 使用 Personal Access Token（推荐）
  1. 访问：https://github.com/settings/tokens
  2. 点击 `Generate new token` → `Generate new token (classic)`
  3. 勾选 `repo` 权限
  4. 点击 `Generate token`
  5. 复制生成的 token（只显示一次）
  6. 推送时使用 token 作为密码

**问题 2：推送时提示 remote already exists**

**解决方案**：
```bash
# 查看现有远程仓库
git remote -v

# 删除现有远程仓库
git remote remove origin

# 重新添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/wealth-freedom.git

# 推送代码
git push -u origin main
```

**问题 3：推送时提示 refusing to merge unrelated histories**

**解决方案**：
```bash
# 强制推送（谨慎使用）
git push -u origin main --force
# 说明：--force 会覆盖远程仓库的历史记录
```

---

## 🚀 步骤 3：继续打包（macOS arm64 和 Windows）

### 前提条件

- 网络连接正常
- Node.js 和 pnpm 已安装

### 打包步骤

```bash
# 1. 进入桌面项目目录
cd ~/.openclaw/workspace/财富自由之路/产品研发/code/wealth-freedom/apps/desktop

# 2. 打包 macOS arm64 版本
pnpm build --mac --arm64
# 预计耗时：10-20 分钟
# 输出文件：release/财富自由之路-0.1.0-arm64.dmg

# 3. 打包 Windows x64 版本
pnpm build --win --x64
# 预计耗时：10-20 分钟
# 输出文件：release/财富自由之路 Setup 0.1.0.exe
```

### 验证打包结果

```bash
# 1. 查看打包文件
ls -lh release/
# 应该看到：
# 财富自由之路-0.1.0.dmg（macOS x64，123 MB）
# 财富自由之路-0.1.0-arm64.dmg（macOS arm64，约 120 MB）
# 财富自由之路 Setup 0.1.0.exe（Windows x64，约 130 MB）

# 2. 测试安装包（可选）
# macOS：双击 .dmg 文件，拖拽到 Applications 文件夹
# Windows：双击 .exe 文件，按照安装向导操作
```

### 常见问题

**问题 1：打包时提示网络错误**

**解决方案**：
```bash
# 1. 检查网络连接
ping github.com

# 2. 使用国内镜像（如果 GitHub 访问慢）
# 编辑 .npmrc 文件，添加：
registry=https://registry.npmmirror.com
electron_mirror=https://cdn.npmmirror.com/binaries/electron/
electron_builder_binaries_mirror=https://cdn.npmmirror.com/binaries/electron-builder-binaries/

# 3. 清理缓存后重新打包
pnpm clean
pnpm build --mac --arm64
```

**问题 2：打包时提示 out of memory**

**解决方案**：
```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm build --mac --arm64
```

---

## 🚀 步骤 4：创建 GitHub Release

### 前提条件

- 代码已推送到 GitHub
- 所有平台的安装包已打包完成

### 创建 Release 步骤

**方式一：通过 GitHub 网页创建（推荐）**

1. **访问 Releases 页面**
   - 打开浏览器，访问：https://github.com/YOUR_USERNAME/wealth-freedom/releases/new

2. **填写 Release 信息**
   - **Choose a tag**：输入 `v0.1.0`
   - **Target**：选择 `main`
   - **Release title**：`财富自由之路 v0.1.0`
   - **Describe this release**：复制以下内容（来自 `GitHub-Release-文案-心跳214.md`）

3. **发布内容模板**

```markdown
# 财富自由之路 v0.1.0

## 📢 产品介绍

财富自由之路是一款资产配置可视化工具，助你科学配置资产，实现财务自由。

### 核心功能

- **财务阶段选择**：财务保障、财务安全、财务自由三个阶段
- **资产配置滑块**：交互式调整低、中、高风险资产比例
- **实时图表展示**：
  - 饼图：资产配置比例可视化
  - 雷达图：风险-收益分析
  - 增长曲线：10 年资产增长预测
- **配置详情表格**：显示各风险等级的金额、产品、预期收益
- **导出功能**：一键导出配置图表为图片或 PDF

### 适用人群

- 正在规划财务自由的人
- 想要科学配置资产的人
- 想要了解投资风险和收益的人

## 📦 下载链接

### macOS
- **macOS Intel（x64）**：[财富自由之路-0.1.0.dmg](https://github.com/YOUR_USERNAME/wealth-freedom/releases/download/v0.1.0/财富自由之路-0.1.0.dmg)（123 MB）
- **macOS Apple Silicon（arm64）**：[财富自由之路-0.1.0-arm64.dmg](https://github.com/YOUR_USERNAME/wealth-freedom/releases/download/v0.1.0/财富自由之路-0.1.0-arm64.dmg)（约 120 MB）

### Windows
- **Windows x64**：[财富自由之路 Setup 0.1.0.exe](https://github.com/YOUR_USERNAME/wealth-freedom/releases/download/v0.1.0/财富自由之路%20Setup%200.1.0.exe)（约 130 MB）

### 源代码
- [查看源代码](https://github.com/YOUR_USERNAME/wealth-freedom)

## 🚀 快速开始

### macOS 安装

1. 下载对应的 .dmg 文件
2. 双击打开，拖拽 "财富自由之路" 到 Applications 文件夹
3. 在 Applications 文件夹中找到并启动应用

### Windows 安装

1. 下载 .exe 安装文件
2. 双击运行安装程序
3. 按照安装向导完成安装
4. 从开始菜单启动应用

## 📖 使用教程

### 1. 选择财务阶段

启动应用后，首先选择你的财务阶段：
- **财务保障**：拥有 6-12 个月的生活储备金
- **财务安全**：靠投资利息覆盖日常支出
- **财务自由**：靠利息实现梦想生活

### 2. 调整资产配置

使用滑块调整低、中、高风险资产的配置比例：
- **低风险**：定期存款、国债、货币基金（预期收益 2-3%）
- **中风险**：债券基金、稳健型理财（预期收益 3.5-5.5%）
- **高风险**：股票型基金（预期收益 8-15%）

### 3. 查看实时图表

图表会根据你的配置实时更新：
- **饼图**：展示资产配置比例
- **雷达图**：展示风险-收益关系
- **增长曲线**：展示 10 年资产增长预测

### 4. 导出配置

点击"导出配置"按钮，选择导出格式：
- **导出为图片**：保存为 PNG 格式
- **导出为 PDF**：保存为 PDF 文档

## 💡 使用建议

### 财务保障阶段
- 低风险资产：50-60%
- 中风险资产：30-40%
- 高风险资产：10-20%

### 财务安全阶段
- 低风险资产：40-50%
- 中风险资产：30-40%
- 高风险资产：10-30%

### 财务自由阶段
- 低风险资产：30-40%
- 中风险资产：20-30%
- 高风险资产：30-50%

## ⚠️ 注意事项

- 本工具仅提供资产配置参考，不构成投资建议
- 投资有风险，入市需谨慎
- 建议根据个人风险承受能力和市场环境调整配置

## 📞 联系我们

- **GitHub Issues**：[提交问题](https://github.com/YOUR_USERNAME/wealth-freedom/issues)
- **邮箱**：1460300366@qq.com

## 🙏 致谢

感谢所有用户的支持和反馈！

---

**更新内容**：
- ✅ 财务阶段选择功能
- ✅ 资产配置滑块
- ✅ 实时图表展示（饼图、雷达图、增长曲线）
- ✅ 配置详情表格
- ✅ 导出功能（图片、PDF）
- ✅ 跨平台支持（macOS x64、macOS arm64、Windows x64）
```

4. **上传安装包**
   - 在 **Attach binaries by dropping them here or selecting them** 区域
   - 拖拽或选择以下文件：
     - `财富自由之路-0.1.0.dmg`（macOS x64）
     - `财富自由之路-0.1.0-arm64.dmg`（macOS arm64）
     - `财富自由之路 Setup 0.1.0.exe`（Windows x64）

5. **发布 Release**
   - 点击 `Publish release` 按钮

**方式二：通过 GitHub CLI 创建**

```bash
# 1. 创建 tag
cd ~/.openclaw/workspace/财富自由之路/产品研发/code/wealth-freedom
git tag v0.1.0

# 2. 推送 tag
git push origin v0.1.0

# 3. 创建 Release（读取文案文件）
gh release create v0.1.0 \
  --title "财富自由之路 v0.1.0" \
  --notes-file ../GitHub-Release-文案-心跳214.md \
  apps/desktop/release/财富自由之路-0.1.0.dmg \
  apps/desktop/release/财富自由之路-0.1.0-arm64.dmg \
  apps/desktop/release/财富自由之路\ Setup\ 0.1.0.exe
```

---

## 🚀 步骤 5：验证发布

### 验证清单

- [ ] GitHub Release 页面创建成功
- [ ] Release 标题为"财富自由之路 v0.1.0"
- [ ] Release 描述内容完整
- [ ] 所有安装包上传成功
- [ ] 下载链接可以正常访问
- [ ] 安装包可以正常下载和安装

### 测试下载

```bash
# 测试下载链接（替换 YOUR_USERNAME 为实际用户名）
curl -O https://github.com/YOUR_USERNAME/wealth-freedom/releases/download/v0.1.0/财富自由之路-0.1.0.dmg

# 验证文件大小（应该是 123 MB）
ls -lh 财富自由之路-0.1.0.dmg
```

---

## 🚀 步骤 6：内容发布（知乎、小红书、B站）

### 知乎发布

**文章标题**：如何科学配置资产？90万资产用8年实现财务自由的秘密

**文章内容**：使用 `产品研发/知乎发布文案-心跳214.md` 中的内容

**发布步骤**：
1. 访问：https://zhuanlan.zhihu.com/write
2. 复制文章内容
3. 添加产品截图（来自 `产品研发/发布素材/截图/`）
4. 在文章末尾添加下载链接：
   - GitHub Release：https://github.com/YOUR_USERNAME/wealth-freedom/releases/tag/v0.1.0
5. 选择话题：#个人理财 #资产配置 #财务自由
6. 点击"发布"按钮

### 小红书发布

**笔记标题**：90万资产如何配置？用这个工具8年实现财务自由

**笔记内容**：使用 `产品研发/小红书发布文案-心跳214.md` 中的内容

**发布步骤**：
1. 打开小红书 App
2. 点击"+"号，选择"图文"
3. 上传 5 张封面图（来自 `产品研发/发布素材/小红书/`）
4. 复制笔记内容
5. 添加话题标签：#个人理财 #资产配置 #财务自由 #理财工具
6. 点击"发布"按钮

### B站发布

**视频标题**：资产配置工具演示 - 90万资产如何用8年实现财务自由

**视频内容**：
- 根据演示视频脚本（`产品研发/发布素材/演示视频脚本.md`）录制视频
- 时长：10-15 分钟
- 内容：产品介绍、功能演示、使用建议

**发布步骤**：
1. 访问：https://member.bilibili.com/v2/upload/video/frame
2. 上传视频文件
3. 填写视频信息：
   - 标题：资产配置工具演示 - 90万资产如何用8年实现财务自由
   - 简介：使用脚本中的简介
   - 封面：使用 `产品研发/发布素材/B站/封面.png`
   - 分区：科技 → 软件
   - 标签：#理财 #资产配置 #财务自由 #软件教程
4. 添加简介中的下载链接
5. 点击"立即投稿"按钮

---

## 📊 发布进度追踪

| 步骤 | 任务 | 状态 | 完成时间 |
|------|------|------|---------|
| 1 | 创建 GitHub 仓库 | ⏳ 待执行 | - |
| 2 | 推送代码到 GitHub | ⏳ 待执行 | - |
| 3 | 继续打包（arm64 + Windows） | ⏸️ 挂起中 | - |
| 4 | 创建 GitHub Release | ⏳ 待执行 | - |
| 5 | 上传安装包 | ⏳ 待执行 | - |
| 6 | 验证发布 | ⏳ 待执行 | - |
| 7 | 知乎发布 | ⏳ 待执行 | - |
| 8 | 小红书发布 | ⏳ 待执行 | - |
| 9 | B站发布 | ⏳ 待执行 | - |

---

## 💡 常见问题

### Q1：GitHub 仓库应该选择 Public 还是 Private？

**A**：建议选择 Public（公开）。
- 优点：便于用户下载和反馈，提高产品曝光度
- 缺点：代码公开（本产品是开源的，无敏感信息）

如果不想公开代码，可以选择 Private（私有）。

### Q2：是否需要申请开发者签名证书？

**A**：macOS 和 Windows 的签名证书是可选的。
- **未签名**：用户安装时会看到安全警告，需要手动允许
- **已签名**：用户安装时不会看到安全警告，体验更好

如果追求更好的用户体验，可以申请签名证书：
- macOS：Apple Developer Program（$99/年）
- Windows：代码签名证书（$100-500/年）

### Q3：如何加速下载速度？

**A**：可以使用 CDN 加速。
- GitHub Releases 自带 CDN 加速（国内访问较慢）
- 可以使用第三方 CDN 服务（如七牛云、阿里云 OSS）
- 将安装包上传到 CDN，在 README 和 Release 中提供 CDN 下载链接

### Q4：如何收集用户反馈？

**A**：使用 GitHub Issues 收集用户反馈。
- 访问：https://github.com/YOUR_USERNAME/wealth-freedom/issues
- 用户可以提交 Bug、功能请求、使用问题
- 定期回复 Issues，与用户互动

也可以提供邮箱，让用户通过邮件反馈。

---

## 📝 总结

### 发布流程概览

1. **创建 GitHub 仓库**（5-10 分钟）
2. **推送代码到 GitHub**（2-5 分钟）
3. **继续打包**（20-40 分钟）
4. **创建 GitHub Release**（5-10 分钟）
5. **上传安装包**（5-10 分钟）
6. **验证发布**（5-10 分钟）
7. **内容发布**（30-60 分钟）

**预计总耗时**：1.5-2 小时（不含录制视频时间）

### 关键注意事项

- 确保所有安装包都打包完成
- 确保下载链接可以正常访问
- 确保发布文案和素材准备完毕
- 及时回复用户反馈和问题

---

**创建人**：AI 助手
**心跳编号**：#216
**创建时间**：2026-03-29 13:45
