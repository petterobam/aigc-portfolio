# MEMORY.md - 长期记忆

## 番茄短篇创作

### 已知限制和注意事项
- **归档故事集已完成**：`stories/归档故事集/` 目录下的 01-27 号故事已全部完成，不要重复写作
- 归档故事包括：
  - 婚姻家庭类（偏心父母、婆媳大战、相亲局等）
  - 职场逆袭类（领导背锅、老板画饼等）
  - 重生复仇类（古言重生、校园复仇等）
  - 规则诡异类（午夜电梯、地铁末班车、便利店等）
  - 读心金手指类（全家演戏、皇上弹幕、霸凌者秘密等）
  - 灵异悬疑类（第十三号房间、凶宅直播、审讯室读心等）
  - 末世求生类（病毒爆发、队友想吃我等）
  - 历史穿越类（大秦始皇、崇祯皇帝等）

### 创作优先级
- 优先推进当前有 `tasks.md` 但章节未写完的故事
- 新故事启动前先做选题分析
- 避免与归档故事集重复的题材和套路

### 故事质量检查（重要！）
**问题发现时间**：2026-03-25 01:10 AM
**问题类型**：重复段落过多

**症状**：
- 35号故事检查结果显示：77个重复句子，总体评分只有45.83/100
- 最严重的问题：
  - "他点了点头" - 重复 23 次
  - "但他的心声却非常丰富" - 重复 9 次
  - "我转身离开，走了几步后，我又回头看了看，发现他依旧站在那里，看着我离开" - 重复 6 次

**根本原因**：
- 模板化写作：使用固定的对话和描写模式
- 缺乏多样性：每一章都使用相同的对话和描写结构
- 没有自查机制：生成后没有检测重复句子的流程

**解决方案**：
1. ✅ 创建故事质量检查工具：`skills/quality-checker/STORY_QUALITY_CHECKER.py`
2. ✅ 建立发布前质量检查流程
3. ✅ 制定优化方案和检查清单

**使用方法**：
```bash
cd ~/.openclaw/workspace/番茄短篇故事集
python3 skills/quality-checker/STORY_QUALITY_CHECKER.py '故事文件路径'
```

**评分标准**：
- ≥90分: 优秀，可以发布 ✅
- ≥75分: 良好，小幅优化即可发布 ⚠️
- ≥60分: 一般，需要重点优化 ❌
- <60分: 需改进，必须大幅优化后再发布 ❌

**发布前检查清单**：
- [ ] 运行质量检查工具，确保评分≥75
- [ ] 重复句子<20个
- [ ] 情感丰富性≥70/100
- [ ] 对话多样性≥70/100

**相关文档**：
- `番茄短篇故事集/skills/quality-checker/STORY_QUALITY_CHECKER.py` - 质量检查工具
- `番茄短篇故事集/skills/quality-checker/优化建议-35号故事.md` - 优化方案
- `番茄短篇故事集/memory/2026-03-25-心跳-重复段落问题.md` - 详细记录

### 重复段落深度分析（2026-03-25 02:30）
**分析目标**：识别和解决文章重复段落问题，优化写作质量

**检测范围**：
- 40号故事（full_story.md）：2314段，6处重复 ❌
- 35号故事（甜宠类）：589段，0处重复 ✅
- 34c号故事（爽文类）：1387段，0处重复 ✅

**40号故事重复详情**：
1. **重复#1**（90.91%相似度）：说明性文字被直接引用导致重复
   - 段落#1516："金阳医疗器械公司生产的电梯监控设备..."
   - 段落#1545："有。"我说，"我查到，金阳医疗器械公司生产的电梯监控设备..."

2. **重复#2-6**（100%相似度）：完全重复的环境描写、人物描写、对话
   - 环境：凌晨12点的写字楼大厅（#2022与#2225）
   - 人物：西装男瘫坐在角落（#2024与#2227）
   - 对话：报警电话、张警官台词（完全重复）

**重复的类型**：
- 完全重复（100%）：4处（环境、对话）
- 高度重复（90-99%）：2处（说明性文字引用、人物描写）

**重复的主要原因**：
1. AI生成时的"记忆缺失"（跨越章节时忘记已使用过）
2. 场景重复描写（同一场景在不同章节被重复描写）
3. 说明性文字的直接引用（没有重新组织语言）

**写作质量优化方案**：

1. **建立自查工具和流程**：
   - ✅ 批量重复段落检测脚本（`heartbeat-batch-check-duplicates.py`）
   - ✅ 详细重复段落分析脚本（`heartbeat-analyze-40-duplicates.py`）
   - 📋 自动修复建议脚本（待创建）
   - 流程：检测 → 分析 → 修复 → 再检测

2. **写作技巧优化**：
   - 变换描写角度：同一场景从不同角度描写
   - 精简重复内容：已描写过的内容用简洁方式提及
   - 避免直接引用：说明性文字用不同方式表达
   - 对话有时效性：同一句话在不同时间说，内容应该不同

3. **质量检查清单**：
   - [ ] 运行重复段落检测脚本（相似度 ≥ 85%）
   - [ ] 检查是否有100%完全重复的段落
   - [ ] 检查是否有90%以上高度重复的段落
   - [ ] 发现重复后，逐一修复
   - [ ] 修复后再次检测，确认无重复

