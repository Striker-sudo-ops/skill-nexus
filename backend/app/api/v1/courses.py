from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.models.entities import Course, Job, JobSkill, Skill, CourseEnrollment, Student
from app.api.deps import get_current_user
from app.models.entities import User

router = APIRouter()

@router.get('')
def get_courses(domain: Optional[str] = None, depth: Optional[str] = None, q: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Course)
    if domain and domain != 'ALL':
        query = query.filter(Course.domain == domain)
    if depth and depth != 'ALL':
        query = query.filter(Course.depth_level == depth)
    if q:
        query = query.filter(or_(Course.title.ilike(f"%{q}%"), Course.skills_offered.ilike(f"%{q}%"), Course.course_code.ilike(f"%{q}%")))
    return query.order_by(desc(Course.industry_demand_alignment)).all()

@router.get('/{id}')
def get_course_detail(id: str, db: Session = Depends(get_db)):
    course = None
    if id.isdigit():
        course = db.query(Course).filter(Course.id == int(id)).first()
    if not course:
        course = db.query(Course).filter(Course.course_code == id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    skills_list = [s.strip() for s in (course.skills_offered or '').split(',') if s.strip()]
    matched_skills = db.query(Skill).filter(Skill.name.in_(skills_list)).all()
    skill_ids = [s.id for s in matched_skills]
    matching_jobs = []
    if skill_ids:
        job_skills = db.query(JobSkill).filter(JobSkill.skill_id.in_(skill_ids)).all()
        job_ids = list(set([js.job_id for js in job_skills]))
        jobs = db.query(Job).filter(Job.id.in_(job_ids), Job.is_active == True).limit(6).all()
        matching_jobs = [
            {"id": j.id, "title": j.title, "city": j.city, "state": j.state,
             "salary_min": j.salary_min, "salary_max": j.salary_max,
             "job_type": j.job_type, "proficiency_required": j.proficiency_required}
            for j in jobs
        ]

    return {
        "course": {
            "id": course.id,
            "course_code": course.course_code,
            "title": course.title,
            "description": course.description,
            "domain": course.domain,
            "depth_level": course.depth_level,
            "skills_offered": course.skills_offered,
            "industry_demand_alignment": course.industry_demand_alignment,
            "related_job_roles": course.related_job_roles,
            "duration_weeks": course.duration_weeks,
            "enrolled_count": course.enrolled_count,
            "target_capacity": course.target_capacity,
            "placement_rate": course.placement_rate,
            "employer_satisfaction": course.employer_satisfaction,
            "is_outdated": course.is_outdated,
            "is_oversupplied": course.is_oversupplied,
            "ai_analysis": course.ai_analysis,
        },
        "skills_list": skills_list,
        "matching_jobs": matching_jobs,
    }

class EnrollReq(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    dob: Optional[str] = None
    education: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    motivation: Optional[str] = None

@router.post('/{id}/enroll')
def enroll_course(id: str, req: EnrollReq, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = None
    if id.isdigit():
        course = db.query(Course).filter(Course.id == int(id)).first()
    if not course:
        course = db.query(Course).filter(Course.course_code == id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    student_id = None
    if current_user.role == 'STUDENT':
        stu = db.query(Student).filter(Student.user_id == current_user.id).first()
        if stu:
            student_id = stu.id
            # Check already enrolled
            existing = db.query(CourseEnrollment).filter(
                CourseEnrollment.course_id == course.id,
                CourseEnrollment.student_id == stu.id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="You are already enrolled in this course")

    enrollment = CourseEnrollment(
        course_id=course.id,
        student_id=student_id,
        full_name=req.full_name,
        email=req.email,
        phone=req.phone,
        dob=req.dob,
        education=req.education,
        city=req.city,
        state=req.state,
        motivation=req.motivation,
        status='PENDING',
    )
    db.add(enrollment)
    # Increment enrolled count
    course.enrolled_count = (course.enrolled_count or 0) + 1
    db.commit()
    return {"message": "Enrollment submitted successfully", "enrollment_id": enrollment.id, "status": "PENDING"}

@router.get('/{id}/my-enrollment')
def get_my_enrollment(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'STUDENT':
        return {"enrolled": False}
    stu = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not stu:
        return {"enrolled": False}
    course = None
    if id.isdigit():
        course = db.query(Course).filter(Course.id == int(id)).first()
    if not course:
        course = db.query(Course).filter(Course.course_code.ilike(id)).first()
    if not course:
        return {"enrolled": False}
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == course.id,
        CourseEnrollment.student_id == stu.id
    ).first()
    if enrollment:
        return {"enrolled": True, "status": enrollment.status, "enrollment_id": enrollment.id}
    return {"enrolled": False}
