from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    department = Column(String(50), nullable=False)
    email = Column(String(100), unique=True)
    role = Column(String(20), default='user')
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # 关系
    usage_logs = relationship("UsageLog", back_populates="user")
    learning_records = relationship("LearningRecord", back_populates="user")
    performance_metrics = relationship("PerformanceMetric", back_populates="user")

class UsageLog(Base):
    __tablename__ = 'usage_logs'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    tool_name = Column(String(100), nullable=False)
    action_type = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    duration = Column(Float)  # 使用时长（秒）
    success = Column(Boolean, default=True)
    error_message = Column(Text)
    metadata = Column(JSON)  # JSON格式的元数据
    
    # 关系
    user = relationship("User", back_populates="usage_logs")

class LearningRecord(Base):
    __tablename__ = 'learning_records'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    course_id = Column(String(50), nullable=False)
    course_name = Column(String(200), nullable=False)
    completion_rate = Column(Float)
    score = Column(Float)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    status = Column(String(20), default='in_progress')
    
    # 关系
    user = relationship("User", back_populates="learning_records")

class PerformanceMetric(Base):
    __tablename__ = 'performance_metrics'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    metric_type = Column(String(50), nullable=False)  # efficiency, quality, productivity
    value = Column(Float, nullable=False)
    measurement_date = Column(DateTime, default=datetime.utcnow)
    baseline_value = Column(Float)
    improvement = Column(Float)
    
    # 关系
    user = relationship("User", back_populates="performance_metrics")

class Course(Base):
    __tablename__ = 'courses'
    
    id = Column(Integer, primary_key=True)
    course_id = Column(String(50), unique=True, nullable=False)
    course_name = Column(String(200), nullable=False)
    department = Column(String(50), nullable=False)
    difficulty_level = Column(String(20))  # basic, intermediate, advanced
    duration_hours = Column(Float)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class Department(Base):
    __tablename__ = 'departments'
    
    id = Column(Integer, primary_key=True)
    department_code = Column(String(20), unique=True, nullable=False)
    department_name = Column(String(100), nullable=False)
    manager_name = Column(String(100))
    employee_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class Alert(Base):
    __tablename__ = 'alerts'
    
    id = Column(Integer, primary_key=True)
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)  # low, medium, high, critical
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    target_department = Column(String(50))
    target_user = Column(String(50))
    status = Column(String(20), default='active')  # active, resolved, dismissed
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)
    metadata = Column(JSON)