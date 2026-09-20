from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import (
    User, Student, StudentLocation, StudentEducation, StudentSkill, StudentInterest,
    StudentResume, Job, JobSkill, Skill, Course, StudentCourse, StudentCertificate
)
from app.api.deps import get_current_user
from pydantic import BaseModel
from typing import List, Optional, Union
from app.services.ai_service import recommend_jobs, resume_parse
import datetime

router = APIRouter()

def get_student(current_user: User, db: Session):
    if current_user.role != 'STUDENT':
        raise HTTPException(status_code=403, detail="Not a student")
    stu = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not stu:
        # Auto-create basic profile if missing
        stu = Student(user_id=current_user.id, full_name=current_user.email.split('@')[0], profile_complete_pct=30.0)
        db.add(stu)
        db.commit()
    return stu

@router.get('/profile')
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = get_student(current_user, db)
    locations = db.query(StudentLocation).filter(StudentLocation.student_id == stu.id).order_by(StudentLocation.display_order).all()
    education = db.query(StudentEducation).filter(StudentEducation.student_id == stu.id).all()
    
    # Enrich skills with skill details
    student_skills = db.query(StudentSkill).filter(StudentSkill.student_id == stu.id).all()
    enriched_skills = []
    for ss in student_skills:
        sk = db.query(Skill).filter(Skill.id == ss.skill_id).first()
        if sk:
            enriched_skills.append({
                "id": ss.id,
                "skill_id": sk.id,
                "name": sk.name,
                "domain": sk.domain,
                "proficiency": ss.proficiency,
                "demand_score": sk.demand_score
            })
            
    interests = db.query(StudentInterest).filter(StudentInterest.student_id == stu.id).all()
    resume = db.query(StudentResume).filter(StudentResume.student_id == stu.id).first()
    
    # Completed Government Courses
    student_courses = db.query(StudentCourse).filter(StudentCourse.student_id == stu.id).all()
    enriched_courses = []
    for sc in student_courses:
        c = db.query(Course).filter(Course.id == sc.course_id).first()
        if c:
            enriched_courses.append({
                "id": sc.id,
                "course_id": c.id,
                "course_code": c.course_code,
                "title": c.title,
                "domain": c.domain,
                "depth_level": c.depth_level,
                "completion_date": sc.completion_date,
                "grade": sc.grade,
                "gained_skills": sc.gained_skills
            })
            
    # Certifications
    certificates = db.query(StudentCertificate).filter(StudentCertificate.student_id == stu.id).all()
    
    return {
        "profile": stu,
        "locations": locations,
        "education": education,
        "skills": enriched_skills,
        "interests": [i.domain for i in interests],
        "resume": resume,
        "completed_courses": enriched_courses,
        "certificates": certificates
    }

class ProfileUpdate(BaseModel):
    full_name: str
    email: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None

