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
    from app.services.ingestion_service import ensure_district_intelligence
    ensure_district_intelligence(db)
    high_demand_skills = db.query(Skill).order_by(desc(Skill.demand_score)).limit(8).all()

    # ── Dynamic growing roles from real GitHub-tracked skill trends ─────────────
    # Map skill name → (job role title, sector) for display
    _SKILL_TO_ROLE = {
        "Python":              ("AI/ML Backend Engineer",           "Artificial Intelligence"),
        "Machine Learning":    ("MLOps & AI Deployment Engineer",   "Data Science"),
        "AWS":                 ("Cloud Infrastructure Architect",   "Cloud Computing"),
        "React":               ("Full-Stack Product Engineer",      "Web Development"),
        "Battery Management":  ("EV Battery Systems Engineer",      "Automotive EV"),
        "Docker":              ("DevOps & Platform Engineer",       "Cloud & DevOps"),
        "PLC Programming":     ("Industrial Automation Specialist", "Industry 4.0"),
        "Sensor Fusion":       ("IoT Systems Engineer",             "Embedded & IoT"),
        "Circuit Design":      ("VLSI / PCB Design Engineer",       "Electronics"),
        "Clinical Nursing":    ("Clinical Care Specialist",         "Healthcare"),
        "SolidWorks":          ("Product Design & CAD Engineer",    "Mechanical Design"),
        "Data Visualization":  ("Business Intelligence Analyst",    "Data Science"),
        "Java":                ("Enterprise Application Architect", "IT & Software"),
        "SQL":                 ("Data Platform Engineer",           "Data Engineering"),
        "AutoCAD":             ("Mechanical Drafting Engineer",     "Mechanical Design"),
        "Power Systems":       ("Microgrid & Renewables Engineer",  "Renewable Energy"),
        "Patient Care":        ("Telemetry Biomedical Technologist","Healthcare"),
        "SEO":                 ("Digital Growth Marketer",          "Digital Marketing"),
        "Figma":               ("UI/UX Product Designer",           "Product Design"),
        "Concrete Technology": ("Infrastructure QC Engineer",       "Civil Engineering"),
    }

    avg_skill_score = float(db.query(func.avg(Skill.demand_score)).scalar() or 60.0)

    hot_skills = (
        db.query(Skill)
        .order_by(desc(Skill.demand_score))
        .limit(5)
        .all()
    )
    growing_roles = []
    for s in hot_skills:
        score = float(s.demand_score or 0.0)
        if score > 0:
            role_title, sector = _SKILL_TO_ROLE.get(s.name, (f"{s.name} Specialist", s.domain or "Technology"))
            # Mathematically computed percentage relative to average skill demand score
            growth_pct = max(5, round(((score - avg_skill_score) / avg_skill_score) * 100)) if score >= avg_skill_score else max(5, round((score / 100.0) * 40))
            growing_roles.append({"role": role_title, "sector": sector, "growth": f"+{growth_pct}% YoY"})

    declining_trend_skills = (
        db.query(Skill)
        .order_by(Skill.demand_score.asc())
        .limit(5)
        .all()
    )
    declining_roles = []
    for s in declining_trend_skills:
        score = float(s.demand_score or 0.0)
        if score > 0 and score < avg_skill_score:
            role_title, sector = _SKILL_TO_ROLE.get(s.name, (f"Traditional {s.name} Technician", s.domain or "General"))
            # Mathematically computed decline percentage relative to average skill demand score
            decline_pct = max(5, round(((avg_skill_score - score) / avg_skill_score) * 100))
            declining_roles.append({"role": role_title, "sector": sector, "growth": f"-{decline_pct}% YoY"})


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

    districts = db.query(DistrictIntelligence).all()
    total_districts = len(districts)
    critical_count = len([d for d in districts if d.status == 'CRITICAL_SHORTAGE'])
    moderate_count = len([d for d in districts if d.status in ['MODERATE', 'HIGH_DEMAND']])
    low_count = len([d for d in districts if d.status in ['BALANCED', 'OVERSUPPLY']])
    
    declining_skills_db = db.query(Skill).filter(Skill.trend == 'DECLINING').limit(6).all()
    declining_skills_list = [
        {
            "name": s.name,
            # Decline % derived from demand_score: lower score = steeper decline
            # Score 0-40 → -80% to -60%, Score 40-60 → -60% to -40%, Score 60+ → -40% to -20%
            "decline": f"-{max(20, min(80, int((1 - (s.demand_score or 40) / 100) * 100)))}% YoY",
            "issue": "Curriculum Sunset",
            "status": f"Reallocate capacity from {s.name}"
        }
        for s in declining_skills_db
    ]

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
        "declining_skills": declining_skills_list,
        "domain_stats": domain_stats,
        "district_summary": {
            "total_districts": total_districts,
            "critical_shortage_count": critical_count,
            "moderate_gap_count": moderate_count,
            "low_gap_count": low_count,
        }
    }

