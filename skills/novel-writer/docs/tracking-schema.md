# 追踪系统 Schema 文档

本文档定义 Novel Writer 追踪系统所有数据文件的完整格式规范。
追踪文件存放在小说项目根目录的 `.novel/` 隐藏目录下。

---

## 目录结构

```
.novel/
├── config.json           # 项目配置与进度
├── plot-tracker.json     # 情节追踪（情节线、伏笔、冲突）
├── timeline.json         # 故事时间线
├── character-state.json  # 角色状态快照
└── relations.json        # 角色关系网络
```

---

## config.json — 项目配置

**用途**：记录项目基本信息、写作方法选择、当前进度、下一步建议。每次执行任何命令后更新 `lastUpdated` 和 `nextAction`。

```json
{
  "novel": "小说名称",
  "version": "1.0.0",
  "method": "三幕结构",
  "lastUpdated": "2026-01-01T10:00:00Z",
  "status": "in-progress",

  "progress": {
    "currentChapter": 5,
    "totalChaptersPlanned": 30,
    "currentVolume": 1,
    "totalVolumesPlanned": 3,
    "completionPercent": 16.7
  },

  "wordCount": {
    "current": 15000,
    "target": 200000,
    "averagePerChapter": 3000
  },

  "spec": {
    "genre": "都市爱情",
    "subGenre": "职场",
    "targetReaders": "25-35岁都市女性",
    "coreSelling": "读心术 + 职场逆袭",
    "pov": "第一人称"
  },

  "files": {
    "storySpec": "spec/story-spec.md",
    "constitution": "spec/writing-constitution.md",
    "storyOutline": "outline/story-outline.md",
    "chapters": "outline/chapters.md",
    "styleGuide": "style-guide.md"
  },

  "nextAction": "/write 第6章",
  "pendingTasks": [
    "完善反派角色档案",
    "补充第二幕世界观设定"
  ],

  "notes": "主线冲突在第8章需要升级，注意节奏"
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `novel` | string | ✅ | 小说名称 |
| `method` | string | ✅ | 写作方法：`三幕结构` / `英雄之旅` / `故事圈` / `七点结构` / `皮克斯公式` / `雪花十步` |
| `status` | string | ✅ | `planning` / `in-progress` / `revising` / `completed` |
| `progress.currentChapter` | number | ✅ | 当前已写完的章节数（0 = 尚未开始） |
| `wordCount.current` | number | ✅ | 当前累计字数 |
| `nextAction` | string | ✅ | AI 推荐的下一步操作 |

---

## plot-tracker.json — 情节追踪

**用途**：追踪所有情节线的进展状态、伏笔的埋设与回收、活跃冲突列表。每章写完后由 `/write` 命令自动更新。

```json
{
  "novel": "小说名称",
  "lastUpdated": "2026-01-01T10:00:00Z",
  "atChapter": 5,

  "plotlines": {
    "main": {
      "name": "主线：职场逆袭",
      "description": "李明利用读心术在职场重新站稳脚跟，最终揭露上司的阴谋",
      "status": "active",
      "currentStage": "第二幕前半 - 探索阶段",
      "methodNode": "三幕结构/第二幕/中点前",
      "completedNodes": [
        { "name": "普通世界建立", "chapter": 1 },
        { "name": "激励事件：读心术觉醒", "chapter": 2 },
        { "name": "跨越门槛：决定反击", "chapter": 3 }
      ],
      "upcomingNodes": [
        { "name": "中点：重大发现", "plannedChapter": 10 },
        { "name": "最黑暗时刻", "plannedChapter": 18 },
        { "name": "高潮决战", "plannedChapter": 27 }
      ],
      "currentFocus": "建立盟友关系，收集证据"
    },
    "subplots": [
      {
        "id": "subplot-001",
        "name": "感情线：李明与王晓",
        "status": "active",
        "startChapter": 3,
        "plannedResolutionChapter": 28,
        "currentState": "暧昧阶段",
        "notes": "需要在第15章制造一次误会来增加张力"
      },
      {
        "id": "subplot-002",
        "name": "家庭线：父子和解",
        "status": "dormant",
        "startChapter": 1,
        "plannedResolutionChapter": 25,
        "currentState": "父亲出场，关系冷淡",
        "notes": "第12章需要推进一次父子对话"
      }
    ]
  },

  "foreshadowing": [
    {
      "id": "foreshadow-001",
      "content": "李明在第1章无意间读到了上司「她已经知道一切」的心声",
      "planted": {
        "chapter": 1,
        "context": "第一次使用读心术的场景"
      },
      "hints": [
        { "chapter": 3, "description": "上司对李明态度突然变冷" },
        { "chapter": 5, "description": "上司在电话中的异常反应" }
      ],
      "plannedReveal": {
        "chapter": 15,
        "description": "揭示上司早已察觉李明有读心能力，一直在设局"
      },
      "status": "active",
      "importance": "critical",
      "deadline": "必须在第16章前回收，否则读者会忘记"
    },
    {
      "id": "foreshadow-002",
      "content": "王晓桌上放着一张旧照片，每次李明靠近她都会翻扣",
      "planted": {
        "chapter": 3,
        "context": "李明第一次去王晓工位借资料"
      },
      "hints": [],
      "plannedReveal": {
        "chapter": 20,
        "description": "照片中是王晓前男友，正是反派的得力干将"
      },
      "status": "active",
      "importance": "high",
      "deadline": null
    },
    {
      "id": "foreshadow-003",
      "content": "主角在第2章提到家里有一枚「不知从哪来的」玉佩",
      "planted": {
        "chapter": 2,
        "context": "主角整理遗物的场景"
      },
      "hints": [],
      "plannedReveal": {
        "chapter": 22,
        "description": "玉佩是读心术真正来源的关键线索"
      },
      "status": "active",
      "importance": "medium",
      "deadline": null
    }
  ],

  "conflicts": {
    "active": [
      {
        "id": "conflict-001",
        "name": "李明 vs 上司陷害",
        "type": "external",
        "intensity": 6,
        "startChapter": 2,
        "parties": ["李明", "上司陈刚"],
        "currentState": "上司已开始布局，李明尚未察觉全貌",
        "plannedEscalationChapter": 12,
        "plannedResolutionChapter": 27
      },
      {
        "id": "conflict-002",
        "name": "李明内心：道德vs利益",
        "type": "internal",
        "intensity": 4,
        "startChapter": 3,
        "parties": ["李明"],
        "currentState": "读心术用到什么程度算「太过分」",
        "plannedEscalationChapter": 14,
        "plannedResolutionChapter": 20
      }
    ],
    "resolved": [
      {
        "id": "conflict-000",
        "name": "李明失业危机",
        "type": "external",
        "resolvedChapter": 3,
        "resolution": "利用读心术保住工作，但引发了新的冲突"
      }
    ],
    "upcoming": [
      {
        "id": "conflict-003",
        "name": "感情误会：王晓误解李明",
        "type": "relationship",
        "plannedStartChapter": 15,
        "plannedResolutionChapter": 19
      }
    ]
  },

  "plotHoles": [],
  "inconsistencies": [],
  "reminders": [
    {
      "chapter": 8,
      "note": "需要解释李明为什么突然可以屏蔽读心术，之前没有铺垫"
    }
  ]
}
```

### 字段说明

#### `foreshadowing[].importance`
| 值 | 含义 |
|----|------|
| `critical` | 核心伏笔，必须回收，影响主线 |
| `high` | 重要伏笔，推荐回收 |
| `medium` | 一般伏笔，可回收可不回收 |
| `low` | 细节伏笔，增加世界观厚度 |

#### `foreshadowing[].status`
| 值 | 含义 |
|----|------|
| `active` | 已埋设，未回收 |
| `revealed` | 已回收 |
| `abandoned` | 决定放弃（需记录原因） |

#### `conflicts[].type`
| 值 | 含义 |
|----|------|
| `external` | 与外部势力的冲突 |
| `internal` | 主角内心冲突 |
| `relationship` | 人物间关系冲突 |
| `environment` | 与环境/自然/命运的冲突 |

#### `conflicts[].intensity`
1-10分制，每次升级时更新：
- 1-3：日常矛盾
- 4-6：明显冲突，影响行动
- 7-9：危机级，威胁核心目标
- 10：最终决战级

---

## timeline.json — 故事时间线

**用途**：追踪故事内时间的流逝，防止时间矛盾（旅行时间、年龄变化、季节描写前后不一致等）。

```json
{
  "novel": "小说名称",
  "lastUpdated": "2026-01-01T10:00:00Z",
  "atChapter": 5,

  "storyTime": {
    "format": "现代都市，使用「第X天/第X周」记法",
    "start": "故事开始于某周一早晨",
    "current": "第3周 周四",
    "totalElapsed": "约18天",
    "realWorldAnchor": "无（架空现代）"
  },

  "calendar": {
    "说明": "按故事内时间顺序排列，用于快速核查时间跨度",
    "entries": [
      {
        "storyTime": "第1天（周一）",
        "chapter": 1,
        "events": [
          "李明接到被裁员通知",
          "读心术首次觉醒（无意识）"
        ],
        "location": "公司、地铁、家"
      },
      {
        "storyTime": "第3天（周三）",
        "chapter": 2,
        "events": [
          "李明重新入职",
          "读心术第二次觉醒（有意识）"
        ],
        "location": "公司"
      },
      {
        "storyTime": "第5天（周五）",
        "chapter": 3,
        "events": [
          "第一次利用读心术化解危机",
          "与王晓正式认识"
        ],
        "location": "会议室、走廊"
      },
      {
        "storyTime": "第8天（下周一）",
        "chapter": 4,
        "events": [
          "跳过周末（需补充是否发生重要事件）",
          "上司开始异常冷淡"
        ],
        "location": "公司"
      },
      {
        "storyTime": "第10天（周三）",
        "chapter": 5,
        "events": [
          "李明发现公司账目异常"
        ],
        "location": "财务室"
      }
    ]
  },

  "parallelEvents": {
    "说明": "同一时间点，不同视角/地点发生的事件",
    "timepoints": {
      "第5天傍晚": [
        { "pov": "李明", "location": "便利店", "event": "庆祝化险为夷" },
        { "pov": "上司陈刚", "location": "停车场", "event": "秘密打电话汇报李明情况" }
      ]
    }
  },

  "timeConstraints": [
    {
      "id": "tc-001",
      "description": "公司季度审计在第35天开始",
      "deadline": "第35天",
      "affectedPlots": ["主线财务阴谋"],
      "note": "主线需要在审计前完成证据收集"
    },
    {
      "id": "tc-002",
      "description": "主角试用期3个月到期",
      "deadline": "第90天",
      "affectedPlots": ["主线", "感情线"],
      "note": "制造额外压力"
    }
  ],

  "travelTimes": {
    "说明": "重要地点间的移动时间，用于核查行程合理性",
    "routes": {
      "家→公司": "地铁45分钟",
      "公司→咖啡馆（常去）": "步行10分钟",
      "公司→王晓家": "出租车20分钟"
    }
  },

  "anomalies": {
    "说明": "已发现的时间矛盾，等待修复",
    "issues": [
      {
        "id": "anomaly-001",
        "chapter": 4,
        "description": "第4章描述「三天后」，但根据事件顺序应该是第二天",
        "severity": "high",
        "status": "pending",
        "suggestedFix": "将「三天后」改为「第二天」，或补充中间两天的事件"
      }
    ]
  }
}
```

### 字段说明

#### `storyTime.format`
描述时间记法风格，例如：
- `"历史架空，使用「永安X年X月X日」"`
- `"玄幻修仙，使用「修炼第X年」"`
- `"现代都市，使用星期几 + 具体时刻"`

#### `anomalies[].severity`
| 值 | 含义 |
|----|------|
| `critical` | 严重矛盾，读者肯定发现，必须修复 |
| `high` | 明显问题，细心读者会察觉 |
| `medium` | 逻辑瑕疵，可修可不修 |
| `low` | 极细节矛盾，忽略不影响阅读 |

---

## character-state.json — 角色状态快照

**用途**：记录每个角色在当前章节结束时的精确状态，防止角色前一章在A城、后一章在B城却无移动描写的硬伤。

```json
{
  "novel": "小说名称",
  "lastUpdated": "2026-01-01T10:00:00Z",
  "atChapter": 5,
  "storyTime": "第10天（周三）傍晚",

  "characters": {
    "李明": {
      "role": "protagonist",
      "location": {
        "current": "公司财务室",
        "movedFromChapter": 5,
        "previousLocation": "自己的工位"
      },
      "physicalState": {
        "status": "健康",
        "injuries": [],
        "appearance": "正常上班装扮",
        "note": ""
      },
      "emotionalState": {
        "dominant": "紧张、兴奋",
        "secondary": "轻微焦虑",
        "trigger": "发现账目异常，意识到这比自己想的更严重",
        "arc": "从「只是保住工作」升级为「想彻底揭露阴谋」"
      },
      "knowledge": {
        "known": [
          "上司陈刚一直在挪用公款",
          "王晓似乎知道一些内情",
          "自己的读心术还不稳定"
        ],
        "unknown": [
          "上司背后的真正幕后黑手",
          "王晓前男友与反派的关联",
          "读心术的真正来源（玉佩的秘密）"
        ],
        "falseBeliefs": [
          "以为上司是独自行动，实际上有更大的组织"
        ]
      },
      "inventory": [
        "工作牌",
        "手机（录音功能已开启）",
        "家传玉佩（随身佩戴）",
        "财务异常的照片截图（刚拍）"
      ],
      "relationships": {
        "activeGoals": [
          "收集上司挪用公款的证据",
          "不暴露自己有读心术"
        ],
        "completedGoals": [
          "保住工作（第3章）"
        ]
      },
      "abilityState": {
        "读心术": {
          "masteryLevel": "初级",
          "currentLimit": "需要安静环境，嘈杂时无法读取",
          "recentChange": "第4章发现可以主动触发，不再只是被动接收",
          "note": "疲劳时效果减弱"
        }
      },
      "changesThisChapter": "发现账目异常，决心深入调查；读心术使用更加主动"
    },

    "陈刚（反派上司）": {
      "role": "antagonist",
      "location": {
        "current": "总经理办公室",
        "movedFromChapter": 4,
        "previousLocation": "会议室"
      },
      "physicalState": {
        "status": "健康",
        "injuries": [],
        "appearance": "西装革履，但最近眼睛下有黑眼圈",
        "note": "第4章起开始显得疲惫，暗示他压力也在增加"
      },
      "emotionalState": {
        "dominant": "焦虑、多疑",
        "secondary": "愤怒",
        "trigger": "察觉有人在查账，怀疑是李明",
        "arc": "从「胸有成竹」逐渐变为「草木皆兵」"
      },
      "knowledge": {
        "known": [
          "李明可能有某种异常能力（第1章读心那次，他感到不对劲）",
          "公司审计将在第35天开始",
          "幕后老板要求在审计前完成资金转移"
        ],
        "unknown": [
          "李明读心术的具体能力范围",
          "李明是否已获得具体证据"
        ],
        "falseBeliefs": []
      },
      "inventory": [
        "两部手机（一部专用联络幕后黑手）",
        "保险箱钥匙"
      ],
      "relationships": {
        "activeGoals": [
          "在审计前完成资金转移",
          "查清李明是否是威胁"
        ],
        "completedGoals": []
      },
      "abilityState": {},
      "changesThisChapter": "得知有人在查账，开始针对性布局"
    },

    "王晓": {
      "role": "love-interest",
      "location": {
        "current": "回家途中（地铁上）",
        "movedFromChapter": 5,
        "previousLocation": "自己工位"
      },
      "physicalState": {
        "status": "健康",
        "injuries": [],
        "appearance": "",
        "note": ""
      },
      "emotionalState": {
        "dominant": "心事重重",
        "secondary": "对李明有好感但刻意压制",
        "trigger": "今天李明问她关于财务的事，她有些慌张",
        "arc": "从「礼貌疏离」到「开始动摇」"
      },
      "knowledge": {
        "known": [
          "知道上司有问题，但不知道细节",
          "前男友（张伟）曾警告她不要深查公司财务"
        ],
        "unknown": [
          "李明在调查公司账务",
          "张伟与上司的真实关系"
        ],
        "falseBeliefs": [
          "以为前男友只是好意提醒，实际上是帮凶"
        ]
      },
      "inventory": [
        "桌上的旧照片（已翻扣）",
        "一个她从未打开过的信封（张伟留下的）"
      ],
      "relationships": {
        "activeGoals": [
          "保住工作",
          "远离危险（不自觉地保护自己）"
        ],
        "completedGoals": []
      },
      "abilityState": {},
      "changesThisChapter": "对李明的调查有所察觉，内心出现动摇"
    }
  }
}
```

### 字段说明

#### `characters[].role`
| 值 | 含义 |
|----|------|
| `protagonist` | 主角 |
| `deuteragonist` | 第二主角 |
| `antagonist` | 反派/对立角色 |
| `love-interest` | 感情线对象 |
| `mentor` | 导师/指引者 |
| `ally` | 盟友 |
| `foil` | 对照角色 |
| `supporting` | 次要角色 |

#### `knowledge` 三分结构
- `known`：角色**确实知道**的信息
- `unknown`：角色**不知道**的信息（读者可能知道 → 制造悬念）
- `falseBeliefs`：角色**误以为正确**的信息（最宝贵的叙事张力来源）

---

## relations.json — 角色关系网络

**用途**：追踪角色间关系的类型、强度和变化历史，防止关系发展前后矛盾。

```json
{
  "novel": "小说名称",
  "lastUpdated": "2026-01-01T10:00:00Z",
  "atChapter": 5,

  "relations": [
    {
      "id": "rel-001",
      "characters": ["李明", "王晓"],
      "type": "budding-romance",
      "surfaceType": "同事",
      "actualType": "暗生情愫（双向，均未表明）",
      "intensity": 4,
      "intensityMax": 10,
      "startChapter": 3,
      "history": [
        {
          "chapter": 3,
          "event": "正式认识，李明帮王晓化解工作尴尬",
          "change": "从陌生人变为「有好感的同事」",
          "intensityChange": "+2 → 2"
        },
        {
          "chapter": 5,
          "event": "李明问王晓财务相关问题，她有所慌张",
          "change": "王晓开始注意到李明不寻常，好感与警惕并存",
          "intensityChange": "+2 → 4"
        }
      ],
      "plannedDevelopment": [
        { "chapter": 10, "milestone": "第一次在工作外单独相处" },
        { "chapter": 15, "milestone": "误会产生，关系降温" },
        { "chapter": 20, "milestone": "误会解开，关系升温" },
        { "chapter": 28, "milestone": "表白/确认关系" }
      ],
      "hiddenDimension": "王晓实际上知道一些关于李明读心术的迹象，但没说出口",
      "note": ""
    },

    {
      "id": "rel-002",
      "characters": ["李明", "陈刚"],
      "type": "adversarial",
      "surfaceType": "下属与上司",
      "actualType": "被猎与猎人（李明尚不知全貌）",
      "intensity": 6,
      "intensityMax": 10,
      "startChapter": 1,
      "history": [
        {
          "chapter": 1,
          "event": "陈刚主导裁员，李明被裁",
          "change": "从「普通下属」变为「需要处理的麻烦」",
          "intensityChange": "+3 → 3"
        },
        {
          "chapter": 3,
          "event": "李明反将一军保住工作，陈刚开始真正警惕",
          "change": "陈刚从轻视变为主动防范",
          "intensityChange": "+3 → 6"
        }
      ],
      "plannedDevelopment": [
        { "chapter": 12, "milestone": "陈刚对李明发动第一次直接打击" },
        { "chapter": 20, "milestone": "双方进入公开对立阶段" },
        { "chapter": 27, "milestone": "终极对决，陈刚落败" }
      ],
      "hiddenDimension": "陈刚背后有更大的幕后黑手，他本人也是受害者之一",
      "note": ""
    },

    {
      "id": "rel-003",
      "characters": ["陈刚", "幕后黑手"],
      "type": "hierarchical-threat",
      "surfaceType": "合作者",
      "actualType": "控制与被控制（陈刚不敢反抗）",
      "intensity": 8,
      "intensityMax": 10,
      "startChapter": 1,
      "history": [
        {
          "chapter": 1,
          "event": "（背景设定）陈刚早年被黑手抓住把柄",
          "change": "从「普通合作」变为「被迫服从」",
          "intensityChange": "初始 → 8"
        }
      ],
      "plannedDevelopment": [
        { "chapter": 22, "milestone": "陈刚意识到自己也是弃子，考虑倒戈" },
        { "chapter": 25, "milestone": "陈刚向李明透露部分真相" }
      ],
      "hiddenDimension": "幕后黑手是陈刚的亲哥哥，这是陈刚一直顺从的真正原因",
      "note": "这条关系线在第22章前对读者不可见"
    },

    {
      "id": "rel-004",
      "characters": ["王晓", "张伟（前男友）"],
      "type": "estranged",
      "surfaceType": "已分手的前男友",
      "actualType": "前男友是反派一方，王晓被蒙在鼓里",
      "intensity": 3,
      "intensityMax": 10,
      "startChapter": 0,
      "history": [
        {
          "chapter": 0,
          "event": "（背景）两人半年前分手，原因是张伟「无故消失」",
          "change": "从「相爱」到「分手、疑惑」",
          "intensityChange": "初始 → 3"
        }
      ],
      "plannedDevelopment": [
        { "chapter": 18, "milestone": "张伟突然重新出现" },
        { "chapter": 20, "milestone": "王晓发现前男友与上司的关联，心理崩溃" }
      ],
      "hiddenDimension": null,
      "note": ""
    }
  ],

  "relationshipMap": {
    "说明": "用于快速理解全局关系，格式：「角色A --[关系]--> 角色B」",
    "summary": [
      "李明 --[暗恋·双向]--> 王晓",
      "李明 <--[猎与被猎]--> 陈刚",
      "陈刚 <--[控制]--> 幕后黑手",
      "王晓 --[疑惑·不知真相]--> 张伟",
      "张伟 --[效力]--> 幕后黑手"
    ]
  },

  "groupDynamics": [
    {
      "name": "正义联盟（非正式）",
      "members": ["李明", "王晓（潜在）", "财务小陈（潜在）"],
      "status": "形成中",
      "cohesion": 3,
      "note": "目前只有李明一人，其他人是潜在盟友"
    },
    {
      "name": "幕后阵营",
      "members": ["幕后黑手", "陈刚", "张伟"],
      "status": "active",
      "cohesion": 6,
      "note": "内部有裂缝，陈刚的忠诚度在下降"
    }
  ]
}
```

### 字段说明

#### `relations[].type`
| 值 | 含义 |
|----|------|
| `friendship` | 友谊 |
| `romance` | 恋爱关系 |
| `budding-romance` | 萌芽中的爱情 |
| `family` | 家庭关系 |
| `mentor-student` | 师徒 |
| `adversarial` | 对立/敌对 |
| `rival` | 竞争对手（非纯敌对） |
| `hierarchical` | 上下级（中性） |
| `hierarchical-threat` | 上下级（有威胁性） |
| `ally` | 盟友（非朋友，利益一致） |
| `estranged` | 疏离（曾经亲近，现在疏远） |
| `complex` | 复杂关系（爱恨交织等） |

#### `relations[].intensity`
1-10分，表示关系的强烈程度（不代表正负，敌对也可以强烈）：
- 1-3：淡漠/普通
- 4-6：显著/重要
- 7-9：强烈/主导生活
- 10：生死级别的羁绊

---

## 追踪文件更新规则

### 自动更新时机

| 命令 | 更新的文件 |
|------|-----------|
| `/write 第X章` | 全部5个文件 |
| `/track-init` | 全部5个文件（初始化） |
| `/plot-check` | `plot-tracker.json`（添加发现的矛盾到 `anomalies`） |
| `/timeline check` | `timeline.json`（添加发现的时间矛盾） |
| `/relations update` | `relations.json` |

### 更新原则

1. **每次只记录「变化」**：只有本章发生改变的字段才需要更新，未变化的字段保持原值
2. **不删除历史**：关系 `history`、伏笔 `hints`、已解决的冲突都保留在文件中
3. **标记矛盾而非直接修改**：发现矛盾时，加入 `anomalies` 列表，等待作者决策
4. **atChapter 必须同步**：所有文件的 `atChapter` 必须保持一致

### 一致性规则

- `config.json` 的 `progress.currentChapter` = 所有其他文件的 `atChapter`
- `character-state.json` 的每个角色 `location.movedFromChapter` ≤ `atChapter`
- `plot-tracker.json` 的 `completedNodes` 中的章节号 ≤ `atChapter`
- `timeline.json` 的 `calendar.entries` 最后一条章节号 ≤ `atChapter`

---

*Schema 版本：1.0 | 与 novel-writer-cn v0.20.0 兼容*