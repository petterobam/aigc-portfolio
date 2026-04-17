#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AIGC培训试点实施跟踪系统
用于实时监控和管理试点实施进度，提供数据驱动的决策支持
"""

import json
import sqlite3
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import logging
import os

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ImplementationPhase(Enum):
    PREPARATION = "准备阶段"
    TRAINING = "培训阶段"
    PILOT = "试点阶段"
    OPTIMIZATION = "优化阶段"
    ROLLOUT = "推广阶段"

class ImplementationStatus(Enum):
    NOT_STARTED = "未开始"
    PLANNING = "计划中"
    IN_PROGRESS = "进行中"
    COMPLETED = "已完成"
    DELAYED = "延迟"
    FAILED = "失败"

class RiskLevel(Enum):
    LOW = "低"
    MEDIUM = "中"
    HIGH = "高"

@dataclass
class ImplementationTask:
    """实施任务数据类"""
    id: str
    name: str
    description: str
    phase: ImplementationPhase
    department: str
    duration: int  # 天数
    dependencies: List[str]
    assigned_to: str
    estimated_effort: float  # 人天
    status: ImplementationStatus
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    actual_effort: Optional[float] = None
    completion_percentage: float = 0.0
    actual_start_date: Optional[str] = None
    actual_end_date: Optional[str] = None
    notes: Optional[str] = None

@dataclass
class ImplementationMetric:
    """实施指标数据类"""
    id: str
    name: str
    description: str
    department: str
    phase: ImplementationPhase
    value: float
    unit: str
    target: float
    status: str
    timestamp: str
    category: str  # quantitative, qualitative, strategic

@dataclass
class ImplementationIssue:
    """实施问题数据类"""
    id: str
    title: str
    description: str
    department: str
    phase: ImplementationPhase
    issue_type: str
    severity: RiskLevel
    status: str
    reported_by: str
    reported_date: str
    resolved_date: Optional[str] = None
    resolution: Optional[str] = None

class ImplementationTracker:
    """实施跟踪系统主类"""
    
    def __init__(self, db_path: str = None):
        """初始化跟踪系统"""
        self.db_path = db_path or "～/.openclaw/workspace/讲座规划/🛠️技术实施平台/data/implementation_tracking.db"
        self.setup_database()
        self.departments = ["品宣部门", "财务部门", "编剧部门"]
        
    def setup_database(self):
        """设置数据库表结构"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 创建实施任务表
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS implementation_tasks (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            phase TEXT NOT NULL,
            department TEXT NOT NULL,
            duration INTEGER NOT NULL,
            dependencies TEXT,
            assigned_to TEXT NOT NULL,
            estimated_effort REAL NOT NULL,
            status TEXT NOT NULL,
            start_date TEXT,
            end_date TEXT,
            actual_effort REAL,
            completion_percentage REAL DEFAULT 0,
            actual_start_date TEXT,
            actual_end_date TEXT,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # 创建实施指标表
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS implementation_metrics (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            department TEXT NOT NULL,
            phase TEXT NOT NULL,
            value REAL NOT NULL,
            unit TEXT NOT NULL,
            target REAL NOT NULL,
            status TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            category TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # 创建实施问题表
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS implementation_issues (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            department TEXT NOT NULL,
            phase TEXT NOT NULL,
            issue_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            status TEXT NOT NULL,
            reported_by TEXT NOT NULL,
            reported_date TEXT NOT NULL,
            resolved_date TEXT,
            resolution TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # 创建实施报告表
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS implementation_reports (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            department TEXT NOT NULL,
            phase TEXT NOT NULL,
            content TEXT NOT NULL,
            report_type TEXT NOT NULL,
            generated_at TEXT NOT NULL,
            generated_by TEXT NOT NULL
        )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("数据库初始化完成")
    
    def create_default_tasks(self):
        """创建默认实施任务"""
        default_tasks = [
            # 准备阶段任务
            ImplementationTask(
                id="prep_001",
                name="部门需求调研",
                description="深入了解试点部门的具体需求、痛点和期望",
                phase=ImplementationPhase.PREPARATION,
                department="品宣部门",
                duration=3,
                dependencies=[],
                assigned_to="项目经理",
                estimated_effort=2.0,
                status=ImplementationStatus.NOT_STARTED
            ),
            ImplementationTask(
                id="prep_002",
                name="基线数据收集",
                description="收集部门当前的工作数据、效率指标和质量指标",
                phase=ImplementationPhase.PREPARATION,
                department="品宣部门",
                duration=2,
                dependencies=["prep_001"],
                assigned_to="数据分析师",
                estimated_effort=1.5,
                status=ImplementationStatus.NOT_STARTED
            ),
            ImplementationTask(
                id="prep_003",
                name="技术环境准备",
                description="准备AI工具账户、培训平台和效果追踪系统",
                phase=ImplementationPhase.PREPARATION,
                department="品宣部门",
                duration=3,
                dependencies=["prep_001"],
                assigned_to="技术专家",
                estimated_effort=3.0,
                status=ImplementationStatus.NOT_STARTED
            ),
            ImplementationTask(
                id="prep_004",
                name="培训材料准备",
                description="准备针对试点部门的定制化培训材料",
                phase=ImplementationPhase.PREPARATION,
                department="品宣部门",
                duration=2,
                dependencies=["prep_001"],
                assigned_to="培训协调员",
                estimated_effort=2.0,
                status=ImplementationStatus.NOT_STARTED
            ),
            
            # 培训阶段任务
            ImplementationTask(
                id="train_001",
                name="AI基础理论培训",
                description="讲解AI基础概念和应用场景",
                phase=ImplementationPhase.TRAINING,
                department="品宣部门",
                duration=1,
                dependencies=["prep_001", "prep_003", "prep_004"],
                assigned_to="培训协调员",
                estimated_effort=1.0,
                status=ImplementationStatus.NOT_STARTED
            ),
            ImplementationTask(
                id="train_002",
                name="工具操作培训",
                description="具体AI工具的使用方法和最佳实践",
                phase=ImplementationPhase.TRAINING,
                department="品宣部门",
                duration=2,
                dependencies=["train_001"],
                assigned_to="技术专家",
                estimated_effort=2.0,
                status=ImplementationStatus.NOT_STARTED
            ),
            ImplementationTask(
                id="train_003",
                name="案例分析培训",
                description="通过实际案例学习AI应用技巧",
                phase=ImplementationPhase.TRAINING,
                department="品宣部门",
                duration=1,
                dependencies=["train_002"],
                assigned_to="培训协调员",
                estimated_effort=1.0,
                status=ImplementationStatus.NOT_STARTED
            ),
            ImplementationTask(
                id="train_004",
                name="效果追踪系统培训",
                description="教授如何使用效果追踪系统",
                phase=ImplementationPhase.TRAINING,
                department="品宣部门",
                duration=1,
                dependencies=["train_002"],
                assigned_to="数据分析师",
                estimated_effort=1.0,
                status=ImplementationStatus.NOT_STARTED
            ),
            
            # 试点阶段任务
            ImplementationTask(
                id="pilot_001",
                name="小范围试点",
                description="在部门内小范围试点AI工具应用",
                phase=ImplementationPhase.PILOT,
                department="品宣部门",
                duration=5,
                dependencies=["train_001", "train_002", "train_003", "train_004"],
                assigned_to="部门负责人",
                estimated_effort=5.0,
                status=ImplementationStatus.NOT_STARTED
            ),
            ImplementationTask(
                id="pilot_002",
                name="效果数据收集",
                description="收集试点过程中的使用数据和效果数据",
                phase=ImplementationPhase.PILOT,
                department="品宣部门",
                duration=5,
                dependencies=["pilot_001"],
                assigned_to="数据分析师",
                estimated_effort=3.0,
                status=ImplementationStatus.NOT_STARTED
            ),
            ImplementationTask(
                id="pilot_003",
                name="用户反馈收集",
                description="收集用户使用体验和改进建议",
                phase=ImplementationPhase.PILOT,
                department="品宣部门",
                duration=3,
                dependencies=["pilot_001"],
                assigned_to="培训协调员",
                estimated_effort=2.0,
                status=ImplementationStatus.NOT_STARTED
            ),
            
            # 优化阶段任务
            ImplementationTask(
                id="opt_001",
                name="效果评估分析",
                description="分析试点效果，评估达成情况",
                phase=ImplementationPhase.OPTIMIZATION,
                department="品宣部门",
                duration=2,
                dependencies=["pilot_002", "pilot_003"],
                assigned_to="数据分析师",
                estimated_effort=2.0,
                status=ImplementationStatus.NOT_STARTED
            ),
            ImplementationTask(
                id="opt_002",
                name="问题识别解决",
                description="识别并解决试点过程中出现的问题",
                phase=ImplementationPhase.OPTIMIZATION,
                department="品宣部门",
                duration=2,
                dependencies=["opt_001"],
                assigned_to="技术专家",
                estimated_effort=2.0,
                status=ImplementationStatus.NOT_STARTED
            ),
            ImplementationTask(
                id="opt_003",
                name="流程优化改进",
                description="基于试点反馈优化实施流程",
                phase=ImplementationPhase.OPTIMIZATION,
                department="品宣部门",
                duration=2,
                dependencies=["opt_001"],
                assigned_to="项目经理",
                estimated_effort=2.0,
                status=ImplementationStatus.NOT_STARTED
            ),
            
            # 推广阶段任务
            ImplementationTask(
                id="roll_001",
                name="推广方案制定",
                description="制定向其他部门推广的具体方案",
                phase=ImplementationPhase.ROLLOUT,
                department="品宣部门",
                duration=2,
                dependencies=["opt_001", "opt_002", "opt_003"],
                assigned_to="项目经理",
                estimated_effort=2.0,
                status=ImplementationStatus.NOT_STARTED
            ),
            ImplementationTask(
                id="roll_002",
                name="全面培训实施",
                description="在目标部门实施全面培训",
                phase=ImplementationPhase.ROLLOUT,
                department="品宣部门",
                duration=3,
                dependencies=["roll_001"],
                assigned_to="培训协调员",
                estimated_effort=3.0,
                status=ImplementationStatus.NOT_STARTED
            ),
            ImplementationTask(
                id="roll_003",
                name="效果监控评估",
                description="监控推广过程中的效果并进行评估",
                phase=ImplementationPhase.ROLLOUT,
                department="品宣部门",
                duration=4,
                dependencies=["roll_002"],
                assigned_to="数据分析师",
                estimated_effort=3.0,
                status=ImplementationStatus.NOT_STARTED
            )
        ]
        
        # 为所有部门创建相同的任务
        for department in self.departments:
            for task in default_tasks:
                task.department = department
                self.save_task(task)
        
        logger.info(f"为{len(self.departments)}个部门创建了{len(default_tasks)}个任务")
    
    def save_task(self, task: ImplementationTask):
        """保存任务到数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT OR REPLACE INTO implementation_tasks 
        (id, name, description, phase, department, duration, dependencies, assigned_to, 
         estimated_effort, status, start_date, end_date, actual_effort, completion_percentage,
         actual_start_date, actual_end_date, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            task.id, task.name, task.description, task.phase.value, task.department,
            task.duration, json.dumps(task.dependencies), task.assigned_to,
            task.estimated_effort, task.status.value, task.start_date, task.end_date,
            task.actual_effort, task.completion_percentage, task.actual_start_date,
            task.actual_end_date, task.notes, datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
    
    def get_tasks(self, department: str = None, phase: ImplementationPhase = None, 
                  status: ImplementationStatus = None) -> List[ImplementationTask]:
        """获取任务列表"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = "SELECT * FROM implementation_tasks WHERE 1=1"
        params = []
        
        if department:
            query += " AND department = ?"
            params.append(department)
        
        if phase:
            query += " AND phase = ?"
            params.append(phase.value)
        
        if status:
            query += " AND status = ?"
            params.append(status.value)
        
        query += " ORDER BY created_at DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        tasks = []
        for row in rows:
            task = ImplementationTask(
                id=row[0], name=row[1], description=row[2], phase=ImplementationPhase(row[3]),
                department=row[4], duration=row[5], dependencies=json.loads(row[6]) if row[6] else [],
                assigned_to=row[7], estimated_effort=row[8], status=ImplementationStatus(row[9]),
                start_date=row[10], end_date=row[11], actual_effort=row[12],
                completion_percentage=row[13], actual_start_date=row[14],
                actual_end_date=row[15], notes=row[16]
            )
            tasks.append(task)
        
        return tasks
    
    def update_task_status(self, task_id: str, status: ImplementationStatus, 
                           completion_percentage: float = None, notes: str = None):
        """更新任务状态"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        update_fields = ["status = ?", "updated_at = ?"]
        params = [status.value, datetime.now().isoformat()]
        
        if completion_percentage is not None:
            update_fields.append("completion_percentage = ?")
            params.append(completion_percentage)
        
        if notes is not None:
            update_fields.append("notes = ?")
            params.append(notes)
        
        query = f"UPDATE implementation_tasks SET {', '.join(update_fields)} WHERE id = ?"
        params.append(task_id)
        
        cursor.execute(query, params)
        conn.commit()
        conn.close()
        
        logger.info(f"任务{task_id}状态已更新为{status.value}")
    
    def create_default_metrics(self):
        """创建默认实施指标"""
        default_metrics = [
            # 品宣部门指标
            ImplementationMetric(
                id="pr_001",
                name="文案创作效率提升",
                description="使用AI工具后的文案创作效率提升倍数",
                department="品宣部门",
                phase=ImplementationPhase.PILOT,
                value=0.0,
                unit="倍",
                target=3.0,
                status="not_started",
                timestamp=datetime.now().isoformat(),
                category="quantitative"
            ),
            ImplementationMetric(
                id="pr_002",
                name="设计效率提升",
                description="使用AI工具后的视觉设计效率提升倍数",
                department="品宣部门",
                phase=ImplementationPhase.PILOT,
                value=0.0,
                unit="倍",
                target=2.5,
                status="not_started",
                timestamp=datetime.now().isoformat(),
                category="quantitative"
            ),
            ImplementationMetric(
                id="pr_003",
                name="用户满意度",
                description="用户对AI工具使用体验的满意度评分",
                department="品宣部门",
                phase=ImplementationPhase.PILOT,
                value=0.0,
                unit="分",
                target=4.5,
                status="not_started",
                timestamp=datetime.now().isoformat(),
                category="qualitative"
            ),
            
            # 财务部门指标
            ImplementationMetric(
                id="finance_001",
                name="数据处理效率提升",
                description="使用AI工具后的数据处理效率提升倍数",
                department="财务部门",
                phase=ImplementationPhase.PILOT,
                value=0.0,
                unit="倍",
                target=5.0,
                status="not_started",
                timestamp=datetime.now().isoformat(),
                category="quantitative"
            ),
            ImplementationMetric(
                id="finance_002",
                name="报表生成效率提升",
                description="使用AI工具后的报表生成效率提升倍数",
                department="财务部门",
                phase=ImplementationPhase.PILOT,
                value=0.0,
                unit="倍",
                target=4.0,
                status="not_started",
                timestamp=datetime.now().isoformat(),
                category="quantitative"
            ),
            ImplementationMetric(
                id="finance_003",
                name="用户接受度",
                description="财务部门员工对AI工具的接受程度",
                department="财务部门",
                phase=ImplementationPhase.PILOT,
                value=0.0,
                unit="%",
                target=85,
                status="not_started",
                timestamp=datetime.now().isoformat(),
                category="qualitative"
            ),
            
            # 编剧部门指标
            ImplementationMetric(
                id="script_001",
                name="创作效率提升",
                description="使用AI工具后的剧本创作效率提升倍数",
                department="编剧部门",
                phase=ImplementationPhase.PILOT,
                value=0.0,
                unit="倍",
                target=2.8,
                status="not_started",
                timestamp=datetime.now().isoformat(),
                category="quantitative"
            ),
            ImplementationMetric(
                id="script_002",
                name="创意质量提升",
                description="使用AI工具后的创意质量提升程度",
                department="编剧部门",
                phase=ImplementationPhase.PILOT,
                value=0.0,
                unit="倍",
                target=2.0,
                status="not_started",
                timestamp=datetime.now().isoformat(),
                category="qualitative"
            ),
            ImplementationMetric(
                id="script_003",
                name="角色一致性",
                description="使用AI工具后的角色一致性改善程度",
                department="编剧部门",
                phase=ImplementationPhase.PILOT,
                value=0.0,
                unit="%",
                target=90,
                status="not_started",
                timestamp=datetime.now().isoformat(),
                category="strategic"
            )
        ]
        
        for metric in default_metrics:
            self.save_metric(metric)
        
        logger.info(f"创建了{len(default_metrics)}个默认指标")
    
    def save_metric(self, metric: ImplementationMetric):
        """保存指标到数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT OR REPLACE INTO implementation_metrics 
        (id, name, description, department, phase, value, unit, target, status, 
         timestamp, category, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            metric.id, metric.name, metric.description, metric.department,
            metric.phase.value, metric.value, metric.unit, metric.target,
            metric.status, metric.timestamp, metric.category,
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
    
    def update_metric(self, metric_id: str, value: float, status: str = None):
        """更新指标值"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        update_fields = ["value = ?", "timestamp = ?"]
        params = [value, datetime.now().isoformat()]
        
        if status:
            update_fields.append("status = ?")
            params.append(status)
        
        query = f"UPDATE implementation_metrics SET {', '.join(update_fields)} WHERE id = ?"
        params.append(metric_id)
        
        cursor.execute(query, params)
        conn.commit()
        conn.close()
        
        logger.info(f"指标{metric_id}值已更新为{value}")
    
    def record_issue(self, title: str, description: str, department: str, 
                    phase: ImplementationPhase, issue_type: str, severity: RiskLevel,
                    reported_by: str):
        """记录实施问题"""
        issue_id = f"issue_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT INTO implementation_issues 
        (id, title, description, department, phase, issue_type, severity, status, 
         reported_by, reported_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            issue_id, title, description, department, phase.value, issue_type,
            severity.value, "open", reported_by, datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"问题已记录: {title}")
        return issue_id
    
    def resolve_issue(self, issue_id: str, resolution: str):
        """解决实施问题"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        UPDATE implementation_issues 
        SET status = ?, resolution = ?, resolved_date = ?
        WHERE id = ?
        ''', ("resolved", resolution, datetime.now().isoformat(), issue_id))
        
        conn.commit()
        conn.close()
        
        logger.info(f"问题{issue_id}已解决")
    
    def generate_report(self, department: str = None, phase: ImplementationPhase = None) -> Dict[str, Any]:
        """生成实施报告"""
        # 获取任务
        tasks = self.get_tasks(department, phase)
        
        # 获取指标
        metrics = []
        if department:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM implementation_metrics WHERE department = ?", (department,))
            rows = cursor.fetchall()
            conn.close()
            
            for row in rows:
                metrics.append(ImplementationMetric(
                    id=row[0], name=row[1], description=row[2], department=row[3],
                    phase=ImplementationPhase(row[4]), value=row[5], unit=row[6],
                    target=row[7], status=row[8], timestamp=row[9], category=row[10]
                ))
        
        # 获取问题
        issues = []
        if department:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM implementation_issues WHERE department = ?", (department,))
            rows = cursor.fetchall()
            conn.close()
            
            for row in rows:
                issues.append({
                    "id": row[0], "title": row[1], "description": row[2],
                    "department": row[3], "phase": row[4], "issue_type": row[5],
                    "severity": row[6], "status": row[7], "reported_by": row[8],
                    "reported_date": row[9], "resolved_date": row[10], "resolution": row[11]
                })
        
        # 分析任务状态
        task_analysis = {
            "total_tasks": len(tasks),
            "completed_tasks": len([t for t in tasks if t.status == ImplementationStatus.COMPLETED]),
            "in_progress_tasks": len([t for t in tasks if t.status == ImplementationStatus.IN_PROGRESS]),
            "not_started_tasks": len([t for t in tasks if t.status == ImplementationStatus.NOT_STARTED]),
            "delayed_tasks": len([t for t in tasks if t.status == ImplementationStatus.DELAYED]),
            "overall_completion": sum(t.completion_percentage for t in tasks) / len(tasks) if tasks else 0
        }
        
        # 分析指标达成情况
        metric_analysis = {
            "total_metrics": len(metrics),
            "achieved_metrics": len([m for m in metrics if m.value >= m.target]),
            "in_progress_metrics": len([m for m in metrics if m.status == "in_progress"]),
            "achievement_rate": sum(1 for m in metrics if m.value >= m.target) / len(metrics) * 100 if metrics else 0
        }
        
        # 分析问题状态
        issue_analysis = {
            "total_issues": len(issues),
            "open_issues": len([i for i in issues if i["status"] == "open"]),
            "resolved_issues": len([i for i in issues if i["status"] == "resolved"]),
            "critical_issues": len([i for i in issues if i["severity"] == "high"])
        }
        
        # 生成评估
        assessment = {
            "overall_status": self.get_overall_status(tasks, metrics, issues),
            "risk_level": self.assess_risk_level(tasks, metrics, issues),
            "success_probability": self.calculate_success_probability(tasks, metrics, issues),
            "recommendations": self.generate_recommendations(tasks, metrics, issues)
        }
        
        report = {
            "report_date": datetime.now().isoformat(),
            "department": department or "全部部门",
            "phase": phase.value if phase else "全部阶段",
            "task_analysis": task_analysis,
            "metric_analysis": metric_analysis,
            "issue_analysis": issue_analysis,
            "assessment": assessment,
            "detailed_tasks": [asdict(t) for t in tasks],
            "detailed_metrics": [asdict(m) for m in metrics],
            "detailed_issues": issues
        }
        
        return report
    
    def get_overall_status(self, tasks: List[ImplementationTask], 
                          metrics: List[ImplementationMetric], issues: List[Dict]) -> str:
        """获取整体状态"""
        if not tasks:
            return "未开始"
        
        completion_rate = sum(t.completion_percentage for t in tasks) / len(tasks)
        critical_issues = len([i for i in issues if i["severity"] == "high"])
        
        if completion_rate >= 90 and critical_issues == 0:
            return "优秀"
        elif completion_rate >= 75 and critical_issues <= 2:
            return "良好"
        elif completion_rate >= 60 and critical_issues <= 5:
            return "正常"
        elif completion_rate >= 30:
            return "滞后"
        else:
            return "严重滞后"
    
    def assess_risk_level(self, tasks: List[ImplementationTask], 
                         metrics: List[ImplementationMetric], issues: List[Dict]) -> str:
        """评估风险等级"""
        delayed_tasks = len([t for t in tasks if t.status == ImplementationStatus.DELAYED])
        critical_issues = len([i for i in issues if i["severity"] == "high"])
        low_metrics = len([m for m in metrics if m.value < m.target * 0.8])
        
        risk_score = delayed_tasks + critical_issues * 2 + low_metrics
        
        if risk_score >= 10:
            return "高风险"
        elif risk_score >= 5:
            return "中等风险"
        else:
            return "低风险"
    
    def calculate_success_probability(self, tasks: List[ImplementationTask], 
                                   metrics: List[ImplementationMetric], issues: List[Dict]) -> float:
        """计算成功概率"""
        if not tasks:
            return 0.0
        
        completion_rate = sum(t.completion_percentage for t in tasks) / len(tasks)
        achieved_metrics = len([m for m in metrics if m.value >= m.target]) / len(metrics) if metrics else 0
        resolved_issues = len([i for i in issues if i["status"] == "resolved"]) / len(issues) if issues else 0
        
        success_probability = (completion_rate * 0.4 + achieved_metrics * 0.4 + resolved_issues * 0.2) * 100
        return round(success_probability, 2)
    
    def generate_recommendations(self, tasks: List[ImplementationTask], 
                               metrics: List[ImplementationMetric], issues: List[Dict]) -> List[str]:
        """生成建议"""
        recommendations = []
        
        # 基于任务完成情况
        delayed_tasks = [t for t in tasks if t.status == ImplementationStatus.DELAYED]
        if delayed_tasks:
            recommendations.append(f"关注{len(delayed_tasks)}个延迟任务，需要加强进度监控")
        
        # 基于指标完成情况
        low_metrics = [m for m in metrics if m.value < m.target * 0.8]
        if low_metrics:
            recommendations.append(f"关注{len(low_metrics)}个未达预期的指标，需要制定改进计划")
        
        # 基于问题情况
        open_issues = [i for i in issues if i["status"] == "open"]
        if open_issues:
            recommendations.append(f"优先解决{len(open_issues)}个开放性问题")
        
        # 基于整体情况
        completion_rate = sum(t.completion_percentage for t in tasks) / len(tasks) if tasks else 0
        if completion_rate < 0.5:
            recommendations.append("当前进度较慢，建议增加资源投入或优化实施策略")
        
        return recommendations

def main():
    """主函数"""
    # 初始化跟踪系统
    tracker = ImplementationTracker()
    
    # 创建默认任务和指标
    tracker.create_default_tasks()
    tracker.create_default_metrics()
    
    # 启动第一个任务
    tracker.update_task_status("prep_001", ImplementationStatus.IN_PROGRESS, 10.0, "开始部门需求调研")
    
    # 记录第一个问题
    tracker.record_issue(
        "AI工具账户创建延迟",
        "品宣部门AI工具账户创建延迟，影响培训计划",
        "品宣部门",
        ImplementationPhase.PREPARATION,
        "技术问题",
        RiskLevel.MEDIUM,
        "项目经理"
    )
    
    # 生成报告
    report = tracker.generate_report("品宣部门")
    
    # 输出报告
    print("=== AIGC培训试点实施报告 ===")
    print(json.dumps(report, indent=2, ensure_ascii=False, default=str))
    
    # 保存报告到文件
    output_file = "～/.openclaw/workspace/讲座规划/📝工作日志/试点实施跟踪报告.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"报告已保存到: {output_file}")

if __name__ == "__main__":
    main()