**下一步行动**：
1. 修复40号故事的6处重复
2. 创建自动修复建议脚本
3. 在发布前检查流程中集成重复检测
4. 优化AI写作提示词，从源头减少重复

**相关文档**：
- `番茄短篇故事集/heartbeat-batch-check-duplicates.py` - 批量重复段落检测脚本
- `番茄短篇故事集/heartbeat-analyze-40-duplicates.py` - 详细重复段落分析脚本
- `番茄短篇故事集/heartbeat-history/2026-03-25-0230.md` - 重复段落分析与写作优化
- `番茄短篇故事集/memory/2026-03-25.md` - 2026-03-25工作记录

---

## 番茄小说平台运营

### 平台账号
- **账号名称**：帅帅它爸
- **平台**：番茄小说作家专区
- **发布情况**：已发布 1～29 号故事（手动发布）
- **管理页面**：https://fanqienovel.com/main/writer/short-manage
- **数据页面**：https://fanqienovel.com/main/writer/short-data?tab=1
- **登录状态**：✅ 浏览器已登录（2026-03-21 确认）

### 浏览器自动化登录（重要！）
**更新时间**：2026-03-21
**状态**：✅ 已验证稳定连接（Chrome DevTools MCP）

**验证结果**（2026-03-21 01:38）：
```json
{
  "isLoggedIn": true,
  "userName": "帅帅它爸",
  "pageTitle": "作家专区-番茄小说网-番茄小说旗下原创文学平台",
  "currentUrl": "https://fanqienovel.com/main/writer/short-manage"
}
```

**结论**：✅ 成功在已有浏览器中操作，无需打开新浏览器！

**技术方案（推荐）**：Chrome DevTools MCP ⭐⭐⭐
- 已验证稳定连接
- 支持长连接，无需担心连接断开
- 可以使用单独命令（如 `navigate_page`、`take_snapshot`）
- 直接在已有浏览器中操作（账号：帅帅它爸）
- 配置简单，无需扩展和 Token

**MCP 配置**：
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--autoConnect",
        "--channel=stable"
      ]
    }
  }
}
```

**使用示例**：
```javascript
// 导航到番茄小说
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage"

