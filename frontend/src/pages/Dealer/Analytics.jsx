import { useEffect, useMemo, useState } from 'react'
import { dealerApi } from '../../api/axiosInstance'
import AreaChart from '../../components/charts/AreaChart'
import PieChart from '../../components/charts/PieChart'
import StatusDonut from '../../components/charts/StatusDonut'
import Loader from '../../components/common/Loader'
import DashboardLayout from '../../components/layout/DashboardLayout'
import './dealer.css'

function normalizeCategoryData(items = []) {
  return items.map((item, index) => ({
    label: item.label || `Category ${index + 1}`,
    value: Number(item.value || 0),
    color: item.color || ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index % 4],
  }))
}

function normalizeStatusData(items = []) {
  return items.map((item, index) => ({
    label: item.label || `Status ${index + 1}`,
    value: Number(item.value || 0),
    color: item.color || ['#22c55e', '#0ea5e9', '#f59e0b', '#ef4444'][index % 4],
  }))
}

function Analytics({ user, onLogout, onNavigate, currentPath }) {
  const [timeRange, setTimeRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState({
    revenue: [],
    topProducts: [],
    orderStatus: [],
    categoryMix: [],
  })

  useEffect(() => {
    let mounted = true

    async function fetchAnalytics() {
      setLoading(true)
      try {
        const response = await dealerApi.analytics(timeRange)
        if (mounted) {
          setAnalyticsData({
            revenue: Array.isArray(response?.revenue) ? response.revenue : [],
            topProducts: normalizeCategoryData(response?.topProducts || []),
            orderStatus: normalizeStatusData(response?.orderStatus || []),
            categoryMix: normalizeCategoryData(response?.categoryMix || []),
          })
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
        if (mounted) {
          setAnalyticsData({ revenue: [], topProducts: [], orderStatus: [], categoryMix: [] })
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchAnalytics()
    return () => {
      mounted = false
    }
  }, [timeRange])

  const metrics = useMemo(() => {
    const totalRevenue = analyticsData.revenue.reduce((sum, value) => sum + Number(value || 0), 0)
    const totalOrders = analyticsData.orderStatus.reduce((sum, status) => sum + Number(status.value || 0), 0)
    const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0

    const topCategory = [...analyticsData.topProducts].sort((a, b) => b.value - a.value)[0]
    const categoryTotal = analyticsData.topProducts.reduce((sum, category) => sum + category.value, 0)
    const topCategoryShare = categoryTotal > 0 && topCategory ? (topCategory.value / categoryTotal) * 100 : 0

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      topCategory,
      topCategoryShare,
    }
  }, [analyticsData])

  const stats = useMemo(() => [
    {
      label: `Revenue (${timeRange === '7d' ? 'Week' : timeRange === '90d' ? 'Quarter' : 'Month'})`,
      value: `$${Math.round(metrics.totalRevenue).toLocaleString()}`,
      trend: 'Live',
    },
    {
      label: 'Orders',
      value: metrics.totalOrders,
      trend: 'Live',
    },
    {
      label: 'Avg Order Value',
      value: `$${Math.round(metrics.averageOrderValue).toLocaleString()}`,
      trend: 'Live',
    },
    {
      label: 'Top Category Share',
      value: `${metrics.topCategoryShare.toFixed(1)}%`,
      trend: metrics.topCategory?.label || 'N/A',
    },
  ], [metrics, timeRange])

  if (loading) {
    return (
      <DashboardLayout
        role="Dealer"
        themeClass="dealer-theme"
        userName={user?.name}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentPath={currentPath}
        stats={stats}
      >
        <Loader label="Loading analytics..." />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      role="Dealer"
      themeClass="dealer-theme"
      userName={user?.name}
      onLogout={onLogout}
      onNavigate={onNavigate}
      currentPath={currentPath}
      stats={stats}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>Sales Analytics</h2>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Track your wholesale business performance</p>
        </div>
        <div className="dealer-range-selector">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`dealer-range-btn ${timeRange === range ? 'active' : ''}`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      <section style={{ marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Revenue Trend</h3>
          <AreaChart
            title={`Daily Revenue (Last ${timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} Days)`}
            data={analyticsData.revenue}
            height={300}
          />
        </div>
      </section>

      <section style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Top Product Categories</h3>
          <PieChart data={analyticsData.topProducts} height={280} />
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {analyticsData.topProducts.map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color }} />
                  <span style={{ fontSize: 14 }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Order Status Distribution</h3>
          <StatusDonut data={analyticsData.orderStatus} height={280} />
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {analyticsData.orderStatus.map((status) => (
              <div key={status.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: status.color }} />
                  <span>{status.label}</span>
                </div>
                <span style={{ fontWeight: 600 }}>{status.value} orders</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Performance Snapshot</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div style={{ padding: 16, background: '#eff6ff', borderRadius: 8 }}>
              <p style={{ fontSize: 12, color: '#1e40af', margin: '0 0 4px 0', fontWeight: 500 }}>Total Revenue</p>
              <p style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>${Math.round(metrics.totalRevenue).toLocaleString()}</p>
            </div>
            <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8 }}>
              <p style={{ fontSize: 12, color: '#166534', margin: '0 0 4px 0', fontWeight: 500 }}>Total Orders</p>
              <p style={{ fontSize: 24, fontWeight: 'bold', color: '#22c55e', margin: 0 }}>{metrics.totalOrders}</p>
            </div>
            <div style={{ padding: 16, background: '#fefce8', borderRadius: 8 }}>
              <p style={{ fontSize: 12, color: '#854d0e', margin: '0 0 4px 0', fontWeight: 500 }}>Average Order Value</p>
              <p style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>${Math.round(metrics.averageOrderValue).toLocaleString()}</p>
            </div>
            <div style={{ padding: 16, background: '#faf5ff', borderRadius: 8 }}>
              <p style={{ fontSize: 12, color: '#6b21a8', margin: '0 0 4px 0', fontWeight: 500 }}>Top Category</p>
              <p style={{ fontSize: 24, fontWeight: 'bold', color: '#8b5cf6', margin: 0 }}>{metrics.topCategory?.label || '--'}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Category Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {analyticsData.categoryMix.map((category, index) => (
              <div
                key={category.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 12,
                  background: '#f9fafb',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: category.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: 'white',
                    }}
                  >
                    {index + 1}
                  </div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{category.label}</p>
                </div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>{category.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </DashboardLayout>
  )
}

export default Analytics
