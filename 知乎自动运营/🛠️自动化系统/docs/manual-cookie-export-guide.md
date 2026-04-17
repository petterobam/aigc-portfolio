# 知乎Cookie手动导出指南

## 📋 步骤1：打开知乎并确认登录

1. 打开你的Chrome浏览器
2. 访问知乎：https://www.zhihu.com
3. 确认已登录（右上角显示你的头像和昵称）

---

## 📋 步骤2：打开开发者工具

1. 在知乎页面右键点击
2. 选择"检查"或"检查元素"
3. 打开开发者工具面板

---

## 📋 步骤3：导出Cookie

### 方法1：使用开发者工具的"应用"标签（推荐）⭐⭐⭐⭐⭐

1. 点击开发者工具顶部的"应用"（Application）标签
2. 在左侧菜单中展开"存储"（Storage）
3. 点击"Cookie" → "https://www.zhihu.com"
4. 在右侧的Cookie列表中，点击任意Cookie
5. 按Cmd+A（Mac）或Ctrl+A（Windows）全选所有Cookie
6. 右键点击，选择"复制为cURL"或"复制"（Copy）
7. 将Cookie粘贴到文本编辑器中

### 方法2：使用JavaScript代码（更精确）⭐⭐⭐⭐⭐

1. 点击开发者工具顶部的"控制台"（Console）标签
2. 复制并粘贴以下代码：
```javascript
// 获取所有知乎Cookie
const cookies = document.cookie;

// 将Cookie字符串转换为对象
const cookieObj = {};
cookies.split(';').forEach(cookie => {
  const [name, value] = cookie.trim().split('=');
  cookieObj[name] = value;
});

// 输出Cookie对象
console.log(JSON.stringify(cookieObj, null, 2));

// 复制到剪贴板（可选）
copy(JSON.stringify(cookieObj, null, 2));
```

3. 按Enter执行代码
4. 控制台会输出Cookie的JSON格式
5. 复制JSON格式的Cookie

### 方法3：使用浏览器扩展（最方便）⭐⭐⭐⭐

1. 安装"EditThisCookie"浏览器扩展
2. 点击浏览器工具栏中的EditThisCookie图标
3. 找到"www.zhihu.com"
4. 点击"导出"按钮
5. 选择JSON格式
6. 保存为文件

---

## 📋 步骤4：保存Cookie到文件

1. 创建文件：`知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-latest.json`
2. 将复制的Cookie JSON粘贴到文件中
3. 保存文件

### Cookie JSON格式示例：

```json
[
  {
    "name": "z_c0",
    "value": "2|1:0|10:1743490000|4:z_c0|92:...",
    "domain": ".zhihu.com",
    "path": "/",
    "expires": 1743490000,
    "httpOnly": true,
    "secure": true,
    "sameSite": "None"
  },
  {
    "name": "d_c0",
    "value": "\"AAC...",
    "domain": ".zhihu.com",
    "path": "/",
    "expires": 1743490000,
    "httpOnly": false,
    "secure": true,
    "sameSite": "Lax"
  }
]
```

### 重要Cookie说明：

| Cookie名称 | 说明 | 重要性 |
|-----------|------|--------|
| z_c0 | 身份验证Cookie | ⭐⭐⭐⭐⭐（必须） |
| d_c0 | 设备ID | ⭐⭐⭐⭐ |
| _zap | 系统参数 | ⭐⭐⭐ |
| tst | 时间戳 | ⭐⭐ |

**最低要求**: 至少需要`z_c0`和`d_c0`两个Cookie。

---

## 📋 步骤5：验证Cookie

运行以下脚本验证Cookie是否有效：

```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/verify-zhihu-cookies.js
```

如果Cookie有效，脚本会显示：
- ✅ Cookie数量
- ✅ 用户名
- ✅ 登录状态

---

## ⚠️ 注意事项

1. **Cookie有效期**:
   - 知乎Cookie通常有效期为7-30天
   - 建议每周更新一次Cookie

2. **安全性**:
   - Cookie文件包含登录信息，不要分享或提交到git
   - 已添加到`.gitignore`

3. **隐私**:
   - Cookie包含你的个人登录信息
   - 请妥善保管

---

## 🔄 定期更新Cookie

建议设置定时任务，定期提醒更新Cookie：

### 使用cron定时任务

```bash
# 编辑crontab
crontab -e

# 添加提醒任务（每周一早上9点提醒）
0 9 * * 1 echo "请更新知乎Cookie" | terminal-notifier
```

### 使用OpenClaw心跳

在OpenClaw的心跳任务中添加Cookie更新提醒：

```javascript
// 在HEARTBEAT.md中添加
- 每周一早上9点提醒：请更新知乎Cookie
```

---

## 🔧 故障排查

### 问题1: Cookie验证失败

**原因**: Cookie已过期

**解决**:
1. 重新登录知乎
2. 重新导出Cookie
3. 更新Cookie文件

### 问题2: 登录后Cookie仍然无效

**原因**: Cookie格式错误

**解决**:
1. 检查Cookie是否为JSON数组格式
2. 确保至少包含`z_c0`和`d_c0`
3. 检查Cookie的`domain`是否为`.zhihu.com`

### 问题3: 无法复制Cookie

**原因**: 浏览器安全限制

**解决**:
1. 使用JavaScript代码方法（方法2）
2. 或使用浏览器扩展（方法3）

---

**更新时间**: 2026-03-28
**维护者**: 无何有