// 检查登录状态
mcporter call chrome-devtools.evaluate_script function="() => {
  return {
    isLoggedIn: document.body.innerText.includes('帅帅它爸')
  };
}"
```

**详细文档**：`skills/playwright-browser/chrome-devtools-mcp.md`

---

**备选方案**：Playwright MCP + Chrome 扩展 ⚠️

**限制**：
- ❌ CDP 连接被拒绝（403 Forbidden）
- ❌ 不支持长连接
- ❌ 不能使用单独命令
- ⚠️ 需要配置 Chrome 扩展和 Token

### 浏览器控制 Skill 文档结构（2026-03-21）

**主文档**（精简版）：
- `skills/playwright-browser/SKILL.md` - Chrome DevTools MCP 和 Playwright MCP 对比

**Chrome DevTools MCP 文档**（推荐）⭐⭐⭐：
- `skills/playwright-browser/chrome-devtools-mcp.md` - Chrome DevTools MCP 操作指南（已验证）

**Playwright MCP 文档**（备选）：
- `skills/playwright-browser/SKILL-playwright.md` - Playwright MCP 指南
- `skills/playwright-browser/mcp-config.md` - MCP 配置详解
- `skills/playwright-browser/chrome-extension-setup.md` - Chrome 扩展安装指南
- `skills/playwright-browser/examples.md` - 使用示例集合
- `skills/playwright-browser/standard-workflows.md` - 标准操作流程
- `skills/playwright-browser/debugging.md` - 调试技巧
- `skills/playwright-browser/technical-docs.md` - 技术文档
- `skills/playwright-browser/openclaw-browser.md` - OpenClaw 浏览器系统（备选方案）

**文档特点**：
- ✅ Chrome DevTools MCP 为推荐方案，已验证稳定连接
- ✅ 主文档简洁，快速对比
- ✅ 详细文档独立，按需查看
- ✅ 包含番茄小说自动化示例
- ✅ 提供完整的调试和最佳实践

### Playwright Browser Skill 文档结构（2026-03-21）

**主文档**（精简版）：
- `skills/playwright-browser/SKILL.md` - 核心原则、快速开始、常用示例

**详细文档**（引用）：
- `skills/playwright-browser/mcp-config.md` - MCP 配置详解
- `skills/playwright-browser/chrome-extension-setup.md` - Chrome 扩展安装指南
- `skills/playwright-browser/examples.md` - 使用示例集合（10+ 完整示例）
- `skills/playwright-browser/standard-workflows.md` - 标准操作流程（12 种流程）
- `skills/playwright-browser/debugging.md` - 调试技巧（10+ 常见问题）
- `skills/playwright-browser/technical-docs.md` - 技术文档（架构、最佳实践）
- `skills/playwright-browser/openclaw-browser.md` - OpenClaw 浏览器系统（备选方案）

**文档特点**：
- ✅ 主文档简洁，快速上手
- ✅ 详细文档独立，按需查看
- ✅ 包含番茄小说自动化示例
- ✅ 提供完整的调试和最佳实践

---

**备选方案**：Playwright 独立浏览器（不推荐）
- 使用 `launchPersistentContext` 方法
- 创建独立的用户数据目录：`data/chrome-user-data/`
- 需要在独立浏览器中手动登录一次
- 适用于无法使用 Chrome 扩展的情况

**登录验证脚本（备选方案）**：
- 位置：`scripts/check-fanqie-login-direct.js`
- 功能：检查浏览器登录状态，验证发布权限
- 使用方法：
  ```bash
  cd ~/.openclaw/workspace
  node scripts/check-fanqie-login-direct.js
  ```

**详细说明**：见 `scripts/README-登录状态检查.md`

### 重要发现（2026-03-19 13:00）
- ✅ **1～29 号故事已全部手动发布到平台**
- ✅ 可以在"短故事管理"页面查看已发布清单
- ⚠️ 之前误判为"只有 1 个作品"，实际是抓取脚本访问了错误的页面

### 已发布故事（1～29号）
**短故事管理页面**：https://fanqienovel.com/main/writer/short-manage

**发布状态**：
- 01_偏心父母_给弟弟买房给我借条 ✅
- 02_婆媳大战_婆婆说我配不上她儿子 ✅
- 03_脑洞金手指_觉醒读心术后全家都在演我 ✅
- ...（1～29号全部已发布）

### 数据概览（2026-03-19 19:08）
- **总故事数**：30 个（3 页，每页 10 个）
- **总阅读量**：145 次
- **平均阅读量**：4.83 次/故事
- **已签约作品**：29 个 (96.67%)
- **可申请签约**：1 个 (3.33%)
- **平均字数**：11,989 字/故事
- **总字数**：359,679 字

### 高阅读作品 TOP 5（2026-03-19 19:08）
1. **读心宠妃：皇上心里全是弹幕** - 51 阅读（历史穿越 + 读心金手指）
2. **觉醒读心术后，我发现全家都在演我** - 15 阅读（读心金手指 + 家庭）
3. **重生之我被逼顶替学籍** - 13 阅读（重生复仇 + 校园）
4. **穿越大秦：为了不陪葬我只能拼命帮政哥养生** - 13 阅读（历史穿越 + 帮皇帝）
5. **婆婆说我配不上她儿子，我把嫁妆搬走那天全家跪了** - 11 阅读（婚姻家庭 + 打脸）

### 零阅读作品（14 个）
**占比**: 46.67%（严重偏高）

**需要紧急优化的作品**：
1. 不小心穿成职场PUA受害者，我靠人间清醒反杀全场
2. 皇宫里全是弹幕
3. 职场整顿：既然老板想白嫖那我只能送他进去了
4. 全人类都装了脑机接口，只有我能听见AI的阴谋
5. 我家猫咪在骂我，还帮我搞定了房租
6. 我在凶宅听鬼讲八卦，红衣女鬼哭着求我帮她连WiFi
7. 听见霸凌者的秘密，我开始了猎杀游戏
8. 读心后发现队友想吃我
9. 妈妈说必须吃完，但我听见她在菜里下了毒
10. 误入公司不存在的第13层，后我看见了老板的秘密
11. 禁忌菜单：外卖箱里突然多了一份没人点的红烧肉
12. 合租规则：千万不要打开冰箱的第三层抽屉
13. 在此避难的第108天，队友看我的眼神变了
14. 第十三号房间的租客，藏着一个不知道自己是凶手的凶手

### 题材热度排名（基于平均阅读量）
1. **历史穿越类**: 平均 23.67 阅读（⭐⭐⭐⭐⭐）- 最强
2. **读心金手指类**: 平均 12.33 阅读（⭐⭐⭐⭐）- 第二强
3. **重生复仇类**: 平均 8.00 阅读（⭐⭐⭐）
4. **婚姻家庭类**: 平均 7.50 阅读（⭐⭐⭐）
5. **恐怖悬疑类**: 平均 2.50 阅读（⭐⭐）
6. **规则诡异/怪谈类**: 平均 1.67 阅读（⭐⭐）
7. **职场逆袭类**: 平均 1.00 阅读（⭐）- 表现最差
8. **末世求生类**: 平均 1.00 阅读（⭐）- 表现最差
9. **家庭/母亲类**: 平均 1.00 阅读（⭐）- 表现最差
10. **趣味/脑洞类**: 平均 0.00 阅读（⭐）- 完全失败

### 字数与阅读量关系
- **< 8,000 字**: 平均 0.50 阅读（最低）- 太短，缺乏吸引力
- **8,000-15,000 字**: 平均 3.47 阅读（中等）- 理想字数区间
- **> 15,000 字**: 平均 4.75 阅读（较高）- 质量更好

### 待发布故事（30～40号）
- 30_职场逆袭_人间清醒_穿成职场PUA受害者
- 31_历史翻盘_崇祯听见心声_大明朝起死回生
- 32_断亲复仇_养父母vs亲生父母_他们跪求原谅
- 33_职场逆袭_AI替代_主管PUA说AI能代替我
- 34a_古言双穿_穿成恶毒母亲
- 34b_婚姻家庭_婆媳大战
- 34c_婚姻复仇_凤凰男表面老实_我重生后揭开他的真面目
- 35_都市婚恋_相亲局_奇葩男逼婚我当场录音曝光
- 36_婚姻家庭_出轨离婚
- 38_断亲重生_父母逼我喝农药_为弟弟娶媳妇
- 39_灵异悬疑_午夜电梯
- 40_灵异悬疑_午夜电梯_全死光了

### 技术突破（2026-03-19）

### 浏览器自动化技术

#### ⭐ 推荐方案：Chrome 用户数据目录（已验证成功 ✅）

**验证时间**：2026-03-19 19:08
**验证结果**：✅ 成功抓取所有 30 个已发布作品

**原理**：直接使用用户已登录的 Chrome 浏览器配置，无需单独保存 Cookie

**优点**：
- ✅ 最简单：无需任何手动操作
- ✅ 最可靠：使用用户已有的登录状态
- ✅ 最安全：Cookie 不会泄露到文件

**核心脚本**：
- `scripts/fetch-story-list-chrome-v4.js` - 最新版本（支持多页抓取，立即关闭）⭐⭐⭐（推荐）
- `scripts/fetch-story-list-chrome-v3.js` - V3版本（支持多页抓取，等待5分钟）
- `scripts/fetch-story-list-chrome.js` - 原始版本（单页抓取）
- `scripts/analyze-story-list-structure.js` - HTML 结构分析工具
- `scripts/daily-data-monitor.js` - 定期数据监控脚本

**使用方法**：
```bash
cd ~/.openclaw/workspace
node scripts/fetch-story-list-chrome-v4.js
```

**用户数据目录**：`data/chrome-user-data/`（自动创建，无需手动操作）

**技术细节**：
- 使用 `chromium.launchPersistentContext(USER_DATA_DIR, { channel: 'chrome' })`
- 使用 `browser.pages()[0]` 获取页面（修复 API 调用问题）
- 使用正确的选择器：
  - `.article-item-title` - 标题
  - `.article-item-read` - 阅读量
  - `.article-item-number` - 字数
  - `.article-item-time` - 发布时间
  - `.short-item-sign-tag` - 签约状态
  - `a[href*="/main/writer/preview-short/"]` - 预览链接

**数据文件**：
- `data/story-list-all-YYYY-MM-DDTHH-mm-ss.json` - 所有故事列表（JSON）
- `data/story-list-all-YYYY-MM-DDTHH-mm-ss.csv` - 所有故事列表（CSV）
- `data/short-manage-YYYY-MM-DDTHH-mm-ss.png` - 截图
- `data/short-manage-YYYY-MM-DDTHH-mm-ss.html` - 页面 HTML

**详细指南**：`番茄短篇故事集/analysis/chrome-user-data-guide-2026-03-19.md`
- ✅ **数据抓取**：自动抓取番茄小说平台数据（支持多页）
- ✅ **数据存储**：保存截图、HTML、JSON、CSV 到本地
- ✅ **统计分析**：自动生成统计信息（阅读量、签约率、字数分布）

#### ⭐ 推荐方案：Chrome 用户数据目录（已验证成功）

**原理**：直接使用用户已登录的 Chrome 浏览器配置，无需单独保存 Cookie

**优点**：
- ✅ 最简单：无需任何手动操作
- ✅ 最可靠：使用用户已有的登录状态
- ✅ 最安全：Cookie 不会泄露到文件

**核心脚本**：
- `scripts/fetch-story-list-chrome-v4.js` - 短故事列表抓取（推荐，立即关闭）⭐⭐⭐
- `scripts/fetch-story-list-chrome-v3.js` - V3版本（支持多页抓取，等待5分钟）
- `scripts/fetch-story-list-chrome.js` - 原始版本（单页抓取）
- 使用 `chromium.launchPersistentContext(USER_DATA_DIR, { channel: 'chrome' })`

**使用方法**：
```bash
cd ~/.openclaw/workspace
node scripts/fetch-story-list-chrome.js
```

**用户数据目录**：`data/chrome-user-data/`（自动创建，无需手动操作）

**详细指南**：`番茄短篇故事集/analysis/chrome-user-data-guide-2026-03-19.md`
- ✅ **数据抓取**：自动抓取番茄小说平台数据
- ✅ **数据存储**：保存截图、HTML、JSON 到本地

#### 关键技术点
1. **Cookie 管理**：
   - Cookie 存储位置：`data/fanqie-cookies.json`
   - 首次登录自动保存 cookie
   - 后续自动加载 cookie，无需重复登录
   - Cookie 过期时自动提示重新登录

2. **浏览器自动化流程**：
   ```
   启动浏览器 → 加载 Cookie → 访问数据页面 → 
   检查登录状态 → 抓取数据 → 保存结果
   ```

3. **数据文件命名规范**：
   - 截图：`fanqie-work-data-YYYY-MM-DDTHH-mm-ss.png`
   - HTML：`fanqie-work-data-YYYY-MM-DDTHH-mm-ss.html`
   - JSON：`fanqie-work-data-YYYY-MM-DDTHH-mm-ss.json`

### 浏览器自动化工具
- **脚本位置**：
  - `scripts/fetch-fanqie-data-v3.js` - 最新版本（支持 Cookie 持久化）⭐
  - `scripts/fetch-fanqie-data-v2.js` - V2版本
  - `scripts/fetch-fanqie-data.js` - V1版本

- **数据文件**：
  - `data/fanqie-cookies.json` - Cookie 持久化文件（重要！）
  - `data/fanqie-screenshot.png` - 整体数据截图
  - `data/fanqie-page-content.html` - 整体数据HTML
  - `data/fanqie-work-data-*.png` - 作品数据截图
  - `data/fanqie-work-data-*.html` - 作品数据HTML
  - `data/fanqie-work-data-*.json` - 作品数据JSON

### 使用方法

#### 首次使用
```bash
cd ~/.openclaw/workspace
node scripts/fetch-fanqie-data-v3.js
```
- 脚本会打开浏览器
- 手动登录番茄小说平台
- 登录成功后自动保存 cookie
- 自动抓取数据

#### 后续使用
```bash
cd ~/.openclaw/workspace
node scripts/fetch-fanqie-data-v3.js
```
- 脚本会自动加载已保存的 cookie
- 无需重复登录
- 自动抓取数据

#### Cookie 过期处理
- 如果 cookie 过期，脚本会自动提示重新登录
- 删除旧 cookie，保存新 cookie
- 无需手动操作

### 数据分析报告
- **报告位置**：`番茄短篇故事集/analysis/fanqie-data-analysis-2026-03-19.md`
- **更新频率**：建议每天或每周更新一次

### 注意事项
1. **Cookie 文件安全**：
   - `data/fanqie-cookies.json` 包含登录信息，不要分享或提交到 git
   - 已添加到 `.gitignore`

2. **数据文件管理**：
   - 定期清理旧的数据文件（保留最近7天的即可）
   - 重要报告可以移到 `番茄短篇故事集/analysis/` 目录

3. **脚本维护**：
   - 如果番茄小说平台更新，可能需要调整选择器
   - 保留旧版本脚本作为备份

### 下一步计划
1. 确认1～27号故事发布情况
2. 优化《皇宫里全是弹幕》的开篇
3. 建立自动化数据监控系统
4. 继续发布更多故事到平台

---

## 浏览器自动化技术突破（2026-03-20）

### 核心突破
- ✅ **成功实现浏览器自动化**（2026-03-20 20:27）
- ✅ **技术方案**：使用 `browser_run_code` 执行完整的操作流程
- ✅ **验证成功**：成功获取番茄小说短故事管理页面数据

### 技术方案
**核心方法**：使用 `browser_run_code` 而不是依赖长连接

**关键代码**：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 导航到目标页面
  await page.goto('https://fanqienovel.com/main/writer/short-manage', { waitUntil: 'domcontentloaded' });
  
  // 等待页面加载
  await page.waitForTimeout(3000);
  
  // 执行操作（获取数据、点击按钮等）
  const data = await page.evaluate(() => {
    // 在这里执行页面操作
    return { /* 返回结果 */ };
  });
  
  return data;
}"
```

