# OpenClaw 数据分析：自动生成数据可视化报告

> **痛点场景**：每周都要做数据分析，重复劳动、格式不统一、Excel 调整图表太费劲。
>
> **解决方案**：用 OpenClaw 自动生成数据可视化报告，效率提升 10 倍。
>
> **效果对比**：手动 3 小时 → 自动 15 分钟，图表更专业，周报质量提升。

---

## 1. 痛点开场：数据分析的三大噩梦

### 噩梦1：重复劳动

每周一到早上，打开 Excel，导入数据，清洗数据，调整格式，生成图表，写分析报告。这些步骤重复了 100 遍，每次都要从头来。

> **时间成本**：每周 3 小时，一年 156 小时 = 19.5 个工作日

### 噩梦2：格式不统一

不同周的周报，格式千奇百怪。有时候是柱状图，有时候是折线图，有时候是饼图。老板看了头疼，团队协作也困难。

> **问题**：缺少标准化的报告模板，每次都要重新设计。

### 噩梦3：Excel 调整图表太费劲

数据更新了，图表要重新调整。颜色不协调，字体太小，坐标轴要改。改来改去，时间都花在调整图表上了。

> **痛点**：工具限制，可视化灵活性差。

---

## 2. 解决方案：OpenClaw 数据分析自动化体系

### 核心思路

```
数据源 → OpenClaw Agent → 数据处理 → 可视化生成 → 报告输出
```

### 四大优势

1. **自动化**：一键生成，无需手动操作
2. **标准化**：统一的报告模板和图表风格
3. **灵活性**：支持多种数据源和图表类型
4. **智能分析**：自动生成洞察和建议

---

## 3. 实战代码

### 代码1：数据分析 Agent 配置

```yaml
# ~/.openclaw/workspace/agents/data-analysis-agent.yaml
name: "data-analysis"
description: "数据分析与可视化报告生成专家"
system_prompt: |
  你是一个数据分析专家，擅长：
  1. 数据清洗与预处理
  2. 数据可视化（matplotlib、seaborn、plotly）
  3. 自动化报告生成
  4. 数据洞察与建议

  工作流程：
  1. 理解用户的数据分析需求
  2. 生成数据处理代码
  3. 生成可视化代码
  4. 生成报告文本
  5. 输出完整的分析报告

  注意事项：
  - 数据可视化要美观、专业
  - 图表要有标题、标签、图例
  - 分析报告要有数据支撑
  - 提供可执行的建议

model: "gpt-4"
tools:
  - name: "run_python"
    description: "执行 Python 代码进行数据分析和可视化"
    command: "python3"
    timeout: 60

memory:
  enabled: true
  max_history: 20
```

### 代码2：数据处理脚本模板

