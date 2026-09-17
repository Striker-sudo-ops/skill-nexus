from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from app.db.session import get_db
from app.models.entities import Skill, SkillResource, JobSkill, Job, QuizQuestion

router = APIRouter()

@router.get('/skills')
def get_skills(
    domain: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = 'demand',
    db: Session = Depends(get_db)
):
    q = db.query(Skill)
    # category and domain are aliases — both map to Skill.domain
    filter_domain = category or domain
    if filter_domain:
        q = q.filter(Skill.domain == filter_domain)
    if search:
        q = q.filter(Skill.name.ilike(f'%{search}%'))

    if sort == 'salary':
        q = q.order_by(desc(Skill.median_salary))
    elif sort == 'openings':
        q = q.order_by(desc(Skill.total_openings))
    elif sort == 'growth':
        # HOT > RISING > STABLE > DECLINING — rank by trend then demand
        from sqlalchemy import case
        trend_order = case(
            (Skill.trend == 'HOT', 1),
            (Skill.trend == 'RISING', 2),
            (Skill.trend == 'STABLE', 3),
            else_=4
        )
        q = q.order_by(trend_order, desc(Skill.demand_score))
    else:
        q = q.order_by(desc(Skill.demand_score))

    skills = q.all()
    # Attach live job count per skill
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
    return result

@router.get('/skills/domains')
def get_domains(db: Session = Depends(get_db)):
    return [r[0] for r in db.query(Skill.domain).distinct().all() if r[0]]

@router.get('/skills/trending')
def trending(domain: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Skill)
    if domain:
        q = q.filter(Skill.domain == domain)
    return q.order_by(desc(Skill.demand_score)).limit(10).all()

@router.get('/skills/{skill_id}')
def get_skill(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    res = db.query(SkillResource).filter(SkillResource.skill_id == skill_id).all()
    qq_count = db.query(QuizQuestion).filter(QuizQuestion.skill_id == skill_id).count()
    jobs = db.query(Job).join(JobSkill).filter(JobSkill.skill_id == skill_id, Job.is_active == True).limit(5).all()
    return {"skill": skill, "resources": res, "jobs": jobs, "quiz_questions": qq_count}

