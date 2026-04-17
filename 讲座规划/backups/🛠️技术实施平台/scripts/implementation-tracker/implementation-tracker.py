import asyncio
import json
import logging
import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List

import aiofiles
import pandas as pd


class ImplementationPhase(Enum):
    PREPARATION = "准备阶段"
    TRAINING = "培训阶段"
    PILOT = "试点阶段"
    SUMMARY = "总结阶段"
    ROLLOUT = "推广阶段"


class ImplementationStatus(Enum):
    PLANNING = "计划中"
    IN_PROGRESS = "进行中"
    COMPLETED = "已完成"
    DELAYED = "延迟"
    FAILED = "失败"


@dataclass
class ImplementationMetric:
    name: str
    value: float
    unit: str
    target: float
    status: str
    timestamp: datetime


class ImplementationTracker:
    def __init__(self, database_path: str = None):
        self.database_path = (
            database_path
            or "～/.openclaw/workspace/讲座规划/🛠️技术实施平台/data/implementation_tracking.db"
        )
        self.logger = self.setup_logging()
        self.setup_database()

    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
        )
        return logging.getLogger(__name__)

    def setup_database(self):
        """设置数据库表结构"""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()

        # 创建实施跟踪表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS implementation_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            department TEXT NOT NULL,
            phase TEXT NOT NULL,
            status TEXT NOT NULL,
            start_date TEXT,
            end_date TEXT,
            progress REAL,
            metrics TEXT,
            issues TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # 创建指标表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS implementation_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            department TEXT NOT NULL,
            phase TEXT NOT NULL,
            metric_name TEXT NOT NULL,
            value REAL NOT NULL,
            target_value REAL,
            status TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # 创建问题表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS implementation_issues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            department TEXT NOT NULL,
            phase TEXT NOT NULL,
            issue_type TEXT NOT NULL,
            description TEXT NOT NULL,
            severity TEXT NOT NULL,
            status TEXT NOT NULL,
            resolution TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            resolved_at TEXT
        )
        """)

        conn.commit()
        conn.close()

    # 开始实施跟踪
    def start_implementation_tracking(
        self, department: str, phase: ImplementationPhase
    ):
        """开始实施跟踪"""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()

        cursor.execute(
            """
        INSERT INTO implementation_tracking
        (department, phase, status, start_date, progress, metrics, issues)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
            (
                department,
                phase.value,
                ImplementationStatus.PLANNING.value,
                datetime.now().isoformat(),
                0.0,
                "[]",
                "[]",
            ),
        )

        conn.commit()
        conn.close()

        self.logger.info(f"开始跟踪{department}的{phase.value}")

    # 更新实施进度
    def update_implementation_progress(
        self,
        department: str,
        phase: ImplementationPhase,
        progress: float,
        metrics: List[ImplementationMetric] = None,
    ):
        """更新实施进度"""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()

        # 更新进度
        cursor.execute(
            """
        UPDATE implementation_tracking
        SET progress = ?, status = ?, end_date = ?
        WHERE department = ? AND phase = ?
        """,
            (
                progress,
                ImplementationStatus.IN_PROGRESS.value
                if progress < 100
                else ImplementationStatus.COMPLETED.value,
                datetime.now().isoformat() if progress >= 100 else None,
                department,
                phase.value,
            ),
        )

        # 更新指标
        if metrics:
            for metric in metrics:
                cursor.execute(
                    """
                INSERT OR REPLACE INTO implementation_metrics
                (department, phase, metric_name, value, target_value, status, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        department,
                        phase.value,
                        metric.name,
                        metric.value,
                        metric.target,
                        metric.status,
                        metric.timestamp.isoformat(),
                    ),
                )

        conn.commit()
        conn.close()

        self.logger.info(f"更新{department}的{phase.value}进度为{progress}%")

    # 记录问题
    def record_implementation_issue(
        self,
        department: str,
        phase: ImplementationPhase,
        issue_type: str,
        description: str,
        severity: str,
    ):
        """记录实施问题"""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()

        cursor.execute(
            """
        INSERT INTO implementation_issues
        (department, phase, issue_type, description, severity, status)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
            (department, phase.value, issue_type, description, severity, "open"),
        )

        conn.commit()
        conn.close()

        self.logger.warning(
            f"记录问题: {department} {phase.value} - {issue_type}: {description}"
        )

    # 生成实施报告
    def generate_implementation_report(
        self, department: str, phase: ImplementationPhase
    ) -> Dict[str, Any]:
        """生成实施报告"""
        conn = sqlite3.connect(self.database_path)

        # 获取实施跟踪信息
        tracking_query = """
        SELECT * FROM implementation_tracking
        WHERE department = ? AND phase = ?
        ORDER BY created_at DESC LIMIT 1
        """
        tracking_df = pd.read_sql_query(
            tracking_query, conn, params=(department, phase.value)
        )

        if tracking_df.empty:
            return {"error": f"没有找到{department}的{phase.value}的跟踪信息"}

        # 获取指标信息
        metrics_query = """
        SELECT * FROM implementation_metrics
        WHERE department = ? AND phase = ?
        ORDER BY timestamp DESC
        """
        metrics_df = pd.read_sql_query(
            metrics_query, conn, params=(department, phase.value)
        )

        # 获取问题信息
        issues_query = """
        SELECT * FROM implementation_issues
        WHERE department = ? AND phase = ?
        ORDER BY created_at DESC
        """
        issues_df = pd.read_sql_query(
            issues_query, conn, params=(department, phase.value)
        )

        conn.close()

        # 生成报告
        report = {
            "department": department,
            "phase": phase.value,
            "tracking": {
                "status": tracking_df.iloc[0]["status"],
                "progress": tracking_df.iloc[0]["progress"],
                "start_date": tracking_df.iloc[0]["start_date"],
                "end_date": tracking_df.iloc[0]["end_date"],
                "metrics_summary": self.generate_metrics_summary(metrics_df),
                "issues_summary": self.generate_issues_summary(issues_df),
                "overall_assessment": self.assess_overall_progress(
                    tracking_df.iloc[0], metrics_df, issues_df
                ),
            },
            "detailed_metrics": metrics_df.to_dict("records")
            if not metrics_df.empty
            else [],
            "detailed_issues": issues_df.to_dict("records")
            if not issues_df.empty
            else [],
            "recommendations": self.generate_recommendations(
                tracking_df.iloc[0], metrics_df, issues_df
            ),
        }

        return report

    def generate_metrics_summary(self, metrics_df: pd.DataFrame) -> Dict[str, Any]:
        """生成指标摘要"""
        if metrics_df.empty:
            return {
                "total_metrics": 0,
                "average_progress": 0,
                "target_achievement_rate": 0,
            }

        total_metrics = len(metrics_df)
        average_progress = metrics_df["value"].mean()
        target_achievement_rate = (
            metrics_df["value"] >= metrics_df["target_value"]
        ).mean() * 100

        return {
            "total_metrics": total_metrics,
            "average_progress": average_progress,
            "target_achievement_rate": target_achievement_rate,
            "progress_distribution": self.get_progress_distribution(metrics_df),
        }

    def generate_issues_summary(self, issues_df: pd.DataFrame) -> Dict[str, Any]:
        """生成问题摘要"""
        if issues_df.empty:
            return {"total_issues": 0, "resolved_issues": 0, "open_issues": 0}

        total_issues = len(issues_df)
        resolved_issues = len(issues_df[issues_df["status"] == "resolved"])
        open_issues = len(issues_df[issues_df["status"] == "open"])

        return {
            "total_issues": total_issues,
            "resolved_issues": resolved_issues,
            "open_issues": open_issues,
            "issues_by_severity": self.get_issues_by_severity(issues_df),
        }

    def get_progress_distribution(self, metrics_df: pd.DataFrame) -> Dict[str, int]:
        """获取进度分布"""
        distribution = {
            "exceeded_target": len(
                metrics_df[metrics_df["value"] > metrics_df["target_value"]]
            ),
            "met_target": len(
                metrics_df[metrics_df["value"] == metrics_df["target_value"]]
            ),
            "below_target": len(
                metrics_df[metrics_df["value"] < metrics_df["target_value"]]
            ),
        }
        return distribution

    def get_issues_by_severity(self, issues_df: pd.DataFrame) -> Dict[str, int]:
        """按严重程度统计问题"""
        return issues_df["severity"].value_counts().to_dict()

    def assess_overall_progress(
        self, tracking_row: pd.Series, metrics_df: pd.DataFrame, issues_df: pd.DataFrame
    ) -> Dict[str, Any]:
        """评估整体进度"""
        assessment = {
            "status": tracking_row["status"],
            "progress": tracking_row["progress"],
            "risk_level": self.assess_risk_level(tracking_row, metrics_df, issues_df),
            "success_probability": self.calculate_success_probability(
                tracking_row, metrics_df, issues_df
            ),
            "key_achievements": self.identify_key_achievements(metrics_df),
            "major_challenges": self.identify_major_challenges(issues_df),
        }
        return assessment

    def assess_risk_level(
        self, tracking_row: pd.Series, metrics_df: pd.DataFrame, issues_df: pd.DataFrame
    ) -> str:
        """评估风险等级"""
        open_issues = len(issues_df[issues_df["status"] == "open"])
        progress = tracking_row["progress"]

        if open_issues >= 5 or progress < 50:
            return "高"
        elif open_issues >= 3 or progress < 75:
            return "中"
        else:
            return "低"

    def calculate_success_probability(
        self, tracking_row: pd.Series, metrics_df: pd.DataFrame, issues_df: pd.DataFrame
    ) -> float:
        """计算成功概率"""
        progress = tracking_row["progress"]
        target_achievement = (
            (metrics_df["value"] >= metrics_df["target_value"]).mean()
            if not metrics_df.empty
            else 0
        )
        open_issues_ratio = len(issues_df[issues_df["status"] == "open"]) / max(
            len(issues_df), 1
        )

        # 综合计算成功概率
        success_probability = (
            progress * 0.4 + target_achievement * 0.4 + (1 - open_issues_ratio) * 0.2
        ) * 100
        return round(success_probability, 2)

    def identify_key_achievements(self, metrics_df: pd.DataFrame) -> List[str]:
        """识别关键成就"""
        achievements = []

        if not metrics_df.empty:
            # 找出超额完成的指标
            exceeded = metrics_df[metrics_df["value"] > metrics_df["target_value"]]
            for _, row in exceeded.iterrows():
                achievements.append(
                    f"{row['metric_name']} 超额完成 {((row['value'] - row['target_value']) / row['target_value'] * 100):.1f}%"
                )

        return achievements

    def identify_major_challenges(self, issues_df: pd.DataFrame) -> List[str]:
        """识别主要挑战"""
        challenges = []

        if not issues_df.empty:
            # 按严重程度排序问题
            high_severity_issues = issues_df[issues_df["severity"] == "high"]
            for _, row in high_severity_issues.iterrows():
                challenges.append(f"{row['issue_type']}: {row['description']}")

        return challenges

    def generate_recommendations(
        self, tracking_row: pd.Series, metrics_df: pd.DataFrame, issues_df: pd.DataFrame
    ) -> List[str]:
        """生成建议"""
        recommendations = []

        # 基于进度给出建议
        if tracking_row["progress"] < 25:
            recommendations.append("建议加快实施进度，增加资源投入")
        elif tracking_row["progress"] < 50:
            recommendations.append("建议加强监控，及时发现和解决问题")
        elif tracking_row["progress"] < 75:
            recommendations.append("建议优化实施策略，提升效率")
        else:
            recommendations.append("建议准备下一阶段的推广工作")

        # 基于指标给出建议
        if not metrics_df.empty:
            low_performance_metrics = metrics_df[
                metrics_df["value"] < metrics_df["target_value"] * 0.8
            ]
            if not low_performance_metrics.empty:
                recommendations.append("建议重点关注表现不佳的指标")

        # 基于问题给出建议
        open_issues = issues_df[issues_df["status"] == "open"]
        if not open_issues.empty:
            recommendations.append("建议优先解决开放性问题")

        return recommendations

    # 监控实施状态
    def monitor_implementation_status(self, department: str) -> Dict[str, Any]:
        """监控实施状态"""
        conn = sqlite3.connect(self.database_path)

        # 获取所有阶段的状态
        tracking_query = """
        SELECT phase, status, progress, start_date, end_date
        FROM implementation_tracking
        WHERE department = ?
        ORDER BY start_date DESC
        """
        tracking_df = pd.read_sql_query(tracking_query, conn, params=(department,))

        conn.close()

        if tracking_df.empty:
            return {"error": f"没有找到{department}的实施信息"}

        # 生成监控报告
        monitoring_report = {
            "department": department,
            "overall_status": self.get_overall_status(tracking_df),
            "phases": tracking_df.to_dict("records"),
            "summary": {
                "total_phases": len(tracking_df),
                "completed_phases": len(tracking_df[tracking_df["status"] == "已完成"]),
                "in_progress_phases": len(
                    tracking_df[tracking_df["status"] == "进行中"]
                ),
                "delayed_phases": len(tracking_df[tracking_df["status"] == "延迟"]),
                "failed_phases": len(tracking_df[tracking_df["status"] == "失败"]),
            },
        }

        return monitoring_report

    def get_overall_status(self, tracking_df: pd.DataFrame) -> str:
        """获取整体状态"""
        if tracking_df.empty:
            return "未开始"

        latest_status = tracking_df.iloc[0]["status"]

        if latest_status == "已完成":
            return "已完成"
        elif latest_status == "进行中":
            return "进行中"
        elif latest_status == "延迟":
            return "延迟"
        elif latest_status == "失败":
            return "失败"
        else:
            return "计划中"

    # 批量导入实施数据
    def import_implementation_data(self, data_file: str):
        """批量导入实施数据"""
        try:
            # 读取JSON数据文件
            with open(data_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            conn = sqlite3.connect(self.database_path)
            cursor = conn.cursor()

            for item in data:
                # 导入跟踪数据
                cursor.execute(
                    """
                INSERT OR REPLACE INTO implementation_tracking
                (department, phase, status, start_date, end_date, progress, metrics, issues)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        item.get("department"),
                        item.get("phase"),
                        item.get("status"),
                        item.get("start_date"),
                        item.get("end_date"),
                        item.get("progress", 0.0),
                        json.dumps(item.get("metrics", [])),
                        json.dumps(item.get("issues", [])),
                    ),
                )

                # 导入指标数据
                for metric in item.get("metrics", []):
                    cursor.execute(
                        """
                    INSERT OR REPLACE INTO implementation_metrics
                    (department, phase, metric_name, value, target_value, status, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                        (
                            item.get("department"),
                            item.get("phase"),
                            metric.get("name"),
                            metric.get("value"),
                            metric.get("target"),
                            metric.get("status"),
                            metric.get("timestamp"),
                        ),
                    )

                # 导入问题数据
                for issue in item.get("issues", []):
                    cursor.execute(
                        """
                    INSERT OR REPLACE INTO implementation_issues
                    (department, phase, issue_type, description, severity, status, resolution)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                        (
                            item.get("department"),
                            item.get("phase"),
                            issue.get("type"),
                            issue.get("description"),
                            issue.get("severity"),
                            issue.get("status"),
                            issue.get("resolution"),
                        ),
                    )

            conn.commit()
            conn.close()

            self.logger.info(f"成功导入 {len(data)} 条实施数据")
            return {"status": "success", "imported_count": len(data)}

        except Exception as e:
            self.logger.error(f"导入实施数据失败: {e}")
            return {"status": "error", "message": str(e)}

    # 生成实施进度报告
    def generate_progress_report(self, department: str) -> str:
        """生成实施进度报告"""
        try:
            # 获取各阶段进度
            phases = [
                ImplementationPhase.PREPARATION,
                ImplementationPhase.TRAINING,
                ImplementationPhase.PILOT,
                ImplementationPhase.SUMMARY,
            ]

            report_lines = []
            report_lines.append(f"## {department} 实施进度报告")
            report_lines.append(
                f"**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            )
            report_lines.append("")

            total_progress = 0
            completed_phases = 0

            for phase in phases:
                phase_report = self.generate_implementation_report(department, phase)

                if "error" not in phase_report:
                    tracking = phase_report["tracking"]
                    progress = tracking["progress"]
                    total_progress += progress

                    report_lines.append(f"### {phase.value}")
                    report_lines.append(f"- **状态**: {tracking['status']}")
                    report_lines.append(f"- **进度**: {progress:.1f}%")
                    report_lines.append(f"- **开始时间**: {tracking['start_date']}")
                    report_lines.append(
                        f"- **结束时间**: {tracking['end_date'] or '进行中'}"
                    )
                    report_lines.append("")

                    if tracking["status"] == "已完成":
                        completed_phases += 1

                    # 添加关键成就
                    if tracking["key_achievements"]:
                        report_lines.append("**关键成就**:")
                        for achievement in tracking["key_achievements"]:
                            report_lines.append(f"- {achievement}")
                        report_lines.append("")

                    # 添加主要挑战
                    if tracking["major_challenges"]:
                        report_lines.append("**主要挑战**:")
                        for challenge in tracking["major_challenges"]:
                            report_lines.append(f"- {challenge}")
                        report_lines.append("")

                    # 添加建议
                    if tracking["recommendations"]:
                        report_lines.append("**建议**:")
                        for recommendation in tracking["recommendations"]:
                            report_lines.append(f"- {recommendation}")
                        report_lines.append("")

            # 总体评估
            overall_progress = total_progress / len(phases) if phases else 0
            report_lines.append("### 总体评估")
            report_lines.append(f"- **总体进度**: {overall_progress:.1f}%")
            report_lines.append(f"- **完成阶段**: {completed_phases}/{len(phases)}")
            report_lines.append(
                f"- **项目状态**: {'进行中' if overall_progress < 100 else '已完成'}"
            )

            # 保存报告
            report_content = "\n".join(report_lines)
            report_file = f"～/.openclaw/workspace/讲座规划/📝工作日志/{department}_实施进度报告_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"

            with open(report_file, "w", encoding="utf-8") as f:
                f.write(report_content)

            self.logger.info(f"实施进度报告已生成: {report_file}")
            return report_file

        except Exception as e:
            self.logger.error(f"生成实施进度报告失败: {e}")
            return None


# 使用示例
if __name__ == "__main__":
    tracker = ImplementationTracker()

    # 开始跟踪品宣部门的准备阶段
    tracker.start_implementation_tracking("品宣部门", ImplementationPhase.PREPARATION)

    # 更新进度
    metrics = [
        ImplementationMetric(
            "部门需求调研完成率", 100, "%", 100, "completed", datetime.now()
        ),
        ImplementationMetric(
            "基线数据收集完成率", 80, "%", 100, "in_progress", datetime.now()
        ),
        ImplementationMetric(
            "技术环境准备完成率", 60, "%", 100, "in_progress", datetime.now()
        ),
    ]

    tracker.update_implementation_progress(
        "品宣部门", ImplementationPhase.PREPARATION, 80, metrics
    )

    # 记录问题
    tracker.record_implementation_issue(
        "品宣部门",
        ImplementationPhase.PREPARATION,
        "系统集成",
        "AI工具账户创建延迟",
        "medium",
    )

    # 生成报告
    report = tracker.generate_implementation_report(
        "品宣部门", ImplementationPhase.PREPARATION
    )
    print(json.dumps(report, indent=2, ensure_ascii=False, default=str))

    # 监控状态
    monitoring = tracker.monitor_implementation_status("品宣部门")
    print(json.dumps(monitoring, indent=2, ensure_ascii=False, default=str))

    # 生成进度报告
    report_file = tracker.generate_progress_report("品宣部门")
    print(f"进度报告已生成: {report_file}")