```python
# data_analysis_template.py
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 设置样式
sns.set_style("whitegrid")
sns.set_palette("husl")

def load_data(data_path):
    """加载数据"""
    try:
        if data_path.endswith('.csv'):
            return pd.read_csv(data_path)
        elif data_path.endswith('.xlsx'):
            return pd.read_excel(data_path)
        elif data_path.endswith('.json'):
            return pd.read_json(data_path)
        else:
            raise ValueError("不支持的数据格式")
    except Exception as e:
        print(f"数据加载失败: {e}")
        return None

def clean_data(df):
    """数据清洗"""
    # 删除空值
    df = df.dropna()

    # 去重
    df = df.drop_duplicates()

    # 日期格式化
    for col in df.columns:
        if 'date' in col.lower() or 'time' in col.lower():
            df[col] = pd.to_datetime(df[col], errors='coerce')

    return df

def generate_summary(df):
    """生成数据摘要"""
    summary = {
        '总行数': len(df),
        '总列数': len(df.columns),
        '数据类型': df.dtypes.value_counts().to_dict(),
        '缺失值': df.isnull().sum().to_dict(),
        '数值统计': df.describe().to_dict()
    }
    return summary

def create_trend_chart(df, date_col, value_col, title="趋势图"):
    """创建趋势图"""
    fig, ax = plt.subplots(figsize=(12, 6))

    sns.lineplot(data=df, x=date_col, y=value_col, ax=ax)
    ax.set_title(title, fontsize=16, fontweight='bold')
    ax.set_xlabel('日期', fontsize=12)
    ax.set_ylabel(value_col, fontsize=12)
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    return fig

def create_bar_chart(df, x_col, y_col, title="柱状图"):
    """创建柱状图"""
    fig, ax = plt.subplots(figsize=(12, 6))

    sns.barplot(data=df, x=x_col, y=y_col, ax=ax)
    ax.set_title(title, fontsize=16, fontweight='bold')
    ax.set_xlabel(x_col, fontsize=12)
    ax.set_ylabel(y_col, fontsize=12)
    plt.xticks(rotation=45)
    ax.grid(True, alpha=0.3, axis='y')

    plt.tight_layout()
    return fig

def create_pie_chart(df, labels_col, values_col, title="饼图"):
    """创建饼图"""
    fig, ax = plt.subplots(figsize=(10, 10))

    colors = sns.color_palette("husl", len(df))
    ax.pie(df[values_col], labels=df[labels_col], autopct='%1.1f%%',
           colors=colors, startangle=90)
    ax.set_title(title, fontsize=16, fontweight='bold')

    plt.tight_layout()
    return fig

def create_heatmap(df, title="热力图"):
    """创建热力图"""
    fig, ax = plt.subplots(figsize=(12, 10))

    # 只选择数值列
    numeric_df = df.select_dtypes(include=[np.number])
    corr_matrix = numeric_df.corr()

    sns.heatmap(corr_matrix, annot=True, fmt='.2f', cmap='coolwarm',
                center=0, ax=ax, cbar_kws={'label': '相关系数'})
    ax.set_title(title, fontsize=16, fontweight='bold')

    plt.tight_layout()
    return fig

def save_report(figures, report_text, output_path):
    """保存报告"""
    report = f"""
# 数据分析报告

生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

{report_text}

---

*本报告由 OpenClaw 自动生成*
    """

    with open(f"{output_path}/report.md", 'w', encoding='utf-8') as f:
        f.write(report)

    # 保存图表
    for i, fig in enumerate(figures):
        fig.savefig(f"{output_path}/chart_{i+1}.png", dpi=300, bbox_inches='tight')
        plt.close(fig)

    print(f"报告已保存到: {output_path}")

def generate_analysis_report(df, analysis_type="weekly"):
    """生成分析报告"""
    summary = generate_summary(df)

    if analysis_type == "weekly":
        report = f"""
## 数据概览

- 总数据量：{summary['总行数']} 行
- 数据维度：{summary['总列数']} 列
- 数据类型：{summary['数据类型']}

## 核心发现

1. 数据完整性：{summary['缺失值']}
2. 数值统计：{summary['数值统计']}

## 建议

请根据具体数据生成个性化建议...
        """
    elif analysis_type == "monthly":
        report = f"""
## 数据概览

- 总数据量：{summary['总行数']} 行
- 数据维度：{summary['总列数']} 列

## 趋势分析

请根据具体数据生成趋势分析...
        """

    return report

# 主函数
def main(data_path, analysis_type="weekly", output_path="./reports"):
    """主函数"""
    # 加载数据
    df = load_data(data_path)
    if df is None:
        return

    # 数据清洗
    df = clean_data(df)

    # 生成图表
    figures = []

    # 根据数据类型生成不同的图表
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    date_cols = [col for col in df.columns if pd.api.types.is_datetime64_any_dtype(df[col])]

    if len(date_cols) > 0 and len(numeric_cols) > 0:
        fig = create_trend_chart(df, date_cols[0], numeric_cols[0],
                                 title="趋势分析")
        figures.append(fig)

    if len(numeric_cols) >= 2:
        fig = create_bar_chart(df, numeric_cols[0], numeric_cols[1],
                              title="对比分析")
        figures.append(fig)

    if len(numeric_cols) > 0:
        fig = create_heatmap(df, title="相关性分析")
        figures.append(fig)

    # 生成分析报告
    report_text = generate_analysis_report(df, analysis_type)

    # 保存报告
    save_report(figures, report_text, output_path)

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("使用方法: python data_analysis_template.py <数据文件> [分析类型] [输出路径]")
        sys.exit(1)

    data_path = sys.argv[1]
    analysis_type = sys.argv[2] if len(sys.argv) > 2 else "weekly"
    output_path = sys.argv[3] if len(sys.argv) > 3 else "./reports"

    main(data_path, analysis_type, output_path)
```

