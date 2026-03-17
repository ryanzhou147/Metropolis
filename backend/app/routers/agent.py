import logging

from fastapi import APIRouter, HTTPException, Request

from ..models.agent_schemas import AgentQueryRequest, AgentResponse, ConfidenceLevel, QueryType
from ..rate_limit import limiter, RATE_LIMIT_AGENT
from ..services.agent_service import process_agent_query

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/query", response_model=AgentResponse)
@limiter.limit(RATE_LIMIT_AGENT)
async def agent_query(request: Request, body: AgentQueryRequest) -> AgentResponse:
    if not body.query or not body.query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty.")
    try:
        return await process_agent_query(
            body.query.strip(),
            user_role=body.user_role,
            user_industry=body.user_industry,
        )
    except Exception as exc:
        # Last-resort safety net — always return valid JSON, never 500
        logger.error("Agent endpoint unhandled error: %s", exc, exc_info=True)
        return AgentResponse(
            answer="The analysis service encountered an unexpected error. Please try again.",
            confidence=ConfidenceLevel.low,
            caution="An internal error occurred. If this persists, please try a different query.",
            mode="internal",
            query_type=QueryType.event_explanation,
            reasoning_steps=[f"Unhandled error: {type(exc).__name__}"],
        )
