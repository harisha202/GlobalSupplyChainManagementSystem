import AreaChart from '../../components/charts/AreaChart'
import LineChart from '../../components/charts/LineChart'
import StatusDonut from '../../components/charts/StatusDonut'
import { normalizeAnalyticsPayload } from './shipmentUtils'

function Analytics({ shipments = {}, analyticsData = {}, timeRange = '7d' }) {
  const normalizedAnalytics = normalizeAnalyticsPayload(analyticsData, shipments, timeRange)
  const deliveryTrends = normalizedAnalytics.deliveryTrends || []
  const statusData = normalizedAnalytics.statusData || []
  const forecast = normalizedAnalytics.forecast || { today: 0, projected: 0, trend: '+0%', series: [] }

  return (
    <section className="analytics-container">
      <div className="analytics-grid">
        <div className="card">
          <h4 className="card-title">Delivery Trends</h4>
          <AreaChart data={deliveryTrends} color="#0ea5e9" />
        </div>

        <div className="card">
          <h4 className="card-title">Fleet Status Distribution</h4>
          <StatusDonut data={statusData} />
        </div>

        <div className="card forecast-card">
          <h4 className="card-title">Delivery Forecast</h4>
          <div className="forecast-chart-wrap">
            <LineChart data={forecast.series || []} color="#22a5c5" />
          </div>
          <div className="forecast-content">
            <div className="forecast-stat">
              <span className="forecast-label">Today</span>
              <span className="forecast-value">{forecast.today ?? 0}</span>
            </div>
            <div className="forecast-stat">
              <span className="forecast-label">Projected</span>
              <span className="forecast-value">{forecast.projected ?? 0}</span>
            </div>
            <div className="forecast-stat">
              <span className="forecast-label">Trend</span>
              <span className="forecast-value trend-positive">{forecast.trend ?? '+0%'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Analytics