### 代码3：OpenClaw 集成脚本

```bash
#!/bin/bash
# openclaw_data_analysis.sh

# 数据文件路径
DATA_FILE="$1"

# 分析类型（weekly/monthly）
ANALYSIS_TYPE="$2"

# 输出路径
OUTPUT_PATH="./reports/$(date +%Y%m%d)"

# 创建输出目录
mkdir -p "$OUTPUT_PATH"

# 调用 OpenClaw Agent 生成分析代码
openclaw agent data-analysis \
  "我有一个数据文件 $DATA_FILE，请生成数据分析代码，包括：
   1. 数据加载和清洗
   2. 数据可视化（趋势图、柱状图、热力图）
   3. 分析报告生成

   分析类型：$ANALYSIS_TYPE

   输出路径：$OUTPUT_PATH" \
  > "$OUTPUT_PATH/analysis_code.py"

# 执行生成的代码
python3 "$OUTPUT_PATH/analysis_code.py" "$DATA_FILE" "$ANALYSIS_TYPE" "$OUTPUT_PATH"

echo "数据分析报告已生成: $OUTPUT_PATH"
```

### 代码4：定时任务配置

```yaml
# ~/.openclaw/config/schedules/data-analysis-schedule.yaml
name: "weekly-data-analysis"
description: "每周一上午 9 点自动生成数据分析报告"

schedule:
  cron: "0 9 * * 1"  # 每周一上午 9 点

payload:
  kind: "agentTurn"
  agentId: "data-analysis"
  message: |
    请执行本周数据分析报告生成任务：

    数据文件：./data/weekly_sales_data.csv
    分析类型：weekly
    输出路径：./reports/weekly/$(date +%Y%m%d)

    生成以下内容：
    1. 销售趋势图
    2. 产品对比分析
    3. 地区分布热力图
    4. 分析报告（Markdown 格式）

    要求：
    - 图表美观专业
    - 提供数据洞察
    - 给出可执行建议

delivery:
  mode: "announce"
  channel: "数据汇报"
```

### 代码5：实际使用示例

```bash
# 示例1：分析周销售数据
openclaw agent data-analysis \
  "分析本周销售数据 ./data/weekly_sales_data.csv，生成趋势图、对比图、热力图和分析报告" \
  | tee analysis_output.md

# 示例2：分析月度用户增长
openclaw agent data-analysis \
  "分析月度用户增长数据 ./data/monthly_users.xlsx，生成用户增长曲线图、留存率分析、渠道分布饼图" \
  | tee user_growth_analysis.md

# 示例3：对比多个数据集
openclaw agent data-analysis \
  "对比两个季度数据 ./data/q1_sales.csv 和 ./data/q2_sales.csv，生成对比分析报告" \
  | tee quarterly_comparison.md
```

### 代码6：高级可视化 - 交互式图表

