from fastapi import FastAPI, HTTPException, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
import uvicorn
from datetime import datetime
import json
from typing import List, Optional, Dict, Any

from .models.database import Base, User, UsageLog, LearningRecord, PerformanceMetric, Course, Department
from .services.database import get_db, engine
from .services.analytics import AnalyticsService
from .services.monitoring import MonitoringService

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AIGC Training Effect Tracker", version="1.0.0")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 安全认证
security = HTTPBearer()

# 初始化服务
analytics_service = AnalyticsService()
monitoring_service = MonitoringService()

@app.get("/")
async def root():
    return {"message": "AIGC Training Effect Tracker API", "timestamp": datetime.utcnow()}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# 用户相关接口
@app.post("/users/")
async def create_user(user_data: dict, db: Session = Depends(get_db)):
    """创建用户"""
    try:
        user = User(
            username=user_data.get("username"),
            department=user_data.get("department"),
            email=user_data.get("email"),
            role=user_data.get("role", "user")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return {"id": user.id, "username": user.username, "department": user.department}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """获取用户信息"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "username": user.username,
        "department": user.department,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at,
        "is_active": user.is_active
    }

@app.get("/users/{user_id}/usage")
async def get_user_usage(user_id: int, start_date: datetime = None, end_date: datetime = None, db: Session = Depends(get_db)):
    """获取用户使用数据"""
    query = db.query(UsageLog).filter(UsageLog.user_id == user_id)
    
    if start_date:
        query = query.filter(UsageLog.timestamp >= start_date)
    if end_date:
        query = query.filter(UsageLog.timestamp <= end_date)
    
    usage_logs = query.all()
    return [
        {
            "id": log.id,
            "timestamp": log.timestamp,
            "tool_name": log.tool_name,
            "action_type": log.action_type,
            "duration": log.duration,
            "success": log.success,
            "error_message": log.error_message,
            "metadata": log.metadata
        }
        for log in usage_logs
    ]

# 数据分析接口
@app.get("/analytics/usage-trends")
async def get_usage_trends(department: str = None, tool: str = None, db: Session = Depends(get_db)):
    """获取使用趋势分析"""
    return await analytics_service.get_usage_trends(department, tool, db)

@app.get("/analytics/performance")
async def get_performance_metrics(department: str = None, db: Session = Depends(get_db)):
    """获取绩效指标"""
    return await analytics_service.get_performance_metrics(department, db)

@app.get("/analytics/roi")
async def get_roi_analysis(department: str = None, db: Session = Depends(get_db)):
    """获取ROI分析"""
    return await analytics_service.get_roi_analysis(department, db)

# 预警接口
@app.get("/alerts")
async def get_active_alerts(severity: str = None, db: Session = Depends(get_db)):
    """获取活跃预警"""
    return await monitoring_service.get_active_alerts(severity, db)

# 报告接口
@app.post("/reports/generate")
async def generate_report(report_type: str, parameters: dict, db: Session = Depends(get_db)):
    """生成报告"""
    if report_type == "usage_report":
        return await analytics_service.generate_usage_report(parameters, db)
    elif report_type == "performance_report":
        return await analytics_service.generate_performance_report(parameters, db)
    else:
        raise HTTPException(status_code=400, detail="Unsupported report type")

@app.get("/reports/{report_id}")
async def get_report(report_id: str, db: Session = Depends(get_db)):
    """获取报告"""
    # 这里应该从数据库或文件存储中获取报告
    # 为了演示，返回一个模拟的报告
    return {
        "id": report_id,
        "type": "usage_report",
        "generated_at": datetime.utcnow(),
        "data": {
            "total_actions": 1250,
            "unique_users": 45,
            "success_rate": 95.5,
            "average_duration": 12.5
        }
    }

# WebSocket 实时数据推送
@app.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # 获取实时数据
            realtime_data = await monitoring_service.get_realtime_data()
            await websocket.send_json(realtime_data)
            await asyncio.sleep(1)  # 每秒推送一次
    except Exception as e:
        await websocket.close(code=1000, reason=str(e))

# 批量数据导入接口
@app.post("/data/import/usage-logs")
async def import_usage_logs(logs: List[dict], db: Session = Depends(get_db)):
    """批量导入使用日志"""
    imported_logs = []
    for log_data in logs:
        try:
            log = UsageLog(
                user_id=log_data.get("user_id"),
                tool_name=log_data.get("tool_name"),
                action_type=log_data.get("action_type"),
                timestamp=datetime.fromisoformat(log_data.get("timestamp")),
                duration=log_data.get("duration", 0),
                success=log_data.get("success", True),
                error_message=log_data.get("error_message"),
                metadata=json.dumps(log_data.get("metadata", {}))
            )
            db.add(log)
            imported_logs.append(log.id)
        except Exception as e:
            print(f"导入日志失败: {e}")
    
    db.commit()
    return {"imported_count": len(imported_logs), "total_count": len(logs)}

# 系统统计接口
@app.get("/system/stats")
async def get_system_stats(db: Session = Depends(get_db)):
    """获取系统统计信息"""
    total_users = db.query(User).count()
    total_logs = db.query(UsageLog).count()
    total_courses = db.query(Course).count()
    total_departments = db.query(Department).count()
    
    return {
        "total_users": total_users,
        "total_usage_logs": total_logs,
        "total_courses": total_courses,
        "total_departments": total_departments,
        "system_uptime": datetime.utcnow(),
        "database_status": "healthy"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)