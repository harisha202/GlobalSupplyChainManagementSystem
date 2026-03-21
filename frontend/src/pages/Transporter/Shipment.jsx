import { useMemo, useState } from 'react'
import Table from '../../components/common/Table'
import LorryIcon from './LorryIcon'
import { getInitials, getShipmentDetails } from './shipmentUtils'

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating }) {
  const r = parseFloat(rating) || 0
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i <= Math.round(r) ? '#f59e0b' : '#e2e8f0'}
            stroke={i <= Math.round(r) ? '#f59e0b' : '#cbd5e1'}
            strokeWidth="1"
          />
        </svg>
      ))}
      <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 2 }}>{r.toFixed(1)}</span>
    </span>
  )
}

// ─── Shipment Detail Panel ────────────────────────────────────────────────────
function ShipmentDetailPanel({ row, onClose }) {
  if (!row) return null

  const statusColor = row.isDelayed
    ? '#ef4444'
    : row.isInTransit
    ? '#3b82f6'
    : row.isDelivered
    ? '#10b981'
    : '#64748b'

  const statusLabel = row.isDelayed
    ? 'Delayed'
    : row.isInTransit
    ? 'In Transit'
    : row.isDelivered
    ? 'Delivered'
    : row.status

  return (
    <>
      {/* Dark overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.38)',
          backdropFilter: 'blur(2px)',
          zIndex: 998,
        }}
      />

      {/* Panel */}
      <aside style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: 380,
        background: 'linear-gradient(180deg, #0c1a2e 0%, #0a1520 100%)',
        borderLeft: '1px solid rgba(14,165,233,0.15)',
        zIndex: 999,
        overflowY: 'auto',
        animation: 'sdpSlideIn 0.22s ease',
        fontFamily: "'Sora', 'Segoe UI', sans-serif",
        boxShadow: '-6px 0 40px rgba(0,0,0,0.55)',
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
          @keyframes sdpSlideIn {
            from { transform: translateX(28px); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
          @keyframes sdpBlink { 0%,100%{opacity:1} 50%{opacity:0.25} }
          @keyframes sdpPulse {
            0%   { transform: scale(0.6); opacity: 0.5; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          .sdp-panel::-webkit-scrollbar { width: 4px; }
          .sdp-panel::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.18); border-radius: 2px; }

          .sdp-section { padding: 12px 20px; border-top: 1px solid rgba(255,255,255,0.04); }
          .sdp-section-title {
            font-size: 9px; letter-spacing: 2px; color: #93c5fd;
            text-transform: uppercase; margin-bottom: 10px;
          }
          .sdp-kv {
            display: flex; justify-content: space-between; align-items: center;
            padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.03);
            font-size: 12px;
          }
          .sdp-kv:last-child { border-bottom: none; }
          .sdp-kv-key { color: #cbd5e1; }
          .sdp-kv-val { color: #94a3b8; font-family: 'JetBrains Mono', monospace; font-size: 11px; }
          .sdp-kv-val.live { color: #34d399; }
          .sdp-kv-val.warn { color: #f87171; }
        `}</style>

        {/* Sticky header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '16px 20px 13px',
          borderBottom: '1px solid rgba(14,165,233,0.08)',
          position: 'sticky', top: 0,
          background: '#0c1a2e',
          zIndex: 2,
        }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#93c5fd', textTransform: 'uppercase', marginBottom: 3 }}>
              Shipment Detail
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#e0f2fe', fontFamily: "'JetBrains Mono', monospace" }}>
              {row.id}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.04)', border: 'none', cursor: 'pointer',
              width: 30, height: 30, borderRadius: 8, color: '#475569',
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#475569' }}
          >×</button>
        </div>

        {/* Driver / Partner */}
        <div style={{ padding: '18px 20px 0' }}>
          <div style={{ display: 'flex', gap: 13, alignItems: 'center', marginBottom: 14 }}>
            {/* Avatar */}
            <div style={{
              width: 54, height: 54, borderRadius: 15, flexShrink: 0,
              background: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#fff', overflow: 'hidden',
              boxShadow: '0 0 0 3px rgba(14,165,233,0.2)',
            }}>
              {row.partnerLogo
                ? <img src={row.partnerLogo} alt={row.partnerName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                : getInitials(row.partnerName)
              }
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f9ff' }}>{row.partnerName}</div>
              <div style={{ fontSize: 11, color: '#cbd5e1', margin: '2px 0 5px' }}>{row.partnerPhone}</div>
              <Stars rating={row.partnerRating} />
            </div>
          </div>

          {/* Status + GPS badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 11px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: statusColor + '1a',
              border: `1px solid ${statusColor}44`,
              color: statusColor,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: statusColor,
                boxShadow: `0 0 5px ${statusColor}`,
                animation: row.isInTransit ? 'sdpBlink 1.4s ease infinite' : 'none',
              }} />
              {statusLabel}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 11px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: row.hasGps ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.08)',
              border: `1px solid ${row.hasGps ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.18)'}`,
              color: row.hasGps ? '#34d399' : '#64748b',
            }}>
              {row.hasGps ? 'Live GPS' : 'No Signal'}
            </span>
          </div>
        </div>

        {/* Lorry + Vehicle */}
        <div className="sdp-section">
          <div className="sdp-section-title">Vehicle</div>
          <div style={{
            display: 'flex', gap: 12, alignItems: 'center',
            background: 'rgba(14,165,233,0.06)',
            border: '1px solid rgba(14,165,233,0.12)',
            borderRadius: 10, padding: '11px 14px',
          }}>
            <div style={{
              width: 42, height: 42, flexShrink: 0, borderRadius: 10,
              background: row.isDelayed ? 'rgba(239,68,68,0.1)' : 'rgba(14,165,233,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LorryIcon style={{ width: 24, height: 24, color: row.isDelayed ? '#f87171' : '#38bdf8' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e0f2fe', fontFamily: "'JetBrains Mono', monospace" }}>
                {row.vehicleNumber}
              </div>
              <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 3 }}>
                Assignment: <span style={{
                  color: row.assignmentStatus.toLowerCase().includes('pending') ? '#f59e0b' : '#34d399',
                  fontWeight: 600,
                }}>{row.assignmentStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="sdp-section">
          <div className="sdp-section-title">Route</div>

          {/* Visual route bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {/* Origin dot */}
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.6)',
            }} />
            {/* Progress track */}
            <div style={{
              flex: 1, height: 3,
              background: 'rgba(255,255,255,0.07)',
              borderRadius: 2, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0,
                height: '100%', width: row.isDelivered ? '100%' : row.isInTransit ? '55%' : '15%',
                background: `linear-gradient(90deg, #10b981, ${statusColor})`,
                borderRadius: 2,
                transition: 'width 0.5s ease',
              }} />
              {/* Lorry icon on track */}
              <div style={{
                position: 'absolute', top: '50%',
                left: row.isDelivered ? '96%' : row.isInTransit ? '51%' : '11%',
                transform: 'translate(-50%, -50%)',
                transition: 'left 0.5s ease',
              }}>
                <LorryIcon style={{ width: 16, height: 16, color: statusColor }} />
              </div>
            </div>
            {/* Destination pin */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {row.isDelayed && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(239,68,68,0.2)',
                  animation: 'sdpPulse 2s ease-out infinite',
                }} />
              )}
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)',
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
            <span>{row.origin}</span>
            <span>{row.destination}</span>
          </div>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 11, color: '#cbd5e1' }}>
            <span>ETA: <strong style={{ color: row.isDelayed ? '#f87171' : '#7dd3fc' }}>{row.eta}</strong></span>
            {row.weight !== '--' && <span>Weight: <strong style={{ color: '#94a3b8' }}>{row.weight} kg</strong></span>}
          </div>
        </div>

        {/* Live GPS */}
        {row.hasGps && (
          <div className="sdp-section">
            <div className="sdp-section-title">Live Location</div>
            <div style={{
              background: 'rgba(14,165,233,0.05)',
              border: '1px solid rgba(14,165,233,0.1)',
              borderRadius: 8, padding: '10px 12px',
            }}>
              <div className="sdp-kv">
                <span className="sdp-kv-key">Latitude</span>
                <span className="sdp-kv-val live">{row.lat?.toFixed(5)}</span>
              </div>
              <div className="sdp-kv">
                <span className="sdp-kv-key">Longitude</span>
                <span className="sdp-kv-val live">{row.lng?.toFixed(5)}</span>
              </div>
              <div className="sdp-kv">
                <span className="sdp-kv-key">Signal</span>
                <span className="sdp-kv-val live">● Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Shipment Details */}
        <div className="sdp-section">
          <div className="sdp-section-title">Shipment Info</div>
          <div className="sdp-kv">
            <span className="sdp-kv-key">Shipment ID</span>
            <span className="sdp-kv-val">{row.id}</span>
          </div>
          <div className="sdp-kv">
            <span className="sdp-kv-key">Live Tracking</span>
            <span className={`sdp-kv-val ${row.hasGps ? 'live' : ''}`}>{row.liveTracking}</span>
          </div>
          <div className="sdp-kv">
            <span className="sdp-kv-key">Last Update</span>
            <span className="sdp-kv-val">{row.lastUpdate !== '--' ? row.lastUpdate : 'N/A'}</span>
          </div>
        </div>

        {/* Feedback */}
        <div className="sdp-section" style={{ paddingBottom: 24 }}>
          <div className="sdp-section-title">Transport Feedback</div>
          <div style={{
            fontSize: 12, color: '#dbeafe', lineHeight: 1.6, fontStyle: 'italic',
            background: 'rgba(255,255,255,0.02)',
            borderLeft: `2px solid ${statusColor}55`,
            padding: '9px 11px', borderRadius: '0 7px 7px 0',
          }}>
            {row.feedbackMessage}
          </div>
        </div>
      </aside>
    </>
  )
}