```python
# interactive_charts.py
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd

def create_interactive_trend(df, date_col, value_col):
    """创建交互式趋势图"""
    fig = px.line(df, x=date_col, y=value_col,
                  title="交互式趋势分析",
                  template="plotly_white")

    fig.update_layout(
        hovermode='x unified',
        xaxis_title="日期",
        yaxis_title=value_col,
        title_font_size=20
    )

    fig.update_traces(
        line=dict(width=3),
        mode='lines+markers'
    )

    return fig

def create_interactive_bar(df, x_col, y_col):
    """创建交互式柱状图"""
    fig = px.bar(df, x=x_col, y=y_col,
                title="交互式对比分析",
                template="plotly_white")

    fig.update_layout(
        xaxis_title=x_col,
        yaxis_title=y_col,
        title_font_size=20
    )

    fig.update_traces(
        marker_line_width=2,
        marker_line_color='rgb(8,48,107)'
    )

    return fig

def create_interactive_pie(df, labels_col, values_col):
    """创建交互式饼图"""
    fig = px.pie(df, values=values_col, names=labels_col,
                 title="交互式分布分析",
                 hole=0.3,
                 template="plotly_white")

    fig.update_layout(
        title_font_size=20
    )

    fig.update_traces(
        textposition='inside',
        textinfo='percent+label',
        marker_line_width=2
    )

    return fig

def create_dashboard(df, date_col, value_col, category_col):
    """创建数据仪表板"""
    fig = go.Figure()

    # 添加趋势图
    for category in df[category_col].unique():
        df_cat = df[df[category_col] == category]
        fig.add_trace(
            go.Scatter(
                x=df_cat[date_col],
                y=df_cat[value_col],
                name=category,
                mode='lines+markers',
                line=dict(width=2)
            )
        )

    fig.update_layout(
        title="数据仪表板",
        template="plotly_white",
        hovermode='x unified',
        title_font_size=20
    )

    return fig
```

### 代码7：数据洞察自动生成

```python
# data_insights.py
import pandas as pd
import numpy as np

def generate_insights(df, metrics):
    """自动生成数据洞察"""
    insights = []

    # 洞察1：趋势分析
    if len(metrics) >= 2:
        current = metrics[-1]
        previous = metrics[-2]
        growth_rate = (current - previous) / previous * 100

        if growth_rate > 20:
            insights.append(f"📈 强劲增长：最新值 {current} 比上期 {previous} 增长了 {growth_rate:.1f}%")
        elif growth_rate > 0:
            insights.append(f"📊 稳步增长：最新值 {current} 比上期 {previous} 增长了 {growth_rate:.1f}%")
        elif growth_rate > -20:
            insights.append(f"📉 小幅下降：最新值 {current} 比上期 {previous} 下降了 {abs(growth_rate):.1f}%")
        else:
            insights.append(f"⚠️ 显著下降：最新值 {current} 比上期 {previous} 下降了 {abs(growth_rate):.1f}%，需要关注！")

    # 洞察2：异常检测
    mean = np.mean(metrics)
    std = np.std(metrics)
    threshold = mean + 2 * std

    anomalies = [m for m in metrics if m > threshold]
    if anomalies:
        insights.append(f"🔍 检测到异常值：{len(anomalies)} 个数据点超过阈值 {threshold:.2f}")

    # 洞察3：分布分析
    if len(metrics) > 0:
        q1, median, q3 = np.percentile(metrics, [25, 50, 75])
        insights.append(f"📊 分布分析：Q1={q1:.2f}, 中位数={median:.2f}, Q3={q3:.2f}")

    return insights

def generate_recommendations(df, insights):
    """基于洞察生成建议"""
    recommendations = []

    for insight in insights:
        if "强劲增长" in insight:
            recommendations.append("✅ 建议：继续保持当前策略，扩大成功因素")
        elif "稳步增长" in insight:
            recommendations.append("✅ 建议：优化流程，争取更大提升")
        elif "小幅下降" in insight:
            recommendations.append("⚠️ 建议：分析下降原因，调整策略")
        elif "显著下降" in insight:
            recommendations.append("🚨 建议：立即启动问题排查，制定恢复计划")
        elif "异常值" in insight:
            recommendations.append("🔍 建议：深入调查异常原因，排除数据错误")
        elif "分布分析" in insight:
            recommendations.append("📊 建议：关注数据分布，优化业务指标")

    return recommendations

def format_report(insights, recommendations):
    """格式化报告"""
    report = "# 数据洞察报告\n\n"

    report += "## 🎯 核心洞察\n\n"
    for i, insight in enumerate(insights, 1):
        report += f"{i}. {insight}\n"

    report += "\n## 💡 行动建议\n\n"
    for i, rec in enumerate(recommendations, 1):
        report += f"{i}. {rec}\n"

    return report
```

