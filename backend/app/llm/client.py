"""LiteLLM call to OpenRouter (Cerebras provider) with structured output parsing."""

import logging

from litellm import acompletion
from pydantic import ValidationError

from .models import ChatResponse

logger = logging.getLogger(__name__)

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}
APOLOGY = "Sorry, I couldn't process that request just now. Please try again."


def fallback_response() -> ChatResponse:
    """A safe reply with no actions, used when the LLM fails or returns bad output."""
    return ChatResponse(message=APOLOGY, trades=[], watchlist_changes=[])


def parse_response(content: str | None) -> ChatResponse:
    """Validate the LLM's JSON text; fall back to an apology if it is malformed."""
    try:
        return ChatResponse.model_validate_json(content or "")
    except ValidationError:
        logger.warning("Malformed LLM response: %r", content)
        return fallback_response()


async def call_llm(messages: list[dict]) -> ChatResponse:
    """Request a structured ChatResponse from the model; never raises."""
    try:
        response = await acompletion(
            model=MODEL,
            messages=messages,
            response_format=ChatResponse,
            reasoning_effort="low",
            extra_body=EXTRA_BODY,
        )
    except Exception:
        logger.exception("LLM call failed")
        return fallback_response()
    return parse_response(response.choices[0].message.content)
