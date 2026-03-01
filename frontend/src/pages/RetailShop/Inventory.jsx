import { useState } from 'react'
import Table from '../../components/common/Table'
import BlockchainBadge from '../../components/blockchain/BlockchainBadge'

function Inventory({ products = [] }) {
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')

  const displayInventory = products

  const filteredInventory = displayInventory
    .filter((item) => {
      if (filter === 'all') return true
      if (filter === 'low-stock') return item.status === 'low-stock' || item.status === 'critical'
      if (filter === 'verified') return item.verified
      return true
    })
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'stock') return b.stock - a.stock
      if (sortBy === 'price') return b.price - a.price
      return 0
    })

  const stockStats = {
    total: displayInventory.length,
    inStock: displayInventory.filter((i) => i.status === 'in-stock').length,
    lowStock: displayInventory.filter((i) => i.status === 'low-stock').length,
    critical: displayInventory.filter((i) => i.status === 'critical').length,
  }

  return (
    <div className="inventory-container">
      {/* Inventory Stats */}
      <div className="inventory-stats">
        <div className="stat-card stat-total">
          <span className="stat-value">{stockStats.total}</span>
          <span className="stat-label">Total Products</span>
        </div>
        <div className="stat-card stat-in-stock">
          <span className="stat-value">{stockStats.inStock}</span>
          <span className="stat-label">In Stock</span>
        </div>
        <div className="stat-card stat-low-stock">
          <span className="stat-value">{stockStats.lowStock}</span>
          <span className="stat-label">Low Stock</span>
        </div>
        <div className="stat-card stat-critical">
          <span className="stat-value">{stockStats.critical}</span>
          <span className="stat-label">Critical</span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <div className="inventory-header">
          <h4 className="card-title">Product Inventory</h4>
          <div className="inventory-controls">
            <input
              type="text"
              className="search-input"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="stock">Sort by Stock</option>
              <option value="price">Sort by Price</option>
            </select>
            <div className="filter-buttons">
              <button
                type="button"
                className={`filter-btn filter-all ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`filter-btn filter-low-stock ${filter === 'low-stock' ? 'active' : ''}`}
                onClick={() => setFilter('low-stock')}
              >
                Low Stock
              </button>
              <button
                type="button"
                className={`filter-btn filter-verified ${filter === 'verified' ? 'active' : ''}`}
                onClick={() => setFilter('verified')}
              >
                Verified
              </button>
            </div>
          </div>
        </div>

        <Table
          columns={[
            { key: 'id', label: 'SKU' },
            { key: 'name', label: 'Product Name' },
            { key: 'category', label: 'Category' },
            {
              key: 'stock',
              label: 'Stock',
              render: (value, row) => (
                <span className={`stock-badge stock-${row.status}`}>
                  {value} units
                </span>
              ),
            },
            { key: 'reorderLevel', label: 'Reorder Level' },
            {
              key: 'price',
              label: 'Price',
              render: (value) => `$${value.toFixed(2)}`,
            },
            {
              key: 'verified',
              label: 'Status',
              render: (value) =>
                value ? (
                  <BlockchainBadge label="Verified" />
                ) : (
                  <span className="badge-pending">Pending</span>
                ),
            },
          ]}
          rows={filteredInventory}
          emptyMessage="No products found"
        />
      </div>
    </div>
  )
}

export default Inventory
