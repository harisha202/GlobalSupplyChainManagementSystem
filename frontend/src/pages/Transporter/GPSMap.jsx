import { useMemo, useState } from 'react'
import LorryIcon from './LorryIcon'
import { projectCoordinates, toShipmentRows } from './shipmentUtils'

// â”€â”€â”€ Location / Destination Pin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LocationPin({ color = '#ef4444', size = 28, pulse = false }) {
  return (
    <div style={{ position: 'relative', width: size, height: size + 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {pulse && (
        <div style={{
          position: 'absolute', top: '30%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 2, height: size * 2, borderRadius: '50%',
          background: color, opacity: 0.18,
          animation: 'gpsMapPulse 2s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}
      <svg viewBox="0 0 24 28" width={size} height={size + 8} fill="none">
        <path d="M12 0C7.58 0 4 3.58 4 8c0 6 8 16 8 16s8-10 8-16c0-4.42-3.58-8-8-8z" fill={color} />
        <circle cx="12" cy="8" r="3.5" fill="white" />
      </svg>
    </div>
  )
}

// â”€â”€â”€ Star Rating â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Stars({ rating }) {
  const r = parseFloat(rating) || 0
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i <= Math.round(r) ? '#f59e0b' : '#e2e8f0'}
            stroke={i <= Math.round(r) ? '#f59e0b' : '#cbd5e1'}
            strokeWidth="1"
          />
        </svg>
      ))}
      <span style={{ fontSize: 11, color: '#cbd5e1', marginLeft: 3 }}>{r.toFixed(1)}</span>
    </div>
  )
}

// â”€â”€â”€ Driver Detail Side Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DriverPanel({ point, onClose }) {
  const statusColor = point.isDelayed ? '#ef4444' : point.isInTransit ? '#3b82f6' : '#10b981'
  const statusLabel = point.isDelayed ? 'Delayed' : point.isInTransit ? 'In Transit' : 'Delivered'

  return (
    <div className="gps-driver-panel" style={{ animation: 'gpsPanelSlide 0.22s ease' }}>
      {/* Header */}
      <div className="gps-driver-panel-header">
        <div>
          <div className="gps-driver-panel-label">Shipment</div>
          <div className="gps-driver-panel-id">{point.id}</div>
        </div>
        <button className="gps-driver-panel-close" onClick={onClose}>Ã—</button>
      </div>

      {/* Driver Avatar + Name */}
      <div className="gps-driver-identity">
        <div className="gps-driver-avatar">
          {point.partnerLogo
            ? <img src={point.partnerLogo} alt={point.partnerName} className="gps-driver-avatar-img" />
            : <span>{(point.partnerName || 'DP').slice(0, 2).toUpperCase()}</span>
          }
        </div>
        <div>
          <div className="gps-driver-name">{point.partnerName}</div>
          <div className="gps-driver-phone">{point.partnerPhone}</div>
          <Stars rating={point.partnerRating} />
        </div>
      </div>

      {/* Status + Speed */}
      <div className="gps-driver-badges">
        <span className="gps-badge" style={{ background: statusColor + '1a', borderColor: statusColor + '55', color: statusColor }}>
          <span className="gps-badge-dot" style={{ background: statusColor, boxShadow: `0 0 5px ${statusColor}` }} />
          {statusLabel}
        </span>
        {point.hasGps && (
          <span className="gps-badge gps-badge-gps">
            ðŸ“¡ Live GPS
          </span>
        )}
      </div>

      {/* Route */}
      <div className="gps-driver-section">
        <div className="gps-driver-section-title">Route</div>
        <div className="gps-route-row">
          <div className="gps-route-dot gps-route-dot-origin" />
          <div className="gps-route-line">
            <div className="gps-route-line-fill" />
          </div>
          <div className="gps-route-dot gps-route-dot-dest" />
        </div>
        <div className="gps-route-labels">
          <span>{point.origin}</span>
          <span>{point.destination}</span>
        </div>
        <div className="gps-route-meta">
          <span>ETA: <strong>{point.eta}</strong></span>
          <span>Vehicle: <strong>{point.vehicleNumber}</strong></span>
        </div>
      </div>

      {/* GPS Coordinates */}
      {point.hasGps && (
        <div className="gps-driver-section">
          <div className="gps-driver-section-title">Live Location</div>
          <div className="gps-coords">
            <div className="gps-coords-row">
              <span className="gps-coords-label">Lat</span>
              <span className="gps-coords-val">{point.lat?.toFixed(4)}</span>
            </div>
            <div className="gps-coords-row">
              <span className="gps-coords-label">Lng</span>
              <span className="gps-coords-val">{point.lng?.toFixed(4)}</span>
            </div>
            <div className="gps-coords-row">
              <span className="gps-coords-label">Signal</span>
              <span className="gps-coords-val gps-coords-live">â— Live</span>
            </div>
          </div>
        </div>
      )}

      {/* Assignment */}
      <div className="gps-driver-section">
        <div className="gps-driver-section-title">Assignment</div>
        <div className="gps-info-row">
          <span>Status</span>
          <span className={`assignment-chip ${point.assignmentStatus.toLowerCase().includes('pending') ? 'pending' : 'assigned'}`}>
            {point.assignmentStatus}
          </span>
        </div>
        <div className="gps-info-row">
          <span>Last Update</span>
          <span>{point.lastUpdate !== '--' ? point.lastUpdate : 'N/A'}</span>
        </div>
      </div>

      {/* Feedback */}
      <div className="gps-driver-section">
        <div className="gps-driver-section-title">Transport Feedback</div>
        <div className="gps-feedback-msg">{point.feedbackMessage}</div>
      </div>
    </div>
  )
}