### 验证结果（2026-03-20 20:26）
**成功获取到的数据**：
- ✅ 页面 URL: `https://fanqienovel.com/main/writer/short-manage`
- ✅ 页面标题: `作家专区-番茄小说网-番茄小说旗下原创文学平台`
- ✅ 页面文本长度: 760 字符
- ✅ 短故事列表: 10 个故事（包含标题、阅读量、字数、发布时间）

**提取到的短故事示例**：
| # | 标题 | 状态 | 阅读量 | 字数 | 发布时间 |
|---|------|------|--------|------|----------|
| 1 | 养父母vs亲生父母，他们跪求原谅 | 待签约已发布分类 | 0阅读 | 9523字 | 2026-03-20 18:03 |
| 2 | 崇祯听见大臣心声，大明朝起死回生 | 待签约已发布分类 | 0阅读 | 7552字 | 2026-03-20 17:20 |
| 3 | 不小心穿成职场PUA受害者，我靠人间清醒反杀全场 | 已签约已发布分类 | 0阅读 | 16740字 | 2026-03-19 17:07 |
| 4 | 皇宫里全是弹幕 | 已签约已发布分类 | 290阅读 | 27617字 | 2026-03-18 13:48 |
| 5 | 重生之我被逼顶替学籍 | 已签约已发布分类 | 45阅读 | 20013字 | 2026-03-18 12:40 |

