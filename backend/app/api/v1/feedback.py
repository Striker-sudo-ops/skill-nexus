"""
Course Feedback System.
After completing a course, students submit feedback about employment impact.
This dynamically updates the course's placement_rate.
Admin can view all feedback and manually override placement rates.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.db.session import SessionLocal
from app.models.entities import CourseFeedback, Course, Student, CourseEnrollment, User
from app.api.v1.auth import get_current_user

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class FeedbackSubmitReq(BaseModel):
    course_id: int
    got_employed: bool
    course_helped: bool
    satisfaction_score: int  # 1-5
    feedback_text: Optional[str] = None


class PlacementRateOverrideReq(BaseModel):
    placement_rate: float  # 0.0 – 100.0


def _recompute_placement_rate(course_id: int, db: Session) -> Optional[float]:
    """Recompute placement_rate from all submitted feedbacks for a course.
    Returns None if fewer than 3 feedbacks (not enough data).
    """
    feedbacks = db.query(CourseFeedback).filter(CourseFeedback.course_id == course_id).all()
    if len(feedbacks) < 3:
        return None
    employed_count = sum(1 for f in feedbacks if f.got_employed)
    rate = (employed_count / len(feedbacks)) * 100.0
    return round(rate, 1)


@router.post("/courses/feedback")
def submit_feedback(
    req: FeedbackSubmitReq,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Student submits course feedback after completion."""
    if current_user.role != 'STUDENT':
        raise HTTPException(status_code=403, detail="Only students can submit course feedback")

    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    course = db.query(Course).filter(Course.id == req.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check student is enrolled
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == req.course_id,
        CourseEnrollment.student_id == student.id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    # Prevent duplicate feedback
    existing = db.query(CourseFeedback).filter(
        CourseFeedback.student_id == student.id,
        CourseFeedback.course_id == req.course_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You have already submitted feedback for this course")

    if req.satisfaction_score < 1 or req.satisfaction_score > 5:
        raise HTTPException(status_code=400, detail="Satisfaction score must be between 1 and 5")

    feedback = CourseFeedback(
        student_id=student.id,
        course_id=req.course_id,
        got_employed=req.got_employed,
        course_helped=req.course_helped,
        satisfaction_score=req.satisfaction_score,
        feedback_text=req.feedback_text,
        submitted_at=datetime.utcnow(),
    )
    db.add(feedback)
    db.commit()

    # Dynamically recompute and update placement rate
    new_rate = _recompute_placement_rate(req.course_id, db)
    if new_rate is not None:
        course.placement_rate = new_rate
        db.commit()

    return {
        "success": True,
        "message": "Feedback submitted. Thank you!",
        "course_placement_rate": course.placement_rate
    }


@router.get("/courses/{course_id}/feedback")
def get_course_feedback(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin views all feedback for a specific course."""
    if current_user.role != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    feedbacks = db.query(CourseFeedback).filter(
        CourseFeedback.course_id == course_id
    ).order_by(CourseFeedback.submitted_at.desc()).all()

    total = len(feedbacks)
    employed = sum(1 for f in feedbacks if f.got_employed)
    helped = sum(1 for f in feedbacks if f.course_helped)
    avg_sat = round(sum(f.satisfaction_score for f in feedbacks) / total, 1) if total > 0 else None

    return {
        "course_id": course_id,
        "course_title": course.title,
        "current_placement_rate": course.placement_rate,
        "total_feedback": total,
        "employed_count": employed,
        "course_helped_count": helped,
        "avg_satisfaction": avg_sat,
        "feedbacks": [
            {
                "id": f.id,
                "student_id": f.student_id,
                "got_employed": f.got_employed,
                "course_helped": f.course_helped,
                "satisfaction_score": f.satisfaction_score,
                "feedback_text": f.feedback_text,
                "submitted_at": f.submitted_at.isoformat() if f.submitted_at else None,
            }
            for f in feedbacks
        ]
    }


@router.get("/courses/feedback/all")
def get_all_feedback(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin views all feedback across all courses."""
    if current_user.role != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")

    feedbacks = db.query(CourseFeedback).order_by(CourseFeedback.submitted_at.desc()).all()
    result = []
    for f in feedbacks:
        course = db.query(Course).filter(Course.id == f.course_id).first()
        result.append({
            "id": f.id,
            "course_id": f.course_id,
            "course_title": course.title if course else "Unknown",
            "student_id": f.student_id,
            "got_employed": f.got_employed,
            "course_helped": f.course_helped,
            "satisfaction_score": f.satisfaction_score,
            "feedback_text": f.feedback_text,
            "submitted_at": f.submitted_at.isoformat() if f.submitted_at else None,
        })
    return result


@router.put("/courses/{course_id}/placement-rate")
def override_placement_rate(
    course_id: int,
    req: PlacementRateOverrideReq,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin manually overrides placement rate for a course."""
    if current_user.role != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if req.placement_rate < 0 or req.placement_rate > 100:
        raise HTTPException(status_code=400, detail="Placement rate must be between 0 and 100")

    course.placement_rate = req.placement_rate
    db.commit()
    return {"success": True, "placement_rate": course.placement_rate}


@router.get("/courses/feedback/check/{course_id}")
def check_feedback_status(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Student checks if they've already submitted feedback for a course."""
    if current_user.role != 'STUDENT':
        raise HTTPException(status_code=403, detail="Students only")

    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        return {"submitted": False}

    existing = db.query(CourseFeedback).filter(
        CourseFeedback.student_id == student.id,
        CourseFeedback.course_id == course_id
    ).first()
    return {"submitted": existing is not None}
