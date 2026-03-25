#!/usr/bin/env python3
"""
大模型学习辅助工具
- 管理学习进度
- 读取学习计划
- 生成学习内容
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path

# 路径配置
WORKSPACE = Path("/Users/oyjie/.openclaw/workspace")
REPO_PATH = WORKSPACE / "LLM-RL-Visualized"
PLAN_FILE = WORKSPACE / "skills/llm-learning/plan/llm-learning-plan.md"
PROGRESS_FILE = WORKSPACE / "skills/llm-learning/progress.json"
LOGS_DIR = WORKSPACE / "skills/llm-learning/daily-logs"


class LearningProgress:
    """学习进度管理"""

    def __init__(self):
        self.progress = self.load_progress()

    def load_progress(self):
        """加载进度"""
        if PROGRESS_FILE.exists():
            with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        return {
            "currentDay": 1,
            "startDate": datetime.now().strftime("%Y-%m-%d"),
            "lastStudyDate": None,
            "totalDays": 35,
            "completedDays": 0,
            "completedTopics": [],
            "streak": 0,
            "skippedDays": 0,
        }

    def save_progress(self):
        """保存进度"""
        with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
            json.dump(self.progress, f, indent=2, ensure_ascii=False)

    def get_current_day(self):
        """获取当前天数"""
        return self.progress["currentDay"]

    def advance_day(self):
        """进入下一天"""
        self.progress["currentDay"] += 1
        self.progress["completedDays"] += 1
        self.progress["lastStudyDate"] = datetime.now().strftime("%Y-%m-%d")
        self.progress["streak"] += 1
        self.save_progress()

    def get_completion_percentage(self):
        """获取完成百分比"""
        return (self.progress["completedDays"] / self.progress["totalDays"]) * 100

    def get_day_info(self, day):
        """获取某天的学习信息"""
        # 读取计划文件并解析
        # 这里简化处理，实际需要解析 MD 文件
        topics = [
            "LLM 总体架构",
            "LLM 输入与输出",
            "生成与解码过程",
            "LLM 训练流程",
            "多模态模型基础",
            "SFT 基础",
            "LoRA 技术",
            "其他微调方法",
            "RLHF 基础",
            "PPO 算法",
            "DPO 直接偏好优化 (1)",
            "DPO 直接偏好优化 (2)",
            "CoT 思维链",
            "解码策略深入",
            "RAG 检索增强",
            "功能调用",
            "RL 基础概念 (1)",
            "RL 基础概念 (2)",
            "价值函数",
            "DQN",
            "策略梯度 (1)",
            "策略梯度 (2)",
            "PPO 与 GRPO",
            "RLHF 与 RLAIF (1)",
            "RLHF 与 RLAIF (2)",
            "逻辑推理优化",
            "性能优化 (1)",
            "性能优化 (2)",
            "架构优化",
            "强化学习算法图谱",
            "最新模型研究 (1)",
            "最新模型研究 (2)",
            "最新模型研究 (3)",
            "最新模型研究 (4)",
            "最新模型研究 (5)",
        ]

        if day <= len(topics):
            return topics[day - 1]
        return "复习与总结"

    def save_daily_log(self, day, content):
        """保存每日学习日志"""
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
        today = datetime.now().strftime("%Y-%m-%d")
        log_file = LOGS_DIR / f"{today}.md"

        with open(log_file, "w", encoding="utf-8") as f:
            f.write(content)


def main():
    """主函数 - 用于测试"""
    lp = LearningProgress()

    print(f"当前进度：第 {lp.get_current_day()} 天")
    print(f"完成度：{lp.get_completion_percentage():.1f}%")
    print(f"今日主题：{lp.get_day_info(lp.get_current_day())}")


if __name__ == "__main__":
    main()