### 影响和意义
**对运营体系的影响**：
- ✅ 解决了浏览器自动化的核心问题
- ✅ 为自动发布奠定基础
- ✅ 为数据采集提供技术支持
- ✅ 为全自动化运营体系提供可能

**对盈利目标的影响**：
- ✅ 提高发布效率（从手动到自动）
- ✅ 提高数据采集效率（从手动到自动）
- ✅ 提高运营效率（从手动到自动）
- ✅ 降低人工成本

### 技术文档
- **文档位置**：`番茄短篇故事集/docs/浏览器自动化技术突破-2026-03-20.md`
- **创建时间**：2026-03-20 20:27
- **创建者**：心跳时刻 - 番茄小说创作和运营
- **状态**：✅ 技术突破已验证

### 下一步计划
1. **开发自动发布脚本**：
   - 基于已有发布包
   - 使用 `browser_run_code` 自动填充和发布

2. **开发数据采集脚本**：
   - 定时采集短故事数据
   - 自动生成分析报告

3. **创建自动化技能**：
   - 使用 skill-creator 创建自动化技能
   - 沉淀自动化流程

---

## 自动化发布系统（2026-03-20）

### 发布包生成

**脚本位置**：`scripts/generate-publish-packages.js`
**功能**：自动提取故事元数据，生成符合番茄小说发布平台要求的JSON格式发布包

