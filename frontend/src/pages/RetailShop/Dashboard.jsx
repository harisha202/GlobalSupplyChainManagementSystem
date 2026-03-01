import { useEffect, useState } from 'react'
import { inventoryApi } from '../../api/axiosInstance'
import BlockchainBadge from '../../components/blockchain/BlockchainBadge'
import PieChart from '../../components/charts/PieChart'
import Table from '../../components/common/Table'
import DashboardLayout from '../../components/layout/DashboardLayout'
import POS from './POS'
import Scanner from './Scanner'
import Inventory from './Inventory'
import Sales from './Sales'
import './retail.css'

function RetailShopDashboard({
  user,
  onLogout,
  onNavigate,
  currentPath,
  initialView = 'overview',
}) {
  const [products, setProducts] = useState([])
  const [salesData, setSalesData] = useState([])
  const [activeView, setActiveView] = useState(initialView) // overview, pos, scanner, inventory, sales

  useEffect(() => {
    let mounted = true

    async function loadRetailData() {
      try {
        const data = await inventoryApi.getInventory()
        if (mounted) {
          setProducts(data?.products ?? [])
          setSalesData(data?.sales ?? [])
        }
      } catch (error) {
        console.error('Failed to load retail data:', error)
      }
    }

    loadRetailData()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    setActiveView(initialView)
  }, [initialView])

  const rows = products.slice(0, 6).map((item) => ({
    sku: item.id || item.sku || 'SKU',
    sold: Math.max(0, Math.round(Number(item.stock || 0) * 0.08)),
    stock: Number(item.stock || 0),
    verify: item.verified ? 'Verified' : 'Pending',
  }))

  const lowStockCount = products.filter((item) => String(item.status || '').toLowerCase().includes('low')).length
  const verifiedCount = products.filter((item) => Boolean(item.verified)).length
  const salesToday = salesData.length ? salesData[salesData.length - 1]?.value ?? 0 : 0
  const weeklySales = salesData.reduce((sum, row) => sum + Number(row?.value || 0), 0)
  const stats = [
    { label: 'Store Sales Today', value: `$${Number(salesToday).toLocaleString()}`, trend: 'Live' },
    { label: 'Customer Orders', value: Math.max(0, Math.round(weeklySales / 250)), trend: 'Live' },
    { label: 'Low Stock Alerts', value: lowStockCount, trend: 'Live' },
    { label: 'Verified Products', value: verifiedCount, trend: 'Live' },
    { label: 'Returns', value: 0, trend: 'Live' },
  ]

  const salesMix = rows.map((item, index) => ({
    label: item.sku,
    value: item.sold,
    color: ['#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'][index % 6],
  })).filter((item) => item.value > 0)

  return (
    <DashboardLayout
      role="RetailShop"
      themeClass="retail-theme"
      userName={user?.name}
      onLogout={onLogout}
      onNavigate={onNavigate}
      currentPath={currentPath}
      stats={stats}
      notifications={4}
    >
      {/* Navigation Tabs */}
      {/* Overview View */}
      {activeView === 'overview' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <BlockchainBadge />
          </div>
          <section style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr' }}>
            <Table
              columns={[
                { key: 'sku', label: 'Product' },
                { key: 'sold', label: 'Sold' },
                { key: 'stock', label: 'In Stock' },
                {
                  key: 'verify',
                  label: 'Verification',
                  render: (value) =>
                    value === 'Verified' ? (
                      <BlockchainBadge label="Verified" />
                    ) : (
                      <span>{value}</span>
                    ),
                },
              ]}
              rows={rows}
              emptyMessage="No retail data"
            />
            <PieChart
              title="Sales Mix"
              data={salesMix}
            />
          </section>
        </>
      )}

      {/* POS View */}
      {activeView === 'pos' && <POS products={products} />}

      {/* Scanner View */}
      {activeView === 'scanner' && <Scanner products={products} />}

      {/* Inventory View */}
      {activeView === 'inventory' && <Inventory products={products} />}

      {/* Sales View */}
      {activeView === 'sales' && <Sales salesData={salesData} />}
    </DashboardLayout>
  )
}

export default RetailShopDashboard  
