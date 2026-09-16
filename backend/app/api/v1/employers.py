from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.models.entities import (
    User, Employer, Job, JobSkill, Skill, Student, StudentSkill,
    StudentEducation, StudentLocation, StudentCourse, Course,
    CandidateFeedback, IndustryConsultation, TrainingInstitute
)
from app.api.deps import get_current_user

router = APIRouter()

def get_employer(current_user: User, db: Session):
    if current_user.role != 'EMPLOYER':
        raise HTTPException(status_code=403, detail="Not an employer")
    emp = db.query(Employer).filter(Employer.user_id == current_user.id).first()
    if not emp:
        emp = Employer(user_id=current_user.id, company_name=current_user.email.split('@')[0], industry="Technology", city="Pune", state="Maharashtra")
        db.add(emp)
        db.commit()
    return emp

@router.get('/profile')
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = get_employer(current_user, db)
    return emp

class EmployerProfileUpdate(BaseModel):
    company_name: str
    industry: str
    sector: Optional[str] = None
    website: Optional[str] = None
    city: str
    state: str
    description: Optional[str] = None

@router.put('/profile')
def update_profile(req: EmployerProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = get_employer(current_user, db)
    emp.company_name = req.company_name
    emp.industry = req.industry
    if req.sector: emp.sector = req.sector
    if req.website: emp.website = req.website
    emp.city = req.city
    emp.state = req.state
    if req.description: emp.description = req.description
    db.commit()
    return {"status": "updated", "employer": emp}

@router.get('/jobs')
def get_my_jobs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = get_employer(current_user, db)
    jobs = db.query(Job).filter(Job.employer_id == emp.id).order_by(desc(Job.created_at)).all()
    
    enriched = []
    for j in jobs:
        req_skills = db.query(JobSkill).filter(JobSkill.job_id == j.id).all()
        skills = [db.query(Skill).filter(Skill.id == rs.skill_id).first().name for rs in req_skills if db.query(Skill).filter(Skill.id == rs.skill_id).first()]
        enriched.append({
            "id": j.id,
            "title": j.title,
            "description": j.description,
            "sector": j.sector,
            "job_type": j.job_type,
            "proficiency_required": j.proficiency_required,
            "experience_years": j.experience_years,
            "salary_min": j.salary_min,
            "salary_max": j.salary_max,
            "openings_count": j.openings_count,
            "city": j.city,
            "state": j.state,
            "is_active": j.is_active,
            "skills": skills
        })
    return enriched

class JobSkillItem(BaseModel):
    skill_id: int
    is_required: bool = True

class JobCreateReq(BaseModel):
    title: str
    description: str
    sector: Optional[str] = "Technology"
    job_type: str = "FULL_TIME"
    proficiency_required: str = "INTERMEDIATE" # BEGINNER, INTERMEDIATE, ADVANCED
    experience_years: int = 1
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    openings_count: int = 1
    city: str
    state: str
    skills: List[JobSkillItem] = []

@router.post('/jobs')
def create_job(req: JobCreateReq, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = get_employer(current_user, db)
    j = Job(
        employer_id=emp.id,
        title=req.title,
        description=req.description,
        sector=req.sector,
        job_type=req.job_type,
        proficiency_required=req.proficiency_required,
        experience_years=req.experience_years,
        salary_min=req.salary_min,
        salary_max=req.salary_max,
        openings_count=req.openings_count,
        city=req.city,
        state=req.state,
        is_active=True
    )
    db.add(j)
    db.commit()
    
    for s in req.skills:
        db.add(JobSkill(job_id=j.id, skill_id=s.skill_id, is_required=s.is_required))
    db.commit()
    return {"status": "created", "job_id": j.id}

@router.put('/jobs/{id}')
def update_job(id: int, req: JobCreateReq, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = get_employer(current_user, db)
    j = db.query(Job).filter(Job.id == id, Job.employer_id == emp.id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Job not found")
    
    j.title = req.title
    j.description = req.description
    j.sector = req.sector
    j.job_type = req.job_type
    j.proficiency_required = req.proficiency_required
    j.experience_years = req.experience_years
    j.salary_min = req.salary_min
    j.salary_max = req.salary_max
    j.openings_count = req.openings_count
    j.city = req.city
    j.state = req.state
    
    if req.skills:
        db.query(JobSkill).filter(JobSkill.job_id == j.id).delete()
        for s in req.skills:
            db.add(JobSkill(job_id=j.id, skill_id=s.skill_id, is_required=s.is_required))
            
    db.commit()
    return {"status": "updated", "id": j.id}

@router.delete('/jobs/{id}')
def delete_job(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = get_employer(current_user, db)
    j = db.query(Job).filter(Job.id == id, Job.employer_id == emp.id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Delete associated JobSkills first, then the job
    db.query(JobSkill).filter(JobSkill.job_id == j.id).delete()
    db.delete(j)
    db.commit()
    return {"status": "deleted", "id": id}

# Candidates Search for Employers
@router.get('/candidates')
def search_candidates(
    skill: Optional[str] = None,
    location: Optional[str] = None,
    proficiency: Optional[str] = None,
    db: Session = Depends(get_db)
):
    students = db.query(Student).all()
    results = []
    
    for stu in students:
        # Get location
        loc = db.query(StudentLocation).filter(StudentLocation.student_id == stu.id, StudentLocation.is_primary == True).first()
        loc_city = loc.city if loc else "India"
        
        # Get education
        edu = db.query(StudentEducation).filter(StudentEducation.student_id == stu.id).first()
        edu_str = f"{edu.degree} in {edu.field_of_study}, {edu.institution}" if edu else "Graduate"
        
        # Get skills
        stu_skills = db.query(StudentSkill).filter(StudentSkill.student_id == stu.id).all()
        skills_list = []
        has_skill_match = not skill or skill == 'ALL'
        has_prof_match = not proficiency or proficiency == 'ALL'
        
        for ss in stu_skills:
            sk = db.query(Skill).filter(Skill.id == ss.skill_id).first()
            if sk:
                skills_list.append({"name": sk.name, "proficiency": ss.proficiency})
                if skill and skill != 'ALL' and sk.name.lower() == skill.lower():
                    has_skill_match = True
                    if proficiency and proficiency != 'ALL' and ss.proficiency.upper() == proficiency.upper():
                        has_prof_match = True
                        
        # Filter by location if specified
        if location and location != 'ALL' and location.lower() not in loc_city.lower():
            continue
            
        if has_skill_match and has_prof_match:
            # Completed courses
            completed = db.query(StudentCourse).filter(StudentCourse.student_id == stu.id).all()
            courses_str = ", ".join([db.query(Course).filter(Course.id == sc.course_id).first().course_code for sc in completed if db.query(Course).filter(Course.id == sc.course_id).first()])
            
            results.append({
                "id": stu.id,
                "full_name": stu.full_name,
                "location": loc_city,
                "education": edu_str,
                "skills": skills_list,
                "completed_courses": courses_str,
                "profile_complete_pct": stu.profile_complete_pct
            })
            
    return results

# Candidate Rating & Feedback
class CandidateFeedbackReq(BaseModel):
    candidate_name: str
    course_or_role: str
    rating: int # 1 to 5
    job_ready: bool
    missing_skills: Optional[str] = ""
    suggested_skills: Optional[str] = ""

@router.post('/feedback')
def submit_candidate_feedback(req: CandidateFeedbackReq, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = get_employer(current_user, db)
    fb = CandidateFeedback(
        employer_id=emp.id,
        candidate_name=req.candidate_name,
        course_or_role=req.course_or_role,
        rating=req.rating,
        job_ready=req.job_ready,
        missing_skills=req.missing_skills,
        suggested_skills=req.suggested_skills
    )
    db.add(fb)
    db.commit()
    return {"status": "feedback_recorded"}

@router.get('/feedback')
def get_feedbacks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = get_employer(current_user, db)
    feedbacks = db.query(CandidateFeedback).filter(CandidateFeedback.employer_id == emp.id).order_by(desc(CandidateFeedback.created_at)).all()
    return feedbacks

# Industry Consultation
class ConsultationReq(BaseModel):
    sector: str
    topic: str
    feedback_text: str
    priority: str = "MEDIUM"

@router.post('/consultations')
def submit_consultation(req: ConsultationReq, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = get_employer(current_user, db)
    con = IndustryConsultation(
        employer_id=emp.id,
        sector=req.sector,
        topic=req.topic,
        feedback_text=req.feedback_text,
        priority=req.priority
    )
    db.add(con)
    db.commit()
    return {"status": "consultation_submitted"}

@router.get('/consultations')
def get_consultations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = get_employer(current_user, db)
    return db.query(IndustryConsultation).filter(IndustryConsultation.employer_id == emp.id).all()

# Training Institutes Directory
@router.get('/training-institutes')
def get_training_institutes(
    district: Optional[str] = None,
    domain: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TrainingInstitute)
    if district and district != 'ALL':
        query = query.filter(TrainingInstitute.district == district)
    if domain and domain != 'ALL':
        query = query.filter(TrainingInstitute.focus_domain.ilike(f"%{domain}%"))
    return query.all()
