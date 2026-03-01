import { useState } from 'react'
import Table from '../../components/common/Table'

function normalizeBatchRows(batches = []) {
  return batches.map((item, index) => {
    const rawStatus = String(item.status || 'created').toLowerCase()
    const status =
      rawStatus === 'created'
        ? 'in-progress'
        : rawStatus

    return {
      batchId: item.batchId || item.batch_id || `BATCH-${index + 1}`,
      sku: item.sku || item.product_sku || '--',
      productName: item.productName || item.product_name || item.sku || item.product_sku || `Product ${index + 1}`,
      quantity: Number(item.quantity || 0),
      status,
      startDate: item.startDate || item.created_at || item.timestamp || '--',
      endDate: item.endDate || item.completed_at || '--',
      qcStatus:
        item.qcStatus ||
        (status === 'completed' ? 'passed' : status === 'quality-check' ? 'in-review' : 'pending'),
    }
  })
}

function Production({ batches = [] }) {
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddBatch, setShowAddBatch] = useState(false)
  const [newBatch, setNewBatch] = useState({
    productName: '',
    quantity: '',
    batchNumber: '',
  })

  const displayProduction = normalizeBatchRows(batches)

  const filteredProduction = displayProduction
    .filter((item) => {
      if (filter === 'all') return true
      if (filter === 'in-progress') return item.status === 'in-progress'
      if (filter === 'completed') return item.status === 'completed'
      if (filter === 'quality-check') return item.status === 'quality-check'
      return true
    })
    .filter((item) =>
      item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const productionStats = {
    total: displayProduction.length,
    inProgress: displayProduction.filter((p) => p.status === 'in-progress').length,
    completed: displayProduction.filter((p) => p.status === 'completed').length,
    qualityCheck: displayProduction.filter((p) => p.status === 'quality-check').length,
  }

  const handleAddBatch = (e) => {
    e.preventDefault()
    alert(`New batch created:\n${JSON.stringify(newBatch, null, 2)}`)
    setShowAddBatch(false)
    setNewBatch({ productName: '', quantity: '', batchNumber: '' })
  }

  return (
    <div className="production-container">
      {/* Production Stats */}
      <div className="production-stats">
        <div className="stat-card stat-total">
          <span className="stat-value">{productionStats.total}</span>
          <span className="stat-label">Total Batches</span>
        </div>
        <div className="stat-card stat-in-progress">
          <span className="stat-value">{productionStats.inProgress}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-card stat-completed">
          <span className="stat-value">{productionStats.completed}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-card stat-quality">
          <span className="stat-value">{productionStats.qualityCheck}</span>
          <span className="stat-label">Quality Check</span>
        </div>
      </div>

      {/* Production Table */}
      <div className="card">
        <div className="production-header">
          <h4 className="card-title">Production Batches</h4>
          <div className="production-controls">
            <input
              type="text"
              className="search-input"
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                className={`filter-btn filter-in-progress ${filter === 'in-progress' ? 'active' : ''}`}
                onClick={() => setFilter('in-progress')}
              >
                In Progress
              </button>
              <button
                type="button"
                className={`filter-btn filter-completed ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
              <button
                type="button"
                className={`filter-btn filter-quality-check ${filter === 'quality-check' ? 'active' : ''}`}
                onClick={() => setFilter('quality-check')}
              >
                QC
              </button>
            </div>
            <button
              type="button"
              className="btn-add-batch"
              onClick={() => setShowAddBatch(!showAddBatch)}
            >
              + New Batch
            </button>
          </div>
        </div>

        {showAddBatch && (
          <form className="add-batch-form" onSubmit={handleAddBatch}>
            <input
              type="text"
              placeholder="Product Name"
              value={newBatch.productName}
              onChange={(e) => setNewBatch({ ...newBatch, productName: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Quantity"
              value={newBatch.quantity}
              onChange={(e) => setNewBatch({ ...newBatch, quantity: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Batch Number"
              value={newBatch.batchNumber}
              onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
              required
            />
            <button type="submit" className="btn-submit">Create Batch</button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setShowAddBatch(false)}
            >
              Cancel
            </button>
          </form>
        )}

        <Table
          columns={[
            { key: 'batchId', label: 'Batch ID' },
            { key: 'sku', label: 'SKU' },
            { key: 'productName', label: 'Product' },
            { key: 'quantity', label: 'Quantity' },
            {
              key: 'status',
              label: 'Status',
              render: (value) => (
                <span className={`status-badge status-${value}`}>
                  {value.replace('-', ' ')}
                </span>
              ),
            },
            { key: 'startDate', label: 'Start Date' },
            { key: 'endDate', label: 'End Date' },
            {
              key: 'qcStatus',
              label: 'QC Status',
              render: (value) => (
                <span className={`qc-badge qc-${value}`}>
                  {value}
                </span>
              ),
            },
          ]}
          rows={filteredProduction}
          emptyMessage="No production batches found"
        />
      </div>
    </div>
  )
}

export default Production
