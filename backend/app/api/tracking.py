from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.middleware import require_roles
from app.models.user import UserRole
from app.services.ai_service import predict_delay_risk
from app.services.notification_service import notification_service
from app.services.state_service import shipments

router = APIRouter(prefix="/tracking", tags=["tracking"])


class ShipmentCreateRequest(BaseModel):
    shipment_id: str
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    status: str = "created"


class ShipmentLocationUpdateRequest(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    status: str = "in_transit"


class DelayRiskRequest(BaseModel):
    distance_km: float = Field(gt=0)
    weather_score: float = Field(ge=0, le=1)
    traffic_score: float = Field(ge=0, le=1)


def get_shipments_snapshot() -> dict:
    return shipments


def _trend_labels(points: int) -> list[str]:
    if points == 7:
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return [f"D-{points - idx}" for idx in range(points)]


def _status_text(value: object) -> str:
    return str(value or "unknown").replace("_", " ").strip().lower()


def _as_float(value: object) -> float | None:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed


def _has_gps_signal(data: dict) -> bool:
    lat = _as_float(data.get("lat"))
    lng = _as_float(data.get("lng"))
    return lat is not None and lng is not None


def _timestamp_epoch(value: object) -> float:
    raw = str(value or "").strip()
    if not raw:
        return 0.0
    try:
        normalized = raw.replace("Z", "+00:00")
        return datetime.fromisoformat(normalized).timestamp()
    except ValueError:
        return 0.0


def build_tracking_analytics_snapshot(shipment_data: dict[str, dict], time_range: str = "7d") -> dict:
    points = 30 if time_range == "30d" else 7
    labels = _trend_labels(points)
    shipment_rows = list((shipment_data or {}).values())
    total_shipments = len(shipment_rows)

    delayed = 0
    in_transit = 0
    completed_by_status = 0
    active_vehicles = 0
    pending_assignments = 0

    for item in shipment_rows:
        status = _status_text(item.get("status"))
        if "delay" in status:
            delayed += 1
        if "transit" in status:
            in_transit += 1
        if "deliver" in status or "complete" in status:
            completed_by_status += 1
        if _has_gps_signal(item):
            active_vehicles += 1

        assignment_status = str(item.get("assignmentStatus") or item.get("assignment", {}).get("status") or "").lower()
        if "pending" in assignment_status or "unassigned" in assignment_status:
            pending_assignments += 1

    completed = completed_by_status if completed_by_status else max(total_shipments - delayed - in_transit, 0)
    gps_offline = max(total_shipments - active_vehicles, 0)

    baseline = max(total_shipments, 1) * 16
    momentum = max(in_transit + completed, 1)
    delay_penalty = delayed * 2
    delivery_trends = [
        {
            "label": labels[index],
            "value": max(0, round(baseline + (index * (momentum * 0.55)) - delay_penalty + ((index % 3) - 1) * 2)),
        }
        for index in range(points)
    ]

    if total_shipments == 0:
        projected = 0
    else:
        growth_delta = max(1, round((momentum - delayed) * 0.35))
        projected = max(total_shipments, total_shipments + growth_delta)

    forecast_series = [
        {"label": "Today", "value": total_shipments},
        {"label": "D+1", "value": round(total_shipments + (projected - total_shipments) * 0.34)},
        {"label": "D+2", "value": round(total_shipments + (projected - total_shipments) * 0.68)},
        {"label": "D+3", "value": projected},
    ]

    trend_percent = 0
    if total_shipments > 0:
        trend_percent = round(((projected - total_shipments) / total_shipments) * 100)

    delay_rate = 0
    if total_shipments > 0:
        delay_rate = round((delayed / total_shipments) * 100)

    return {
        "deliveryTrends": delivery_trends,
        "statusData": [
            {"label": "In Transit", "value": in_transit, "color": "#0ea5e9"},
            {"label": "Delayed", "value": delayed, "color": "#f97316"},
            {"label": "Completed", "value": completed, "color": "#22c55e"},
            {"label": "GPS Offline", "value": gps_offline, "color": "#64748b"},
        ],
        "forecast": {
            "today": total_shipments,
            "projected": projected,
            "trend": f"{trend_percent:+d}%",
            "series": forecast_series,
        },
        "summary": {
            "totalShipments": total_shipments,
            "activeVehicles": active_vehicles,
            "inTransit": in_transit,
            "delayed": delayed,
            "completed": completed,
            "gpsOffline": gps_offline,
            "pendingAssignments": pending_assignments,
            "delayRate": delay_rate,
        },
    }


def build_tracking_alerts(shipment_data: dict[str, dict]) -> list[dict]:
    alerts: list[dict] = []
    generated_at = datetime.now(timezone.utc).isoformat()

    for shipment_id, item in (shipment_data or {}).items():
        status = _status_text(item.get("status"))
        origin = str(item.get("origin") or "Unknown origin")
        destination = str(item.get("destination") or "Unknown destination")
        timestamp = str(item.get("timestamp") or generated_at)

        if "delay" in status:
            alerts.append(
                {
                    "id": f"{shipment_id}:delay",
                    "shipmentId": shipment_id,
                    "severity": "critical",
                    "title": "Delay alert",
                    "message": f"{shipment_id} is delayed on route {origin} to {destination}.",
                    "timestamp": timestamp,
                }
            )

        if not _has_gps_signal(item):
            alerts.append(
                {
                    "id": f"{shipment_id}:gps",
                    "shipmentId": shipment_id,
                    "severity": "warning",
                    "title": "GPS signal missing",
                    "message": f"{shipment_id} has no live GPS signal.",
                    "timestamp": timestamp,
                }
            )

        assignment_status = str(item.get("assignmentStatus") or item.get("assignment", {}).get("status") or "").lower()
        if "pending" in assignment_status or "unassigned" in assignment_status:
            alerts.append(
                {
                    "id": f"{shipment_id}:assignment",
                    "shipmentId": shipment_id,
                    "severity": "info",
                    "title": "Pending assignment",
                    "message": f"{shipment_id} is pending transporter assignment.",
                    "timestamp": timestamp,
                }
            )

    severity_rank = {"critical": 0, "warning": 1, "info": 2}
    alerts.sort(
        key=lambda event: (
            severity_rank.get(str(event.get("severity")), 9),
            -_timestamp_epoch(event.get("timestamp")),
        )
    )
    return alerts


def get_tracking_socket_payload(time_range: str = "7d") -> dict:
    snapshot = get_shipments_snapshot()
    return {
        "type": "gps:update",
        "shipments": snapshot,
        "analytics": build_tracking_analytics_snapshot(snapshot, time_range=time_range),
        "alerts": build_tracking_alerts(snapshot),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/shipments", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer))])
def create_shipment(data: ShipmentCreateRequest) -> dict:
    if data.shipment_id in shipments:
        raise HTTPException(status_code=409, detail="Shipment ID already exists")

    shipments[data.shipment_id] = {
        "lat": data.lat,
        "lng": data.lng,
        "status": data.status,
    }
    return {"shipment_id": data.shipment_id, **shipments[data.shipment_id]}


@router.patch("/shipments/{shipment_id}", dependencies=[Depends(require_roles(UserRole.admin, UserRole.transporter))])
def update_shipment_location(shipment_id: str, data: ShipmentLocationUpdateRequest) -> dict:
    shipment = shipments.get(shipment_id)
    if shipment is None:
        raise HTTPException(status_code=404, detail="Shipment not found")

    shipment.update({"lat": data.lat, "lng": data.lng, "status": data.status})
    notification_service.publish(
        user_id="tracking",
        title="Shipment updated",
        message=f"Shipment {shipment_id} is now {data.status}",
    )
    return {"shipment_id": shipment_id, **shipment}


@router.get("/live-gps", dependencies=[Depends(require_roles(UserRole.admin, UserRole.transporter, UserRole.dealer, UserRole.retail_shop))])
def get_live_gps() -> dict:
    return {"shipments": shipments}


@router.get("/map", dependencies=[Depends(require_roles(UserRole.admin, UserRole.transporter, UserRole.dealer, UserRole.retail_shop))])
def get_map_data() -> dict:
    points = [
        {"shipment_id": shipment_id, **data}
        for shipment_id, data in shipments.items()
    ]
    return {"center": {"lat": 20.5937, "lng": 78.9629}, "points": points}


@router.post("/ai-delay-risk", dependencies=[Depends(require_roles(UserRole.admin, UserRole.transporter, UserRole.dealer))])
def ai_delay_risk(data: DelayRiskRequest) -> dict:
    risk = predict_delay_risk(
        distance_km=data.distance_km,
        weather_score=data.weather_score,
        traffic_score=data.traffic_score,
    )
    return {"delay_risk": risk}


@router.get(
    "/analytics",
    dependencies=[Depends(require_roles(UserRole.admin, UserRole.transporter, UserRole.dealer, UserRole.retail_shop))],
)
def tracking_analytics(time_range: str = Query("7d", alias="range")) -> dict:
    return build_tracking_analytics_snapshot(shipments, time_range=time_range)
