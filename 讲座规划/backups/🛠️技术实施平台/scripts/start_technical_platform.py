#!/usr/bin/env python3
"""
AIGC培训效果追踪系统 - 主执行脚本
用于启动技术平台和试点实施
"""

import asyncio
import logging
import os
import sys
import json
from datetime import datetime
from pathlib import Path

# 添加路径以便导入模块
sys.path.append(str(Path(__file__).parent.parent / "backend/src"))
sys.path.append(str(Path(__file__).parent.parent / "scripts"))

from services.database import init_db, test_connection
from services.analytics import AnalyticsService
from services.monitoring import MonitoringService
from implementation_tracker import ImplementationTracker, ImplementationPhase

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('technical_platform.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class TechnicalPlatform:
    """技术平台主类"""
    
    def __init__(self):
        self.analytics_service = AnalyticsService()
        self.monitoring_service = MonitoringService()
        self.implementation_tracker = ImplementationTracker()
        self.running = False
        
    async def initialize_platform(self):
        """初始化平台"""
        logger.info("开始初始化技术平台...")
        
        try:
            # 初始化数据库
            logger.info("初始化数据库...")
            init_db()
            db_status = test_connection()
            if db_status["status"] != "success":
                raise Exception(f"数据库初始化失败: {db_status['message']}")
            
            logger.info("数据库初始化成功")
            
            # 创建必要的目录
            logger.info("创建目录结构...")
            os.makedirs("data/raw", exist_ok=True)
            os.makedirs("data/processed", exist_ok=True)
            os.makedirs("data/analysis", exist_ok=True)
            os.makedirs("data/reports", exist_ok=True)
            os.makedirs("logs", exist_ok=True)
            
            logger.info("目录结构创建完成")
            
            # 初始化实施跟踪
            logger.info("初始化实施跟踪系统...")
            self.implementation_tracker.start_implementation_tracking("品宣部门", ImplementationPhase.PREPARATION)
            
            logger.info("技术平台初始化完成")
            return True
            
        except Exception as e:
            logger.error(f"技术平台初始化失败: {e}")
            return False
    
    async def start_pilot_implementation(self):
        """启动试点实施"""
        logger.info("启动试点实施...")
        
        try:
            # 更新准备阶段进度
            metrics = [
                self.implementation_tracker.ImplementationMetric(
                    "部门需求调研完成率", 100, "%", 100, "completed", datetime.now()
                ),
                self.implementation_tracker.ImplementationMetric(
                    "基线数据收集完成率", 80, "%", 100, "in_progress", datetime.now()
                ),
                self.implementation_tracker.ImplementationMetric(
                    "技术环境准备完成率", 60, "%", 100, "in_progress", datetime.now()
                )
            ]
            
            self.implementation_tracker.update_implementation_progress(
                "品宣部门", ImplementationPhase.PREPARATION, 80, metrics
            )
            
            logger.info("品宣部门准备阶段进度已更新")
            
            # 记录一些常见问题
            self.implementation_tracker.record_implementation_issue(
                "品宣部门", ImplementationPhase.PREPARATION,
                "系统集成", "AI工具账户创建延迟", "medium"
            )
            
            self.implementation_tracker.record_implementation_issue(
                "品宣部门", ImplementationPhase.PREPARATION,
                "用户培训", "部分员工对AI工具使用不熟悉", "low"
            )
            
            logger.info("问题记录已添加")
            
            # 启动数据收集服务
            logger.info("启动数据收集服务...")
            await self.start_data_collection_service()
            
            # 启动监控服务
            logger.info("启动监控服务...")
            await self.start_monitoring_service()
            
            logger.info("试点实施启动完成")
            return True
            
        except Exception as e:
            logger.error(f"试点实施启动失败: {e}")
            return False
    
    async def start_data_collection_service(self):
        """启动数据收集服务"""
        logger.info("启动数据收集服务...")
        
        try:
            # 模拟数据收集
            mock_data = [
                {
                    "user_id": "user001",
                    "tool_name": "GPT-4",
                    "action_type": "文本生成",
                    "duration": 45.2,
                    "success": True,
                    "metadata": {"topic": "文案创作", "words": 500}
                },
                {
                    "user_id": "user002",
                    "tool_name": "Midjourney",
                    "action_type": "图像生成",
                    "duration": 120.5,
                    "success": True,
                    "metadata": {"prompt": "产品宣传图", "style": "professional"}
                },
                {
                    "user_id": "user003",
                    "tool_name": "Claude",
                    "action_type": "内容优化",
                    "duration": 30.8,
                    "success": False,
                    "error_message": "API响应超时",
                    "metadata": {"task": "文案润色", "retry_count": 3}
                }
            ]
            
            # 保存模拟数据
            import pandas as pd
            df = pd.DataFrame(mock_data)
            
            # 保存为CSV文件
            csv_file = f"data/raw/usage_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            df.to_csv(csv_file, index=False, encoding='utf-8')
            
            logger.info(f"模拟数据已保存: {csv_file}")
            
            # 生成基础分析报告
            await self.generate_initial_reports()
            
            return True
            
        except Exception as e:
            logger.error(f"数据收集服务启动失败: {e}")
            return False
    
    async def start_monitoring_service(self):
        """启动监控服务"""
        logger.info("启动监控服务...")
        
        try:
            # 启动监控任务
            asyncio.create_task(self.monitoring_service.start_monitoring())
            
            # 设置定期检查
            asyncio.create_task(self定期健康检查())
            
            logger.info("监控服务已启动")
            return True
            
        except Exception as e:
            logger.error(f"监控服务启动失败: {e}")
            return False
    
    async def generate_initial_reports(self):
        """生成初始报告"""
        logger.info("生成初始分析报告...")
        
        try:
            # 生成使用情况报告
            usage_report = await self.analytics_service.generate_usage_report({
                "type": "comprehensive",
                "department": "品宣部门",
                "start_date": (datetime.now() - datetime.timedelta(days=7)).isoformat(),
                "end_date": datetime.now().isoformat()
            })
            
            # 保存报告
            report_file = f"data/reports/usage_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(usage_report, f, indent=2, ensure_ascii=False, default=str)
            
            logger.info(f"使用情况报告已生成: {report_file}")
            
            # 生成实施数据报告
            implementation_report = self.implementation_tracker.generate_implementation_report(
                "品宣部门", ImplementationPhase.PREPARATION
            )
            
            # 保存实施报告
            impl_report_file = f"data/reports/implementation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(impl_report_file, 'w', encoding='utf-8') as f:
                json.dump(implementation_report, f, indent=2, ensure_ascii=False, default=str)
            
            logger.info(f"实施数据报告已生成: {impl_report_file}")
            
            return True
            
        except Exception as e:
            logger.error(f"生成初始报告失败: {e}")
            return False
    
    async def 定期健康检查(self):
        """定期健康检查"""
        while self.running:
            try:
                # 检查数据库连接
                db_status = test_connection()
                if db_status["status"] != "success":
                    logger.error(f"数据库连接异常: {db_status['message']}")
                
                # 检查数据文件
                data_dir = Path("data/raw")
                if not data_dir.exists():
                    logger.warning("数据目录不存在")
                
                # 检查日志文件
                log_file = Path("logs/technical_platform.log")
                if log_file.exists() and log_file.stat().st_size > 10 * 1024 * 1024:  # 10MB
                    logger.warning("日志文件过大，可能需要清理")
                
                await asyncio.sleep(300)  # 5分钟检查一次
                
            except Exception as e:
                logger.error(f"健康检查失败: {e}")
                await asyncio.sleep(60)  # 出错后等待1分钟
    
    async def stop_platform(self):
        """停止平台"""
        logger.info("正在停止技术平台...")
        
        self.running = False
        
        # 停止监控服务
        await self.monitoring_service.stop_monitoring()
        
        # 生成最终报告
        await self.generate_final_report()
        
        logger.info("技术平台已停止")
    
    async def generate_final_report(self):
        """生成最终报告"""
        logger.info("生成最终实施报告...")
        
        try:
            # 生成完整的实施报告
            implementation_report = self.implementation_tracker.generate_implementation_report(
                "品宣部门", ImplementationPhase.PREPARATION
            )
            
            # 生成进度报告
            progress_report_file = self.implementation_tracker.generate_progress_report("品宣部门")
            
            logger.info(f"最终实施报告已生成: {progress_report_file}")
            
            return True
            
        except Exception as e:
            logger.error(f"生成最终报告失败: {e}")
            return False
    
    async def run(self):
        """运行技术平台"""
        logger.info("开始运行技术平台...")
        
        try:
            # 初始化平台
            if not await self.initialize_platform():
                raise Exception("平台初始化失败")
            
            # 启动试点实施
            if not await self.start_pilot_implementation():
                raise Exception("试点实施启动失败")
            
            self.running = True
            logger.info("技术平台运行成功！")
            
            # 保持运行状态
            while self.running:
                await asyncio.sleep(60)  # 每分钟检查一次
                
        except Exception as e:
            logger.error(f"技术平台运行失败: {e}")
            await self.stop_platform()
            raise
        finally:
            await self.stop_platform()

def main():
    """主函数"""
    print("=" * 60)
    print("AIGC培训效果追踪系统 - 技术平台")
    print("=" * 60)
    print(f"启动时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    platform = TechnicalPlatform()
    
    try:
        asyncio.run(platform.run())
    except KeyboardInterrupt:
        print("\n接收到中断信号，正在停止平台...")
        asyncio.run(platform.stop_platform())
    except Exception as e:
        logger.error(f"平台运行失败: {e}")
        sys.exit(1)
    
    print("=" * 60)
    print("技术平台已停止")
    print("=" * 60)

if __name__ == "__main__":
    main()