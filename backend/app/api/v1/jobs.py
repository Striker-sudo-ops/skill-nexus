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
    sector: Optional[str] = None,
    experience_min: Optional[int] = None, experience_max: Optional[int] = None,
    salary_min: Optional[int] = None, salary_max: Optional[int] = None,
    lat: Optional[float] = None, lng: Optional[float] = None,
    page: int = 1, per_page: int = 20, db: Session = Depends(get_db)
):
    query = db.query(Job).filter(Job.is_active == True)

    if q:
        query = query.filter((Job.title.ilike(f'%{q}%')) | (Job.description.ilike(f'%{q}%')) | (Job.company_name.ilike(f'%{q}%')))
    if city:
        query = query.filter(Job.city.ilike(f'%{city}%'))
    if state:
        query = query.filter(Job.state.ilike(f'%{state}%'))
    if job_type:
        query = query.filter(Job.job_type == job_type)
    if sector:
        query = query.filter(Job.sector.ilike(f'%{sector}%'))
    if experience_min is not None:
        query = query.filter(Job.experience_years >= experience_min)
    if experience_max is not None:
        query = query.filter(Job.experience_years <= experience_max)
    if salary_min is not None:
        query = query.filter(Job.salary_min >= salary_min)
    if salary_max is not None:
        query = query.filter(Job.salary_max <= salary_max)

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
            "company_name": j.company_name or (emp.company_name if emp else None) or "Industry Partner",
            "apply_url": j.apply_url,
            "city": j.city,
            "state": j.state,
            "job_type": j.job_type,
            "proficiency_required": j.proficiency_required,
            "experience_years": j.experience_years,
            "salary_min": j.salary_min or 450000,
            "salary_max": j.salary_max or 950000,
            "openings_count": j.openings_count or 1,
            "sector": j.sector,
            "source": j.source,
            "last_seen_at": j.last_seen_at.isoformat() if j.last_seen_at else None,
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
    if not job:
        return {"job": None, "employer": None, "company_name": None, "required_skills": [], "resources": []}
    emp = db.query(Employer).filter(Employer.id == job.employer_id).first()
    resolved_company = job.company_name or (emp.company_name if emp else None) or "Industry Partner"
    skills = db.query(JobSkill).filter(JobSkill.job_id == job_id).all()
    resources = []
    for s in skills:
        resources.extend(db.query(SkillResource).filter(SkillResource.skill_id == s.skill_id).all())
    return {"job": job, "employer": emp, "company_name": resolved_company, "apply_url": job.apply_url, "required_skills": skills, "resources": resources}
