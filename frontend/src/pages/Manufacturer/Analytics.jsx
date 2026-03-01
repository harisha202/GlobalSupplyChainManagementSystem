import AreaChart from '../../components/charts/AreaChart'
import BarChart from '../../components/charts/BarChart'
import LineChart from '../../components/charts/LineChart'

function toChartSeries(series = []) {
  if (!Array.isArray(series) || !series.length) {
    return []
  }

  if (typeof series[0] === 'object') {
    return series.map((item, index) => ({
      label: item.label || `Point ${index + 1}`,
      value: Number(item.value || 0),
    }))
  }

  return series.map((value, index) => ({
    label: `Point ${index + 1}`,
    value: Number(value || 0),
  }))
}

function Analytics({ forecastSeries = [], batches = [], analyticsData = {} }) {
  const forecastChartData = toChartSeries(
    analyticsData.forecastSeries?.length ? analyticsData.forecastSeries : forecastSeries,
  )
  const efficiencyData = toChartSeries(analyticsData.efficiencyTrend)
  const defectData = toChartSeries(analyticsData.defectTrend)
  const categoryProduction = toChartSeries(analyticsData.categoryProduction)

  const totalOutputFallback = batches.reduce((sum, row) => sum + Number(row.quantity || 0), 0)

  const analyticsStats = {
    avgEfficiency: analyticsData.stats?.avgEfficiency || '0%',
    avgDefectRate: analyticsData.stats?.avgDefectRate || '0%',
    totalOutput: analyticsData.stats?.totalOutput || totalOutputFallback || 0,
    forecast:
      analyticsData.stats?.forecastNext ||
      forecastChartData[forecastChartData.length - 1]?.value ||
      0,
  }

  return (
    <div className="analytics-container">
      <div className="analytics-stats-grid">
        <div className="stat-card">
          <span className="stat-label">Avg Efficiency</span>
          <span className="stat-value">{analyticsStats.avgEfficiency}</span>
          <span className="stat-trend neutral">Live</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg Defect Rate</span>
          <span className="stat-value">{analyticsStats.avgDefectRate}</span>
          <span className="stat-trend neutral">Live</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Output</span>
          <span className="stat-value">{analyticsStats.totalOutput}</span>
          <span className="stat-trend neutral">Live</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">AI Forecast Next</span>
          <span className="stat-value">{analyticsStats.forecast}</span>
          <span className="stat-trend neutral">Predicted</span>
        </div>
      </div>

      <div className="analytics-charts-grid">
        <div className="card chart-large">
          <h4 className="card-title">AI Production Forecast</h4>
          <AreaChart data={forecastChartData} color="#0ea5e9" />
          <p className="chart-note">Forecast uses backend production history and trend prediction.</p>
        </div>

        <div className="card">
          <h4 className="card-title">Production Efficiency (%)</h4>
          <LineChart data={efficiencyData} color="#22c55e" />
        </div>

        <div className="card">
          <h4 className="card-title">Defect Rate Trend (%)</h4>
          <LineChart data={defectData} color="#ef4444" />
        </div>

        <div className="card">
          <h4 className="card-title">Production by Category</h4>
          <BarChart data={categoryProduction} color="#a855f7" />
        </div>
      </div>

      <div className="card insights-card">
        <h4 className="card-title">Key Insights</h4>
        <div className="insights-grid">
          <div className="insight-item">
            <div className="insight-icon insight-success">OK</div>
            <div className="insight-content">
              <h5>Efficiency Tracking</h5>
              <p>Efficiency trend is generated from live manufacturer analytics.</p>
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-icon insight-success">OK</div>
            <div className="insight-content">
              <h5>Defect Monitoring</h5>
              <p>Defect rate reflects backend-calculated quality trend values.</p>
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-icon insight-info">i</div>
            <div className="insight-content">
              <h5>AI Forecast Active</h5>
              <p>Forecasted next cycle output: {analyticsStats.forecast} units.</p>
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-icon insight-warning">!</div>
            <div className="insight-content">
              <h5>Category Mix</h5>
              <p>Category output is mapped directly from backend production totals.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
