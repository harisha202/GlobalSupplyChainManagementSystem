import { useState } from 'react'
import BlockchainBadge from '../../components/blockchain/BlockchainBadge'
import Table from '../../components/common/Table'

function normalizeBlockchainRows(batches = []) {
  return batches.map((item, index) => {
    const batchId = item.batchId || item.batch_id || `BATCH-${index + 1}`
    const status = String(item.status || '').toLowerCase()
    const hasLedgerHash = Boolean(item.ledger_hash || item.blockchainHash)
    const verified = item.verified ?? (hasLedgerHash && status !== 'created')

    return {
      batchId,
      productName: item.productName || item.product_name || item.sku || item.product_sku || `Batch ${index + 1}`,
      quantity: Number(item.quantity || 0),
      blockchainHash: item.ledger_hash || item.blockchainHash || 'Pending',
      timestamp: item.timestamp || item.created_at || '--',
      verified: Boolean(verified),
      transactionId: item.transactionId || item.txHash || item.ledger_hash?.slice(0, 12) || '--',
    }
  })
}

function BlockchainRegister({ batches = [] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [newRegistration, setNewRegistration] = useState({
    batchId: '',
    productName: '',
    quantity: '',
  })

  const displayData = normalizeBlockchainRows(batches)

  const filteredData = displayData.filter((item) =>
    item.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const blockchainStats = {
    total: displayData.length,
    verified: displayData.filter((d) => d.verified).length,
    pending: displayData.filter((d) => !d.verified).length,
  }

  const handleRegister = (e) => {
    e.preventDefault()
    alert(`Registering on blockchain:\n${JSON.stringify(newRegistration, null, 2)}`)
    setShowRegisterForm(false)
    setNewRegistration({ batchId: '', productName: '', quantity: '' })
  }

  return (
    <div className="blockchain-container">
      {/* Blockchain Stats */}
      <div className="blockchain-stats">
        <div className="stat-card stat-total">
          <span className="stat-value">{blockchainStats.total}</span>
          <span className="stat-label">Total Registered</span>
        </div>
        <div className="stat-card stat-verified">
          <span className="stat-value">{blockchainStats.verified}</span>
          <span className="stat-label">Verified</span>
        </div>
        <div className="stat-card stat-pending">
          <span className="stat-value">{blockchainStats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
      </div>

      {/* Blockchain Info Card */}
      <div className="card blockchain-info-card">
        <div className="blockchain-info-header">
          <div className="blockchain-icon-large">🔗</div>
          <div>
            <h4 className="card-title">Blockchain Registration</h4>
            <p className="blockchain-description">
              Secure, immutable records of all manufactured batches on the blockchain network
            </p>
          </div>
        </div>
      </div>

      {/* Blockchain Registry Table */}
      <div className="card">
        <div className="blockchain-header">
          <h4 className="card-title">Blockchain Registry</h4>
          <div className="blockchain-controls">
            <input
              type="text"
              className="search-input"
              placeholder="Search blockchain records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className="btn-register"
              onClick={() => setShowRegisterForm(!showRegisterForm)}
            >
              + Register Batch
            </button>
          </div>
        </div>

        {showRegisterForm && (
          <form className="register-form" onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Batch ID"
              value={newRegistration.batchId}
              onChange={(e) =>
                setNewRegistration({ ...newRegistration, batchId: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Product Name"
              value={newRegistration.productName}
              onChange={(e) =>
                setNewRegistration({ ...newRegistration, productName: e.target.value })
              }
              required
            />
            <input
              type="number"
              placeholder="Quantity"
              value={newRegistration.quantity}
              onChange={(e) =>
                setNewRegistration({ ...newRegistration, quantity: e.target.value })
              }
              required
            />
            <button type="submit" className="btn-submit">
              Register on Blockchain
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setShowRegisterForm(false)}
            >
              Cancel
            </button>
          </form>
        )}

        <Table
          columns={[
            { key: 'batchId', label: 'Batch ID' },
            { key: 'productName', label: 'Product' },
            { key: 'quantity', label: 'Quantity' },
            { key: 'blockchainHash', label: 'Blockchain Hash' },
            { key: 'timestamp', label: 'Timestamp' },
            { key: 'transactionId', label: 'Transaction ID' },
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
          rows={filteredData}
          emptyMessage="No blockchain records found"
        />
      </div>
    </div>
  )
}

export default BlockchainRegister
