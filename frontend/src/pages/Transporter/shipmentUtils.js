// ─── Partner Logo Generator ───────────────────────────────────────────────────
function makePartnerLogo(name, bg = '#0e7490', fg = '#ffffff') {
  const initials = getInitials(name)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><rect width='96' height='96' rx='48' fill='${bg}'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='${fg}' font-family='Arial, sans-serif' font-size='34' font-weight='700'>${initials}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// ─── Fallback Partners ────────────────────────────────────────────────────────
const FALLBACK_PARTNERS = [
  {
    name: 'SwiftMove Logistics',
    phone: '+91 90000 12001',
    rating: 4.7,
    logo: makePartnerLogo('SwiftMove Logistics', '#0e7490'),
    // NEW: driver performance fields
    totalTrips: 145,
    onTimeDeliveries: 132,
    delayedDeliveries: 13,
    kmDriven: 42000,
    incidents: 0,
    licenseType: 'HGV',
    licenseExpiry: '2026-06-30',
    joinedDate: '2021-03-15',
    currentSpeed: 68,
    vehicleType: 'Lorry',
  },
  {
    name: 'PrimeRoute Carriers',
    phone: '+91 90000 12002',
    rating: 4.5,
    logo: makePartnerLogo('PrimeRoute Carriers', '#1d4ed8'),
    totalTrips: 98,
    onTimeDeliveries: 90,
    delayedDeliveries: 8,
    kmDriven: 28000,
    incidents: 1,
    licenseType: 'LGV',
    licenseExpiry: '2025-12-15',
    joinedDate: '2022-01-10',
    currentSpeed: 54,
    vehicleType: 'Truck',
  },
  {
    name: 'CargoLink Express',
    phone: '+91 90000 12003',
    rating: 4.6,
    logo: makePartnerLogo('CargoLink Express', '#0f766e'),
    totalTrips: 210,
    onTimeDeliveries: 195,
    delayedDeliveries: 15,
    kmDriven: 68000,
    incidents: 0,
    licenseType: 'Class A',
    licenseExpiry: '2027-03-20',
    joinedDate: '2020-06-01',
    currentSpeed: 0,
    vehicleType: 'Container',
  },
  {
    name: 'TransitEdge Movers',
    phone: '+91 90000 12004',
    rating: 4.4,
    logo: makePartnerLogo('TransitEdge Movers', '#0369a1'),
    totalTrips: 88,
    onTimeDeliveries: 82,
    delayedDeliveries: 6,
    kmDriven: 31000,
    incidents: 0,
    licenseType: 'HGV',
    licenseExpiry: '2026-09-10',
    joinedDate: '2021-07-20',
    currentSpeed: 72,
    vehicleType: 'Mini Truck',
  },
]

// ─── Internal Utilities ───────────────────────────────────────────────────────
function normalizeText(value, fallback = '--') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function normalizeStatus(status) {
  return normalizeText(status, 'unknown').replace(/_/g, ' ')
}

function seedFromId(id) {
  return String(id)
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function getFallbackPartner(id) {
  const index = seedFromId(id) % FALLBACK_PARTNERS.length
  return FALLBACK_PARTNERS[index]
}

function asNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function clampToNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'DP'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export function projectCoordinates(lat, lng) {
  const x = ((lng + 180) / 360) * 100
  const y = ((90 - lat) / 180) * 100
  return { x, y }
}

/**
 * getShipmentDetails
 * Normalizes raw shipment data into a consistent shape used by
 * Shipments.jsx, GPSMap.jsx, FleetManager.jsx, and Analytics.jsx.
 *
 * NEW fields added (used by driver detail panels):
 *   totalTrips, onTimeDeliveries, delayedDeliveries, kmDriven,
 *   incidents, licenseType, licenseExpiry, joinedDate,
 *   currentSpeed, vehicleType, onTimeRate, employeeId,
 *   recentTrips
 */
export function getShipmentDetails(id, item = {}) {
  const fallbackPartner = getFallbackPartner(id)

  // Data source normalization
  const partnerInfo  = item.deliveryPartner ?? item.partner ?? item.partnerDetails ?? {}
  const feedbackInfo = item.feedback ?? item.customerFeedback ?? {}
  const assignmentInfo = item.assignment ?? {}
  const vehicleInfo  = item.vehicle ?? item.vehicleDetails ?? {}
  const driverInfo   = item.driver ?? item.driverDetails ?? {}     // NEW

  // GPS
  const lat    = asNumber(item.lat ?? item.latitude  ?? item.location?.lat)
  const lng    = asNumber(item.lng ?? item.longitude ?? item.location?.lng)
  const hasGps = lat !== null && lng !== null

  // Status flags
  const status      = normalizeStatus(item.status)
  const lowerStatus = status.toLowerCase()
  const isDelayed   = lowerStatus.includes('delay')
  const isInTransit = lowerStatus.includes('transit')
  const isDelivered = lowerStatus.includes('deliver') || lowerStatus.includes('complete')

  // Partner / Driver identity
  const partnerName = normalizeText(
    partnerInfo.name ?? item.partnerName ?? item.carrier ?? item.driverName ?? fallbackPartner.name,
    'Unassigned Partner',
  )

  const partnerPhone = normalizeText(
    partnerInfo.phone ?? partnerInfo.contact ?? item.partnerPhone ?? item.driverPhone ?? fallbackPartner.phone,
    '--',
  )

  const ratingRaw   = partnerInfo.rating ?? item.partnerRating ?? feedbackInfo.rating ?? fallbackPartner.rating
  const partnerRating = Number.isFinite(Number(ratingRaw)) ? Number(ratingRaw).toFixed(1) : '--'

  const partnerLogo = normalizeText(
    partnerInfo.logo    ?? partnerInfo.logoUrl ?? partnerInfo.image ??
    partnerInfo.avatar  ?? item.partnerLogo    ?? item.partner_logo ??
    item.logo           ?? fallbackPartner.logo,
    '',
  )

  // Assignment & vehicle
  const assignmentStatus = normalizeText(
    assignmentInfo.status ?? item.assignmentStatus ?? item.assignedTo ??
    (partnerName !== 'Unassigned Partner' ? 'Assigned' : 'Pending Assignment'),
    'Pending Assignment',
  )

  const vehicleNumber = normalizeText(
    vehicleInfo.number ?? item.vehicleNumber ?? item.truckNumber ?? item.lorryNumber ??
    `TRK-${String(id).replace(/\D/g, '').slice(-4).padStart(4, '0')}`,
    '--',
  )

  // Feedback
  const feedbackMessage = normalizeText(
    feedbackInfo.comment ?? feedbackInfo.message ?? item.deliveryFeedback ??
    (isDelayed    ? 'Delay reported by partner.'          :
     isDelivered  ? 'Delivered safely to destination.'    :
                    'Shipment moving on planned route.'),
    '--',
  )

  // ── NEW: Driver performance fields ────────────────────────────────────────
  // Priority: item.driver / item.driverDetails → item root → fallback partner defaults

  const totalTrips = clampToNumber(
    driverInfo.totalTrips ?? item.totalTrips ?? fallbackPartner.totalTrips, 0,
  )
  const onTimeDeliveries = clampToNumber(
    driverInfo.onTimeDeliveries ?? item.onTimeDeliveries ?? fallbackPartner.onTimeDeliveries, 0,
  )
  const delayedDeliveries = clampToNumber(
    driverInfo.delayedDeliveries ?? driverInfo.delayed ?? item.delayedDeliveries ?? fallbackPartner.delayedDeliveries, 0,
  )
  const kmDriven = clampToNumber(
    driverInfo.kmDriven ?? driverInfo.totalKm ?? item.kmDriven ?? item.totalKmDriven ?? fallbackPartner.kmDriven, 0,
  )
  const incidents = clampToNumber(
    driverInfo.incidents ?? item.incidents ?? fallbackPartner.incidents, 0,
  )
  const onTimeRate = totalTrips > 0 ? Math.round((onTimeDeliveries / totalTrips) * 100) : null

  // License
  const licenseType = normalizeText(
    driverInfo.licenseType ?? item.licenseType ?? fallbackPartner.licenseType, '--',
  )
  const licenseExpiry = normalizeText(
    driverInfo.licenseExpiry ?? item.licenseExpiry ?? fallbackPartner.licenseExpiry, '--',
  )
  const joinedDate = normalizeText(
    driverInfo.joinedDate ?? driverInfo.joined ?? item.joinedDate ?? fallbackPartner.joinedDate, '--',
  )
  const employeeId = normalizeText(
    driverInfo.employeeId ?? driverInfo.empId ?? item.employeeId ??
    `EMP-${String(id).replace(/\D/g, '').slice(-4).padStart(4, '0')}`,
    '--',
  )

  // Live speed (km/h) — 0 if stationary / delayed / no data
  const currentSpeed = isDelayed
    ? 0
    : clampToNumber(
        driverInfo.currentSpeed ?? driverInfo.speed ?? item.currentSpeed ?? item.speedKmh ??
        (isInTransit ? fallbackPartner.currentSpeed : 0),
        0,
      )

  // Vehicle type label
  const vehicleType = normalizeText(
    vehicleInfo.type ?? vehicleInfo.vehicleType ?? item.vehicleType ?? fallbackPartner.vehicleType,
    'Vehicle',
  )

  // Recent trips array — used by driver panel trip history tab
  // Accepts item.recentTrips or item.tripHistory as an array, else empty
  const recentTrips = Array.isArray(item.recentTrips ?? item.tripHistory)
    ? (item.recentTrips ?? item.tripHistory).slice(0, 8).map((t, i) => ({
        id:            t.id            ?? `T-${i + 1}`,
        startLocation: normalizeText(t.startLocation ?? t.from  ?? t.origin,      'N/A'),
        endLocation:   normalizeText(t.endLocation   ?? t.to    ?? t.destination, 'N/A'),
        startTime:     normalizeText(t.startTime     ?? t.start ?? t.date,        '--'),
        endTime:       normalizeText(t.endTime       ?? t.end,                     '--'),
        distanceKm:    clampToNumber(t.distanceKm    ?? t.distance,               0),
        durationMin:   clampToNumber(t.durationMin   ?? t.duration,               0),
        onTime:        t.onTime ?? !t.delayed,
        delayMinutes:  clampToNumber(t.delayMinutes  ?? t.delay,                  0),
        rating:        clampToNumber(t.rating,                                     0),
      }))
    : []

  // ── Return normalized shape ────────────────────────────────────────────────
  return {
    // Core shipment fields (unchanged — existing components rely on these)
    id:               normalizeText(id),
    origin:           normalizeText(item.origin      ?? item.source ?? item.from, 'N/A'),
    destination:      normalizeText(item.destination ?? item.to,                  'N/A'),
    status,
    eta:              normalizeText(item.eta ?? item.estimatedArrival ?? item.deliveryDate),
    weight:           normalizeText(item.weight ?? item.weightKg ?? item.loadWeight, '--'),
    partnerName,
    partnerPhone,
    partnerLogo,
    partnerRating,
    assignmentStatus,
    vehicleNumber,
    feedbackMessage,
    liveTracking:     hasGps
      ? `Live (${lat.toFixed(3)}, ${lng.toFixed(3)})`
      : 'Signal unavailable',
    hasGps,
    lat,
    lng,
    isDelayed,
    isInTransit,
    isDelivered,
    lastUpdate:       normalizeText(item.timestamp ?? item.updatedAt ?? item.lastUpdate),

    // NEW: Driver performance & identity (used by detail panels)
    totalTrips,
    onTimeDeliveries,
    delayedDeliveries,
    kmDriven,
    incidents,
    onTimeRate,          // 0–100 percent, or null if no trips
    licenseType,
    licenseExpiry,
    joinedDate,
    employeeId,
    currentSpeed,        // km/h, 0 if stationary
    vehicleType,
    recentTrips,         // array of trip objects for history table
  }
}

// ─── Batch helper ─────────────────────────────────────────────────────────────
export function toShipmentRows(shipments = {}) {
  return Object.entries(shipments || {}).map(([id, item]) => getShipmentDetails(id, item))
}

// ─── Analytics ────────────────────────────────────────────────────────────────

function trendLabelsForRange(timeRange = '7d') {
  if (String(timeRange).toLowerCase() === '30d') {
    return Array.from({ length: 30 }, (_, i) => `D-${30 - i}`)
  }
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
}

function normalizeChartPoints(points = []) {
  return points
    .map((point, i) => ({
      label: String(point?.label ?? `${i + 1}`),
      value: clampToNumber(point?.value ?? point, NaN),
    }))
    .filter(p => Number.isFinite(p.value))
}

function normalizeStatusDonutData(values = []) {
  return values
    .map(item => ({
      label: String(item?.label ?? 'Unknown'),
      value: Math.max(0, clampToNumber(item?.value ?? 0, 0)),
      color: item?.color || '#0ea5e9',
    }))
    .filter(item => Number.isFinite(item.value))
}

export function computeTransportMetrics(shipments = {}) {
  const rows               = toShipmentRows(shipments)
  const totalShipments     = rows.length
  const delayed            = rows.filter(r => r.isDelayed).length
  const inTransit          = rows.filter(r => r.isInTransit && !r.isDelivered).length
  const completed          = rows.filter(r => r.isDelivered).length
  const activeVehicles     = rows.filter(r => r.hasGps).length
  const gpsOffline         = totalShipments - activeVehicles
  const pendingAssignments = rows.filter(r =>
    String(r.assignmentStatus || '').toLowerCase().includes('pending'),
  ).length
  const onTimeDeliveries   = Math.max(totalShipments - delayed, 0)
  const liveGpsPings       = activeVehicles * 30
  const delayRate          = totalShipments > 0 ? Math.round((delayed / totalShipments) * 100) : 0

  // NEW: fleet-wide driver performance aggregates
  const totalFleetTrips    = rows.reduce((s, r) => s + r.totalTrips, 0)
  const totalFleetOT       = rows.reduce((s, r) => s + r.onTimeDeliveries, 0)
  const totalFleetKm       = rows.reduce((s, r) => s + r.kmDriven, 0)
  const fleetOnTimeRate    = totalFleetTrips > 0
    ? Math.round((totalFleetOT / totalFleetTrips) * 100)
    : null
  const avgRating          = rows.length > 0
    ? parseFloat(
        (rows.reduce((s, r) => s + parseFloat(r.partnerRating) || 0, 0) / rows.length).toFixed(1),
      )
    : null

  return {
    rows,
    totalShipments,
    delayed,
    inTransit,
    completed,
    activeVehicles,
    gpsOffline,
    pendingAssignments,
    onTimeDeliveries,
    liveGpsPings,
    delayRate,
    // NEW
    totalFleetTrips,
    totalFleetKm,
    fleetOnTimeRate,
    avgRating,
  }
}

export function deriveTransportAnalytics(shipments = {}, timeRange = '7d') {
  const metrics      = computeTransportMetrics(shipments)
  const labels       = trendLabelsForRange(timeRange)
  const baseline     = metrics.totalShipments > 0 ? Math.max(metrics.totalShipments * 16, 8) : 0
  const momentum     = Math.max(metrics.inTransit + metrics.completed, 1)
  const delayPenalty = metrics.delayed * 2

  const deliveryTrends = labels.map((label, i) => ({
    label,
    value: Math.max(
      0,
      Math.round(baseline + (i * (momentum * 0.55)) - delayPenalty + ((i % 3) - 1) * 2),
    ),
  }))

  const projected = metrics.totalShipments > 0
    ? Math.max(
        metrics.totalShipments,
        metrics.totalShipments + Math.max(1, Math.round((momentum - metrics.delayed) * 0.35)),
      )
    : 0

  const forecastSeries = [
    { label: 'Today', value: metrics.totalShipments },
    { label: 'D+1',   value: Math.round(metrics.totalShipments + (projected - metrics.totalShipments) * 0.34) },
    { label: 'D+2',   value: Math.round(metrics.totalShipments + (projected - metrics.totalShipments) * 0.68) },
    { label: 'D+3',   value: projected },
  ]

  const trendPercent = metrics.totalShipments > 0
    ? Math.round(((projected - metrics.totalShipments) / metrics.totalShipments) * 100)
    : 0

  return {
    deliveryTrends,
    statusData: [
      { label: 'In Transit', value: metrics.inTransit,      color: '#0ea5e9' },
      { label: 'Delayed',    value: metrics.delayed,         color: '#f97316' },
      { label: 'Completed',  value: metrics.completed,       color: '#22c55e' },
      { label: 'GPS Offline',value: metrics.gpsOffline,      color: '#64748b' },
    ],
    forecast: {
      today:     metrics.totalShipments,
      projected,
      trend:     `${trendPercent >= 0 ? '+' : ''}${trendPercent}%`,
      series:    forecastSeries,
    },
    summary: {
      totalShipments:     metrics.totalShipments,
      activeVehicles:     metrics.activeVehicles,
      inTransit:          metrics.inTransit,
      delayed:            metrics.delayed,
      completed:          metrics.completed,
      gpsOffline:         metrics.gpsOffline,
      pendingAssignments: metrics.pendingAssignments,
      delayRate:          metrics.delayRate,
      // NEW: exposed in summary for dashboard stat cards
      fleetOnTimeRate:    metrics.fleetOnTimeRate,
      totalFleetKm:       metrics.totalFleetKm,
      avgDriverRating:    metrics.avgRating,
    },
  }
}

function asTimestamp(value) {
  const epoch = Date.parse(String(value || ''))
  return Number.isFinite(epoch) ? epoch : 0
}

export function buildTransportAlerts(shipments = {}) {
  const rows   = toShipmentRows(shipments)
  const alerts = []

  rows.forEach(row => {
    const timestamp = row.lastUpdate && row.lastUpdate !== '--' ? row.lastUpdate : ''

    if (row.isDelayed) {
      alerts.push({
        id:         `${row.id}:delay`,
        shipmentId: row.id,
        severity:   'critical',
        title:      'Delay alert',
        message:    `${row.id} is delayed on route ${row.origin} to ${row.destination}.`,
        timestamp,
      })
    }
    if (!row.hasGps) {
      alerts.push({
        id:         `${row.id}:gps`,
        shipmentId: row.id,
        severity:   'warning',
        title:      'GPS signal missing',
        message:    `${row.id} has no live GPS signal.`,
        timestamp,
      })
    }
    if (String(row.assignmentStatus || '').toLowerCase().includes('pending')) {
      alerts.push({
        id:         `${row.id}:assignment`,
        shipmentId: row.id,
        severity:   'info',
        title:      'Pending assignment',
        message:    `${row.id} is pending transporter assignment.`,
        timestamp,
      })
    }
    // NEW: license expiry warning
    if (row.licenseExpiry && row.licenseExpiry !== '--') {
      const daysUntilExpiry = (Date.parse(row.licenseExpiry) - Date.now()) / 86400000
      if (daysUntilExpiry < 60 && daysUntilExpiry > 0) {
        alerts.push({
          id:         `${row.id}:license`,
          shipmentId: row.id,
          severity:   'warning',
          title:      'License expiring soon',
          message:    `Driver for ${row.id} license expires on ${row.licenseExpiry} (${Math.round(daysUntilExpiry)} days).`,
          timestamp,
        })
      }
    }
  })

  const rank = { critical: 0, warning: 1, info: 2 }
  alerts.sort((a, b) => {
    const d = (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9)
    return d !== 0 ? d : asTimestamp(b.timestamp) - asTimestamp(a.timestamp)
  })

  return alerts
}

export function normalizeAnalyticsPayload(analyticsData = {}, shipments = {}, timeRange = '7d') {
  const derived = deriveTransportAnalytics(shipments, timeRange)

  const deliveryTrends = Array.isArray(analyticsData?.deliveryTrends) && analyticsData.deliveryTrends.length
    ? normalizeChartPoints(analyticsData.deliveryTrends)
    : derived.deliveryTrends

  const statusData = Array.isArray(analyticsData?.statusData) && analyticsData.statusData.length
    ? normalizeStatusDonutData(analyticsData.statusData)
    : derived.statusData

  const fallbackForecast = derived.forecast
  const forecastInput    = analyticsData?.forecast || {}
  const forecastSeries   = Array.isArray(forecastInput.series) && forecastInput.series.length
    ? normalizeChartPoints(forecastInput.series)
    : fallbackForecast.series

  const forecast = {
    today:     clampToNumber(forecastInput.today,     fallbackForecast.today),
    projected: clampToNumber(forecastInput.projected, fallbackForecast.projected),
    trend:     String(forecastInput.trend ?? fallbackForecast.trend),
    series:    forecastSeries,
  }

  const summary = {
    ...(derived.summary  || {}),
    ...(analyticsData?.summary || {}),
  }

  return { deliveryTrends, statusData, forecast, summary }
}
