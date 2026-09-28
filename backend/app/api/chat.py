"""Chat endpoint backed by the LLM assistant."""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app import db
from app.llm import handle_chat

router = APIRouter(prefix="/api", tags=["chat"])


CHAT_HISTORY_LIMIT = 50


class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
async def chat(body: ChatRequest, request: Request) -> dict:
    """Send a message to FinAlly and return its reply plus executed actions."""
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")
    state = request.app.state
    return await handle_chat(body.message, state.price_cache, state.market_source)


@router.get("/chat")
def chat_history() -> list[dict]:
    """Recent chat messages, oldest first, with assistant actions decoded."""
    return db.get_chat_messages(limit=CHAT_HISTORY_LIMIT)