**技术特点**：
- ✅ 支持多种章节格式（中文括号、英文括号、"约"字前缀）
- ✅ 自动推断标签（根据故事名称推断题材标签）
- ✅ 智能处理元数据（总章数、实际字数、完成度）
- ✅ 生成详细报告（统计信息、文件位置）

**使用方法**：
```bash
cd /Users/oyjie/.openclaw/workspace
node scripts/generate-publish-packages.js
```

**高优先级发布包**（100%完成，可立即发布）：
1. 第39号故事：午夜电梯，全死光了（18,382字，5章）
2. 第34c号故事：重生之我被逼顶替学籍（26,485字，7章）
3. 第34b号故事：婆媳大战（3,987字，2章）

**发布包数据结构**：
```json
{
  "storyId": "39",
  "storyName": "午夜电梯，全死光了",
  "storyDir": "39_灵异悬疑_午夜电梯",
  "status": "📝 进行中",
  "completionRate": "100.0%",
  "totalChapters": 5,
  "completedChapters": 5,
  "totalWordCount": 18382,
  "averageWordCount": 3676,
  "title": "午夜电梯，全死光了",
  "content": "完整故事内容...",
  "chapters": [...],
  "metadata": {...},
  "tags": ["规则怪谈"]
}
```

---

## 其他记忆
（后续继续补充）

---

---

## 番茄小说自动发布（发布页面分析）

### 发布页面结构分析（2026-03-19 19:35）

**分析时间**：2026-03-19 19:35
**分析目标**：研究番茄小说发布页面结构，为开发自动发布功能做准备

#### 关键发现

**发布入口**：
- URL: `https://fanqienovel.com/main/writer/publish-short/?enter_from=NEWCHAPTER_1`
- 入口按钮：`<a href="/main/writer/publish-short/?enter_from=NEWCHAPTER_1">新建短故事</a>`

**页面技术栈**：
- 前端框架：Vue.js 或 React（动态渲染）
- UI 组件库：Arco Design（字节跳动开源组件库）
- 富文本编辑器：ProseMirror
- 表单处理：自定义组件（非标准 HTML form）

#### 字段结构

**1. 标题字段**
- 标签：`textarea`
- 类名：`byte-textarea serial-textarea`
- 占位符：`"请输入短故事名称"`
- 父容器：`serial-editor-free-title`
- 选择器：`textarea.byte-textarea.serial-textarea`

**2. 正文字段（富文本编辑器）**
- 标签：`div`（contenteditable）
- 类名：`ProseMirror payNode-helper-content`
- 父容器：`syl-editor`
- 选择器：`div.ProseMirror.payNode-helper-content`
- 编辑器：ProseMirror

**3. 按钮**
- 存草稿：`button.short-publish-save-draft-btn`
- 下一步：`button.btn-primary-variant`

**4. 其他字段**
- 2 个 radio 按钮（用途待分析）
- 1 个 checkbox（用途待分析）

#### 多步骤发布流程

根据分析，番茄小说的发布流程是**多步骤**的：

**第一步**：填写标题和正文
- 输入标题：`textarea.byte-textarea.serial-textarea`
- 输入正文：`div.ProseMirror.payNode-helper-content`
- 点击"下一步"：`button.btn-primary-variant`

**第二步**：（待分析）
- 可能是选择封面
- 可能是选择标签
- 可能是设置简介

**第三步**：（待分析）
- 可能是最终发布
- 可能是预览页面

#### 自动填充方案

**标题字段**：
```javascript
// 方式1：使用 type() 逐字输入
await page.type('textarea.byte-textarea.serial-textarea', '这是标题');

// 方式2：使用 fill() 直接填充
await page.fill('textarea.byte-textarea.serial-textarea', '这是标题');
```

**正文字段（富文本编辑器）**：
```javascript
// 方式1：使用 fill() 填充
await page.fill('div.ProseMirror.payNode-helper-content', '这是正文内容');

// 方式2：使用 evaluate() 直接设置 innerHTML
await page.evaluate((content) => {
  const editor = document.querySelector('div.ProseMirror.payNode-helper-content');
  editor.innerHTML = content;
}, content);

// 方式3：模拟用户输入（更真实）
await page.focus('div.ProseMirror.payNode-helper-content');
await page.keyboard.type('这是正文内容');
```

