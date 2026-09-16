from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from pydantic import BaseModel
from typing import List, Optional
from app.db.session import get_db
from app.models.entities import (
    User, Course, DistrictIntelligence, Trainer, CurriculumUpdate,
    CandidateFeedback, Skill, Job, TrainingInstitute, Student, CourseEnrollment
)
from app.api.deps import get_current_user
from app.core.security import hash_password
import csv
import io

router = APIRouter()

# ─── Overview ────────────────────────────────────────────────────────────────
@router.get('/overview')
def get_admin_overview(db: Session = Depends(get_db)):
    high_demand_skills = db.query(Skill).order_by(desc(Skill.demand_score)).limit(8).all()

    growing_roles = [
        {"role": "EV Battery Integration Specialist", "sector": "Automotive EV", "growth": "+42% YoY"},
        {"role": "Industrial Robotics Cell Engineer", "sector": "Robotics & Industry 4.0", "growth": "+38% YoY"},
        {"role": "Edge AI Inference Architect", "sector": "Artificial Intelligence", "growth": "+54% YoY"},
        {"role": "Microgrid Solar Project Engineer", "sector": "Renewable Energy", "growth": "+29% YoY"},
        {"role": "Telemetry Biomedical Technologist", "sector": "Healthcare", "growth": "+31% YoY"},
    ]
    declining_roles = [
        {"role": "2D Manual Drafting Blueprint Tracer", "sector": "Legacy Mechanical", "growth": "-68% YoY"},
        {"role": "Standalone Data Entry Clerk", "sector": "Administration", "growth": "-74% YoY"},
        {"role": "Scripted Telecalling Representative", "sector": "BPO Operations", "growth": "-48% YoY"},
        {"role": "Legacy Server Room Tape Operator", "sector": "Legacy IT", "growth": "-62% YoY"},
    ]

    total_courses = db.query(Course).count()
    outdated_courses = db.query(Course).filter(Course.is_outdated == True).count()
    oversupplied_courses = db.query(Course).filter(Course.is_oversupplied == True).count()
    avg_placement = db.query(func.avg(Course.placement_rate)).scalar() or 0.0
    avg_satisfaction = db.query(func.avg(Course.employer_satisfaction)).scalar() or 0.0
    total_capacity = db.query(func.sum(DistrictIntelligence.current_capacity)).scalar() or 0
    total_recommended = db.query(func.sum(DistrictIntelligence.recommended_seats)).scalar() or 0
    net_deficit = total_recommended - total_capacity
    total_trainers = db.query(Trainer).count()
    trainers_needing_upskill = db.query(Trainer).filter(Trainer.needs_upskilling == True).count()
    total_students = db.query(Student).count()
    total_enrollments = db.query(CourseEnrollment).count()

    # Domain-wise demand vs supply for chart
    domains = ['IT', 'Data Science', 'Healthcare', 'Mechanical', 'Electrical', 'Electronics']
    domain_stats = []
    for d in domains:
        demand_skills = db.query(Skill).filter(Skill.domain == d).all()
        avg_demand = round(sum(s.demand_score or 0 for s in demand_skills) / max(len(demand_skills), 1), 1)
        enrolled = db.query(func.sum(Course.enrolled_count)).filter(Course.domain == d).scalar() or 0
        capacity = db.query(func.sum(Course.target_capacity)).filter(Course.domain == d).scalar() or 1
        supply_pct = round((enrolled / capacity) * 100, 1)
        domain_stats.append({
            "domain": d,
            "industry_demand": avg_demand,
            "trained_supply": supply_pct
        })

    return {
        "kpis": {
            "avg_placement_rate": round(float(avg_placement), 1),
            "employer_satisfaction_rate": round(float(avg_satisfaction), 1),
            "current_training_capacity": int(total_capacity),
            "industry_target_capacity": int(total_recommended),
            "national_skills_gap": int(net_deficit),
            "outdated_courses_count": outdated_courses,
            "oversupplied_courses_count": oversupplied_courses,
            "trainers_needing_upskilling": trainers_needing_upskill,
            "total_trainers": total_trainers,
            "total_students": total_students,
            "total_courses": total_courses,
            "total_enrollments": total_enrollments,
        },
        "high_demand_skills": [
            {"id": s.id, "name": s.name, "domain": s.domain, "demand_score": s.demand_score,
             "openings": s.total_openings, "median_salary": s.median_salary, "trend": s.trend}
            for s in high_demand_skills
        ],
        "growing_roles": growing_roles,
        "declining_roles": declining_roles,
        "domain_stats": domain_stats,
    }

