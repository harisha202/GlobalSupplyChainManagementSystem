import { useState, useMemo } from 'react'
import LorryIcon from './LorryIcon'
import { getShipmentDetails } from './shipmentUtils'
import Table from '../../components/common/Table'

// â”€â”€â”€ Stars â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Stars({ rating }) {
  const r = parseFloat(rating) || 0
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
      <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 3 }}>{r.toFixed(1)}</span>
    </div>
  )
}

// â”€â”€â”€ Driver Detail Panel (slide-in) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DriverDetailPanel({ vehicle, onClose }) {
  if (!vehicle) return null

  const statusColor = vehicle.isDelayed
    ? '#ef4444'
    : vehicle.isInTransit
    ? '#3b82f6'
    : '#10b981'
  const statusLabel = vehicle.isDelayed
    ? 'Delayed'
    : vehicle.isInTransit
    ? 'In Transit'
    : vehicle.isDelivered
    ? 'Delivered'
    : vehicle.status

  return (
    <div className="fleet-detail-panel">
      <style>{`
        @keyframes fleetPanelIn {
          from { transform: translateX(20px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes fleetBlink {
          0%,100% { opacity: 1; } 50% { opacity: 0.25; }
        }
        .fleet-detail-panel {
          position: fixed;
          top: 0; right: 0; bottom: 0;
          width: 360px;
          background: #0c1826;
          border-left: 1px solid rgba(14,165,233,0.14);
          z-index: 999;
          overflow-y: auto;
          font-family: inherit;
          animation: fleetPanelIn 0.2s ease;
          box-shadow: -8px 0 32px rgba(0,0,0,0.5);
        }
        .fleet-detail-panel::-webkit-scrollbar { width: 4px; }
        .fleet-detail-panel::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.2); border-radius: 2px; }

        .fdp-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 18px 20px 14px;
          border-bottom: 1px solid rgba(14,165,233,0.08);
          position: sticky; top: 0;
          background: #0c1826;
          z-index: 2;
        }
        .fdp-label { font-size: 9px; letter-spacing: 2px; color: #93c5fd; text-transform: uppercase; margin-bottom: 3px; }
        .fdp-vehicle-id { font-size: 15px; font-weight: 800; color: #e0f2fe; font-family: inherit; }
        .fdp-close {
          background: rgba(255,255,255,0.04); border: none; cursor: pointer;
          width: 30px; height: 30px; border-radius: 8px; color: #475569;
          font-size: 18px; display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .fdp-close:hover { background: rgba(239,68,68,0.15); color: #f87171; }

        .fdp-hero {
          padding: 18px 20px 0;
          display: flex; gap: 14px; align-items: center;
        }
        .fdp-avatar {
          width: 56px; height: 56px; border-radius: 16px; flex-shrink: 0;
          background: linear-gradient(135deg, #0ea5e9, #0369a1);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 800; color: #fff; overflow: hidden;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.2);
        }
        .fdp-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .fdp-driver-name { font-size: 16px; font-weight: 700; color: #f0f9ff; }
        .fdp-driver-phone { font-size: 11px; color: #cbd5e1; margin: 2px 0 6px; }

        .fdp-badges { display: flex; gap: 8px; flex-wrap: wrap; padding: 12px 20px; }
        .fdp-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 6px; border: 1px solid;
          font-size: 11px; font-weight: 600;
        }
        .fdp-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          animation: fleetBlink 1.4s ease infinite;
        }

        .fdp-section {
          padding: 12px 20px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .fdp-section-title {
          font-size: 9px; letter-spacing: 1.5px; color: #93c5fd;
          text-transform: uppercase; margin-bottom: 10px;
        }

        .fdp-lorry-card {
          display: flex; gap: 12px; align-items: center;
          background: rgba(14,165,233,0.06);
          border: 1px solid rgba(14,165,233,0.12);
          border-radius: 10px; padding: 12px 14px;
        }
        .fdp-lorry-icon-wrap {
          width: 44px; height: 44px; flex-shrink: 0; border-radius: 10px;
          background: rgba(14,165,233,0.1);
          display: flex; align-items: center; justify-content: center;
        }

        .fdp-route-visual {
          display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
        }
        .fdp-route-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }
        .fdp-route-line-wrap {
          flex: 1; height: 2px; background: rgba(255,255,255,0.06);
          border-radius: 1px; overflow: hidden;
        }
        .fdp-route-fill {
          height: 100%; width: 55%;
          background: linear-gradient(90deg, #10b981, #0ea5e9);
        }
        .fdp-route-cities {
          display: flex; justify-content: space-between;
          font-size: 11px; color: #94a3b8; margin-bottom: 8px;
        }
        .fdp-route-meta {
          display: flex; gap: 16px; flex-wrap: wrap;
          font-size: 11px; color: #cbd5e1;
        }
        .fdp-route-meta strong { color: #7dd3fc; }

        .fdp-kv { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 11px; }
        .fdp-kv:last-child { border-bottom: none; }
        .fdp-kv-key { color: #cbd5e1; }
        .fdp-kv-val { color: #94a3b8; font-family: inherit; font-size: 10px; }
        .fdp-kv-val.live { color: #34d399; }

        .fdp-feedback {
          font-size: 12px; color: #dbeafe; line-height: 1.55; font-style: italic;
          background: rgba(255,255,255,0.02);
          border-left: 2px solid rgba(14,165,233,0.3);
          padding: 8px 10px; border-radius: 0 6px 6px 0;
        }
      `}</style>

      {/* Header */}
      <div className="fdp-header">
        <div>
          <div className="fdp-label">Fleet Vehicle</div>
          <div className="fdp-vehicle-id">{vehicle.vehicleNumber}</div>
        </div>
        <button className="fdp-close" onClick={onClose}>Ã—</button>
      </div>

      {/* Driver Identity */}
      <div className="fdp-hero">
        <div className="fdp-avatar">
          {vehicle.partnerLogo
            ? <img src={vehicle.partnerLogo} alt={vehicle.partnerName} />
            : (vehicle.partnerName || 'DP').slice(0, 2).toUpperCase()
          }
        </div>
        <div>
          <div className="fdp-driver-name">{vehicle.partnerName}</div>
          <div className="fdp-driver-phone">{vehicle.partnerPhone}</div>
          <Stars rating={vehicle.partnerRating} />
        </div>
      </div>

      {/* Status badges */}
      <div className="fdp-badges">
        <span className="fdp-badge" style={{
          background: statusColor + '18',
          borderColor: statusColor + '44',
          color: statusColor,
        }}>
          <span className="fdp-badge-dot" style={{ background: statusColor, boxShadow: `0 0 5px ${statusColor}` }} />
          {statusLabel}
        </span>
        <span className="fdp-badge" style={{
          background: vehicle.hasGps ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
          borderColor: vehicle.hasGps ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.2)',
          color: vehicle.hasGps ? '#34d399' : '#64748b',
        }}>
          {vehicle.hasGps ? 'Live GPS' : 'No Signal'}
        </span>
      </div>

      {/* Vehicle card with LorryIcon */}
      <div className="fdp-section">
        <div className="fdp-section-title">Vehicle</div>
        <div className="fdp-lorry-card">
          <div className="fdp-lorry-icon-wrap">
            <LorryIcon style={{ width: 26, height: 26, color: '#38bdf8' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#e0f2fe', fontSize: 14, fontFamily: "inherit" }}>
              {vehicle.vehicleNumber}
            </div>
            <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>Shipment: {vehicle.id}</div>
            <div style={{ fontSize: 11, color: vehicle.hasGps ? '#34d399' : '#64748b', marginTop: 2 }}>
              {vehicle.liveTracking}
            </div>
          </div>
        </div>
      </div>

      {/* Route */}
      <div className="fdp-section">
        <div className="fdp-section-title">Route</div>
        <div className="fdp-route-visual">
          <div className="fdp-route-dot" style={{ background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
          <div className="fdp-route-line-wrap"><div className="fdp-route-fill" /></div>
          <div className="fdp-route-dot" style={{ background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.5)' }} />
        </div>
        <div className="fdp-route-cities">
          <span>{vehicle.origin}</span>
          <span>{vehicle.destination}</span>
        </div>
        <div className="fdp-route-meta">
          <span>ETA: <strong>{vehicle.eta}</strong></span>
          {vehicle.weight !== '--' && <span>Weight: <strong>{vehicle.weight} kg</strong></span>}
        </div>
      </div>

      {/* Assignment */}
      <div className="fdp-section">
        <div className="fdp-section-title">Assignment</div>
        <div className="fdp-kv">
          <span className="fdp-kv-key">Status</span>
          <span className={`assignment-chip ${vehicle.assignmentStatus.toLowerCase().includes('pending') ? 'pending' : 'assigned'}`}>
            {vehicle.assignmentStatus}
          </span>
        </div>
        <div className="fdp-kv">
          <span className="fdp-kv-key">Shipment ID</span>
          <span className="fdp-kv-val">{vehicle.id}</span>
        </div>
        <div className="fdp-kv">
          <span className="fdp-kv-key">Last Update</span>
          <span className="fdp-kv-val">{vehicle.lastUpdate !== '--' ? vehicle.lastUpdate : 'N/A'}</span>
        </div>
      </div>

      {/* GPS */}
      {vehicle.hasGps && (
        <div className="fdp-section">
          <div className="fdp-section-title">Live Location</div>
          <div className="fdp-kv">
            <span className="fdp-kv-key">Latitude</span>
            <span className="fdp-kv-val live">{vehicle.lat?.toFixed(4)}</span>
          </div>
          <div className="fdp-kv">
            <span className="fdp-kv-key">Longitude</span>
            <span className="fdp-kv-val live">{vehicle.lng?.toFixed(4)}</span>
          </div>
          <div className="fdp-kv">
            <span className="fdp-kv-key">Signal</span>
            <span className="fdp-kv-val live">â— Active</span>
          </div>
        </div>
      )}

      {/* Feedback */}
      <div className="fdp-section">
        <div className="fdp-section-title">Transport Feedback</div>
        <div className="fdp-feedback">{vehicle.feedbackMessage}</div>
      </div>
    </div>
  )
}

// â”€â”€â”€ FleetManager â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FleetManager({ shipments = {} }) {
  const [filter, setFilter] = useState('all')
  const [selectedVehicle, setSelectedVehicle] = useState(null)

  // Enrich vehicles with full shipment detail from shipmentUtils
  const vehicles = useMemo(() =>
    Object.entries(shipments).map(([id, item]) => {
      const detail = getShipmentDetails(id, item)
      return {
        ...detail,
        // Extra flat fields for the Table columns
        vehicleDisplay: detail.vehicleNumber,
        driverDisplay: detail.partnerName,
        locationDisplay: detail.hasGps
          ? `${detail.lat?.toFixed(2)}, ${detail.lng?.toFixed(2)}`
          : 'No GPS',
      }
    }),
    [shipments],
  )

  const filteredVehicles = vehicles.filter(v => {
    if (filter === 'all') return true
    if (filter === 'active') return v.isInTransit && !v.isDelivered
    if (filter === 'delayed') return v.isDelayed
    if (filter === 'gps') return v.hasGps
    return true
  })

  const counts = {
    all: vehicles.length,
    active: vehicles.filter(v => v.isInTransit && !v.isDelivered).length,
    delayed: vehicles.filter(v => v.isDelayed).length,
    gps: vehicles.filter(v => v.hasGps).length,
  }

  return (
    <>
      <style>{`
        .fleet-manager-container { font-family: inherit; }

        .fleet-filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .fleet-filter-btn {
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: #64748b;
          font-size: 12px; font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .fleet-filter-btn:hover {
          background: rgba(14,165,233,0.08);
          border-color: rgba(14,165,233,0.2);
          color: #38bdf8;
        }
        .fleet-filter-btn.active {
          background: rgba(14,165,233,0.12);
          border-color: rgba(14,165,233,0.4);
          color: #38bdf8;
        }
        .fleet-filter-btn.delayed-btn.active {
          background: rgba(239,68,68,0.1);
          border-color: rgba(239,68,68,0.35);
          color: #f87171;
        }

        .fleet-row-clickable { cursor: pointer; transition: background 0.12s; }
        .fleet-row-clickable:hover td { background: rgba(14,165,233,0.05) !important; }
        .fleet-row-clickable.selected td { background: rgba(14,165,233,0.1) !important; border-left: 2px solid #0ea5e9; }

        .fleet-lorry-cell {
          display: flex; align-items: center; gap: 8px;
        }
        .fleet-lorry-cell-icon {
          width: 30px; height: 30px; border-radius: 7px;
          background: rgba(14,165,233,0.08);
          border: 1px solid rgba(14,165,233,0.15);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .fleet-lorry-cell.delayed .fleet-lorry-cell-icon {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.15);
        }

        .fleet-status-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 9px; border-radius: 5px;
          font-size: 11px; font-weight: 600;
        }
        .fleet-status-dot { width: 5px; height: 5px; border-radius: 50%; }

        .fleet-gps-badge {
          font-size: 10px; font-family: inherit;
          padding: 2px 7px; border-radius: 4px;
        }
        .fleet-gps-badge.live {
          background: rgba(16,185,129,0.1); color: #34d399;
          border: 1px solid rgba(16,185,129,0.25);
        }
        .fleet-gps-badge.offline {
          background: rgba(100,116,139,0.1); color: #64748b;
          border: 1px solid rgba(100,116,139,0.2);
        }

        .fleet-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.3);
          z-index: 998; backdrop-filter: blur(2px);
        }
      `}</style>

      <section className="card fleet-manager-container">
        <div className="fleet-manager-header">
          <h4 className="card-title">Fleet Manager</h4>
          <div className="fleet-filters">
            {[
              { key: 'all', label: `All (${counts.all})` },
              { key: 'active', label: `Active (${counts.active})` },
              { key: 'delayed', label: `Delayed (${counts.delayed})`, cls: 'delayed-btn' },
              { key: 'gps', label: `Live GPS (${counts.gps})` },
            ].map(({ key, label, cls = '' }) => (
              <button
                key={key}
                className={`fleet-filter-btn ${cls} ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Table
          columns={[
            {
              key: 'vehicleDisplay',
              label: 'Vehicle',
              render: (_, row) => (
                <div className={`fleet-lorry-cell ${row.isDelayed ? 'delayed' : ''}`}>
                  <div className="fleet-lorry-cell-icon">
                    <LorryIcon style={{
                      width: 18, height: 18,
                      color: row.isDelayed ? '#f87171' : '#38bdf8',
                    }} />
                  </div>
                  <span style={{ fontFamily: "inherit", fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
                    {row.vehicleNumber}
                  </span>
                </div>
              ),
            },
            {
              key: 'driverDisplay',
              label: 'Driver / Partner',
              render: (_, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color: '#fff', overflow: 'hidden',
                  }}>
                    {row.partnerLogo
                      ? <img src={row.partnerLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (row.partnerName || 'DP').slice(0, 2).toUpperCase()
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e0f2fe' }}>{row.partnerName}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>{row.partnerPhone}</div>
                  </div>
                </div>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (_, row) => {
                const color = row.isDelayed ? '#ef4444' : row.isInTransit ? '#3b82f6' : '#10b981'
                const label = row.isDelayed ? 'Delayed' : row.isInTransit ? 'In Transit' : row.status
                return (
                  <span className="fleet-status-pill" style={{
                    background: color + '18', color, border: `1px solid ${color}44`,
                  }}>
                    <span className="fleet-status-dot" style={{ background: color }} />
                    {label}
                  </span>
                )
              },
            },
            {
              key: 'origin',
              label: 'Route',
              render: (_, row) => (
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  <span style={{ color: '#94a3b8' }}>{row.origin}</span>
                  <span style={{ color: '#334155', margin: '0 4px' }}>â†’</span>
                  <span style={{ color: '#94a3b8' }}>{row.destination}</span>
                </span>
              ),
            },
            {
              key: 'locationDisplay',
              label: 'GPS Location',
              render: (_, row) => (
                <span className={`fleet-gps-badge ${row.hasGps ? 'live' : 'offline'}`}>
                  {row.hasGps ? `â— ${row.lat?.toFixed(2)}, ${row.lng?.toFixed(2)}` : 'âœ• No signal'}
                </span>
              ),
            },
            {
              key: 'lastUpdate',
              label: 'Last Update',
              render: (val) => (
                <span style={{ fontSize: 11, color: '#475569', fontFamily: "inherit" }}>
                  {val !== '--' ? val : 'N/A'}
                </span>
              ),
            },
          ]}
          rows={filteredVehicles}
          emptyMessage="No vehicles found"
          rowProps={(row) => ({
            className: `fleet-row-clickable ${selectedVehicle?.id === row.id ? 'selected' : ''}`,
            onClick: () => setSelectedVehicle(prev => prev?.id === row.id ? null : row),
          })}
        />
      </section>

      {/* Overlay + panel */}
      {selectedVehicle && (
        <>
          <div className="fleet-overlay" onClick={() => setSelectedVehicle(null)} />
          <DriverDetailPanel vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
        </>
      )}
    </>
  )
}

export default FleetManager


