from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.core.middleware import require_roles
from app.models.user import UserRole
from app.services.state_service import products

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get(
    "",
    dependencies=[
        Depends(
            require_roles(
                UserRole.admin,
                UserRole.retail_shop,
                UserRole.dealer,
                UserRole.manufacturer,
            )
        )
    ],
)
def get_inventory() -> dict:
    product_rows = []
    total_stock = 0
    total_inventory_value = 0.0
    for index, item in enumerate(products, start=1):
        quantity = int(item.get("quantity", 0))
        price = float(item.get("price", 0.0))
        reorder_level = max(20, int(quantity * 0.35))
        status = (
            "critical"
            if quantity <= max(8, int(reorder_level * 0.4))
            else "low-stock"
            if quantity <= reorder_level
            else "in-stock"
        )
        total_stock += quantity
        total_inventory_value += quantity * price
        product_rows.append(
            {
                "id": item.get("sku", f"SKU-{index:03d}"),
                "name": item.get("name", f"Product {index}"),
                "category": "PPE" if "KIT" in str(item.get("sku", "")) else "Medical Supplies",
                "stock": quantity,
                "reorderLevel": reorder_level,
                "price": price,
                "verified": True,
                "status": status,
            }
        )

    weekly_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    avg_ticket = total_inventory_value / max(total_stock, 1)
    demand_base = max(int(total_stock * 0.08), 140)
    day_multiplier = [0.88, 0.95, 1.0, 1.04, 1.1, 1.22, 1.06]
    sales_rows = [
        {
            "label": label,
            "value": max(0, int((demand_base * day_multiplier[idx]) * max(avg_ticket, 8.0))),
        }
        for idx, label in enumerate(weekly_labels)
    ]

    return {"products": product_rows, "sales": sales_rows}


@router.get(
    "/sales-analytics",
    dependencies=[
        Depends(
            require_roles(
                UserRole.admin,
                UserRole.retail_shop,
                UserRole.dealer,
                UserRole.manufacturer,
            )
        )
    ],
)
def get_sales_analytics(time_range: str = Query("week", alias="range")) -> dict:
    period = "month" if str(time_range).lower() == "month" else "week"
    total_stock = sum(int(item.get("quantity", 0)) for item in products)
    avg_price = (
        sum(float(item.get("price", 0.0)) for item in products) / max(len(products), 1)
    )
    demand_base = max(int(total_stock * 0.08), 140)

    trend = (
        [
            {
                "label": f"D{index + 1}",
                "value": max(
                    0,
                    int((demand_base * max(avg_price, 8.0)) + ((index % 7) - 3) * 45 + (index * 12)),
                ),
            }
            for index in range(30)
        ]
        if period == "month"
        else [
            {"label": "Mon", "value": max(0, int((demand_base * 0.88) * max(avg_price, 8.0)))},
            {"label": "Tue", "value": max(0, int((demand_base * 0.95) * max(avg_price, 8.0)))},
            {"label": "Wed", "value": max(0, int((demand_base * 1.0) * max(avg_price, 8.0)))},
            {"label": "Thu", "value": max(0, int((demand_base * 1.04) * max(avg_price, 8.0)))},
            {"label": "Fri", "value": max(0, int((demand_base * 1.10) * max(avg_price, 8.0)))},
            {"label": "Sat", "value": max(0, int((demand_base * 1.22) * max(avg_price, 8.0)))},
            {"label": "Sun", "value": max(0, int((demand_base * 1.06) * max(avg_price, 8.0)))},
        ]
    )

    top_products = []
    for index, item in enumerate(products, start=1):
        units = max(20, int(item.get("quantity", 0) * 0.07))
        revenue = units * float(item.get("price", 0.0))
        growth = f"+{max(1, min(35, int((units / max(total_stock, 1)) * 100)))}%"
        top_products.append(
            {
                "product": item.get("name", f"Product {index}"),
                "units": units,
                "revenue": f"${revenue:,.2f}",
                "growth": growth,
            }
        )

    transactions = []
    for idx, product in enumerate(products[:8], start=1):
        units = max(1, int(int(product.get("quantity", 0)) * 0.01))
        amount = units * float(product.get("price", 0.0))
        hour = 9 + ((idx + 1) // 2)
        minute = (idx * 7) % 60
        meridian = "AM" if hour < 12 else "PM"
        display_hour = hour if hour <= 12 else hour - 12
        transactions.append(
            {
                "id": f"TXN-{idx:03d}",
                "time": f"{display_hour:02d}:{minute:02d} {meridian}",
                "items": units,
                "amount": f"${amount:,.2f}",
                "payment": ["Card", "UPI", "Cash", "Wallet"][idx % 4],
                "status": "Completed",
            }
        )

    today_total = sum(point["value"] for point in trend[-1:]) if period == "week" else int(trend[-1]["value"] / 7)
    week_total = sum(point["value"] for point in trend) if period == "week" else int(sum(point["value"] for point in trend) / 4)
    month_total = sum(point["value"] for point in trend) if period == "month" else sum(point["value"] for point in trend) * 4
    avg_transaction = sum(item["units"] for item in top_products) / max(len(transactions), 1)

    return {
        "period": period,
        "trend": trend,
        "topProducts": top_products[:5],
        "recentTransactions": transactions,
        "salesStats": {
            "today": f"${today_total:,.0f}",
            "week": f"${week_total:,.0f}",
            "month": f"${month_total:,.0f}",
            "avgTransaction": f"${avg_transaction:,.2f}",
        },
    }