### 代码8：完整的数据分析工作流

```python
# complete_analysis_workflow.py
import os
import pandas as pd
from datetime import datetime

class DataAnalysisWorkflow:
    def __init__(self, config):
        self.config = config
        self.data = None
        self.figures = []
        self.insights = []
        self.recommendations = []

    def load_data(self):
        """加载数据"""
        self.data = pd.read_csv(self.config['data_path'])
        print(f"✅ 数据加载完成：{len(self.data)} 行")

    def clean_data(self):
        """数据清洗"""
        self.data = self.data.dropna()
        self.data = self.data.drop_duplicates()
        print(f"✅ 数据清洗完成：{len(self.data)} 行")

    def analyze(self):
        """数据分析"""
        # 生成洞察
        numeric_cols = self.data.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            metrics = self.data[numeric_cols[0]].values
            self.insights = generate_insights(self.data, metrics)

            # 生成建议
            self.recommendations = generate_recommendations(self.data, self.insights)

        print(f"✅ 数据分析完成：{len(self.insights)} 个洞察")

    def visualize(self):
        """数据可视化"""
        numeric_cols = self.data.select_dtypes(include=[np.number]).columns

        if len(numeric_cols) >= 1:
            # 趋势图
            fig = create_trend_chart(self.data,
                                   self.config.get('date_col', self.data.columns[0]),
                                   numeric_cols[0],
                                   title="趋势分析")
            self.figures.append(fig)

        if len(numeric_cols) >= 2:
            # 柱状图
            fig = create_bar_chart(self.data,
                                  numeric_cols[0],
                                  numeric_cols[1],
                                  title="对比分析")
            self.figures.append(fig)

        # 热力图
        fig = create_heatmap(self.data, title="相关性分析")
        self.figures.append(fig)

        print(f"✅ 数据可视化完成：{len(self.figures)} 个图表")

    def generate_report(self, output_path):
        """生成报告"""
        # 创建报告目录
        os.makedirs(output_path, exist_ok=True)

        # 生成报告文本
        report_text = f"""
# 数据分析报告

生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

数据概览：
- 总数据量：{len(self.data)} 行
- 数据维度：{len(self.data.columns)} 列

"""

        # 添加洞察
        if self.insights:
            report_text += "## 🎯 核心洞察\n\n"
            for i, insight in enumerate(self.insights, 1):
                report_text += f"{i}. {insight}\n"
            report_text += "\n"

        # 添加建议
        if self.recommendations:
            report_text += "## 💡 行动建议\n\n"
            for i, rec in enumerate(self.recommendations, 1):
                report_text += f"{i}. {rec}\n"
            report_text += "\n"

        report_text += "\n---\n\n*本报告由 OpenClaw 自动生成*"

        # 保存报告
        report_file = f"{output_path}/report.md"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report_text)

        # 保存图表
        for i, fig in enumerate(self.figures):
            fig.savefig(f"{output_path}/chart_{i+1}.png",
                       dpi=300, bbox_inches='tight')
            plt.close(fig)

        print(f"✅ 报告生成完成：{report_file}")

# 使用示例
config = {
    'data_path': './data/weekly_sales_data.csv',
    'date_col': 'date',
    'analysis_type': 'weekly'
}

workflow = DataAnalysisWorkflow(config)
workflow.load_data()
workflow.clean_data()
workflow.analyze()
workflow.visualize()
workflow.generate_report('./reports/weekly_analysis')
```

---

## 4. 实战案例：电商周销售数据分析

### 场景描述

某电商平台需要每周分析销售数据，生成周报给管理层。数据包含以下字段：
- date：日期
- product_id：产品ID
- product_name：产品名称
- category：产品类别
- sales：销售额
- quantity：销售数量
- region：地区

### 执行步骤

**Step 1：准备数据**

