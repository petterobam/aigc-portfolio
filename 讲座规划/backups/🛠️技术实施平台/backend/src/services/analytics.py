from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from ..models.database import User, UsageLog, LearningRecord, PerformanceMetric, Course, Department
import pandas as pd
import numpy as np

class AnalyticsService:
    """数据分析服务"""
    
    def __init__(self):
        self.data_cache = {}
        self.cache_expiry = 300  # 5分钟缓存
        
    async def get_usage_trends(self, department: str = None, tool: str = None, db: Session = None) -> Dict[str, Any]:
        """获取使用趋势分析"""
        cache_key = f"usage_trends_{department}_{tool}"
        
        # 检查缓存
        if cache_key in self.data_cache:
            cache_data = self.data_cache[cache_key]
            if (datetime.now() - cache_data['timestamp']).seconds < self.cache_expiry:
                return cache_data['data']
        
        # 构建查询
        query = db.query(UsageLog)
        
        if department:
            query = query.join(User).filter(User.department == department)
        
        if tool:
            query = query.filter(UsageLog.tool_name == tool)
        
        # 获取最近30天的数据
        start_date = datetime.now() - timedelta(days=30)
        query = query.filter(UsageLog.timestamp >= start_date)
        
        logs = query.all()
        
        # 转换为DataFrame进行分析
        df = pd.DataFrame([
            {
                'timestamp': log.timestamp,
                'user_id': log.user_id,
                'tool_name': log.tool_name,
                'action_type': log.action_type,
                'duration': log.duration,
                'success': log.success
            }
            for log in logs
        ])
        
        if df.empty:
            return {"error": "No data available"}
        
        # 分析数据
        analysis = {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": datetime.now().isoformat(),
                "total_days": 30
            },
            "overview": {
                "total_actions": len(df),
                "unique_users": df['user_id'].nunique(),
                "unique_tools": df['tool_name'].nunique(),
                "success_rate": (df['success'].sum() / len(df)) * 100,
                "average_duration": df['duration'].mean(),
                "total_duration": df['duration'].sum()
            },
            "trends": {
                "daily": self._calculate_daily_trends(df),
                "hourly": self._calculate_hourly_trends(df),
                "tool_distribution": self._calculate_tool_distribution(df),
                "action_distribution": self._calculate_action_distribution(df)
            },
            "patterns": {
                "peak_hours": self._find_peak_hours(df),
                "peak_days": self._find_peak_days(df),
                "user_behavior": self._analyze_user_behavior(df)
            }
        }
        
        # 缓存结果
        self.data_cache[cache_key] = {
            'data': analysis,
            'timestamp': datetime.now()
        }
        
        return analysis
    
    def _calculate_daily_trends(self, df: pd.DataFrame) -> Dict[str, Any]:
        """计算每日趋势"""
        df['date'] = df['timestamp'].dt.date
        daily_stats = df.groupby('date').agg({
            'user_id': 'nunique',
            'action_type': 'count',
            'success': 'mean',
            'duration': 'mean'
        }).reset_index()
        
        return {
            "dates": daily_stats['date'].tolist(),
            "active_users": daily_stats['user_id'].tolist(),
            "total_actions": daily_stats['action_type'].tolist(),
            "success_rate": (daily_stats['success'] * 100).tolist(),
            "avg_duration": daily_stats['duration'].tolist()
        }
    
    def _calculate_hourly_trends(self, df: pd.DataFrame) -> Dict[str, Any]:
        """计算每小时趋势"""
        df['hour'] = df['timestamp'].dt.hour
        hourly_stats = df.groupby('hour').agg({
            'user_id': 'nunique',
            'action_type': 'count',
            'success': 'mean',
            'duration': 'mean'
        }).reset_index()
        
        return {
            "hours": hourly_stats['hour'].tolist(),
            "active_users": hourly_stats['user_id'].tolist(),
            "total_actions": hourly_stats['action_type'].tolist(),
            "success_rate": (hourly_stats['success'] * 100).tolist(),
            "avg_duration": hourly_stats['duration'].tolist()
        }
    
    def _calculate_tool_distribution(self, df: pd.DataFrame) -> Dict[str, Any]:
        """计算工具分布"""
        tool_stats = df.groupby('tool_name').agg({
            'action_type': 'count',
            'success': 'mean',
            'duration': 'mean'
        }).reset_index()
        
        return {
            "tools": tool_stats['tool_name'].tolist(),
            "usage_count": tool_stats['action_type'].tolist(),
            "success_rate": (tool_stats['success'] * 100).tolist(),
            "avg_duration": tool_stats['duration'].tolist()
        }
    
    def _calculate_action_distribution(self, df: pd.DataFrame) -> Dict[str, Any]:
        """计算动作分布"""
        action_stats = df.groupby('action_type').agg({
            'action_type': 'count',
            'success': 'mean'
        }).rename(columns={'action_type': 'count'}).reset_index()
        
        return {
            "actions": action_stats['action_type'].tolist(),
            "count": action_stats['count'].tolist(),
            "success_rate": (action_stats['success'] * 100).tolist()
        }
    
    def _find_peak_hours(self, df: pd.DataFrame) -> List[int]:
        """找出高峰时段"""
        hourly_counts = df.groupby(df['timestamp'].dt.hour).size()
        return hourly_counts.nlargest(3).index.tolist()
    
    def _find_peak_days(self, df: pd.DataFrame) -> List[str]:
        """找出高峰日期"""
        daily_counts = df.groupby(df['timestamp'].dt.date).size()
        return daily_counts.nlargest(3).index.astype(str).tolist()
    
    def _analyze_user_behavior(self, df: pd.DataFrame) -> Dict[str, Any]:
        """分析用户行为"""
        user_stats = df.groupby('user_id').agg({
            'action_type': 'count',
            'success': 'mean',
            'duration': 'sum',
            'tool_name': 'nunique'
        }).reset_index()
        
        return {
            "total_users": len(user_stats),
            "active_users": len(user_stats[user_stats['action_type'] >= 10]),
            "power_users": len(user_stats[user_stats['action_type'] >= 50]),
            "avg_actions_per_user": user_stats['action_type'].mean(),
            "avg_session_duration": user_stats['duration'].mean(),
            "tool_diversity": user_stats['tool_name'].mean()
        }
    
    async def get_performance_metrics(self, department: str = None, db: Session = None) -> Dict[str, Any]:
        """获取绩效指标"""
        cache_key = f"performance_metrics_{department}"
        
        # 检查缓存
        if cache_key in self.data_cache:
            cache_data = self.data_cache[cache_key]
            if (datetime.now() - cache_data['timestamp']).seconds < self.cache_expiry:
                return cache_data['data']
        
        # 构建查询
        query = db.query(PerformanceMetric)
        
        if department:
            query = query.join(User).filter(User.department == department)
        
        # 获取最近30天的数据
        start_date = datetime.now() - timedelta(days=30)
        query = query.filter(PerformanceMetric.measurement_date >= start_date)
        
        metrics = query.all()
        
        if not metrics:
            return {"error": "No performance data available"}
        
        # 转换为DataFrame
        df = pd.DataFrame([
            {
                'user_id': metric.user_id,
                'metric_type': metric.metric_type,
                'value': metric.value,
                'measurement_date': metric.measurement_date,
                'baseline_value': metric.baseline_value,
                'improvement': metric.improvement
            }
            for metric in metrics
        ])
        
        # 分析数据
        analysis = {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": datetime.now().isoformat(),
                "total_days": 30
            },
            "overview": {
                "total_metrics": len(df),
                "unique_users": df['user_id'].nunique(),
                "metric_types": df['metric_type'].unique().tolist(),
                "average_improvement": df['improvement'].mean() if df['improvement'].notna().any() else 0
            },
            "by_type": self._analyze_metrics_by_type(df),
            "by_user": self._analyze_metrics_by_user(df),
            "trends": self._analyze_performance_trends(df)
        }
        
        # 缓存结果
        self.data_cache[cache_key] = {
            'data': analysis,
            'timestamp': datetime.now()
        }
        
        return analysis
    
    def _analyze_metrics_by_type(self, df: pd.DataFrame) -> Dict[str, Any]:
        """按类型分析指标"""
        type_stats = df.groupby('metric_type').agg({
            'value': 'mean',
            'improvement': 'mean',
            'user_id': 'nunique'
        }).reset_index()
        
        return {
            "metric_types": type_stats['metric_type'].tolist(),
            "average_values": type_stats['value'].tolist(),
            "average_improvement": type_stats['improvement'].tolist(),
            "unique_users": type_stats['user_id'].tolist()
        }
    
    def _analyze_metrics_by_user(self, df: pd.DataFrame) -> Dict[str, Any]:
        """按用户分析指标"""
        user_stats = df.groupby('user_id').agg({
            'value': 'mean',
            'improvement': 'mean',
            'metric_type': 'nunique'
        }).reset_index()
        
        return {
            "total_users": len(user_stats),
            "top_performers": user_stats.nlargest(5, 'value')['user_id'].tolist(),
            "improvement_leaders": user_stats.nlargest(5, 'improvement')['user_id'].tolist(),
            "avg_metrics_per_user": user_stats['metric_type'].mean()
        }
    
    def _analyze_performance_trends(self, df: pd.DataFrame) -> Dict[str, Any]:
        """分析绩效趋势"""
        df['date'] = df['measurement_date'].dt.date
        daily_stats = df.groupby('date').agg({
            'value': 'mean',
            'improvement': 'mean'
        }).reset_index()
        
        return {
            "dates": daily_stats['date'].astype(str).tolist(),
            "average_values": daily_stats['value'].tolist(),
            "average_improvement": daily_stats['improvement'].tolist()
        }
    
    async def get_roi_analysis(self, department: str = None, db: Session = None) -> Dict[str, Any]:
        """获取ROI分析"""
        cache_key = f"roi_analysis_{department}"
        
        # 检查缓存
        if cache_key in self.data_cache:
            cache_data = self.data_cache[cache_key]
            if (datetime.now() - cache_data['timestamp']).seconds < self.cache_expiry:
                return cache_data['data']
        
        # 计算投资成本（模拟数据）
        investment_data = {
            "development_cost": 500000,  # 开发成本
            "training_cost": 200000,     # 培训成本
            "maintenance_cost": 100000,   # 维护成本
            "total_investment": 800000   # 总投资
        }
        
        # 计算收益（基于使用数据）
        usage_data = await self.get_usage_trends(department, None, db)
        if "error" in usage_data:
            return {"error": "无法计算ROI - 没有使用数据"}
        
        # 计算时间节省价值
        time_savings = usage_data.get("overview", {}).get("total_duration", 0) * 50  # 假设每小时价值50元
        
        # 计算效率提升价值
        efficiency_improvement = 2.5  # 假设效率提升2.5倍
        efficiency_value = time_savings * (efficiency_improvement - 1)
        
        # 计算质量提升价值
        quality_improvement = 1.4  # 假设质量提升40%
        quality_value = time_savings * quality_improvement
        
        # 总收益
        total_benefits = time_savings + efficiency_value + quality_value
        
        # ROI计算
        roi = ((total_benefits - investment_data["total_investment"]) / investment_data["total_investment"]) * 100
        
        # 投资回收期
        payback_period = investment_data["total_investment"] / (total_benefits / 365)  # 天
        
        analysis = {
            "investment": investment_data,
            "benefits": {
                "time_savings_value": time_savings,
                "efficiency_improvement_value": efficiency_value,
                "quality_improvement_value": quality_value,
                "total_benefits": total_benefits
            },
            "roi": {
                "percentage": roi,
                "ratio": roi / 100,
                "status": "positive" if roi > 0 else "negative"
            },
            "payback_period": {
                "days": payback_period,
                "years": payback_period / 365,
                "status": "acceptable" if payback_period < 365 * 2 else "needs_review"
            },
            "breakdown": {
                "cost_per_user": investment_data["total_investment"] / usage_data.get("overview", {}).get("unique_users", 1),
                "benefits_per_user": total_benefits / usage_data.get("overview", {}).get("unique_users", 1),
                "roi_per_user": roi
            }
        }
        
        # 缓存结果
        self.data_cache[cache_key] = {
            'data': analysis,
            'timestamp': datetime.now()
        }
        
        return analysis
    
    async def generate_usage_report(self, parameters: dict, db: Session = None) -> Dict[str, Any]:
        """生成使用情况报告"""
        report_type = parameters.get("type", "comprehensive")
        department = parameters.get("department")
        start_date = parameters.get("start_date")
        end_date = parameters.get("end_date")
        
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).isoformat()
        if not end_date:
            end_date = datetime.now().isoformat()
        
        # 获取数据
        usage_data = await self.get_usage_trends(department, None, db)
        
        # 生成报告
        report = {
            "report_id": f"usage_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "type": report_type,
            "generated_at": datetime.now().isoformat(),
            "parameters": parameters,
            "data": usage_data,
            "summary": {
                "total_actions": usage_data.get("overview", {}).get("total_actions", 0),
                "unique_users": usage_data.get("overview", {}).get("unique_users", 0),
                "success_rate": usage_data.get("overview", {}).get("success_rate", 0),
                "average_duration": usage_data.get("overview", {}).get("average_duration", 0),
                "peak_usage_hours": usage_data.get("patterns", {}).get("peak_hours", [])
            },
            "recommendations": self._generate_usage_recommendations(usage_data)
        }
        
        return report
    
    async def generate_performance_report(self, parameters: dict, db: Session = None) -> Dict[str, Any]:
        """生成绩效报告"""
        report_type = parameters.get("type", "comprehensive")
        department = parameters.get("department")
        
        # 获取数据
        performance_data = await self.get_performance_metrics(department, db)
        
        # 生成报告
        report = {
            "report_id": f"performance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "type": report_type,
            "generated_at": datetime.now().isoformat(),
            "parameters": parameters,
            "data": performance_data,
            "summary": {
                "total_metrics": performance_data.get("overview", {}).get("total_metrics", 0),
                "unique_users": performance_data.get("overview", {}).get("unique_users", 0),
                "average_improvement": performance_data.get("overview", {}).get("average_improvement", 0),
                "metric_types": performance_data.get("overview", {}).get("metric_types", [])
            },
            "recommendations": self._generate_performance_recommendations(performance_data)
        }
        
        return report
    
    def _generate_usage_recommendations(self, usage_data: Dict[str, Any]) -> List[str]:
        """生成使用情况建议"""
        recommendations = []
        
        overview = usage_data.get("overview", {})
        trends = usage_data.get("trends", {})
        patterns = usage_data.get("patterns", {})
        
        # 基于成功率的建议
        success_rate = overview.get("success_rate", 0)
        if success_rate < 90:
            recommendations.append("建议提高工具使用成功率，考虑增加培训或优化用户界面")
        
        # 基于使用时长的建议
        avg_duration = overview.get("average_duration", 0)
        if avg_duration > 30:
            recommendations.append("建议简化操作流程，减少使用时长")
        
        # 基于工具分布的建议
        tool_distribution = trends.get("tool_distribution", {})
        if tool_distribution:
            most_used_tool = max(zip(tool_distribution["tools"], tool_distribution["usage_count"]), key=lambda x: x[1])
            recommendations.append(f"最常用工具是 {most_used_tool[0]}，建议优化此工具的用户体验")
        
        # 基于高峰时段的建议
        peak_hours = patterns.get("peak_hours", [])
        if peak_hours:
            recommendations.append(f"高峰时段是 {peak_hours}，建议在这些时段增加技术支持")
        
        return recommendations
    
    def _generate_performance_recommendations(self, performance_data: Dict[str, Any]) -> List[str]:
        """生成绩效建议"""
        recommendations = []
        
        overview = performance_data.get("overview", {})
        by_type = performance_data.get("by_type", {})
        trends = performance_data.get("trends", {})
        
        # 基于改进率的建议
        avg_improvement = overview.get("average_improvement", 0)
        if avg_improvement < 0:
            recommendations.append("绩效改进为负，建议重新评估培训效果和使用方法")
        
        # 基于指标类型的建议
        if by_type:
            for i, metric_type in enumerate(by_type["metric_types"]):
                improvement = by_type["average_improvement"][i]
                if improvement < 0:
                    recommendations.append(f"{metric_type} 指标表现不佳，建议重点关注和改进")
        
        # 基于趋势的建议
        if trends:
            dates = trends.get("dates", [])
            if len(dates) > 7:
                recent_improvement = trends["average_improvement"][-7:]
                if np.mean(recent_improvement) < np.mean(trends["average_improvement"][:-7]):
                    recommendations.append("近期绩效改进放缓，建议加强培训和监控")
        
        return recommendations