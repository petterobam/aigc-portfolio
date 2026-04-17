<template>
  <div class="real-time-dashboard">
    <div class="dashboard-header">
      <h1>AIGC培训效果实时监控看板</h1>
      <div class="header-controls">
        <button @click="refreshData" class="refresh-btn">
          <span>🔄</span> 刷新
        </button>
        <button @click="exportData" class="export-btn">
          <span>📊</span> 导出
        </button>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- 关键指标卡片 -->
      <div class="metrics-grid">
        <MetricCard 
          v-for="metric in keyMetrics" 
          :key="metric.id"
          :title="metric.title"
          :value="metric.value"
          :unit="metric.unit"
          :trend="metric.trend"
          :icon="metric.icon"
          :loading="metric.loading"
          @click="showMetricDetail(metric)"
        />
      </div>
      
      <!-- 使用趋势图 -->
      <div class="chart-container large">
        <ChartCard title="使用趋势分析">
          <UsageTrendChart :data="usageTrendData" :loading="trendLoading" />
        </ChartCard>
      </div>
      
      <!-- 部门性能对比 -->
      <div class="chart-container medium">
        <ChartCard title="部门绩效对比">
          <DepartmentPerformanceChart :data="departmentPerformance" :loading="performanceLoading" />
        </ChartCard>
      </div>
      
      <!-- 质量指标 -->
      <div class="chart-container medium">
        <ChartCard title="质量指标监控">
          <QualityMetricsChart :data="qualityMetrics" :loading="qualityLoading" />
        </ChartCard>
      </div>
      
      <!-- 实时预警 -->
      <div class="alerts-container">
        <AlertPanel :alerts="activeAlerts" :loading="alertsLoading" @alert-action="handleAlertAction" />
      </div>
      
      <!-- 系统状态 -->
      <div class="system-status">
        <ChartCard title="系统状态">
          <SystemStatus :status="systemStatus" :loading="systemLoading" />
        </ChartCard>
      </div>
      
      <!-- 最近活动 -->
      <div class="recent-activity">
        <ChartCard title="最近活动">
          <RecentActivity :activities="recentActivities" :loading="activityLoading" />
        </ChartCard>
      </div>
    </div>

    <!-- 指标详情弹窗 -->
    <MetricDetailModal 
      v-if="selectedMetric"
      :metric="selectedMetric"
      :historical-data="historicalData"
      @close="selectedMetric = null"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useToast } from 'vue-toastification';
import { storeToRefs } from 'pinia';
import { useAnalyticsStore } from '../stores/analytics';
import { useMonitoringStore } from '../stores/monitoring';

// 组件导入
import MetricCard from './MetricCard.vue';
import ChartCard from './ChartCard.vue';
import UsageTrendChart from './charts/UsageTrendChart.vue';
import DepartmentPerformanceChart from './charts/DepartmentPerformanceChart.vue';
import QualityMetricsChart from './charts/QualityMetricsChart.vue';
import AlertPanel from './AlertPanel.vue';
import SystemStatus from './SystemStatus.vue';
import RecentActivity from './RecentActivity.vue';
import MetricDetailModal from './modals/MetricDetailModal.vue';