// â”€â”€â”€ Main GPSMap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function GPSMap({ shipments = {}, center = [20.5937, 78.9629], zoom = 5 }) {
  const [selectedId, setSelectedId] = useState(null)

  const shipmentRows = useMemo(
    () => toShipmentRows(shipments),
    [shipments],
  )

  const livePoints = useMemo(() =>
    shipmentRows
      .filter(item => item.hasGps)
      .map(item => ({ ...item, ...projectCoordinates(item.lat, item.lng) })),
    [shipmentRows],
  )

  // All unique destinations for pins
  const destPoints = useMemo(() => {
    const seen = new Set()
    return shipmentRows
      .filter(item => item.hasGps && item.destination && item.destination !== 'N/A')
      .filter(item => {
        if (seen.has(item.destination)) return false
        seen.add(item.destination)
        return true
      })
      .map(item => {
        // Approximate destination coords (offset from origin for visual clarity)
        const destLat = (item.lat || 20) + 3.5
        const destLng = (item.lng || 79) + 4.2
        return { ...item, ...projectCoordinates(destLat, destLng) }
      })
  }, [shipmentRows])

  const selectedPoint = livePoints.find(p => p.id === selectedId) || null

  return (
    <>
      <style>{`
        .gps-map-container {
          font-family: inherit;
          position: relative;
          overflow: hidden;
        }

        @keyframes gpsMapPulse {
          0% { transform: translate(-50%,-50%) scale(0.4); opacity: 0.5; }
          100% { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
        }
        @keyframes gpsPanelSlide {
          from { transform: translateX(24px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes lorryFloat {
          0%,100% { transform: translate(-50%,-50%) translateY(0); }
          50% { transform: translate(-50%,-50%) translateY(-4px); }
        }
        @keyframes pinBounce {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes blink {
          0%,100% { opacity: 1; } 50% { opacity: 0.3; }
        }

        .gps-map-wrap {
          position: relative;
          width: 100%;
          height: 420px;
          background: linear-gradient(145deg, #0d1b2a 0%, #0f2942 60%, #0a1f35 100%);
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(56,189,248,0.12);
          box-shadow: inset 0 0 60px rgba(14,165,233,0.04);
        }

        .gps-map-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .gps-map-overlay {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 50%, rgba(14,165,233,0.06) 0%, transparent 65%);
          pointer-events: none;
        }

        /* Route lines (SVG behind markers) */
        .gps-route-svg {
          position: absolute; inset: 0; width: 100%; height: 100%;
          pointer-events: none;
        }

        /* Destination pin */
        .gps-dest-pin {
          position: absolute;
          transform: translateX(-50%);
          cursor: default;
          animation: pinBounce 2.8s ease-in-out infinite;
          filter: drop-shadow(0 4px 8px rgba(239,68,68,0.4));
        }
        .gps-dest-label {
          position: absolute;
          top: calc(100% + 2px);
          left: 50%;
          transform: translateX(-50%);
          font-size: 9px;
          font-weight: 700;
          color: #fca5a5;
          white-space: nowrap;
          letter-spacing: 0.5px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.8);
        }

        /* Shipment marker buttons */
        .gps-lorry-btn {
          position: absolute;
          transform: translate(-50%, -50%);
          background: none; border: none; padding: 0;
          cursor: pointer;
          animation: lorryFloat 3s ease-in-out infinite;
          z-index: 5;
          transition: z-index 0s;
        }
        .gps-location-btn {
          position: absolute;
          transform: translate(-50%, -50%);
          background: none; border: none; padding: 0;
          cursor: pointer;
          animation: pinBounce 2.8s ease-in-out infinite;
          z-index: 5;
          transition: z-index 0s;
        }
        .gps-lorry-btn:focus,
        .gps-location-btn:focus { outline: none; }
        .gps-lorry-btn.selected,
        .gps-location-btn.selected { z-index: 20; }

        .gps-lorry-inner {
          position: relative;
          background: rgba(14,165,233,0.12);
          border: 2px solid rgba(56,189,248,0.35);
          border-radius: 10px;
          padding: 7px 9px;
          backdrop-filter: blur(6px);
          box-shadow: 0 2px 12px rgba(0,0,0,0.35);
          transition: all 0.18s ease;
        }
        .gps-lorry-btn:hover .gps-lorry-inner,
        .gps-lorry-btn.selected .gps-lorry-inner {
          background: rgba(14,165,233,0.28);
          border-color: rgba(56,189,248,0.8);
          box-shadow: 0 0 18px rgba(14,165,233,0.45), 0 4px 16px rgba(0,0,0,0.4);
          transform: scale(1.12);
        }
        .gps-lorry-btn.delayed .gps-lorry-inner {
          background: rgba(239,68,68,0.12);
          border-color: rgba(239,68,68,0.4);
        }
        .gps-lorry-btn.delayed:hover .gps-lorry-inner,
        .gps-lorry-btn.delayed.selected .gps-lorry-inner {
          background: rgba(239,68,68,0.28);
          border-color: rgba(239,68,68,0.85);
          box-shadow: 0 0 18px rgba(239,68,68,0.4), 0 4px 16px rgba(0,0,0,0.4);
        }
        .gps-location-inner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.18s ease;
          filter: drop-shadow(0 3px 8px rgba(14,165,233,0.35));
        }
        .gps-location-btn.delayed .gps-location-inner {
          filter: drop-shadow(0 3px 8px rgba(239,68,68,0.35));
        }
        .gps-location-btn:hover .gps-location-inner,
        .gps-location-btn.selected .gps-location-inner {
          transform: scale(1.08);
        }

        .gps-lorry-icon {
          width: 26px; height: 26px;
          color: #38bdf8;
          display: block;
        }
        .gps-lorry-btn.delayed .gps-lorry-icon { color: #f87171; }
        .gps-lorry-btn.selected .gps-lorry-icon { color: #7dd3fc; }

        /* Speed badge */
        .gps-speed-badge {
          position: absolute;
          top: -8px; right: -8px;
          background: #0ea5e9;
          color: #fff;
          font-size: 8px; font-weight: 800;
          font-family: inherit;
          padding: 2px 5px;
          border-radius: 5px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(14,165,233,0.5);
        }
        .gps-lorry-btn.delayed .gps-speed-badge {
          background: #ef4444;
          box-shadow: 0 2px 6px rgba(239,68,68,0.5);
        }
        .gps-location-btn.delayed .gps-speed-badge {
          background: #ef4444;
          box-shadow: 0 2px 6px rgba(239,68,68,0.5);
        }

        /* Selected glow ring */
        .gps-lorry-glow {
          position: absolute;
          inset: -12px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%);
          animation: gpsMapPulse 2s ease-out infinite;
          pointer-events: none;
        }
        .gps-lorry-btn.delayed .gps-lorry-glow {
          background: radial-gradient(circle, rgba(239,68,68,0.18) 0%, transparent 70%);
        }

        /* Tooltip */
        .gps-lorry-tooltip {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          background: #0f172a;
          border: 1px solid rgba(56,189,248,0.2);
          border-radius: 8px;
          padding: 8px 12px;
          white-space: nowrap;
          font-size: 11px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
          z-index: 50;
        }
        .gps-lorry-btn:hover .gps-lorry-tooltip,
        .gps-location-btn:hover .gps-lorry-tooltip { opacity: 1; }
        .gps-lorry-tooltip::after {
          content: '';
          position: absolute;
          top: 100%; left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: #0f172a;
        }
        .gps-tooltip-id { font-weight: 700; color: #e0f2fe; margin-bottom: 2px; font-family: inherit; font-size: 10px; }
        .gps-tooltip-name { color: #94a3b8; }
        .gps-tooltip-route { color: #38bdf8; font-size: 10px; margin-top: 3px; }

        /* Driver detail panel */
        .gps-driver-panel {
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 320px;
          background: #0c1826;
          border-left: 1px solid rgba(56,189,248,0.12);
          overflow-y: auto;
          z-index: 30;
          font-family: inherit;
        }
        .gps-driver-panel::-webkit-scrollbar { width: 4px; }
        .gps-driver-panel::-webkit-scrollbar-track { background: transparent; }
        .gps-driver-panel::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.2); border-radius: 2px; }

        .gps-driver-panel-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 16px 18px 14px;
          border-bottom: 1px solid rgba(56,189,248,0.08);
        }
        .gps-driver-panel-label {
          font-size: 10px; letter-spacing: 2px; color: #93c5fd;
          text-transform: uppercase; margin-bottom: 3px;
        }
        .gps-driver-panel-id {
          font-size: 14px; font-weight: 700; color: #e0f2fe;
          font-family: inherit;
        }
        .gps-driver-panel-close {
          background: rgba(255,255,255,0.05);
          border: none; color: #64748b;
          width: 28px; height: 28px; border-radius: 7px;
          cursor: pointer; font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .gps-driver-panel-close:hover { background: rgba(239,68,68,0.15); color: #f87171; }

        .gps-driver-identity {
          display: flex; gap: 12px; align-items: center;
          padding: 16px 18px 0;
        }
        .gps-driver-avatar {
          width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 800; color: #fff;
          overflow: hidden;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.2);
        }
        .gps-driver-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .gps-driver-name { font-size: 15px; font-weight: 700; color: #e0f2fe; }
        .gps-driver-phone { font-size: 11px; color: #cbd5e1; margin: 2px 0 5px; }

        .gps-driver-badges {
          display: flex; gap: 8px; flex-wrap: wrap;
          padding: 12px 18px;
        }
        .gps-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 6px;
          border: 1px solid;
          font-size: 11px; font-weight: 600;
        }
        .gps-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          animation: blink 1.5s ease infinite;
        }
        .gps-badge-gps {
          background: rgba(16,185,129,0.1);
          border-color: rgba(16,185,129,0.3);
          color: #34d399;
        }

        .gps-driver-section {
          padding: 12px 18px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .gps-driver-section-title {
          font-size: 10px; letter-spacing: 1.5px; color: #93c5fd;
          text-transform: uppercase; margin-bottom: 10px;
        }

        .gps-route-row {
          display: flex; align-items: center; gap: 6px; margin-bottom: 5px;
        }
        .gps-route-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }
        .gps-route-dot-origin { background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.5); }
        .gps-route-dot-dest { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.5); }
        .gps-route-line {
          flex: 1; height: 2px;
          background: rgba(255,255,255,0.06);
          border-radius: 1px; position: relative; overflow: hidden;
        }
        .gps-route-line-fill {
          position: absolute; top: 0; left: 0;
          height: 100%; width: 55%;
          background: linear-gradient(90deg, #10b981, #0ea5e9);
          border-radius: 1px;
        }
        .gps-route-labels {
          display: flex; justify-content: space-between;
          font-size: 11px; color: #94a3b8; margin-bottom: 8px;
        }
        .gps-route-meta {
          display: flex; justify-content: space-between;
          font-size: 11px; color: #cbd5e1;
        }
        .gps-route-meta strong { color: #94a3b8; }

        .gps-coords {
          background: rgba(14,165,233,0.05);
          border: 1px solid rgba(14,165,233,0.1);
          border-radius: 8px; padding: 10px 12px;
        }
        .gps-coords-row {
          display: flex; justify-content: space-between;
          font-size: 11px; padding: 3px 0;
        }
        .gps-coords-label { color: #cbd5e1; }
        .gps-coords-val { font-family: inherit; color: #7dd3fc; }
        .gps-coords-live { color: #34d399; }

        .gps-info-row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 11px; color: #cbd5e1; padding: 4px 0;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .gps-info-row:last-child { border-bottom: none; }

        .gps-feedback-msg {
          font-size: 12px; color: #dbeafe; line-height: 1.5;
          font-style: italic;
          background: rgba(255,255,255,0.02);
          border-left: 2px solid rgba(14,165,233,0.3);
          padding: 8px 10px; border-radius: 0 6px 6px 0;
        }

        /* Bottom feedback list */
        .gps-feedback-strip {
          margin-top: 12px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .gps-strip-item {
          display: flex; gap: 12px; align-items: flex-start;
          padding: 10px 14px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .gps-strip-item:hover { background: rgba(14,165,233,0.07); border-color: rgba(14,165,233,0.2); }
        .gps-strip-item.active { background: rgba(14,165,233,0.1); border-color: rgba(14,165,233,0.35); }
        .gps-strip-avatar {
          width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #fff;
          overflow: hidden;
        }
        .gps-strip-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .gps-strip-id {
          font-size: 11px; font-weight: 700; color: #7dd3fc;
          font-family: inherit;
        }
        .gps-strip-partner { font-size: 12px; color: #cbd5e1; font-weight: 600; }
        .gps-strip-route { font-size: 11px; color: #cbd5e1; margin-top: 1px; }

        /* Map click hint */
        .gps-map-hint {
          position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
          background: rgba(12,24,38,0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(56,189,248,0.12);
          border-radius: 8px; padding: 7px 16px;
          font-size: 11px; color: #e2e8f0;
          display: flex; align-items: center; gap: 7px;
          pointer-events: none;
          white-space: nowrap;
        }
      `}</style>

      <section className="card gps-map-container" style={{ fontFamily: "inherit" }}>
        {/* Header */}
        <div className="shipments-header">
          <h4 className="card-title">Live GPS Tracking</h4>
          <div className="shipments-controls">
            <span className="tracking-chip live">Active Vehicles: {livePoints.length}</span>
            <span className="tracking-chip">
              Center: {center.join(', ')} | Zoom: {zoom}
            </span>
          </div>
        </div>

        {/* Map */}
        <div className="gps-map-wrap">
          <div className="gps-map-grid" />
          <div className="gps-map-overlay" />

          {/* Route dashed lines (SVG) */}
          <svg className="gps-route-svg">
            {livePoints.map(point => {
              const destPoint = destPoints.find(d => d.destination === point.destination)
              if (!destPoint) return null
              return (
                <line
                  key={`route-${point.id}`}
                  x1={`${point.x}%`} y1={`${point.y}%`}
                  x2={`${destPoint.x}%`} y2={`${destPoint.y}%`}
                  stroke={selectedId === point.id
                    ? (point.isDelayed ? 'rgba(239,68,68,0.5)' : 'rgba(14,165,233,0.5)')
                    : 'rgba(56,189,248,0.08)'}
                  strokeWidth={selectedId === point.id ? 2 : 1}
                  strokeDasharray="6 4"
                />
              )
            })}
          </svg>

          {/* Destination pins */}
          {destPoints.map(point => (
            <div
              key={`dest-${point.id}`}
              className="gps-dest-pin"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                animationDelay: `${parseFloat(point.id) * 0.3 || 0}s`,
              }}
            >
              <LocationPin
                color="#ef4444"
                size={selectedId === point.id ? 32 : 24}
                pulse={selectedId === point.id}
              />
              <div className="gps-dest-label">{point.destination}</div>
            </div>
          ))}

          {/* Shipment markers: lorry icon for live map shipments */}
          {livePoints.map((point, i) => {
            const isSelected = selectedId === point.id
            return (
              <button
                key={point.id}
                type="button"
                className={`gps-lorry-btn ${point.isDelayed ? 'delayed' : ''} ${isSelected ? 'selected' : ''}`}
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  animationDelay: `${i * 0.4}s`,
                }}
                onClick={() => setSelectedId(isSelected ? null : point.id)}
                aria-label={`Shipment ${point.id} â€” ${point.partnerName}`}
              >
                {isSelected && <div className="gps-lorry-glow" />}
                <div className="gps-lorry-inner">
                  <LorryIcon className="gps-lorry-icon" title={`${point.id} — ${point.partnerName}`} />
                  <div className="gps-speed-badge">
                    {point.isDelayed ? 'STOP' : point.isDelivered ? 'DELIVERED' : 'LIVE'}
                  </div>
                </div>

                {/* Hover tooltip */}
                {!isSelected && (
                  <div className="gps-lorry-tooltip">
                    <div className="gps-tooltip-id">{point.id}</div>
                    <div className="gps-tooltip-name">{point.partnerName}</div>
                    <div className="gps-tooltip-route">{point.origin} â†’ {point.destination}</div>
                  </div>
                )}
              </button>
            )
          })}

          {/* Click hint */}
          {!selectedId && livePoints.length > 0 && (
            <div className="gps-map-hint">
              <LorryIcon style={{ width: 14, height: 14, color: '#0ea5e9' }} />
              Click a marker to view driver & shipment details
            </div>
          )}

          {/* Driver detail panel */}
          {selectedPoint && (
            <DriverPanel point={selectedPoint} onClose={() => setSelectedId(null)} />
          )}
        </div>

        {/* Feedback strip (all shipments) */}
        <div className="gps-feedback-strip">
          {shipmentRows.map(item => (
            <div
              key={item.id}
              className={`gps-strip-item ${selectedId === item.id ? 'active' : ''}`}
              onClick={() => {
                if (item.hasGps) setSelectedId(prev => prev === item.id ? null : item.id)
              }}
            >
              <div className="gps-strip-avatar">
                {item.partnerLogo
                  ? <img src={item.partnerLogo} alt={item.partnerName} />
                  : (item.partnerName || 'DP').slice(0, 2).toUpperCase()
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="gps-strip-id">{item.id}</span>
                  <span className={`assignment-chip ${item.assignmentStatus.toLowerCase().includes('pending') ? 'pending' : 'assigned'}`}>
                    {item.assignmentStatus}
                  </span>
                </div>
                <div className="gps-strip-partner">{item.partnerName}</div>
                <div className="gps-strip-route">
                  {item.origin} â†’ {item.destination}
                  {' Â· '}
                  <span style={{ color: item.hasGps ? '#34d399' : '#64748b' }}>
                    {item.liveTracking}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default GPSMap



