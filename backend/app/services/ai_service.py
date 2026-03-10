from __future__ import annotations

import json
import re
from math import isfinite
from statistics import mean
from urllib import error as url_error
from urllib import parse as url_parse
from urllib import request as url_request

from app.core.config import get_settings

_GEMINI_MODEL = "gemini-1.5-flash"
_GEMINI_TIMEOUT_SECONDS = 2.5
_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"


def _baseline_forecast(history: list[float], horizon: int) -> list[float]:
    baseline = mean(history[-3:]) if len(history) >= 3 else mean(history)
    return [round(baseline * (1 + index * 0.03), 2) for index in range(1, horizon + 1)]


def _sanitize_history(history: list[float]) -> list[float]:
    cleaned: list[float] = []
    for value in history:
        try:
            number = float(value)
        except (TypeError, ValueError):
            continue
        if not isfinite(number):
            continue
        cleaned.append(max(0.0, round(number, 4)))
    return cleaned


def _extract_candidate_text(payload: dict) -> str:
    candidates = payload.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        return ""
    content = candidates[0].get("content") if isinstance(candidates[0], dict) else None
    parts = content.get("parts") if isinstance(content, dict) else None
    if not isinstance(parts, list):
        return ""
    texts = [part.get("text", "") for part in parts if isinstance(part, dict)]
    return "\n".join(chunk for chunk in texts if isinstance(chunk, str)).strip()


def _coerce_forecast(raw_forecast: list[object], horizon: int) -> list[float]:
    normalized: list[float] = []
    for item in raw_forecast:
        try:
            value = float(item)
        except (TypeError, ValueError):
            continue
        if not isfinite(value):
            continue
        normalized.append(round(max(0.0, value), 2))
    if not normalized:
        return []
    if len(normalized) < horizon:
        normalized.extend([normalized[-1]] * (horizon - len(normalized)))
    return normalized[:horizon]


def _extract_json_payload(text: str) -> dict | list | None:
    content = str(text or "").strip()
    if not content:
        return None

    attempts = [content]
    fenced = re.sub(r"^```(?:json)?\s*|\s*```$", "", content, flags=re.IGNORECASE)
    if fenced != content:
        attempts.append(fenced.strip())

    object_match = re.search(r"\{[\s\S]*\}", content)
    if object_match:
        attempts.append(object_match.group(0))

    for candidate in attempts:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue
    return None


def _call_gemini_payload(model_name: str, payload: dict, timeout: float, *, api_key: str | None = None) -> dict | list | None:
    key = api_key or get_settings().gemini_api_key
    if not key:
        return None

    endpoint = f"{_GEMINI_BASE_URL}/{model_name}:generateContent?{url_parse.urlencode({'key': key})}"
    request = url_request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with url_request.urlopen(request, timeout=timeout) as response:
            raw_body = response.read().decode("utf-8")
    except (url_error.URLError, TimeoutError, OSError):
        return None

    try:
        parsed_response = json.loads(raw_body)
    except json.JSONDecodeError:
        return None

    text = _extract_candidate_text(parsed_response)
    if not text:
        return None
    return _extract_json_payload(text)


def _request_gemini_forecast(history: list[float], horizon: int, api_key: str) -> list[float]:
    prompt = (
        "You are a demand forecasting assistant for supply chain operations.\n"
        f"Input daily unit sales history: {history[-60:]}\n"
        f"Forecast horizon: {horizon} days.\n"
        "Return only compact JSON with this shape: "
        '{"forecast":[number,number],"summary":"one short sentence"}. '
        "The forecast array must contain exactly the requested number of positive numbers."
    )
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "response_mime_type": "application/json",
        },
    }

    response = _call_gemini_payload(_GEMINI_MODEL, payload, _GEMINI_TIMEOUT_SECONDS, api_key=api_key)
    if not response:
        return []

    if isinstance(response, dict):
        raw_forecast = response.get("forecast")
        if isinstance(raw_forecast, list):
            return _coerce_forecast(raw_forecast, horizon)
    if isinstance(response, list):
        return _coerce_forecast(response, horizon)
    return []


