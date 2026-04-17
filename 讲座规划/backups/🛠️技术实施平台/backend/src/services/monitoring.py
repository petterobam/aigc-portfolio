from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from ..models.database import User, UsageLog, LearningRecord, PerformanceMetric, Course, Department, Alert
import asyncio
import json
from dataclasses import dataclass
from enum import Enum

class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertType(Enum):
    SYSTEM_ERROR = "system_error"
    PERFORMANCE_ISSUE = "performance_issue"
    USAGE_ANOMALY = "usage_anomaly"
    TRAINING_ISSUE = "training_issue"
    DEADLINE_WARNING = "deadline_warning"
    SECURITY_ALERT = "security_alert"

@dataclass
class AlertRule:
    name: str
    condition: str
    severity: AlertSeverity
    message_template: str
    enabled: bool = True

class MonitoringService:
    """监控预警服务"""
    
    def __init__(self):
        self.alert_rules = self._init_alert_rules()
        self.websocket_connections = []
        self.monitoring_active = False
        
    def _init_alert_rules(self) -> List[AlertRule]:
        """初始化预警规则"""
        return [
            AlertRule(
                name="系统错误率过高",
                condition="error_rate > 5",
                severity=AlertSeverity.HIGH,
                message_template="系统错误率过高: {error_rate}%"
            ),
            AlertRule(
                name="使用量突增",
                condition="usage_spike > 200",
                severity=AlertSeverity.MEDIUM,
                message_template="使用量突增: {current_usage} vs {baseline_usage}"
            ),
            AlertRule(
                name="培训完成率过低",
                condition="completion_rate < 60",
                severity=AlertSeverity.MEDIUM,
                message_template="培训完成率过低: {completion_rate}%"
            ),
            AlertRule(
                name="响应时间过长",
                condition="avg_response_time > 30",
                severity=AlertSeverity.HIGH,
                message_template="平均响应时间过长: {avg_response_time}秒"
            ),
            AlertRule(
                name="用户活跃度下降",
                condition="active_users < 3",
                severity=AlertSeverity.LOW,
                message_template="活跃用户数量过少: {active_users}"
            )
        ]
    
    async def get_active_alerts(self, severity: str = None, db: Session = None) -> List[Dict[str, Any]]:
        """获取活跃预警"""
        query = db.query(Alert).filter(Alert.status == "active")
        
        if severity:
            query = query.filter(Alert.severity == severity)
        
        alerts = query.order_by(desc(Alert.created_at)).all()
        
        return [
            {
                "id": alert.id,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "title": alert.title,
                "description": alert.description,
                "target_department": alert.target_department,
                "target_user": alert.target_user,
                "created_at": alert.created_at.isoformat(),
                "metadata": alert.metadata
            }
            for alert in alerts
        ]
    
    async def check_alert_conditions(self, db: Session = None) -> List[Dict[str, Any]]:
        """检查预警条件"""
        triggered_alerts = []
        
        for rule in self.alert_rules:
            if not rule.enabled:
                continue
                
            # 检查规则条件
            alert_data = await self._evaluate_alert_rule(rule, db)
            
            if alert_data:
                # 创建预警
                alert = await self._create_alert(rule, alert_data, db)
                if alert:
                    triggered_alerts.append(alert)
                    
                    # 推送实时通知
                    await self._push_realtime_notification(alert)
        
        return triggered_alerts
    
    async def _evaluate_alert_rule(self, rule: AlertRule, db: Session = None) -> Optional[Dict[str, Any]]:
        """评估预警规则"""
        condition = rule.condition
        
        # 模拟条件评估（实际应用中应该根据具体业务逻辑）
        if condition == "error_rate > 5":
            error_rate = await self._calculate_error_rate(db)
            if error_rate > 5:
                return {"error_rate": error_rate}
        
        elif condition == "usage_spike > 200":
            usage_spike = await self._check_usage_spike(db)
            if usage_spike > 200:
                return usage_spike
        
        elif condition == "completion_rate < 60":
            completion_rate = await self._calculate_completion_rate(db)
            if completion_rate < 60:
                return {"completion_rate": completion_rate}
        
        elif condition == "avg_response_time > 30":
            response_time = await self._calculate_avg_response_time(db)
            if response_time > 30:
                return {"avg_response_time": response_time}
        
        elif condition == "active_users < 3":
            active_users = await self._count_active_users(db)
            if active_users < 3:
                return {"active_users": active_users}
        
        return None
    
    async def _calculate_error_rate(self, db: Session = None) -> float:
        """计算错误率"""
        total_logs = db.query(UsageLog).filter(
            UsageLog.timestamp >= datetime.now() - timedelta(hours=1)
        ).count()
        
        error_logs = db.query(UsageLog).filter(
            UsageLog.timestamp >= datetime.now() - timedelta(hours=1),
            UsageLog.success == False
        ).count()
        
        return (error_logs / total_logs * 100) if total_logs > 0 else 0
    
    async def _check_usage_spike(self, db: Session = None) -> Optional[Dict[str, Any]]:
        """检查使用量突增"""
        current_time = datetime.now()
        baseline_time = current_time - timedelta(hours=24)
        
        # 当前小时使用量
        current_usage = db.query(UsageLog).filter(
            UsageLog.timestamp >= current_time - timedelta(hours=1)
        ).count()
        
        # 基准使用量（过去24小时平均）
        baseline_usage = db.query(UsageLog).filter(
            UsageLog.timestamp >= baseline_time,
            UsageLog.timestamp < current_time
        ).count()
        
        if baseline_usage == 0:
            return None
            
        spike_percentage = ((current_usage - baseline_usage) / baseline_usage) * 100
        
        if spike_percentage > 200:
            return {
                "current_usage": current_usage,
                "baseline_usage": baseline_usage,
                "spike_percentage": spike_percentage
            }
        
        return None
    
    async def _calculate_completion_rate(self, db: Session = None) -> float:
        """计算完成率"""
        total_records = db.query(LearningRecord).filter(
            LearningRecord.timestamp >= datetime.now() - timedelta(days=7)
        ).count()
        
        completed_records = db.query(LearningRecord).filter(
            LearningRecord.timestamp >= datetime.now() - timedelta(days=7),
            LearningRecord.status == "completed"
        ).count()
        
        return (completed_records / total_records * 100) if total_records > 0 else 0
    
    async def _calculate_avg_response_time(self, db: Session = None) -> float:
        """计算平均响应时间"""
        recent_logs = db.query(UsageLog).filter(
            UsageLog.timestamp >= datetime.now() - timedelta(hours=1)
        ).all()
        
        if not recent_logs:
            return 0
            
        response_times = [log.duration for log in recent_logs if log.duration]
        return sum(response_times) / len(response_times) if response_times else 0
    
    async def _count_active_users(self, db: Session = None) -> int:
        """统计活跃用户数"""
        recent_logs = db.query(UsageLog).filter(
            UsageLog.timestamp >= datetime.now() - timedelta(hours=1)
        ).all()
        
        unique_users = set(log.user_id for log in recent_logs)
        return len(unique_users)
    
    async def _create_alert(self, rule: AlertRule, alert_data: Dict[str, Any], db: Session = None) -> Optional[Dict[str, Any]]:
        """创建预警"""
        try:
            # 格式化消息
            message = rule.message_template.format(**alert_data)
            
            # 创建预警记录
            alert = Alert(
                alert_type=rule.name,
                severity=rule.severity.value,
                title=f"预警: {rule.name}",
                description=message,
                metadata=alert_data,
                status="active",
                created_at=datetime.now()
            )
            
            db.add(alert)
            db.commit()
            db.refresh(alert)
            
            return {
                "id": alert.id,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "title": alert.title,
                "description": alert.description,
                "metadata": alert.metadata,
                "created_at": alert.created_at.isoformat()
            }
            
        except Exception as e:
            print(f"创建预警失败: {e}")
            return None
    
    async def _push_realtime_notification(self, alert: Dict[str, Any]):
        """推送实时通知"""
        if not self.websocket_connections:
            return
            
        notification = {
            "type": "alert",
            "alert": alert,
            "timestamp": datetime.now().isoformat()
        }
        
        # 推送给所有连接的WebSocket客户端
        for connection in self.websocket_connections:
            try:
                await connection.send_json(notification)
            except:
                # 连接可能已断开，移除
                self.websocket_connections.remove(connection)
    
    async def get_realtime_data(self) -> Dict[str, Any]:
        """获取实时数据"""
        # 这里应该从数据库获取最新的实时数据
        # 为了演示，返回模拟数据
        return {
            "timestamp": datetime.now().isoformat(),
            "active_users": 15,
            "total_actions": 1250,
            "success_rate": 96.5,
            "avg_response_time": 1.2,
            "alerts": await self.get_active_alerts(),
            "system_status": "healthy"
        }
    
    async def start_monitoring(self, db: Session = None):
        """启动监控"""
        self.monitoring_active = True
        
        while self.monitoring_active:
            try:
                # 检查预警条件
                alerts = await self.check_alert_conditions(db)
                
                if alerts:
                    print(f"触发 {len(alerts)} 个预警")
                
                # 等待一段时间再检查
                await asyncio.sleep(60)  # 每分钟检查一次
                
            except Exception as e:
                print(f"监控过程中发生错误: {e}")
                await asyncio.sleep(30)  # 出错后等待30秒再继续
    
    async def stop_monitoring(self):
        """停止监控"""
        self.monitoring_active = False
    
    def add_websocket_connection(self, websocket):
        """添加WebSocket连接"""
        self.websocket_connections.append(websocket)
    
    def remove_websocket_connection(self, websocket):
        """移除WebSocket连接"""
        if websocket in self.websocket_connections:
            self.websocket_connections.remove(websocket)
    
    async def resolve_alert(self, alert_id: int, db: Session = None) -> bool:
        """解决预警"""
        try:
            alert = db.query(Alert).filter(Alert.id == alert_id).first()
            if alert:
                alert.status = "resolved"
                alert.resolved_at = datetime.now()
                db.commit()
                return True
            return False
        except Exception as e:
            print(f"解决预警失败: {e}")
            return False
    
    async def dismiss_alert(self, alert_id: int, db: Session = None) -> bool:
        """忽略预警"""
        try:
            alert = db.query(Alert).filter(Alert.id == alert_id).first()
            if alert:
                alert.status = "dismissed"
                alert.resolved_at = datetime.now()
                db.commit()
                return True
            return False
        except Exception as e:
            print(f"忽略预警失败: {e}")
            return False
    
    async def get_monitoring_dashboard(self, db: Session = None) -> Dict[str, Any]:
        """获取监控仪表板数据"""
        # 获取统计数据
        total_alerts = db.query(Alert).count()
        active_alerts = db.query(Alert).filter(Alert.status == "active").count()
        resolved_alerts = db.query(Alert).filter(Alert.status == "resolved").count()
        
        # 按严重程度统计
        severity_stats = {}
        for severity in ["low", "medium", "high", "critical"]:
            count = db.query(Alert).filter(
                Alert.status == "active",
                Alert.severity == severity
            ).count()
            severity_stats[severity] = count
        
        # 获取最近24小时的预警趋势
        recent_alerts = db.query(Alert).filter(
            Alert.created_at >= datetime.now() - timedelta(hours=24)
        ).order_by(desc(Alert.created_at)).all()
        
        # 按小时统计预警数量
        hourly_alerts = {}
        for alert in recent_alerts:
            hour = alert.created_at.hour
            hourly_alerts[hour] = hourly_alerts.get(hour, 0) + 1
        
        return {
            "summary": {
                "total_alerts": total_alerts,
                "active_alerts": active_alerts,
                "resolved_alerts": resolved_alerts,
                "resolution_rate": (resolved_alerts / total_alerts * 100) if total_alerts > 0 else 0
            },
            "severity_distribution": severity_stats,
            "hourly_trend": hourly_alerts,
            "recent_alerts": [
                {
                    "id": alert.id,
                    "severity": alert.severity,
                    "title": alert.title,
                    "created_at": alert.created_at.isoformat()
                }
                for alert in recent_alerts[:10]  # 最近10个预警
            ]
        }