from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional
from app.db.session import get_db
from app.models.entities import Job, JobSkill, Skill, Employer, SkillResource
from app.services.ai_service import haversine

router = APIRouter()

@router.get('/jobs')
def search_jobs(
    q: Optional[str] = None, skill_ids: Optional[str] = None, domain: Optional[str] = None,
    city: Optional[str] = None, state: Optional[str] = None, job_type: Optional[str] = None,
    lat: Optional[float] = None, lng: Optional[float] = None,
    page: int = 1, per_page: int = 20, db: Session = Depends(get_db)
):
    query = db.query(Job).filter(Job.is_active == True)
    
    if q:
        query = query.filter((Job.title.ilike(f'%{q}%')) | (Job.description.ilike(f'%{q}%')))
    if city:
        query = query.filter(Job.city == city)
    if job_type:
        query = query.filter(Job.job_type == job_type)
        
    jobs_all = query.all()
    results = []
    
    target_skills = [int(s) for s in skill_ids.split(',')] if skill_ids else []
    
    for j in jobs_all:
        req_skills = db.query(JobSkill).filter(JobSkill.job_id == j.id).all()
        if target_skills:
            rs_ids = [rs.skill_id for rs in req_skills]
            if not any(ts in rs_ids for ts in target_skills):
                continue
                
        dist = None
        if lat and lng and j.latitude and j.longitude:
            dist = haversine(lat, lng, j.latitude, j.longitude)
            
        emp = db.query(Employer).filter(Employer.id == j.employer_id).first()
        skill_objs = []
        for rs in req_skills:
            sk = db.query(Skill).filter(Skill.id == rs.skill_id).first()
            if sk:
                skill_objs.append({"id": sk.id, "name": sk.name, "is_required": rs.is_required})
                
        results.append({
            "id": j.id,
            "title": j.title,
            "description": j.description,
            "company_name": emp.company_name if emp else "Industry Partner",
            "city": j.city,
            "state": j.state,
            "job_type": j.job_type,
            "proficiency_required": j.proficiency_required,
            "experience_years": j.experience_years,
            "salary_min": j.salary_min or 450000,
            "salary_max": j.salary_max or 950000,
            "openings_count": j.openings_count or 1,
            "sector": j.sector,
            "required_skills": skill_objs,
            "distance": dist,
            "job": j
        })
        
    if lat and lng:
        results.sort(key=lambda x: x["distance"] if x["distance"] is not None else float('inf'))
    else:
        results.sort(key=lambda x: x["id"], reverse=True)
        
    start = (page - 1) * per_page
    return results[start:start+per_page]

@router.get('/jobs/count')
def job_count(db: Session = Depends(get_db)):
    total = db.query(Job).filter(Job.is_active == True).count()
    by_city = db.query(Job.city, func.count(Job.id)).filter(Job.is_active == True).group_by(Job.city).all()
    return {"total_india": total, "by_city": [{"city": c[0], "count": c[1]} for c in by_city]}

@router.get('/jobs/{job_id}')
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    emp = db.query(Employer).filter(Employer.id == job.employer_id).first()
    skills = db.query(JobSkill).filter(JobSkill.job_id == job_id).all()
    resources = []
    for s in skills:
        resources.extend(db.query(SkillResource).filter(SkillResource.skill_id == s.skill_id).all())
    return {"job": job, "employer": emp, "required_skills": skills, "resources": resources}