**按钮点击**：
```javascript
// 点击"下一步"按钮
await page.click('button.btn-primary-variant');

// 或使用文本选择器
await page.click('button:has-text("下一步")');

// 或使用类选择器
await page.click('.short-publish-save-draft-btn');
```

#### 分析脚本

**脚本位置**：
- `scripts/analyze-publish-page-v2.js` - 发布页面分析脚本（推荐）⭐⭐⭐
- `scripts/analyze-publish-page.js` - V1版本（标准 HTML form）

**使用方法**：
```bash
cd ~/.openclaw/workspace
node scripts/analyze-publish-page-v2.js
```

**技术特点**：
- ✅ 支持动态渲染的组件（Vue/React）
- ✅ 查找 contenteditable 元素（富文本编辑器）
- ✅ 智能字段识别
- ✅ 生成详细分析报告
- ✅ 保存截图、HTML、JSON

#### 分析数据文件

**可视化文件**：
- `data/publish-page-v2-2026-03-19T11-33-58.png` - 页面截图
- `data/publish-page-v2-2026-03-19T11-33-58.html` - 页面 HTML

**数据文件**：
- `data/publish-page-v2-2026-03-19T11-33-58.json` - 页面结构 JSON

**分析报告**：
- `data/publish-analysis-v2-2026-03-19T11-33-58.md` - 详细分析报告

#### 下一步计划

**短期任务（下次心跳）**：
1. 分析"下一步"后的页面结构（封面、标签、简介、最终发布）
2. 开发自动填充脚本 V1（标题、正文）

**中期目标（本周）**：
1. 完成多步骤发布流程分析
2. 开发完整的自动发布脚本

**长期目标（本月）**：
1. 集成到自动化运营体系
2. 实现批量发布功能

---

## 2026-03-19 心跳执行记录

### 19:35 心跳（研究发布页面结构 - A级任务）
- **任务**：研究番茄小说发布页面结构，为开发自动发布功能做准备
- **背景**：HEARTBEAT.md 最高优先级任务2：浏览器的操作番茄小说能够做到完全自动化，含发布、分析、运营等一系列操作
- **成果**：
  - ✅ 创建发布页面分析脚本 V1 和 V2
  - ✅ 成功分析发布页面结构
  - ✅ 识别所有关键字段（标题、正文、按钮）
  - ✅ 识别页面技术栈（Vue/React + Arco Design + ProseMirror）
  - ✅ 识别多步骤发布流程
  - ✅ 生成详细的分析报告和可视化文件
- **核心发现**：
  - 🎯 标题字段：`textarea.byte-textarea.serial-textarea`
  - 🎯 正文字段：`div.ProseMirror.payNode-helper-content`（ProseMirror 编辑器）
  - 🎯 存草稿按钮：`button.short-publish-save-draft-btn`
  - 🎯 下一步按钮：`button.btn-primary-variant`
  - ⚠️ 发布流程是分步骤的，需要分析后续页面
- **下次任务建议**：
  - 分析"下一步"后的页面结构（封面、标签、简介、最终发布）
  - 开发自动填充脚本 V1（标题、正文）
  - 完成多步骤发布流程分析

### 18:30 心跳（修复重复段落 - S级紧急任务）
- **任务**：修复31、32、33号故事的重复段落（S级紧急任务）
- **背景**：31、32、33号故事存在重复段落，导致番茄平台拒绝发布，提示"大段落重复"
- **成果**：
  - ✅ 修复了32号故事的4个重复段落
  - ✅ 验证了31、32、33号故事都可以通过番茄平台的"大段落重复"检测
  - ✅ 更新了 task-list.md 和 heartbeat-history/latest.md
  - ✅ 生成了详细的心跳执行记录
- **核心发现**：
  - 重复段落的常见原因：用户评论重复、台词重复、描述重复
  - 修复方法：改写重复段落、删除重复段落、调整段落长度
  - 预防措施：建立写作规范、使用检测工具、优化创作流程
- **下次任务建议**：
  - 发布31、32、33号故事到番茄平台
  - 收集和分析发布后的阅读数据
  - 继续优化创作流程，提高发布效率

---

### 13:27 心跳（深度数据分析）
- **任务**：基于第1页数据的创作洞察分析
- **数据源**：10个已发布故事（第1页）
- **成果**：
  - ✅ 识别了高阅读作品的成功公式
  - ✅ 提取了5大关键发现（金手指明确性、社会共鸣、标题悬念、字数、发布时间）
  - ✅ 建立了权重模型：明确金手指(40%) + 社会共鸣强(30%) + 标题悬念(20%) + 合适字数(10%)
  - ✅ 为每个0阅读作品提供了具体的优化建议
  - ✅ 建立了数据驱动的4步优化流程
- **核心洞察**：
  - 🎯 **明确金手指是成功的关键**（40%权重）
  - 💪 **社会共鸣是阅读量的加速器**（30%权重）
  - 📝 **标题是第一道门槛**（20%权重）
  - 📊 **字数不是决定性因素**（10%权重）
- **生成文件**：
  - 番茄短篇故事集/analysis/deep-insights-2026-03-19.md（深度分析报告）
  - heartbeat-history/2026-03-19-1327.md（心跳记录）