```csv
date,product_id,product_name,category,sales,quantity,region
2024-03-01,P001,iPhone 15 Pro,手机,12999,1,北京
2024-03-01,P002,MacBook Pro,电脑,18999,1,上海
2024-03-02,P001,iPhone 15 Pro,手机,25998,2,北京
2024-03-02,P003,iPad Pro,平板,6999,1,广州
...
```

**Step 2：执行分析**

```bash
openclaw agent data-analysis \
  "分析本周销售数据 ./data/weekly_sales_data.csv，生成：
   1. 日销售趋势图
   2. 产品类别对比图
   3. 地区分布热力图
   4. 数据洞察和建议

   要求：
   - 图表美观专业
   - 提供数据洞察
   - 给出可执行建议" \
  | tee weekly_sales_analysis.md
```

**Step 3：查看报告**

生成的报告包括：
- `report.md`：Markdown 格式的分析报告
- `chart_1.png`：日销售趋势图
- `chart_2.png`：产品类别对比图
- `chart_3.png`：地区分布热力图

### 效果对比

| 指标 | 手动方式 | 自动化方式 | 提升 |
|------|---------|-----------|------|
| 时间 | 3 小时 | 15 分钟 | **12 倍** |
| 图表质量 | 7/10 | 9/10 | +29% |
| 分析深度 | 基础 | 深入 | 显著提升 |
| 复用性 | 无 | 完全可复用 | 无限次 |

---

## 5. 最佳实践总结

### 1. 数据标准化

**原则**：统一数据格式，减少清洗成本

**实践**：
- 统一日期格式：YYYY-MM-DD
- 统一数值精度：保留 2 位小数
- 统一文本编码：UTF-8

### 2. 图表美观

**原则**：图表要专业、清晰、易读

**实践**：
- 使用统一配色方案
- 添加标题、标签、图例
- 合理调整字体大小
- 避免过度装饰

### 3. 洞察驱动

**原则**：不只是展示数据，更要提供洞察

**实践**：
- 自动识别趋势和异常
- 提供可执行的建议
- 支持多维度分析

### 4. 自动化优先

**原则**：重复劳动必须自动化

**实践**：
- 使用定时任务自动执行
- 监控数据变化，自动触发分析
- 集成到工作流中

---

## 6. 常见陷阱与解决方案

### 陷阱1：数据质量问题

**问题**：数据缺失、重复、格式不统一

**解决方案**：
- 数据清洗流程标准化
- 数据验证规则
- 异常值检测和处理

### 陷阱2：图表选择不当

**问题**：图表类型不适合数据类型

**解决方案**：
- 趋势数据 → 折线图
- 对比数据 → 柱状图
- 占比数据 → 饼图
- 相关性 → 热力图

### 陷阱3：过度装饰

**问题**：图表花哨，信息不清晰

**解决方案**：
- 简化图表元素
- 突出核心信息
- 避免使用 3D 效果

### 陷阱4：洞察浅显

**问题**：只有数据展示，没有深度分析

**解决方案**：
- 自动生成洞察
- 多维度交叉分析
- 提供可执行建议

---

## 7. 延伸思考

### 7.1 实时数据分析

不只是周报，可以扩展到实时数据分析：
- 实时数据流监控
- 异常检测和报警
- 实时仪表板

### 7.2 预测分析

基于历史数据，预测未来趋势：
- 时间序列预测
- 机器学习模型
- 趋势预警

### 7.3 多数据源整合

整合多个数据源：
- 数据库、API、文件
- 实时数据流
- 外部数据

---

## 总结

用 OpenClaw 自动生成数据可视化报告，不只是节省时间，更是提升分析质量：

1. **效率提升**：12 倍速度提升
2. **质量提升**：图表更专业，分析更深入
3. **可复用性**：一次配置，无限次使用
4. **标准化**：统一的报告模板和风格

**核心公式**：
```
自动化 = 效率提升 × 质量提升 × 可复用性
```

---

## 互动引导

你用 OpenClaw 做过什么有趣的数据分析？评论区分享一下！

想学习更多数据分析实战技巧？关注我的专栏《数据分析自动化》，获取更多实战案例。