@router.put('/profile')
def update_profile(req: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = get_student(current_user, db)
    stu.full_name = req.full_name
    if req.dob is not None: stu.dob = req.dob
    if req.gender is not None: stu.gender = req.gender
    if req.phone is not None: stu.phone = req.phone
    if req.linkedin_url is not None: stu.linkedin_url = req.linkedin_url
    if req.github_url is not None: stu.github_url = req.github_url
    if req.email:
        stu.email = req.email
        current_user.email = req.email
    db.commit()
    return {"status": "updated", "profile": stu}

class LocationItem(BaseModel):
    city: str
    state: str
    pincode: str
    is_primary: bool
    display_order: int

@router.post('/locations')
def update_locations(req: List[LocationItem], current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = get_student(current_user, db)
    db.query(StudentLocation).filter(StudentLocation.student_id == stu.id).delete()
    
    coords = {
        'pune': (18.5204, 73.8567),
        'mumbai': (19.0760, 72.8777),
        'bengaluru': (12.9716, 77.5946),
        'chennai': (13.0827, 80.2707),
        'delhi': (28.6139, 77.2090),
        'gurugram': (28.4595, 77.0266),
        'ahmedabad': (23.0225, 72.5714),
        'hyderabad': (17.3850, 78.4867)
    }
    
    for item in req:
        lat, lng = coords.get(item.city.strip().lower(), (20.5937, 78.9629))
        db.add(StudentLocation(
            student_id=stu.id, city=item.city, state=item.state, pincode=item.pincode,
            latitude=lat, longitude=lng, is_primary=item.is_primary, display_order=item.display_order
        ))
    db.commit()
    return {"status": "updated"}

class EducationItem(BaseModel):
    id: Optional[int] = None
    degree: str
    field_of_study: Optional[str] = "General"
    institution: str
    graduation_year: Optional[int] = 2024

@router.post('/education')
def update_education(req: Union[EducationItem, List[EducationItem]], current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = get_student(current_user, db)
    if isinstance(req, list):
        db.query(StudentEducation).filter(StudentEducation.student_id == stu.id).delete()
        for item in req:
            if item.degree or item.institution:
                db.add(StudentEducation(
                    student_id=stu.id,
                    degree=item.degree or 'Degree',
                    field_of_study=item.field_of_study or 'General',
                    institution=item.institution or 'Institute',
                    graduation_year=item.graduation_year or 2024
                ))
    else:
        db.add(StudentEducation(
            student_id=stu.id,
            degree=req.degree or 'Degree',
            field_of_study=req.field_of_study or 'General',
            institution=req.institution or 'Institute',
            graduation_year=req.graduation_year or 2024
        ))
    db.commit()
    all_edus = db.query(StudentEducation).filter(StudentEducation.student_id == stu.id).all()
    return {"status": "saved", "education": all_edus}

@router.delete('/education/{edu_id}')
def delete_education(edu_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = get_student(current_user, db)
    db.query(StudentEducation).filter(StudentEducation.id == edu_id, StudentEducation.student_id == stu.id).delete()
    db.commit()
    return {"status": "deleted"}

class SkillItem(BaseModel):
    skill_id: Optional[int] = None
    skill_name: Optional[str] = None
    proficiency: Optional[str] = "INTERMEDIATE"

@router.post('/skills')
def update_skills(req: List[SkillItem], current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = get_student(current_user, db)
    db.query(StudentSkill).filter(StudentSkill.student_id == stu.id).delete()
    added_ids = set()
    for item in req:
        target_id = item.skill_id
        if not target_id and item.skill_name:
            clean = item.skill_name.strip()
            if clean:
                sk = db.query(Skill).filter(func.lower(Skill.name) == clean.lower()).first()
                if not sk:
                    sk = Skill(name=clean, domain="Technical", demand_score=75.0, total_openings=1, trend="RISING")
                    db.add(sk)
                    db.flush()
                target_id = sk.id
        if target_id and target_id not in added_ids:
            db.add(StudentSkill(student_id=stu.id, skill_id=target_id, proficiency=item.proficiency or "INTERMEDIATE"))
            added_ids.add(target_id)
    stu.profile_complete_pct = min(100.0, stu.profile_complete_pct + 10.0)
    db.commit()
    return {"status": "updated", "skills_count": len(added_ids)}

@router.post('/interests')
def update_interests(domains: List[str], current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = get_student(current_user, db)
    db.query(StudentInterest).filter(StudentInterest.student_id == stu.id).delete()
    for d in domains:
        db.add(StudentInterest(student_id=stu.id, domain=d))
    db.commit()
    return {"status": "updated"}

class CourseCompleteReq(BaseModel):
    course_code: str
    grade: Optional[str] = "Certified (A)"
    completion_date: Optional[str] = None

@router.post('/courses/complete')
def complete_course(req: CourseCompleteReq, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = get_student(current_user, db)
    course = db.query(Course).filter(Course.course_code == req.course_code).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    existing = db.query(StudentCourse).filter(StudentCourse.student_id == stu.id, StudentCourse.course_id == course.id).first()
    date_str = req.completion_date or datetime.date.today().strftime("%Y-%m-%d")
    
    if existing:
        existing.grade = req.grade
        existing.completion_date = date_str
    else:
        sc = StudentCourse(
            student_id=stu.id, course_id=course.id, completion_date=date_str,
            grade=req.grade, gained_skills=course.skills_offered
        )
        db.add(sc)
    
    db.commit()
    # Trigger AI skill sync automatically
    sync_all_skills_internal(stu.id, db)
    return {"status": "course_completed", "course": course.title, "gained_skills": course.skills_offered}

class CertificateItem(BaseModel):
    title: str
    issuer: str
    issue_date: str
    credential_id: str
    credential_url: Optional[str] = ""
    gained_skills: str

@router.post('/certificates')
def add_certificate(req: CertificateItem, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = get_student(current_user, db)
    cert = StudentCertificate(
        student_id=stu.id, title=req.title, issuer=req.issuer, issue_date=req.issue_date,
        credential_id=req.credential_id, credential_url=req.credential_url, gained_skills=req.gained_skills
    )
    db.add(cert)
    db.commit()
    sync_all_skills_internal(stu.id, db)
    return {"status": "certificate_added"}

def sync_all_skills_internal(student_id: int, db: Session):
    """AI engine automatically combines all skills from completed courses, certificates, resume, and self-additions"""
    courses = db.query(StudentCourse).filter(StudentCourse.student_id == student_id).all()
    certs = db.query(StudentCertificate).filter(StudentCertificate.student_id == student_id).all()
    resume = db.query(StudentResume).filter(StudentResume.student_id == student_id).first()
    
    all_gained = set()
    for c in courses:
        if c.gained_skills:
            for s in c.gained_skills.split(','):
                if s.strip():
                    all_gained.add(s.strip())
                
    for cr in certs:
        if cr.gained_skills:
            for s in cr.gained_skills.split(','):
                if s.strip():
                    all_gained.add(s.strip())
                
    existing_skills = {ss.skill_id for ss in db.query(StudentSkill).filter(StudentSkill.student_id == student_id).all()}
    
    for skill_name in all_gained:
        clean = skill_name.strip()
        if not clean:
            continue
        sk = db.query(Skill).filter(func.lower(Skill.name) == clean.lower()).first()
        if not sk:
            sk = Skill(name=clean, domain="Technical", demand_score=75.0, total_openings=1, trend="RISING")
            db.add(sk)
            db.flush()
        if sk.id not in existing_skills:
            db.add(StudentSkill(student_id=student_id, skill_id=sk.id, proficiency="INTERMEDIATE"))
            existing_skills.add(sk.id)
            
    # Also extract skills from uploaded resume if available
    if resume and resume.raw_text:
        extracted = resume_parse(resume.raw_text, db)
        for sk_id in extracted.get("skills", []):
            if sk_id not in existing_skills:
                db.add(StudentSkill(student_id=student_id, skill_id=sk_id, proficiency="INTERMEDIATE"))
                existing_skills.add(sk_id)

    db.commit()

@router.post('/sync-skills')
def trigger_skill_sync(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = get_student(current_user, db)
    sync_all_skills_internal(stu.id, db)
    
    updated_skills = db.query(StudentSkill).filter(StudentSkill.student_id == stu.id).all()
    return {"status": "skills_synchronized", "total_skills_count": len(updated_skills)}

@router.get('/recommended-jobs')
def get_recommended(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = get_student(current_user, db)
    return recommend_jobs(stu.id, db)

@router.post('/resume/parse')
async def parse_resume(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = get_student(current_user, db)
    content = await file.read()
    text = content.decode('utf-8', errors='ignore')
    
    res = db.query(StudentResume).filter(StudentResume.student_id == stu.id).first()
    if not res:
        res = StudentResume(student_id=stu.id)
        db.add(res)
    res.raw_text = text
    res.parsed_at = datetime.datetime.utcnow()
    db.commit()
    
    extracted = resume_parse(text, db)
    
    # Automatically persist parsed skills into StudentSkill table
    if extracted.get("skills"):
        existing_skills = {ss.skill_id for ss in db.query(StudentSkill).filter(StudentSkill.student_id == stu.id).all()}
        added_count = 0
        for sk_id in extracted["skills"]:
            if sk_id not in existing_skills:
                db.add(StudentSkill(student_id=stu.id, skill_id=sk_id, proficiency="INTERMEDIATE"))
                existing_skills.add(sk_id)
                added_count += 1
        if added_count > 0:
            stu.profile_complete_pct = min(100.0, stu.profile_complete_pct + 10.0)
            db.commit()

    return extracted

@router.get('/skill-gap/{job_id}')
def skill_gap(job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stu = get_student(current_user, db)
    stu_skills = {s.skill_id for s in db.query(StudentSkill).filter(StudentSkill.student_id == stu.id).all()}
    req_skills = db.query(JobSkill).filter(JobSkill.job_id == job_id).all()
    
    matched = []
    missing = []
    for rs in req_skills:
        skill = db.query(Skill).filter(Skill.id == rs.skill_id).first()
        if skill:
            if rs.skill_id in stu_skills:
                matched.append({"id": skill.id, "name": skill.name})
            else:
                missing.append({"id": skill.id, "name": skill.name})
                
    match_pct = (len(matched) / len(req_skills)) * 100 if req_skills else 100
    return {"matched_skills": matched, "missing_skills": missing, "match_pct": round(match_pct, 1)}
