from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from contextlib import contextmanager
import os
from typing import Generator

# 数据库配置
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aigc_training.db")

# 创建数据库引擎
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False  # 设置为True可以看到SQL日志
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 数据库依赖
def get_db() -> Generator[Session, None, None]:
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """获取数据库会话的上下文管理器"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 初始化数据库
def init_db():
    """初始化数据库表"""
    from .models.database import Base
    Base.metadata.create_all(bind=engine)

# 数据库连接测试
def test_connection():
    """测试数据库连接"""
    try:
        with get_db() as db:
            db.execute("SELECT 1")
            return {"status": "success", "message": "数据库连接正常"}
    except Exception as e:
        return {"status": "error", "message": f"数据库连接失败: {str(e)}"}

# 数据库连接信息
def get_database_info():
    """获取数据库连接信息"""
    return {
        "url": DATABASE_URL,
        "driver": "sqlite" if "sqlite" in DATABASE_URL else "postgresql",
        "status": "connected" if test_connection()["status"] == "success" else "disconnected"
    }