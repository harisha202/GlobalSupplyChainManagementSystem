from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query

from app.core.middleware import require_roles
from app.models.user import UserRole
from app.services.state_service import products, shipments

router = APIRouter(prefix="/dealer", tags=["dealer"])


def _inventory_items() -> list[dict]:
    items: list[dict] = []
    for index, product in enumerate(products, start=1):
        quantity = int(product.get("quantity", 0))
        min_stock = max(25, int(quantity * 0.3))
        max_stock = max(quantity, min_stock + 100)
        if quantity <= max(10, int(min_stock * 0.4)):
            stock_status = "Out of Stock" if quantity == 0 else "Low Stock"
        elif quantity <= min_stock:
            stock_status = "Low Stock"
        else:
            stock_status = "In Stock"

        category = (
            "Medicines"
            if "IV" in str(product.get("sku", ""))
            else "Surgical Supplies"
            if "KIT" in str(product.get("sku", ""))
            else "Medical Devices"
        )

        last_restocked = (datetime.now(timezone.utc) - timedelta(days=index * 2)).date().isoformat()
        items.append(
            {
                "id": index,
                "sku": product.get("sku", f"SKU-{index:03d}"),
                "productName": product.get("name", f"Product {index}"),
                "category": category,
                "manufacturer": "Global Supply Manufacturer",
                "currentStock": quantity,
                "minStock": min_stock,
                "maxStock": max_stock,
                "unitPrice": float(product.get("price", 0.0)),
                "stockStatus": stock_status,
                "lastRestocked": last_restocked,
            }
        )
    return items


def _arrivals() -> list[dict]:
    mapped: list[dict] = []
    for index, (shipment_id, data) in enumerate(shipments.items(), start=1):
        status = str(data.get("status", "in_transit"))
        if "delay" in status:
            ui_status = "Delayed"
            progress = 40
        elif "transit" in status:
            ui_status = "In Transit"
            progress = 70
        else:
            ui_status = "Arriving Today"
            progress = 95

        eta_text = str(data.get("eta") or "").strip()
        if eta_text and len(eta_text) >= 10:
            estimated_arrival = eta_text[:10]
        else:
            estimated_arrival = (datetime.now(timezone.utc) + timedelta(days=index)).date().isoformat()

        mapped.append(
            {
                "id": index,
                "shipmentId": shipment_id,
                "orderId": f"DL-{3300 + index}",
                "manufacturer": "Global Supply Manufacturer",
                "carrier": "Prime Logistics",
                "origin": str(data.get("origin") or "Origin Unavailable"),
                "destination": str(data.get("destination") or "Destination Unavailable"),
                "status": ui_status,
                "estimatedArrival": estimated_arrival,
                "currentLocation": f"{data.get('lat')}, {data.get('lng')}",
                "progress": progress,
                "blockchainVerified": True,
                "items": 50 + index * 10,
            }
        )
    return mapped


@router.get(
    "/orders/recent",
    dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))],
)
def recent_orders() -> dict:
    recent = sorted(
        shipments.items(),
        key=lambda item: str(item[1].get("timestamp") or ""),
        reverse=True,
    )

    orders: list[dict] = []
    for index, (shipment_id, data) in enumerate(recent, start=1):
        status_text = str(data.get("status", "")).lower()
        if "delay" in status_text:
            order_status = "Pending"
        elif "transit" in status_text:
            order_status = "Dispatched"
        else:
            order_status = "Delivered"

        weight = float(data.get("weight") or 0.0)
        amount_value = max(850.0, round(weight * 2.15, 2))

        ts = str(data.get("timestamp") or "").replace("Z", "+00:00")
        try:
            order_date = datetime.fromisoformat(ts).date().isoformat()
        except ValueError:
            order_date = "2026-02-24"

        retailer = str(data.get("destination") or "Retail Partner").split(",")[0].strip() or "Retail Partner"
        orders.append(
            {
                "orderId": f"DL-{3300 + index}",
                "retailer": retailer,
                "amount": f"${amount_value:,.2f}",
                "status": order_status,
                "date": order_date,
                "shipmentId": shipment_id,
            }
        )

    return {"orders": orders[:10]}


@router.get(
    "/orders/trends",
    dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))],
)
def order_trends() -> dict:
    delayed = sum(1 for data in shipments.values() if "delay" in str(data.get("status", "")).lower())
    in_transit = sum(1 for data in shipments.values() if "transit" in str(data.get("status", "")).lower())
    completed = max(len(shipments) - delayed - in_transit, 0)

    base = max((in_transit * 5) + (completed * 6) - (delayed * 2), 4)
    trends = [
        max(0, base + ((index % 3) - 1) * 2 + (index // 2))
        for index in range(7)
    ]
    return {"trends": trends}


@router.get(
    "/low-stock",
    dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))],
)
def low_stock_alerts() -> dict:
    items = [item for item in _inventory_items() if item["stockStatus"] != "In Stock"]
    return {"items": items}


@router.get(
    "/inventory",
    dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))],
)
def inventory() -> dict:
    return {"items": _inventory_items()}


@router.get(
    "/arrivals",
    dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))],
)
def arrivals() -> dict:
    return {"shipments": _arrivals()}


@router.get(
    "/analytics",
    dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))],
)
def analytics(time_range: str = Query("30d", alias="range")) -> dict:
    points = 7 if time_range == "7d" else 90 if time_range == "90d" else 30
    inventory_items = _inventory_items()
    delayed_count = sum(1 for data in shipments.values() if "delay" in str(data.get("status", "")).lower())
    in_transit_count = sum(1 for data in shipments.values() if "transit" in str(data.get("status", "")).lower())
    delivered_count = max(len(shipments) - delayed_count - in_transit_count, 0)
    inventory_value = sum(float(item["unitPrice"]) * int(item["currentStock"]) for item in inventory_items)

    revenue_base = max(inventory_value * 0.012, 420.0)
    flow_factor = (delivered_count * 35.0) + (in_transit_count * 22.0) - (delayed_count * 14.0)
    revenue = [
        max(0.0, round(revenue_base + (index * max(flow_factor / max(points, 1), 4.0)) + ((index % 4) - 1.5) * 18.0, 2))
        for index in range(points)
    ]

    category_counts: dict[str, int] = {}
    for item in inventory_items:
        category = str(item.get("category") or "Other")
        category_counts[category] = category_counts.get(category, 0) + int(item.get("currentStock", 0))

    top_products = [
        {
            "label": category,
            "value": value,
            "color": color,
        }
        for (category, value), color in zip(
            sorted(category_counts.items(), key=lambda kv: kv[1], reverse=True),
            ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#0ea5e9"],
        )
    ]

    return {
        "revenue": revenue,
        "topProducts": top_products,
        "orderStatus": [
            {"label": "Delivered", "value": delivered_count, "color": "#22c55e"},
            {"label": "Dispatched", "value": in_transit_count, "color": "#0ea5e9"},
            {"label": "Pending", "value": delayed_count, "color": "#f59e0b"},
        ],
        "categoryMix": top_products,
    }