# ─── Districts ────────────────────────────────────────────────────────────────
@router.get('/districts')
def get_district_intelligence(
    state: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from app.services.ingestion_service import ensure_district_intelligence
    ensure_district_intelligence(db)
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

@router.get('/districts/{district_id}/ai-strategy')
def get_district_ai_strategy(district_id: int, db: Session = Depends(get_db)):
    d = db.query(DistrictIntelligence).filter(DistrictIntelligence.id == district_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="District intelligence record not found")
    
    from app.models.entities import Job
    from app.services.ai_service import generate_ai_district_strategy

    active_job_count = db.query(Job).filter(
        Job.city.ilike(d.district), Job.state == "Maharashtra", Job.is_active == True
    ).count()

    strategy = generate_ai_district_strategy(
        district=d.district,
        primary_sector=d.primary_sector or "General Engineering",
        current_capacity=d.current_capacity or 10000,
        recommended_seats=d.recommended_seats or 10000,
        shortage_deficit=d.shortage_deficit or 0,
        top_skill=d.top_demand_skill or "Python",
        job_count=active_job_count,
        demand_index=d.demand_index or 80.0,
    )

    return {
        "district": d.district,
        "state": d.state,
        "primary_sector": d.primary_sector,
        "current_capacity": d.current_capacity,
        "recommended_seats": d.recommended_seats,
        "shortage_deficit": d.shortage_deficit,
        "top_demand_skill": d.top_demand_skill,
        "demand_index": d.demand_index,
        "active_jobs_count": active_job_count,
        "ai_strategy": strategy
    }

# ─── Skills (Admin CRUD) ─────────────────────────────────────────────────────

class SkillCreate(BaseModel):
    name: str
    domain: str
    description: Optional[str] = None
    demand_score: Optional[float] = 70.0
    median_salary: Optional[int] = 600000
    trend: Optional[str] = "RISING"

class SkillUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    description: Optional[str] = None
    demand_score: Optional[float] = None
    median_salary: Optional[int] = None
    trend: Optional[str] = None

@router.get('/skills')
def get_admin_skills(
    search: Optional[str] = None,
    domain: Optional[str] = None,
    trend: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from app.models.entities import JobSkill
    query = db.query(Skill)
    if search:
        query = query.filter(Skill.name.ilike(f'%{search}%'))
    if domain and domain != 'ALL':
        query = query.filter(Skill.domain == domain)
    if trend and trend != 'ALL':
        query = query.filter(Skill.trend == trend)
    skills = query.order_by(desc(Skill.demand_score)).all()
    result = []
    for s in skills:
        job_count = db.query(JobSkill).filter(JobSkill.skill_id == s.id).count()
        result.append({
            "id": s.id,
            "name": s.name,
            "domain": s.domain,
            "description": s.description,
            "demand_score": s.demand_score,
            "median_salary": s.median_salary,
            "total_openings": s.total_openings or job_count,
            "trend": s.trend,
            "job_count": job_count,
        })
    domains = sorted(set(s["domain"] for s in result if s["domain"]))
    return {"skills": result, "total": len(result), "domains": domains}

@router.post('/skills')
def create_admin_skill(skill_in: SkillCreate, db: Session = Depends(get_db)):
    existing = db.query(Skill).filter(Skill.name == skill_in.name.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Skill '{skill_in.name}' already exists")
    valid_trends = {"HOT", "RISING", "STABLE", "DECLINING"}
    trend = (skill_in.trend or "RISING").upper()
    if trend not in valid_trends:
        raise HTTPException(status_code=400, detail=f"Trend must be one of: {', '.join(valid_trends)}")
    new_skill = Skill(
        name=skill_in.name.strip(),
        domain=skill_in.domain.strip(),
        description=skill_in.description or f"Industry skill in {skill_in.domain}",
        demand_score=min(100.0, max(0.0, skill_in.demand_score or 70.0)),
        median_salary=skill_in.median_salary or 600000,
        total_openings=0,
        trend=trend,
    )
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return {"skill": new_skill, "message": f"Skill '{new_skill.name}' created successfully"}

@router.put('/skills/{skill_id}')
def update_admin_skill(skill_id: int, skill_in: SkillUpdate, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    if skill_in.name is not None:
        dup = db.query(Skill).filter(Skill.name == skill_in.name.strip(), Skill.id != skill_id).first()
        if dup:
            raise HTTPException(status_code=400, detail=f"Skill '{skill_in.name}' already exists")
        skill.name = skill_in.name.strip()
    if skill_in.domain is not None:
        skill.domain = skill_in.domain.strip()
    if skill_in.description is not None:
        skill.description = skill_in.description
    if skill_in.demand_score is not None:
        skill.demand_score = min(100.0, max(0.0, skill_in.demand_score))
    if skill_in.median_salary is not None:
        skill.median_salary = skill_in.median_salary
    if skill_in.trend is not None:
        valid_trends = {"HOT", "RISING", "STABLE", "DECLINING"}
        trend = skill_in.trend.upper()
        if trend not in valid_trends:
            raise HTTPException(status_code=400, detail=f"Trend must be one of: {', '.join(valid_trends)}")
        skill.trend = trend
    db.commit()
    db.refresh(skill)
    return {"skill": skill, "message": f"Skill '{skill.name}' updated successfully"}

@router.delete('/skills/{skill_id}')
def delete_admin_skill(skill_id: int, db: Session = Depends(get_db)):
    from app.models.entities import JobSkill, SkillResource, QuizQuestion, StudentSkill
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    skill_name = skill.name
    # Remove all FK references first
    db.query(JobSkill).filter(JobSkill.skill_id == skill_id).delete()
    db.query(SkillResource).filter(SkillResource.skill_id == skill_id).delete()
    db.query(QuizQuestion).filter(QuizQuestion.skill_id == skill_id).delete()
    db.query(StudentSkill).filter(StudentSkill.skill_id == skill_id).delete()
    db.delete(skill)
    db.commit()
    return {"success": True, "message": f"Skill '{skill_name}' and all its references deleted"}

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
    industry_demand_alignment: Optional[float] = None
    related_job_roles: Optional[str] = None
    duration_weeks: Optional[int] = 12
    target_capacity: Optional[int] = 200
    placement_rate: Optional[float] = None
    employer_satisfaction: Optional[float] = None
    status: Optional[str] = "ACTIVE"
    ai_analysis: Optional[str] = None

class CourseStatusUpdate(BaseModel):
    status: str # ACTIVE, NOT_AVAILABLE, CAPACITY_FULL, OUTDATED
    is_outdated: Optional[bool] = None

@router.post('/courses')
def create_admin_course(course_in: CourseCreate, db: Session = Depends(get_db)):
    code = course_in.course_code.strip().upper()
    existing = db.query(Course).filter(Course.course_code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Course code '{code}' already exists")

    # Dynamic calculation of industry demand alignment based on live database skill demand
    computed_alignment = course_in.industry_demand_alignment
    skills_list = [s.strip() for s in course_in.skills_offered.split(',') if s.strip()]
    if computed_alignment is None or computed_alignment == 80.0:
        if skills_list:
            db_skills = db.query(Skill).filter(Skill.name.in_(skills_list)).all()
            if db_skills:
                computed_alignment = round(sum(s.demand_score or 70.0 for s in db_skills) / len(db_skills), 1)
            else:
                computed_alignment = 82.5
        else:
            computed_alignment = 80.0

    # Auto-generate curriculum intelligence analysis without mentioning AI
    analysis_text = course_in.ai_analysis
    if not analysis_text:
        analysis_text = f"Curriculum is aligned at {computed_alignment}% with current industry hiring trends in the {course_in.domain} sector. Covers core competencies: {course_in.skills_offered}."

    new_course = Course(
        course_code=code,
        title=course_in.title.strip(),
        description=course_in.description.strip(),
        domain=course_in.domain.strip(),
        depth_level=course_in.depth_level,
        skills_offered=course_in.skills_offered.strip(),
        industry_demand_alignment=computed_alignment,
        related_job_roles=course_in.related_job_roles or "",
        duration_weeks=course_in.duration_weeks or 12,
        target_capacity=course_in.target_capacity or 200,
        placement_rate=course_in.placement_rate, # Defaults to None for new courses
        employer_satisfaction=course_in.employer_satisfaction,
        status=course_in.status or "ACTIVE",
        ai_analysis=analysis_text,
        enrolled_count=0,
        is_outdated=False,
        is_oversupplied=False,
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

@router.put('/courses/{course_id}/status')
def update_course_status(course_id: int, payload: CourseStatusUpdate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    st = payload.status.upper()
    valid_statuses = {"ACTIVE", "NOT_AVAILABLE", "CAPACITY_FULL", "OUTDATED"}
    if st not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(valid_statuses)}")
    
    course.status = st
    if payload.is_outdated is not None:
        course.is_outdated = payload.is_outdated
    elif st == "OUTDATED":
        course.is_outdated = True
    elif st == "ACTIVE":
        course.is_outdated = False

    db.commit()
    db.refresh(course)
    return {"message": f"Course status updated to {course.status}", "course": course}

@router.delete('/courses/{course_id}')
def delete_admin_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    code = course.course_code
    title = course.title
    
    # Remove enrollments & student courses referencing this course
    db.query(CourseEnrollment).filter(CourseEnrollment.course_id == course_id).delete()
    from app.models.entities import StudentCourse
    db.query(StudentCourse).filter(StudentCourse.course_id == course_id).delete()
    
    # Also unassign from any trainers who have this course code
    trainers = db.query(Trainer).all()
    for t in trainers:
        if t.courses_assigned:
            c_list = [c.strip() for c in t.courses_assigned.split(',') if c.strip()]
            if code in c_list:
                c_list = [c for c in c_list if c != code]
                t.courses_assigned = ", ".join(c_list)
    
    db.delete(course)
    db.commit()
    return {"success": True, "message": f"Course '{code} - {title}' deleted successfully"}

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

class TrainerCoursesUpdate(BaseModel):
    courses_assigned: str # comma-separated course codes

@router.put('/trainers/{id}/courses')
def update_trainer_courses(id: int, payload: TrainerCoursesUpdate, db: Session = Depends(get_db)):
    trainer = db.query(Trainer).filter(Trainer.id == id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    # Validate and clean up course codes
    codes = [c.strip().upper() for c in payload.courses_assigned.split(',') if c.strip()]
    trainer.courses_assigned = ", ".join(codes)
    db.commit()
    db.refresh(trainer)
    return {
        "success": True,
        "message": f"Updated assigned courses for {trainer.name}",
        "trainer": trainer,
        "assigned_courses": codes
    }


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

# ─── Live Data Sync ───────────────────────────────────────────────────────────
@router.post('/sync-live-data')
def sync_live_data(db: Session = Depends(get_db)):
    """
    Triggers the real-world data ingestion pipeline:
    - Fetches live job postings from Remotive + Arbeitnow (Maharashtra-tagged)
    - Updates skill demand trends via GitHub Search API
    - Syncs Maharashtra district intelligence from MSDE/data.gov.in baseline
    """
    from app.services.ingestion_service import sync_all_telemetry
    results = sync_all_telemetry(db)
    return {
        "success": True,
        "message": f"Sync complete. {results.get('total_new_jobs', 0)} new jobs ingested, {results.get('skill_trends_updated', 0)} skill trends updated, {results.get('districts_synced', 0)} Maharashtra districts refreshed.",
        "details": results
    }

@router.post('/wipe-telemetry')
def wipe_telemetry_data(db: Session = Depends(get_db)):
    """
    Clears all ingested telemetry: jobs, skills, districts, courses, trainers, and settings.
    Preserves all User accounts (Admin, Students, Employers, Trainers).
    """
    from app.models.entities import (
        JobSkill, Job, QuizQuestion, SkillResource, StudentSkill, Skill,
        StudentCourse, CourseEnrollment, Course, CurriculumUpdate,
        DistrictIntelligence, Trainer, CandidateFeedback, IndustryConsultation,
        TrainingInstitute, SystemSetting
    )
    db.query(JobSkill).delete()
    db.query(Job).delete()
    db.query(QuizQuestion).delete()
    db.query(SkillResource).delete()
    db.query(StudentSkill).delete()
    db.query(Skill).delete()
    db.query(StudentCourse).delete()
    db.query(CourseEnrollment).delete()
    db.query(Course).delete()
    db.query(CurriculumUpdate).delete()
    db.query(DistrictIntelligence).delete()
    db.query(Trainer).delete()
    db.query(CandidateFeedback).delete()
    db.query(IndustryConsultation).delete()
    db.query(TrainingInstitute).delete()
    db.query(SystemSetting).delete()
    db.commit()
    return {
        "success": True,
        "message": "All telemetry, jobs, skills, and districts have been cleanly wiped. User accounts remain active."
    }


# ─── Data Freshness ───────────────────────────────────────────────────────────
@router.get('/last-sync')
def get_last_sync(db: Session = Depends(get_db)):
    """Returns when the data was last synced and how many hours ago that was."""
    from app.models.entities import SystemSetting
    setting = db.query(SystemSetting).filter(SystemSetting.key == "last_telemetry_sync").first()
    if not setting or not setting.value:
        return {"last_sync": None, "hours_ago": None, "never_synced": True}
    from datetime import datetime
    try:
        last_sync_dt = datetime.fromisoformat(setting.value)
        hours_ago = round((datetime.utcnow() - last_sync_dt).total_seconds() / 3600, 1)
        return {
            "last_sync": setting.value + "Z",
            "hours_ago": hours_ago,
            "never_synced": False
        }
    except Exception:
        return {"last_sync": None, "hours_ago": None, "never_synced": True}


# ─── Source & Freshness Statistics ───────────────────────────────────────────
@router.get('/source-stats')
def get_source_stats(db: Session = Depends(get_db)):
    """Returns job counts breakdown by ingestion source and active/expired status."""
    sources = db.query(
        Job.source,
        func.count(Job.id).label("total"),
        func.sum(func.case((Job.is_active == True, 1), else_=0)).label("active"),
        func.sum(func.case((Job.is_active == False, 1), else_=0)).label("expired")
    ).group_by(Job.source).all()

    breakdown = []
    total_active = 0
    total_expired = 0
    for s in sources:
        src_name = s.source or "manual"
        act = int(s.active or 0)
        exp = int(s.expired or 0)
        total_active += act
        total_expired += exp
        breakdown.append({
            "source": src_name,
            "total": int(s.total or 0),
            "active": act,
            "expired": exp
        })

    return {
        "sources": breakdown,
        "total_active": total_active,
        "total_expired": total_expired,
        "total_jobs": total_active + total_expired,
    }


# ─── Job Management (Admin) ───────────────────────────────────────────────────

@router.get('/jobs')
def get_admin_jobs(
    q: Optional[str] = None,
    source: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    per_page: int = 50,
    db: Session = Depends(get_db)
):
    """List all jobs with search + filter for admin review."""
    query = db.query(Job)
    if q:
        query = query.filter(
            (Job.title.ilike(f'%{q}%')) |
            (Job.company_name.ilike(f'%{q}%')) |
            (Job.description.ilike(f'%{q}%'))
        )
    if source:
        query = query.filter(Job.source == source)
    if is_active is not None:
        query = query.filter(Job.is_active == is_active)
    total = query.count()
    jobs = query.order_by(desc(Job.id)).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "jobs": [
            {
                "id": j.id,
                "title": j.title,
                "company_name": j.company_name,
                "source": j.source,
                "city": j.city,
                "sector": j.sector,
                "is_active": j.is_active,
                "last_seen_at": j.last_seen_at.isoformat() if j.last_seen_at else None,
                "apply_url": j.apply_url,
            }
            for j in jobs
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }


@router.delete('/jobs/{job_id}')
def delete_admin_job(job_id: int, db: Session = Depends(get_db)):
    """Permanently delete a job and all its associations from the database."""
    from app.models.entities import JobSkill, SavedJob
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    title = job.title
    # Remove FK references first
    db.query(JobSkill).filter(JobSkill.job_id == job_id).delete()
    try:
        db.query(SavedJob).filter(SavedJob.job_id == job_id).delete()
    except Exception:
        pass
    db.delete(job)
    db.commit()
    return {"success": True, "message": f"Job '{title}' permanently deleted"}


@router.patch('/jobs/{job_id}/deactivate')
def deactivate_admin_job(job_id: int, db: Session = Depends(get_db)):
    """Mark a job as inactive (soft-delete / expired) without removing it."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_active = False
    db.commit()
    return {"success": True, "message": f"Job '{job.title}' marked as inactive"}


@router.get('/students')
def list_students(q: str = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """List all students — usable by admin and employers for inbox/messaging search."""
    from app.models.entities import Student, StudentLocation, User
    query = db.query(Student, User).join(User, User.id == Student.user_id)
    if q:
        query = query.filter(
            (Student.full_name.ilike(f'%{q}%')) | (User.email.ilike(f'%{q}%'))
        )
    rows = query.limit(50).all()
    result = []
    for student, user in rows:
        loc = db.query(StudentLocation).filter(
            StudentLocation.student_id == student.id,
            StudentLocation.is_primary == True
        ).first()
        result.append({
            "user_id": user.id,
            "full_name": student.full_name or user.email.split('@')[0],
            "email": user.email,
            "city": loc.city if loc else None,
            "state": loc.state if loc else None,
        })
    return result
