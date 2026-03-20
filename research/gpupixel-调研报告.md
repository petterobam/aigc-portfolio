# GPUPixel 调研报告

## 项目概述

**GPUPixel** 是由 PixPark 开源的跨平台高性能图像/视频处理库，基于 GPU 渲染，专为实时美颜、滤镜、特效设计。

- **GitHub**: https://github.com/pixpark/gpupixel
- **语言**: C++ (核心) + 平台封装层
- **协议**: MIT License
- **支持平台**: iOS, Android, macOS, Windows, Linux

---

## 核心特性

### 1. 高性能 GPU 渲染
- 基于 **OpenGL ES 3.0+** 
- 全程 GPU 处理，CPU 几乎零负担
- 支持 1080p/4K 实时处理 (30fps+)

### 2. 丰富的内置效果
| 功能模块 | 说明 |
|---------|------|
| **磨皮** | 多种算法（双边滤波、高斯模糊+边缘保护） |
| **美白** | 肤色调整、亮度提升 |
| **瘦脸** | 基于关键点的网格变形 |
| **大眼** | 局部放大变形 |
| **滤镜** | 100+ 预设 LUT 滤镜 |
| **美妆** | 口红、腮红、眉毛等 |

### 3. 模块化架构
```
Source → [Face Detection] → [Beauty Filter] → [Color Filter] → [Output]
              ↓                    ↓                ↓
         关键点定位          磨皮/美白/瘦脸      LUT/调色
```

### 4. 跨平台统一 API
- C++ 核心层，平台无关
- 各平台有原生封装（iOS/Android SDK）
- 接口简洁，易于集成

---

## 技术架构

### 渲染管线
```
┌──────────────────────────────────────────────┐
│               GPUPixel Pipeline              │
├──────────────────────────────────────────────┤
│  Camera/Video/Image Input                    │
│         ↓                                    │
│  [Source Filter] - 纹理输入                   │
│         ↓                                    │
│  [Face Mesh Filter] - 人脸网格（可选）         │
│         ↓                                    │
│  [Beauty Filter] - 磨皮/美白                  │
│         ↓                                    │
│  [Face Reshape Filter] - 瘦脸/大眼            │
│         ↓                                    │
│  [Color Filter] - LUT/调色                    │
│         ↓                                    │
│  [Target Output] - 屏幕/编码器/文件            │
└──────────────────────────────────────────────┘
```

### 关键类
- `GPUPixel::Source` - 输入源基类
- `GPUPixel::Filter` - 滤镜基类
- `GPUPixel::BeautyFilter` - 美颜专用
- `GPUPixel::FaceReshapeFilter` - 瘦脸大眼
- `GPUPixel::Target` - 输出目标

---

## 与你的场景匹配度

### 你的需求
- ✅ 图片美颜（美白 + 磨皮）
- ✅ 换脸前预处理
- ✅ 可能扩展到视频

### GPUPixel 优势
| 优点 | 说明 |
|------|------|
| ⚡ 性能极高 | GPU 加速，毫秒级处理 |
| 🎯 功能对口 | 内置美白/磨皮，开箱即用 |
| 🔧 可定制 | 参数可调（强度、范围） |
| 📱 移动端友好 | 如果未来要上 App，一套代码 |

### GPUPixel 劣势
| 缺点 | 说明 |
|------|------|
| 🖥️ 需要GPU环境 | 服务器端需要 GPU 或软渲染支持 |
| 📦 依赖较重 | 需要 OpenGL 环境 |
| 🔨 集成成本 | C++ 编译，Python 调用需要封装 |

---

## 部署方案建议

### 方案 A: Python 封装（推荐快速验证）
```bash
# 编译 GPUPixel 动态库
git clone https://github.com/pixpark/gpupixel
cd gpupixel
mkdir build && cd build
cmake .. -DBUILD_PYTHON=ON  # 如果有 Python binding
make -j8
```

然后用 `ctypes` 或 `pybind11` 封装调用。

### 方案 B: 独立服务
将 GPUPixel 编译成独立可执行文件或 gRPC 服务，Python 通过 IPC 调用：
```
Python 上传图片 → GPUPixel 服务处理 → 返回结果
```

### 方案 C: 混合方案
- **轻量场景**：继续用我之前给的 OpenCV + Mediapipe 方案
- **高并发/视频**：部署 GPUPixel 服务

---

## 代码示例（C++）

```cpp
#include "gpupixel/gpupixel.h"

using namespace gpupixel;

// 创建美颜滤镜
auto beauty_filter = std::make_shared<BeautyFilter>();
beauty_filter->SetBeautyLevel(0.6f);  // 磨皮强度
beauty_filter->SetWhitenLevel(0.4f);  // 美白强度

// 创建输入源
auto source = std::make_shared<SourceImage>();
source->Load("input.jpg");

// 创建输出目标
auto target = std::make_shared<TargetImage>();
target->SetOutputPath("output.jpg");

// 组装管线
source->AddFilter(beauty_filter)
      ->AddTarget(target);

// 处理
source->Proceed();
```

---

## 结论

| 场景 | 推荐方案 |
|------|---------|
| 快速验证 / 低并发 | OpenCV + Mediapipe |
| 生产环境 / 高并发 | GPUPixel 服务化部署 |
| 未来扩展到视频/直播 | GPUPixel（必选） |

**建议**：先用 OpenCV 方案跑通流程，同时搭建 GPUPixel 服务做性能对比，择优上线。

---

## 相关资源

- GitHub: https://github.com/pixpark/gpupixel
- 文档: https://gpupixel.com (如有)
- 示例代码: `gpupixel/examples/`