# ─── Districts ────────────────────────────────────────────────────────────────
@router.get('/districts')
def get_district_intelligence(
    state: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DistrictIntelligence)
    if state and state != 'ALL':
        query = query.filter(DistrictIntelligence.state == state)
    if status and status != 'ALL':
        query = query.filter(DistrictIntelligence.status == status)
    districts = query.order_by(desc(DistrictIntelligence.demand_index)).all()
    return {
        "districts": districts,
        "summary": {
            "total_monitored": len(districts),
            "critical_shortage_count": len([d for d in districts if d.status == 'CRITICAL_SHORTAGE']),
            "high_demand_count": len([d for d in districts if d.status == 'HIGH_DEMAND']),
            "oversupply_count": len([d for d in districts if d.status == 'OVERSUPPLY']),
            "new_centres_needed": len([d for d in districts if "Build New" in (d.recommended_action or "")]),
        }
    }

# ─── Courses (Admin view + Add) ───────────────────────────────────────────────
@router.get('/courses')
def get_admin_courses(filter_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Course)
    if filter_type == 'OUTDATED':
        query = query.filter(Course.is_outdated == True)
    elif filter_type == 'OVERSUPPLIED':
        query = query.filter(Course.is_oversupplied == True)
    elif filter_type == 'HIGH_DEMAND':
        query = query.filter(Course.industry_demand_alignment >= 90.0)
    return query.order_by(desc(Course.industry_demand_alignment)).all()

class CourseCreate(BaseModel):
    course_code: str
    title: str
    description: str
    domain: str
    depth_level: str
    skills_offered: str
    industry_demand_alignment: Optional[float] = 80.0
    related_job_roles: Optional[str] = None
    duration_weeks: Optional[int] = 12
    target_capacity: Optional[int] = 200
    placement_rate: Optional[float] = 75.0
    employer_satisfaction: Optional[float] = 80.0
    ai_analysis: Optional[str] = None