export default {
  name: 'RealTimeDashboard',
  components: {
    MetricCard,
    ChartCard,
    UsageTrendChart,
    DepartmentPerformanceChart,
    QualityMetricsChart,
    AlertPanel,
    SystemStatus,
    RecentActivity,
    MetricDetailModal
  },
  
  setup() {
    const toast = useToast();
    const analyticsStore = useAnalyticsStore();
    const monitoringStore = useMonitoringStore();
    
    // 响应式状态
    const selectedMetric = ref(null);
    const trendLoading = ref(false);
    const performanceLoading = ref(false);
    const qualityLoading = ref(false);
    const alertsLoading = ref(false);
    const systemLoading = ref(false);
    const activityLoading = ref(false);
    const historicalData = ref({});
    
    // 关键指标
    const keyMetrics = ref([
      {
        id: 'daily_active_users',
        title: '日活跃用户',
        value: 0,
        unit: '人',
        trend: 'up',
        icon: '👥',
        loading: false
      },
      {
        id: 'success_rate',
        title: '任务成功率',
        value: 0,
        unit: '%',
        trend: 'up',
        icon: '✅',
        loading: false
      },
      {
        id: 'efficiency_improvement',
        title: '效率提升',
        value: 0,
        unit: 'x',
        trend: 'up',
        icon: '🚀',
        loading: false
      },
      {
        id: 'roi',
        title: '投资回报率',
        value: 0,
        unit: '%',
        trend: 'up',
        icon: '💰',
        loading: false
      }
    ]);
    
    // 图表数据
    const usageTrendData = ref([]);
    const departmentPerformance = ref([]);
    const qualityMetrics = ref([]);
    const activeAlerts = ref([]);
    const systemStatus = ref({});
    const recentActivities = ref([]);
    
    // WebSocket连接
    let socket = null;
    let updateInterval = null;
    
    // 初始化WebSocket连接
    const initWebSocket = () => {
      try {
        socket = new WebSocket('ws://localhost:8000/ws/realtime');
        
        socket.onopen = () => {
          console.log('WebSocket连接已建立');
          startDataUpdates();
        };
        
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          updateDashboard(data);
        };
        
        socket.onerror = (error) => {
          console.error('WebSocket错误:', error);
          toast.error('连接服务器失败');
        };
        
        socket.onclose = () => {
          console.log('WebSocket连接已关闭');
          // 5秒后重连
          setTimeout(initWebSocket, 5000);
        };
      } catch (error) {
        console.error('WebSocket初始化失败:', error);
      }
    };
    
    // 开始数据更新
    const startDataUpdates = () => {
      // 每秒更新一次实时数据
      updateInterval = setInterval(() => {
        fetchLatestData();
      }, 1000);
    };
    
    // 获取最新数据
    const fetchLatestData = async () => {
      try {
        const [metrics, trends, performance, quality, alerts, system, activity] = await Promise.all([
          analyticsStore.getLatestMetrics(),
          analyticsStore.getUsageTrends(),
          analyticsStore.getDepartmentPerformance(),
          analyticsStore.getQualityMetrics(),
          monitoringStore.getActiveAlerts(),
          monitoringStore.getSystemStatus(),
          monitoringStore.getRecentActivities()
        ]);
        
        updateDashboard({
          metrics,
          trends,
          performance,
          quality,
          alerts,
          system,
          activity
        });
      } catch (error) {
        console.error('获取数据失败:', error);
      }
    };
    
    // 更新看板
    const updateDashboard = (data) => {
      // 更新关键指标
      if (data.metrics) {
        keyMetrics.value = keyMetrics.value.map(metric => {
          const value = data.metrics[metric.id];
          return {
            ...metric,
            value: value !== undefined ? value : metric.value,
            loading: false
          };
        });
      }
      
      // 更新趋势数据
      if (data.trends) {
        usageTrendData.value = data.trends;
      }
      
      // 更新部门性能
      if (data.performance) {
        departmentPerformance.value = data.performance;
      }
      
      // 更新质量指标
      if (data.quality) {
        qualityMetrics.value = data.quality;
      }
      
      // 更新预警
      if (data.alerts) {
        activeAlerts.value = data.alerts;
      }
      
      // 更新系统状态
      if (data.system) {
        systemStatus.value = data.system;
      }
      
      // 更新最近活动
      if (data.activity) {
        recentActivities.value = data.activity;
      }
    };
    
    // 刷新数据
    const refreshData = async () => {
      // 重置加载状态
      resetLoadingStates();
      
      try {
        await fetchLatestData();
        toast.success('数据刷新成功');
      } catch (error) {
        toast.error('数据刷新失败');
      }
    };
    
    // 导出数据
    const exportData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/reports/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'comprehensive_report',
            format: 'excel'
          })
        });
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aigc_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('数据导出成功');
      } catch (error) {
        toast.error('数据导出失败');
      }
    };
    
    // 显示指标详情
    const showMetricDetail = async (metric) => {
      selectedMetric.value = metric;
      
      try {
        // 获取历史数据
        historicalData.value = await analyticsStore.getHistoricalData(metric.id);
      } catch (error) {
        console.error('获取历史数据失败:', error);
      }
    };
    
    // 处理预警操作
    const handleAlertAction = async (action, alert) => {
      try {
        if (action === 'resolve') {
          await monitoringStore.resolveAlert(alert.id);
          toast.success('预警已解决');
        } else if (action === 'dismiss') {
          await monitoringStore.dismissAlert(alert.id);
          toast.success('预警已忽略');
        }
      } catch (error) {
        toast.error('操作失败');
      }
    };
    
    // 重置加载状态
    const resetLoadingStates = () => {
      keyMetrics.value.forEach(metric => metric.loading = false);
      trendLoading.value = false;
      performanceLoading.value = false;
      qualityLoading.value = false;
      alertsLoading.value = false;
      systemLoading.value = false;
      activityLoading.value = false;
    };
    
    // 组件挂载时初始化
    onMounted(() => {
      initWebSocket();
      refreshData();
    });
    
    // 组件卸载时清理
    onUnmounted(() => {
      if (socket) {
        socket.close();
      }
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    });
    
    return {
      keyMetrics,
      usageTrendData,
      departmentPerformance,
      qualityMetrics,
      activeAlerts,
      systemStatus,
      recentActivities,
      selectedMetric,
      historicalData,
      trendLoading,
      performanceLoading,
      qualityLoading,
      alertsLoading,
      systemLoading,
      activityLoading,
      refreshData,
      exportData,
      showMetricDetail,
      handleAlertAction
    };
  }
};
</script>

<style scoped>
.real-time-dashboard {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.dashboard-header h1 {
  margin: 0;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.header-controls {
  display: flex;
  gap: 10px;
}

.refresh-btn, .export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #4F46E5;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover, .export-btn:hover {
  background: #4338CA;
  transform: translateY(-2px);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.metrics-grid {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.chart-container {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}

.chart-container.large {
  grid-column: span 2;
}

.chart-container.medium {
  grid-column: span 1;
}

.alerts-container, .system-status, .recent-activity {
  grid-column: span 1;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-container.large {
    grid-column: span 1;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
}
</style>