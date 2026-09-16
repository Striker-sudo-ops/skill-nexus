from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from app.db.session import get_db
from app.models.entities import Skill, SkillResource, JobSkill, Job, QuizQuestion

router = APIRouter()

@router.get('/skills')
def get_skills(domain: Optional[str] = None, search: Optional[str] = None, sort: str = 'demand', db: Session = Depends(get_db)):
    q = db.query(Skill)
    if domain:
        q = q.filter(Skill.domain == domain)
    if search:
        q = q.filter(Skill.name.ilike(f'%{search}%'))
        
    if sort == 'salary':
        q = q.order_by(desc(Skill.median_salary))
    elif sort == 'openings':
        q = q.order_by(desc(Skill.total_openings))
    else:
        q = q.order_by(desc(Skill.demand_score))
        
    return q.all()

@router.get('/skills/domains')
def get_domains(db: Session = Depends(get_db)):
    return [r[0] for r in db.query(Skill.domain).distinct().all()]

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
