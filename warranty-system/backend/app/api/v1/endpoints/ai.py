from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.permissions import get_current_user
from app.models.user import User
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["AI"])


class ClassifyRequest(BaseModel):
    issue_description: str


class ClassifyResponse(BaseModel):
    category: str
    source: str  # mock | gemini


class ProgressRequest(BaseModel):
    ticket_code: str
    status: str
    customer_name: str | None = None


class ProgressResponse(BaseModel):
    message: str


@router.post("/classify", response_model=ClassifyResponse)
def classify(
    payload: ClassifyRequest,
    _: Annotated[User, Depends(get_current_user)],
):
    cat = ai_service.classify_issue_gemini(payload.issue_description) or ai_service.classify_issue(payload.issue_description)
    src = "gemini" if ai_service.classify_issue_gemini(payload.issue_description) else "mock"
    return ClassifyResponse(category=cat, source=src)


@router.post("/progress-message", response_model=ProgressResponse)
def progress(
    payload: ProgressRequest,
    _: Annotated[User, Depends(get_current_user)],
):
    msg = ai_service.generate_progress_message(payload.customer_name, payload.ticket_code, payload.status)
    return ProgressResponse(message=msg)