@router.post('/courses')
def create_admin_course(course_in: CourseCreate, db: Session = Depends(get_db)):
    existing = db.query(Course).filter(Course.course_code == course_in.course_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Course code '{course_in.course_code}' already exists")
    new_course = Course(
        course_code=course_in.course_code,
        title=course_in.title,
        description=course_in.description,
        domain=course_in.domain,
        depth_level=course_in.depth_level,
        skills_offered=course_in.skills_offered,
        industry_demand_alignment=course_in.industry_demand_alignment or 80.0,
        related_job_roles=course_in.related_job_roles or "",
        duration_weeks=course_in.duration_weeks or 12,
        target_capacity=course_in.target_capacity or 200,
        placement_rate=course_in.placement_rate or 75.0,
        employer_satisfaction=course_in.employer_satisfaction or 80.0,
        ai_analysis=course_in.ai_analysis,
        enrolled_count=0,
        is_outdated=False,
        is_oversupplied=False,
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

# ─── Trainers ─────────────────────────────────────────────────────────────────
class TrainerCreate(BaseModel):
    name: str
    email: str
    district: Optional[str] = None
    state: Optional[str] = None
    domain: str
    skills: Optional[str] = None
    capability_score: Optional[float] = 80.0
    needs_upskilling: Optional[bool] = False
    recommended_upskilling: Optional[str] = None
    courses_assigned: Optional[str] = None

@router.get('/trainers')
def get_admin_trainers(db: Session = Depends(get_db)):
    trainers = db.query(Trainer).order_by(Trainer.capability_score).all()
    needing_upskill = [t for t in trainers if t.needs_upskilling]
    return {"trainers": trainers, "total": len(trainers), "needing_upskill_count": len(needing_upskill)}

@router.post('/trainers')
def add_admin_trainer(trainer_in: TrainerCreate, db: Session = Depends(get_db)):
    clean_email = trainer_in.email.strip().lower()
    # Check if trainer email already exists
    if db.query(Trainer).filter(Trainer.email == clean_email).first():
        raise HTTPException(status_code=400, detail="A trainer with this email already exists")
    # Create user account for trainer
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="A user account with this email already exists")

    default_password = "Trainer@123"
    new_user = User(email=clean_email, password_hash=hash_password(default_password), role='TRAINER')
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_trainer = Trainer(
        user_id=new_user.id,
        name=trainer_in.name,
        email=clean_email,
        district=trainer_in.district or "",
        state=trainer_in.state or "",
        domain=trainer_in.domain,
        skills=trainer_in.skills or "",
        capability_score=trainer_in.capability_score or 80.0,
        needs_upskilling=trainer_in.needs_upskilling or False,
        recommended_upskilling=trainer_in.recommended_upskilling,
        courses_assigned=trainer_in.courses_assigned or "",
    )
    db.add(new_trainer)
    db.commit()
    db.refresh(new_trainer)
    # Generate trainer code after we have ID
    new_trainer.trainer_code = f"TRN-{new_trainer.id:03d}"
    db.commit()

    return {
        "trainer": new_trainer,
        "credentials": {
            "trainer_id": new_trainer.trainer_code,
            "email": clean_email,
            "default_password": default_password,
            "note": "Please share these credentials with the trainer. They must change their password on first login."
        }
    }

@router.delete('/trainers/{id}')
def delete_admin_trainer(id: int, db: Session = Depends(get_db)):
    trainer = db.query(Trainer).filter(Trainer.id == id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    # Also remove linked user
    if trainer.user_id:
        user = db.query(User).filter(User.id == trainer.user_id).first()
        if user:
            db.delete(user)
    db.delete(trainer)
    db.commit()
    return {"message": "Trainer removed successfully", "id": id}

# ─── Enrollments ─────────────────────────────────────────────────────────────
@router.get('/enrollments')
def get_admin_enrollments(
    course_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CourseEnrollment)
    if course_id:
        query = query.filter(CourseEnrollment.course_id == course_id)
    if status:
        query = query.filter(CourseEnrollment.status == status)
    enrollments = query.order_by(desc(CourseEnrollment.enrolled_at)).all()
    result = []
    for e in enrollments:
        c = db.query(Course).filter(Course.id == e.course_id).first()
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

@router.put('/enrollments/{id}/status')
def update_enrollment_status(id: int, payload: dict, db: Session = Depends(get_db)):
    enrollment = db.query(CourseEnrollment).filter(CourseEnrollment.id == id).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    enrollment.status = payload.get("status", enrollment.status)
    db.commit()
    return {"message": "Status updated", "status": enrollment.status}

# ─── Curriculum & Export ──────────────────────────────────────────────────────
@router.get('/curriculum-updates')
def get_curriculum_updates(db: Session = Depends(get_db)):
    return db.query(CurriculumUpdate).order_by(desc(CurriculumUpdate.submitted_at)).all()

class ActionReq(BaseModel):
    action: str

@router.post('/curriculum-updates/{id}/action')
def action_curriculum_update(id: int, req: ActionReq, db: Session = Depends(get_db)):
    update = db.query(CurriculumUpdate).filter(CurriculumUpdate.id == id).first()
    if not update:
        raise HTTPException(status_code=404, detail="Update proposal not found")
    update.status = 'APPROVED' if req.action.upper() == 'APPROVE' else 'REJECTED'
    db.commit()
    return {"message": f"Update {update.status.lower()} successfully", "status": update.status}

@router.get('/export-report')
def export_government_report(db: Session = Depends(get_db)):
    districts = db.query(DistrictIntelligence).all()
    courses = db.query(Course).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["SKILL NEXUS GOVERNMENT INTELLIGENCE & CAPACITY REPORT"])
    writer.writerow([])
    writer.writerow(["DISTRICT-WISE DEMAND VS CAPACITY"])
    writer.writerow(["State", "District", "Primary Sector", "Demand Index", "Current Capacity", "Deficit", "Status", "Top Demand Skill", "Recommended Seats", "Recommended Action"])
    for d in districts:
        writer.writerow([d.state, d.district, d.primary_sector, d.demand_index, d.current_capacity, d.shortage_deficit, d.status, d.top_demand_skill, d.recommended_seats, d.recommended_action])
    writer.writerow([])
    writer.writerow(["COURSES DEMAND ALIGNMENT & AUDIT"])
    writer.writerow(["Course Code", "Title", "Domain", "Alignment %", "Placement %", "Employer Satisfaction %", "Outdated", "Oversupplied"])
    for c in courses:
        writer.writerow([c.course_code, c.title, c.domain, c.industry_demand_alignment, c.placement_rate, c.employer_satisfaction, c.is_outdated, c.is_oversupplied])
    output.seek(0)
    return Response(
        content=output.getvalue(), media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=skillnexus_government_report.csv"}
    )
