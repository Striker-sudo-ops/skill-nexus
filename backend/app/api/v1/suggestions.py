"""
Employer Suggestions to Government Admin.
Employers can submit suggestions about course improvements, new courses, skill gaps, etc.
Admin can view, respond, and take action.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.db.session import SessionLocal
from app.models.entities import EmployerSuggestion, Employer, User
from app.api.v1.auth import get_current_user

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class SuggestionCreateReq(BaseModel):
    category: str  # COURSE_IMPROVEMENT, NEW_COURSE, SKILL_GAP, OTHER
    title: str
    description: str


class AdminRespondReq(BaseModel):
    response: str
    status: str  # REVIEWED, ACTIONED, REJECTED


def _serialize(s: EmployerSuggestion, db: Session) -> dict:
    employer = db.query(Employer).filter(Employer.id == s.employer_id).first()
    company_name = employer.company_name if employer else "Unknown Company"
    return {
        "id": s.id,
        "employer_id": s.employer_id,
        "company_name": company_name,
        "category": s.category,
        "title": s.title,
        "description": s.description,
        "status": s.status,
        "admin_response": s.admin_response,
        "responded_at": s.responded_at.isoformat() if s.responded_at else None,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


@router.post("/suggestions")
def submit_suggestion(
    req: SuggestionCreateReq,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Employer submits a suggestion to the government admin."""
    if current_user.role not in ('EMPLOYER',):
        raise HTTPException(status_code=403, detail="Only employers can submit suggestions")

    employer = db.query(Employer).filter(Employer.user_id == current_user.id).first()
    if not employer:
        raise HTTPException(status_code=404, detail="Employer profile not found")

    suggestion = EmployerSuggestion(
        employer_id=employer.id,
        category=req.category,
        title=req.title,
        description=req.description,
        status='PENDING',
        created_at=datetime.utcnow(),
    )
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)
    return _serialize(suggestion, db)


@router.get("/suggestions/my")
def get_my_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Employer gets their own submitted suggestions (and any admin responses)."""
    employer = db.query(Employer).filter(Employer.user_id == current_user.id).first()
    if not employer:
        return []
    suggestions = db.query(EmployerSuggestion).filter(
        EmployerSuggestion.employer_id == employer.id
    ).order_by(EmployerSuggestion.created_at.desc()).all()
    return [_serialize(s, db) for s in suggestions]


@router.get("/suggestions")
def get_all_suggestions(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin gets all employer suggestions, optionally filtered by status."""
    if current_user.role != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")

    query = db.query(EmployerSuggestion)
    if status:
        query = query.filter(EmployerSuggestion.status == status)
    suggestions = query.order_by(EmployerSuggestion.created_at.desc()).all()
    return [_serialize(s, db) for s in suggestions]


@router.put("/suggestions/{suggestion_id}/respond")
def respond_to_suggestion(
    suggestion_id: int,
    req: AdminRespondReq,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin responds to an employer suggestion and updates its status."""
    if current_user.role != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")

    suggestion = db.query(EmployerSuggestion).filter(EmployerSuggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    suggestion.admin_response = req.response
    suggestion.status = req.status
    suggestion.responded_at = datetime.utcnow()
    db.commit()
    db.refresh(suggestion)
    return _serialize(suggestion, db)
