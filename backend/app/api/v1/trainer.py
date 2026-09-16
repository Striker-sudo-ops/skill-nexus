from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.session import get_db
from app.models.entities import User, Trainer, Course, CourseEnrollment
from app.api.deps import get_current_user

router = APIRouter()

def get_trainer(current_user: User, db: Session):
    if current_user.role != 'TRAINER':
        raise HTTPException(status_code=403, detail="Not a trainer account")
    trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer profile not found")
    return trainer

@router.get('/profile')
def trainer_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trainer = get_trainer(current_user, db)
    return {
        "id": trainer.id,
        "trainer_code": trainer.trainer_code,
        "name": trainer.name,
        "email": trainer.email,
        "district": trainer.district,
        "state": trainer.state,
        "domain": trainer.domain,
        "skills": trainer.skills,
        "capability_score": trainer.capability_score,
        "needs_upskilling": trainer.needs_upskilling,
        "recommended_upskilling": trainer.recommended_upskilling,
        "courses_assigned": trainer.courses_assigned,
    }

@router.get('/courses')
def trainer_courses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trainer = get_trainer(current_user, db)
    if not trainer.courses_assigned:
        return []
    codes = [c.strip() for c in trainer.courses_assigned.split(',') if c.strip()]
    courses = db.query(Course).filter(Course.course_code.in_(codes)).all()
    return [{
        "id": c.id, "course_code": c.course_code, "title": c.title,
        "domain": c.domain, "depth_level": c.depth_level,
        "enrolled_count": c.enrolled_count, "target_capacity": c.target_capacity,
        "placement_rate": c.placement_rate,
    } for c in courses]

@router.get('/enrollments')
def trainer_enrollments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trainer = get_trainer(current_user, db)
    if not trainer.courses_assigned:
        return {"enrollments": [], "total": 0}
    codes = [c.strip() for c in trainer.courses_assigned.split(',') if c.strip()]
    courses = db.query(Course).filter(Course.course_code.in_(codes)).all()
    course_ids = [c.id for c in courses]
    if not course_ids:
        return {"enrollments": [], "total": 0}
    enrollments = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id.in_(course_ids)
    ).order_by(desc(CourseEnrollment.enrolled_at)).all()

    course_map = {c.id: c for c in courses}
    result = []
    for e in enrollments:
        c = course_map.get(e.course_id)
        result.append({
            "id": e.id,
            "full_name": e.full_name,
            "email": e.email,
            "phone": e.phone,
            "dob": e.dob,
            "education": e.education,
            "city": e.city,
            "state": e.state,
            "motivation": e.motivation,
            "status": e.status,
            "enrolled_at": e.enrolled_at.isoformat() if e.enrolled_at else None,
            "course_code": c.course_code if c else None,
            "course_title": c.title if c else None,
        })
    return {"enrollments": result, "total": len(result)}


class RevokeRequest:
    pass

from pydantic import BaseModel

class RevokeEnrollmentPayload(BaseModel):
    reason: str

@router.put('/enrollments/{id}/revoke')
def revoke_enrollment(
    id: int,
    payload: RevokeEnrollmentPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trainer = get_trainer(current_user, db)
    enrollment = db.query(CourseEnrollment).filter(CourseEnrollment.id == id).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Verify course belongs to trainer
    if not trainer.courses_assigned:
        raise HTTPException(status_code=403, detail="No courses assigned to trainer")
    codes = [c.strip() for c in trainer.courses_assigned.split(',') if c.strip()]
    courses = db.query(Course).filter(Course.course_code.in_(codes)).all()
    course_ids = [c.id for c in courses]
    if enrollment.course_id not in course_ids:
        raise HTTPException(status_code=403, detail="You can only revoke students from your assigned courses")

    enrollment.status = "REVOKED"
    enrollment.revocation_reason = payload.reason
    
    # Adjust enrolled count if it was counted
    course = db.query(Course).filter(Course.id == enrollment.course_id).first()
    if course and course.enrolled_count > 0:
        course.enrolled_count -= 1

    db.commit()
    return {"message": "Enrollment revoked successfully", "status": "REVOKED", "reason": payload.reason}