- **下次任务建议**：
  - 抓取第2、3页数据验证洞察
  - 获取详细数据（点击率、完读率）
  - 执行优化并A/B测试

---

### 12:28 心跳（高潜力作品识别与发布策略）
- **任务**：分析归档故事集，识别高潜力作品，制定发布策略
- **背景**：数据分析任务需要有效 Cookie，但当前 Cookie 无效
- **成果**：
  - ✅ 完成归档故事集统计分析（41个故事，29种题材）
  - ✅ 识别高潜力作品（第一梯队：规则诡异、断亲复仇、职场逆袭）
  - ✅ 制定三阶段发布策略（快速验证期、重点发力期、全面铺开期）
  - ✅ 创建 Cookie 自动更新系统（scripts/fanqie-cookie-helper.js）
  - ✅ 创建技术文档（skills/浏览器自动化数据抓取/SKILL.md）
  - ✅ 生成详细分析报告（番茄短篇故事集/analysis/high-potential-stories-and-publish-strategy-2026-03-19.md）
- **发现的问题**：
  - P1：Cookie 无效，需要重新手动登录
  - P2：平台上只有 1 个作品（《皇宫里全是弹幕》），其他 26 个未发布
- **下次任务建议**：
  - 等待有效 Cookie 后执行数据分析
  - 开始第一阶段发布（5个高潜力作品）

---

## 2026-03-18 心跳执行记录

### 20:21 心跳（B1. 爆点公式库更新）
- **任务**：B1. 爆点公式库更新
- **成果**：
  - ✅ 从归档故事01（偏心父母_给弟弟买房给我借条）中提取了新的爽点公式
  - ✅ 更新 skills/小说创作/SKILL.md 中的婚姻家庭类爽点公式库
  - ✅ 新增"偏心父母隐藏身份公式"
  - ✅ 生成3个报告（更新报告、分类公式库、归档故事集总览）
- **发现的问题**：
  - P1：归档故事集目录较大（41个故事），建议按月份或类型归档
- **下次任务建议**：B2. 开篇模板优化


---

## 浏览器自动化技术突破（2026-03-20 20:27）

### 核心突破
- ✅ **成功实现浏览器自动化**（2026-03-20 20:27)
- ✅ **技术方案**：使用 `browser_run_code` 执行完整的操作流程
- ✅ **验证成功**：成功获取番茄小说短故事管理页面数据

### 技术方案
**核心方法**：使用 `browser_run_code` 而不是依赖长连接

**关键代码**：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 导航到目标页面
  await page.goto('https://fanqienovel.com/main/writer/short-manage', { waitUntil: 'domcontentloaded' });
  
  // 等待页面加载
  await page.waitForTimeout(3000);
  
  // 执行操作（获取数据、点击按钮等)
  const data = await page.evaluate(() => {
    // 在这里执行页面操作
    return { /* 返回结果 */ };
  });
  
  return data;
}"
```

### 定期数据监控脚本

**脚本位置**：
**开发时间**：2026-03-19 19:15
**功能**：
1. 每天自动抓取所有已发布作品数据（调用 `fetch-story-list-chrome-v3.js`）
2. 生成数据对比报告（对比昨日数据）
3. 计算每日变化（新增故事、阅读量变化）
4. 生成 TOP 10 高阅读作品列表
5. 生成零阅读作品列表
6. 保存对比报告到 `data/reports/daily-report-YYYY-MM-DD.json`

**使用方法**：
```bash
cd ~/.openclaw/workspace
node scripts/daily-data-monitor.js
```

**定时执行（推荐）**：
```bash
# 编辑 crontab
crontab -e

# 添加以下内容（每天 10:00 执行）
0 10 * * * cd /Users/oyjie/.openclaw/workspace && node scripts/daily-data-monitor.js >> data/reports/monitor.log 2>&1
```

**报告内容**：
- 时间戳
- 总体统计（总故事数、总阅读量、平均阅读量、签约率）
- 每日变化（新增故事、阅读量变化）
- TOP 10 高阅读作品（包含阅读量变化）
- 零阅读作品列表

**数据文件**：
- `data/reports/daily-report-YYYY-MM-DD.json` - 数据对比报告（NEW）⭐
- `data/story-list-all-YYYY-MM-DDTHH-mm-ss.json` - 所有故事列表（JSON）
- `data/story-list-all-YYYY-MM-DDTHH-mm-ss.csv` - 所有故事列表（CSV）

**技术特点**：
- 自动调用数据抓取脚本
- 自动对比最新数据和昨日数据
- 自动计算每日变化
- 自动生成结构化报告（JSON 格式）
- 自动检测异常数据（零阅读作品）

**验证结果**（2026-03-19 19:15）：
- ✅ 脚本运行成功
- ✅ 数据对比报告生成正常
- ✅ TOP 10 高阅读作品列表正常
- ✅ 零阅读作品列表正常

**数据对比结果**（11:08 → 11:14）：
- 时间间隔：6 分钟
- 数据变化：无（所有 30 个故事的阅读量都相同）
- 原因：时间间隔太短，数据没有更新

