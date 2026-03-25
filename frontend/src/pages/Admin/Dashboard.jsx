import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '../../api/axiosInstance'
import AreaChart from '../../components/charts/AreaChart'
import PieChart from '../../components/charts/PieChart'
import Loader from '../../components/common/Loader'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { formatINR } from '../../utils/currency'
import './admin.css'

const LIVE_REFRESH_MS = 15000

function AdminDashboard({ user, onLogout, onNavigate, currentPath }) {
  const [summary, setSummary] = useState({
    total_users: 0,
    total_products: 0,
    total_batches: 0,
    active_shipments: 0,
    revenue: 0,
  })
  const [forecast, setForecast] = useState([42, 46, 52, 49, 58, 63])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadAdminData() {
      try {
        const [statsPayload, aiPayload] = await Promise.all([
          adminApi.stats(),
          adminApi.aiForecast('120,128,134,140,155,162', 4),
        ])
        if (mounted) {
          setSummary(statsPayload)
          setForecast(aiPayload?.forecast ?? [])
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadAdminData()
    const intervalId = setInterval(loadAdminData, LIVE_REFRESH_MS)
    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [])

  const stats = useMemo(
    () => [
      { label: 'Total Users', value: summary.total_users, trend: 'Live backend' },
      { label: 'Total Products', value: summary.total_products, trend: 'Live backend' },
      { label: 'Total Batches', value: summary.total_batches, trend: 'Live backend' },
      { label: 'Active Shipments', value: summary.active_shipments, trend: 'Live backend' },
      { label: 'Revenue', value: formatINR(summary.revenue, { minimumFractionDigits: 0, maximumFractionDigits: 2 }), trend: 'Computed backend' },
    ],
    [summary],
  )

  return (
    <DashboardLayout
      role="Admin"
      userName={user?.name}
      onLogout={onLogout}
      onNavigate={onNavigate}
      currentPath={currentPath}
      stats={stats}
      notifications={3}
    >
      {/* Navigation Tabs */}
      <section style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr' }}>
        {isLoading ? (
          <Loader label="Loading admin and AI data..." />
        ) : (
          <AreaChart title="System Throughput Forecast" data={forecast} />
        )}
        <PieChart
          title="User Distribution"
          data={[
            { label: 'Manufacturers', value: 20, color: '#0ea5e9' },
            { label: 'Transporters', value: 18, color: '#f97316' },
            { label: 'Dealers', value: 14, color: '#22c55e' },
            { label: 'Retail', value: 12, color: '#64748b' },
          ]}
        />
      </section>
    </DashboardLayout>
  )
}

export default AdminDashboard
