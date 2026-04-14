from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, conlist

from app.core.middleware import get_current_payload
from app.services.ai_service import ai_status, aforecast_with_insights

router = APIRouter(prefix="/ai", tags=["ai"])


class ForecastRequest(BaseModel):
    product_name: str = Field(min_length=1, max_length=120)
    history: conlist(float, min_length=1)  # list of numeric demand history
    horizon: int = Field(default=30, ge=1, le=365)
    context: Optional[str] = Field(default="", max_length=2000)


@router.get("/status")
async def ai_status_route(_: dict = Depends(get_current_payload)) -> dict:
    """Return current AI provider configuration status."""
    return ai_status()


@router.post("/forecast-with-insights")
async def forecast_with_insights_endpoint(
    data: ForecastRequest,
    _: dict = Depends(get_current_payload),
) -> dict:
    """
    Generate a demand forecast with narrative insights.
    Requires authentication; works with configured AI provider or falls back to baseline forecast.
    """
    return await aforecast_with_insights(
        product_name=data.product_name,
        history=list(data.history),
        horizon=data.horizon,
        context=data.context or "",
    )