def predict_demand(history: list[float], horizon: int = 3) -> list[float]:
    """Predicts demand via Gemini API with safe baseline fallback."""
    if horizon <= 0:
        return []

    clean_history = _sanitize_history(history)
    if not clean_history:
        return []

    baseline = _baseline_forecast(clean_history, horizon)
    api_key = get_settings().gemini_api_key
    if not api_key:
        return baseline

    gemini_forecast = _request_gemini_forecast(clean_history, horizon, api_key)
    return gemini_forecast or baseline


def predict_delay_risk(distance_km: float, weather_score: float, traffic_score: float) -> float:
    """Returns a normalized delay probability in range [0, 1]."""
    raw = (distance_km / 1200) * 0.4 + weather_score * 0.3 + traffic_score * 0.3
    return round(max(0.0, min(1.0, raw)), 3)


def predict_low_stock(inventory_data: list[dict], api_key: str) -> list[dict]:
    """Uses Gemini to analyze inventory and sales data and predict stockouts."""
    if not api_key:
        return inventory_data

    prompt = (
        "You are an AI supply chain analyst. "
        "Review this inventory data and predict which products will run low first. "
        f"Data: {json.dumps(inventory_data)}\n"
        "Return compact JSON containing an array of objects under the key 'recommendations'. "
        "Each object must have 'sku', 'priority' ('high', 'medium', 'low'), and 'recommendation' (a short sentence explaining why). "
        "Keep the same skus. Provide an insightful AI-driven recommendation."
    )
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "response_mime_type": "application/json",
        },
    }

    response = _call_gemini_payload(_GEMINI_MODEL, payload, 5.0, api_key=api_key)
    if isinstance(response, dict) and "recommendations" in response:
        ai_recs = response["recommendations"]
        merged = []
        for item in inventory_data:
            sku = item.get("sku")
            matching = next((r for r in ai_recs if r.get("sku") == sku), {})
            merged.append({
                **item,
                "recommendation": matching.get("recommendation", item.get("recommendation")),
                "priority": matching.get("priority", item.get("priority")),
            })
        return merged

    return inventory_data


def summarize_product_journey(journey: list[dict]) -> dict:
    """Summarizes a blockchain journey via Gemini when available."""
    if not journey:
        return {
            "summary": "Product journey data is still pending on the ledger.",
            "highlight": "No events yet—scan again after the next scan-in.",
            "keyStage": "pending",
            "steps": 0,
        }

    events = []
    recent = journey[-8:]
    for step in recent:
        stage = step.get("eventStage") or step.get("stage") or "unknown stage"
        timestamp = step.get("timestamp") or step.get("createdAt") or "unknown time"
        events.append(f"{stage} at {timestamp}")

    prompt = (
        "You are a supply chain analyst reporting to judges. "
        f"Review these events: {events}. "
        "Return JSON with keys 'summary' (a single sentence), 'highlight' (a short clause that hooks judges), "
        "and 'keyStage' (a short name for the latest stage)."
    )
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "response_mime_type": "application/json",
        },
    }

    response = _call_gemini_payload(_GEMINI_MODEL, payload, 3.0)
    if isinstance(response, dict):
        return {
            "summary": response.get("summary") or "Journey shows recent blockchain activity.",
            "highlight": response.get("highlight") or events[-1],
            "keyStage": response.get("keyStage") or events[-1],
            "steps": len(journey),
        }

    first_event = journey[0]
    last_event = journey[-1]
    return {
        "summary": f"Chain flows from {first_event.get('eventStage', 'start')} to {last_event.get('eventStage', 'current')} in {len(journey)} hops.",
        "highlight": f"Latest stage: {last_event.get('eventStage', 'current')} at {last_event.get('timestamp', 'unknown time')}.",
        "keyStage": last_event.get("eventStage") or "current",
        "steps": len(journey),
    }