// ─── Main Shipments Component ─────────────────────────────────────────────────
function Shipments({ shipments = {} }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('id')
  const [selectedRow, setSelectedRow] = useState(null)

  const shipmentList = useMemo(
    () => Object.entries(shipments).map(([id, item]) => getShipmentDetails(id, item)),
    [shipments],
  )

  const filteredShipments = shipmentList
    .filter(s =>
      [s.id, s.status, s.partnerName, s.assignmentStatus, s.vehicleNumber, s.origin, s.destination]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === 'id') return a.id.localeCompare(b.id)
      if (sortBy === 'status') return a.status.localeCompare(b.status)
      if (sortBy === 'partner') return a.partnerName.localeCompare(b.partnerName)
      if (sortBy === 'assignment') return a.assignmentStatus.localeCompare(b.assignmentStatus)
      return 0
    })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        .shipments-container { font-family: 'Sora', sans-serif; }

        .sdp-table-row {
          cursor: pointer;
          transition: background 0.12s;
        }
        .sdp-table-row:hover td {
          background: rgba(14,165,233,0.05) !important;
        }
        .sdp-table-row.sdp-row-selected td {
          background: rgba(14,165,233,0.09) !important;
          border-left: 2px solid #0ea5e9;
        }

        .sdp-id-cell {
          display: inline-flex; align-items: center; gap: 7px;
        }
        .sdp-id-lorry {
          width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.15s;
        }
        .sdp-table-row:hover .sdp-id-lorry { transform: scale(1.12); }
      `}</style>

      <section className="card shipments-container">
        <div className="shipments-header">
          <h4 className="card-title">All Shipments</h4>
          <div className="shipments-controls">
            <input
              type="text"
              className="search-input"
              placeholder="Search shipments..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <select
              className="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="id">Sort by ID</option>
              <option value="status">Sort by Status</option>
              <option value="partner">Sort by Partner</option>
              <option value="assignment">Sort by Assignment</option>
            </select>
          </div>
        </div>

        <Table
          columns={[
            {
              key: 'id',
              label: 'Shipment ID',
              render: (value, row) => (
                <div className="sdp-id-cell">
                  <div
                    className="sdp-id-lorry"
                    style={{
                      background: row.isDelayed ? 'rgba(239,68,68,0.1)' : 'rgba(14,165,233,0.08)',
                      border: `1px solid ${row.isDelayed ? 'rgba(239,68,68,0.2)' : 'rgba(14,165,233,0.15)'}`,
                    }}
                  >
                    <LorryIcon style={{
                      width: 16, height: 16,
                      color: row.isDelayed ? '#f87171' : '#38bdf8',
                    }} />
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}>
                    {value}
                  </span>
                </div>
              ),
            },
            {
              key: 'partnerName',
              label: 'Delivery Partner',
              render: (_, row) => (
                <div className="partner-cell">
                  {row.partnerLogo ? (
                    <img className="partner-logo" src={row.partnerLogo} alt={row.partnerName}
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <span className="partner-logo partner-logo-fallback">
                      {getInitials(row.partnerName)}
                    </span>
                  )}
                  <div className="partner-meta">
                    <strong>{row.partnerName}</strong>
                    <span>{row.partnerPhone}</span>
                    <span>Rating: {row.partnerRating}</span>
                  </div>
                </div>
              ),
            },
            {
              key: 'assignmentStatus',
              label: 'Assignment',
              render: (value, row) => (
                <span className={`assignment-chip ${String(value).toLowerCase().includes('pending') ? 'pending' : 'assigned'}`}>
                  {value} | {row.vehicleNumber}
                </span>
              ),
            },
            { key: 'origin', label: 'Origin' },
            { key: 'destination', label: 'Destination' },
            {
              key: 'status',
              label: 'Status',
              render: (value, row) => (
                <span className={`shipment-status ${row.isDelayed ? 'delayed' : 'active'}`}>{value}</span>
              ),
            },
            {
              key: 'liveTracking',
              label: 'Live Tracking',
              render: (value, row) => (
                <span className={`tracking-chip ${row.hasGps ? 'live' : 'offline'}`}>{value}</span>
              ),
            },
            { key: 'eta', label: 'ETA' },
            { key: 'weight', label: 'Weight (kg)' },
            {
              key: 'feedbackMessage',
              label: 'Transport Feedback',
              render: value => <span className="feedback-chip">{value}</span>,
            },
          ]}
          rows={filteredShipments}
          emptyMessage="No shipments found"
          rowProps={row => ({
            className: `sdp-table-row${selectedRow?.id === row.id ? ' sdp-row-selected' : ''}`,
            onClick: () => setSelectedRow(prev => prev?.id === row.id ? null : row),
            title: `Click to view details for ${row.id}`,
          })}
        />

        {/* Click hint */}
        {filteredShipments.length > 0 && !selectedRow && (
          <div style={{
            display: 'block',
            padding: '10px 14px', marginTop: 8,
            fontSize: 11, color: '#4d6382',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            Click any row to view full shipment & driver detail
          </div>
        )}
      </section>

      {/* Detail panel */}
      {selectedRow && (
        <ShipmentDetailPanel row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </>
  )
}

export default Shipments
