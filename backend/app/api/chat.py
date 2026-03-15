from __future__ import annotations

import json

from fastapi import APIRouter, Body, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional

from app.services.ai_service import astream_chat_response


router = APIRouter(tags=["chat"])


class ChatStreamRequest(BaseModel):
    q: str = Field(min_length=1)


@router.post("/chat/stream")
async def chat_stream(
    q: Optional[str] = Query(None, min_length=1),
    payload: Optional[ChatStreamRequest] = Body(None),
) -> StreamingResponse:
    prompt = (q or (payload.q if payload else "") or "").strip()

    async def _event_stream():
        async for chunk in astream_chat_response(prompt):
            yield f"data: {json.dumps({'delta': chunk}, ensure_ascii=False)}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(
        _event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
